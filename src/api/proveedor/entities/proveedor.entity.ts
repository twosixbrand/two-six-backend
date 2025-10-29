import { proveedor } from '@prisma/client';

export class ProveedorEntity implements proveedor {
  nit: string;
  razon_social: string;
  direccion: string;
  telefono: string;
  email: string;
  cuenta_bancaria: string;
  tipo_cuenta: string;
  banco: string;
  createdAt: Date;
  updatedAt: Date;
}

