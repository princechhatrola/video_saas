import { SetMetadata } from '@nestjs/common';
import type { UserRole } from '@videoforge/shared-types';

export const ROLES_KEY = 'roles';

/**
 * Restrict a route to specific roles.
 * Must be used together with RolesGuard.
 * Usage: @Roles(UserRole.ADMIN)
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
