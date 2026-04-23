import { apiFetch } from './api-client';
import type {
  CreateSaleCorrectionRequestPayload,
  SaleCorrectionRequestDto,
} from '@/types/sale-correction-request.types';

export async function createSaleCorrectionRequest(
  payload: CreateSaleCorrectionRequestPayload,
): Promise<SaleCorrectionRequestDto> {
  return apiFetch<SaleCorrectionRequestDto>('/sale-correction-requests', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function listSaleCorrectionRequests(): Promise<SaleCorrectionRequestDto[]> {
  return apiFetch<SaleCorrectionRequestDto[]>('/sale-correction-requests');
}

/** Solicitudes del mesero actual (ventas ya solicitadas). */
export async function listMySaleCorrectionRequests(): Promise<SaleCorrectionRequestDto[]> {
  return apiFetch<SaleCorrectionRequestDto[]>('/sale-correction-requests/mine');
}

export async function getPendingCorrectionCount(): Promise<{ count: number }> {
  return apiFetch<{ count: number }>('/sale-correction-requests/pending-count');
}

export async function updateSaleCorrectionRequest(
  id: string,
  status: 'RESOLVED' | 'REJECTED',
): Promise<SaleCorrectionRequestDto> {
  return apiFetch<SaleCorrectionRequestDto>(`/sale-correction-requests/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}
