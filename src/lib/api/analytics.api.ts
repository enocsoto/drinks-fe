import { apiFetch } from './api-client';
import type {
  TodaySalesResponse,
  SalesByPeriodResponse,
  SalesByBeverageResponse,
  TopSellerItem,
  TransactionsResponse,
} from '@/types/analytics.types';

export async function getTodaySales(): Promise<TodaySalesResponse> {
  return apiFetch<TodaySalesResponse>('/analytics/today');
}

export async function getSalesByPeriod(
  year?: number,
  granularity?: 'month' | 'week' | 'day',
): Promise<SalesByPeriodResponse> {
  const params = new URLSearchParams();
  if (year != null) params.set('year', String(year));
  if (granularity) params.set('granularity', granularity);
  const query = params.toString() ? `?${params.toString()}` : '';
  return apiFetch<SalesByPeriodResponse>(`/analytics/sales-breakdown${query}`);
}

export async function getSalesByBeverage(
  year?: number,
  granularity?: 'month' | 'week' | 'day',
): Promise<SalesByBeverageResponse> {
  const params = new URLSearchParams();
  if (year != null) params.set('year', String(year));
  if (granularity) params.set('granularity', granularity);
  const query = params.toString() ? `?${params.toString()}` : '';
  return apiFetch<SalesByBeverageResponse>(`/analytics/sales-by-beverage${query}`);
}

export async function getTopSellers(year?: number): Promise<TopSellerItem[]> {
  const query = year ? `?year=${year}` : '';
  return apiFetch<TopSellerItem[]>(`/analytics/top-sellers${query}`);
}

export async function getTransactions(): Promise<TransactionsResponse> {
  return apiFetch<TransactionsResponse>('/analytics/transactions');
}
