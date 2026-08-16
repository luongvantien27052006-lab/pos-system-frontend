'use client';

import { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import type { MenuOption, MenuProduct } from '@/types';
import { type CartItem, makeCartItem, isSizeOption } from '@/lib/cart';
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
  // Tách SIZE (trái cây) và topping thường.
  const sizeOptions = useMemo(
    () => product.options.filter(isSizeOption),
    [product.options],
  );
  const toppingOptions = useMemo(
    () => product.options.filter((o) => !isSizeOption(o)),
    [product.options],
  );
  const isFruit = sizeOptions.length > 0;

  const [selected, setSelected] = useState<Record<number, boolean>>({});
  // Mặc định chọn size đầu tiên (S).
  const [sizeId, setSizeId] = useState<number | null>(
    isFruit ? sizeOptions[0].id : null,
  );
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState('');

  const chosenToppings = useMemo(
    () => toppingOptions.filter((o) => selected[o.id]),
    [selected, toppingOptions],
  );
  const chosenSize = useMemo(
    () => sizeOptions.find((o) => o.id === sizeId) ?? null,
    [sizeOptions, sizeId],
  );

  // Option gửi đi = size (nếu có) + toppings đã chọn.
  const chosenAll: MenuOption[] = useMemo(() => {
    const arr = [...chosenToppings];
    if (chosenSize) arr.unshift(chosenSize);
    return arr;
  }, [chosenToppings, chosenSize]);

  // Trái cây: giá = giá size (thay) + topping; món khác: giá món + topping.
  const base = isFruit ? chosenSize?.price ?? 0 : product.price;
  const unit = base + chosenToppings.reduce((s, o) => s + o.price, 0);

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
              {formatVnd(isFruit ? unit : product.price)}
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

        {/* Chọn kích cỡ (trái cây) — chọn 1, thay giá */}
        {isFruit && (
          <>
            <p className="mb-2 text-sm font-semibold">
              Kích cỡ <span className="text-muted-foreground">(chọn 1)</span>
            </p>
            <div className="mb-4 space-y-2">
              {sizeOptions.map((o) => {
                const on = sizeId === o.id;
                return (
                  <button
                    type="button"
                    key={o.id}
                    onClick={() => setSizeId(o.id)}
                    className={cn(
                      'flex w-full items-center justify-between rounded-xl border p-3 text-left transition-colors',
                      on ? 'border-accent bg-accent/10' : 'bg-card',
                    )}
                  >
                    <span className="flex items-center gap-2 font-medium">
                      <span
                        className={cn(
                          'h-4 w-4 rounded-full border-2',
                          on
                            ? 'border-accent bg-accent'
                            : 'border-muted-foreground/50',
                        )}
                      />
                      {o.name}
                    </span>
                    <span className="text-sm tabular text-muted-foreground">
                      {formatVnd(o.price)}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* Topping — chọn nhiều, cộng dồn */}
        {toppingOptions.length > 0 && (
          <>
            <p className="mb-2 text-sm font-semibold">Topping</p>
            <div className="space-y-2">
              {toppingOptions.map((o) => {
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
          </>
        )}

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
              onAdd(makeCartItem(product, qty, chosenAll, note.trim() || undefined));
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