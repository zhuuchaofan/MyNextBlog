import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*', // 前端请求的假地址
        destination: 'http://localhost:5095/api/:path*', // 后端真实地址
      },
    ];
  },
};

export default nextConfig;