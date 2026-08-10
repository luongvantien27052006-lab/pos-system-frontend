// ============================================================
//  POS FRONTEND  src/components/pos/cash-alerts.tsx
//  >> CHEP DE (nut In lai bill)
// ============================================================

// ============================================================
//  POS FRONTEND (Next.js 14)
//  src/components/pos/cash-alerts.tsx
//  >> CHEP DE (hien danh sach mon khach da chon trong canh bao tien mat)
// ============================================================

'use client';

import { useCallback, useEffect, useState } from 'react';
import { Banknote, Loader2, Printer, QrCode } from 'lucide-react';
import { api } from '@/lib/api';
import { useSocketEvent } from '@/lib/socket';
import {
  type OrderLine,
  type OrderPaidEvent,
  type OrderPendingCashEvent,
  type PendingCashAlert,
  type QrInfo,
  SOCKET_EVENTS,
} from '@/types';
import { formatVnd } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { QrDialog } from './qr-dialog';

export function CashAlerts({ initial }: { initial: PendingCashAlert[] }) {
  const [alerts, setAlerts] = useState<PendingCashAlert[]>(initial);
  const [busy, setBusy] = useState<number | null>(null);
  const [activeQr, setActiveQr] = useState<{
    info: QrInfo;
    sessionId: number;
  } | null>(null);

  // Khách tại bàn chọn tiền mặt -> thêm cảnh báo ghim
  const onPending = useCallback((e: OrderPendingCashEvent) => {
    setAlerts((prev) =>
      prev.some((a) => a.sessionId === e.sessionId)
        ? prev
        : [
            ...prev,
            {
              sessionId: e.sessionId,
              orderCode: e.orderCode,
              tableNumber: e.tableNumber,
              amount: e.amount,
            },
          ],
    );
  }, []);
  useSocketEvent<OrderPendingCashEvent>(
    SOCKET_EVENTS.ORDER_PENDING_CASH,
    onPending,
  );

  // Đã thu tiền (tiền mặt hoặc webhook CK) -> gỡ cảnh báo + đóng QR nếu trùng
  const onPaid = useCallback((e: OrderPaidEvent) => {
    setAlerts((prev) => prev.filter((a) => a.sessionId !== e.sessionId));
    setActiveQr((cur) => (cur && cur.sessionId === e.sessionId ? null : cur));
  }, []);
  useSocketEvent<OrderPaidEvent>(SOCKET_EVENTS.ORDER_PAID, onPaid);

  const confirm = async (sessionId: number) => {
    setBusy(sessionId);
    try {
      await api.confirmCash(sessionId); // backend phát order:paid -> onPaid gỡ cảnh báo
    } finally {
      setBusy(null);
    }
  };

  const showQr = async (sessionId: number) => {
    setBusy(sessionId);
    try {
      const info = await api.createQr(sessionId);
      setActiveQr({ info, sessionId });
    } finally {
      setBusy(null);
    }
  };

  if (alerts.length === 0 && !activeQr) return null;

  return (
    <>
      {alerts.length > 0 && (
        <div className="space-y-2 bg-warning/15 p-3">
          {alerts.map((a) => (
            <AlertCard
              key={a.sessionId}
              alert={a}
              busy={busy === a.sessionId}
              onConfirm={() => confirm(a.sessionId)}
              onShowQr={() => showQr(a.sessionId)}
            />
          ))}
        </div>
      )}

      {activeQr && (
        <QrDialog qr={activeQr.info} onClose={() => setActiveQr(null)} />
      )}
    </>
  );
}

/** Một cảnh báo tiền mặt: tự nạp chi tiết phiên để hiện danh sách món khách đã đặt. */
function AlertCard({
  alert,
  busy,
  onConfirm,
  onShowQr,
}: {
  alert: PendingCashAlert;
  busy: boolean;
  onConfirm: () => void;
  onShowQr: () => void;
}) {
  const [lines, setLines] = useState<OrderLine[] | null>(null);
  const [loadingLines, setLoadingLines] = useState(true);
  const [reprinting, setReprinting] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const s = await api.getSession(alert.sessionId);
        if (active) setLines(s.lines);
      } catch {
        if (active) setLines([]);
      } finally {
        if (active) setLoadingLines(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [alert.sessionId]);

  return (
    <div className="rounded-xl border-2 border-warning bg-card p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning text-warning-foreground">
            <Banknote className="h-5 w-5" />
          </span>
          <div>
            <p className="font-bold">
              {alert.tableNumber ? `Bàn ${alert.tableNumber}` : 'Mang đi'} yêu
              cầu trả tiền mặt
            </p>
            <p className="text-lg font-extrabold tabular text-warning-foreground">
              {formatVnd(alert.amount)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={reprinting}
            onClick={async () => {
              setReprinting(true);
              try {
                await api.reprintBill(alert.sessionId);
              } finally {
                setReprinting(false);
              }
            }}
          >
            {reprinting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Printer className="h-4 w-4" />
            )}
            In lại bill
          </Button>
          <Button variant="outline" disabled={busy} onClick={onShowQr}>
            <QrCode className="h-4 w-4" /> Hiện mã QR
          </Button>
          <Button variant="success" disabled={busy} onClick={onConfirm}>
            <Banknote className="h-4 w-4" /> Đã nhận tiền
          </Button>
        </div>
      </div>

      {/* Danh sách món khách đã chọn */}
      <div className="mt-3 border-t border-warning/30 pt-2">
        {loadingLines ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Đang tải món…
          </p>
        ) : lines && lines.length > 0 ? (
          <ul className="space-y-1.5">
            {lines.map((l) => (
              <li
                key={l.id}
                className="flex items-start justify-between gap-3 text-sm"
              >
                <span className="min-w-0">
                  <span className="font-medium">
                    {l.quantity}× {l.name}
                  </span>
                  {l.toppings.length > 0 && (
                    <span className="block text-xs text-muted-foreground">
                      {l.toppings.map((t) => t.name).join(', ')}
                    </span>
                  )}
                  {l.note && (
                    <span className="block text-xs italic text-muted-foreground">
                      Ghi chú: {l.note}
                    </span>
                  )}
                </span>
                <span className="shrink-0 tabular text-muted-foreground">
                  {formatVnd(l.lineTotal)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Không có món.</p>
        )}
      </div>
    </div>
  );
}