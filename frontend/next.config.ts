import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone", // 开启 Docker 优化模式
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