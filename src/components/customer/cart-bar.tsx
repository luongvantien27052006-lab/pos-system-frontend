'use client';

import { ShoppingBag } from 'lucide-react';
import { type CartItem, cartCount, cartTotal } from '@/lib/cart';
import { formatVnd } from '@/lib/format';

export function CartBar({
  cart,
  onCheckout,
}: {
  cart: CartItem[];
  onCheckout: () => void;
}) {
  const count = cartCount(cart);
  if (count === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 p-3 backdrop-blur">
      <button
        type="button"
        onClick={onCheckout}
        className="flex w-full items-center justify-between rounded-xl bg-primary px-5 py-4 text-primary-foreground transition active:scale-[0.99]"
      >
        <span className="flex items-center gap-3 font-semibold">
          <span className="relative">
            <ShoppingBag className="h-5 w-5" />
            <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-xs">
              {count}
            </span>
          </span>
          Xem giỏ &amp; thanh toán
        </span>
        <span className="text-lg font-bold tabular">
          {formatVnd(cartTotal(cart))}
        </span>
      </button>
    </div>
  );
}