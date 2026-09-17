// POS FRONTEND  src/app/admin/refunds/refunds-admin.tsx  (FILE MỚI)
'use client';

import { useCallback, useEffect, useState } from 'react';
import { Check, Copy, Loader2, RefreshCw } from 'lucide-react';
import { api, type PendingRefund } from '@/lib/api';
import { Button } from '@/components/ui/button';

const money = (n: number | string) =>
  (Number(n) || 0).toLocaleString('vi-VN') + 'đ';

function RowCopy({
  label,
  value,
  onCopy,
}: {
  label: string;
  value: string | null;
  onCopy: (t: string) => void;
}) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <button
        type="button"
        onClick={() => onCopy(value)}
        className="inline-flex items-center gap-1 font-semibold hover:text-accent"
      >
        {value} <Copy className="h-3.5 w-3.5 opacity-60" />
      </button>
    </div>
  );
}

export function RefundsAdmin() {
  const [items, setItems] = useState<PendingRefund[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await api.getPendingRefunds();
      setItems(Array.isArray(rows) ? rows : []);
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
        `Xác nhận ĐÃ hoàn ${money(r.amount)} cho đơn #${r.order_id
          .slice(0, 8)
          .toUpperCase()}?`,
      )
    ) {
      return;
    }
    setBusy(r.id);
    setMsg(null);
    try {
      await api.completeRefund(r.id);
      setItems((prev) => prev.filter((x) => x.id !== r.id));
      setMsg('Đã đánh dấu hoàn tiền ✓');
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Thất bại');
    } finally {
      setBusy(null);
    }
  };

  const copy = (t: string) => void navigator.clipboard?.writeText(t);

  return (
    <main className="mx-auto max-w-2xl px-5 py-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Hoàn tiền</h1>
          <p className="text-sm text-muted-foreground">
            Đơn chuyển khoản đã trả bị huỷ — chuyển khoản lại rồi bấm “Đã hoàn”.
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

      {msg && (
        <p className="mb-3 rounded-lg bg-muted px-3 py-2 text-sm">{msg}</p>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Đang tải…
        </div>
      ) : items.length === 0 ? (
        <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          Không có yêu cầu hoàn tiền nào đang chờ.
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((r) => (
            <div key={r.id} className="rounded-2xl border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-extrabold">
                    #{r.order_id.slice(0, 8).toUpperCase()}
                  </p>
                  <p className="text-lg font-extrabold text-accent">
                    {money(r.amount)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {r.customer_name ?? 'Khách'}
                    {r.customer_phone ? ` · ${r.customer_phone}` : ''}
                  </p>
                </div>
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
              </div>

              {r.bank_account || r.bank_name || r.account_holder ? (
                <div className="mt-3 space-y-1 rounded-xl bg-muted/50 p-3 text-sm">
                  <RowCopy label="Số TK" value={r.bank_account} onCopy={copy} />
                  <RowCopy
                    label="Ngân hàng"
                    value={r.bank_name}
                    onCopy={copy}
                  />
                  <RowCopy
                    label="Chủ TK"
                    value={r.account_holder}
                    onCopy={copy}
                  />
                </div>
              ) : (
                <p className="mt-3 rounded-xl bg-amber-100 p-3 text-sm font-medium text-amber-900">
                  Khách chưa cung cấp thông tin ngân hàng — liên hệ khách để lấy
                  số tài khoản.
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
