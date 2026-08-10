'use client';

import { useState } from 'react';
import type { Menu, MenuProduct } from '@/types';
import { formatVnd } from '@/lib/format';
import { cn } from '@/lib/utils';

export function MenuPanel({
  menu,
  onTap,
}: {
  menu: Menu;
  onTap: (p: MenuProduct) => void;
}) {
  const [activeCat, setActiveCat] = useState(menu.categories[0]?.id ?? 0);
  const cat =
    menu.categories.find((c) => c.id === activeCat) ?? menu.categories[0];

  return (
    <div className="flex min-h-0 flex-col">
      {/* Tab danh mục */}
      <div className="flex gap-2 overflow-x-auto border-b p-3">
        {menu.categories.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setActiveCat(c.id)}
            className={cn(
              'whitespace-nowrap rounded-lg px-4 py-2 font-semibold transition',
              c.id === activeCat
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/70',
            )}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Lưới món — nút to, hiện tên viết tắt cho nhanh */}
      <div className="grid flex-1 grid-cols-2 content-start gap-3 overflow-y-auto p-3 sm:grid-cols-3 xl:grid-cols-4">
        {cat?.products.map((p) => (
          <button
            key={p.id}
            type="button"
            disabled={!p.isAvailable}
            onClick={() => onTap(p)}
            className="flex aspect-square flex-col justify-between rounded-xl border bg-card p-3 text-left transition active:scale-[0.97] disabled:opacity-50"
          >
            <span className="text-base font-bold leading-tight">
              {p.shortName || p.name}
            </span>
            <span className="tabular font-semibold text-accent">
              {formatVnd(p.price)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}