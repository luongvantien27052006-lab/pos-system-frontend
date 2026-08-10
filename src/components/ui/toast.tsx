'use client';

import { useEffect } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

export type ToastState = { type: 'success' | 'error'; message: string } | null;

export function Toast({
  toast,
  onClose,
}: {
  toast: ToastState;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [toast, onClose]);

  if (!toast) return null;
  const ok = toast.type === 'success';

  return (
    <div className="fixed right-4 top-4 z-[80] flex items-center gap-2 rounded-xl border bg-card px-4 py-3 shadow-lg">
      {ok ? (
        <CheckCircle2 className="h-5 w-5 text-success" />
      ) : (
        <XCircle className="h-5 w-5 text-warning-foreground" />
      )}
      <span className="text-sm font-medium">{toast.message}</span>
    </div>
  );
}