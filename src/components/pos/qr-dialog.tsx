'use client';

import Image from 'next/image';
import { Loader2, X } from 'lucide-react';
import type { QrInfo } from '@/types';
import { formatVnd } from '@/lib/format';

export function QrDialog({
  qr,
  onClose,
}: {
  qr: QrInfo;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-card p-6 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">Quét mã chuyển khoản</h2>
          <button
            type="button"
            aria-label="Đóng"
            onClick={onClose}
            className="rounded-full p-1 text-muted-foreground hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <Image
          src={qr.qrImageUrl}
          alt="Mã VietQR"
          width={280}
          height={280}
          unoptimized
          className="mx-auto rounded-xl border bg-white"
        />
        <p className="mt-3 text-3xl font-extrabold tabular text-accent">
          {formatVnd(qr.amount)}
        </p>
        <p className="text-sm text-muted-foreground">
          Nội dung: <span className="font-semibold">{qr.orderCode}</span>
        </p>
        <div className="mt-3 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Đang chờ tiền về…
        </div>
      </div>
    </div>
  );
}