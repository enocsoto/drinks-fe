import { apiFetch } from './api-client';
import type { CreateSaleDto, SalesListResponse, UpdateSalePayload, SaleDto } from '@/types/sale.types';

export async function getSales(date?: string): Promise<SalesListResponse> {
  const params = date ? `?date=${encodeURIComponent(date)}` : '';
  return apiFetch<SalesListResponse>(`/sales${params}`);
}

export async function createSale(
  dto: CreateSaleDto,
): Promise<{ sale: Record<string, unknown>; detail: Record<string, unknown> }> {
  return apiFetch<{ sale: Record<string, unknown>; detail: Record<string, unknown> }>('/sales', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

/** Admin: venta por id MongoDB (detalle con bebida poblada cuando aplica). */
export async function getSaleByIdForAdmin(id: string): Promise<SaleDto> {
  return apiFetch<SaleDto>(`/sales/detail/${encodeURIComponent(id)}`);
}

export async function updateSale(id: string, payload: UpdateSalePayload): Promise<SaleDto> {
  return apiFetch<SaleDto>(`/sales/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}
