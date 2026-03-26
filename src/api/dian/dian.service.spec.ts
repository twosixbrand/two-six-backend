import { Test, TestingModule } from '@nestjs/testing';
import { DianService } from './dian.service';
import { ConfigService } from '@nestjs/config';

describe('DianService', () => {
  let service: DianService;

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DianService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<DianService>(DianService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
