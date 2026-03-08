import { Test, TestingModule } from '@nestjs/testing';
import { SizeGuideController } from './size-guide.controller';

describe('SizeGuideController', () => {
  let controller: SizeGuideController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SizeGuideController],
    }).compile();

    controller = module.get<SizeGuideController>(SizeGuideController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
