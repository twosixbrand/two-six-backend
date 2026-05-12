import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { CheckoutDto } from './dto/checkout.dto';

import { MailerService } from '@nestjs-modules/mailer';

import { ConfigService } from '@nestjs/config';
import { DianUblService, InvoiceDto } from '../dian/dian-ubl/dian-ubl.service';
import { DianSignerService } from '../dian/dian-signer/dian-signer.service';
import { DianCufeService } from '../dian/dian-cufe/dian-cufe.service';
import { DianSoapService } from '../dian/dian-soap/dian-soap.service';
import { DianPdfService } from '../dian/dian-pdf/dian-pdf.service';
import { DianEmailService } from '../dian/dian-email.service';
import { JournalAutoService } from '../accounting/journal/journal-auto.service';
import { WompiService } from '../wompi/wompi.service';

@Injectable()
export class OrderService {
  constructor(
    private prisma: PrismaService,
    private readonly mailerService: MailerService,
    private configService: ConfigService,
    private readonly ublService: DianUblService,
    private readonly signerService: DianSignerService,
    private readonly cufeService: DianCufeService,
    private readonly soapService: DianSoapService,
    private readonly pdfService: DianPdfService,
    private readonly dianEmailService: DianEmailService,
    private readonly journalAutoService: JournalAutoService,
    private readonly wompiService: WompiService,
  ) {}

  async validateDiscountCode(
    code: string,
    email: string,
    cartTotal: number = 0,
    itemCount: number = 0,
  ) {
    if (!code) throw new BadRequestException('Debes proporcionar un código');

    const cleanCode = code.trim().toUpperCase();

    // 1. Try to find the new dynamic Coupon
    const coupon = await this.prisma.coupon.findUnique({
      where: { code: cleanCode },
    });

    if (coupon) {
      if (!coupon.is_active)
        throw new BadRequestException('Esta campaña ha finalizado.');

      const now = new Date();
      if (now < coupon.valid_from || now > coupon.valid_until) {
        throw new BadRequestException(
          'El código no está vigente en esta fecha.',
        );
      }

      if (coupon.max_uses && coupon.current_uses >= coupon.max_uses) {
        throw new BadRequestException(
          'Este cupón ya alcanzó su límite máximo de usos.',
        );
      }

      if (
        coupon.min_purchase_amount &&
        cartTotal > 0 &&
        cartTotal < coupon.min_purchase_amount
      ) {
        throw new BadRequestException(
          `Este cupón requiere una compra mínima de $${coupon.min_purchase_amount.toLocaleString('es-CO')}`,
        );
      }

      if (
        coupon.min_items_count &&
        itemCount > 0 &&
        itemCount < coupon.min_items_count
      ) {
        throw new BadRequestException(
          `Este cupón requiere llevar un mínimo de ${coupon.min_items_count} prendas.`,
        );
      }

      if (coupon.is_single_use_per_client && email) {
        // Validate against CouponUsage to see if this customer already used it
        const customer = await this.prisma.customer.findFirst({
          where: { email: email.toLowerCase() },
        });

        if (customer) {
          const usage = await this.prisma.couponUsage.findFirst({
            where: { id_coupon: coupon.id, id_customer: customer.id },
          });
          if (usage) {
            throw new BadRequestException(
              'Ya has utilizado este cupón anteriormente.',
            );
          }
        }
      }

      return {
        valid: true,
        percentage: coupon.percentage,
        code: coupon.code,
        id: coupon.id,
        freeShipping: coupon.free_shipping,
      };
    }

    // 2. Fallback to older logic (Subscriber unique generated discounts)
    const subscriber = await this.prisma.subscriber.findUnique({
      where: { discount_code: cleanCode },
    });

    if (!subscriber) {
      throw new BadRequestException('El código de descuento no es válido');
    }

    if (subscriber.email.toLowerCase() !== email.toLowerCase()) {
      throw new BadRequestException(
        'Este código pertenece a otra cuenta de correo',
      );
    }

    if (!subscriber.status || subscriber.unsubscribed) {
      throw new BadRequestException('La suscripción no está activa');
    }

    if (subscriber.is_discount_used) {
      throw new BadRequestException(
        'Este código ya fue utilizado en un pedido anterior',
      );
    }

    return {
      valid: true,
      percentage: 10,
      code: subscriber.discount_code,
      freeShipping: false,
    };
  }

