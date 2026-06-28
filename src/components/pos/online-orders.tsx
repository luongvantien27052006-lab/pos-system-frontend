'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Banknote,
  Bike,
  Check,
  ShoppingBag,
  X,
  XCircle,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useSocketEvent } from '@/lib/socket';
import {
  type AppOrder,
  type AppOrderCancelledEvent,
  type AppOrderIncomingEvent,
  type AppOrderStatusEvent,
  type PrepStatus,
  SOCKET_EVENTS,
} from '@/types';
import { formatVnd } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Toast, type ToastState } from '@/components/ui/toast';

const STATUS_META: Record<
  PrepStatus,
  { label: string; cls: string; next?: { status: PrepStatus; label: string } }
> = {
  PENDING: {
    label: 'Chờ xác nhận',
    cls: 'bg-warning/20 text-warning-foreground',
    next: { status: 'CONFIRMED', label: 'Xác nhận' },
  },
  CONFIRMED: {
    label: 'Đã xác nhận',
    cls: 'bg-accent/20 text-accent-foreground',
    next: { status: 'IN_PROGRESS', label: 'Bắt đầu làm' },
  },
  IN_PROGRESS: {
    label: 'Đang làm',
    cls: 'bg-primary/15 text-primary',
    next: { status: 'READY', label: 'Làm xong' },
  },
  READY: {
    label: 'Sẵn sàng',
    cls: 'bg-success/20 text-success-foreground',
    next: { status: 'DELIVERED', label: 'Đã giao' },
  },
  DELIVERED: { label: 'Đã giao', cls: 'bg-muted text-muted-foreground' },
  CANCELLED: { label: 'Đã hủy', cls: 'bg-destructive/15 text-destructive' },
};

/** Chuông báo đơn mới (1 tiếng êm). */
function ding() {
  beep([{ at: 0, freq: 880, type: 'sine' }]);
}

/** Còi cảnh báo HỦY đơn (2 tiếng gắt). */
function alarm() {
  beep([
    { at: 0, freq: 660, type: 'square' },
    { at: 0.26, freq: 440, type: 'square' },
  ]);
}

function beep(notes: { at: number; freq: number; type: OscillatorType }[]) {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new Ctx();
    for (const n of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = n.type;
      osc.frequency.value = n.freq;
      const t0 = ctx.currentTime + n.at;
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.18, t0 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.22);
      osc.start(t0);
      osc.stop(t0 + 0.24);
    }
  } catch {
    /* trình duyệt chặn audio tới khi có tương tác — bỏ qua */
  }
}

