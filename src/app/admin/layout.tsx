// POS FRONTEND  src/app/admin/layout.tsx  (FILE MỚI)
// Gắn nút "Quay lại" cho MỌI trang trong /admin/* (products, vouchers, ...).

import type { ReactNode } from 'react';
import { BackButton } from '@/components/ui/back-button';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="mx-auto max-w-5xl px-5 pt-5">
        <BackButton />
      </div>
      {children}
    </>
  );
}