  async checkout(checkoutDto: CheckoutDto) {
    const {
      customer,
      items,
      total,
      shippingCost,
      paymentMethod,
      deliveryMethod,
    } = checkoutDto;

    const mapDianCodeToId = (code: string) => {
      switch (code) {
        case '13':
          return 1; // CC
        case '31':
          return 2; // NIT
        case '22':
          return 3; // CE
        case '41':
        case '42':
          return 4; // Pasaporte
        case '11':
        case '12':
          return 5; // TI
        default:
          return 1;
      }
    };
    const idIdentType = mapDianCodeToId(customer.document_type || '13');

    // We will override these later after validating with the DB
    const validMethods = ['WOMPI_COD', 'WOMPI_FULL', 'WOMPI_CC'];
    const method: string = (paymentMethod && validMethods.includes(paymentMethod)) ? paymentMethod : 'WOMPI_FULL';
    let codAmount = 0;

    const order = await this.prisma.$transaction(async (prisma) => {
      // 1. Find or Create Customer
      let customerRecord = await prisma.customer.findUnique({
        where: { document_number: customer.document_number },
      });

      if (!customerRecord) {
        customerRecord = await prisma.customer.create({
          data: {
            document_number: customer.document_number,
            name: customer.name,
            email: customer.email,
            current_phone_number: customer.phone,
            shipping_address:
              deliveryMethod === 'PICKUP' ? '' : customer.address || '',
            city: deliveryMethod === 'PICKUP' ? '' : customer.city || '',
            state: deliveryMethod === 'PICKUP' ? '' : customer.department || '',
            postal_code: '000000', // Default
            country: 'Colombia',
            responsable_for_vat: false,
            id_customer_type: 1, // Default: Natural
            id_identification_type: idIdentType,
          },
        });
      } else {
        // Update contact details
        await prisma.customer.update({
          where: { id: customerRecord.id },
          data: {
            name: customer.name,
            email: customer.email,
            id_identification_type: idIdentType,
            shipping_address:
              deliveryMethod === 'PICKUP' ? undefined : customer.address,
            city: deliveryMethod === 'PICKUP' ? undefined : customer.city,
            state:
              deliveryMethod === 'PICKUP' ? undefined : customer.department,
            current_phone_number: customer.phone,
          },
        });
      }

      // 2. Calculate Totals securely from Database
      const ivaRate = 0.19;
      let dbSubtotal = 0;
      const validatedItems: any[] = [];

      for (const item of items) {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
        });
        if (!product)
          throw new BadRequestException(
            `Producto con ID ${item.productId} no encontrado`,
          );

        dbSubtotal += product.price * item.quantity;

        // Override the frontend price with the real database price
        validatedItems.push({
          ...item,
          price: product.price,
        });
      }

      const iva = dbSubtotal * ivaRate;

      // Validate Shipping
      let dbShippingCost = shippingCost;
      if (deliveryMethod === 'PICKUP' || dbSubtotal >= 150000) {
        dbShippingCost = 0;
      } else if (shippingCost === 0) {
        // If frontend said 0 but it's not free shipping and not pickup
        const cityObj = await prisma.city.findFirst({
          where: { name: customer.city },
        });
        if (cityObj) dbShippingCost = cityObj.shipping_cost;
        else dbShippingCost = 8000; // Fallback
      }

      let dbTotal = dbSubtotal + dbShippingCost;
      let appliedCouponId: number | null = null;
      const originalTotal = dbTotal;
      let calculatedDiscount = 0;

      // Validate Discount if provided
      if (checkoutDto.discountCode) {
        const cleanCode = checkoutDto.discountCode.trim().toUpperCase();

        const coupon = await prisma.coupon.findUnique({
          where: { code: cleanCode },
        });

        if (coupon) {
          if (
            !coupon.is_active ||
            new Date() < coupon.valid_from ||
            new Date() > coupon.valid_until
          ) {
            throw new BadRequestException('El cupón dinámico no es válido.');
          }

          if (coupon.is_single_use_per_client) {
            const usage = await prisma.couponUsage.findFirst({
              where: { id_coupon: coupon.id, id_customer: customerRecord.id },
            });
            if (usage) {
              throw new BadRequestException(
                'El cupón ya fue utilizado por este usuario.',
              );
            }
          }

          if (coupon.free_shipping) {
            dbShippingCost = 0;
          }

          calculatedDiscount = dbSubtotal * (coupon.percentage / 100);
          dbTotal = dbSubtotal - calculatedDiscount + dbShippingCost;
          appliedCouponId = coupon.id;
        } else {
          // Fallback to Subscriber
          const subscriber = await prisma.subscriber.findUnique({
            where: { discount_code: cleanCode },
          });

          if (
            !subscriber ||
            subscriber.is_discount_used ||
            subscriber.email.toLowerCase() !== customer.email.toLowerCase()
          ) {
            throw new BadRequestException(
              'El código de descuento no es válido o ya fue usado',
            );
          }

          // Apply 10% discount to products
          calculatedDiscount = dbSubtotal * 0.1;
          dbTotal = dbSubtotal - calculatedDiscount + dbShippingCost;
        }
      }

      codAmount = method === 'WOMPI_COD' ? dbSubtotal : 0;

      // 3. Create Order Reference
      let referencedGenerated = false;
      let attempts = 0;
      let newReference = '';

      while (!referencedGenerated && attempts < 10) {
        const d = new Date();
        const yy = String(d.getFullYear()).slice(-2);
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const randomStr = String(Math.floor(1000 + Math.random() * 9000));

        newReference = `TS-${yy}${mm}${dd}-${randomStr}`;

        const exists = await prisma.order.findUnique({
          where: { order_reference: newReference },
        });

        if (!exists) {
          referencedGenerated = true;
        }
        attempts++;
      }

      if (!referencedGenerated) {
        throw new BadRequestException(
          'No se pudo generar una referencia única para el pedido. Por favor, inténtalo de nuevo.',
        );
      }

      // 3.5 Generate Pickup PIN
      const pickupPin =
        deliveryMethod === 'PICKUP'
          ? Math.random().toString(36).substring(2, 6).toUpperCase()
          : null;

      // 4. Create Order
      const order = await prisma.order.create({
        data: {
          id_customer: customerRecord.id,
          order_date: new Date(),
          status: 'Pendiente',
          iva: iva,
          shipping_cost: dbShippingCost,
          total_payment: dbTotal,
          payment_method: method,
          cod_amount: codAmount,
          purchase_date: new Date(),
          order_reference: newReference,
          is_paid: false, // Payment integration would update this
          shipping_address:
            deliveryMethod === 'PICKUP'
              ? 'CL 36D SUR #27D-39, APTO 1001, URB Guadalcanal Apartamentos, Envigado'
              : `${customer.address}, ${customer.city}, ${customer.department}`,
          delivery_method: deliveryMethod || 'SHIPPING',
          pickup_status: deliveryMethod === 'PICKUP' ? 'PENDING' : null,
          pickup_pin: pickupPin,
          id_coupon: appliedCouponId,
          discount_amount: calculatedDiscount,
        },
        include: {
          customer: true,
        },
      });

      // 5. Create Order Items and Update Stock
      for (const item of validatedItems) {
        // Create Order Item
        await prisma.orderItem.create({
          data: {
            id_order: order.id,
            id_product: item.productId,
            product_name: item.productName,
            size: item.size,
            color: item.color,
            quantity: item.quantity,
            unit_price: item.price,
            iva_item: item.price * ivaRate,
          },
        });

        // Update Stock (Decrement available quantity)
        // First get the product to find the clothingSize ID
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          include: { clothingSize: true },
        });

