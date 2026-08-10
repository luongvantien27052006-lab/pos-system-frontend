'use client';

import { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import type { MenuOption, MenuProduct } from '@/types';
import { type CartItem, makeCartItem } from '@/lib/cart';
import { formatVnd } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { QuantityStepper } from '@/components/ui/quantity-stepper';

export function ToppingSheet({
  product,
  onClose,
  onAdd,
}: {
  product: MenuProduct;
  onClose: () => void;
  onAdd: (item: CartItem) => void;
}) {
  const [selected, setSelected] = useState<Record<number, boolean>>({});
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState('');

  const chosen = useMemo(
    () => product.options.filter((o) => selected[o.id]),
    [selected, product.options],
  );
  const unit = product.price + chosen.reduce((s, o) => s + o.price, 0);

  const toggle = (o: MenuOption) =>
    setSelected((p) => ({ ...p, [o.id]: !p[o.id] }));

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40"
      onClick={onClose}
    >
      <div
        className="max-h-[85dvh] overflow-y-auto rounded-t-2xl bg-card p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold leading-tight">{product.name}</h2>
            <p className="text-sm tabular text-muted-foreground">
              {formatVnd(product.price)}
            </p>
          </div>
          <button
            type="button"
            aria-label="Đóng"
            onClick={onClose}
            className="rounded-full p-1 text-muted-foreground hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-2 text-sm font-semibold">Topping</p>
        <div className="space-y-2">
          {product.options.map((o) => {
            const on = !!selected[o.id];
            return (
              <button
                type="button"
                key={o.id}
                onClick={() => toggle(o)}
                className={cn(
                  'flex w-full items-center justify-between rounded-xl border p-3 text-left transition-colors',
                  on ? 'border-accent bg-accent/10' : 'bg-card',
                )}
              >
                <span className="font-medium">{o.name}</span>
                <span className="text-sm tabular text-muted-foreground">
                  {o.price > 0 ? `+${formatVnd(o.price)}` : 'Miễn phí'}
                </span>
              </button>
            );
          })}
        </div>

        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ghi chú (ít đá, ít đường...)"
          className="mt-4 w-full rounded-xl border bg-background p-3 text-sm outline-none focus:border-accent"
        />

        <div className="mt-5 flex items-center justify-between gap-3">
          <QuantityStepper value={qty} min={1} onChange={setQty} />
          <Button
            size="lg"
            variant="accent"
            onClick={() => {
              onAdd(makeCartItem(product, qty, chosen, note.trim() || undefined));
              onClose();
            }}
          >
            Thêm · {formatVnd(unit * qty)}
          </Button>
        </div>
      </div>
    </div>
  );
}