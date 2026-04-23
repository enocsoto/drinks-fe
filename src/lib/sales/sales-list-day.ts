import { todayColombia } from '@/lib/date-colombia';

/**
 * Día (YYYY-MM-DD) para listar ventas: el que el admin elige, o hoy (Colombia) para vendedor.
 * Si el admin aún no tiene fecha (p. ej. string vacío), se usa hoy.
 */
export function getSalesListDayYyyyMmDd(isAdmin: boolean, adminListDate: string): string {
  if (isAdmin) {
    const t = adminListDate?.trim() ?? '';
    if (t) return t;
  }
  return todayColombia();
}
