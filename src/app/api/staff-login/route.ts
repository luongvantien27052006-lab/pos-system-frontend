import { NextResponse } from 'next/server';

/**
 * POST /api/staff-login — body: { pin: string }
 * Hỏi backend (/staff/verify) xem PIN có đúng không. Đúng -> đặt cookie phiên.
 * PIN do backend quản lý (lưu trong DB), nên đổi PIN không cần sửa file này.
 */
export async function POST(req: Request) {
  const token = process.env.STAFF_SESSION_TOKEN;
  if (!token) {
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

  let ok = false;
  try {
    const r = await fetch(`${apiUrl}/staff/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: body.pin }),
      cache: 'no-store',
    });
    if (r.ok) {
  const data = await r.json();
  ok = typeof data === 'boolean' ? data : !!data?.ok;
}
  } catch {
    return NextResponse.json(
      { message: 'Không kết nối được máy chủ' },
      { status: 502 },
    );
  }

  if (!ok) {
    return NextResponse.json({ message: 'Sai mã PIN' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set('staff_session', token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 12, // 12 giờ
  });
  return res;
}