// ==================================================================
//  POS FRONTEND  src/app/dashboard/dashboard-app.tsx
//  Gộp: Doanh thu (+ so sánh nhanh) · Lịch sử đơn · Chốt sổ (đếm tiền mặt).
// ==================================================================

'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeftRight,
  Banknote,
  Loader2,
  Save,
  ShoppingBag,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { api, type CashReconcile } from '@/lib/api';
import { socketRooms, useSocketEvent } from '@/lib/socket';
import {
  type MonthlyRevenue,
  type RevenueSummary,
  SOCKET_EVENTS,
} from '@/types';
import { StatCard } from '@/components/dashboard/stat-card';
import { MonthlyRevenueCard } from '@/components/dashboard/monthly-revenue-card';
import { StoreHoursCard } from '@/components/dashboard/store-hours-card';
import { BackButton } from '@/components/ui/back-button';
import { Button } from '@/components/ui/button';
import { BillsAdmin } from '@/app/admin/bills/bills-admin';
import { cn } from '@/lib/utils';

const money = (n: number) => (n || 0).toLocaleString('vi-VN') + 'đ';

type Tab = 'revenue' | 'bills' | 'cash';

/** 1 dòng so sánh kỳ hiện tại vs kỳ trước (kèm % + mũi tên). */
function CompareRow({
  label,
  current,
  prev,
}: {
  label: string;
  current: number;
  prev: number;
}) {
  const diff = current - prev;
  const pct = prev > 0 ? (diff / prev) * 100 : current > 0 ? 100 : 0;
  const up = diff >= 0;
  return (
    <div className="flex items-center justify-between rounded-xl border bg-card px-4 py-3">
      <div>
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-lg font-extrabold">{money(current)}</p>
      </div>
      <div className="text-right">
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold',
            up ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700',
          )}
        >
          {up ? (
            <TrendingUp className="h-3.5 w-3.5" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5" />
          )}
          {up ? '+' : ''}
          {pct.toFixed(0)}%
        </span>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Kỳ trước {money(prev)}
        </p>
      </div>
    </div>
  );
}

