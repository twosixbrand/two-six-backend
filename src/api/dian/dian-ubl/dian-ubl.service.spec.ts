import { Test, TestingModule } from '@nestjs/testing';
import { DianUblService } from './dian-ubl.service';
import { ConfigService } from '@nestjs/config';

describe('DianUblService', () => {
  let service: DianUblService;

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DianUblService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<DianUblService>(DianUblService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
