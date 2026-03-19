import { Test, TestingModule } from '@nestjs/testing';
import { DianPdfService } from './dian-pdf.service';

describe('DianPdfService', () => {
  let service: DianPdfService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DianPdfService],
    }).compile();

    service = module.get<DianPdfService>(DianPdfService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
