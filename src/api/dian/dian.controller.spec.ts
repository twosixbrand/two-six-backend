import { Test, TestingModule } from '@nestjs/testing';
import { DianController } from './dian.controller';

describe('DianController', () => {
  let controller: DianController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DianController],
    }).compile();

    controller = module.get<DianController>(DianController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
