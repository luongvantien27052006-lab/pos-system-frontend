\# POS Frontend — Next.js 14 + Tailwind



Giao diện cho hệ thống POS quán cà phê. Kết nối backend qua REST + Socket.io.



\## Thiết kế

\- \*\*Font:\*\* Be Vietnam Pro (next/font) — typeface tối ưu tiếng Việt.

\- \*\*Màu:\*\* nền trắng ấm + mực espresso + accent hổ phách. Màu semantic: `warning` (vàng — cảnh báo tiền mặt), `success` (PAID), `info` (chuyển khoản).

\- \*\*Số tiền:\*\* dùng `.tabular` (tabular-nums) để cột giá thẳng hàng.

\- Token nằm ở `src/app/globals.css`, map sang Tailwind tại `tailwind.config.ts`.



\## Cấu trúc

```

src/

├── app/

│   ├── layout.tsx        # font + layout gốc

│   ├── globals.css       # design tokens

│   └── page.tsx          # dev hub (3 màn hình)

├── lib/

│   ├── api.ts            # tầng gọi REST (typed)

│   ├── socket.ts         # client Socket.io + useSocketEvent

│   ├── format.ts         # định dạng VND

│   └── utils.ts          # cn()

└── types/

&#x20;   └── index.ts          # kiểu khớp backend + sự kiện socket

```



\## Chạy

1\. Bảo đảm backend đang chạy ở `http://localhost:4000`.

2\. `cp .env.local.example .env.local`

3\. `npm install`

4\. `npm run dev`  → mở http://localhost:3000



\## Lộ trình Phần 3 (đang ở 3.1)

\- \[x] \*\*3.1 Nền tảng\*\*: cấu hình, design tokens, tầng API + Socket.io, types

\- \[ ] \*\*3.2 Khách tại bàn\*\* (mobile): menu thẻ, giỏ hàng cố định, checkout, VietQR

\- \[ ] \*\*3.3 Thu ngân (POS)\*\* (desktop/iPad): split-screen, tính tiền thối, cảnh báo ghim, popup QR

\- \[ ] \*\*3.4 Dashboard doanh thu\*\* (admin): số nhảy real-time qua socket

