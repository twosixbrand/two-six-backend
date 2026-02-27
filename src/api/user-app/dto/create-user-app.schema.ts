import { z } from 'zod';

export const createUserAppSchema = z.object({
  login: z.string().min(1).max(255),
  name: z.string().min(1).max(255),
  email: z.string().email(),
  phone: z.string().min(1),
  otp: z.string().length(6).optional().or(z.literal('')),
});

export type CreateUserAppDto = z.infer<typeof createUserAppSchema>;
