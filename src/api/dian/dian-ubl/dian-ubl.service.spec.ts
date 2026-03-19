import { Test, TestingModule } from '@nestjs/testing';
import { DianUblService } from './dian-ubl.service';

describe('DianUblService', () => {
  let service: DianUblService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DianUblService],
    }).compile();

    service = module.get<DianUblService>(DianUblService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
