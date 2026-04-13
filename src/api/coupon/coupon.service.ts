import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';

@Injectable()
export class CouponService {
  constructor(private prisma: PrismaService) {}

  async create(createCouponDto: CreateCouponDto) {
    const existing = await this.prisma.coupon.findUnique({
      where: { code: createCouponDto.code.toUpperCase() }
    });
    if (existing) throw new BadRequestException('El código del cupón ya existe.');

    return this.prisma.coupon.create({
      data: {
        ...createCouponDto,
        code: createCouponDto.code.toUpperCase(),
        valid_from: new Date(createCouponDto.valid_from),
        valid_until: new Date(createCouponDto.valid_until),
      },
    });
  }

  findAll() {
    return this.prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  async findOne(id: number) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { id },
    });
    if (!coupon) throw new NotFoundException('Cupón no encontrado');
    return coupon;
  }

  async findByCode(code: string) {
    return this.prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });
  }

  async update(id: number, updateCouponDto: UpdateCouponDto) {
    await this.findOne(id); // verify

    const data: any = { ...updateCouponDto };
    if (data.code) data.code = data.code.toUpperCase();
    if (data.valid_from) data.valid_from = new Date(data.valid_from);
    if (data.valid_until) data.valid_until = new Date(data.valid_until);

    if (data.code) {
      const existing = await this.prisma.coupon.findFirst({
        where: { code: data.code, id: { not: id } }
      });
      if (existing) throw new BadRequestException('El código ya está en uso');
    }

    return this.prisma.coupon.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.coupon.delete({
      where: { id },
    });
  }
}