/** Tab CHỐT SỔ — đối chiếu tiền mặt kỳ vọng vs đếm thực tế + lịch sử. */
function CashReconcileTab() {
  const [expected, setExpected] = useState<number | null>(null);
  const [date, setDate] = useState<string>('');
  const [counted, setCounted] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState<CashReconcile[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [e, h] = await Promise.all([
        api.getCashExpected(),
        api.getCashHistory(),
      ]);
      setExpected(e.expected);
      setDate(e.date);
      setHistory(h);
    } catch {
      /* bỏ qua */
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  const countedNum = Number(counted.replace(/[^\d]/g, '')) || 0;
  const diff = expected != null ? countedNum - expected : 0;

  const save = async () => {
    if (expected == null) return;
    setSaving(true);
    setMsg(null);
    try {
      await api.saveCashReconcile({
        date,
        counted: countedNum,
        note: note.trim() || undefined,
      });
      setCounted('');
      setNote('');
      setMsg('Đã lưu chốt sổ ✓');
      await load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-4">
      <div className="rounded-2xl border bg-card p-5">
        <p className="text-sm font-semibold text-muted-foreground">
          Chốt sổ tiền mặt ngày {date || '—'}
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-muted/50 p-4">
            <p className="text-xs text-muted-foreground">
              Tiền mặt kỳ vọng (hệ thống)
            </p>
            <p className="text-xl font-extrabold">
              {expected != null ? money(expected) : '—'}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              = tiền mặt tại quầy + COD app đã thu
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Tiền mặt đếm thực tế
            </label>
            <input
              inputMode="numeric"
              value={counted}
              onChange={(e) => setCounted(e.target.value)}
              placeholder="Nhập số tiền đếm được…"
              className="mt-1 w-full rounded-xl border bg-background px-4 py-3 text-lg font-bold outline-none focus:border-accent"
            />
            {counted !== '' && expected != null && (
              <p
                className={cn(
                  'mt-1.5 text-sm font-semibold',
                  diff === 0
                    ? 'text-emerald-600'
                    : diff > 0
                      ? 'text-blue-600'
                      : 'text-red-600',
                )}
              >
                {diff === 0
                  ? 'Khớp ✓'
                  : `${diff > 0 ? 'Thừa' : 'Thiếu'} ${money(Math.abs(diff))}`}
              </p>
            )}
          </div>
        </div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="Ghi chú (tuỳ chọn)…"
          className="mt-3 w-full rounded-xl border bg-background px-3 py-2 text-sm"
        />
        <div className="mt-3 flex items-center gap-3">
          <Button
            onClick={() => void save()}
            disabled={saving || counted === '' || expected == null}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}{' '}
            Lưu chốt sổ
          </Button>
          {msg && <span className="text-sm text-muted-foreground">{msg}</span>}
        </div>
      </div>

      {history.length > 0 && (
        <div className="rounded-2xl border bg-card p-5">
          <p className="mb-2 text-sm font-semibold">Lịch sử chốt sổ</p>
          <div className="space-y-2">
            {history.map((h) => (
              <div
                key={h.id}
                className="flex items-center justify-between border-b pb-2 text-sm last:border-0 last:pb-0"
              >
                <div>
                  <p className="font-medium">{h.date}</p>
                  <p className="text-xs text-muted-foreground">
                    Kỳ vọng {money(h.expected)} · Đếm {money(h.counted)}
                  </p>
                </div>
                <span
                  className={cn(
                    'text-sm font-semibold',
                    h.difference === 0
                      ? 'text-emerald-600'
                      : h.difference > 0
                        ? 'text-blue-600'
                        : 'text-red-600',
                  )}
                >
                  {h.difference === 0
                    ? 'Khớp'
                    : `${h.difference > 0 ? '+' : ''}${money(h.difference)}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function DashboardApp({ isAdmin = false }: { isAdmin?: boolean }) {
  const [tab, setTab] = useState<Tab>('revenue');
  const [revenue, setRevenue] = useState<RevenueSummary | null>(null);
  const [monthly, setMonthly] = useState<MonthlyRevenue | null>(null);
  const [compare, setCompare] = useState<{
    today: number;
    yesterday: number;
    thisMonth: number;
    lastMonth: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    socketRooms.joinAdmin();
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [r, m, c] = await Promise.all([
          api.getTodayRevenue(),
          api.getMonthlyRevenue(),
          api.getRevenueCompare(),
        ]);
        if (active) {
          setRevenue(r);
          setMonthly(m);
          setCompare(c);
        }
      } catch (e) {
        if (active) {
          setError(e instanceof Error ? e.message : 'Không tải được doanh thu');
        }
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const onRevenue = useCallback((r: RevenueSummary) => {
    setRevenue(r);
    void api.getMonthlyRevenue().then(setMonthly).catch(() => {});
    void api.getRevenueCompare().then(setCompare).catch(() => {});
  }, []);
  useSocketEvent<RevenueSummary>(SOCKET_EVENTS.REVENUE_UPDATED, onRevenue);

  return (
    <main className="mx-auto min-h-dvh max-w-4xl px-5 py-6">
      <BackButton className="mb-3" />
      <header className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Doanh thu &amp; Đơn hàng</h1>
        <span className="flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-70" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success" />
          </span>
          Trực tiếp
        </span>
      </header>

      <div className="mb-5 flex gap-1 border-b">
        {(
          [
            ['revenue', 'Doanh thu'],
            ['bills', 'Lịch sử đơn'],
            ['cash', 'Chốt sổ'],
          ] as [Tab, string][]
        ).map(([k, l]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={cn(
              'px-4 py-2 text-sm font-semibold transition',
              tab === k
                ? 'border-b-2 border-accent text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {l}
          </button>
        ))}
      </div>

      {error && (
        <p className="mb-4 rounded-xl bg-warning/15 px-4 py-3 text-sm text-warning-foreground">
          {error}
        </p>
      )}

      {tab === 'revenue' && (
        <div className="grid gap-4">
          <StatCard
            hero
            label="Tổng doanh thu hôm nay"
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

          {compare && (
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <CompareRow
                label="Hôm nay vs hôm qua"
                current={compare.today}
                prev={compare.yesterday}
              />
              <CompareRow
                label="Tháng này vs tháng trước"
                current={compare.thisMonth}
                prev={compare.lastMonth}
              />
            </div>
          )}

          <div className="mt-4">
            <MonthlyRevenueCard data={monthly} />
          </div>
          {isAdmin && (
            <div className="mt-4">
              <StoreHoursCard />
            </div>
          )}
        </div>
      )}

      {tab === 'bills' && <BillsAdmin embedded />}

      {tab === 'cash' && <CashReconcileTab />}
    </main>
  );
}
