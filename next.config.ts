import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['26.184.10.183'],
  // Vô hiệu hóa hoàn toàn Source Maps trên production để hacker KHÔNG THỂ đọc code gốc trong F12 Sources
  productionBrowserSourceMaps: false,
  // Tự động xóa sạch mọi lệnh console.log trên môi trường production
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error'] } : false,
  },
  // Bổ sung các header bảo mật HTTP chống Clickjacking, XSS, Sniffing
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
        ],
      },
    ];
  },
};

export default nextConfig;
