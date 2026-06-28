'use client';

import { useCallback, useState } from 'react';
import { Banknote, QrCode } from 'lucide-react';
import { api } from '@/lib/api';
import { useSocketEvent } from '@/lib/socket';
import {
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
            <div
              key={a.sessionId}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border-2 border-warning bg-card p-3"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning text-warning-foreground">
                  <Banknote className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-bold">
                    {a.tableNumber ? `Bàn ${a.tableNumber}` : 'Mang đi'} yêu cầu
                    trả tiền mặt
                  </p>
                  <p className="text-lg font-extrabold tabular text-warning-foreground">
                    {formatVnd(a.amount)}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={busy === a.sessionId}
                  onClick={() => showQr(a.sessionId)}
                >
                  <QrCode className="h-4 w-4" /> Hiện mã QR
                </Button>
                <Button
                  variant="success"
                  disabled={busy === a.sessionId}
                  onClick={() => confirm(a.sessionId)}
                >
                  <Banknote className="h-4 w-4" /> Đã nhận tiền
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeQr && (
        <QrDialog qr={activeQr.info} onClose={() => setActiveQr(null)} />
      )}
    </>
  );
}