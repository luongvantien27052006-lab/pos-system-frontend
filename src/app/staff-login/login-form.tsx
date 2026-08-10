'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function StaffLoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') || '/';

  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!pin.trim()) return setError('Nhập mã PIN');
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/staff-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pin.trim() }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          message?: string;
        };
        setError(data.message || 'Đăng nhập thất bại');
        return;
      }
      router.replace(next);
      router.refresh();
    } catch {
      setError('Không kết nối được máy chủ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-dvh items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-5 rounded-2xl border bg-card p-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
            <Lock className="h-6 w-6" />
          </span>
          <h1 className="text-xl font-bold">Khu vực nhân viên</h1>
          <p className="text-sm text-muted-foreground">
            Nhập mã PIN để vào hệ thống quản lý
          </p>
        </div>

        <input
          type="password"
          inputMode="numeric"
          autoFocus
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="Mã PIN"
          className="w-full rounded-xl border bg-background px-4 py-3 text-center text-lg tracking-widest outline-none focus:border-accent"
        />

        {error && <p className="text-center text-sm text-warning-foreground">{error}</p>}

        <Button
          variant="accent"
          size="lg"
          className="w-full"
          disabled={loading}
          onClick={submit}
        >
          {loading && <Loader2 className="h-5 w-5 animate-spin" />}
          {loading ? 'Đang kiểm tra…' : 'Vào hệ thống'}
        </Button>
      </div>
    </main>
  );
}