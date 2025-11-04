import { Provider as ProviderModel } from '@prisma/client';

export class ProviderEntity implements ProviderModel {
  id: string; // nit
  company_name: string;
  email: string;
  phone: string;
  account_number: string;
  account_type: string;
  bank_name: string;
  createdAt: Date;
  updatedAt: Date | null;
}