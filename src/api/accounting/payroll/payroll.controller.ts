import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  Param,
  ParseIntPipe,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { PayrollService } from './payroll.service';
import {
  PayrollNovedadService,
  CreateNovedadDto,
} from './payroll-novedad.service';
import { PilaService } from './pila.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { CreatePayrollPeriodDto } from './dto/create-payroll-period.dto';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('accounting/payroll')
export class PayrollController {
  constructor(
    private readonly payrollService: PayrollService,
    private readonly novedadService: PayrollNovedadService,
    private readonly pilaService: PilaService,
  ) {}

  // ── Employees ──────────────────────────────────────────────

  @Get('employees')
  findAllEmployees(@Query('is_active') isActive?: string) {
    return this.payrollService.findAllEmployees({ is_active: isActive });
  }

  @Get('employees/:id')
  findOneEmployee(@Param('id', ParseIntPipe) id: number) {
    return this.payrollService.findOneEmployee(id);
  }

  @Post('employees')
  createEmployee(@Body() dto: CreateEmployeeDto) {
    return this.payrollService.createEmployee(dto);
  }

  @Patch('employees/:id')
  updateEmployee(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEmployeeDto,
  ) {
    return this.payrollService.updateEmployee(id, dto);
  }

  // ── Payroll Periods ────────────────────────────────────────

  @Get('periods')
  findAllPeriods() {
    return this.payrollService.findAllPeriods();
  }

  @Get('periods/:id')
  findOnePeriod(@Param('id', ParseIntPipe) id: number) {
    return this.payrollService.findOnePeriod(id);
  }

  @Post('periods')
  createPeriod(@Body() dto: CreatePayrollPeriodDto) {
    return this.payrollService.createPeriod(dto);
  }

  @Post('periods/:id/calculate')
  calculatePeriod(@Param('id', ParseIntPipe) id: number) {
    return this.payrollService.calculatePeriod(id);
  }

  @Post('periods/:id/approve')
  approvePeriod(@Param('id', ParseIntPipe) id: number) {
    return this.payrollService.approvePeriod(id);
  }

  // ── Novedades ──────────────────────────────────────────────

  @Get('periods/:id/novedades')
  findNovedadesByPeriod(@Param('id', ParseIntPipe) id: number) {
    return this.novedadService.findByPeriod(id);
  }

  @Post('novedades')
  createNovedad(@Body() dto: CreateNovedadDto) {
    return this.novedadService.create(dto);
  }

  @Patch('novedades/:id')
  updateNovedad(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateNovedadDto>,
  ) {
    return this.novedadService.update(id, dto);
  }

  @Delete('novedades/:id')
  deleteNovedad(@Param('id', ParseIntPipe) id: number) {
    return this.novedadService.remove(id);
  }

  // ── PILA ───────────────────────────────────────────────────

  /**
   * Genera el archivo PILA del período aprobado y lo devuelve como descarga.
   * El NIT del empleador se toma del query param o de DIAN_COMPANY_NIT.
   */
  @Get('pila/:year/:month')
  async generatePila(
    @Param('year', ParseIntPipe) year: number,
    @Param('month', ParseIntPipe) month: number,
    @Query('nit') nit: string | undefined,
    @Res() res: Response,
  ) {
    const employerNit = nit || process.env.DIAN_COMPANY_NIT || '900000000';
    const result = await this.pilaService.generatePila(
      year,
      month,
      employerNit,
    );
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${result.filename}"`,
    );
    res.setHeader('X-Pila-Cotizantes', String(result.summary.cotizantes));
    res.setHeader('X-Pila-Total', String(result.summary.total_aportes));
    res.send(result.content);
  }
}
