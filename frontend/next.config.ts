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
      // R2 存储桶域名 (新域名)
      {
        protocol: 'https',
        hostname: 'files.zhuchaofan.com', 
      },
      // R2 存储桶域名 (旧域名，兼容历史数据)
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
      // 🔧 修复：添加通用的 API 代理规则
      // 将所有 /api/* 请求转发到后端，但排除 Next.js 自己的 Route Handlers
      // 排除路径：/api/auth/*, /api/admin/*, /api/backend/* (已在上面处理)
      {
        source: '/api/:path((?!auth|admin|backend).*)*',
        destination: `${process.env.BACKEND_URL || 'http://backend:8080'}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;