// ==================================================================
//  POS FRONTEND  (Next.js)
//  Dat tai:  src/components/dashboard/monthly-revenue-card.tsx
//  >> FILE MOI (tao moi)
// ==================================================================

'use client';

import { TrendingUp } from 'lucide-react';
import { formatNumber, formatVnd } from '@/lib/format';
import { type MonthlyRevenue } from '@/types';

function monthLabel(m: string): string {
  const [y, mo] = m.split('-');
  return mo ? `Tháng ${Number(mo)}/${y}` : '—';
}

function Sub({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-background px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-bold tabular">{value}</p>
    </div>
  );
}

export function MonthlyRevenueCard({ data }: { data: MonthlyRevenue | null }) {
  return (
    <div className="rounded-2xl border-2 border-border bg-card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">
            Doanh thu tháng này
          </p>
          <h2 className="text-xl font-bold">
            {data ? monthLabel(data.month) : '—'}
          </h2>
        </div>
        <TrendingUp className="h-5 w-5 text-muted-foreground" />
      </div>

      <p className="mt-2 text-4xl font-extrabold tabular">
        {formatVnd(data?.total ?? 0)}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Sub label="Tiền mặt" value={formatVnd(data?.totalCash ?? 0)} />
        <Sub label="Chuyển khoản" value={formatVnd(data?.totalTransfer ?? 0)} />
        <Sub label="Đơn online" value={formatVnd(data?.appTotal ?? 0)} />
        <Sub label="Số đơn" value={formatNumber(data?.orderCount ?? 0)} />
      </div>
    </div>
  );
}