'use client';

import { useCallback, useState } from 'react';
import { Banknote, CheckCircle2, QrCode, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useSocketEvent } from '@/lib/socket';
import { type CartItem, cartTotal, toAddItems } from '@/lib/cart';
import { type OrderPaidEvent, type QrInfo, SOCKET_EVENTS } from '@/types';
import { formatNumber, formatVnd } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { QuantityStepper } from '@/components/ui/quantity-stepper';
import { QrDialog } from './qr-dialog';

type Phase = 'entry' | 'confirming_cash';

const QUICK = [50000, 100000, 200000, 500000];

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : 'Có lỗi xảy ra, thử lại';
}

export function OrderPanel({
  cart,
  onSetQty,
  onClear,
}: {
  cart: CartItem[];
  onSetQty: (key: string, qty: number) => void;
  onClear: () => void;
}) {
  const total = cartTotal(cart);
  const [phase, setPhase] = useState<Phase>('entry');
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [given, setGiven] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qr, setQr] = useState<QrInfo | null>(null);

  const reset = useCallback(() => {
    setPhase('entry');
    setSessionId(null);
    setGiven('');
    setQr(null);
    setError(null);
    onClear();
  }, [onClear]);

  // Tiền về (xác nhận tiền mặt hoặc webhook CK) cho đơn này -> reset panel
  const onPaid = useCallback(
    (e: OrderPaidEvent) => {
      if (sessionId && e.sessionId === sessionId) reset();
    },
    [sessionId, reset],
  );
  useSocketEvent<OrderPaidEvent>(SOCKET_EVENTS.ORDER_PAID, onPaid);

  const createAndAddItems = async (): Promise<number> => {
    const s = await api.createCounterSession();
    await api.addItems(s.id, toAddItems(cart));
    setSessionId(s.id);
    return s.id;
  };

  const startCash = async () => {
    setBusy(true);
    setError(null);
    try {
      const id = await createAndAddItems();
      await api.payCash(id); // -> PENDING_CASH (chưa in)
      setPhase('confirming_cash');
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  const confirmCash = async () => {
    if (!sessionId) return;
    setBusy(true);
    setError(null);
    try {
      await api.confirmCash(sessionId); // -> PAID + in 2 liên
      reset();
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  const startTransfer = async () => {
    setBusy(true);
    setError(null);
    try {
      const id = await createAndAddItems();
      const info = await api.createQr(id);
      setQr(info); // chờ webhook -> onPaid -> reset
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  const givenNum = Number(given.replace(/\D/g, '')) || 0;
  const change = givenNum - total;
  const empty = cart.length === 0;

  return (
    <div className="flex min-h-0 flex-col border-l bg-card/40">
      <div className="flex items-center justify-between border-b p-4">
        <h2 className="text-lg font-bold">Đơn hiện tại</h2>
        {!empty && phase === 'entry' && (
          <button
            type="button"
            onClick={onClear}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <Trash2 className="h-4 w-4" /> Xoá hết
          </button>
        )}
      </div>

      {/* Danh sách món */}
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
        {empty && (
          <p className="py-10 text-center text-muted-foreground">
            Chọn món từ menu bên trái.
          </p>
        )}
        {cart.map((c) => (
          <div key={c.key} className="flex gap-3">
            <div className="min-w-0 flex-1">
              <div className="font-medium">{c.product.name}</div>
              {c.options.map((o) => (
                <div key={o.id} className="text-xs text-muted-foreground">
                  + {o.name}
                </div>
              ))}
              {c.note && (
                <div className="text-xs italic text-muted-foreground">
                  {c.note}
                </div>
              )}
              <div className="mt-1 text-sm font-semibold tabular">
                {formatVnd(c.unitPrice * c.quantity)}
              </div>
            </div>
            {phase === 'entry' && (
              <QuantityStepper
                value={c.quantity}
                min={0}
                onChange={(q) => onSetQty(c.key, q)}
              />
            )}
          </div>
        ))}
      </div>

      {/* Tổng + tính tiền thối + hành động */}
      <div className="space-y-3 border-t p-4">
        <div className="flex items-center justify-between">
          <span className="text-base font-semibold">Tổng cộng</span>
          <span className="text-2xl font-extrabold tabular text-accent">
            {formatVnd(total)}
          </span>
        </div>

        {/* Bộ tính tiền thối */}
        <div className="rounded-xl bg-muted/60 p-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-muted-foreground">
              Khách đưa
            </span>
            <input
              inputMode="numeric"
              value={given ? formatNumber(givenNum) : ''}
              onChange={(e) => setGiven(e.target.value)}
              placeholder="0"
              className="w-32 rounded-lg border bg-card px-3 py-2 text-right text-lg font-semibold tabular outline-none focus:border-accent"
            />
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {QUICK.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setGiven(String(v))}
                className="rounded-lg border bg-card px-3 py-1 text-sm font-medium tabular hover:bg-muted"
              >
                {formatNumber(v)}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setGiven(String(total))}
              className="rounded-lg border bg-card px-3 py-1 text-sm font-medium hover:bg-muted"
            >
              Đủ tiền
            </button>
          </div>
          {givenNum > 0 && (
            <div className="mt-2 flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Thối lại
              </span>
              <span
                className={`text-lg font-bold tabular ${
                  change < 0 ? 'text-muted-foreground' : 'text-success'
                }`}
              >
                {change >= 0 ? formatVnd(change) : 'Chưa đủ'}
              </span>
            </div>
          )}
        </div>

        {error && (
          <p className="rounded-lg bg-warning/15 px-3 py-2 text-sm text-warning-foreground">
            {error}
          </p>
        )}

        {phase === 'entry' ? (
          <div className="grid grid-cols-2 gap-3">
            <Button
              size="lg"
              variant="outline"
              disabled={empty || busy}
              onClick={startCash}
            >
              <Banknote className="h-5 w-5" /> Tiền mặt
            </Button>
            <Button
              size="lg"
              variant="accent"
              disabled={empty || busy}
              onClick={startTransfer}
            >
              <QrCode className="h-5 w-5" /> Chuyển khoản
            </Button>
          </div>
        ) : (
          <Button
            size="lg"
            variant="success"
            className="w-full"
            disabled={busy}
            onClick={confirmCash}
          >
            <CheckCircle2 className="h-5 w-5" /> Xác nhận đã nhận tiền
          </Button>
        )}
      </div>

      {qr && <QrDialog qr={qr} onClose={reset} />}
    </div>
  );
}