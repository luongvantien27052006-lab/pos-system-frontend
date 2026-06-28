'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { type CartItem, makeCartItem, toAddItems } from '@/lib/cart';
import { socketRooms, useSocketEvent } from '@/lib/socket';
import {
  type Menu,
  type MenuProduct,
  type OrderPaidEvent,
  type OrderSession,
  type QrInfo,
  SOCKET_EVENTS,
} from '@/types';
import { ProductCard } from '@/components/customer/product-card';
import { ToppingSheet } from '@/components/customer/topping-sheet';
import { CartBar } from '@/components/customer/cart-bar';
import { CheckoutSheet } from '@/components/customer/checkout-sheet';
import { PaymentResult } from '@/components/customer/payment-result';

type Phase = 'browsing' | 'checkout' | 'cash_waiting' | 'qr' | 'paid';

function CenterMsg({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh items-center justify-center gap-2 p-8 text-center text-muted-foreground">
      {children}
    </main>
  );
}

export function CustomerApp({ tableNumber }: { tableNumber: string }) {
  const [menu, setMenu] = useState<Menu | null>(null);
  const [session, setSession] = useState<OrderSession | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [phase, setPhase] = useState<Phase>('browsing');
  const [configuring, setConfiguring] = useState<MenuProduct | null>(null);
  const [qr, setQr] = useState<QrInfo | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Tải menu + phiên đơn của bàn
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [m, s] = await Promise.all([
          api.getMenu(),
          api.getTableSession(tableNumber),
        ]);
        if (!active) return;
        setMenu(m);
        setSession(s);
      } catch (e) {
        if (active) {
          setLoadError(
            e instanceof Error ? e.message : 'Không tải được dữ liệu',
          );
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [tableNumber]);

  // Vào phòng socket của bàn để nhận sự kiện PAID
  useEffect(() => {
    socketRooms.joinTable(tableNumber);
  }, [tableNumber]);

  const onPaid = useCallback((e: OrderPaidEvent) => {
    setSession((cur) => {
      if (cur && e.sessionId === cur.id) setPhase('paid');
      return cur;
    });
  }, []);
  useSocketEvent<OrderPaidEvent>(SOCKET_EVENTS.ORDER_PAID, onPaid);

  // Thao tác giỏ
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

  const handleTap = (p: MenuProduct) => {
    if (p.options.length > 0) setConfiguring(p);
    else addToCart(makeCartItem(p, 1, []));
  };

  // Thanh toán: gửi giỏ (append-only) rồi chọn phương thức
  const pay = async (method: 'cash' | 'transfer') => {
    if (!session) return;
    setBusy(true);
    setActionError(null);
    try {
      const withItems = await api.addItems(session.id, toAddItems(cart));
      setSession(withItems);
      if (method === 'cash') {
        const s = await api.payCash(session.id);
        setSession(s);
        setPhase('cash_waiting');
      } else {
        const info = await api.createQr(session.id);
        setQr(info);
        setPhase('qr');
      }
    } catch (e) {
      setActionError(
        e instanceof Error ? e.message : 'Có lỗi xảy ra, vui lòng thử lại',
      );
    } finally {
      setBusy(false);
    }
  };

  if (loadError) return <CenterMsg>{loadError}</CenterMsg>;
  if (!menu || !session) {
    return (
      <CenterMsg>
        <Loader2 className="h-6 w-6 animate-spin" /> Đang tải menu…
      </CenterMsg>
    );
  }

  if (phase === 'cash_waiting' || phase === 'qr' || phase === 'paid') {
    return <PaymentResult mode={phase} session={session} qr={qr} />;
  }

  return (
    <div className="min-h-dvh pb-28">
      <header className="sticky top-0 z-30 border-b bg-background/90 px-4 py-3 backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent">
          Gọi món
        </p>
        <h1 className="text-lg font-bold">Bàn {tableNumber}</h1>
      </header>

      <div className="space-y-6 p-4">
        {menu.categories.map((cat) => (
          <section key={cat.id} className="space-y-3">
            <h2 className="text-base font-bold">{cat.name}</h2>
            <div className="grid gap-3">
              {cat.products.map((p) => (
                <ProductCard key={p.id} product={p} onTap={handleTap} />
              ))}
            </div>
          </section>
        ))}
      </div>

      <CartBar cart={cart} onCheckout={() => setPhase('checkout')} />

      {configuring && (
        <ToppingSheet
          product={configuring}
          onClose={() => setConfiguring(null)}
          onAdd={addToCart}
        />
      )}

      {phase === 'checkout' && (
        <CheckoutSheet
          cart={cart}
          tableNumber={tableNumber}
          submitting={busy}
          onClose={() => setPhase('browsing')}
          onSetQty={setQty}
          onCash={() => pay('cash')}
          onTransfer={() => pay('transfer')}
        />
      )}

      {actionError && (
        <div className="fixed inset-x-4 top-4 z-[60] rounded-xl bg-foreground px-4 py-3 text-sm text-background shadow-lg">
          {actionError}
        </div>
      )}
    </div>
  );
}