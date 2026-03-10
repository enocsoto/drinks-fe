import { API_URL, TOKEN_KEY } from '@/lib/constants';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Limpia token y cookie cuando la sesión no es válida (401). */
function clearSession(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(TOKEN_KEY);
    document.cookie = `${TOKEN_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
  } catch {
    // ignore
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
  const base = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
  const p = path.startsWith('/') ? path.slice(1) : path;
  const url = `${base}/${p}`;

  const hasBody = init?.body != null && init.body !== '';
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(hasBody && { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const mergedInit: RequestInit = { ...init, headers: { ...headers, ...init?.headers } };

  let res: Response;
  try {
    res = await fetch(url, mergedInit);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg === 'Failed to fetch' || msg.includes('fetch')) {
      throw new Error(
        'No se pudo conectar con el servidor. Comprueba que el backend (drinks-be) esté en marcha y que NEXT_PUBLIC_API_URL o el rewrite apunte al puerto correcto (ej. http://localhost:3001/api).',
      );
    }
    throw err;
  }

  if (res.status === 401) {
    clearSession();
    const body = await res.text();
    throw new ApiError(401, body || res.statusText);
  }

  if (!res.ok) {
    const body = await res.text();
    throw new ApiError(res.status, body || res.statusText);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}