export function OnlineOrders() {
  const [orders, setOrders] = useState<AppOrder[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>(null);

  /** Tải lại nhưng GIỮ các thẻ "đã hủy" đang chờ thu ngân bấm "Đã xem". */
  const refetch = useCallback(async () => {
    try {
      const fresh = await api.getActiveAppOrders();
      setOrders((prev) => {
        const freshIds = new Set(fresh.map((o) => o.appOrderId));
        const keepCancelled = prev.filter(
          (o) => o.prepStatus === 'CANCELLED' && !freshIds.has(o.appOrderId),
        );
        return [...fresh, ...keepCancelled];
      });
    } catch {
      /* giữ danh sách cũ nếu lỗi mạng */
    }
  }, []);

  // Tải lần đầu + POLL DỰ PHÒNG mỗi 20s: kể cả socket lỗi, đơn vẫn tự
  // hiện/đổi trong tối đa 20s mà không cần reload trang.
  useEffect(() => {
    void refetch();
    const timer = setInterval(() => void refetch(), 20000);
    return () => clearInterval(timer);
  }, [refetch]);

  // Đơn mới -> tải lại + chuông.
  const onIncoming = useCallback(
    (_e: AppOrderIncomingEvent) => {
      void refetch();
      ding();
    },
    [refetch],
  );
  useSocketEvent<AppOrderIncomingEvent>(
    SOCKET_EVENTS.APP_ORDER_INCOMING,
    onIncoming,
  );

  // Trạng thái / thanh toán đổi.
  const onStatus = useCallback((e: AppOrderStatusEvent) => {
    setOrders((prev) => {
      // Nhân viên hủy (nút X) hoặc giao xong + đã thu tiền -> gỡ thẻ êm.
      if (
        e.prepStatus === 'CANCELLED' ||
        (e.prepStatus === 'DELIVERED' && e.paymentStatus === 'PAID')
      ) {
        return prev.filter((o) => o.appOrderId !== e.appOrderId);
      }
      return prev.map((o) =>
        o.appOrderId === e.appOrderId
          ? { ...o, prepStatus: e.prepStatus, paymentStatus: e.paymentStatus }
          : o,
      );
    });
  }, []);
  useSocketEvent<AppOrderStatusEvent>(SOCKET_EVENTS.APP_ORDER_STATUS, onStatus);

  // Khách HỦY -> thẻ đỏ + còi + toast (giữ tới khi bấm "Đã xem").
  const onCancelled = useCallback((e: AppOrderCancelledEvent) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.appOrderId === e.appOrderId
          ? { ...o, prepStatus: 'CANCELLED' as PrepStatus }
          : o,
      ),
    );
    alarm();
    setToast({ type: 'error', message: `Khách đã hủy đơn ${e.orderCode}` });
  }, []);
  useSocketEvent<AppOrderCancelledEvent>(
    SOCKET_EVENTS.APP_ORDER_CANCELLED,
    onCancelled,
  );

  const setStatus = async (o: AppOrder, status: PrepStatus) => {
    setBusy(o.appOrderId);
    try {
      const updated = await api.updateAppOrderStatus(o.appOrderId, status);
      setOrders((prev) =>
        status === 'CANCELLED'
          ? prev.filter((x) => x.appOrderId !== o.appOrderId)
          : prev.map((x) => (x.appOrderId === o.appOrderId ? updated : x)),
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      // Dự phòng: nếu backend báo đơn đã kết thúc/hủy (vd khách vừa hủy mà thẻ
      // chưa kịp đổi do lỡ sự kiện) -> chuyển luôn thẻ sang ĐÃ HỦY + nút "Đã xem".
      if (/kết thúc|đã hủy|đã huỷ/i.test(msg)) {
        setOrders((prev) =>
          prev.map((x) =>
            x.appOrderId === o.appOrderId
              ? { ...x, prepStatus: 'CANCELLED' as PrepStatus }
              : x,
          ),
        );
        alarm();
        setToast({ type: 'error', message: `Đơn ${o.orderCode} đã bị hủy` });
      } else {
        setToast({ type: 'error', message: msg || 'Không cập nhật được' });
      }
    } finally {
      setBusy(null);
    }
  };

  const confirmPayment = async (o: AppOrder) => {
    setBusy(o.appOrderId);
    try {
      await api.confirmAppOrderPayment(o.appOrderId);
      // Đã giao + đã thu -> xong, gỡ thẻ.
      setOrders((prev) => prev.filter((x) => x.appOrderId !== o.appOrderId));
      setToast({ type: 'success', message: `Đã thu tiền đơn ${o.orderCode}` });
    } catch (e) {
      setToast({
        type: 'error',
        message: e instanceof Error ? e.message : 'Không ghi nhận được',
      });
    } finally {
      setBusy(null);
    }
  };

  const dismiss = (o: AppOrder) =>
    setOrders((prev) => prev.filter((x) => x.appOrderId !== o.appOrderId));

  if (orders.length === 0) {
    return <Toast toast={toast} onClose={() => setToast(null)} />;
  }

  return (
    <section className="border-b-2 border-accent/40 bg-accent/5">
      <h2 className="flex items-center gap-2 px-3 pt-2 text-sm font-bold text-accent-foreground">
        <ShoppingBag className="h-4 w-4" /> Đơn online ({orders.length})
      </h2>
      <div className="flex gap-3 overflow-x-auto p-3">
        {orders.map((o) => {
          const cancelled = o.prepStatus === 'CANCELLED';
          const meta = STATUS_META[o.prepStatus];
          const codUnpaid =
            o.prepStatus === 'DELIVERED' &&
            o.paymentMethod === 'COD' &&
            o.paymentStatus !== 'PAID';

          return (
            <div
              key={o.appOrderId}
              className={`flex w-72 shrink-0 flex-col rounded-2xl border-2 p-3 shadow-sm ${
                cancelled
                  ? 'border-destructive bg-destructive/5'
                  : 'border-border bg-card'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold">{o.orderCode}</span>
                <span className="flex items-center gap-1 rounded-lg bg-muted px-2 py-0.5 text-xs font-semibold">
                  {o.fulfillment === 'DELIVERY' ? (
                    <>
                      <Bike className="h-3.5 w-3.5" /> Giao
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="h-3.5 w-3.5" /> Lấy
                    </>
                  )}
                </span>
              </div>

              <div className="mt-1 text-sm">
                <p className="font-semibold">{o.customerName ?? 'Khách'}</p>
                {o.customerPhone && (
                  <p className="text-muted-foreground">{o.customerPhone}</p>
                )}
                {o.fulfillment === 'DELIVERY' && o.customerAddress && (
                  <p className="text-xs text-muted-foreground">
                    {o.customerAddress}
                  </p>
                )}
              </div>

              <ul className="mt-2 space-y-0.5 border-t border-dashed pt-2 text-sm">
                {o.items.map((it, i) => (
                  <li key={i} className="flex justify-between gap-2">
                    <span>
                      <span className="font-bold">{it.quantity}×</span> {it.name}
                      {it.note && (
                        <span className="text-xs text-muted-foreground">
                          {' '}
                          ({it.note})
                        </span>
                      )}
                    </span>
                    <span className="tabular text-muted-foreground">
                      {formatVnd(it.unitPrice * it.quantity)}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-2 flex items-center justify-between border-t border-dashed pt-2">
                <span className="text-xs font-medium text-muted-foreground">
                  {o.paymentMethod === 'COD'
                    ? o.paymentStatus === 'PAID'
                      ? 'COD · đã thu'
                      : 'COD · thu khi giao'
                    : 'CK · đã trả'}
                </span>
                <span className="text-base font-extrabold">
                  {formatVnd(o.totalAmount)}
                </span>
              </div>

              <div className="mt-2">
                {cancelled ? (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-destructive/15 px-2 py-1 text-xs font-bold text-destructive">
                    <XCircle className="h-3.5 w-3.5" /> KHÁCH ĐÃ HỦY
                  </span>
                ) : (
                  <span
                    className={`inline-block rounded-lg px-2 py-1 text-xs font-bold ${meta.cls}`}
                  >
                    {codUnpaid ? 'Đã giao · chờ thu tiền' : meta.label}
                  </span>
                )}
              </div>

              {/* Hành động */}
              <div className="mt-2 flex gap-2">
                {cancelled ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => dismiss(o)}
                  >
                    Đã xem
                  </Button>
                ) : codUnpaid ? (
                  <Button
                    size="sm"
                    variant="success"
                    className="flex-1"
                    disabled={busy === o.appOrderId}
                    onClick={() => confirmPayment(o)}
                  >
                    <Banknote className="h-4 w-4" /> Xác nhận đã thu tiền
                  </Button>
                ) : (
                  <>
                    {meta.next && (
                      <Button
                        size="sm"
                        variant="success"
                        className="flex-1"
                        disabled={busy === o.appOrderId}
                        onClick={() => setStatus(o, meta.next!.status)}
                      >
                        <Check className="h-4 w-4" /> {meta.next.label}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy === o.appOrderId}
                      onClick={() => setStatus(o, 'CANCELLED')}
                      title="Hủy đơn (phía quán)"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <Toast toast={toast} onClose={() => setToast(null)} />
    </section>
  );
}