import { SetMetadata } from '@nestjs/common';

/**
 * Decorator that specifies permissions required to access a route.
 * Usage: @RequirePermissions('accounting.puc.view', 'accounting.journal.view')
 *
 * Works in conjunction with JwtAuthGuard which checks these permissions
 * against the user's JWT payload.
 */
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata('permissions', permissions);
