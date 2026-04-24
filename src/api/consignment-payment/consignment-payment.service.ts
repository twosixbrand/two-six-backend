import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface CreatePaymentDto {
  id_order: number;
  id_customer: number;
  amount: number;
  payment_method: 'TRANSFERENCIA' | 'EFECTIVO' | 'OTRO';
  proof_image_url?: string;
  reference_number?: string;
  notes?: string;
}

@Injectable()
export class ConsignmentPaymentService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * El aliado reporta un pago desde el portal web.
   */
  async create(dto: CreatePaymentDto) {
    if (!(dto.amount > 0)) {
      throw new BadRequestException('El monto debe ser mayor a 0.');
    }

    const order = await this.prisma.order.findUnique({
      where: { id: dto.id_order },
    });
    if (!order)
      throw new NotFoundException(`Orden #${dto.id_order} no encontrada.`);
    if (order.id_customer !== dto.id_customer) {
      throw new ForbiddenException('Esta orden no pertenece a tu cuenta.');
    }
    if (!['SELLOUT', 'MERMA'].includes(order.status)) {
      throw new BadRequestException(
        'Solo se pueden registrar pagos de órdenes de consignación.',
      );
    }

    if (dto.payment_method === 'TRANSFERENCIA' && !dto.proof_image_url) {
      throw new BadRequestException(
        'Para transferencia debes adjuntar el comprobante.',
      );
    }

    return this.prisma.consignmentPayment.create({
      data: {
        id_order: dto.id_order,
        id_customer: dto.id_customer,
        amount: dto.amount,
        payment_method: dto.payment_method,
        proof_image_url: dto.proof_image_url,
        reference_number: dto.reference_number,
        notes: dto.notes,
      },
    });
  }

  /** El aliado ve sus pagos. */
  findByCustomer(id_customer: number) {
    return this.prisma.consignmentPayment.findMany({
      where: { id_customer },
      include: {
        order: {
          select: {
            id: true,
            order_reference: true,
            total_payment: true,
            status: true,
          },
        },
      },
      orderBy: { id: 'desc' },
    });
  }

  /** El aliado ve sus órdenes pendientes de pago. */
  async getUnpaidOrders(id_customer: number) {
    return this.prisma.order.findMany({
      where: {
        id_customer,
        status: { in: ['SELLOUT', 'MERMA'] },
        is_paid: false,
      },
      select: {
        id: true,
        order_reference: true,
        total_payment: true,
        iva: true,
        status: true,
        createdAt: true,
        consignmentPayments: {
          select: {
            id: true,
            amount: true,
            status: true,
            payment_method: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** CMS: lista todos los pagos. */
  findAll(filters: { status?: string; id_customer?: number } = {}) {
    return this.prisma.consignmentPayment.findMany({
      where: {
        ...(filters.status && { status: filters.status as any }),
        ...(filters.id_customer && { id_customer: filters.id_customer }),
      },
      include: {
        customer: { select: { id: true, name: true, document_number: true } },
        order: {
          select: {
            id: true,
            order_reference: true,
            total_payment: true,
            status: true,
            is_paid: true,
          },
        },
      },
      orderBy: { id: 'desc' },
    });
  }

  async findOne(id: number) {
    const p = await this.prisma.consignmentPayment.findUnique({
      where: { id },
      include: {
        customer: true,
        order: { include: { orderItems: true } },
      },
    });
    if (!p) throw new NotFoundException(`Pago #${id} no encontrado.`);
    return p;
  }

  /**
   * CMS: aprobar pago → marca la orden como pagada + asiento contable.
   */
  async approve(id: number, approvedBy: string) {
    const payment = await this.findOne(id);
    if (payment.status !== 'PENDING') {
      throw new BadRequestException(
        `Solo se pueden aprobar pagos PENDING (actual: ${payment.status}).`,
      );
    }

    await this.prisma.$transaction(async (tx) => {
      // Marcar pago como aprobado
      await tx.consignmentPayment.update({
        where: { id },
        data: {
          status: 'APPROVED',
          approved_by: approvedBy,
          approved_at: new Date(),
        },
      });

      // Verificar si el total pagado cubre la orden
      const allPayments = await tx.consignmentPayment.findMany({
        where: { id_order: payment.id_order, status: 'APPROVED' },
      });
      const totalPaid =
        allPayments.reduce((s, p) => s + p.amount, 0) + payment.amount;

      if (totalPaid >= payment.order.total_payment) {
        // Marcar orden como pagada
        await tx.order.update({
          where: { id: payment.id_order },
          data: { is_paid: true },
        });
      }
    });

    return this.findOne(id);
  }

  /** CMS: rechazar pago. */
  async reject(id: number, reason: string, rejectedBy: string) {
    const payment = await this.findOne(id);
    if (payment.status !== 'PENDING') {
      throw new BadRequestException(
        `Solo se pueden rechazar pagos PENDING (actual: ${payment.status}).`,
      );
    }
    return this.prisma.consignmentPayment.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejected_reason: reason,
        approved_by: rejectedBy,
        approved_at: new Date(),
      },
    });
  }
}
