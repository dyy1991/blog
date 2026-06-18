# ---- Stage 1: 构建 ----
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/
RUN apk add --no-cache openssl
RUN npm ci
RUN npx prisma generate

COPY . .
RUN npm run build

# ---- Stage 2: 运行 ----
FROM node:20-alpine AS runner
WORKDIR /app

RUN apk add --no-cache openssl

ENV NODE_ENV=production
ENV DATABASE_URL="file:/data/support.db"
ENV PRISMA_QUERY_ENGINE_LIBRARY=/app/node_modules/.prisma/client/libquery_engine-linux-musl-openssl-3.0.x.so.node

# Next.js standalone 模式输出
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Prisma 运行时文件（standalone 不自动包含；一次性复制整个 @prisma scope）
COPY --from=builder /app/node_modules/.prisma   ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma   ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma    ./node_modules/prisma

# 迁移 schema 文件（db push 需要）
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000
CMD ["sh", "-c", "mkdir -p /data && node node_modules/prisma/build/index.js db push --skip-generate --accept-data-loss 2>&1 && node server.js"]
