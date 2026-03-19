import { Test, TestingModule } from '@nestjs/testing';
import { DianSignerService } from './dian-signer.service';

describe('DianSignerService', () => {
  let service: DianSignerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DianSignerService],
    }).compile();

    service = module.get<DianSignerService>(DianSignerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
