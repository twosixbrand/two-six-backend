export class CreateEmployeeDto {
  document_number: string;
  id_identification_type: number;
  name: string;
  position: string;
  department?: string;
  hire_date: string;
  base_salary: number;
  transport_allowance?: number;
  eps_entity?: string;
  pension_fund?: string;
  arl_risk_level?: number;
  bank_name?: string;
  bank_account?: string;
}
