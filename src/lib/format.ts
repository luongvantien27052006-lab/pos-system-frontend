/** 30000 -> "30.000₫" */
export function formatVnd(amount: number): string {
  return `${new Intl.NumberFormat('vi-VN').format(Math.round(amount))}₫`;
}

/** 30000 -> "30.000" (không kèm ký hiệu) */
export function formatNumber(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(Math.round(amount));
}