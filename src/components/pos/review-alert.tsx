// POS FRONTEND  src/components/pos/review-alert.tsx  (FILE MỚI)
// Nhắc nhân viên có đánh giá XẤU từ App chưa xử lý (poll 60s) — màn thu ngân.
'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export function ReviewAlert() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let active = true;
    const load = () =>
      api
        .negativeReviewCount()
        .then((r) => {
          if (active) setCount(Number(r?.open ?? 0));
        })
        .catch(() => {});
    load();
    const t = setInterval(load, 60_000);
    return () => {
      active = false;
      clearInterval(t);
    };
  }, []);

  if (count <= 0) return null;
  return (
    <a
      href="/admin/reviews?tab=negative"
      className="flex items-center justify-between border-b border-rose-300 bg-rose-100 px-4 py-2 text-sm font-semibold text-rose-900"
    >
      <span>⚠️ {count} đánh giá chưa tốt từ khách cần xem</span>
      <span className="underline">Xem ngay →</span>
    </a>
  );
}
