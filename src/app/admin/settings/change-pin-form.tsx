// ============================================================
//  POS FRONTEND  src/app/admin/settings/change-pin-form.tsx
//  >> CHEP DE (chon staff/admin)
// ============================================================

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, KeyRound, Loader2 } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Toast, type ToastState } from '@/components/ui/toast';

const inputClass =
  'w-full rounded-xl border bg-background px-4 py-3 text-center text-lg tracking-widest outline-none transition focus:border-accent';

export function ChangePinForm() {
  const [target, setTarget] = useState<'staff' | 'admin'>('staff');
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);

  const submit = async () => {
    if (!currentPin.trim())
      return setToast({ type: 'error', message: 'Nhập mã PIN hiện tại' });
    if (!/^\d{4,6}$/.test(newPin))
      return setToast({ type: 'error', message: 'Mã PIN mới phải gồm 4–6 chữ số' });
    if (newPin !== confirmPin)
      return setToast({ type: 'error', message: 'Xác nhận PIN không khớp' });

    setLoading(true);
    try {
      await api.changePin({ currentPin: currentPin.trim(), newPin, target });
      setToast({ type: 'success', message: 'Đã đổi mã PIN' });
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
    } catch (e) {
      setToast({
        type: 'error',
        message: e instanceof ApiError ? e.message : 'Đổi PIN thất bại',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto min-h-dvh max-w-md px-5 py-8">
      <Toast toast={toast} onClose={() => setToast(null)} />

      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Trang chủ
      </Link>

      <div className="space-y-4 rounded-2xl border bg-card p-6">
        <div className="flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent">
            <KeyRound className="h-5 w-5" />
          </span>
          <h1 className="text-lg font-bold">Đổi mã PIN</h1>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Đổi PIN cho</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setTarget('staff')}
              className={cn(
                'rounded-xl border py-2 text-sm font-medium transition',
                target === 'staff'
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'text-muted-foreground',
              )}
            >
              Nhân viên
            </button>
            <button
              type="button"
              onClick={() => setTarget('admin')}
              className={cn(
                'rounded-xl border py-2 text-sm font-medium transition',
                target === 'admin'
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'text-muted-foreground',
              )}
            >
              Admin
            </button>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Mã PIN admin hiện tại</label>
          <input
            type="password"
            inputMode="numeric"
            className={inputClass}
            value={currentPin}
            onChange={(e) => setCurrentPin(e.target.value)}
            placeholder="••••"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Mã PIN mới (4–6 chữ số)
          </label>
          <input
            type="password"
            inputMode="numeric"
            className={inputClass}
            value={newPin}
            onChange={(e) => setNewPin(e.target.value)}
            placeholder="••••"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Xác nhận PIN mới
          </label>
          <input
            type="password"
            inputMode="numeric"
            className={inputClass}
            value={confirmPin}
            onChange={(e) => setConfirmPin(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="••••"
          />
        </div>

        <Button
          variant="accent"
          size="lg"
          className="w-full"
          disabled={loading}
          onClick={submit}
        >
          {loading && <Loader2 className="h-5 w-5 animate-spin" />}
          {loading ? 'Đang đổi…' : 'Đổi mã PIN'}
        </Button>

        <p className="text-xs text-muted-foreground">
          Phiên đăng nhập hiện tại vẫn giữ nguyên. Lần đăng nhập tiếp theo sẽ
          dùng PIN mới.
        </p>
      </div>
    </main>
  );
}