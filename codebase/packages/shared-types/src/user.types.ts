import type { UserRole, UserStatus } from './enums';

export interface UserPreferences {
  language: string;
  timezone: string;
  theme: 'light' | 'dark' | 'system';
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  preferences: UserPreferences;
  emailVerifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
