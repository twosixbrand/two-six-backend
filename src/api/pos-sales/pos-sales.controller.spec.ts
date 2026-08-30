import { Test, TestingModule } from '@nestjs/testing';
import { PosSalesController } from './pos-sales.controller';
import { PosSalesService } from './pos-sales.service';

describe('PosSalesController', () => {
  let controller: PosSalesController;
  let service: PosSalesService;

  const mockPosSalesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    queueBatch: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PosSalesController],
      providers: [{ provide: PosSalesService, useValue: mockPosSalesService }],
    }).compile();

    controller = module.get<PosSalesController>(PosSalesController);
    service = module.get<PosSalesService>(PosSalesService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a POS sale', async () => {
      const payload = { customerName: 'Test' };
      mockPosSalesService.create.mockResolvedValueOnce({ id: 1, ...payload });

      const result = await controller.create(payload);

      expect(service.create).toHaveBeenCalledWith(payload);
      expect(result).toEqual({ id: 1, ...payload });
    });
  });

  describe('findAll', () => {
    it('should return all POS sales', async () => {
      const mockSales = [{ id: 1, customerName: 'Test' }];
      mockPosSalesService.findAll.mockResolvedValueOnce(mockSales);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockSales);
    });
  });

  describe('queueBatchForDian', () => {
    it('should return message if saleIds is empty', async () => {
      const result = await controller.queueBatchForDian({ saleIds: [] });

      expect(result).toEqual({ message: 'No hay ventas para procesar' });
      expect(service.queueBatch).not.toHaveBeenCalled();
    });

    it('should queue sales for DIAN', async () => {
      const payload = { saleIds: [1, 2] };
      mockPosSalesService.queueBatch.mockResolvedValueOnce({
        success: true,
        enqueued: 2,
      });

      const result = await controller.queueBatchForDian(payload);

      expect(service.queueBatch).toHaveBeenCalledWith(payload.saleIds);
      expect(result).toEqual({ success: true, enqueued: 2 });
    });
  });
});
