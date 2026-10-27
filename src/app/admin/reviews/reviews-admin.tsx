'use client';

// POS FRONTEND  src/app/admin/reviews/reviews-admin.tsx
// Đánh giá món từ App:
//  - "Cần xử lý": đánh giá XẤU (<= 3 sao). App KHÔNG hiện các đánh giá này —
//    chỉ quán xem, kèm tên + SĐT + mã đơn để gọi lại khách, rồi đánh dấu đã xử lý.
//  - "Tổng quan": điểm TB, theo món, nhận xét gần đây (như trước).

import { type ReactNode, useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Loader2, Phone, RefreshCw, RotateCcw } from 'lucide-react';
import { api, type NegativeReview } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Summary = Awaited<ReturnType<typeof api.reviewsSummary>>;
type Tab = 'negative' | 'overview';

function starStr(n: number) {
  const k = Math.max(0, Math.min(5, Math.round(n)));
  return '★★★★★'.slice(0, k) + '☆☆☆☆☆'.slice(0, 5 - k);
}
function dateTime(s: string) {
  const d = new Date(s);
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ReviewsAdmin() {
  const [tab, setTab] = useState<Tab>('negative');
  const [data, setData] = useState<Summary | null>(null);
  const [bad, setBad] = useState<NegativeReview[]>([]);
  const [showHandled, setShowHandled] = useState(false);
  const [loading, setLoading] = useState(true);

  // Mở thẳng tab qua link ?tab=overview (thanh nhắc trên màn thu ngân dùng ?tab=negative).
  useEffect(() => {
    try {
      const t = new URLSearchParams(window.location.search).get('tab');
      if (t === 'overview' || t === 'negative') setTab(t);
    } catch {
      /* bỏ qua */
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, n] = await Promise.all([
        api.reviewsSummary(),
        api.negativeReviews(showHandled ? 'all' : 'open'),
      ]);
      setData(s);
      setBad(n);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [showHandled]);

  useEffect(() => {
    load();
  }, [load]);

  const openCount = data?.openNegative ?? bad.filter((b) => !b.handledAt).length;

  return (
    <div className="mx-auto max-w-3xl p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Đánh giá món</h1>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
      </div>

      <div className="mb-4 flex gap-2">
        <TabButton active={tab === 'negative'} onClick={() => setTab('negative')}>
          Cần xử lý
          {openCount > 0 && (
            <span className="ml-1.5 rounded-full bg-rose-500 px-2 py-0.5 text-xs text-white">
              {openCount}
            </span>
          )}
        </TabButton>
        <TabButton active={tab === 'overview'} onClick={() => setTab('overview')}>
          Tổng quan
        </TabButton>
      </div>

      {tab === 'negative' ? (
        <NegativeList
          items={bad}
          loading={loading}
          showHandled={showHandled}
          onToggleHandled={() => setShowHandled((v) => !v)}
          onChanged={load}
        />
      ) : (
        <Overview data={data} loading={loading} />
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors',
        active ? 'border-foreground bg-foreground text-background' : 'bg-card hover:bg-muted',
      )}
    >
      {children}
    </button>
  );
}

// ───────────────────────── Đánh giá xấu ─────────────────────────

function NegativeList({
  items,
  loading,
  showHandled,
  onToggleHandled,
  onChanged,
}: {
  items: NegativeReview[];
  loading: boolean;
  showHandled: boolean;
  onToggleHandled: () => void;
  onChanged: () => void;
}) {
  return (
    <>
      <div className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
        <span>
          Đánh giá từ 3 sao trở xuống <b>không hiện trên app</b>. Gọi lại khách,
          xử lý xong thì bấm “Đã xử lý”.
        </span>
      </div>
      <label className="mb-3 flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
        <input type="checkbox" checked={showHandled} onChange={onToggleHandled} />
        Hiện cả đánh giá đã xử lý
      </label>

      {loading && items.length === 0 ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <p className="py-16 text-center text-muted-foreground">
          🎉 Không có đánh giá xấu nào cần xử lý.
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((r) => (
            <NegativeCard key={r.id} r={r} onChanged={onChanged} />
          ))}
        </div>
      )}
    </>
  );
}

