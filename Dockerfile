# ---- Stage 1: 构建 ----
FROM node:20-alpine AS builder
WORKDIR /app

# 先复制依赖文件，利用 Docker 层缓存
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---- Stage 2: 运行 ----
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
# Next.js standalone 模式输出
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
