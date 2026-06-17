#!/bin/bash
# ============================================================
# 阿里云服务器首次初始化脚本
# 使用方式: bash server-init.sh
# ============================================================

set -e

echo "🚀 开始初始化服务器..."

# ── 1. 安装 Docker ──
if ! command -v docker &> /dev/null; then
  echo "📦 安装 Docker..."
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
  echo "✅ Docker 安装完成"
else
  echo "✅ Docker 已安装，跳过"
fi

# ── 2. 安装 Docker Compose Plugin ──
if ! docker compose version &> /dev/null; then
  echo "📦 安装 Docker Compose..."
  apt-get update -qq
  apt-get install -y docker-compose-plugin
  echo "✅ Docker Compose 安装完成"
else
  echo "✅ Docker Compose 已安装，跳过"
fi

# ── 3. 创建部署目录 ──
echo "📁 创建部署目录..."
mkdir -p /var/www/myblog/nginx
mkdir -p /var/www/myblog/scripts

# ── 4. 创建部署用户（可选，比用 root 更安全）──
if ! id "deploy" &>/dev/null; then
  echo "👤 创建 deploy 用户..."
  useradd -m -s /bin/bash deploy
  usermod -aG docker deploy
  mkdir -p /home/deploy/.ssh
  chmod 700 /home/deploy/.ssh
  echo "⚠️  请手动将 GitHub Actions 公钥写入 /home/deploy/.ssh/authorized_keys"
else
  echo "✅ deploy 用户已存在，跳过"
fi

# ── 5. 配置目录权限 ──
chown -R deploy:deploy /var/www/myblog

echo ""
echo "============================================"
echo "✅ 服务器初始化完成！"
echo ""
echo "后续步骤："
echo "1. 将 GitHub Actions 公钥写入："
echo "   /home/deploy/.ssh/authorized_keys"
echo ""
echo "2. 在 GitHub 仓库 Settings → Secrets 添加："
echo "   SERVER_HOST  = 39.107.123.58"
echo "   SERVER_USER  = deploy"
echo "   SERVER_SSH_KEY = (私钥内容)"
echo "   DB_PASSWORD  = (自定义数据库密码)"
echo ""
echo "3. 将 docker-compose.yml 和 nginx/default.conf"
echo "   上传到 /var/www/myblog/"
echo "============================================"
