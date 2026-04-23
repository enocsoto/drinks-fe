import { TOKEN_KEY } from '@/lib/constants';

function readTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const m = document.cookie.match(new RegExp(`(?:^|;\\s*)${TOKEN_KEY}=([^;]*)`));
  return m?.[1] ? decodeURIComponent(m[1]) : null;
}

/**
 * JWT en sessionStorage: al cerrar la pestaña se pierde el almacén; la cookie de sesión
 * (misma clave) permite rehidratar el token en una pestaña nueva hasta que expire la cookie.
 * Migración única desde localStorage (versiones anteriores).
 */
export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    let token = sessionStorage.getItem(TOKEN_KEY);
    if (!token) {
      const legacy = localStorage.getItem(TOKEN_KEY);
      if (legacy) {
        sessionStorage.setItem(TOKEN_KEY, legacy);
        localStorage.removeItem(TOKEN_KEY);
        token = legacy;
      }
    }
    if (!token) {
      const fromCookie = readTokenFromCookie();
      if (fromCookie) {
        sessionStorage.setItem(TOKEN_KEY, fromCookie);
        token = fromCookie;
      }
    }
    return token;
  } catch {
    return null;
  }
}

export function setStoredToken(token: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.setItem(TOKEN_KEY, token);
  } catch {
    // ignore
  }
}

export function removeStoredToken(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}
