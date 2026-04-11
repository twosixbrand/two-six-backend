import { Test, TestingModule } from '@nestjs/testing';
import { OrderService } from './order.service';
import { PrismaService } from '../../prisma/prisma.service';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { DianUblService } from '../dian/dian-ubl/dian-ubl.service';
import { DianSignerService } from '../dian/dian-signer/dian-signer.service';
import { DianCufeService } from '../dian/dian-cufe/dian-cufe.service';
import { DianSoapService } from '../dian/dian-soap/dian-soap.service';
import { DianPdfService } from '../dian/dian-pdf/dian-pdf.service';
import { DianEmailService } from '../dian/dian-email.service';
import { JournalAutoService } from '../accounting/journal/journal-auto.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('OrderService', () => {
  let service: OrderService;

  // Transaction mock: the callback receives a proxy identical to prisma
  const mockPrismaTransaction = jest.fn();

  const mockPrisma = {
    order: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    customer: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    orderItem: {
      create: jest.fn(),
    },
    product: {
      findUnique: jest.fn(),
    },
    clothingSize: {
      update: jest.fn(),
    },
    subscriber: {
      findUnique: jest.fn(),
    },
    dianEInvoicing: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    dianResolution: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    payments: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    paymentMethod: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    $transaction: mockPrismaTransaction,
  };

  const mockMailerService = { sendMail: jest.fn() };

  const mockConfigService = {
    get: jest.fn((key: string, defaultVal?: any) => {
      const map: Record<string, string> = {
        WOMPI_INTEGRITY_SECRET: 'test_integrity_abc123',
        WOMPI_PUBLIC_KEY: 'pub_test_abc',
        WOMPI_API_URL: 'https://sandbox.wompi.co/v1',
        FRONTEND_URL: 'http://localhost:3000',
        DIAN_COMPANY_NIT: '900123456',
        DIAN_ENVIRONMENT: 'TEST',
        DIAN_TECHNICAL_KEY: 'tech-key-123',
        EMAIL_TO: 'store@twosix.co',
      };
      return map[key] ?? defaultVal ?? undefined;
    }),
  };

  const mockUblService = { generateInvoiceXml: jest.fn() };
  const mockSignerService = { signXml: jest.fn() };
  const mockCufeService = { generateCufe: jest.fn() };
  const mockSoapService = { sendInvoice: jest.fn() };
  const mockPdfService = { generateQrBase64: jest.fn() };
  const mockDianEmailService = { sendDianInvoiceEmail: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: MailerService, useValue: mockMailerService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: DianUblService, useValue: mockUblService },
        { provide: DianSignerService, useValue: mockSignerService },
        { provide: DianCufeService, useValue: mockCufeService },
        { provide: DianSoapService, useValue: mockSoapService },
        { provide: DianPdfService, useValue: mockPdfService },
        { provide: DianEmailService, useValue: mockDianEmailService },
        { provide: JournalAutoService, useValue: { logSalesInvoice: jest.fn() } },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── checkout ───────────────────────────────────────────────────────

  describe('checkout', () => {
    const baseCheckoutDto = {
      customer: {
        document_type: '13',
        document_number: '1234567890',
        name: 'Test User',
        email: 'test@example.com',
        phone: '3001234567',
        address: 'Calle 10',
        city: 'Medellin',
        department: 'Antioquia',
      },
      items: [
        { productId: 1, quantity: 2, price: 50000, productName: 'Camiseta', size: 'M', color: 'Negro', image: '' },
      ],
      total: 115000,
      shippingCost: 15000,
      paymentMethod: 'WOMPI_FULL',
      deliveryMethod: 'SHIPPING',
    };

    it('should create an order with correct reference format (TS-YYMMDD-XXXX)', async () => {
      // $transaction executes the callback with the prisma-like proxy
      const createdOrder = {
        id: 1,
        order_reference: 'TS-260325-1234',
        customer: { id: 1, name: 'Test User' },
        payment_method: 'WOMPI_FULL',
        shipping_cost: 15000,
        total_payment: 115000,
      };

      mockPrismaTransaction.mockImplementation(async (cb: Function) => {
        // Build a tx proxy that mirrors the real prisma models
        const txProxy = {
          customer: {
            findUnique: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue({ id: 1 }),
            update: jest.fn(),
          },
          order: {
            findUnique: jest.fn().mockResolvedValue(null), // no collision on reference
            create: jest.fn().mockResolvedValue(createdOrder),
          },
          orderItem: { create: jest.fn() },
          product: {
            findUnique: jest.fn().mockResolvedValue({
              id: 1,
              clothingSize: { id: 10 },
            }),
          },
          clothingSize: { update: jest.fn() },
          subscriber: { findUnique: jest.fn().mockResolvedValue(null) },
        };
        return cb(txProxy);
      });

      const result = await service.checkout(baseCheckoutDto);

      expect(result.order).toBeDefined();
      expect(result.order.order_reference).toMatch(/^TS-\d{6}-\d{4}$/);
      expect(result.wompi).toBeDefined();
      expect(result.wompi.publicKey).toBe('pub_test_abc');
      expect(result.wompi.currency).toBe('COP');
      expect(result.wompi.amountInCents).toBe(11500000); // 115000 * 100
      expect(result.wompi.integritySignature).toBeDefined();
    });

    it('should generate pickup_pin for PICKUP orders and set shipping_cost to 0', async () => {
      const pickupDto = {
        ...baseCheckoutDto,
        deliveryMethod: 'PICKUP',
        shippingCost: 0,
        total: 100000,
      };

      mockPrismaTransaction.mockImplementation(async (cb: Function) => {
        const txProxy = {
          customer: {
            findUnique: jest.fn().mockResolvedValue({ id: 1 }),
            update: jest.fn(),
          },
          order: {
            findUnique: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockImplementation(({ data }) => ({
              id: 2,
              order_reference: data.order_reference,
              pickup_pin: data.pickup_pin,
              delivery_method: data.delivery_method,
              shipping_cost: data.shipping_cost,
              customer: { id: 1 },
              payment_method: 'WOMPI_FULL',
              total_payment: 100000,
            })),
          },
          orderItem: { create: jest.fn() },
          product: {
            findUnique: jest.fn().mockResolvedValue({ id: 1, clothingSize: { id: 10 } }),
          },
          clothingSize: { update: jest.fn() },
          subscriber: { findUnique: jest.fn().mockResolvedValue(null) },
        };
        return cb(txProxy);
      });

      const result = await service.checkout(pickupDto);

      expect(result.order.pickup_pin).toBeDefined();
      expect(result.order.pickup_pin).toHaveLength(4);
      expect(result.order.shipping_cost).toBe(0);
    });

    it('should use WOMPI_COD amount (shippingCost only) for COD payment', async () => {
      const codDto = {
        ...baseCheckoutDto,
        paymentMethod: 'WOMPI_COD',
        total: 115000,
        shippingCost: 15000,
      };

      mockPrismaTransaction.mockImplementation(async (cb: Function) => {
        const txProxy = {
          customer: {
            findUnique: jest.fn().mockResolvedValue({ id: 1 }),
            update: jest.fn(),
          },
          order: {
            findUnique: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockImplementation(({ data }) => ({
              id: 3,
              order_reference: data.order_reference,
              customer: { id: 1 },
              payment_method: 'WOMPI_COD',
              total_payment: 115000,
              shipping_cost: 15000,
            })),
          },
          orderItem: { create: jest.fn() },
          product: {
            findUnique: jest.fn().mockResolvedValue({ id: 1, clothingSize: { id: 10 } }),
          },
          clothingSize: { update: jest.fn() },
          subscriber: { findUnique: jest.fn().mockResolvedValue(null) },
        };
        return cb(txProxy);
      });

      const result = await service.checkout(codDto);

      // COD => amountInCents should be shippingCost * 100
      expect(result.wompi.amountInCents).toBe(1500000);
    });
  });

  // ─── findOne ────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('should return order with dianEInvoicing mapped for backward compat', async () => {
      const order = {
        id: 1,
        dianEInvoicings: [{ id: 10, document_number: 'FE001' }],
        orderItems: [],
        shipments: [],
        payments: [],
        customer: {},
      };
      mockPrisma.order.findUnique.mockResolvedValue(order);

      const result = await service.findOne(1);

      expect(result).toBeDefined();
      expect(result!.dianEInvoicing).toEqual({ id: 10, document_number: 'FE001' });
    });

    it('should return null when order does not exist', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(null);

      const result = await service.findOne(999);
      expect(result).toBeNull();
    });
  });

  // ─── findByReference ───────────────────────────────────────────────

  describe('findByReference', () => {
    it('should return order by reference with dianEInvoicing mapped', async () => {
      const order = {
        id: 5,
        order_reference: 'TS-260101-1234',
        dianEInvoicings: [{ id: 20 }],
        orderItems: [],
        customer: {},
      };
      mockPrisma.order.findUnique.mockResolvedValue(order);

      const result = await service.findByReference('TS-260101-1234');

      expect(result).toBeDefined();
      expect(result!.dianEInvoicing).toEqual({ id: 20 });
    });

    it('should return null if reference not found', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(null);
      const result = await service.findByReference('TS-000000-0000');
      expect(result).toBeNull();
    });
  });

  // ─── trackOrder ─────────────────────────────────────────────────────

  describe('trackOrder', () => {
    it('should return order when reference and email match', async () => {
      const order = {
        id: 1,
        order_reference: 'TS-260101-1234',
        customer: { email: 'test@example.com' },
        orderItems: [],
        shipments: [],
        payments: [],
      };
      mockPrisma.order.findUnique.mockResolvedValue(order);

      const result = await service.trackOrder({
        orderReference: 'TS-260101-1234',
        email: 'TEST@EXAMPLE.COM',
      });

      expect(result).toEqual(order);
    });

    it('should throw NotFoundException when order does not exist', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(null);

      await expect(
        service.trackOrder({ orderReference: 'TS-000000-0000', email: 'a@b.com' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when email does not match', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        id: 1,
        customer: { email: 'owner@example.com' },
      });

      await expect(
        service.trackOrder({
          orderReference: 'TS-260101-1234',
          email: 'impersonator@example.com',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── verifyPayment ──────────────────────────────────────────────────

  describe('verifyPayment', () => {
    beforeEach(() => {
      // Mock global fetch
      global.fetch = jest.fn() as jest.Mock;
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should throw when transactionId is invalid', async () => {
      await expect(service.verifyPayment('undefined')).rejects.toThrow(
        'Transaction ID inválido',
      );
      await expect(service.verifyPayment('')).rejects.toThrow(
        'Transaction ID inválido',
      );
    });

    it('should update order to Pagado on APPROVED with WOMPI_FULL', async () => {
      const transaction = {
        reference: 'TS-260101-1234',
        status: 'APPROVED',
        amount_in_cents: 11500000,
        created_at: '2026-03-25T10:00:00Z',
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ data: transaction }),
      });

      const order = {
        id: 1,
        order_reference: 'TS-260101-1234',
        is_paid: false,
        payment_method: 'WOMPI_FULL',
        shipping_cost: 15000,
        total_payment: 115000,
        id_customer: 10,
        delivery_method: 'SHIPPING',
        customer: {
          id: 10,
          name: 'User',
          email: 'user@test.com',
          current_phone_number: '300',
          identificationType: { code: '13' },
        },
        orderItems: [
          {
            id: 1,
            unit_price: 50000,
            quantity: 2,
            product_name: 'Camiseta',
            id_product: 1,
            size: 'M',
            color: 'Negro',
            product: { clothingSize: { clothingColor: { imageClothing: [] } } },
          },
        ],
      };

      mockPrisma.order.findUnique.mockResolvedValue(order);
      mockPrisma.order.update.mockResolvedValue({});
      mockPrisma.payments.findFirst.mockResolvedValue(null);
      mockPrisma.paymentMethod.findFirst.mockResolvedValue({ id: 1, name: 'Wompi' });
      mockPrisma.payments.create.mockResolvedValue({});
      mockPrisma.subscriber.findUnique.mockResolvedValue(null);
      mockPrisma.dianEInvoicing.findFirst.mockResolvedValue(null);

      // DIAN resolution mock
      mockPrisma.dianResolution.findFirst.mockResolvedValue({
        id: 1,
        prefix: 'FE',
        currentNumber: 100,
        endNumber: 999,
        resolutionNumber: 'RES-001',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2026-12-31'),
        startNumber: 1,
        technicalKey: 'tech-key-123',
      });
      mockPrisma.dianResolution.update.mockResolvedValue({});

      mockCufeService.generateCufe.mockReturnValue('cufe-abc-123');
      mockUblService.generateInvoiceXml.mockReturnValue('<xml>CUFE_PLACEHOLDER</xml>');
      mockSignerService.signXml.mockReturnValue('<xml>cufe-abc-123</xml>');
      mockSoapService.sendInvoice.mockResolvedValue('<soap>response</soap>');
      mockPdfService.generateQrBase64.mockResolvedValue('qr-base64');
      mockPrisma.dianEInvoicing.create.mockResolvedValue({
        id: 50,
        document_number: 'FE101',
        status: 'SENT',
      });
      mockMailerService.sendMail.mockResolvedValue(undefined);

      const result = await service.verifyPayment('txn_123');

      expect(result.status).toBe('APPROVED');
      expect(result.orderId).toBe(1);

      // Order should be set to 'Pagado' for WOMPI_FULL
      expect(mockPrisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'Pagado', is_paid: true }),
        }),
      );

      // DIAN invoice should have been generated
      expect(mockCufeService.generateCufe).toHaveBeenCalled();
      expect(mockPrisma.dianEInvoicing.create).toHaveBeenCalled();
    });

    it('should update order to Rechazado on DECLINED', async () => {
      const transaction = {
        reference: 'TS-260101-5555',
        status: 'DECLINED',
        amount_in_cents: 11500000,
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ data: transaction }),
      });

      const order = {
        id: 2,
        order_reference: 'TS-260101-5555',
        is_paid: false,
        payment_method: 'WOMPI_FULL',
        total_payment: 115000,
        shipping_cost: 15000,
        customer: { email: 'user@test.com', identificationType: {} },
        orderItems: [],
      };

      mockPrisma.order.findUnique.mockResolvedValue(order);
      mockPrisma.order.update.mockResolvedValue({});

      const result = await service.verifyPayment('txn_declined');

      expect(result.status).toBe('DECLINED');
      expect(mockPrisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: 'Rechazado' },
        }),
      );
    });

    it('should set status to Aprobado PCE for WOMPI_COD payments', async () => {
      const transaction = {
        reference: 'TS-260101-9999',
        status: 'APPROVED',
        amount_in_cents: 1500000,
        created_at: '2026-03-25T10:00:00Z',
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ data: transaction }),
      });

      const order = {
        id: 3,
        order_reference: 'TS-260101-9999',
        is_paid: false,
        payment_method: 'WOMPI_COD',
        total_payment: 115000,
        shipping_cost: 15000,
        id_customer: 10,
        delivery_method: 'SHIPPING',
        customer: {
          id: 10,
          name: 'COD User',
          email: 'cod@test.com',
          current_phone_number: '300',
          identificationType: { code: '13' },
        },
        orderItems: [
          {
            unit_price: 50000,
            quantity: 2,
            product_name: 'Camiseta',
            id_product: 1,
            size: 'M',
            color: 'Negro',
            product: { clothingSize: { clothingColor: { imageClothing: [] } } },
          },
        ],
      };

      mockPrisma.order.findUnique.mockResolvedValue(order);
      mockPrisma.order.update.mockResolvedValue({});
      mockPrisma.payments.findFirst.mockResolvedValue(null);
      mockPrisma.paymentMethod.findFirst.mockResolvedValue({ id: 1, name: 'Wompi' });
      mockPrisma.payments.create.mockResolvedValue({});
      mockPrisma.subscriber.findUnique.mockResolvedValue(null);
      mockPrisma.dianEInvoicing.findFirst.mockResolvedValue(null);
      mockPrisma.dianResolution.findFirst.mockResolvedValue({
        id: 1, prefix: 'FE', currentNumber: 200, endNumber: 999,
        resolutionNumber: 'RES-001', startDate: new Date(), endDate: new Date(),
        startNumber: 1, technicalKey: 'tk',
      });
      mockPrisma.dianResolution.update.mockResolvedValue({});
      mockCufeService.generateCufe.mockReturnValue('cufe-cod');
      mockUblService.generateInvoiceXml.mockReturnValue('<xml>CUFE_PLACEHOLDER</xml>');
      mockSignerService.signXml.mockReturnValue('<xml>signed</xml>');
      mockSoapService.sendInvoice.mockResolvedValue('ok');
      mockPdfService.generateQrBase64.mockResolvedValue('qr');
      mockPrisma.dianEInvoicing.create.mockResolvedValue({ id: 60, document_number: 'FE201', status: 'SENT' });
      mockMailerService.sendMail.mockResolvedValue(undefined);

      const result = await service.verifyPayment('txn_cod');

      expect(result.status).toBe('APPROVED');
      expect(mockPrisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'Aprobado PCE',
            is_paid: false,
          }),
        }),
      );
    });

    it('should skip duplicate processing when order is already paid', async () => {
      const transaction = {
        reference: 'TS-260101-1111',
        status: 'APPROVED',
        amount_in_cents: 11500000,
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ data: transaction }),
      });

      const order = {
        id: 4,
        order_reference: 'TS-260101-1111',
        is_paid: true, // already paid
        payment_method: 'WOMPI_FULL',
        total_payment: 115000,
        shipping_cost: 15000,
        customer: { email: 'dup@test.com', identificationType: {} },
        orderItems: [],
      };

      mockPrisma.order.findUnique.mockResolvedValue(order);
      mockPrisma.dianEInvoicing.findFirst.mockResolvedValue({
        document_number: 'FE050',
      });

      const result = await service.verifyPayment('txn_dup');

      expect(result.status).toBe('APPROVED');
      expect(result.invoiceNumber).toBe('FE050');
      // Should NOT update order again
      expect(mockPrisma.order.update).not.toHaveBeenCalled();
    });
  });

  // ─── validateDiscountCode ───────────────────────────────────────────

  describe('validateDiscountCode', () => {
    it('should throw BadRequestException if code is empty', async () => {
      await expect(service.validateDiscountCode('', 'a@b.com')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw if subscriber not found', async () => {
      mockPrisma.subscriber.findUnique.mockResolvedValue(null);
      await expect(
        service.validateDiscountCode('ABCD', 'a@b.com'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if email does not match', async () => {
      mockPrisma.subscriber.findUnique.mockResolvedValue({
        email: 'other@b.com',
        status: true,
        unsubscribed: false,
        is_discount_used: false,
      });

      await expect(
        service.validateDiscountCode('ABCD', 'a@b.com'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if discount already used', async () => {
      mockPrisma.subscriber.findUnique.mockResolvedValue({
        email: 'a@b.com',
        status: true,
        unsubscribed: false,
        is_discount_used: true,
        discount_code: 'ABCD',
      });

      await expect(
        service.validateDiscountCode('ABCD', 'a@b.com'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return valid discount on happy path', async () => {
      mockPrisma.subscriber.findUnique.mockResolvedValue({
        email: 'a@b.com',
        status: true,
        unsubscribed: false,
        is_discount_used: false,
        discount_code: 'ABCD',
      });

      const result = await service.validateDiscountCode('abcd', 'A@B.COM');
      expect(result).toEqual({ valid: true, percentage: 10, code: 'ABCD' });
    });
  });
});
