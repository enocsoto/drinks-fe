import type { CreateSaleDto } from '@/types/sale.types';

type SaleDateFragment = Pick<CreateSaleDto, 'saleDate'>;

/** Parte de `CreateSaleDto` con `saleDate` solo si el admin definió un día. */
export function optionalSaleDatePayload(saleDateForNewSales?: string): SaleDateFragment {
  const t = saleDateForNewSales?.trim() ?? '';
  if (!t) return {};
  return { saleDate: t };
}
