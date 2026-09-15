// POS FRONTEND  src/app/api/staff-logout/route.ts  (FILE MỚI)
// Xoá cookie phiên đăng nhập -> quay về màn nhập PIN.

import { NextResponse } from 'next/server';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set('staff_session', '', { path: '/', maxAge: 0 });
  return res;
}
