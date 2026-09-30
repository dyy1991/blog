#!/usr/bin/env bash
# 校验 content/posts/*.md 的 frontmatter 是否为合法 YAML(针对本博客的固定模板)。
# 背景:2026-09-28 的速报 excerpt 里出现未转义英文双引号,YAML 解析失败导致整站 500。
# 该脚本只用 bash/grep/awk,不依赖 node/python,保证在定时任务沙盒里一定可用。
#
# 用法:
#   bash scripts/validate-posts.sh                     # 校验全部文章
#   bash scripts/validate-posts.sh content/posts/a.md  # 校验指定文件
# 退出码:0 全部通过;1 有文件不合法(stderr 列出文件与原因)。
set -uo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

# 双引号标量:引号内只允许 转义序列(\x) 或 非引号非反斜杠字符
QSTR='"(\\.|[^"\\])*"'

validate_file() {
  local f="$1"

  # 第 1 行必须是 ---(容忍 Windows 换行的 \r)
  if [[ "$(head -n 1 "$f" | tr -d '\r')" != "---" ]]; then
    echo "✗ $f: 首行不是 frontmatter 起始 '---'" >&2
    return 1
  fi

  # 取出 frontmatter(第 2 行起到下一个 --- 之前);没有闭合 --- 则报错
  local fm
  fm="$(awk '{ sub(/\r$/, "") } NR==1{next} /^---[[:space:]]*$/{found=1; exit} {print} END{if(!found) exit 2}' "$f")"
  if [[ $? -eq 2 ]]; then
    echo "✗ $f: frontmatter 没有闭合的 '---'" >&2
    return 1
  fi

  local ok=0
  while IFS= read -r line; do
    [[ -z "$line" ]] && continue
    case "$line" in
      title:*|date:*|category:*|excerpt:*)
        # key: "..."(引号内的 " 必须写成 \"),行尾不允许有多余内容
        if ! grep -Eq "^(title|date|category|excerpt): ${QSTR}[[:space:]]*$" <<< "$line"; then
          echo "✗ $f: 该行不是合法的双引号字符串(引号未转义或未闭合):" >&2
          echo "    $line" >&2
          ok=1
        fi
        ;;
      tags:*)
        # tags: ["a", "b", ...] 或 tags: []
        if ! grep -Eq "^tags: \[(${QSTR}(, ${QSTR})*)?\][[:space:]]*$" <<< "$line"; then
          echo "✗ $f: tags 行格式不合法:" >&2
          echo "    $line" >&2
          ok=1
        fi
        ;;
      *)
        echo "✗ $f: frontmatter 出现模板之外的行(疑似上一行的值溢出,常见原因是引号提前闭合):" >&2
        echo "    $line" >&2
        ok=1
        ;;
    esac
  done <<< "$fm"

  return $ok
}

# 收集要校验的文件:参数指定,否则全部
files=()
if [[ $# -gt 0 ]]; then
  files=("$@")
else
  while IFS= read -r f; do files+=("$f"); done < <(find content/posts -name '*.md' | sort)
fi

bad=0
for f in "${files[@]}"; do
  [[ -f "$f" ]] || { echo "✗ 文件不存在: $f" >&2; bad=1; continue; }
  validate_file "$f" || bad=1
done

if [[ $bad -ne 0 ]]; then
  echo "" >&2
  echo "frontmatter 校验未通过。修复方法:值里的英文双引号写成 \\\" ,或改用中文引号「」。" >&2
  exit 1
fi
echo "frontmatter 校验通过(${#files[@]} 个文件)。"
