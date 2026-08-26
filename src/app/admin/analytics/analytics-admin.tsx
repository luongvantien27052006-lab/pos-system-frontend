'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Summary = {
  days: number;
  totalRevenue: number;
  totalOrders: number;
  avgOrder: number;
  revenueTrend: { date: string; revenue: number; orders: number }[];
  peakHours: { hour: number; orders: number }[];
  bestSellers: { name: string; qty: number }[];
};

const money = (n: number) => n.toLocaleString('vi-VN') + 'đ';

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-bold">{value}</div>
    </div>
  );
}
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-6 rounded-xl border p-4">
      <h2 className="mb-3 font-semibold">{title}</h2>
      {children}
    </div>
  );
}
function Empty() {
  return (
    <p className="py-4 text-center text-sm text-muted-foreground">
      Chưa có dữ liệu.
    </p>
  );
}

export function AnalyticsAdmin() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      setData(await api.analyticsSummary(days));
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  const maxRev = Math.max(1, ...(data?.revenueTrend.map((r) => r.revenue) ?? [1]));
  const maxHour = Math.max(1, ...(data?.peakHours.map((h) => h.orders) ?? [1]));
  const maxQty = Math.max(1, ...(data?.bestSellers.map((b) => b.qty) ?? [1]));
  const hourMap = new Map((data?.peakHours ?? []).map((h) => [h.hour, h.orders]));

  return (
    <div className="mx-auto max-w-3xl p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Thống kê</h1>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border p-0.5">
            {[7, 30, 90].map((n) => (
              <button
                key={n}
                onClick={() => setDays(n)}
                className={cn(
                  'rounded-md px-2.5 py-1 text-sm font-semibold transition',
                  days === n
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {n}n
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {loading && !data ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : !data ? (
        <p className="py-16 text-center text-muted-foreground">
          Không tải được dữ liệu.
        </p>
      ) : (
        <>
          <div className="mb-5 grid grid-cols-3 gap-3">
            <Stat label="Doanh thu" value={money(data.totalRevenue)} />
            <Stat label="Số đơn" value={String(data.totalOrders)} />
            <Stat label="TB/đơn" value={money(data.avgOrder)} />
          </div>

          <Section title="Xu hướng doanh thu">
            {data.revenueTrend.length === 0 ? (
              <Empty />
            ) : (
              <>
                <div className="flex h-40 items-end gap-1">
                  {data.revenueTrend.map((r, i) => (
                    <div
                      key={i}
                      className="group flex h-full flex-1 flex-col items-center justify-end"
                      title={`${r.date}: ${money(r.revenue)} · ${r.orders} đơn`}
                    >
                      <div
                        className="w-full rounded-t bg-accent/70 transition-all group-hover:bg-accent"
                        style={{
                          height: `${(r.revenue / maxRev) * 100}%`,
                          minHeight: r.revenue > 0 ? '3px' : '0',
                        }}
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                  <span>{data.revenueTrend[0]?.date?.slice(5)}</span>
                  <span>
                    {data.revenueTrend[data.revenueTrend.length - 1]?.date?.slice(
                      5,
                    )}
                  </span>
                </div>
              </>
            )}
          </Section>

          <Section title="Giờ cao điểm (số đơn)">
            <div className="flex h-32 items-end gap-[2px]">
              {Array.from({ length: 24 }, (_, h) => {
                const v = hourMap.get(h) ?? 0;
                return (
                  <div
                    key={h}
                    className="flex h-full flex-1 flex-col items-center justify-end"
                    title={`${h}h: ${v} đơn`}
                  >
                    <div
                      className="w-full rounded-t bg-primary/60"
                      style={{
                        height: `${(v / maxHour) * 100}%`,
                        minHeight: v > 0 ? '2px' : '0',
                      }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
              <span>0h</span>
              <span>6h</span>
              <span>12h</span>
              <span>18h</span>
              <span>23h</span>
            </div>
          </Section>

          <Section title="Món bán chạy">
            {data.bestSellers.length === 0 ? (
              <Empty />
            ) : (
              <div className="space-y-2">
                {data.bestSellers.map((b, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-5 text-sm font-bold text-muted-foreground">
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <div className="mb-1 flex justify-between text-sm">
                        <span className="font-medium">{b.name}</span>
                        <span className="text-muted-foreground">{b.qty}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded bg-muted">
                        <div
                          className="h-full rounded bg-accent"
                          style={{ width: `${(b.qty / maxQty) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </>
      )}
    </div>
  );
}