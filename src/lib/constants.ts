// En el navegador usamos '/api' para que las peticiones vayan al mismo origen;
// Next.js reescribe /api/* al backend (ver next.config rewrites).
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? (typeof window !== 'undefined' ? '/api' : 'http://localhost:3001/api');

export const TOKEN_KEY = 'drinks_token';

export const USER_ROLES = {
  ADMIN: 'ADMIN',
  SELLER: 'SELLER',
} as const;
