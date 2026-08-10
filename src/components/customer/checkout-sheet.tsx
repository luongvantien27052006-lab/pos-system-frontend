'use client';

import { Banknote, QrCode, X } from 'lucide-react';
import { type CartItem, cartTotal } from '@/lib/cart';
import { formatVnd } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { QuantityStepper } from '@/components/ui/quantity-stepper';

export function CheckoutSheet({
  cart,
  tableNumber,
  submitting,
  onClose,
  onSetQty,
  onCash,
  onTransfer,
}: {
  cart: CartItem[];
  tableNumber: string;
  submitting: boolean;
  onClose: () => void;
  onSetQty: (key: string, qty: number) => void;
  onCash: () => void;
  onTransfer: () => void;
}) {
  const empty = cart.length === 0;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90dvh] flex-col rounded-t-2xl bg-background"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b p-4">
          <div>
            <h2 className="text-lg font-bold">Đơn của bạn</h2>
            <p className="text-sm text-muted-foreground">Bàn {tableNumber}</p>
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

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {empty && (
            <p className="py-8 text-center text-muted-foreground">
              Giỏ trống. Hãy chọn thêm món.
            </p>
          )}
          {cart.map((c) => (
            <div key={c.key} className="flex gap-3">
              <div className="min-w-0 flex-1">
                <div className="font-medium">{c.product.name}</div>
                {c.options.map((o) => (
                  <div key={o.id} className="text-xs text-muted-foreground">
                    + {o.name}
                  </div>
                ))}
                {c.note && (
                  <div className="text-xs italic text-muted-foreground">
                    {c.note}
                  </div>
                )}
                <div className="mt-1 text-sm tabular text-accent">
                  {formatVnd(c.unitPrice)}
                </div>
              </div>
              <div className="flex flex-col items-end justify-between gap-2">
                <QuantityStepper
                  value={c.quantity}
                  min={0}
                  onChange={(q) => onSetQty(c.key, q)}
                />
                <span className="text-sm font-semibold tabular">
                  {formatVnd(c.unitPrice * c.quantity)}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-3 border-t p-4">
          <div className="flex items-center justify-between text-lg">
            <span className="font-semibold">Tổng cộng</span>
            <span className="font-extrabold tabular text-accent">
              {formatVnd(cartTotal(cart))}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button
              size="lg"
              variant="outline"
              disabled={empty || submitting}
              onClick={onCash}
            >
              <Banknote className="h-5 w-5" /> Tiền mặt
            </Button>
            <Button
              size="lg"
              variant="accent"
              disabled={empty || submitting}
              onClick={onTransfer}
            >
              <QrCode className="h-5 w-5" /> Chuyển khoản
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}