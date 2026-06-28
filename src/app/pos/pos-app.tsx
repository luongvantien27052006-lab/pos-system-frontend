'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { socketRooms } from '@/lib/socket';
import { type CartItem, makeCartItem } from '@/lib/cart';
import type { Menu, MenuProduct, PendingCashAlert } from '@/types';
import { CashAlerts } from '@/components/pos/cash-alerts';
import { MenuPanel } from '@/components/pos/menu-panel';
import { OnlineOrders } from '@/components/pos/online-orders';
import { OrderPanel } from '@/components/pos/order-panel';
import { ToppingSheet } from '@/components/customer/topping-sheet';

export function PosApp() {
  const [menu, setMenu] = useState<Menu | null>(null);
  const [alerts, setAlerts] = useState<PendingCashAlert[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [configuring, setConfiguring] = useState<MenuProduct | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    socketRooms.joinPos();
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [m, a] = await Promise.all([
          api.getMenu(),
          api.getPendingCash(),
        ]);
        if (!active) return;
        setMenu(m);
        setAlerts(a);
      } catch (e) {
        if (active) {
          setError(e instanceof Error ? e.message : 'Không tải được dữ liệu');
        }
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const addToCart = useCallback((item: CartItem) => {
    setCart((prev) => {
      const idx = prev.findIndex((c) => c.key === item.key);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = {
          ...copy[idx],
          quantity: copy[idx].quantity + item.quantity,
        };
        return copy;
      }
      return [...prev, item];
    });
  }, []);

  const setQty = useCallback((key: string, qty: number) => {
    setCart((prev) =>
      qty <= 0
        ? prev.filter((c) => c.key !== key)
        : prev.map((c) => (c.key === key ? { ...c, quantity: qty } : c)),
    );
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const handleTap = (p: MenuProduct) => {
    if (p.options.length > 0) setConfiguring(p);
    else addToCart(makeCartItem(p, 1, []));
  };

  if (error) {
    return (
      <main className="flex min-h-dvh items-center justify-center p-8 text-center text-muted-foreground">
        {error}
      </main>
    );
  }
  if (!menu) {
    return (
      <main className="flex min-h-dvh items-center justify-center gap-2 p-8 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" /> Đang tải…
      </main>
    );
  }

  return (
    <div className="flex h-dvh flex-col">
      <CashAlerts initial={alerts} />
      <OnlineOrders />
      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[1fr_400px]">
        <MenuPanel menu={menu} onTap={handleTap} />
        <OrderPanel cart={cart} onSetQty={setQty} onClear={clearCart} />
      </div>

      {configuring && (
        <ToppingSheet
          product={configuring}
          onClose={() => setConfiguring(null)}
          onAdd={addToCart}
        />
      )}
    </div>
  );
}