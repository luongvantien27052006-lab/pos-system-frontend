'use client';

import Image from 'next/image';
import { CheckCircle2, Loader2 } from 'lucide-react';
import type { OrderSession, QrInfo } from '@/types';
import { formatVnd } from '@/lib/format';

type Mode = 'cash_waiting' | 'qr' | 'paid';

export function PaymentResult({
  mode,
  session,
  qr,
}: {
  mode: Mode;
  session: OrderSession;
  qr: QrInfo | null;
}) {
  if (mode === 'paid') {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-8 text-center">
        <CheckCircle2 className="h-20 w-20 text-success" />
        <h1 className="text-2xl font-bold">Thanh toán thành công</h1>
        <p className="text-muted-foreground">
          Cảm ơn Quý khách! Đồ uống đang được chuẩn bị.
        </p>
      </main>
    );
  }

  if (mode === 'cash_waiting') {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-5 p-8 text-center">
        <div className="w-full max-w-xs rounded-2xl bg-warning/15 p-6">
          <p className="text-sm font-medium text-muted-foreground">
            Vui lòng ra quầy thanh toán
          </p>
          <p className="mt-1 text-4xl font-extrabold tabular text-warning-foreground">
            {formatVnd(session.total)}
          </p>
        </div>
        <p className="text-muted-foreground">
          Mã đơn <span className="font-semibold">{session.orderCode}</span>
        </p>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Đang chờ thu ngân xác
          nhận…
        </div>
      </main>
    );
  }

  // mode === 'qr'
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-xl font-bold">Quét mã để chuyển khoản</h1>
      {qr && (
        <Image
          src={qr.qrImageUrl}
          alt="Mã VietQR"
          width={260}
          height={260}
          unoptimized
          className="rounded-xl border bg-white"
        />
      )}
      <p className="text-3xl font-extrabold tabular text-accent">
        {formatVnd(session.total)}
      </p>
      <p className="text-sm text-muted-foreground">
        Nội dung: <span className="font-semibold">{qr?.orderCode}</span>
      </p>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Đang chờ xác nhận giao
        dịch…
      </div>
    </main>
  );
}