import type { UserRole, UserStatus } from './enums';

export interface AuthTokens {
  accessToken: string;
  expiresIn: number;
}

export interface JwtPayload {
  sub: string;       // userId
  email: string;
  role: UserRole;
  tokenId?: string;  // present on refresh tokens
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  sub: string;       // userId
  tokenId: string;   // UUID for rotation
  iat?: number;
  exp?: number;
}

export interface LoginResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    status: UserStatus;
    emailVerifiedAt: Date | null;
  };
  accessToken: string;
  expiresIn: number;
}
