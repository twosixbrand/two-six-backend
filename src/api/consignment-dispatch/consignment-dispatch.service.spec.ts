import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { ConsignmentDispatchService } from './consignment-dispatch.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JournalAutoService } from '../accounting/journal/journal-auto.service';

/**
 * Helper: builds a mock "tx" object with the same shape as prisma.
 * $transaction runs the callback with the tx object immediately.
 */
const buildMockPrisma = () => {
  const tx = {
    consignmentDispatch: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
    },
    consignmentDispatchItem: {
      update: jest.fn(),
    },
    consignmentStock: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    clothingSize: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    consignmentWarehouse: {
      findUnique: jest.fn(),
    },
    inventoryKardex: {
      create: jest.fn(),
    },
  };

  const prisma = {
    ...tx,
    $transaction: jest.fn((cb: any) => cb(tx)),
  };

  return { prisma, tx };
};

describe('ConsignmentDispatchService', () => {
  let service: ConsignmentDispatchService;
  let mock: ReturnType<typeof buildMockPrisma>;

  beforeEach(async () => {
    mock = buildMockPrisma();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConsignmentDispatchService,
        { provide: PrismaService, useValue: mock.prisma },
        {
          provide: JournalAutoService,
          useValue: { onConsignmentDispatchSent: jest.fn().mockResolvedValue(null) },
        },
      ],
    }).compile();
    service = module.get(ConsignmentDispatchService);
  });

  describe('create', () => {
    it('rejects empty items array', async () => {
      await expect(
        service.create({ id_warehouse: 1, items: [] }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects non-positive quantities', async () => {
      await expect(
        service.create({ id_warehouse: 1, items: [{ id_clothing_size: 1, quantity: 0 }] }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects missing warehouse', async () => {
      mock.prisma.consignmentWarehouse.findUnique.mockResolvedValue(null);
      await expect(
        service.create({ id_warehouse: 99, items: [{ id_clothing_size: 1, quantity: 1 }] }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects inactive warehouse', async () => {
      mock.prisma.consignmentWarehouse.findUnique.mockResolvedValue({ id: 1, is_active: false });
      await expect(
        service.create({ id_warehouse: 1, items: [{ id_clothing_size: 1, quantity: 1 }] }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('creates dispatch in PENDIENTE with generated dispatch_number and qr_token', async () => {
      mock.prisma.consignmentWarehouse.findUnique.mockResolvedValue({ id: 1, is_active: true });
      mock.prisma.clothingSize.findMany.mockResolvedValue([{ id: 10 }, { id: 11 }]);
      mock.prisma.consignmentDispatch.findFirst.mockResolvedValue({ id: 5 });
      mock.prisma.consignmentDispatch.create.mockImplementation(({ data }: any) => ({
        id: 6,
        ...data,
      }));

      const result = await service.create({
        id_warehouse: 1,
        items: [
          { id_clothing_size: 10, quantity: 2 },
          { id_clothing_size: 11, quantity: 1 },
        ],
      });

      expect(result.dispatch_number).toBe('DSP-000006');
      expect(result.qr_token).toBeDefined();
      expect(result.qr_token.length).toBeGreaterThan(10);
    });
  });

  describe('send', () => {
    it('refuses sending when not PENDIENTE', async () => {
      mock.tx.consignmentDispatch.findUnique.mockResolvedValue({
        id: 1,
        status: 'EN_TRANSITO',
        items: [],
      });
      await expect(service.send(1)).rejects.toBeInstanceOf(ConflictException);
    });

    it('refuses sending when stock insufficient', async () => {
      mock.tx.consignmentDispatch.findUnique.mockResolvedValue({
        id: 1,
        status: 'PENDIENTE',
        id_warehouse: 2,
        dispatch_number: 'DSP-0001',
        items: [{ id_clothing_size: 10, quantity: 5 }],
      });
      mock.tx.clothingSize.findUnique.mockResolvedValue({ id: 10, quantity_available: 2 });

      await expect(service.send(1)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('transitions PENDIENTE → EN_TRANSITO and decrements available + creates pending stock + kardex', async () => {
      mock.tx.consignmentDispatch.findUnique.mockResolvedValue({
        id: 1,
        status: 'PENDIENTE',
        id_warehouse: 2,
        dispatch_number: 'DSP-0001',
        items: [{ id_clothing_size: 10, quantity: 3 }],
      });
      mock.tx.clothingSize.findUnique.mockResolvedValue({ id: 10, quantity_available: 10 });
      mock.tx.consignmentStock.findUnique.mockResolvedValue(null); // no stock existente
      mock.tx.consignmentDispatch.update.mockResolvedValue({ id: 1, status: 'EN_TRANSITO' });

      await service.send(1);

      expect(mock.tx.clothingSize.update).toHaveBeenCalledWith({
        where: { id: 10 },
        data: expect.objectContaining({
          quantity_available: 7,
          quantity_on_consignment: { increment: 3 },
        }),
      });
      expect(mock.tx.consignmentStock.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id_warehouse: 2,
          id_clothing_size: 10,
          quantity: 3,
          status: 'PENDIENTE_RECEPCION',
        }),
      });
      expect(mock.tx.inventoryKardex.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'OUT',
          source_type: 'CONSIGNMENT_DISPATCH',
          quantity: 3,
        }),
      });
      expect(mock.tx.consignmentDispatch.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'EN_TRANSITO' }) }),
      );
    });
  });

  describe('confirmByToken', () => {
    it('refuses empty received_by', async () => {
      await expect(
        service.confirmByToken('tok', { received_by: '   ' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('refuses when dispatch already received', async () => {
      mock.tx.consignmentDispatch.findUnique.mockResolvedValue({
        id: 1,
        status: 'RECIBIDO',
        items: [],
      });
      await expect(
        service.confirmByToken('tok', { received_by: 'Juan' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('moves stock from PENDIENTE_RECEPCION → EN_CONSIGNACION on confirm', async () => {
      mock.tx.consignmentDispatch.findUnique.mockResolvedValue({
        id: 1,
        status: 'EN_TRANSITO',
        id_warehouse: 2,
        items: [{ id_clothing_size: 10, quantity: 2 }],
      });
      // pending bucket
      mock.tx.consignmentStock.findUnique
        .mockResolvedValueOnce({ id: 100, quantity: 5 }) // pending lookup
        .mockResolvedValueOnce(null); // active lookup → no existe
      mock.tx.consignmentDispatch.update.mockResolvedValue({
        id: 1,
        status: 'RECIBIDO',
      });

      await service.confirmByToken('tok', { received_by: 'Juan' });

      // Debe decrementar pending (5 → 3, no eliminar)
      expect(mock.tx.consignmentStock.update).toHaveBeenCalledWith({
        where: { id: 100 },
        data: { quantity: { decrement: 2 } },
      });
      // Debe crear el bucket EN_CONSIGNACION
      expect(mock.tx.consignmentStock.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id_warehouse: 2,
          id_clothing_size: 10,
          quantity: 2,
          status: 'EN_CONSIGNACION',
        }),
      });
      expect(mock.tx.consignmentDispatch.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'RECIBIDO',
            received_by: 'Juan',
          }),
        }),
      );
    });
  });

  describe('cancel', () => {
    it('cancels draft dispatches only', async () => {
      mock.prisma.consignmentDispatch.findUnique.mockResolvedValue({
        id: 1,
        status: 'EN_TRANSITO',
      });
      await expect(service.cancel(1)).rejects.toBeInstanceOf(ConflictException);
    });
  });
});
