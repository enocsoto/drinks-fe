import type { AuthUser, UserRole } from '@/types/user.types';

interface JwtPayload {
  sub: string;
  name?: string;
  document: number | string;
  role: UserRole | UserRole[];
  iat?: number;
  exp?: number;
}

/** Decodifica segmento JWT (base64url) como JSON UTF-8. `atob`+`JSON.parse` rompe tildes y eñes. */
function parseJwtJsonSegment<T>(base64UrlSegment: string): T {
  const base64 = base64UrlSegment.replace(/-/g, '+').replace(/_/g, '/');
  const padLen = (4 - (base64.length % 4)) % 4;
  const padded = base64 + '='.repeat(padLen);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const json = new TextDecoder('utf-8').decode(bytes);
  return JSON.parse(json) as T;
}

export function jwtDecode(token: string): AuthUser {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Token inválido');

  const payload: JwtPayload = parseJwtJsonSegment<JwtPayload>(parts[1]);

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
    const payload: JwtPayload = parseJwtJsonSegment<JwtPayload>(parts[1]);
    if (payload.exp === undefined) return true;
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
}
