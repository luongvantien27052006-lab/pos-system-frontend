'use client';

import { useEffect, useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';

type Summary = {
  total: number;
  avgStars: number;
  perProduct: {
    productId: string;
    productName: string | null;
    avgStars: number;
    count: number;
  }[];
  recent: {
    productId: string;
    productName: string | null;
    stars: number;
    comment: string | null;
    createdAt: string;
  }[];
};

function starStr(n: number) {
  const k = Math.round(n);
  return '★★★★★'.slice(0, k) + '☆☆☆☆☆'.slice(0, 5 - k);
}
function dateTime(s: string) {
  const d = new Date(s);
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ReviewsAdmin() {
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      setData(await api.reviewsSummary());
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);

  const comments = (data?.recent ?? []).filter(
    (r) => r.comment && r.comment.trim(),
  );

  return (
    <div className="mx-auto max-w-3xl p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Đánh giá món</h1>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
      </div>

      {loading && !data ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : !data || data.total === 0 ? (
        <p className="py-16 text-center text-muted-foreground">
          Chưa có đánh giá nào.
        </p>
      ) : (
        <>
          <div className="mb-5 rounded-xl border p-4">
            <div className="text-3xl font-bold">
              {data.avgStars.toFixed(1)}{' '}
              <span className="text-amber-500">★</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {data.total} lượt đánh giá
            </div>
          </div>

          <h2 className="mb-2 font-semibold">Theo món</h2>
          <div className="mb-6 space-y-2">
            {data.perProduct.map((p) => (
              <div
                key={p.productId}
                className="flex items-center justify-between rounded-lg border px-3 py-2"
              >
                <span className="font-medium">
                  {p.productName ?? p.productId}
                </span>
                <span className="text-sm">
                  <span className="text-amber-500">{starStr(p.avgStars)}</span>{' '}
                  <span className="text-muted-foreground">
                    {p.avgStars.toFixed(1)} · {p.count} lượt
                  </span>
                </span>
              </div>
            ))}
          </div>

          <h2 className="mb-2 font-semibold">Nhận xét gần đây</h2>
          {comments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Chưa có nhận xét bằng lời.
            </p>
          ) : (
            <div className="space-y-2">
              {comments.map((r, i) => (
                <div key={i} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      {r.productName ?? r.productId}
                    </span>
                    <span className="text-sm text-amber-500">
                      {starStr(r.stars)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm">{r.comment}</p>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {dateTime(r.createdAt)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}