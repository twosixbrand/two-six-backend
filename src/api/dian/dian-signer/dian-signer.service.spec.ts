import { Test, TestingModule } from '@nestjs/testing';
import { DianSignerService } from './dian-signer.service';
import { DianService } from '../dian.service';

describe('DianSignerService', () => {
  let service: DianSignerService;

  const mockDianService = {
    getCredentials: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DianSignerService,
        { provide: DianService, useValue: mockDianService },
      ],
    }).compile();

    service = module.get<DianSignerService>(DianSignerService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
