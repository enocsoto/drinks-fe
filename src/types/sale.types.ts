import type { BeverageDto } from './beverage.types';

export type SaleDetailType = 'BEVERAGE' | 'GLOVES' | 'GAME';

export const SALE_DETAIL_TYPE_LABELS: Record<SaleDetailType, string> = {
  BEVERAGE: 'Bebida (cerveza, gaseosa, aguardiente)',
  GLOVES: 'Guantes',
  GAME: 'Juego (chicos / buchacara)',
};

export interface SaleDetailDto {
  id?: string;
  type: SaleDetailType;
  beverageId?: string;
  beverage?: BeverageDto & { name?: string; type?: string; price?: number };
  description?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface SaleDto {
  id: string;
  userDocument: number;
  tableNumber?: number;
  user?: { document: number; name: string } | null;
  totalPrice: number;
  DateSale: string;
  details?: SaleDetailDto[];
}

export interface CreateSaleDto {
  tableNumber: number;
  lineType: SaleDetailType;
  beverageId?: string;
  quantity: number;
  unitPrice?: number;
  description?: string;
  sellerId?: number;
  /** Solo admin en backend: fecha de la venta (YYYY-MM-DD) en Colombia. */
  saleDate?: string;
}

export interface SalesListResponse {
  sales: SaleDto[];
  summary: Array<{ sellerId: number; name?: string; totalQuantity: number }>;
}

/** Cuerpo para PATCH /sales/:id (admin). Ajusta cantidad, bebida o precio según el detalle. */
export interface UpdateSalePayload {
  quantity?: number;
  beverageId?: string;
  unitPrice?: number;
  tableNumber?: number;
  sellerId?: number;
  changeDescription?: string;
}

/** Tipos de detalle considerados "bebidas" */
export const BEVERAGE_DETAIL_TYPES: SaleDetailType[] = ['BEVERAGE'];

/** Tipos de detalle considerados "billar" (guantes, juegos) */
export const BILLIARD_DETAIL_TYPES: SaleDetailType[] = ['GLOVES', 'GAME'];

export function isBeverageDetail(d: SaleDetailDto): boolean {
  return d.type === 'BEVERAGE';
}

export function isBilliardDetail(d: SaleDetailDto): boolean {
  return d.type === 'GLOVES' || d.type === 'GAME';
}

export function filterBeverageDetails(details: SaleDetailDto[] = []): SaleDetailDto[] {
  return details.filter(isBeverageDetail);
}

export function filterBilliardDetails(details: SaleDetailDto[] = []): SaleDetailDto[] {
  return details.filter(isBilliardDetail);
}

export function saleHasBeverageDetails(sale: SaleDto): boolean {
  return (sale.details ?? []).some(isBeverageDetail);
}

export function saleHasBilliardDetails(sale: SaleDto): boolean {
  return (sale.details ?? []).some(isBilliardDetail);
}
