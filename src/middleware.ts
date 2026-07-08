// ============================================================
//  POS FRONTEND  src/middleware.ts
//  >> CHEP DE (staff: /pos + /dashboard)
// ============================================================

import { NextRequest, NextResponse } from 'next/server';

/**
 * Gác route sau mã PIN + phân quyền:
 *  - Admin (cookie = ADMIN_SESSION_TOKEN): toàn quyền.
 *  - Nhân viên (cookie = STAFF_SESSION_TOKEN): chỉ '/', '/pos', '/dashboard'.
 *  - Route khách '/menu' luôn mở.
 */
export function middleware(req: NextRequest) {
  const staffToken = process.env.STAFF_SESSION_TOKEN;
  if (!staffToken) return NextResponse.next(); // gác chưa bật

  const adminToken = process.env.ADMIN_SESSION_TOKEN;
  const cookie = req.cookies.get('staff_session')?.value;
  const isAdmin = !!adminToken && cookie === adminToken;
  const isStaff = cookie === staffToken;

  if (!isAdmin && !isStaff) {
    const url = req.nextUrl.clone();
    url.pathname = '/staff-login';
    url.search = `?next=${encodeURIComponent(req.nextUrl.pathname)}`;
    return NextResponse.redirect(url);
  }

  if (isAdmin) return NextResponse.next();

  // Nhân viên: chỉ cho POS (thu ngân) + Doanh thu + trang chủ.
  const path = req.nextUrl.pathname;
  const staffAllowed =
    path === '/' ||
    path.startsWith('/pos') ||
    path.startsWith('/dashboard');
  if (staffAllowed) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = '/pos';
  url.search = '';
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    '/((?!menu|staff-login|api|_next/static|_next/image|favicon.ico).*)',
  ],
};