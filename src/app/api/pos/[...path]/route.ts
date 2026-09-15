// ============================================================
//  POS FRONTEND  src/app/api/pos/[...path]/route.ts
//  >> FILE MỚI — Proxy (BFF) mọi lời gọi API sang backend POS.
// ============================================================
//
//  Vì sao: backend POS trước đây MỞ (không auth). Nay:
//   1. Backend yêu cầu header `x-pos-secret` (PosSecretGuard) -> KHÔNG gọi
//      thẳng được từ trình duyệt/ngoài.
//   2. Proxy này (chạy phía SERVER Next.js) tự thêm secret rồi chuyển tiếp,
//      nên secret KHÔNG lộ ra client.
//   3. Với route QUẢN TRỊ (products, options, vouchers...) proxy kiểm tra
//      cookie đăng nhập `staff_session` trước khi cho qua.
//   4. Route khách (menu, đặt món tại bàn, thanh toán) không cần cookie.
//
//  ENV cần đặt (phía SERVER, KHÔNG phải NEXT_PUBLIC):
//   - POS_PROXY_SECRET : trùng với backend.
//   - POS_BACKEND_URL  : URL backend (gồm /api). Không đặt -> dùng NEXT_PUBLIC_API_URL.
//   - STAFF_SESSION_TOKEN / ADMIN_SESSION_TOKEN : (đã có) để kiểm cookie.

import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const BACKEND =
  process.env.POS_BACKEND_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:4000/api';
const SECRET = process.env.POS_PROXY_SECRET ?? '';

// Nhóm route CHỈ nhân viên/admin (yêu cầu cookie đăng nhập). Các route khác
// (menu, orders, payments, store GET...) vẫn cần secret nhưng không cần cookie
// vì khách dùng chung.
const ADMIN_PREFIXES = [
  'products',
  'options',
  'vouchers',
  'news',
  'fruits',
  'analytics',
  'bills',
  'dashboard',
  'staff',
  'reviews',
  'app-orders',
  'print',
  'tables/admin',
];

function isAdminPath(path: string): boolean {
  return ADMIN_PREFIXES.some(
    (p) => path === p || path.startsWith(`${p}/`),
  );
}

async function handle(
  req: NextRequest,
  ctx: { params: Promise<{ path?: string[] }> | { path?: string[] } },
): Promise<NextResponse> {
  const params = await Promise.resolve(ctx.params);
  const path = (params?.path ?? []).join('/');
  const search = req.nextUrl.search;

  // Route quản trị -> bắt buộc đăng nhập (cookie staff_session).
  if (isAdminPath(path)) {
    const staff = process.env.STAFF_SESSION_TOKEN;
    if (staff) {
      const store = await cookies();
      const cookie = store.get('staff_session')?.value;
      const admin = process.env.ADMIN_SESSION_TOKEN;
      const ok = cookie === admin || (!!cookie && cookie === staff);
      if (!ok) {
        return NextResponse.json(
          { message: 'Chưa đăng nhập' },
          { status: 401 },
        );
      }
    }
  }

  const headers = new Headers();
  const ct = req.headers.get('content-type');
  if (ct) headers.set('content-type', ct);
  if (SECRET) headers.set('x-pos-secret', SECRET);

  const method = req.method.toUpperCase();
  const hasBody = method !== 'GET' && method !== 'HEAD';
  const body = hasBody ? Buffer.from(await req.arrayBuffer()) : undefined;

  let backendRes: Response;
  try {
    backendRes = await fetch(`${BACKEND}/${path}${search}`, {
      method,
      headers,
      body,
      cache: 'no-store',
    });
  } catch {
    return NextResponse.json(
      { message: 'Không kết nối được máy chủ POS' },
      { status: 502 },
    );
  }

  const buf = Buffer.from(await backendRes.arrayBuffer());
  const outHeaders = new Headers();
  const resCt = backendRes.headers.get('content-type');
  if (resCt) outHeaders.set('content-type', resCt);
  return new NextResponse(buf, {
    status: backendRes.status,
    headers: outHeaders,
  });
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const PUT = handle;
export const DELETE = handle;
