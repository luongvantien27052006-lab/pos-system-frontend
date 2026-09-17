// POS FRONTEND  src/app/admin/refunds/refunds-admin.tsx
'use client';

import { useCallback, useEffect, useState } from 'react';
import { Check, Copy, Loader2, RefreshCw, X } from 'lucide-react';
import { api, type CompletedRefund, type PendingRefund } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const money = (n: number | string) =>
  (Number(n) || 0).toLocaleString('vi-VN') + 'đ';
const dt = (s: string | null) =>
  s
    ? new Date(s).toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : '—';
const code = (id: string) => '#' + id.slice(0, 8).toUpperCase();
const who = (v: string | null) =>
  v === 'CUSTOMER' ? 'Khách huỷ' : v === 'STAFF' ? 'Quán huỷ' : v ?? '—';
const copy = (t: string) => void navigator.clipboard?.writeText(t);

const OVERDUE_HOURS = 6;
const hoursSince = (s: string) => (Date.now() - new Date(s).getTime()) / 3.6e6;
const noAccent = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
const vietqrUrl = (r: PendingRefund) =>
  `https://img.vietqr.io/image/${r.bank_code}-${r.bank_account}-compact2.png` +
  `?amount=${Math.round(Number(r.amount))}` +
  `&addInfo=${encodeURIComponent(
    noAccent('Hoan tien ' + r.order_id.slice(0, 8).toUpperCase()),
  )}` +
  `&accountName=${encodeURIComponent(noAccent(r.account_holder ?? ''))}`;

function RowCopy({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <button
        type="button"
        onClick={() => copy(value)}
        className="inline-flex items-center gap-1 font-semibold hover:text-accent"
      >
        {value} <Copy className="h-3.5 w-3.5 opacity-60" />
      </button>
    </div>
  );
}

type Tab = 'pending' | 'done';

