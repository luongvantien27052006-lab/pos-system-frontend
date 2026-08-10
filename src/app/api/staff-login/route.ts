// ============================================================
//  POS FRONTEND  src/app/api/staff-login/route.ts
//  >> CHEP DE (chon token theo role)
// ============================================================

import { NextResponse } from 'next/server';

/**
 * POST /api/staff-login — body: { pin }
 * Hỏi backend /staff/verify -> { ok, role }. Đúng -> đặt cookie phiên theo role.
 * - PIN admin  -> cookie = ADMIN_SESSION_TOKEN (toàn quyền)
 * - PIN nhân viên -> cookie = STAFF_SESSION_TOKEN (chỉ Thu ngân + Doanh thu)
 */
export async function POST(req: Request) {
  const staffToken = process.env.STAFF_SESSION_TOKEN;
  const adminToken = process.env.ADMIN_SESSION_TOKEN ?? staffToken;
  if (!staffToken) {
    return NextResponse.json(
      { message: 'Server chưa cấu hình STAFF_SESSION_TOKEN' },
      { status: 500 },
    );
  }
  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

  let body: { pin?: string } = {};
  try {
    body = (await req.json()) as { pin?: string };
  } catch {
    /* body rỗng */
  }
  if (!body.pin) {
    return NextResponse.json({ message: 'Nhập mã PIN' }, { status: 400 });
  }

  let role: 'admin' | 'staff' | null = null;
  try {
    const r = await fetch(`${apiUrl}/staff/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: body.pin }),
      cache: 'no-store',
    });
    if (r.ok) {
      const data = await r.json();
      role = data?.role ?? (data?.ok || data === true ? 'staff' : null);
    }
  } catch {
    return NextResponse.json(
      { message: 'Không kết nối được máy chủ' },
      { status: 502 },
    );
  }

  if (!role) {
    return NextResponse.json({ message: 'Sai mã PIN' }, { status: 401 });
  }

  const token = role === 'admin' ? (adminToken as string) : staffToken;
  const res = NextResponse.json({ ok: true, role });
  res.cookies.set('staff_session', token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 12,
  });
  return res;
}