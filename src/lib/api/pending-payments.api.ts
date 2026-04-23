import { API_URL } from '@/lib/constants';
import { getStoredToken } from '@/lib/auth-token-storage';
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

/** Descarga el PDF comanda para imprimir (reimprimible). */
export async function openPendingPaymentPdf(id: string): Promise<void> {
  const token = getStoredToken();
  const base = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
  const url = `${base}/pending-payments/${encodeURIComponent(id)}/pdf`;

  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText || 'Error al obtener el PDF');
  }

  const blob = await res.blob();
  const contentType = res.headers.get('Content-Type') ?? blob.type;
  if (blob.size === 0) {
    throw new Error('El PDF recibido está vacío. Comprueba que el backend esté en marcha.');
  }
  if (!contentType.includes('pdf')) {
    throw new Error(`Se esperaba un PDF pero se recibió: ${contentType}`);
  }

  const blobUrl = URL.createObjectURL(new Blob([await blob.arrayBuffer()], { type: 'application/pdf' }));
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = `comanda-pago-pendiente-${id}.pdf`;
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(blobUrl);
}
