import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // 防止 webpack 尝试打包 Prisma 原生模块
  serverExternalPackages: ['@prisma/client', '.prisma/client'],
  transpilePackages: [
    'react-markdown',
    'remark-gfm',
    'rehype-highlight',
    'rehype-raw',
    'remark-parse',
    'rehype-parse',
    'unified',
    'bail',
    'is-plain-obj',
    'trough',
    'vfile',
  ],
};

export default nextConfig;
