import { apiFetch } from './api-client';
import type { LoginDto, LoginResponse } from '@/types/user.types';
import { TOKEN_KEY } from '@/lib/constants';
import { getStoredToken, removeStoredToken, setStoredToken } from '@/lib/auth-token-storage';

function setTokenCookie(token: string): void {
  document.cookie = `${TOKEN_KEY}=${token}; path=/; SameSite=Lax`;
}

function clearTokenCookie(): void {
  document.cookie = `${TOKEN_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
}

export async function login(dto: LoginDto): Promise<LoginResponse> {
  const payload = { ...dto, document: Number(dto.document) };
  const response = await apiFetch<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (typeof window !== 'undefined') {
    setStoredToken(response.access_token);
    setTokenCookie(response.access_token);
  }
  return response;
}

export function logout(): void {
  if (typeof window !== 'undefined') {
    removeStoredToken();
    clearTokenCookie();
  }
}

export function getToken(): string | null {
  return getStoredToken();
}

export function isAuthenticated(): boolean {
  return !!getToken();
}
