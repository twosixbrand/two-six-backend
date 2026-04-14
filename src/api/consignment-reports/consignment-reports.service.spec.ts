import { Test, TestingModule } from '@nestjs/testing';
import { ConsignmentReportsService } from './consignment-reports.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('ConsignmentReportsService', () => {
  let service: ConsignmentReportsService;

  const mockPrisma = {
    customer: { findMany: jest.fn() },
    order: {
      groupBy: jest.fn(),
      findMany: jest.fn(),
    },
    orderItem: { findMany: jest.fn() },
    consignmentReturn: { findMany: jest.fn() },
    consignmentWarehouse: { findMany: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConsignmentReportsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(ConsignmentReportsService);
    jest.clearAllMocks();
  });

  describe('inventoryByCustomer', () => {
    it('aggregates pending + active stock per warehouse and totals per customer', async () => {
      mockPrisma.customer.findMany.mockResolvedValue([
        {
          id: 1,
          name: 'Ally A',
          document_number: '900000000',
          consignmentWarehouses: [
            {
              id: 10,
              name: 'Bodega 1',
              is_active: true,
              stocks: [
                { status: 'PENDIENTE_RECEPCION', quantity: 5 },
                { status: 'EN_CONSIGNACION', quantity: 10 },
                { status: 'EN_CONSIGNACION', quantity: 4 }, // another bucket
              ],
              dispatches: [
                { items: [{ quantity: 3 }, { quantity: 2 }] },
              ],
              returns: [
                { return_type: 'PORTFOLIO', items: [{ quantity: 1 }] },
                { return_type: 'WARRANTY', items: [{ quantity: 2 }] },
              ],
            },
          ],
        },
      ]);
      mockPrisma.order.groupBy.mockResolvedValue([
        { id_customer: 1, _sum: { total_payment: 500000 }, _count: 3 },
      ]);
      mockPrisma.orderItem.findMany.mockResolvedValue([
        { quantity: 2, order: { id_customer: 1 } },
        { quantity: 1, order: { id_customer: 1 } },
      ]);

      const result = await service.inventoryByCustomer();

      expect(result).toHaveLength(1);
      const c = result[0];
      expect(c.totals.sellout_orders).toBe(3);
      expect(c.totals.sellout_total_invoiced).toBe(500000);
      expect(c.totals.sellout_units).toBe(3);
      expect(c.warehouses[0].current_pending_reception).toBe(5);
      expect(c.warehouses[0].current_in_consignment).toBe(14);
      expect(c.warehouses[0].total_dispatched_received).toBe(5);
      expect(c.warehouses[0].total_returned.PORTFOLIO).toBe(1);
      expect(c.warehouses[0].total_returned.WARRANTY).toBe(2);
      expect(c.warehouses[0].total_returned.POST_SALE).toBe(0);
    });
  });

  describe('lossReport', () => {
    it('aggregates merma and warranty totals per customer', async () => {
      mockPrisma.order.findMany.mockResolvedValue([
        {
          id: 1,
          order_reference: 'MERMA-1',
          createdAt: new Date('2026-04-01'),
          total_payment: 100000,
          iva: 19000,
          id_customer: 5,
          customer: { id: 5, name: 'Ally' },
          orderItems: [{ quantity: 2, unit_price: 50000 }],
        },
      ]);
      mockPrisma.consignmentReturn.findMany.mockResolvedValue([
        {
          id: 3,
          processed_at: new Date('2026-04-05'),
          notes: null,
          warehouse: { id: 1, name: 'Bodega', customer: { id: 5, name: 'Ally' } },
          items: [{ quantity: 1 }],
        },
      ]);

      const report = await service.lossReport();
      expect(report.summary.total_merma_orders).toBe(1);
      expect(report.summary.total_merma_units).toBe(2);
      expect(report.summary.total_merma_amount).toBe(100000);
      expect(report.summary.total_warranty_returns).toBe(1);
      expect(report.summary.total_warranty_units).toBe(1);
      expect(report.by_customer).toHaveLength(1);
      expect(report.by_customer[0].merma_units).toBe(2);
      expect(report.by_customer[0].warranty_units).toBe(1);
    });
  });

  describe('pendingReconciliation', () => {
    it('flags warehouses with no approved cycle count as pending', async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 40);
      mockPrisma.consignmentWarehouse.findMany.mockResolvedValue([
        {
          id: 1,
          name: 'Bodega Antigua',
          createdAt: oldDate,
          customer: { id: 5, name: 'Ally' },
          cycleCounts: [],
          stocks: [{ quantity: 20 }],
        },
        {
          id: 2,
          name: 'Bodega Fresca',
          createdAt: new Date(),
          customer: { id: 5, name: 'Ally' },
          cycleCounts: [{ id: 99, approved_at: new Date() }],
          stocks: [{ quantity: 5 }],
        },
      ]);

      const result = await service.pendingReconciliation(30);
      expect(result.pending_count).toBe(1);
      expect(result.warehouses[0].warehouse_id).toBe(1);
      expect(result.warehouses[0].never_counted).toBe(true);
    });
  });
});
