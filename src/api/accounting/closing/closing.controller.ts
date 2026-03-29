import { Controller, Post, Get, Body, BadRequestException } from '@nestjs/common';
import { ClosingService } from './closing.service';

@Controller('accounting/closing')
export class ClosingController {
  constructor(private readonly closingService: ClosingService) {}

  /**
   * POST /accounting/closing/close
   * Close a monthly period
   */
  @Post('close')
  async closePeriod(
    @Body() body: { year: number; month: number; closedBy?: string },
  ) {
    if (!body.year || !body.month) {
      throw new BadRequestException('year y month son requeridos');
    }
    return this.closingService.closePeriod(body.year, body.month, body.closedBy);
  }

  /**
   * POST /accounting/closing/annual
   * Annual closing
   */
  @Post('annual')
  async annualClose(@Body() body: { year: number; closedBy?: string }) {
    if (!body.year) {
      throw new BadRequestException('year es requerido');
    }
    return this.closingService.annualClose(body.year, body.closedBy);
  }

  /**
   * GET /accounting/closing
   * List all closed periods
   */
  @Get()
  async getClosings() {
    return this.closingService.getClosings();
  }
}
