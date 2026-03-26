import { Test, TestingModule } from '@nestjs/testing';
import { SizeGuideController } from './size-guide.controller';
import { SizeGuideService } from './size-guide.service';

describe('SizeGuideController', () => {
  let controller: SizeGuideController;

  const mockSizeGuideService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SizeGuideController],
      providers: [
        { provide: SizeGuideService, useValue: mockSizeGuideService },
      ],
    }).compile();

    controller = module.get<SizeGuideController>(SizeGuideController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
