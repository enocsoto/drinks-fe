import type { UserRole } from '@/types/user.types';

export function getPrimaryUserRole(
  role: UserRole | UserRole[] | undefined | null,
): UserRole | undefined {
  if (role == null) return undefined;
  return Array.isArray(role) ? role[0] : role;
}

export function isUserAdmin(user: { role?: UserRole | UserRole[] } | null | undefined): boolean {
  return getPrimaryUserRole(user?.role) === 'ADMIN';
}
