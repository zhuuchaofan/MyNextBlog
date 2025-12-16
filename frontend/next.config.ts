import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  productionBrowserSourceMaps: true, // 开启 SourceMap 以定位生产环境报错
  output: "standalone", // 开启 Docker 优化模式
  images: {
    remotePatterns: [
      // 仅允许可信的头像服务
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
      },
      // 您的 R2 存储桶域名
      {
        protocol: 'https',
        hostname: 'picture.zhuchaofan.online', 
      },
      // 仅在开发环境下允许 localhost
      ...(process.env.NODE_ENV === 'development' ? [{
        protocol: 'http' as const,
        hostname: 'localhost',
      }] : []),
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