// POS FRONTEND  src/components/pos/refund-alert.tsx  (FILE MỚI)
// Nhắc nhân viên có yêu cầu hoàn tiền chờ xử lý (poll 30s) — hiện trên màn thu ngân.
'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export function RefundAlert() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let active = true;
    const load = () =>
      api
        .getPendingRefunds()
        .then((r) => {
          if (active) setCount(Array.isArray(r) ? r.length : 0);
        })
        .catch(() => {});
    load();
    const t = setInterval(load, 30_000);
    return () => {
      active = false;
      clearInterval(t);
    };
  }, []);

  if (count <= 0) return null;
  return (
    <a
      href="/admin/refunds"
      className="flex items-center justify-between border-b border-amber-300 bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-900"
    >
      <span>🔔 {count} yêu cầu hoàn tiền đang chờ xử lý</span>
      <span className="underline">Xử lý ngay →</span>
    </a>
  );
}
