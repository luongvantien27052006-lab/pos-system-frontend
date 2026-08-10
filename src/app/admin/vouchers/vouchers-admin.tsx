// ============================================================
//  POS FRONTEND  src/app/admin/vouchers/vouchers-admin.tsx
//  >> CHEP DE (them o Giam toi da + Don toi thieu)
// ============================================================

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Ticket } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { VoucherItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Toast, type ToastState } from '@/components/ui/toast';

const inputClass =
  'w-full rounded-xl border bg-background px-3 py-2 outline-none transition focus:border-accent';

function fmtVnd(n: number) {
  return new Intl.NumberFormat('vi-VN').format(n) + 'đ';
}
function fmtDate(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('vi-VN');
}
// datetime-local mặc định: +7 ngày lúc tạo
function plusDaysLocal(days: number) {
  const d = new Date(Date.now() + days * 86400000);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export function VouchersAdmin() {
  const [items, setItems] = useState<VoucherItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState('20');
  const [minOrderValue, setMinOrderValue] = useState('0');
  const [maxDiscountAmount, setMaxDiscountAmount] = useState('');
  const [totalUsageLimit, setTotalUsageLimit] = useState('');
  const [perUserLimit, setPerUserLimit] = useState('1');
  const [startDate, setStartDate] = useState(plusDaysLocal(0));
  const [endDate, setEndDate] = useState(plusDaysLocal(30));

  const reload = async () => {
    try {
      setItems(await api.listVouchers());
    } catch {
      setToast({ type: 'error', message: 'Không tải được voucher' });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    reload();
  }, []);

  const reset = () => {
    setCode('');
    setName('');
    setType('PERCENTAGE');
    setDiscountValue('20');
    setMinOrderValue('0');
    setMaxDiscountAmount('');
    setTotalUsageLimit('');
    setPerUserLimit('1');
    setStartDate(plusDaysLocal(0));
    setEndDate(plusDaysLocal(30));
  };

  const submit = async () => {
    if (!code.trim()) return setToast({ type: 'error', message: 'Nhập mã voucher' });
    if (!name.trim()) return setToast({ type: 'error', message: 'Nhập tên voucher' });
    const disc = Number(discountValue);
    if (!disc || disc <= 0) return setToast({ type: 'error', message: 'Giá trị giảm không hợp lệ' });

    setSubmitting(true);
    try {
      await api.createVoucher({
        code: code.trim().toUpperCase(),
        name: name.trim(),
        type,
        discountValue: disc,
        minOrderValue: Number(minOrderValue) || 0,
        maxDiscountAmount:
          type === 'PERCENTAGE' && maxDiscountAmount
            ? Number(maxDiscountAmount)
            : undefined,
        totalUsageLimit: totalUsageLimit ? Number(totalUsageLimit) : undefined,
        perUserLimit: Number(perUserLimit) || 1,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
      });
      setToast({ type: 'success', message: 'Đã tạo voucher' });
      reset();
      await reload();
    } catch (e) {
      setToast({
        type: 'error',
        message: e instanceof ApiError ? e.message : 'Tạo voucher thất bại',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto min-h-dvh max-w-5xl px-5 py-8">
      <Toast toast={toast} onClose={() => setToast(null)} />
      <header className="mb-6">
        <Link
          href="/"
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Trang chủ
        </Link>
        <h1 className="text-2xl font-bold">Quản lý voucher</h1>
        <p className="text-sm text-muted-foreground">
          Tạo mã giảm giá. Đặt “Giới hạn/người = 1” cho voucher người mới.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
        {/* Form */}
        <div className="h-fit space-y-3 rounded-2xl border bg-card p-6">
          <h2 className="text-lg font-bold">Tạo voucher</h2>
          <div>
            <label className="mb-1 block text-sm font-medium">Mã voucher</label>
            <input className={inputClass} value={code} onChange={(e) => setCode(e.target.value)} placeholder="VD: NEWBIE40" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Tên hiển thị</label>
            <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: Ưu đãi thành viên mới" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Loại</label>
              <select className={inputClass} value={type} onChange={(e) => setType(e.target.value)}>
                <option value="PERCENTAGE">Giảm %</option>
                <option value="FIXED_AMOUNT">Giảm tiền</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                {type === 'PERCENTAGE' ? 'Giảm (%)' : 'Giảm (đ)'}
              </label>
              <input className={inputClass} type="number" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Đơn tối thiểu (đ)</label>
            <input className={inputClass} type="number" value={minOrderValue} onChange={(e) => setMinOrderValue(e.target.value)} />
          </div>
          {type === 'PERCENTAGE' && (
            <div>
              <label className="mb-1 block text-sm font-medium">
                Giảm tối đa (đ)
              </label>
              <input
                className={inputClass}
                type="number"
                value={maxDiscountAmount}
                onChange={(e) => setMaxDiscountAmount(e.target.value)}
                placeholder="Không giới hạn"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                VD: giảm 40% nhưng tối đa 30.000đ.
              </p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Tổng lượt (toàn bộ)</label>
              <input className={inputClass} type="number" value={totalUsageLimit} onChange={(e) => setTotalUsageLimit(e.target.value)} placeholder="Không giới hạn" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Giới hạn/người</label>
              <input className={inputClass} type="number" value={perUserLimit} onChange={(e) => setPerUserLimit(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Bắt đầu</label>
            <input className={inputClass} type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Hết hạn</label>
            <input className={inputClass} type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <Button variant="accent" size="lg" className="w-full" disabled={submitting} onClick={submit}>
            {submitting && <Loader2 className="h-5 w-5 animate-spin" />}
            {submitting ? 'Đang tạo…' : 'Tạo voucher'}
          </Button>
        </div>

        {/* List */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold">Danh sách ({items.length})</h2>
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Đang tải…
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
              Chưa có voucher nào.
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((v) => {
                const isPct = v.type === 'PERCENTAGE';
                const disc = Number(v.discount_value);
                return (
                  <div key={v.id} className={cn('flex gap-3 rounded-xl border bg-card p-3', v.status !== 'ACTIVE' && 'opacity-60')}>
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                      <Ticket className="h-6 w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold">{v.name}</div>
                      <div className="text-xs text-muted-foreground">
                        Mã <b>{v.code}</b> · {isPct ? `Giảm ${disc}%` : `Giảm ${fmtVnd(disc)}`}
                        {isPct && Number(v.max_discount_amount) > 0
                          ? ` (tối đa ${fmtVnd(Number(v.max_discount_amount))})`
                          : ''}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        HSD {fmtDate(v.end_date)} · Giới hạn {v.per_user_limit}/người ·{' '}
                        {v.total_usage_limit
                          ? `Đã dùng ${v.total_used_count}/${v.total_usage_limit}`
                          : `Đã dùng ${v.total_used_count} (không giới hạn)`}
                      </div>
                    </div>
                    <span className={cn('h-fit rounded-full px-2 py-0.5 text-[11px] font-medium', v.status === 'ACTIVE' ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground')}>
                      {v.status === 'ACTIVE' ? 'Đang chạy' : 'Tắt'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}