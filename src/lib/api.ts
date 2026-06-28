// ==================================================================
//  POS FRONTEND  (Next.js)
//  Dat tai:  src/lib/api.ts
//  >> CHEP DE (thay file co san)
// ==================================================================

// ==================================================================
//  POS FRONTEND  (Next.js)
//  Dat tai:  src/lib/api.ts
//  >> CHEP DE (thay file co san)
// ==================================================================

import type {
  AddItemInput,
  AdminOption,
  AdminProduct,
  AdminTable,
  AppOrder,
  Menu,
  OrderSession,
  PendingCashAlert,
  PrepStatus,
  QrInfo,
  MonthlyRevenue,
  RevenueSummary,
  StoreHours,
  TableInfo,
} from '@/types';

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'https://localhost:4000/api';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  path: string,
  init?: Omit<RequestInit, 'body'> & { body?: unknown },
): Promise<T> {
  const { body, headers, ...rest } = init ?? {};
  const res = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    headers: { 'Content-Type': 'application/json', ...(headers ?? {}) },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });

  if (!res.ok) {
    let message = `Lỗi ${res.status}`;
    try {
      const data = (await res.json()) as { message?: string | string[] };
      if (data?.message) {
        message = Array.isArray(data.message)
          ? data.message.join(', ')
          : data.message;
      }
    } catch {
      /* body không phải JSON -> giữ message mặc định */
    }
    throw new ApiError(res.status, message);
  }

  return (res.status === 204 ? undefined : await res.json()) as T;
}

