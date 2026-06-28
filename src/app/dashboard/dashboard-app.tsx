// ==================================================================
//  POS FRONTEND  (Next.js)
//  Dat tai:  src/app/dashboard/dashboard-app.tsx
//  >> CHEP DE (thay file co san)
// ==================================================================

'use client';

import { useCallback, useEffect, useState } from 'react';
import { ArrowLeftRight, Banknote, ShoppingBag, Wallet } from 'lucide-react';
import { api } from '@/lib/api';
import { socketRooms, useSocketEvent } from '@/lib/socket';
import { type MonthlyRevenue, type RevenueSummary, SOCKET_EVENTS } from '@/types';
import { StatCard } from '@/components/dashboard/stat-card';
import { MonthlyRevenueCard } from '@/components/dashboard/monthly-revenue-card';
import { StoreHoursCard } from '@/components/dashboard/store-hours-card';

export function DashboardApp() {
  const [revenue, setRevenue] = useState<RevenueSummary | null>(null);
  const [monthly, setMonthly] = useState<MonthlyRevenue | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Vào phòng admin để nhận số liệu real-time
  useEffect(() => {
    socketRooms.joinAdmin();
  }, []);

  // Tải số liệu ban đầu (hôm nay + tháng này)
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [r, m] = await Promise.all([
          api.getTodayRevenue(),
          api.getMonthlyRevenue(),
        ]);
        if (active) {
          setRevenue(r);
          setMonthly(m);
        }
      } catch (e) {
        if (active) {
          setError(
            e instanceof Error ? e.message : 'Không tải được doanh thu',
          );
        }
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Cập nhật khi có đơn mới chuyển PAID: số hôm nay lấy từ sự kiện,
  // số tháng tải lại (sự kiện chỉ mang số hôm nay).
  const onRevenue = useCallback((r: RevenueSummary) => {
    setRevenue(r);
    void api.getMonthlyRevenue().then(setMonthly).catch(() => {});
  }, []);
  useSocketEvent<RevenueSummary>(SOCKET_EVENTS.REVENUE_UPDATED, onRevenue);

  return (
    <main className="mx-auto min-h-dvh max-w-4xl px-5 py-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">
            Doanh thu hôm nay
          </p>
          <h1 className="text-2xl font-bold">{revenue?.date ?? '—'}</h1>
        </div>
        <span className="flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-70" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success" />
          </span>
          Trực tiếp
        </span>
      </header>

      {error && (
        <p className="mb-4 rounded-xl bg-warning/15 px-4 py-3 text-sm text-warning-foreground">
          {error}
        </p>
      )}

      <div className="grid gap-4">
        <StatCard
          hero
          label="Tổng doanh thu"
          value={revenue?.total ?? 0}
          icon={Wallet}
        />
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Tiền mặt"
            value={revenue?.totalCash ?? 0}
            icon={Banknote}
            tone="cash"
          />
          <StatCard
            label="Chuyển khoản"
            value={revenue?.totalTransfer ?? 0}
            icon={ArrowLeftRight}
            tone="transfer"
          />
          <StatCard
            label="Đơn online (App)"
            value={revenue?.appTotal ?? 0}
            icon={ShoppingBag}
          />
        </div>

        <div className="mt-4">
          <MonthlyRevenueCard data={monthly} />
        </div>

        <div className="mt-4">
          <StoreHoursCard />
        </div>
      </div>
    </main>
  );
}