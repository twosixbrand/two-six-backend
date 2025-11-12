import { DesignProvider } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export class DesignProviderEntity implements DesignProvider {
  id: number;
  id_design: number;
  id_provider: string;
  id_production_type: number;
  start_date: Date | null;
  end_date: Date | null;
  price: Decimal;
  rating: number | null;
  comment: string | null;
  creationDate: Date;
  updateDate: Date | null;
}