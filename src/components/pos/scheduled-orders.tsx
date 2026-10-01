// POS FRONTEND  src/components/pos/scheduled-orders.tsx  (FILE MỚI)
// Thanh "Đơn hẹn giờ sắp tới": xem trước đơn đặt trước (App đang giữ).
// Chỉ để XEM — tới giờ hẹn trừ 20 phút, đơn tự vào danh sách đơn online như thường.
'use client';

import { useEffect, useState } from 'react';
import { CalendarClock, ChevronDown, ChevronUp } from 'lucide-react';
import { api, type ScheduledOrder } from '@/lib/api';

const money = (n: number | string) =>
  (Math.round(Number(n)) || 0).toLocaleString('vi-VN') + 'đ';

const when = (s: string) => {
  const d = new Date(s);
  const now = new Date();
  const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const sameDay = d.toDateString() === now.toDateString();
  const tmr = new Date(now);
  tmr.setDate(now.getDate() + 1);
  if (sameDay) return `${time} hôm nay`;
  if (d.toDateString() === tmr.toDateString()) return `${time} ngày mai`;
  return `${time} ${d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}`;
};

export function ScheduledOrders() {
  const [list, setList] = useState<ScheduledOrder[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let active = true;
    const load = () =>
      api
        .getScheduledOrders()
        .then((r) => {
          if (active) setList(Array.isArray(r) ? r : []);
        })
        .catch(() => {});
    load();
    const t = setInterval(load, 60_000);
    return () => {
      active = false;
      clearInterval(t);
    };
  }, []);

  if (list.length === 0) return null;

  return (
    <div className="border-b border-sky-300 bg-sky-50 text-sky-900 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-100">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-2 text-sm font-semibold"
      >
        <span className="flex items-center gap-2">
          <CalendarClock className="h-4 w-4" />
          {list.length} đơn hẹn giờ sắp tới — gần nhất {when(list[0].scheduled_for)}
        </span>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {open && (
        <div className="max-h-80 space-y-2 overflow-y-auto px-4 pb-3">
          {list.map((o) => {
            const addr = o.delivery_address as Record<string, unknown> | null;
            const delivery = !!addr;
            const paid = o.payment_status === 'CONFIRMED';
            return (
              <div key={o.id} className="rounded-xl border bg-card p-3 text-sm text-foreground">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold">
                      APP-{o.id.slice(0, 8).toUpperCase()} · {when(o.scheduled_for)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {o.customer_name ?? 'Khách'}
                      {o.customer_phone ? ` · ${o.customer_phone}` : ''} ·{' '}
                      {delivery ? 'Giao hàng' : 'Tự đến lấy'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-extrabold">{money(o.final_amount)}</p>
                    <p
                      className={
                        paid
                          ? 'text-xs font-semibold text-emerald-600'
                          : 'text-xs font-semibold text-amber-600'
                      }
                    >
                      {paid ? 'Đã thanh toán' : 'Thu khi giao (COD)'}
                    </p>
                  </div>
                </div>
                <ul className="mt-2 space-y-0.5">
                  {o.items.map((it, i) => (
                    <li key={i}>
                      <span className="font-semibold">{it.quantity}×</span>{' '}
                      {it.name ?? 'Món đã xoá'}
                      {it.options && it.options.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {' '}
                          ({it.options.map((op) => op.name).join(', ')})
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
          <p className="text-[11px] opacity-70">
            Đơn sẽ tự vào danh sách đơn online 20 phút trước giờ hẹn để pha chế.
          </p>
        </div>
      )}
    </div>
  );
}
