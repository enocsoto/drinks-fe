export type SaleCorrectionRequestStatus = 'PENDING' | 'RESOLVED' | 'REJECTED';

export interface SaleCorrectionRequestDto {
  id: string;
  saleId: string;
  requestedByDocument: number;
  /** Nombre del mesero (solo listado admin, si existe en usuarios). */
  requestedByName?: string | null;
  reason?: string;
  status: SaleCorrectionRequestStatus;
  resolvedByDocument?: number;
  resolvedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateSaleCorrectionRequestPayload {
  saleId: string;
  reason?: string;
}
