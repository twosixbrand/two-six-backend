import { Test, TestingModule } from '@nestjs/testing';
import { DianSoapService } from './dian-soap.service';
import { ConfigService } from '@nestjs/config';
import { DianService } from '../dian.service';

describe('DianSoapService', () => {
  let service: DianSoapService;

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockDianService = {
    getCredentials: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DianSoapService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: DianService, useValue: mockDianService },
      ],
    }).compile();

    service = module.get<DianSoapService>(DianSoapService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
