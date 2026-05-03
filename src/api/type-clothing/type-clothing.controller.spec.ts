import { Test, TestingModule } from '@nestjs/testing';
import { TypeClothingController } from './type-clothing.controller';
import { TypeClothingService } from './type-clothing.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

describe('TypeClothingController', () => {
  let controller: TypeClothingController;
  let service: TypeClothingService;

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TypeClothingController],
      providers: [
        { provide: TypeClothingService, useValue: mockService },
      ],
    })
    .overrideGuard(JwtAuthGuard)
    .useValue({ canActivate: () => true })
    .compile();

    controller = module.get<TypeClothingController>(TypeClothingController);
    service = module.get<TypeClothingService>(TypeClothingService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call service.create', async () => {
    const dto = { id: 'JA', name: 'Jacket' };
    await controller.create(dto);
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('should call service.findAll', async () => {
    await controller.findAll();
    expect(service.findAll).toHaveBeenCalled();
  });

  it('should call service.findOne', async () => {
    await controller.findOne('1');
    expect(service.findOne).toHaveBeenCalledWith('1');
  });

  it('should call service.update', async () => {
    const dto = { name: 'Updated' };
    await controller.update('1', dto);
    expect(service.update).toHaveBeenCalledWith('1', dto);
  });

  it('should call service.remove', async () => {
    await controller.remove('1');
    expect(service.remove).toHaveBeenCalledWith('1');
  });
});
