import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Mark a route as public (no JWT required).
 * Used to skip the global JwtAuthGuard on specific endpoints.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
