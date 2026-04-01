'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import {
  getTodaySales,
  getSalesByPeriod,
  getSalesByBeverage,
  getTransactions,
} from '@/lib/api/analytics.api';
import { ApiError } from '@/lib/api/api-client';
import type {
  TodaySalesResponse,
  SalesByPeriodResponse,
  SalesByBeverageResponse,
  TransactionsResponse,
} from '@/types/analytics.types';
import { SalesMetricsCards } from './_components/sales-metrics-cards';
import { TransactionsCard } from './_components/transactions-card';
import { SalesBreakdownCard } from './_components/sales-breakdown-card';
import { MonthlyRetentionCard } from './_components/monthly-retention-card';
import { DashboardToolbar } from './_components/dashboard-toolbar';
import { BeverageDonutCard } from './_components/beverage-donut-card';

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
  const [transactions, setTransactions] = useState<TransactionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [periodTab, setPeriodTab] = useState(2);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [todayRes, periodRes, monthBevRes, weekBevRes, dayBevRes, transRes] = await Promise.allSettled([
        getTodaySales(),
        getSalesByPeriod(),
        getSalesByBeverage(),
        getSalesByBeverage(undefined, 'week'),
        getSalesByBeverage(undefined, 'day'),
        getTransactions(),
      ]);

      const results = [todayRes, periodRes, monthBevRes, weekBevRes, dayBevRes, transRes];
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
      setTransactions(null);
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const donutData =
    periodTab === 0
      ? beverageDay
      : periodTab === 1
        ? beverageWeek
        : beverageMonth;

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 animate-fadeIn">
      {/* Cabecera estilo mockup: saludo + búsqueda + acciones */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] md:text-3xl">
            Hola{user?.name?.trim() ? `, ${user.name.trim()}` : ''}!
          </h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Resumen de ventas — Los Amigos
          </p>
        </div>

        <div className="flex w-full flex-1 flex-col gap-3 sm:flex-row sm:items-center lg:max-w-xl lg:justify-end">
          <label className="relative block w-full min-w-0 sm:max-w-md">
            <span className="sr-only">Buscar</span>
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </span>
            <input
              type="search"
              placeholder="Buscar bebidas, métricas…"
              className="w-full rounded-full border border-[var(--border)] bg-[var(--bg-elevated)] py-3 pl-12 pr-4 text-sm text-[var(--text-primary)] shadow-sm outline-none transition-shadow placeholder:text-[var(--text-muted)] focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/20"
              readOnly
              title="Próximamente"
              aria-readonly
            />
          </label>
        </div>
      </div>

      <DashboardToolbar
        periodTab={periodTab}
        onPeriodTabChange={setPeriodTab}
        onExportPdf={() => window.print()}
      />

      <SalesMetricsCards
        todaySales={todaySales}
        beverageDay={beverageDay}
        beverageMonth={beverageMonth}
        period={period}
        periodTab={periodTab}
        loading={loading}
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <BeverageDonutCard data={donutData} loading={loading} />
        <TransactionsCard data={transactions} loading={loading} onRefresh={loadData} />
      </div>

      <SalesBreakdownCard
        dataMonth={beverageMonth}
        dataWeek={beverageWeek}
        dataDay={beverageDay}
        loading={loading}
        periodTab={periodTab}
        onPeriodTabChange={setPeriodTab}
      />

      <MonthlyRetentionCard data={period} loading={loading} />
    </div>
  );
}
