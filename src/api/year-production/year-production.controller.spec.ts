import { Test, TestingModule } from '@nestjs/testing';
import { YearProductionController } from './year-production.controller';
import { YearProductionService } from './year-production.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { ClsService } from 'nestjs-cls';

describe('YearProductionController', () => {
  let controller: YearProductionController;
  let service: YearProductionService;

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [YearProductionController],
      providers: [
        { provide: YearProductionService, useValue: mockService },
        { provide: JwtService, useValue: {} },
        { provide: ConfigService, useValue: { get: jest.fn() } },
        { provide: Reflector, useValue: {} },
        { provide: ClsService, useValue: {} },
      ],
    }).compile();

    controller = module.get<YearProductionController>(YearProductionController);
    service = module.get<YearProductionService>(YearProductionService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call service.create', async () => {
    const dto = { year: 2024 };
    await controller.create(dto as any);
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
    const dto = { year: 2025 };
    await controller.update('1', dto as any);
    expect(service.update).toHaveBeenCalledWith('1', dto);
  });

  it('should call service.remove', async () => {
    await controller.remove('1');
    expect(service.remove).toHaveBeenCalledWith('1');
  });
});