        if (product && product.clothingSize) {
          // Update ClothingSize quantities directly
          await prisma.clothingSize.update({
            where: { id: product.clothingSize.id },
            data: {
              quantity_available: { decrement: item.quantity },
              quantity_sold: { increment: item.quantity },
            },
          });
        }
      }

      return order;
    });

    if (method.startsWith('WOMPI')) {
      const wompiData = this.wompiService.generateCheckoutData(
        order.order_reference ?? '',
        order.payment_method ?? 'WOMPI_FULL',
        order.total_payment,
        order.shipping_cost,
      );
      return { order, wompi: wompiData };
    } else {
      return { order };
    }
  }

  /**
   * Verifica una transacción de Wompi y actualiza la orden correspondiente.
   * Delega la lógica de Wompi a WompiService.
   */
  async verifyPayment(transactionId: string) {
    return this.wompiService.verifyAndFulfillTransaction(
      transactionId,
      (order) => this.processSuccessfulPayment(order),
    );
  }

  /**
   * Procesa la facturación DIAN, correos y asientos contables para un pedido pagado exitosamente.
   * Separado de verifyPayment para ser reutilizable por múltiples pasarelas (Wompi, Belvo, Bancolombia).
   */
  async processSuccessfulPayment(order: any) {
    let invoiceData: any = null;
    const existingInvoice = await this.prisma.dianEInvoicing.findFirst({
      where: { id_order: order.id },
      orderBy: { createdAt: 'desc' },
    });

    if (existingInvoice) {
      invoiceData = {
        id: existingInvoice.id,
        cufe: existingInvoice.cufe_code,
        qrBase64: existingInvoice.qr_code,
        invoiceNumber: existingInvoice.document_number,
        cufeUrl: `https://catalogo-vpfe.dian.gov.co/document/searchqr?documentkey=${existingInvoice.cufe_code}`,
      };
    }

    if (!existingInvoice)
      try {
        const nit =
          this.configService.get<string>('DIAN_COMPANY_NIT') || '';
        const env = this.configService.get<string>(
          'DIAN_ENVIRONMENT',
          'TEST',
        );

        // Obtener siguiente número consecutivo de la resolución DIAN
        const resolution = await this.prisma.dianResolution.findFirst({
          where: { isActive: true, environment: env, type: 'INVOICE' },
        });
        if (!resolution) throw new Error('No hay resolución DIAN activa');
        if (resolution.currentNumber >= resolution.endNumber)
          throw new Error('Rango de numeración DIAN agotado');

        const nextNum = resolution.currentNumber + 1;
        await this.prisma.dianResolution.update({
          where: { id: resolution.id },
          data: { currentNumber: nextNum },
        });

        const invoiceNumber = `${resolution.prefix}${nextNum}`;
        const claveTecnica =
          resolution.technicalKey ||
          this.configService.get<string>('DIAN_TECHNICAL_KEY') ||
          '';
        const invoiceDate = new Date().toISOString().split('T')[0];

        // Calcular descuento comercial (si aplica)
        // unit_price ya incluye IVA. Sumamos el subtotal bruto de items.
        const orderItemsGrossTotal = order.orderItems.reduce(
          (sum: any, item: any) => sum + item.unit_price * item.quantity,
          0,
        );
        const expectedGrossTotal =
          orderItemsGrossTotal + order.shipping_cost;
        const actualPaid = order.total_payment;
        // El descuento se aplica solo a los productos (no al envío)
        const totalDiscountAmount = expectedGrossTotal - actualPaid;
        const discountPercentage =
          totalDiscountAmount > 1 && orderItemsGrossTotal > 0
            ? Number(
                (
                  (totalDiscountAmount / orderItemsGrossTotal) *
                  100
                ).toFixed(2),
              )
            : 0;

        console.log(
          `[DIAN Invoice] Bruto items: ${orderItemsGrossTotal}, Envío: ${order.shipping_cost}, Total pagado: ${actualPaid}, Descuento: ${discountPercentage}%`,
        );

        const invoiceLines: any[] = order.orderItems.map((item: any) => {
          const basePrice = item.unit_price / 1.19;
          return {
            description: item.product_name,
            quantity: item.quantity,
            unitPrice: basePrice,
            taxPercent: 19,
            discountPercentage: discountPercentage, // Descuento comercial por línea
          };
        });

        if (order.shipping_cost > 0) {
          // El envío también genera IVA ya que Two Six lo recauda
          const shippingBase = Number(
            (order.shipping_cost / 1.19).toFixed(2),
          );
          invoiceLines.push({
            description: 'Servicio de Envío',
            quantity: 1,
            unitPrice: shippingBase,
            taxPercent: 19,
            discountPercentage: 0, // No se descuenta el envío
          });
        }

        // Generate exact DIAN totals (Must strictly match UBL engine logic: unit tax first)
        // Now incorporates discount in the calculation
        let dianSubtotal = 0;
        let dianIva = 0;
        invoiceLines.forEach((line) => {
          line.unitPrice = Number(line.unitPrice.toFixed(2));
          const discRate = line.discountPercentage || 0;
          const unitDiscount = Number(
            (line.unitPrice * (discRate / 100)).toFixed(2),
          );
          const discountedPrice = Number(
            (line.unitPrice - unitDiscount).toFixed(2),
          );
          const lineTotal = Number(
            (line.quantity * discountedPrice).toFixed(2),
          );

          const lineTaxPercent = line.taxPercent ?? 19;
          const unitTax = Number(
            (discountedPrice * (lineTaxPercent / 100)).toFixed(2),
          );
          const lineTax = Number((unitTax * line.quantity).toFixed(2));

          dianSubtotal += lineTotal;
          dianIva += lineTax;
        });

        dianSubtotal = Number(dianSubtotal.toFixed(2));
        dianIva = Number(dianIva.toFixed(2));
        const dianTotal = Number((dianSubtotal + dianIva).toFixed(2));

        const invoiceDto: InvoiceDto = {
          number: invoiceNumber,
          date: invoiceDate,
          time: '12:00:00-05:00',
          customerName: order.customer.name,
          customerDoc: order.customer.document_number || '222222222222',
          paymentMeansCode:
            order.payment_method === 'WOMPI_COD' ? '10' : '48',
          customerDocType: order.customer.identificationType?.code || '13',
          lines: invoiceLines,
          subtotal: dianSubtotal,
          taxTotal: dianIva,
          total: dianTotal,

          // Resolution data for XML
          resolutionPrefix: resolution.prefix,
          resolutionNumber: resolution.resolutionNumber,
          resolutionStartDate: resolution.startDate
            .toISOString()
            .split('T')[0],
          resolutionEndDate: resolution.endDate.toISOString().split('T')[0],
          resolutionStartNumber: resolution.startNumber,
          resolutionEndNumber: resolution.endNumber,
        };

        // 1. Generar CUFE primero
        const cufe = this.cufeService.generateCufe({
          NumFac: invoiceNumber,
          FecFac: invoiceDate,
          HorFac: '12:00:00-05:00',
          ValFac: dianSubtotal.toFixed(2),
          CodImp1: '01',
          ValImp1: dianIva.toFixed(2),
          CodImp2: '04',
          ValImp2: '0.00',
          CodImp3: '03',
          ValImp3: '0.00',
          ValTot: dianTotal.toFixed(2),
          NitOfe: nit,
          NumAdq: invoiceDto.customerDoc,
          ClTec: claveTecnica,
          TipoAmb: env === 'TEST' ? '2' : '1',
        });

        // 2. Generar XML con CUFE insertado, luego firmar
        const xmlBase = this.ublService.generateInvoiceXml(invoiceDto);
        const xmlWithCufe = xmlBase.replace(/CUFE_PLACEHOLDER/g, cufe);
        const signedXml = this.signerService.signXml(xmlWithCufe);

        // 3. Enviar a DIAN
        const soapResponse = await this.soapService.sendInvoice(
          Buffer.from(signedXml),
          invoiceNumber,
        );

        const qrBase64 = await this.pdfService.generateQrBase64(
          cufe,
          nit,
          dianSubtotal.toFixed(2),
          dianIva.toFixed(2),
          dianTotal.toFixed(2),
          invoiceDate,
        );

        // Guardar en base de datos
        const savedInvoice = await this.prisma.dianEInvoicing.create({
          data: {
            document_number: invoiceNumber,
            cufe_code: cufe,
            qr_code: qrBase64,
            issue_date: new Date(invoiceDate),
            due_date: new Date(invoiceDate),
            status: env === 'TEST' ? 'SENT' : 'AUTHORIZED',
            dian_response:
              typeof soapResponse === 'string'
                ? soapResponse
                : JSON.stringify(soapResponse),
            environment: env,
            id_order: order.id,
          },
        });

        if (savedInvoice.status === 'AUTHORIZED') {
          // Producción dispara correo síncrono
          this.dianEmailService
            .sendDianInvoiceEmail(savedInvoice.id)
            .catch((err) =>
              console.error('Error enviando correo síncrono DIAN:', err),
            );
        }

        invoiceData = {
          id: savedInvoice.id,
          cufe,
          qrBase64,
          invoiceNumber,
          cufeUrl: `https://catalogo-vpfe.dian.gov.co/document/searchqr?documentkey=${cufe}`,
        };
        console.log(
          `Factura DIAN ${invoiceNumber} generada para orden ${order.order_reference}`,
        );
      } catch (dianError) {
        console.error(
          'Error generando factura DIAN (no bloquea el flujo):',
          dianError.message,
        );
      }

    // Enviar correo de confirmación SOLO si no se había pagado antes (evita duplicados)
    const shouldSendEmail = !order.is_paid;
    if (shouldSendEmail) {
      try {
        const itemsHtml = order.orderItems
          .map(
            (item: any) => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #eee; width: 60px;">
            <img src="${item.product.clothingSize?.clothingColor?.imageClothing?.[0]?.image_url || 'https://example.com/placeholder.png'}" alt="${item.product_name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;">
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #eee;">
            <div style="font-weight: bold;">${item.product_name}</div>
            <div style="font-size: 12px; color: #666;">Ref: ${item.id_product}</div>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #eee;">${item.size} / ${item.color}</td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">$${(item.unit_price * item.quantity).toLocaleString('es-CO')}</td>
        </tr>
      `,
          )
          .join('');

        const subtotal = order.orderItems.reduce(
          (sum: any, item: any) => sum + item.unit_price * item.quantity,
          0,
        );
        const shipping = order.shipping_cost || 0;
        // Sometimes JS floating point issues can make a tiny discount, so we check if it's > 1
        const discount = Math.round(
          subtotal + shipping - order.total_payment,
        );

        let discountHtml = '';
        if (discount > 1) {
          discountHtml = `
            <tr>
              <td colspan="4" style="padding: 4px 12px; text-align: right; color: #dc3545;">Descuento aplicado:</td>
              <td style="padding: 4px 12px; text-align: right; color: #dc3545;">-$${discount.toLocaleString('es-CO')}</td>
            </tr>
          `;
        }

        const isCod = order.payment_method === 'WOMPI_COD';
        const paidToday = isCod ? shipping : order.total_payment;
        const dueOnDelivery = isCod ? subtotal : 0;

        const tfootHtml = `
          <tr>
            <td colspan="4" style="padding: 12px 12px 4px 12px; text-align: right;">Subtotal:</td>
            <td style="padding: 12px 12px 4px 12px; text-align: right;">$${subtotal.toLocaleString('es-CO')}</td>
          </tr>
           ${discountHtml}
          <tr>
            <td colspan="4" style="padding: 4px 12px; text-align: right;">Costo de envío:</td>
            <td style="padding: 4px 12px; text-align: right;">$${shipping.toLocaleString('es-CO')}</td>
          </tr>
          <tr>
            <td colspan="4" style="padding: 12px; text-align: right; font-weight: bold; border-top: 1px solid #eee;">Total Pagado Hoy:</td>
            <td style="padding: 12px; text-align: right; font-weight: bold; border-top: 1px solid #eee; color: #10b981;">$${paidToday.toLocaleString('es-CO')}</td>
          </tr>
          ${
            dueOnDelivery > 0
              ? `
          <tr>
            <td colspan="4" style="padding: 12px; text-align: right; font-weight: bold; border-top: 1px solid #eee;">A Pagar Contra Entrega (PCE):</td>
            <td style="padding: 12px; text-align: right; font-weight: bold; border-top: 1px solid #eee; color: #d4af37;">$${dueOnDelivery.toLocaleString('es-CO')}</td>
          </tr>`
              : ''
          }
        `;

        const storeEmail = this.configService.get<string>('EMAIL_TO');
        console.log(
          `Enviando correo de confirmación a: ${order.customer.email} (copia a: ${storeEmail || 'NO CONFIGURADO'})`,
        );

        // El correo incluirá detalles comerciales del pedido (Facturación viaja en flujo independiente async/sync).

        await this.mailerService.sendMail({
          to: order.customer.email,
          ...(storeEmail ? { bcc: storeEmail } : {}),
          subject: `${this.configService.get<string>('FRONTEND_URL', '').includes('localhost') ? '[LOCAL] ' : ''}Confirmación de Pedido ${order.order_reference} - Two Six`,
          html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <div style="text-align: center; padding: 20px; background-color: #f8f9fa;">
              <h1 style="color: #000; margin: 0;">TWO SIX</h1>
              <p style="color: #666; font-size: 14px; letter-spacing: 2px;">ESTILO Y CONFORT</p>
            </div>
            
            <div style="padding: 20px;">
              <h2 style="color: #333;">¡Gracias por tu compra, ${order.customer.name}!</h2>
              <p>Hemos recibido el pago de tu envío para el pedido <strong>${order.order_reference}</strong>. Tu pedido está confirmado.</p>
              ${
                isCod
                  ? `<div style="background-color: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin-bottom: 20px;">
                <strong>Importante:</strong> Has seleccionado Pago Contra Entrega (PCE). Deberás entregar <strong>$${dueOnDelivery.toLocaleString('es-CO')}</strong> en efectivo al transportador al momento de recibir tus prendas.
              </div>`
                  : ''
              }
              
              <h3 style="border-bottom: 2px solid #000; padding-bottom: 10px; margin-top: 30px;">Detalles del Pedido</h3>
              <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                <thead>
                  <tr style="background-color: #f8f9fa;">
                    <th style="padding: 12px; text-align: left; width: 60px;"></th>
                    <th style="padding: 12px; text-align: left;">Producto</th>
                    <th style="padding: 12px; text-align: left;">Detalles</th>
                    <th style="padding: 12px; text-align: center;">Cant.</th>
                    <th style="padding: 12px; text-align: right;">Precio</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
                <tfoot>
                  ${tfootHtml}
                </tfoot>
              </table>

              <div style="background-color: #f8f9fa; padding: 15px; margin-top: 30px; border-radius: 5px;">
                <h4 style="margin-top: 0;">${order.delivery_method === 'PICKUP' ? 'Punto de Retiro:' : 'Dirección de Envío:'}</h4>
                <p style="margin-bottom: 0;">
                  ${
                    order.delivery_method === 'PICKUP'
                      ? 'CL 36D SUR #27D-39, APTO 1001, URB Guadalcanal Apartamentos, Envigado, Antioquia.<br><br><i>Nota: Este punto es solo para recoger pedidos ya pagos, no es tienda para medirse ropa 🤍<br>En un máximo de 4 horas hábiles (o antes) te estaremos avisando para que puedas pasar por tu pedido.<br><br>📞 310 877 7629</i>'
                      : `${order.shipping_address}<br>Tel: ${order.customer.current_phone_number}`
                  }
                </p>
              </div>
              ${
                order.delivery_method === 'PICKUP' && order.pickup_pin
                  ? `
              <div style="background-color: #fef3c7; padding: 20px; margin-top: 15px; border-radius: 5px; border-left: 4px solid #f59e0b; text-align: center;">
                <h3 style="margin: 0 0 10px 0; color: #b45309;">🔐 Tu PIN de Retiro</h3>
                <p style="margin: 0 0 10px 0; font-size: 13px;">Presenta este código al momento de recoger tu pedido:</p>
                <h2 style="font-size: 36px; letter-spacing: 8px; margin: 10px 0; color: #000; font-family: monospace;">${order.pickup_pin}</h2>
                <p style="margin: 10px 0 0 0; font-size: 11px; color: #92400e;">Guarda este correo. Sin el PIN no se podrá hacer la entrega.</p>
              </div>`
                  : ''
              }

              <!-- Facturación viaja en flujo independiente async/sync -->

              <p style="margin-top: 30px; text-align: center;">
                <a href="${this.configService.get<string>('FRONTEND_URL')}/tracking" style="background-color: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Rastrear mi Pedido</a>
              </p>
            </div>

            <div style="text-align: center; padding: 20px; background-color: #f8f9fa; font-size: 12px; color: #999;">
              <p>&copy; ${new Date().getFullYear()} Two Six. Todos los derechos reservados.</p>
            </div>
          </div>
        `,
        });
      } catch (error) {
        console.error('Error enviando correo:', error);
      }
    }

    // 6. Generar asiento contable automático
    try {
      await this.journalAutoService.onSaleCompleted(order.id);
      console.log(
        `Asiento contable generado para orden ${order.order_reference}`,
      );
    } catch (accountingError) {
      console.error(
        'Error generando asiento contable (no bloquea el flujo):',
        accountingError.message,
      );
    }

    // 7. Generar asiento de costo de mercancía vendida (COGS)
    try {
      await this.journalAutoService.onCostOfGoodsSold(order.id);
      console.log(
        `Asiento de costo de mercancía vendida generado para orden ${order.order_reference}`,
      );
    } catch (cogsError) {
      console.error(
        'Error generando asiento COGS (no bloquea el flujo):',
        cogsError.message,
      );
    }

    return invoiceData;
  }

  async checkStatusByReference(reference: string) {
    try {
      const wompiApiUrl = this.configService.get<string>('WOMPI_API_URL');
      const privateKey = this.configService.get<string>('WOMPI_PRIVATE_KEY');

      if (!privateKey) {
        throw new Error('WOMPI_PRIVATE_KEY no está configurado en el .env');
      }

      // Consultar transacciones por referencia
      const response = await fetch(
        `${wompiApiUrl}/transactions?reference=${reference}`,
        {
          headers: {
            Authorization: `Bearer ${privateKey}`, // Wompi requiere llave PRIVADA para consultar
          },
        },
      );

      if (!response.ok) {
        throw new Error(`Error consultando Wompi: ${response.statusText}`);
      }

      const data = await response.json();
      const transactions = data.data;

      if (!transactions || transactions.length === 0) {
        return { status: 'PENDING', message: 'No se encontró transacción aún' };
      }

      // Tomar la última transacción (la más reciente)
      const latestTransaction = transactions[0];
      const status = latestTransaction.status;

      // Si la transacción está aprobada, obtenemos el ID de la orden
      if (status === 'APPROVED') {
        const result = await this.verifyPayment(latestTransaction.id);
        return result;
      }

      return {
        status: status,
        transactionId: latestTransaction.id,
        reference: reference,
        message: latestTransaction.status_message,
      };
    } catch (error) {
      console.error('Error consultando estado por referencia:', error);
      return { status: 'ERROR', message: error.message };
    }
  }

  async markAsPreparingForPickup(id: number) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Orden no encontrada');
    if (order.delivery_method !== 'PICKUP')
      throw new BadRequestException(
        'Esta orden no es para recoger en punto físico',
      );

    const updated = await this.prisma.order.update({
      where: { id },
      data: { pickup_status: 'PREPARING', status: 'Preparando Pedido' },
    });
    return updated;
  }

  async markAsUnclaimedForPickup(id: number) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Orden no encontrada');
    if (order.delivery_method !== 'PICKUP')
      throw new BadRequestException(
        'Esta orden no es para recoger en punto físico',
      );

    const updated = await this.prisma.order.update({
      where: { id },
      data: { pickup_status: 'UNCLAIMED', status: 'No Reclamado' },
    });
    return updated;
  }

  async markAsReadyForPickup(id: number) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { customer: true },
    });

    if (!order) throw new NotFoundException('Orden no encontrada');
    if (order.delivery_method !== 'PICKUP')
      throw new BadRequestException(
        'Esta orden no es para recoger en punto físico',
      );

    const updated = await this.prisma.order.update({
      where: { id },
      data: { pickup_status: 'READY', status: 'Listo para Recoger' },
    });

    try {
      const storeEmail = this.configService.get<string>('EMAIL_TO');
      await this.mailerService.sendMail({
        to: order.customer.email,
        ...(storeEmail ? { bcc: storeEmail } : {}),
        subject: `¡Tu pedido ${order.order_reference} está listo para recoger! - Two Six`,
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <div style="text-align: center; padding: 20px; background-color: #f8f9fa;">
            <h1 style="color: #000; margin: 0;">TWO SIX</h1>
            <p style="color: #666; font-size: 14px; letter-spacing: 2px;">ESTILO Y CONFORT</p>
          </div>
          <div style="padding: 20px;">
            <h2 style="color: #333;">¡Hola ${order.customer.name}!</h2>
            <p>Tu pedido <strong>${order.order_reference}</strong> ya está preparado y empacado.</p>
            ${
              updated.pickup_pin
                ? `
            <div style="background-color: #fef3c7; padding: 15px; border-radius: 5px; border-left: 4px solid #f59e0b; text-align: center;">
              <h3 style="margin: 0; color: #b45309;">PIN de Seguridad Requerido</h3>
              <p style="margin-bottom: 0;">Para la entrega de tu pedido en bodega, <strong>es obligatorio</strong> proveer este código PIN:</p>
              <h2 style="font-size: 32px; letter-spacing: 6px; margin: 15px 0 5px 0; color: #000;">${updated.pickup_pin}</h2>
            </div>
            `
                : ''
            }
            <div style="background-color: #f8f9fa; padding: 15px; margin-top: 20px; border-radius: 5px; border-left: 4px solid #000;">
              <h4 style="margin-top: 0;">📍 Punto de Retiro</h4>
              <p style="margin-bottom: 0;">
                <strong>Dirección:</strong> CL 36D SUR #27D-39, APTO 1001<br>
                URB Guadalcanal Apartamentos, Envigado.<br>
                <br>
                <i>Recordatorio: Este punto es exclusivo para entrega de pedidos web ya pagados. No disponemos de probadores ni sala de exhibición aquí.</i>
              </p>
            </div>
          </div>
          <div style="text-align: center; padding: 20px; background-color: #f8f9fa; font-size: 12px; color: #999;">
            <p>&copy; ${new Date().getFullYear()} Two Six. Todos los derechos reservados.</p>
          </div>
        </div>
        `,
      });
    } catch (error) {
      console.error('Error enviando correo de recogida:', error);
    }

    return updated;
  }

  async markAsCollected(id: number) {
    const order = await this.prisma.order.findUnique({
      where: { id },
    });

    if (!order) throw new NotFoundException('Orden no encontrada');
    if (order.delivery_method !== 'PICKUP')
      throw new BadRequestException(
        'Esta orden no es para recoger en punto físico',
      );

    const updated = await this.prisma.order.update({
      where: { id },
      data: { pickup_status: 'COLLECTED', status: 'Entregado' },
    });

    return updated;
  }

  create(createOrderDto: CreateOrderDto) {
    return this.prisma.order.create({
      data: createOrderDto,
    });
  }

  async trackOrder(dto: { orderReference: string; email: string }) {
    const order = await this.prisma.order.findUnique({
      where: { order_reference: dto.orderReference },
      include: {
        customer: true,
        orderItems: {
          include: {
            product: {
              include: {
                clothingSize: {
                  include: {
                    clothingColor: {
                      include: {
                        imageClothing: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        shipments: {
          include: {
            shippingProvider: true,
            trackingHistory: true,
          },
        },
        payments: true, // Added to get the transaction date for 'Pagado' status
      },
    });

    if (!order) {
      throw new NotFoundException('Orden no encontrada');
    }

    if (order.customer.email.toLowerCase() !== dto.email.toLowerCase()) {
      throw new BadRequestException(
        'El correo electrónico no coincide con la orden',
      );
    }

    return order;
  }

  findAll(deliveryMethod?: string, sort: 'asc' | 'desc' = 'desc') {
    const whereClause: any = {};
    if (deliveryMethod) {
      whereClause.delivery_method = deliveryMethod;
    }

    return this.prisma.order.findMany({
      where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
      include: {
        customer: true,
        orderItems: {
          include: {
            product: {
              include: {
                clothingSize: {
                  include: {
                    clothingColor: {
                      include: {
                        imageClothing: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        payments: {
          include: {
            paymentMethod: true,
          },
        },
      },
      orderBy: {
        order_date: sort,
      },
    });
  }

  async findOne(id: number) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
        dianEInvoicings: {
          orderBy: { createdAt: 'desc' },
          include: {
            dianNotes: true,
          },
        },
        orderItems: {
          include: {
            product: {
              include: {
                clothingSize: {
                  include: {
                    clothingColor: {
                      include: {
                        imageClothing: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        shipments: {
          include: {
            shippingProvider: true,
            trackingHistory: true,
          },
        },
        payments: {
          include: {
            paymentMethod: true,
          },
        },
      },
    });

    if (!order) return null;

    // Map dianEInvoicing for backward compatibility while exposing the full history
    return {
      ...order,
      dianEInvoicing:
        order.dianEInvoicings?.length > 0 ? order.dianEInvoicings[0] : null,
    };
  }

  async findByReference(reference: string) {
    const order = await this.prisma.order.findUnique({
      where: { order_reference: reference },
      include: {
        customer: true,
        dianEInvoicings: { orderBy: { createdAt: 'desc' } },
        orderItems: {
          include: {
            product: {
              include: {
                clothingSize: {
                  include: {
                    clothingColor: {
                      include: {
                        imageClothing: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!order) return null;

    return {
      ...order,
      dianEInvoicing:
        order.dianEInvoicings?.length > 0 ? order.dianEInvoicings[0] : null,
    };
  }

  update(id: number, updateOrderDto: UpdateOrderDto) {
    return this.prisma.order.update({
      where: { id },
      data: updateOrderDto,
    });
  }

  remove(id: number) {
    return this.prisma.order.delete({ where: { id } });
  }

  async findByCustomerEmail(email: string) {
    return this.prisma.order.findMany({
      where: {
        customer: {
          email: {
            equals: email,
            mode: 'insensitive',
          },
        },
      },
      include: {
        orderItems: {
          include: {
            product: {
              include: {
                clothingSize: {
                  include: {
                    clothingColor: {
                      include: {
                        imageClothing: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        shipments: {
          include: {
            shippingProvider: true,
            trackingHistory: true,
          },
        },
        payments: true,
      },
      orderBy: {
        order_date: 'desc',
      },
    });
  }
}
