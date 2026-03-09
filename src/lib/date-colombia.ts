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

/**
 * Formatea una fecha ISO o Date en hora Colombia (es-CO).
 * Si solo se quiere mostrar la fecha del día, usar saleDate cuando exista.
 */
export function formatDateTimeColombia(dateStr: string | Date): string {
  return dayjs(dateStr).tz(ZONE_COLOMBIA).format('DD MMM YYYY, HH:mm');
}
