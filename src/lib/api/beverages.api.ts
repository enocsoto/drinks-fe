import { apiFetch } from './api-client';
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
}

export async function getBeverages(params?: GetBeveragesParams): Promise<BeveragesPaginatedResponse> {
  const searchParams = new URLSearchParams();
  if (params?.page != null) searchParams.set('page', String(params.page));
  if (params?.limit != null) searchParams.set('limit', String(params.limit));
  if (params?.search != null && params.search.trim()) searchParams.set('search', params.search.trim());
  const query = searchParams.toString();
  const url = query ? `/beverage?${query}` : '/beverage';
  return apiFetch<BeveragesPaginatedResponse>(url);
}

export async function getBeverage(id: string): Promise<BeverageDto> {
  return apiFetch<BeverageDto>(`/beverage/${encodeURIComponent(id)}`);
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
    }),
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
