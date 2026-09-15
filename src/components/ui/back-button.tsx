// POS FRONTEND  src/components/ui/back-button.tsx  (FILE MỚI)
'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

/** Nút "Quay lại" dùng chung. Mặc định router.back(); truyền href để về 1 trang cụ thể. */
export function BackButton({
  label = 'Quay lại',
  href,
  className = '',
}: {
  label?: string;
  href?: string;
  className?: string;
}) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => (href ? router.push(href) : router.back())}
      className={
        'inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground ' +
        className
      }
    >
      <ArrowLeft className="h-4 w-4" /> {label}
    </button>
  );
}
