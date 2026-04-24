import { Test, TestingModule } from '@nestjs/testing';
import { CouponController } from './coupon.controller';
import { CouponService } from './coupon.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

describe('CouponController', () => {
  let controller: CouponController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CouponController],
      providers: [
        { provide: CouponService, useValue: {} },
        { provide: JwtService, useValue: {} },
        { provide: ConfigService, useValue: {} },
      ],
    }).compile();

    controller = module.get<CouponController>(CouponController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
