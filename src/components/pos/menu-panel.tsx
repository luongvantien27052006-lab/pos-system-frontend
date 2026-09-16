'use client';

import { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import type { Menu, MenuProduct } from '@/types';
import { formatVnd } from '@/lib/format';
import { cn } from '@/lib/utils';

/** Bỏ dấu tiếng Việt + thường hoá để tìm không cần gõ dấu. */
function normalize(s: string): string {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');
}
/** Chữ cái đầu mỗi từ -> khớp "viết tắt" (vd "tccm" -> "trai cay cham muoi"). */
function initials(s: string): string {
  return normalize(s)
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join('');
}
/** Khớp theo tên đầy đủ HOẶC tên viết tắt (chứa chuỗi hoặc chữ cái đầu). */
function matchesQuery(p: MenuProduct, q: string): boolean {
  const nq = normalize(q).replace(/\s+/g, ' ').trim();
  if (!nq) return true;
  const nqNoSpace = nq.replace(/\s+/g, '');
  const names = [p.name, p.shortName].filter(Boolean) as string[];
  return names.some((n) => {
    const nn = normalize(n);
    return nn.includes(nq) || initials(n).includes(nqNoSpace);
  });
}

export function MenuPanel({
  menu,
  onTap,
}: {
  menu: Menu;
  onTap: (p: MenuProduct) => void;
}) {
  const [activeCat, setActiveCat] = useState(menu.categories[0]?.id ?? 0);
  const [query, setQuery] = useState('');

  const cat =
    menu.categories.find((c) => c.id === activeCat) ?? menu.categories[0];
  const searching = query.trim().length > 0;

  const results = useMemo(() => {
    if (!searching) return [];
    const seen = new Set<number>();
    const out: MenuProduct[] = [];
    for (const c of menu.categories) {
      for (const p of c.products) {
        if (seen.has(p.id)) continue;
        if (matchesQuery(p, query)) {
          seen.add(p.id);
          out.push(p);
        }
      }
    }
    return out;
  }, [menu, query, searching]);

  // forceEnabled: trong kết quả TÌM, cho bấm cả món "tạm hết" (thu ngân chủ động).
  const renderCard = (p: MenuProduct, forceEnabled: boolean) => {
    const off = !p.isAvailable;
    return (
      <button
        key={p.id}
        type="button"
        disabled={!forceEnabled && off}
        onClick={() => onTap(p)}
        className={cn(
          'relative flex aspect-square flex-col justify-between rounded-xl border bg-card p-3 text-left transition active:scale-[0.97]',
          !forceEnabled && off && 'opacity-50',
        )}
      >
        {off && (
          <span className="absolute right-2 top-2 rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-600">
            tạm hết
          </span>
        )}
        <span className="text-base font-bold leading-tight">
          {p.shortName || p.name}
        </span>
        <span className="tabular font-semibold text-accent">
          {formatVnd(p.price)}
        </span>
      </button>
    );
  };

  return (
    <div className="flex min-h-0 flex-col">
      {/* Ô tìm món */}
      <div className="border-b p-3">
        <div className="flex items-center gap-2 rounded-lg border bg-background px-3">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm món (gõ tên hoặc viết tắt, không cần dấu)…"
            className="w-full bg-transparent py-2.5 text-sm outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="shrink-0 text-muted-foreground transition hover:text-foreground"
              aria-label="Xoá tìm kiếm"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {searching ? (
        // ---- Chế độ TÌM: gộp mọi danh mục, cho bấm cả món tạm hết ----
        <div className="grid flex-1 grid-cols-2 content-start gap-3 overflow-y-auto p-3 sm:grid-cols-3 xl:grid-cols-4">
          {results.length === 0 ? (
            <p className="col-span-full py-10 text-center text-sm text-muted-foreground">
              Không tìm thấy món khớp “{query}”.
            </p>
          ) : (
            results.map((p) => renderCard(p, true))
          )}
        </div>
      ) : (
        <>
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

          {/* Lưới món của danh mục (giữ nguyên: món tạm hết bị mờ) */}
          <div className="grid flex-1 grid-cols-2 content-start gap-3 overflow-y-auto p-3 sm:grid-cols-3 xl:grid-cols-4">
            {cat?.products.map((p) => renderCard(p, false))}
          </div>
        </>
      )}
    </div>
  );
}
