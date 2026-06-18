import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // 防止 webpack 尝试打包 Prisma 原生模块
  serverExternalPackages: ['@prisma/client', '.prisma/client'],
};

export default nextConfig;
