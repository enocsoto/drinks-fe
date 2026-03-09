export interface DailyClosingItem {
  beverageName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface DailyClosingData {
  date: string;
  generatedAt: string;
  items: DailyClosingItem[];
  totalQuantity: number;
  totalAmount: number;
  totalTransactions: number;
}
