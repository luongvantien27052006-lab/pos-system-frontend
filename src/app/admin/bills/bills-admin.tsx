// ==================================================================
//  POS FRONTEND  src/app/admin/bills/bills-admin.tsx  (FILE MOI)
//  Lich su BILL ban hang: don tai QUAY, tai BAN, va don APP.
//  Hien: ngay gio, mon + topping, gia mon + topping, tong, nguon don.
// ==================================================================

'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { api, ApiError, type Bill } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function money(n: number) {
  return (n || 0).toLocaleString('vi-VN') + 'đ';
}
function dateTime(s: string | null) {
  if (!s) return '—';
  const d = new Date(s);
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const SOURCE_LABEL: Record<Bill['source'], string> = {
  COUNTER: 'Tại quầy',
  TABLE: 'Tại bàn',
  APP: 'App',
};
const SOURCE_STYLE: Record<Bill['source'], string> = {
  COUNTER: 'bg-blue-100 text-blue-700',
  TABLE: 'bg-amber-100 text-amber-700',
  APP: 'bg-emerald-100 text-emerald-700',
};

type Filter = 'ALL' | Bill['source'];

export function BillsAdmin() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('ALL');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setBills(await api.listBills(300));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Không tải được lịch sử bill');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const shown = useMemo(
    () => (filter === 'ALL' ? bills : bills.filter((b) => b.source === filter)),
    [bills, filter],
  );

  const totalRevenue = useMemo(
    () => shown.reduce((sum, b) => sum + (b.total || 0), 0),
    [shown],
  );

  return (
    <main className="mx-auto max-w-3xl px-5 py-8">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Lịch sử bill</h1>
          <p className="text-sm text-muted-foreground">
            {shown.length} bill · tổng {money(totalRevenue)}
          </p>
        </div>
        <Button size="sm" variant="secondary" onClick={load}>
          <RefreshCw className="h-4 w-4" /> Tải lại
        </Button>
      </div>

      {/* Bộ lọc nguồn */}
      <div className="mb-5 flex flex-wrap gap-2">
        {(['ALL', 'COUNTER', 'TABLE', 'APP'] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'rounded-full px-4 py-1.5 text-sm font-semibold transition',
              filter === f
                ? 'bg-accent text-accent-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground',
            )}
          >
            {f === 'ALL' ? 'Tất cả' : SOURCE_LABEL[f as Bill['source']]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Đang tải…
        </div>
      ) : error ? (
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</div>
      ) : shown.length === 0 ? (
        <p className="text-sm text-muted-foreground">Chưa có bill nào.</p>
      ) : (
        <div className="space-y-3">
          {shown.map((b, idx) => (
            <article
              key={`${b.source}-${b.code}-${idx}`}
              className="rounded-2xl border bg-card p-4"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[11px] font-bold',
                        SOURCE_STYLE[b.source],
                      )}
                    >
                      {SOURCE_LABEL[b.source]}
                    </span>
                    <span className="font-mono text-sm font-semibold">
                      {b.code ?? '—'}
                    </span>
                    {b.tableNumber && (
                      <span className="text-xs text-muted-foreground">
                        Bàn {b.tableNumber}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {dateTime(b.createdAt)}
                    {b.paymentMethod ? ` · ${b.paymentMethod}` : ''}
                    {b.paymentStatus === 'PAID' ? ' · Đã trả' : ''}
                    {b.paymentStatus === 'PENDING' ? ' · Chưa trả' : ''}
                  </div>
                  {b.customer?.name && (
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {b.customer.name}
                      {b.customer.phone ? ` · ${b.customer.phone}` : ''}
                    </div>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-base font-extrabold text-accent">
                    {money(b.total)}
                  </div>
                </div>
              </div>

              {/* Món + topping */}
              <div className="mt-3 space-y-2 border-t pt-3">
                {b.items.map((it, i) => (
                  <div key={i} className="text-sm">
                    <div className="flex justify-between gap-3">
                      <span className="font-medium">
                        {it.quantity} × {it.name}
                      </span>
                      <span className="shrink-0 tabular-nums text-muted-foreground">
                        {money(it.unitPrice)}
                      </span>
                    </div>
                    {it.toppings.length > 0 && (
                      <div className="mt-0.5 space-y-0.5 pl-4">
                        {it.toppings.map((t, j) => (
                          <div
                            key={j}
                            className="flex justify-between gap-3 text-xs text-muted-foreground"
                          >
                            <span>+ {t.name}</span>
                            <span className="shrink-0 tabular-nums">
                              {t.unitPrice > 0 ? money(t.unitPrice) : ''}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {b.items.length === 0 && (
                  <p className="text-xs text-muted-foreground">(Không có chi tiết món)</p>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}