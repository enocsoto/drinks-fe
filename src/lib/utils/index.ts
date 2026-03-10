import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function formatCOP(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateString: string): string {
  // Evitar desfases por UTC cuando viene "YYYY-MM-DD" sin hora:
  // forzamos una hora neutra local para que no retroceda de día.
  const safe =
    typeof dateString === 'string' && dateString && !dateString.includes('T')
      ? `${dateString}T12:00:00`
      : dateString;
  return new Intl.DateTimeFormat('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(safe));
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
