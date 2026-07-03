import type { Metadata, Viewport } from 'next';
import { Be_Vietnam_Pro } from 'next/font/google';
import './globals.css';

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'POS Cà phê',
  description: 'Hệ thống order & thanh toán thời gian thực cho quán cà phê',
verification: {
    google: "x54UWYymhuf4O2sFLObFonUdUwLaCGowYmZusYU3Bzc", // Điền chuỗi mã của bạn vào đây
  },
};

export const viewport: Viewport = {
  themeColor: '#1f1a17',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1, // tránh zoom nhảy khi bấm trên mobile
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className={beVietnamPro.variable}>
      <body className="min-h-dvh font-sans">{children}</body>
    </html>
  );
}