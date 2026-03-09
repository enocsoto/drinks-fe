import type { DrinkType } from './beverage.types';

export interface PendingPaymentDto {
  id: string;
  personName: string;
  nickname: string;
  debtDate: string;
  amount: number;
  drinkTypes: DrinkType[];
  hasGloves: boolean;
  hasPendingGames: boolean;
  description: string;
}

export interface CreatePendingPaymentDto {
  personName: string;
  nickname?: string;
  debtDate: string;
  amount: number;
  drinkTypes?: DrinkType[];
  hasGloves?: boolean;
  hasPendingGames?: boolean;
  description?: string;
}

export interface UpdatePendingPaymentDto {
  personName?: string;
  nickname?: string;
  debtDate?: string;
  amount?: number;
  drinkTypes?: DrinkType[];
  hasGloves?: boolean;
  hasPendingGames?: boolean;
  description?: string;
}

export interface PendingPaymentsPaginatedResponse {
  data: PendingPaymentDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
