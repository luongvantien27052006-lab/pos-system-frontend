import type { AddItemInput, MenuOption, MenuProduct } from '@/types';

export interface CartItem {
  key: string; // gộp các dòng giống hệt nhau (cùng món + cùng topping + cùng ghi chú)
  product: MenuProduct;
  quantity: number;
  options: MenuOption[];
  note?: string;
  unitPrice: number; // giá món + tổng giá topping
}

/** Khóa để gộp dòng trùng. */
export function cartKey(
  productId: number,
  options: MenuOption[],
  note?: string,
): string {
  const ids = options
    .map((o) => o.id)
    .sort((a, b) => a - b)
    .join(',');
  return `${productId}|${ids}|${note ?? ''}`;
}

export function makeCartItem(
  product: MenuProduct,
  quantity: number,
  options: MenuOption[],
  note?: string,
): CartItem {
  const unitPrice = product.price + options.reduce((s, o) => s + o.price, 0);
  return {
    key: cartKey(product.id, options, note),
    product,
    quantity,
    options,
    note,
    unitPrice,
  };
}

export function cartTotal(cart: CartItem[]): number {
  return cart.reduce((s, c) => s + c.unitPrice * c.quantity, 0);
}

export function cartCount(cart: CartItem[]): number {
  return cart.reduce((s, c) => s + c.quantity, 0);
}

/** Chuyển giỏ cục bộ thành payload gửi POST /orders/:id/items. */
export function toAddItems(cart: CartItem[]): AddItemInput[] {
  return cart.map((c) => ({
    productId: c.product.id,
    quantity: c.quantity,
    note: c.note,
    options: c.options.map((o) => ({ optionId: o.id })),
  }));
}