export const api = {
  // --- Menu & bàn ---
  getMenu: () => request<Menu>('/menu'),
  getTables: () => request<TableInfo[]>('/tables'),

  // --- Phiên đơn ---
  getTableSession: (tableNumber: string) =>
    request<OrderSession>(
      `/orders/table/${encodeURIComponent(tableNumber)}/session`,
      { method: 'POST' },
    ),
  createCounterSession: (tableNumber?: string) =>
    request<OrderSession>('/orders/counter/session', {
      method: 'POST',
      body: { tableNumber },
    }),
  getSession: (sessionId: number) =>
    request<OrderSession>(`/orders/${sessionId}`),
  addItems: (sessionId: number, items: AddItemInput[]) =>
    request<OrderSession>(`/orders/${sessionId}/items`, {
      method: 'POST',
      body: { items },
    }),
  voidItem: (itemId: number) =>
    request<OrderSession>(`/orders/items/${itemId}/void`, { method: 'POST' }),

  getPendingCash: () => request<PendingCashAlert[]>('/orders/pending-cash'),

  // --- Đơn online từ App F&B ---
  getActiveAppOrders: () => request<AppOrder[]>('/app-orders/active'),
  updateAppOrderStatus: (appOrderId: string, status: PrepStatus) =>
    request<AppOrder>(
      `/app-orders/${encodeURIComponent(appOrderId)}/status`,
      { method: 'PATCH', body: { status } },
    ),
  confirmAppOrderPayment: (appOrderId: string) =>
    request<AppOrder>(
      `/app-orders/${encodeURIComponent(appOrderId)}/payment`,
      { method: 'PATCH' },
    ),

  // --- Giờ mở/đóng cửa ---
  getStoreHours: () => request<StoreHours>('/store/hours'),
  updateStoreHours: (body: {
    openTime?: string;
    closeTime?: string;
    override?: 'open' | 'closed' | 'auto';
  }) => request<StoreHours>('/store/hours', { method: 'PUT', body }),

  // --- Thanh toán ---
  payCash: (sessionId: number) =>
    request<OrderSession>(`/orders/${sessionId}/pay/cash`, { method: 'POST' }),
  confirmCash: (sessionId: number) =>
    request<OrderSession>(`/orders/${sessionId}/pay/cash/confirm`, {
      method: 'POST',
    }),
  createQr: (sessionId: number) =>
    request<QrInfo>(`/payments/${sessionId}/qr`, { method: 'POST' }),

  // --- Doanh thu ---
  getTodayRevenue: () => request<RevenueSummary>('/dashboard/revenue/today'),
  getMonthlyRevenue: () =>
    request<MonthlyRevenue>('/dashboard/revenue/month'),

  // --- Quản trị sản phẩm ---
  listProducts: () => request<AdminProduct[]>('/products'),

  // --- Topping / tùy chọn ---
  listOptions: () => request<AdminOption[]>('/options'),
  createOption: (body: { name: string; price: number; groupName?: string }) =>
    request<AdminOption>('/options', { method: 'POST', body }),
  updateOption: (
    id: number,
    body: { name?: string; price?: number; groupName?: string; isActive?: boolean },
  ) => request<AdminOption>(`/options/${id}`, { method: 'PATCH', body }),
  deleteOption: (id: number) =>
    request<AdminOption>(`/options/${id}`, { method: 'DELETE' }),
  restoreOption: (id: number) =>
    request<AdminOption>(`/options/${id}/restore`, { method: 'PATCH' }),
  getProductOptions: (productId: number) =>
    request<number[]>(`/options/product/${productId}`),
  setProductOptions: (productId: number, optionIds: number[]) =>
    request<{ productId: number; optionIds: number[] }>(
      `/options/product/${productId}`,
      { method: 'PUT', body: { optionIds } },
    ),
  deleteProduct: (id: number) =>
    request<{ ok: boolean; id: number }>(`/products/${id}`, {
      method: 'DELETE',
    }),
  /** Gửi multipart/form-data — KHÔNG tự đặt Content-Type để trình duyệt set boundary. */
  createProduct: async (form: FormData): Promise<AdminProduct> => {
    const res = await fetch(`${BASE_URL}/products`, {
      method: 'POST',
      body: form,
    });
    if (!res.ok) {
      let message = `Lỗi ${res.status}`;
      try {
        const data = (await res.json()) as { message?: string | string[] };
        if (data?.message) {
          message = Array.isArray(data.message)
            ? data.message.join(', ')
            : data.message;
        }
      } catch {
        /* giữ message mặc định */
      }
      throw new ApiError(res.status, message);
    }
    return (await res.json()) as AdminProduct;
  },
  /** Sửa món — ảnh là tùy chọn (chỉ kèm field 'image' khi đổi ảnh). */
  updateProduct: async (id: number, form: FormData): Promise<AdminProduct> => {
    const res = await fetch(`${BASE_URL}/products/${id}`, {
      method: 'PATCH',
      body: form,
    });
    if (!res.ok) {
      let message = `Lỗi ${res.status}`;
      try {
        const data = (await res.json()) as { message?: string | string[] };
        if (data?.message) {
          message = Array.isArray(data.message)
            ? data.message.join(', ')
            : data.message;
        }
      } catch {
        /* giữ message mặc định */
      }
      throw new ApiError(res.status, message);
    }
    return (await res.json()) as AdminProduct;
  },
  restoreProduct: (id: number) =>
    request<{ ok: boolean; id: number }>(`/products/${id}/restore`, {
      method: 'PATCH',
    }),

  // --- Quản trị bàn ---
  listTablesAdmin: () => request<AdminTable[]>('/tables/admin'),
  createTable: (body: { tableNumber: string; displayName?: string }) =>
    request<AdminTable>('/tables', { method: 'POST', body }),
  deleteTable: (id: number) =>
    request<{ ok: boolean; id: number }>(`/tables/${id}`, {
      method: 'DELETE',
    }),
  restoreTable: (id: number) =>
    request<{ ok: boolean; id: number }>(`/tables/${id}/restore`, {
      method: 'PATCH',
    }),

  // --- Cài đặt nhân viên ---
  changePin: (body: { currentPin: string; newPin: string }) =>
    request<{ ok: boolean }>('/staff/change-pin', { method: 'POST', body }),
};