import { Test, TestingModule } from '@nestjs/testing';
import { DianCufeService } from './dian-cufe.service';

describe('DianCufeService', () => {
  let service: DianCufeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DianCufeService],
    }).compile();

    service = module.get<DianCufeService>(DianCufeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
