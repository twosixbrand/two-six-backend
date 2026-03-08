import { Test, TestingModule } from '@nestjs/testing';
import { SizeGuideService } from './size-guide.service';

describe('SizeGuideService', () => {
  let service: SizeGuideService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SizeGuideService],
    }).compile();

    service = module.get<SizeGuideService>(SizeGuideService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
