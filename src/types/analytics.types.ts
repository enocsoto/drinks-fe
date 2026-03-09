export interface BreakdownItem {
  type: string;
  label: string;
  count: number;
  amount: number;
  percentage: number;
}

export interface BeverageBreakdownItem {
  beverageId: string;
  name: string;
  count: number;
  amount: number;
  percentage: number;
  series: SeriesPoint[];
}

export interface SalesByBeverageResponse {
  totalTicketSales: number;
  totalAmount: number;
  breakdown: BeverageBreakdownItem[];
}

export interface SeriesPoint {
  month: number;
  year: number;
  label: string;
  count: number;
  amount: number;
}

export interface TodaySalesResponse {
  totalSales: number;
  totalAmount: number;
  breakdown: BreakdownItem[];
}

export interface SalesByPeriodResponse {
  totalTicketSales: number;
  totalAmount: number;
  series: SeriesPoint[];
  breakdown: BreakdownItem[];
}

export interface TopSellerItem {
  sellerId: number;
  name: string;
  totalSales: number;
  totalAmount: number;
  percentage: number;
}

export interface TransactionsResponse {
  completed: { count: number; percentage: number };
  pending: { count: number; percentage: number };
  total: number;
}
