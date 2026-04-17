import type { PendingPaymentDto } from '@/types/pending-payment.types';
import { DrinkType, DRINK_TYPE_LABELS } from '@/types/beverage.types';

export const PENDING_DRINK_TYPE_OPTIONS = Object.values(DrinkType).map((value) => ({
  value,
  label: DRINK_TYPE_LABELS[value] ?? value,
}));

export function summaryTags(item: PendingPaymentDto): string[] {
  const tags: string[] = [];
  if (item.drinkTypes?.length) {
    tags.push(...item.drinkTypes.map((t) => DRINK_TYPE_LABELS[t] ?? t));
  }
  if (item.hasGloves) tags.push('Guantes');
  if (item.hasPendingGames) tags.push('Juegos');
  return tags;
}