function NegativeCard({
  r,
  onChanged,
}: {
  r: NegativeReview;
  onChanged: () => void;
}) {
  const [noting, setNoting] = useState(false);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const handled = !!r.handledAt;

  async function mark(h: boolean) {
    setBusy(true);
    setErr(null);
    try {
      await api.setReviewHandled(r.id, h, h ? note : undefined);
      setNoting(false);
      setNote('');
      onChanged();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Lỗi, thử lại');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className={cn(
        'rounded-xl border p-3',
        handled ? 'opacity-60' : 'border-rose-200 bg-card',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold">{r.productName ?? r.productId}</div>
          <div className="text-sm text-amber-500">{starStr(r.stars)}</div>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          {dateTime(r.createdAt)}
          {r.orderCode ? <div>Đơn #{r.orderCode}</div> : null}
        </div>
      </div>

      <p className="mt-2 whitespace-pre-wrap text-sm">
        {r.comment?.trim() ? r.comment : <i className="text-muted-foreground">(Không viết nhận xét)</i>}
      </p>

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <span className="font-medium">{r.customerName || 'Khách'}</span>
        {r.customerPhone ? (
          <a
            href={`tel:${r.customerPhone}`}
            className="inline-flex items-center gap-1 text-primary underline"
          >
            <Phone className="h-3.5 w-3.5" />
            {r.customerPhone}
          </a>
        ) : null}
      </div>

      {handled ? (
        <div className="mt-3 flex items-center justify-between gap-3 text-sm">
          <span className="inline-flex items-center gap-1 text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />
            Đã xử lý {r.handledAt ? dateTime(r.handledAt) : ''}
            {r.handledBy ? ` · ${r.handledBy}` : ''}
            {r.handledNote ? ` · ${r.handledNote}` : ''}
          </span>
          <Button variant="ghost" size="sm" onClick={() => mark(false)} disabled={busy}>
            <RotateCcw className="h-4 w-4" /> Mở lại
          </Button>
        </div>
      ) : noting ? (
        <div className="mt-3 space-y-2">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            maxLength={300}
            placeholder="Ghi chú (vd: đã gọi xin lỗi, tặng voucher...)"
            className="w-full rounded-lg border bg-background p-2 text-sm"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setNoting(false)} disabled={busy}>
              Huỷ
            </Button>
            <Button variant="success" size="sm" onClick={() => mark(true)} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Xác nhận đã xử lý
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex justify-end">
          <Button variant="outline" size="sm" onClick={() => setNoting(true)}>
            <CheckCircle2 className="h-4 w-4" /> Đã xử lý
          </Button>
        </div>
      )}
      {err ? <p className="mt-2 text-sm text-rose-600">{err}</p> : null}
    </div>
  );
}

// ───────────────────────── Tổng quan ─────────────────────────

function Overview({ data, loading }: { data: Summary | null; loading: boolean }) {
  if (loading && !data) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!data || data.total === 0) {
    return <p className="py-16 text-center text-muted-foreground">Chưa có đánh giá nào.</p>;
  }
  const comments = (data.recent ?? []).filter((r) => r.comment && r.comment.trim());
  return (
    <>
      <div className="mb-5 rounded-xl border p-4">
        <div className="text-3xl font-bold">
          {data.avgStars.toFixed(1)} <span className="text-amber-500">★</span>
        </div>
        <div className="text-sm text-muted-foreground">
          {data.total} lượt đánh giá (tính cả đánh giá xấu — chỉ quán thấy)
        </div>
      </div>

      <h2 className="mb-2 font-semibold">Theo món</h2>
      <div className="mb-6 space-y-2">
        {data.perProduct.map((p) => (
          <div
            key={p.productId}
            className="flex items-center justify-between rounded-lg border px-3 py-2"
          >
            <span className="font-medium">{p.productName ?? p.productId}</span>
            <span className="text-sm">
              <span className="text-amber-500">{starStr(p.avgStars)}</span>{' '}
              <span className="text-muted-foreground">
                {p.avgStars.toFixed(1)} · {p.count} lượt
              </span>
            </span>
          </div>
        ))}
      </div>

      <h2 className="mb-2 font-semibold">Nhận xét gần đây</h2>
      {comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">Chưa có nhận xét bằng lời.</p>
      ) : (
        <div className="space-y-2">
          {comments.map((r, i) => (
            <div key={i} className="rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">{r.productName ?? r.productId}</span>
                <span className="text-sm text-amber-500">{starStr(r.stars)}</span>
              </div>
              <p className="mt-1 text-sm">{r.comment}</p>
              <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                <span>{dateTime(r.createdAt)}</span>
                {r.stars <= 3 ? (
                  <span className="rounded bg-rose-100 px-1.5 py-0.5 text-rose-700">
                    Không hiện trên app
                  </span>
                ) : (
                  <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-emerald-700">
                    Đang hiện trên app
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
