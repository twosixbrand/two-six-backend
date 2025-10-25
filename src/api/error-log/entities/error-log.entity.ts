export class ErrorLog {
  id: number;
  message: string;
  stack: string | null;
  componentStack: string | null;
  app: string | null;
  page: string | null;
  createdAt: Date;
}
