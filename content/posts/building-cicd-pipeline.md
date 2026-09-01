---
title: "从零搭建 CI/CD 流水线"
date: "2026-06-17"
category: "devops"
tags: ["CI/CD", "GitHub Actions", "Docker", "阿里云"]
excerpt: "记录把个人博客从手动部署升级为全自动 CI/CD 的完整过程，包括踩过的所有坑。"
---

# 从零搭建 CI/CD 流水线

这篇文章记录我把这个博客接入 CI/CD 的完整过程。目标很简单：`git push` 之后，代码自动构建、测试、部署到阿里云服务器，不需要任何手动操作。

## 架构图

```
本地开发
  │
  │ git push origin main
  ▼
GitHub 仓库
  │
  │ 触发 GitHub Actions
  ▼
┌─────────────────────────────┐
│   Workflow: deploy.yml      │
│                             │
│  Job 1: Code Quality        │
│    └─ TypeScript 检查        │
│    └─ ESLint                │
│         │ 通过              │
│  Job 2: Build               │
│    └─ docker build          │
│    └─ push to GHCR          │
│         │ 成功              │
│  Job 3: Deploy              │
│    └─ SSH 进服务器           │
│    └─ docker compose pull   │
│    └─ docker compose up     │
│         │ 完成              │
│  Job 4: Healthcheck         │
│    └─ curl http://server    │
└─────────────────────────────┘
  │
  ▼
阿里云 ECS (39.107.123.58)
  └─ nginx:8080 → app:3000
```

## 关键配置

### Dockerfile（多阶段构建）

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

多阶段构建让最终镜像只包含运行时需要的文件，体积从 1GB+ 降到 200MB 左右。

### GitHub Actions 核心步骤

```yaml
- name: Build and push
  uses: docker/build-push-action@v5
  with:
    context: .
    push: true
    tags: ghcr.io/${{ github.repository }}:latest
    cache-from: type=gha
    cache-to: type=gha,mode=max
```

`cache-from/cache-to: type=gha` 利用 GitHub Actions 的构建缓存，后续构建从 10 分钟降到 2-3 分钟。

## 踩过的坑

### 1. SSH 密钥格式问题

把私钥粘贴到 GitHub Secrets 时，Windows 换行符（CRLF）会导致密钥格式损坏。解法：Base64 编码后存储，在 workflow 里解码。

```yaml
- name: Setup SSH key
  env:
    SSH_KEY_B64: ${{ secrets.SERVER_SSH_KEY }}
  run: |
    echo "$SSH_KEY_B64" | base64 -d > ~/.ssh/deploy_key
    chmod 600 ~/.ssh/deploy_key
```

### 2. 用户名配错

`SERVER_USER` 设成了 `deploy`，但公钥加在了 `root` 的 `authorized_keys` 里。排查方法：看服务器的 `journalctl -u ssh` 日志，会明确显示尝试用哪个用户认证。

### 3. 安全组端口限制

阿里云安全组的 HTTP 80 端口只开放给了内网安全组，公网无法访问。改用 8080 端口并新增安全组规则解决。

## 结果

整个流程打通后，部署一次大约需要 3-4 分钟：

- Code Quality: ~30s
- Build & Push: ~2-3min（有缓存）
- Deploy: ~20s
- Healthcheck: ~15s

`git push` 之后去泡杯茶，回来就部署好了。
