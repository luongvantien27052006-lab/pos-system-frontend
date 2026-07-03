// ==================================================================
//  POS FRONTEND  (Next.js)
//  Dat tai:  src/app/page.tsx
//  >> CHEP DE (thay file co san)
// ==================================================================

import Link from 'next/link';

const surfaces = [
  {
    href: '/menu?table=01',
    title: 'Khách tại bàn',
    desc: 'Quét QR, chọn món, thanh toán',
    tag: 'Mobile',
  },
  {
    href: '/pos',
    title: 'Thu ngân tại quầy',
    desc: 'Lên đơn nhanh, thu tiền, in bill',
    tag: 'Desktop / iPad',
  },
  {
    href: '/dashboard',
    title: 'Doanh thu',
    desc: 'Theo dõi tiền về theo thời gian thực',
    tag: 'Admin',
  },
  {
    href: '/admin/products',
    title: 'Quản lý món',
    desc: 'Thêm món, upload ảnh, ngừng bán',
    tag: 'Admin',
  },
  {
    href: '/admin/news',
    title: 'Quản lý tin tức',
    desc: 'Đăng tin, thông báo cửa hàng cho khách',
    tag: 'Admin',
  },
  {
    href: '/admin/toppings',
    title: 'Quản lý topping',
    desc: 'Tạo topping, gán cho từng món',
    tag: 'Admin',
  },
  {
    href: '/admin/tables',
    title: 'Quản lý bàn & QR',
    desc: 'Thêm bàn, in mã QR cho từng bàn',
    tag: 'Admin',
  },
  {
    href: '/admin/settings',
    title: 'Đổi mã PIN',
    desc: 'Đổi mã PIN đăng nhập của nhân viên',
    tag: 'Admin',
  },
];

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col justify-center gap-8 px-6 py-16">
      <header className="space-y-2">
        <span className="text-sm font-semibold uppercase tracking-widest text-accent">
          POS Cà phê
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Chọn màn hình bắt đầu
        </h1>
        <p className="text-muted-foreground">
          Hệ thống order &amp; thanh toán thời gian thực.
        </p>
<meta name="google-site-verification" content="x54UWYymhuf4O2sFLObFonUdUwLaCGowYmZusYU3Bzc" />
      </header>

      <div className="grid gap-3">
        {surfaces.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="group flex items-center justify-between rounded-xl border bg-card p-5 transition-all hover:border-accent hover:shadow-sm"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">{s.title}</h2>
                <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {s.tag}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{s.desc}</p>
            </div>
            <span
              aria-hidden
              className="text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-accent"
            >
              →
            </span>
          </Link>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Các màn hình chi tiết sẽ được dựng ở Phần 3.2 – 3.4.
      </p>
    </main>
  );
}