'use client';

import { Coffee, Plus } from 'lucide-react';
import type { MenuProduct } from '@/types';
import { formatVnd } from '@/lib/format';
import { resolveImageUrl } from '@/lib/image';

export function ProductCard({
  product,
  onTap,
}: {
  product: MenuProduct;
  onTap: (p: MenuProduct) => void;
}) {
  const disabled = !product.isAvailable;
  const img = resolveImageUrl(product.imageUrl);

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onTap(product)}
      className="flex gap-3 rounded-xl border bg-card p-3 text-left transition-all active:scale-[0.99] disabled:opacity-50"
    >
      {img ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={img}
          alt={product.name}
          className="h-20 w-20 shrink-0 rounded-lg object-cover"
        />
      ) : (
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Coffee className="h-7 w-7" />
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <h3 className="font-semibold leading-tight">{product.name}</h3>
        {product.options.length > 0 && (
          <span className="text-xs text-muted-foreground">
            Có topping tuỳ chọn
          </span>
        )}
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="font-semibold tabular text-accent">
            {formatVnd(product.price)}
          </span>
          {disabled ? (
            <span className="text-xs font-medium text-muted-foreground">
              Tạm hết
            </span>
          ) : (
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <Plus className="h-5 w-5" />
            </span>
          )}
        </div>
      </div>
    </button>
  );
}