import type { AuthUser, UserRole } from '@/types/user.types';

interface JwtPayload {
  sub: string;
  name?: string;
  document: number | string;
  role: UserRole | UserRole[];
  iat?: number;
  exp?: number;
}

export function jwtDecode(token: string): AuthUser {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Token inválido');

  const payload: JwtPayload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));

  const role = Array.isArray(payload.role) ? payload.role[0] : payload.role;
  if (role !== 'ADMIN' && role !== 'SELLER') throw new Error('Rol no válido en el token');

  return {
    id: payload.sub,
    name: payload.name ?? '',
    document: String(payload.document),
    role,
  };
}

export function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split('.');
    const payload: JwtPayload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (payload.exp === undefined) return true;
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
}
