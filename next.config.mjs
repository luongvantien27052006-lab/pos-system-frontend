/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Cho phép ảnh món & ảnh VietQR từ domain ngoài. Siết lại danh sách khi lên production.
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
};

export default nextConfig;
/** @type {import('next').NextConfig} */
const nextConfig = {
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