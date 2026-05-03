import { Test, TestingModule } from '@nestjs/testing';
import { SystemAuditController } from './system-audit.controller';
import { SystemAuditService } from './system-audit.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

describe('SystemAuditController', () => {
  let controller: SystemAuditController;
  let service: SystemAuditService;

  const mockService = {
    findAll: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SystemAuditController],
      providers: [
        { provide: SystemAuditService, useValue: mockService },
      ],
    })
    .overrideGuard(JwtAuthGuard)
    .useValue({ canActivate: () => true })
    .compile();

    controller = module.get<SystemAuditController>(SystemAuditController);
    service = module.get<SystemAuditService>(SystemAuditService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call service.findAll with default limit', async () => {
    const query = { tableName: 'Order' };
    await controller.findAll('Order');
    expect(service.findAll).toHaveBeenCalledWith({
      tableName: 'Order',
      action: undefined,
      startDate: undefined,
      endDate: undefined,
      limit: 100,
    });
  });
});
