/** @type {import('next').NextConfig} */
const nextConfig = {
  // 👇 CỨ GIỮ NGUYÊN CÁC CẤU HÌNH CŨ CỦA BẠN (NẾU CÓ) Ở ĐÂY...
  // ví dụ: reactStrictMode: true, 

  // 👇 CHỈ PHƠT THÊM ĐOẠN IMAGES NÀY VÀO TRONG THÔI:
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
};

export default nextConfig;