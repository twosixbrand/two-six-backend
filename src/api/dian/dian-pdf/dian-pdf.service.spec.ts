import { Test, TestingModule } from '@nestjs/testing';
import { DianPdfService } from './dian-pdf.service';
import { ConfigService } from '@nestjs/config';

describe('DianPdfService', () => {
  let service: DianPdfService;

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DianPdfService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<DianPdfService>(DianPdfService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
