import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone", // 开启 Docker 优化模式
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        // 优先读取环境变量 (Docker 内部通信)，本地开发默认用 localhost:5095
        destination: `${process.env.BACKEND_URL || 'http://localhost:5095'}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;