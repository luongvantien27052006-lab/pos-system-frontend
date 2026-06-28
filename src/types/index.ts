// ==================================================================
//  POS FRONTEND  (Next.js)
//  Dat tai:  src/types/index.ts
//  >> CHEP DE (thay file co san)
// ==================================================================

// ===== Khớp với view trả về từ backend (Phần 2) =====

export type OrderStatus = 'UNPAID' | 'PENDING_CASH' | 'PAID' | 'CANCELLED';
export type PaymentMethod = 'CASH' | 'BANK_TRANSFER';
export type OrderChannel = 'TABLE_QR' | 'COUNTER_POS';

// --- Menu ---
export interface MenuOption {
  id: number;
  name: string;
  price: number;
  groupName: string | null;
}
export interface MenuProduct {
  id: number;
  name: string;
  shortName: string | null;
  price: number;
  imageUrl: string | null;
  isAvailable: boolean;
  options: MenuOption[];
}
export interface MenuCategory {
  id: number;
  name: string;
  products: MenuProduct[];
}
export interface Menu {
  categories: MenuCategory[];
}

export interface TableInfo {
  id: number;
  tableNumber: string;
  displayName: string | null;
  status: 'EMPTY' | 'OCCUPIED';
}

// --- Đơn hàng ---
export interface Topping {
  id: number;
  optionId: number | null;
  name: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}
export interface OrderLine {
  id: number;
  productId: number | null;
  name: string;
  unitPrice: number;
  quantity: number;
  note: string | null;
  toppings: Topping[];
  lineTotal: number;
}
export interface OrderSession {
  id: number;
  orderCode: string;
  tableId: number | null;
  tableNumber: string | null;
  channel: OrderChannel;
  status: OrderStatus;
  paymentMethod: PaymentMethod | null;
  lines: OrderLine[];
  total: number;
  createdAt: string;
}

/** Input thêm món (gửi lên POST /orders/:id/items) */
export interface AddItemInput {
  productId: number;
  quantity: number;
  note?: string;
  options?: { optionId: number }[];
}

// --- VietQR ---
export interface QrInfo {
  orderCode: string;
  amount: number;
  bankBin: string;
  accountNo: string;
  accountName: string;
  qrPayload: string; // chuỗi EMVCo để render QR
  qrImageUrl: string; // link ảnh QR tiện dụng
}

// --- Giờ mở/đóng cửa (cấu hình từ admin, lưu ở App) ---
export interface StoreHours {
  isOpen: boolean;
  openTime: string; // 'HH:MM'
  closeTime: string; // 'HH:MM'
  manualOverride: boolean | null; // null=tự động, true=ép mở, false=tạm đóng
  timezone: string;
}

// --- Doanh thu ---
export interface RevenueSummary {
  date: string;
  total: number;
  totalCash: number;
  totalTransfer: number;
  /** Phần doanh thu từ đơn online (App), đã gộp trong `total`. */
  appTotal: number;
}

export interface MonthlyRevenue {
  /** Tháng theo giờ VN, dạng YYYY-MM. */
  month: string;
  total: number;
  totalCash: number;
  totalTransfer: number;
  appTotal: number;
  orderCount: number;
}

// --- Cảnh báo đòi tiền mặt (POS) ---
export interface PendingCashAlert {
  sessionId: number;
  orderCode: string;
  tableNumber: string | null;
  amount: number;
}

// --- Quản trị sản phẩm ---
export interface AdminProduct {
  id: number;
  name: string;
  shortName: string | null;
  price: number;
  imageUrl: string | null;
  isAvailable: boolean;
  isActive: boolean;
  categoryId: number;
  categoryName?: string;
}

// --- Quản trị bàn ---
export interface AdminTable {
  id: number;
  tableNumber: string;
  displayName: string | null;
  status: 'EMPTY' | 'OCCUPIED';
  isActive: boolean;
}

// --- Đơn online từ App F&B ---
export type PrepStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'READY'
  | 'DELIVERED'
  | 'CANCELLED';
export type AppFulfillment = 'DELIVERY' | 'PICKUP';
export type AppPaymentMethod = 'COD' | 'BANK_QR';

export interface AppOrderItem {
  posProductId?: number | null;
  name: string;
  quantity: number;
  unitPrice: number;
  note?: string | null;
}
export interface AppOrder {
  id: number;
  appOrderId: string;
  orderCode: string;
  fulfillment: AppFulfillment;
  paymentMethod: AppPaymentMethod;
  paymentStatus: 'PENDING' | 'PAID';
  customerName: string | null;
  customerPhone: string | null;
  customerAddress: string | null;
  items: AppOrderItem[];
  totalAmount: number;
  prepStatus: PrepStatus;
  note: string | null;
  receivedAt: string;
}

// ===== Sự kiện Socket.io (server -> client), khớp realtime.events.ts =====
export const SOCKET_EVENTS = {
  ORDER_CREATED: 'order:created',
  ORDER_UPDATED: 'order:updated',
  ORDER_PENDING_CASH: 'order:pending_cash',
  ORDER_PAID: 'order:paid',
  REVENUE_UPDATED: 'revenue:updated',
  APP_ORDER_INCOMING: 'app_order:incoming',
  APP_ORDER_STATUS: 'app_order:status',
  APP_ORDER_CANCELLED: 'app_order:cancelled',
} as const;

export interface OrderUpdatedEvent {
  sessionId: number;
}
export interface OrderPendingCashEvent {
  sessionId: number;
  orderCode: string;
  tableNumber: string | null;
  amount: number;
}
export interface OrderPaidEvent {
  sessionId: number;
  tableNumber: string | null;
  paymentMethod: PaymentMethod;
}

export interface AppOrderIncomingEvent {
  id: number;
  appOrderId: string;
  orderCode: string;
  fulfillment: AppFulfillment;
  total: number;
  customerName: string | null;
  itemCount: number;
}
export interface AppOrderStatusEvent {
  id: number;
  appOrderId: string;
  orderCode: string;
  prepStatus: PrepStatus;
  paymentStatus: 'PENDING' | 'PAID';
}
export interface AppOrderCancelledEvent {
  id: number;
  appOrderId: string;
  orderCode: string;
}