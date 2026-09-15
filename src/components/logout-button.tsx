// POS FRONTEND  src/components/logout-button.tsx  (FILE MỚI)
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, LogOut } from 'lucide-react';

/** Nút Đăng xuất: xoá phiên rồi về màn nhập mã PIN. */
export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const logout = async () => {
    setBusy(true);
    try {
      await fetch('/api/staff-logout', { method: 'POST' });
    } catch {
      /* bỏ qua */
    }
    router.replace('/staff-login');
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={() => void logout()}
      disabled={busy}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-60"
    >
      {busy ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <LogOut className="h-4 w-4" />
      )}
      Đăng xuất
    </button>
  );
}
