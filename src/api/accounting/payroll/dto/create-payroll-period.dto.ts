export class CreatePayrollPeriodDto {
  year: number;
  month: number;
  period_type: string; // QUINCENAL_1, QUINCENAL_2, MENSUAL
  start_date: string;
  end_date: string;
}
