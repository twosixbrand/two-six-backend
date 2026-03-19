import { Test, TestingModule } from '@nestjs/testing';
import { DianSoapService } from './dian-soap.service';

describe('DianSoapService', () => {
  let service: DianSoapService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DianSoapService],
    }).compile();

    service = module.get<DianSoapService>(DianSoapService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
