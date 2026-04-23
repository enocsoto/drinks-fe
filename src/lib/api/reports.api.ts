import { API_URL } from '@/lib/constants';
import { getStoredToken } from '@/lib/auth-token-storage';
import { apiFetch } from './api-client';
import type { DailyClosingData } from '@/types/reports.types';

/**
 * Obtiene los datos del cierre del día (cuadre) para mostrar en la UI.
 * @param date Fecha en YYYY-MM-DD; si no se pasa, el backend usa hoy.
 */
export async function getDailyClosingData(date?: string): Promise<DailyClosingData> {
  const path = date ? `reports/daily-closing/data?date=${encodeURIComponent(date)}` : 'reports/daily-closing/data';
  return apiFetch<DailyClosingData>(path);
}

/**
 * Descarga el PDF del cierre del día. Abre la URL con el token en un way que
 * provoca la descarga del archivo (blob).
 */
export async function downloadDailyClosingPdf(date?: string): Promise<void> {
  const token = getStoredToken();
  const params = date ? `?date=${encodeURIComponent(date)}` : '';
  const base = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
  const url = `${base}/reports/daily-closing${params}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Error ${res.status} al generar el PDF`);
  }

  const blob = await res.blob();
  const disposition = res.headers.get('Content-Disposition');
  const match = disposition?.match(/filename="?([^";\n]+)"?/);
  const filename = match?.[1] ?? `cierre-del-dia-${date ?? new Date().toISOString().split('T')[0]}.pdf`;

  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}
