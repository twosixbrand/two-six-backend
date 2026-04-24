import { Test, TestingModule } from '@nestjs/testing';
import { CouponService } from './coupon.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('CouponService', () => {
  let service: CouponService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CouponService, { provide: PrismaService, useValue: {} }],
    }).compile();

    service = module.get<CouponService>(CouponService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
