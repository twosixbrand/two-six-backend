import { Test, TestingModule } from '@nestjs/testing';
import { DianService } from './dian.service';

describe('DianService', () => {
  let service: DianService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DianService],
    }).compile();

    service = module.get<DianService>(DianService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
