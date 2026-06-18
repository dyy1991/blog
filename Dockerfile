# ---- Stage 1: 构建 ----
FROM node:20-alpine AS builder
WORKDIR /app

# 先复制依赖文件，利用 Docker 层缓存
COPY package*.json ./
# 复制 prisma schema，npm ci 后立即生成 client
COPY prisma ./prisma/
RUN apk add --no-cache openssl
RUN npm ci
RUN npx prisma generate

COPY . .
RUN npm run build

# ---- Stage 2: 运行 ----
FROM node:20-alpine AS runner
WORKDIR /app

# Prisma 在 Alpine 需要 openssl
RUN apk add --no-cache openssl

ENV NODE_ENV=production
ENV DATABASE_URL="file:/data/support.db"

# Next.js standalone 模式输出
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Prisma 运行时文件（standalone 模式不会自动包含）
COPY --from=builder /app/node_modules/.prisma        ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client  ./node_modules/@prisma/client
COPY --from=builder /app/node_modules/prisma          ./node_modules/prisma

# 迁移 schema 文件（db push 需要）
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000
# 启动时：建目录 → db push（幂等，新增表/列自动同步）→ 启动服务
CMD ["sh", "-c", "mkdir -p /data && node node_modules/prisma/build/index.js db push --skip-generate --accept-data-loss 2>&1 && node server.js"]
