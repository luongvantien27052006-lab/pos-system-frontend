// ============================================================
//  POS FRONTEND  src/components/pos/printer-alert.tsx
//  >> FILE MOI (banner canh bao may in)
// ============================================================

'use client';

import { useCallback, useEffect, useState } from 'react';
import { Printer, TriangleAlert } from 'lucide-react';
import { api } from '@/lib/api';

/**
 * Cảnh báo khi máy in không nhận lệnh: có bill chờ quá 2 phút.
 * Nguyên nhân thường gặp: máy chạy agent tắt, mất mạng, hoặc sai IP máy in.
 * Bill KHÔNG mất — sẽ in ra khi agent hoạt động lại.
 */
export function PrinterAlert() {
  const [stuck, setStuck] = useState(0);
  const [lastPrinted, setLastPrinted] = useState<string | null>(null);

  const check = useCallback(async () => {
    try {
      const h = await api.printHealth();
      setStuck(h.stuckCount);
      setLastPrinted(h.lastPrintedAt);
    } catch {
      /* mất kết nối backend: bỏ qua, vòng sau thử lại */
    }
  }, []);

  useEffect(() => {
    check();
    const t = setInterval(check, 30_000);
    return () => clearInterval(t);
  }, [check]);

  if (stuck === 0) return null;

  const lastLabel = lastPrinted
    ? new Date(lastPrinted).toLocaleTimeString('vi-VN')
    : 'chưa có';

  return (
    <div className="flex flex-wrap items-center gap-3 border-b-2 border-warning bg-warning/15 px-4 py-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning text-warning-foreground">
        <TriangleAlert className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-bold">
          Máy in chưa nhận lệnh — {stuck} bill đang chờ
        </p>
        <p className="text-sm text-muted-foreground">
          Kiểm tra máy chạy agent in (còn bật, cùng WiFi với máy in). Bill không
          mất, sẽ in ra khi agent hoạt động lại. Lần in cuối: {lastLabel}
        </p>
      </div>
      <span className="flex items-center gap-1 text-sm text-muted-foreground">
        <Printer className="h-4 w-4" /> Hàng đợi in
      </span>
    </div>
  );
}