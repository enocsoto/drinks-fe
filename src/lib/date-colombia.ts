import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const ZONE_COLOMBIA = 'America/Bogota';

/**
 * Fecha de hoy en Colombia (YYYY-MM-DD). Usar para el filtro de ventas.
 */
export function todayColombia(): string {
  return dayjs().tz(ZONE_COLOMBIA).format('YYYY-MM-DD');
}

/** Muestra una fecha YYYY-MM-DD en formato local (Colombia). */
export function formatDayColombia(yyyyMmDd: string): string {
  return dayjs.tz(yyyyMmDd, ZONE_COLOMBIA).format('DD/MM/YYYY');
}

/** Comprueba si la fecha de la venta (ISO) cae en el día calendario Colombia `yyyyMmDd`. */
export function isSaleOnColombiaCalendarDay(saleIsoDate: string, dayYyyyMmDd: string): boolean {
  return dayjs(saleIsoDate).tz(ZONE_COLOMBIA).format('YYYY-MM-DD') === dayYyyyMmDd;
}

/**
 * Formatea una fecha ISO o Date en hora Colombia (es-CO).
 * Si solo se quiere mostrar la fecha del día, usar saleDate cuando exista.
 */
export function formatDateTimeColombia(dateStr: string | Date): string {
  return dayjs(dateStr).tz(ZONE_COLOMBIA).format('DD MMM YYYY, HH:mm');
}

/**
 * Misma convención que el backend (`getLastDaysColombia`): últimos N días en Colombia,
 * del más antiguo al más reciente, etiqueta `D/M` como en analytics (ej. `15/4`).
 * El último elemento es siempre el día calendario “hoy” en Bogotá.
 */
export function getLastDaysColombiaLabels(n: number): string[] {
  const count = Math.max(0, Math.min(n, 366));
  const out: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = dayjs().tz(ZONE_COLOMBIA).subtract(i, 'day');
    out.push(d.format('D/M'));
  }
  return out;
}

/** Conjunto de etiquetas `D/M` de los últimos `dayCount` días calendario (incluye hoy). */
export function getColombiaDayLabelSetForWindow(dayCount: number): Set<string> {
  if (dayCount < 1) return new Set();
  const capped = Math.min(31, dayCount);
  const labels31 = getLastDaysColombiaLabels(31);
  return new Set(labels31.slice(-capped));
}
