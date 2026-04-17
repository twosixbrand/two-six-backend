import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { JournalAutoService } from '../accounting/journal/journal-auto.service';

export interface CreateDispatchDto {
  id_warehouse: number;
  notes?: string;
  items: { id_clothing_size: number; quantity: number }[];
}

export interface ConfirmReceptionItemDto {
  id: number;           // ConsignmentDispatchItem.id
  received_ok: boolean;
  received_qty: number;
  observation?: string;
}

export interface ConfirmReceptionDto {
  received_by: string;
  items?: ConfirmReceptionItemDto[];
}

@Injectable()
export class ConsignmentDispatchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly journalAutoService: JournalAutoService,
  ) {}

  private async nextDispatchNumber(): Promise<string> {
    // Formato: DSP-000001. Usa el max id + 1 para simplicidad; unique garantiza no colisión.
    const last = await this.prisma.consignmentDispatch.findFirst({
      orderBy: { id: 'desc' },
      select: { id: true },
    });
    const next = (last?.id ?? 0) + 1;
    return `DSP-${String(next).padStart(6, '0')}`;
  }

  async create(data: CreateDispatchDto) {
    if (!data.items?.length) {
      throw new BadRequestException('El despacho debe tener al menos 1 ítem.');
    }
    for (const it of data.items) {
      if (!(it.quantity > 0)) {
        throw new BadRequestException('Las cantidades deben ser mayores a 0.');
      }
    }

    const warehouse = await this.prisma.consignmentWarehouse.findUnique({
      where: { id: data.id_warehouse },
    });
    if (!warehouse) {
      throw new NotFoundException(`Bodega #${data.id_warehouse} no encontrada.`);
    }
    if (!warehouse.is_active) {
      throw new BadRequestException('La bodega destino está inactiva.');
    }

    // Valida que exista el clothingSize (sin decrementar stock todavía — sólo al enviar)
    const sizeIds = [...new Set(data.items.map((i) => i.id_clothing_size))];
    const existing = await this.prisma.clothingSize.findMany({
      where: { id: { in: sizeIds } },
      select: { id: true },
    });
    if (existing.length !== sizeIds.length) {
      throw new BadRequestException('Algún id_clothing_size no existe.');
    }

    const dispatch_number = await this.nextDispatchNumber();
    const qr_token = randomUUID();

    return this.prisma.consignmentDispatch.create({
      data: {
        id_warehouse: data.id_warehouse,
        dispatch_number,
        qr_token,
        notes: data.notes,
        items: {
          create: data.items.map((it) => ({
            id_clothing_size: it.id_clothing_size,
            quantity: it.quantity,
          })),
        },
      },
      include: {
        items: { include: { clothingSize: true } },
        warehouse: { include: { customer: true } },
      },
    });
  }

  findAll(filters: { id_warehouse?: number; status?: string } = {}) {
    return this.prisma.consignmentDispatch.findMany({
      where: {
        ...(filters.id_warehouse && { id_warehouse: filters.id_warehouse }),
        ...(filters.status && { status: filters.status as any }),
      },
      include: {
        warehouse: { include: { customer: { select: { id: true, name: true } } } },
        items: true,
      },
      orderBy: { id: 'desc' },
    });
  }

  async findOne(id: number) {
    const d = await this.prisma.consignmentDispatch.findUnique({
      where: { id },
      include: {
        warehouse: { include: { customer: true } },
        items: {
          include: {
            clothingSize: {
              include: {
                size: true,
                clothingColor: {
                  include: {
                    color: true,
                    imageClothing: { orderBy: { position: "asc" as const }, take: 1, select: { image_url: true } },
                    design: { select: { id: true, reference: true, description: true } },
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!d) throw new NotFoundException(`Despacho #${id} no encontrado.`);
    return d;
  }

  async findByToken(token: string) {
    const d = await this.prisma.consignmentDispatch.findUnique({
      where: { qr_token: token },
      include: {
        warehouse: { include: { customer: { select: { id: true, name: true } } } },
        items: {
          include: {
            clothingSize: {
              include: {
                size: true,
                clothingColor: {
                  include: {
                    color: true,
                    imageClothing: { orderBy: { position: "asc" as const }, take: 1, select: { image_url: true } },
                    design: { select: { id: true, reference: true, description: true } },
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!d) throw new NotFoundException('Despacho no encontrado.');
    // En endpoint público exponemos solo lo mínimo
    return {
      id: d.id,
      dispatch_number: d.dispatch_number,
      status: d.status,
      sent_at: d.sent_at,
      received_at: d.received_at,
      received_by: d.received_by,
      notes: d.notes,
      warehouse: {
        id: d.warehouse.id,
        name: d.warehouse.name,
        customer_name: d.warehouse.customer.name,
      },
      items: d.items.map((it) => ({
        id: it.id,
        quantity: it.quantity,
        received_ok: it.received_ok,
        received_qty: it.received_qty,
        observation: it.observation,
        reference: it.clothingSize.clothingColor.design.reference,
        description: it.clothingSize.clothingColor.design.description,
        color: it.clothingSize.clothingColor.color.name,
        size: it.clothingSize.size.name,
        image_url: (it.clothingSize.clothingColor as any).imageClothing?.[0]?.image_url ?? null,
      })),
    };
  }

  /**
   * Dry-run antes de enviar: compara las cantidades del borrador contra
   * el stock disponible actual. Retorna cada ítem con:
   *  - requested: lo que pedía el borrador
   *  - available: lo que hay ahora
   *  - adjusted: min(requested, available)
   *  - changed: true si adjusted != requested
   * El CMS usa esto para mostrar una alerta y pedir confirmación.
   */
  async preSend(id: number) {
    const dispatch = await this.prisma.consignmentDispatch.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            clothingSize: {
              include: {
                size: true,
                clothingColor: {
                  include: {
                    color: true,
                    imageClothing: { orderBy: { position: "asc" as const }, take: 1, select: { image_url: true } },
                    design: { select: { reference: true } },
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!dispatch) throw new NotFoundException(`Despacho #${id} no encontrado.`);
    if (dispatch.status !== 'PENDIENTE') {
      throw new ConflictException(`Solo se pueden enviar despachos PENDIENTE (actual: ${dispatch.status}).`);
    }

    let hasChanges = false;
    const items = await Promise.all(
      dispatch.items.map(async (item) => {
        const size = await this.prisma.clothingSize.findUnique({
          where: { id: item.id_clothing_size },
          select: { quantity_available: true },
        });
        const available = size?.quantity_available ?? 0;
        const adjusted = Math.min(item.quantity, available);
        const changed = adjusted !== item.quantity;
        if (changed) hasChanges = true;
        return {
          id: item.id,
          id_clothing_size: item.id_clothing_size,
          reference: item.clothingSize.clothingColor.design.reference,
          color: item.clothingSize.clothingColor.color.name,
          size: item.clothingSize.size.name,
          requested: item.quantity,
          available,
          adjusted,
          changed,
        };
      }),
    );

    return {
      dispatch_id: dispatch.id,
      dispatch_number: dispatch.dispatch_number,
      has_changes: hasChanges,
      items,
    };
  }

  /**
   * Envía un despacho PENDIENTE: decrementa quantity_available, crea stock
   * en la bodega destino con status PENDIENTE_RECEPCION, y registra Kardex.
   * Si adjust_to_available=true, ajusta cantidades al stock real antes de enviar.
   */
  async send(id: number, opts: { adjust_to_available?: boolean } = {}) {
    return this.prisma.$transaction(async (tx) => {
      const dispatch = await tx.consignmentDispatch.findUnique({
        where: { id },
        include: { items: true },
      });
      if (!dispatch) throw new NotFoundException(`Despacho #${id} no encontrado.`);
      if (dispatch.status !== 'PENDIENTE') {
        throw new ConflictException(
          `Solo los despachos en estado PENDIENTE pueden enviarse (estado actual: ${dispatch.status}).`,
        );
      }

      for (const item of dispatch.items) {
        const size = await tx.clothingSize.findUnique({
          where: { id: item.id_clothing_size },
        });
        if (!size) {
          throw new NotFoundException(
            `ClothingSize #${item.id_clothing_size} no encontrado.`,
          );
        }
        let qty = item.quantity;
        if (size.quantity_available < qty) {
          if (opts.adjust_to_available) {
            qty = size.quantity_available;
            if (qty <= 0) continue; // sin stock, salta este ítem
            // Ajusta la cantidad en el registro del despacho
            await tx.consignmentDispatchItem.update({
              where: { id: item.id },
              data: { quantity: qty },
            });
          } else {
            throw new BadRequestException(
              `Stock insuficiente para ClothingSize #${item.id_clothing_size}. Disponible: ${size.quantity_available}, requerido: ${item.quantity}.`,
            );
          }
        }

        const balanceBefore = size.quantity_available;
        const balanceAfter = balanceBefore - qty;

        // Decrementa available, incrementa cache on_consignment
        await tx.clothingSize.update({
          where: { id: item.id_clothing_size },
          data: {
            quantity_available: balanceAfter,
            quantity_on_consignment: { increment: qty },
          },
        });

        // Upsert ConsignmentStock (PENDIENTE_RECEPCION)
        const existingStock = await tx.consignmentStock.findUnique({
          where: {
            id_warehouse_id_clothing_size_status: {
              id_warehouse: dispatch.id_warehouse,
              id_clothing_size: item.id_clothing_size,
              status: 'PENDIENTE_RECEPCION',
            },
          },
        });
        if (existingStock) {
          await tx.consignmentStock.update({
            where: { id: existingStock.id },
            data: { quantity: { increment: qty } },
          });
        } else {
          await tx.consignmentStock.create({
            data: {
              id_warehouse: dispatch.id_warehouse,
              id_clothing_size: item.id_clothing_size,
              quantity: qty,
              status: 'PENDIENTE_RECEPCION',
            },
          });
        }

        // Registra Kardex
        await tx.inventoryKardex.create({
          data: {
            id_clothing_size: item.id_clothing_size,
            type: 'OUT',
            source_type: 'CONSIGNMENT_DISPATCH',
            source_id: dispatch.id,
            quantity: qty,
            balance_before: balanceBefore,
            balance_after: balanceAfter,
            description: `Despacho consignación ${dispatch.dispatch_number}`,
          },
        });
      }

      return tx.consignmentDispatch.update({
        where: { id },
        data: { status: 'EN_TRANSITO', sent_at: new Date() },
        include: {
          items: true,
          warehouse: { include: { customer: true } },
        },
      });
    }).then(async (result) => {
      // Asiento contable: reclass 143505 → 143510. Best-effort, no bloquea.
      try {
        await this.journalAutoService.onConsignmentDispatchSent(id);
      } catch (err: any) {
        console.error(
          `[JournalAuto] Error generando asiento de despacho ${id}: ${err.message}`,
        );
      }
      return result;
    });
  }

  /**
   * Confirma la recepción por token (endpoint público escaneable desde el QR).
   * Mueve stock de PENDIENTE_RECEPCION a EN_CONSIGNACION.
   */
  async confirmByToken(token: string, data: ConfirmReceptionDto) {
    if (!data.received_by?.trim()) {
      throw new BadRequestException('Debes indicar quién recibe.');
    }

    return this.prisma.$transaction(async (tx) => {
      const dispatch = await tx.consignmentDispatch.findUnique({
        where: { qr_token: token },
        include: { items: true },
      });
      if (!dispatch) throw new NotFoundException('Despacho no encontrado.');
      if (dispatch.status === 'RECIBIDO') {
        throw new ConflictException('Este despacho ya fue confirmado.');
      }
      if (dispatch.status !== 'EN_TRANSITO') {
        throw new ConflictException(
          `El despacho no está en tránsito (estado actual: ${dispatch.status}).`,
        );
      }

      // Construir mapa de recepción por item_id
      const receptionMap = new Map<number, { received_ok: boolean; received_qty: number; observation?: string }>();
      if (data.items && data.items.length > 0) {
        for (const ri of data.items) {
          receptionMap.set(ri.id, {
            received_ok: ri.received_ok,
            received_qty: ri.received_qty,
            observation: ri.observation?.trim() || undefined,
          });
        }
      }

      for (const item of dispatch.items) {
        // Cantidad que el cliente realmente recibió
        const reception = receptionMap.get(item.id);
        const receivedQty = reception ? reception.received_qty : item.quantity;
        const receivedOk = reception ? reception.received_ok : true;
        const observation = reception?.observation || null;

        // Guardar detalle de recepción en el item
        await tx.consignmentDispatchItem.update({
          where: { id: item.id },
          data: { received_ok: receivedOk, received_qty: receivedQty, observation },
        });

        // Descuenta del bucket PENDIENTE_RECEPCION (siempre la cantidad enviada completa)
        const pending = await tx.consignmentStock.findUnique({
          where: {
            id_warehouse_id_clothing_size_status: {
              id_warehouse: dispatch.id_warehouse,
              id_clothing_size: item.id_clothing_size,
              status: 'PENDIENTE_RECEPCION',
            },
          },
        });
        if (!pending || pending.quantity < item.quantity) {
          throw new BadRequestException(
            `Inconsistencia de stock pendiente para size #${item.id_clothing_size}.`,
          );
        }

        if (pending.quantity === item.quantity) {
          await tx.consignmentStock.delete({ where: { id: pending.id } });
        } else {
          await tx.consignmentStock.update({
            where: { id: pending.id },
            data: { quantity: { decrement: item.quantity } },
          });
        }

        // Solo lo recibido pasa a EN_CONSIGNACION
        if (receivedQty > 0) {
          const active = await tx.consignmentStock.findUnique({
            where: {
              id_warehouse_id_clothing_size_status: {
                id_warehouse: dispatch.id_warehouse,
                id_clothing_size: item.id_clothing_size,
                status: 'EN_CONSIGNACION',
              },
            },
          });
          if (active) {
            await tx.consignmentStock.update({
              where: { id: active.id },
              data: { quantity: { increment: receivedQty } },
            });
          } else {
            await tx.consignmentStock.create({
              data: {
                id_warehouse: dispatch.id_warehouse,
                id_clothing_size: item.id_clothing_size,
                quantity: receivedQty,
                status: 'EN_CONSIGNACION',
              },
            });
          }
        }

        // La diferencia (no recibida) vuelve al stock disponible de Two Six
        const diff = item.quantity - receivedQty;
        if (diff > 0) {
          await tx.clothingSize.update({
            where: { id: item.id_clothing_size },
            data: {
              quantity_available: { increment: diff },
              quantity_on_consignment: { decrement: diff },
            },
          });

          // Kardex: entrada por diferencia no recibida
          const size = await tx.clothingSize.findUnique({
            where: { id: item.id_clothing_size },
          });
          await tx.inventoryKardex.create({
            data: {
              id_clothing_size: item.id_clothing_size,
              type: 'IN',
              source_type: 'CONSIGNMENT_RECEPTION_DIFF',
              source_id: dispatch.id,
              quantity: diff,
              balance_before: (size?.quantity_available ?? 0) - diff,
              balance_after: size?.quantity_available ?? 0,
              description: `Diferencia recepción ${dispatch.dispatch_number}: enviado ${item.quantity}, recibido ${receivedQty}`,
            },
          });
        }
      }

      return tx.consignmentDispatch.update({
        where: { id: dispatch.id },
        data: {
          status: 'RECIBIDO',
          received_at: new Date(),
          received_by: data.received_by.trim(),
        },
      });
    });
  }

  /**
   * Cancela un despacho. Solo permitido si está PENDIENTE (no afectó stock).
   */
  async cancel(id: number) {
    const d = await this.findOne(id);
    if (d.status !== 'PENDIENTE') {
      throw new ConflictException(
        `Solo se pueden cancelar despachos en estado PENDIENTE (actual: ${d.status}). Para revertir un envío usa el flujo de devolución.`,
      );
    }
    return this.prisma.consignmentDispatch.update({
      where: { id },
      data: { status: 'CANCELADO' },
    });
  }

  async remove(id: number) {
    const d = await this.findOne(id);
    if (d.status !== 'PENDIENTE' && d.status !== 'CANCELADO') {
      throw new ConflictException(
        `No se puede eliminar un despacho que ya afectó stock (estado: ${d.status}).`,
      );
    }
    return this.prisma.consignmentDispatch.delete({ where: { id } });
  }
}
