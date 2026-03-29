import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { PayrollService } from './payroll.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { CreatePayrollPeriodDto } from './dto/create-payroll-period.dto';

@Controller('accounting/payroll')
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

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
}
