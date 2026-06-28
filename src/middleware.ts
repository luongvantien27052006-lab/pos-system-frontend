import { NextRequest, NextResponse } from 'next/server';

/**
 * Gác toàn bộ route NHÂN VIÊN ( /, /pos, /dashboard, /admin/* ) sau mã PIN.
 * Route KHÁCH /menu (mã QR trên bàn trỏ tới đây) luôn mở, không cần đăng nhập.
 *
 * Cơ chế: sau khi nhập đúng PIN, /api/staff-login đặt cookie 'staff_session'
 * = STAFF_SESSION_TOKEN. Middleware so cookie với token này.
 * Nếu chưa cấu hình STAFF_SESSION_TOKEN -> tắt gác (tiện môi trường dev).
 */
export function middleware(req: NextRequest) {
  const token = process.env.STAFF_SESSION_TOKEN;
  if (!token) return NextResponse.next(); // gác chưa bật

  const authed = req.cookies.get('staff_session')?.value === token;
  if (authed) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = '/staff-login';
  url.search = `?next=${encodeURIComponent(req.nextUrl.pathname)}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Áp dụng cho MỌI đường dẫn TRỪ: trang khách /menu, trang đăng nhập,
  // API nội bộ Next, và tài nguyên tĩnh.
  matcher: [
    '/((?!menu|staff-login|api|_next/static|_next/image|favicon.ico).*)',
  ],
};