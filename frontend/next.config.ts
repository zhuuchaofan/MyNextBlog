import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone", // 开启 Docker 优化模式
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
      },
      {
        protocol: 'https',
        hostname: '**', // 允许所有 HTTPS 图片源 (生产环境建议限制具体域名)
      },
      {
         protocol: 'http',
         hostname: '**', // 允许所有 HTTP 图片源 (用于本地开发 localhost 等)
      }
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        // 优先读取环境变量 (Docker 内部通信)，默认使用 Docker 服务名
        destination: `${process.env.BACKEND_URL || 'http://backend:8080'}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;