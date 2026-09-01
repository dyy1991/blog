#!/usr/bin/env bash
# 提交并推送每日 GitHub 速报文章,触发 CI/CD 自动部署
# 用法: bash scripts/publish-brief.sh
# 依赖: 仓库根目录的 .git-token 文件(fine-grained PAT,仅本仓库 Contents 读写权限)
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

TOKEN_FILE="$REPO_ROOT/.git-token"
if [[ ! -f "$TOKEN_FILE" ]]; then
  echo "ERROR: 未找到 $TOKEN_FILE。请创建 GitHub fine-grained PAT(仅 dyy1991/blog 仓库、Contents 读写)并保存到该文件。" >&2
  exit 1
fi
TOKEN="$(tr -d '[:space:]' < "$TOKEN_FILE")"

# 只提交速报文章(先 add 再 pathspec 提交,不影响其他已暂存/未提交的改动)
if git status --porcelain -- content/posts/ | grep -q .; then
  git add content/posts/
  git -c user.name="YYDeng" -c user.email="worldwonderfulawhat@gmail.com" \
    commit -m "post: daily github brief $(date +%F)" -- content/posts/
  echo "Committed."
else
  echo "content/posts/ 无变更,检查是否有未推送的 commit..."
fi

# 推送(token 只在本次命令中使用,不写入 git 配置)
git push "https://x-access-token:${TOKEN}@github.com/dyy1991/blog.git" HEAD:main
echo "Pushed. GitHub Actions 将自动构建并部署。"
