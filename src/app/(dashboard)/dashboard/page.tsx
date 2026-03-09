'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import {
  getTodaySales,
  getSalesByPeriod,
  getSalesByBeverage,
  getTopSellers,
  getTransactions,
} from '@/lib/api/analytics.api';
import { ApiError } from '@/lib/api/api-client';
import type {
  TodaySalesResponse,
  SalesByPeriodResponse,
  SalesByBeverageResponse,
  TopSellerItem,
  TransactionsResponse,
} from '@/types/analytics.types';
import { TodaySalesCard } from './_components/today-sales-card';
import { TransactionsCard } from './_components/transactions-card';
import { SalesBreakdownCard } from './_components/sales-breakdown-card';
import { TopSellersCard } from './_components/top-sellers-card';
import { MonthlyRetentionCard } from './_components/monthly-retention-card';

const EMPTY_PERIOD: SalesByPeriodResponse = {
  totalTicketSales: 0,
  totalAmount: 0,
  series: [],
  breakdown: [],
};

const EMPTY_BEVERAGE: SalesByBeverageResponse = {
  totalTicketSales: 0,
  totalAmount: 0,
  breakdown: [],
};

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [todaySales, setTodaySales] = useState<TodaySalesResponse | null>(null);
  const [period, setPeriod] = useState<SalesByPeriodResponse | null>(null);
  const [beverageMonth, setBeverageMonth] = useState<SalesByBeverageResponse | null>(null);
  const [beverageWeek, setBeverageWeek] = useState<SalesByBeverageResponse | null>(null);
  const [beverageDay, setBeverageDay] = useState<SalesByBeverageResponse | null>(null);
  const [topSellers, setTopSellers] = useState<TopSellerItem[]>([]);
  const [transactions, setTransactions] = useState<TransactionsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [todayRes, periodRes, monthBevRes, weekBevRes, dayBevRes, topRes, transRes] = await Promise.allSettled([
        getTodaySales(),
        getSalesByPeriod(),
        getSalesByBeverage(),
        getSalesByBeverage(undefined, 'week'),
        getSalesByBeverage(undefined, 'day'),
        getTopSellers(),
        getTransactions(),
      ]);

      const results = [todayRes, periodRes, monthBevRes, weekBevRes, dayBevRes, topRes, transRes];
      const has401 = results.some(
        (r) => r.status === 'rejected' && r.reason instanceof ApiError && r.reason.status === 401,
      );
      if (has401) {
        logout();
        return;
      }

      setTodaySales(todayRes.status === 'fulfilled' ? todayRes.value : null);
      setPeriod(periodRes.status === 'fulfilled' ? periodRes.value : EMPTY_PERIOD);
      setBeverageMonth(monthBevRes.status === 'fulfilled' ? monthBevRes.value : EMPTY_BEVERAGE);
      setBeverageWeek(weekBevRes.status === 'fulfilled' ? weekBevRes.value : EMPTY_BEVERAGE);
      setBeverageDay(dayBevRes.status === 'fulfilled' ? dayBevRes.value : EMPTY_BEVERAGE);
      setTopSellers(topRes.status === 'fulfilled' ? (topRes.value ?? []) : []);
      setTransactions(transRes.status === 'fulfilled' ? transRes.value : null);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        logout();
        return;
      }
      setPeriod(EMPTY_PERIOD);
      setBeverageMonth(EMPTY_BEVERAGE);
      setBeverageWeek(EMPTY_BEVERAGE);
      setBeverageDay(EMPTY_BEVERAGE);
      setTodaySales(null);
      setTopSellers([]);
      setTransactions(null);
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Dashboard</h1>
        <p className="text-[var(--text-muted)] text-sm mt-0.5">
          Hola, <span className="font-medium text-[var(--text-secondary)]">{user?.name}</span> — resumen de ventas de
          los Amigos
        </p>
      </div>

      {/* Fila principal */}
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5">
        {/* Columna izquierda */}
        <div className="flex flex-col gap-5">
          <TodaySalesCard data={todaySales} loading={loading} />
          <TransactionsCard data={transactions} loading={loading} onRefresh={loadData} />
        </div>

        {/* Columna centro/derecha */}
        <SalesBreakdownCard dataMonth={beverageMonth} dataWeek={beverageWeek} dataDay={beverageDay} loading={loading} />
      </div>

      {/* Fila inferior */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <TopSellersCard data={topSellers} loading={loading} />
        <MonthlyRetentionCard data={period} loading={loading} />
      </div>
    </div>
  );
}
