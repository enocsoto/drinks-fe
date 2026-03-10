import { apiFetch } from './api-client';
import { API_URL, TOKEN_KEY } from '@/lib/constants';
import type {
  BeveragesPaginatedResponse,
  BeverageDto,
  CreateBeverageDto,
  UpdateBeverageDto,
} from '@/types/beverage.types';

export interface GetBeveragesParams {
  page?: number;
  limit?: number;
  search?: string;
  includeInactive?: boolean;
}

export async function getBeverages(params?: GetBeveragesParams): Promise<BeveragesPaginatedResponse> {
  const searchParams = new URLSearchParams();
  if (params?.page != null) searchParams.set('page', String(params.page));
  if (params?.limit != null) searchParams.set('limit', String(params.limit));
  if (params?.search != null && params.search.trim()) searchParams.set('search', params.search.trim());
  if (params?.includeInactive) searchParams.set('includeInactive', 'true');
  const query = searchParams.toString();
  const url = query ? `/beverage?${query}` : '/beverage';
  return apiFetch<BeveragesPaginatedResponse>(url);
}

export async function getBeverage(id: string): Promise<BeverageDto> {
  return apiFetch<BeverageDto>(`/beverage/${encodeURIComponent(id)}`);
}

/** Sube una imagen y devuelve la URL (ej. /beverages/nombre.png) */
export async function uploadBeverageImage(file: File): Promise<{ imageUrl: string }> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch('/api/beverages/upload', {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error || `Error al subir (${res.status})`);
  }
  return res.json();
}

export async function createBeverage(dto: CreateBeverageDto): Promise<BeverageDto> {
  return apiFetch<BeverageDto>('/beverage', {
    method: 'POST',
    body: JSON.stringify({
      name: dto.name,
      price: Number(dto.price),
      type: dto.type,
      ...(dto.containerType != null && { containerType: dto.containerType }),
      ...(dto.containerSize != null && dto.containerSize.trim() !== '' && { containerSize: dto.containerSize.trim() }),
      ...(dto.imageUrl != null && dto.imageUrl.trim() !== '' && { imageUrl: dto.imageUrl.trim() }),
      ...(dto.stock != null && { stock: Math.max(0, dto.stock) }),
      ...(dto.costPrice != null && { costPrice: Math.max(0, dto.costPrice) }),
    }),
  });
}

export interface ReceiveInventoryDto {
  quantity: number;
  costTotal?: number;
}

export async function receiveInventory(id: string, dto: ReceiveInventoryDto): Promise<BeverageDto> {
  return apiFetch<BeverageDto>(`/beverage/${encodeURIComponent(id)}/receive`, {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export async function updateBeverage(id: string, dto: UpdateBeverageDto): Promise<BeverageDto> {
  return apiFetch<BeverageDto>(`/beverage/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(dto),
  });
}

export async function deleteBeverage(id: string): Promise<void> {
  await apiFetch<void>(`/beverage/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export interface ImportResult {
  created: number;
  updated: number;
  errors: Array<{ row: number; message: string }>;
}

/** Descarga la plantilla Excel para cargar bebidas */
export async function downloadImportTemplate(): Promise<void> {
  const base = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
  const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
  const res = await fetch(`${base}/beverage/import/template`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || `Error al descargar plantilla (${res.status})`);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'plantilla-inventario-bebidas.xlsx';
  a.click();
  URL.revokeObjectURL(url);
}

/** Carga bebidas desde archivo Excel */
export async function importBeveragesFromFile(file: File): Promise<ImportResult> {
  const base = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
  const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${base}/beverage/import`, {
    method: 'POST',
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: formData,
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || `Error ${res.status}`);
  }

  return res.json();
}