export function RefundsAdmin() {
  const [tab, setTab] = useState<Tab>('pending');
  const [pending, setPending] = useState<PendingRefund[]>([]);
  const [done, setDone] = useState<CompletedRefund[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [qrOpen, setQrOpen] = useState<string | null>(null);
  const [recon, setRecon] = useState<{
    matched: number;
    onlyApp: Record<string, unknown>[];
    onlyPos: Record<string, unknown>[];
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, d, rec] = await Promise.all([
        api.getPendingRefunds(),
        api.getCompletedRefunds(),
        api.getRefundReconcile().catch(() => null),
      ]);
      setPending(Array.isArray(p) ? p : []);
      setDone(Array.isArray(d) ? d : []);
      setRecon(rec);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Không tải được');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  const complete = async (r: PendingRefund) => {
    if (
      !confirm(
        `Xác nhận ĐÃ chuyển khoản hoàn ${money(r.amount)} cho đơn ${code(
          r.order_id,
        )}?`,
      )
    ) {
      return;
    }
    setBusy(r.id);
    setMsg(null);
    try {
      await api.completeRefund(r.id);
      await load();
      setMsg(`Đã ghi nhận hoàn tiền đơn ${code(r.order_id)} ✓`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Thất bại');
    } finally {
      setBusy(null);
    }
  };

  const reject = async (r: PendingRefund) => {
    const reason = prompt(
      `Lý do TỪ CHỐI hoàn tiền đơn ${code(r.order_id)}?\n` +
        '(Khách sẽ thấy lý do này + hướng dẫn liên hệ hỗ trợ)',
    );
    if (reason == null) return;
    if (!reason.trim()) {
      alert('Vui lòng nhập lý do');
      return;
    }
    setBusy(r.id);
    setMsg(null);
    try {
      await api.rejectRefund(r.id, reason.trim());
      await load();
      setMsg(`Đã từ chối hoàn tiền đơn ${code(r.order_id)}`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Thất bại');
    } finally {
      setBusy(null);
    }
  };

  return (
    <main className="mx-auto max-w-2xl px-5 py-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Hoàn tiền</h1>
          <p className="text-sm text-muted-foreground">
            Đơn chuyển khoản đã trả bị huỷ — chuyển khoản lại rồi bấm “Đã hoàn”,
            hoặc “Từ chối” kèm lý do.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => void load()}
          disabled={loading}
        >
          <RefreshCw className="h-4 w-4" /> Tải lại
        </Button>
      </div>

      <div className="mb-4 flex gap-1 border-b">
        {(
          [
            ['pending', `Đang chờ (${pending.length})`],
            ['done', 'Lịch sử'],
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

      {msg && (
        <p className="mb-3 rounded-lg bg-muted px-3 py-2 text-sm">{msg}</p>
      )}

      {tab === 'done' && recon && (
        <div
          className={cn(
            'mb-3 rounded-lg px-3 py-2 text-sm',
            recon.onlyApp.length + recon.onlyPos.length === 0
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-red-50 text-red-700',
          )}
        >
          Đối chiếu 2 đầu: khớp {recon.matched}
          {recon.onlyApp.length + recon.onlyPos.length > 0
            ? ` · LỆCH: App thừa ${recon.onlyApp.length}, POS thừa ${recon.onlyPos.length} (kiểm tra lại)`
            : ' · Tất cả khớp ✓'}
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Đang tải…
        </div>
      ) : tab === 'pending' ? (
        pending.length === 0 ? (
          <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            Không có yêu cầu hoàn tiền nào đang chờ.
          </p>
        ) : (
          <div className="space-y-3">
            {pending.map((r) => (
              <div key={r.id} className="rounded-2xl border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-extrabold">
                      {code(r.order_id)}{' '}
                      <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                        {who(r.requested_by)}
                      </span>
                      {hoursSince(r.requested_at) > OVERDUE_HOURS && (
                        <span className="ml-1 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-bold text-red-600">
                          Quá {Math.floor(hoursSince(r.requested_at))}h
                        </span>
                      )}
                    </p>
                    <p className="text-lg font-extrabold text-accent">
                      {money(r.amount)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {r.customer_name ?? 'Khách'}
                      {r.customer_phone ? ` · ${r.customer_phone}` : ''}
                    </p>
                    <p className="text-[11px] text-muted-foreground/70">
                      ID: {r.user_id}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      Đặt: {dt(r.order_created_at)} · YC hoàn:{' '}
                      {dt(r.requested_at)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-2">
                    <Button
                      size="sm"
                      variant="success"
                      onClick={() => void complete(r)}
                      disabled={busy === r.id}
                    >
                      {busy === r.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}{' '}
                      Đã hoàn
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-destructive text-destructive hover:bg-destructive/10"
                      onClick={() => void reject(r)}
                      disabled={busy === r.id}
                    >
                      <X className="h-4 w-4" /> Từ chối
                    </Button>
                  </div>
                </div>
                {r.bank_account || r.bank_name || r.account_holder ? (
                  <div className="mt-3 space-y-1 rounded-xl bg-muted/50 p-3 text-sm">
                    <RowCopy label="Số TK" value={r.bank_account} />
                    <RowCopy label="Ngân hàng" value={r.bank_name} />
                    <RowCopy label="Chủ TK" value={r.account_holder} />
                    {r.bank_code && r.bank_account && (
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() =>
                            setQrOpen(qrOpen === r.id ? null : r.id)
                          }
                          className="text-xs font-semibold text-accent hover:underline"
                        >
                          {qrOpen === r.id
                            ? 'Ẩn mã QR'
                            : '⚡ QR chuyển tiền (quét để hoàn nhanh)'}
                        </button>
                        {qrOpen === r.id && (
                          <div className="mt-2 flex flex-col items-center rounded-xl bg-white p-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={vietqrUrl(r)}
                              alt="VietQR hoàn tiền"
                              width={220}
                              height={280}
                            />
                            <span className="pb-1 text-[11px] text-muted-foreground">
                              Quét bằng app ngân hàng để chuyển đúng số tiền + TK
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="mt-3 rounded-xl bg-amber-100 p-3 text-sm font-medium text-amber-900">
                    Khách chưa cung cấp thông tin ngân hàng — liên hệ khách để
                    lấy số tài khoản.
                  </p>
                )}
              </div>
            ))}
          </div>
        )
      ) : done.length === 0 ? (
        <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          Chưa có lịch sử.
        </p>
      ) : (
        <div className="space-y-2">
          {done.map((r) => {
            const rejected = r.status === 'REJECTED';
            return (
              <div key={r.id} className="rounded-xl border bg-card p-3 text-sm">
                <div className="flex items-center justify-between">
                  <p className="font-bold">
                    {code(r.order_id)} · {money(r.amount)}
                  </p>
                  <span
                    className={cn(
                      'text-xs font-semibold',
                      rejected ? 'text-red-600' : 'text-emerald-600',
                    )}
                  >
                    {rejected ? 'Từ chối' : 'Đã hoàn'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {r.customer_name ?? 'Khách'}
                  {r.customer_phone ? ` · ${r.customer_phone}` : ''}
                  {!rejected && r.bank_account ? ` · ${r.bank_account}` : ''}
                </p>
                {rejected && r.note && (
                  <p className="mt-1 rounded-lg bg-red-50 px-2 py-1 text-[11px] text-red-700">
                    Lý do: {r.note}
                  </p>
                )}
                <p className="text-[11px] text-muted-foreground">
                  {dt(r.completed_at)}
                  {r.completed_by ? ` · bởi ${r.completed_by}` : ''} ·{' '}
                  {who(r.requested_by)}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
