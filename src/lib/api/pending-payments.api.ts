import { apiFetch } from './api-client';
import type {
  PendingPaymentDto,
  CreatePendingPaymentDto,
  UpdatePendingPaymentDto,
  PendingPaymentsPaginatedResponse,
} from '@/types/pending-payment.types';

export interface GetPendingPaymentsParams {
  page?: number;
  limit?: number;
  search?: string;
  debtDateFrom?: string;
  debtDateTo?: string;
}

export async function getPendingPayments(params?: GetPendingPaymentsParams): Promise<PendingPaymentsPaginatedResponse> {
  const searchParams = new URLSearchParams();
  if (params?.page != null) searchParams.set('page', String(params.page));
  if (params?.limit != null) searchParams.set('limit', String(params.limit));
  if (params?.search?.trim()) searchParams.set('search', params.search.trim());
  if (params?.debtDateFrom) searchParams.set('debtDateFrom', params.debtDateFrom);
  if (params?.debtDateTo) searchParams.set('debtDateTo', params.debtDateTo);
  const query = searchParams.toString();
  const url = query ? `/pending-payments?${query}` : '/pending-payments';
  return apiFetch<PendingPaymentsPaginatedResponse>(url);
}

export async function getPendingPayment(id: string): Promise<PendingPaymentDto> {
  return apiFetch<PendingPaymentDto>(`/pending-payments/${encodeURIComponent(id)}`);
}

export async function createPendingPayment(dto: CreatePendingPaymentDto): Promise<PendingPaymentDto> {
  return apiFetch<PendingPaymentDto>('/pending-payments', {
    method: 'POST',
    body: JSON.stringify({
      personName: dto.personName,
      nickname: dto.nickname ?? '',
      debtDate: dto.debtDate,
      amount: dto.amount,
      drinkTypes: dto.drinkTypes ?? [],
      hasGloves: dto.hasGloves ?? false,
      hasPendingGames: dto.hasPendingGames ?? false,
      description: dto.description ?? '',
    }),
  });
}

export async function updatePendingPayment(id: string, dto: UpdatePendingPaymentDto): Promise<PendingPaymentDto> {
  return apiFetch<PendingPaymentDto>(`/pending-payments/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify({
      ...dto,
      nickname: dto.nickname ?? '',
      drinkTypes: dto.drinkTypes ?? [],
      description: dto.description ?? '',
    }),
  });
}

export async function deletePendingPayment(id: string): Promise<void> {
  return apiFetch<void>(`/pending-payments/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}
