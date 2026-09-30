'use client'

import { useState, useCallback, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const INITIAL_CONTENT = `# 文章标题

## 简介

在这里写你的文章内容，左侧编辑，右侧实时预览。

## 代码示例

\`\`\`typescript
function greet(name: string): string {
  return \`Hello, \${name}!\`
}
\`\`\`

## 列表

- 支持 GitHub Flavored Markdown
- 表格、代码块、任务列表
- 实时预览

## 发布流程

写完后点 **↑ Publish**，文章会直接 commit 到 GitHub 的 \`content/posts/\` 目录并触发自动部署（首次使用先在 ⚙ 里配置 Token）。也可以点 **↓ .md** 下载后手动提交。
`

const TOOLBAR = [
  { label: 'H1', insert: '# ' },
  { label: 'H2', insert: '## ' },
  { label: 'H3', insert: '### ' },
  { label: 'B',  insert: '**', wrap: true },
  { label: 'I',  insert: '_',  wrap: true },
  { label: '`',  insert: '`',  wrap: true },
  { label: '```',insert: '```\n', suffix: '\n```' },
  { label: '---',insert: '\n---\n' },
  { label: '- ',insert: '- ' },
]

type ViewMode = 'split' | 'editor' | 'preview'

interface GhConfig {
  owner: string
  repo: string
  branch: string
  token: string
}

interface PostMeta {
  title: string
  category: string
  tags: string
  excerpt: string
}

interface PublishStatus {
  kind: 'ok' | 'warn' | 'err'
  msg: string
  commitUrl?: string
  actionsUrl?: string
}

const GH_CONFIG_KEY = 'write-gh-config'
const DRAFT_KEY = 'write-draft'
const DEFAULT_CONFIG: GhConfig = { owner: 'dyy1991', repo: 'blog', branch: 'main', token: '' }
const DEFAULT_META: PostMeta = { title: '新文章', category: 'tech', tags: '', excerpt: '' }

/** UTF-8 安全的 base64（中文内容直接 btoa 会抛异常） */
function utf8ToBase64(str: string): string {
  const bytes = new TextEncoder().encode(str)
  let bin = ''
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  }
  return btoa(bin)
}

/** 与下载共用的 slug 规则；保留中文，避免纯中文标题全部塌缩成 untitled */
function slugify(title: string): string {
  return (
    title
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9一-龥]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'untitled'
  )
}

/** YAML 双引号字符串转义:内容里的 " 和 \ 不转义会把整篇 frontmatter 搞坏 */
function yamlQuote(s: string): string {
  return `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
}

/** frontmatter + 正文，Download 与 Publish 两条通路共用，保证产物一致 */
function buildMarkdown(meta: PostMeta, content: string): { slug: string; markdown: string } {
  const date = new Date().toISOString().split('T')[0]
  const slug = slugify(meta.title)
  const tagsArr = meta.tags.split(',').map(t => t.trim()).filter(Boolean)
  const fm = `---
title: ${yamlQuote(meta.title)}
date: "${date}"
category: ${yamlQuote(meta.category)}
tags: [${tagsArr.map(yamlQuote).join(', ')}]
excerpt: ${yamlQuote(meta.excerpt || meta.title)}
---

`
  return { slug, markdown: fm + content }
}

function describeHttpError(status: number): string {
  switch (status) {
    case 401: return 'Token 无效或已过期（401），请到 ⚙ 发布设置更新'
    case 403: return '权限不足或触发限流（403），确认 Token 有该仓库 Contents 读写权限'
    case 404: return '仓库或分支不存在（404），检查 ⚙ 里的 owner / repo / branch'
    case 409: return '分支有并发提交冲突（409），稍后重试'
    case 422: return '请求被 GitHub 拒绝（422），检查文件路径或内容'
    default:  return `GitHub API 错误（HTTP ${status}）`
  }
}

export default function WritePage() {
  const [content, setContent] = useState(INITIAL_CONTENT)
  const [meta, setMeta] = useState<PostMeta>(DEFAULT_META)
  const [view, setView] = useState<ViewMode>('split')

  const [ghConfig, setGhConfig] = useState<GhConfig>(DEFAULT_CONFIG)
  const [showSettings, setShowSettings] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [pendingSha, setPendingSha] = useState<string | null>(null)
  const [status, setStatus] = useState<PublishStatus | null>(null)

  // 挂载后恢复:发布配置 + 上次草稿(localStorage 在 SSR 阶段不可用,只能放 effect 里;
  // 属于"外部系统 → React 状态"的一次性初始同步,对该规则做局部豁免)
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const rawCfg = localStorage.getItem(GH_CONFIG_KEY)
      if (rawCfg) setGhConfig({ ...DEFAULT_CONFIG, ...(JSON.parse(rawCfg) as Partial<GhConfig>) })
      const rawDraft = localStorage.getItem(DRAFT_KEY)
      if (rawDraft) {
        const draft = JSON.parse(rawDraft) as { content?: string; meta?: Partial<PostMeta> }
        if (draft.content) setContent(draft.content)
        if (draft.meta) setMeta({ ...DEFAULT_META, ...draft.meta })
      }
    } catch {
      /* localStorage 不可用或数据损坏时静默降级 */
    }
  }, [])
  /* eslint-enable react-hooks/set-state-in-effect */

  // 草稿自动保存(800ms 防抖),防止误关页面丢稿
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ content, meta }))
      } catch {
        /* 配额满等情况静默忽略 */
      }
    }, 800)
    return () => clearTimeout(t)
  }, [content, meta])

  const saveConfig = useCallback(() => {
    try {
      localStorage.setItem(GH_CONFIG_KEY, JSON.stringify(ghConfig))
      setStatus({ kind: 'ok', msg: '发布配置已保存到本浏览器（不会上传到任何服务器）' })
      setShowSettings(false)
    } catch {
      setStatus({ kind: 'err', msg: '保存失败：浏览器 localStorage 不可用' })
    }
  }, [ghConfig])

  const handleDownload = useCallback(() => {
    const { slug, markdown } = buildMarkdown(meta, content)
    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${slug}.md`
    a.click()
    URL.revokeObjectURL(url)
  }, [meta, content])

  const handlePublish = useCallback(async () => {
    if (!ghConfig.token || !ghConfig.owner || !ghConfig.repo) {
      setShowSettings(true)
      setStatus({ kind: 'warn', msg: '请先在 ⚙ 发布设置里填好 GitHub Token（fine-grained，Contents 读写权限）' })
      return
    }
    if (!meta.title.trim()) {
      setStatus({ kind: 'warn', msg: '先填标题再发布' })
      return
    }

    setPublishing(true)
    setStatus(null)
    try {
      const { slug, markdown } = buildMarkdown(meta, content)
      const path = `content/posts/${slug}.md`
      const apiUrl = `https://api.github.com/repos/${ghConfig.owner}/${ghConfig.repo}/contents/${encodeURI(path)}`
      const headers: Record<string, string> = {
        Authorization: `Bearer ${ghConfig.token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      }

      // 第一步:查文件是否已存在(覆盖更新需要带 sha)
      const sha = pendingSha ?? undefined
      if (!sha) {
        const res = await fetch(`${apiUrl}?ref=${encodeURIComponent(ghConfig.branch)}`, { headers })
        if (res.status === 200) {
          const data = (await res.json()) as { sha?: string }
          if (data.sha) {
            setPendingSha(data.sha)
            setStatus({ kind: 'warn', msg: `${path} 已存在。确认覆盖的话，再点一次 Publish` })
            return
          }
        } else if (res.status !== 404) {
          throw new Error(describeHttpError(res.status))
        }
      }

      // 第二步:创建或更新文件 → 触发 GitHub Actions 构建部署
      const putRes = await fetch(apiUrl, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `post: ${meta.title}`,
          content: utf8ToBase64(markdown),
          branch: ghConfig.branch,
          ...(sha ? { sha } : {}),
        }),
      })
      if (!putRes.ok) throw new Error(describeHttpError(putRes.status))
      const result = (await putRes.json()) as { commit?: { html_url?: string } }

      setPendingSha(null)
      setStatus({
        kind: 'ok',
        msg: `已发布 ${path}，CI 正在构建部署（约 3~5 分钟后上线）`,
        commitUrl: result.commit?.html_url,
        actionsUrl: `https://github.com/${ghConfig.owner}/${ghConfig.repo}/actions`,
      })
    } catch (e) {
      setStatus({ kind: 'err', msg: e instanceof Error ? e.message : '发布失败：网络错误' })
    } finally {
      setPublishing(false)
    }
  }, [ghConfig, meta, content, pendingSha])

  const insertText = useCallback((item: typeof TOOLBAR[0]) => {
    const ta = document.getElementById('md-editor') as HTMLTextAreaElement
    if (!ta) return
    const start = ta.selectionStart
    const end   = ta.selectionEnd
    const selected = content.slice(start, end)

    let inserted: string
    if (item.wrap && selected) {
      inserted = item.insert + selected + item.insert
    } else if (item.suffix) {
      inserted = item.insert + selected + item.suffix
    } else {
      inserted = item.insert + selected
    }

    const next = content.slice(0, start) + inserted + content.slice(end)
    setContent(next)
    setTimeout(() => {
      ta.focus()
      ta.setSelectionRange(start + inserted.length, start + inserted.length)
    }, 0)
  }, [content])

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length

  const statusColors: Record<PublishStatus['kind'], { fg: string; bg: string; border: string }> = {
    ok:   { fg: 'var(--green)',  bg: 'rgba(0,255,136,0.08)',  border: 'rgba(0,255,136,0.3)' },
    warn: { fg: 'var(--yellow)', bg: 'rgba(255,166,87,0.08)', border: 'rgba(255,166,87,0.3)' },
    err:  { fg: '#ff6b6b',       bg: 'rgba(255,107,107,0.08)', border: 'rgba(255,107,107,0.3)' },
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 120px)' }}>
      {/* Top bar */}
      <div className="terminal-card mb-3 p-3">
        <div className="flex flex-wrap gap-2 items-center">
          <input
            className="flex-1 min-w-32 bg-transparent border-b text-sm outline-none px-1"
            style={{ borderColor: 'var(--border)', color: 'var(--text-bright)' }}
            placeholder="标题"
            value={meta.title}
            onChange={e => {
              setMeta(m => ({ ...m, title: e.target.value }))
              setPendingSha(null) // 标题(即 slug)变了,之前"再点一次覆盖"的确认作废
            }}
          />
          <input
            className="w-28 bg-transparent border-b text-sm outline-none px-1"
            style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
            placeholder="分类"
            value={meta.category}
            onChange={e => setMeta(m => ({ ...m, category: e.target.value }))}
          />
          <input
            className="w-40 bg-transparent border-b text-sm outline-none px-1"
            style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
            placeholder="标签 (逗号分隔)"
            value={meta.tags}
            onChange={e => setMeta(m => ({ ...m, tags: e.target.value }))}
          />
          <input
            className="flex-1 min-w-32 bg-transparent border-b text-sm outline-none px-1"
            style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
            placeholder="摘要"
            value={meta.excerpt}
            onChange={e => setMeta(m => ({ ...m, excerpt: e.target.value }))}
          />
          <button onClick={() => setShowSettings(s => !s)}
                  title="发布设置"
                  className="text-xs px-2.5 py-1.5 rounded font-medium transition-colors"
                  style={{
                    background: showSettings ? 'rgba(88,166,255,0.15)' : 'var(--bg-card)',
                    color: showSettings ? 'var(--blue)' : 'var(--text-muted)',
                    border: '1px solid ' + (showSettings ? 'rgba(88,166,255,0.3)' : 'var(--border)'),
                  }}>
            ⚙
          </button>
          <button onClick={handleDownload}
                  title="下载 .md 文件（手动提交的兜底通路）"
                  className="text-xs px-3 py-1.5 rounded font-medium transition-colors"
                  style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
            ↓ .md
          </button>
          <button onClick={handlePublish}
                  disabled={publishing}
                  className="text-xs px-3 py-1.5 rounded font-medium transition-colors"
                  style={{
                    background: 'rgba(0,255,136,0.15)',
                    color: 'var(--green)',
                    border: '1px solid rgba(0,255,136,0.3)',
                    opacity: publishing ? 0.6 : 1,
                    cursor: publishing ? 'wait' : 'pointer',
                  }}>
            {publishing ? '⋯ Publishing' : pendingSha ? '⚠ 确认覆盖' : '↑ Publish'}
          </button>
        </div>

        {/* 发布设置面板 */}
        {showSettings && (
          <div className="mt-3 pt-3 grid gap-2 sm:grid-cols-2" style={{ borderTop: '1px solid var(--border)' }}>
            <label className="text-xs flex items-center gap-2" style={{ color: 'var(--text-dim)' }}>
              <span className="w-14 flex-none">owner</span>
              <input className="flex-1 bg-transparent border-b outline-none px-1"
                     style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                     value={ghConfig.owner}
                     onChange={e => setGhConfig(c => ({ ...c, owner: e.target.value.trim() }))} />
            </label>
            <label className="text-xs flex items-center gap-2" style={{ color: 'var(--text-dim)' }}>
              <span className="w-14 flex-none">repo</span>
              <input className="flex-1 bg-transparent border-b outline-none px-1"
                     style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                     value={ghConfig.repo}
                     onChange={e => setGhConfig(c => ({ ...c, repo: e.target.value.trim() }))} />
            </label>
            <label className="text-xs flex items-center gap-2" style={{ color: 'var(--text-dim)' }}>
              <span className="w-14 flex-none">branch</span>
              <input className="flex-1 bg-transparent border-b outline-none px-1"
                     style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                     value={ghConfig.branch}
                     onChange={e => setGhConfig(c => ({ ...c, branch: e.target.value.trim() }))} />
            </label>
            <label className="text-xs flex items-center gap-2" style={{ color: 'var(--text-dim)' }}>
              <span className="w-14 flex-none">token</span>
              <input className="flex-1 bg-transparent border-b outline-none px-1"
                     type="password"
                     placeholder="github_pat_..."
                     style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                     value={ghConfig.token}
                     onChange={e => setGhConfig(c => ({ ...c, token: e.target.value.trim() }))} />
            </label>
            <div className="text-xs sm:col-span-2 flex flex-wrap items-center gap-3" style={{ color: 'var(--text-dim)' }}>
              <span>
                建议用 fine-grained PAT，只给 {ghConfig.owner || 'owner'}/{ghConfig.repo || 'repo'} 的
                <span style={{ color: 'var(--text-muted)' }}> Contents: Read and write</span> 权限。
                Token 只存在本浏览器 localStorage。
              </span>
              <button onClick={saveConfig}
                      className="ml-auto px-3 py-1 rounded font-medium"
                      style={{ background: 'rgba(88,166,255,0.15)', color: 'var(--blue)', border: '1px solid rgba(88,166,255,0.3)' }}>
                保存配置
              </button>
            </div>
          </div>
        )}

        {/* 发布状态条 */}
        {status && (
          <div className="mt-3 px-3 py-2 rounded text-xs flex flex-wrap items-center gap-3"
               style={{
                 color: statusColors[status.kind].fg,
                 background: statusColors[status.kind].bg,
                 border: `1px solid ${statusColors[status.kind].border}`,
               }}>
            <span>{status.msg}</span>
            {status.commitUrl && (
              <a href={status.commitUrl} target="_blank" rel="noreferrer"
                 style={{ color: 'var(--blue)' }}>查看 commit →</a>
            )}
            {status.actionsUrl && (
              <a href={status.actionsUrl} target="_blank" rel="noreferrer"
                 style={{ color: 'var(--blue)' }}>Actions 进度 →</a>
            )}
            <button onClick={() => setStatus(null)} className="ml-auto"
                    style={{ color: 'var(--text-dim)' }}>✕</button>
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-1 mb-2 flex-wrap">
        {TOOLBAR.map(item => (
          <button key={item.label} onClick={() => insertText(item)}
                  className="text-xs px-2 py-1 rounded transition-colors font-mono"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
                  onMouseOver={e => (e.target as HTMLElement).style.color = 'var(--green)'}
                  onMouseOut={e => (e.target as HTMLElement).style.color = 'var(--text-muted)'}>
            {item.label}
          </button>
        ))}
        <div className="ml-auto flex gap-1">
          {(['split', 'editor', 'preview'] as ViewMode[]).map(v => (
            <button key={v} onClick={() => setView(v)}
                    className="text-xs px-2 py-1 rounded transition-colors"
                    style={{
                      background: view === v ? 'rgba(0,255,136,0.15)' : 'var(--bg-card)',
                      border: '1px solid ' + (view === v ? 'rgba(0,255,136,0.3)' : 'var(--border)'),
                      color: view === v ? 'var(--green)' : 'var(--text-muted)',
                    }}>
              {v}
            </button>
          ))}
        </div>
        <span className="text-xs ml-2" style={{ color: 'var(--text-dim)' }}>{wordCount} words</span>
      </div>

      {/* Editor / Preview panes */}
      <div className="flex-1 flex gap-3 min-h-0">
        {/* Editor */}
        {(view === 'split' || view === 'editor') && (
          <div className="terminal-card flex flex-col flex-1 min-h-0">
            <div className="text-xs px-3 py-1.5 flex items-center gap-2"
                 style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-dim)' }}>
              <span style={{ color: 'var(--green)' }}>●</span> markdown
            </div>
            <textarea
              id="md-editor"
              className="flex-1 w-full p-4 bg-transparent outline-none resize-none text-sm leading-relaxed font-mono"
              style={{ color: 'var(--text-bright)' }}
              value={content}
              onChange={e => setContent(e.target.value)}
              spellCheck={false}
            />
          </div>
        )}

        {/* Preview */}
        {(view === 'split' || view === 'preview') && (
          <div className="terminal-card flex flex-col flex-1 min-h-0 overflow-hidden">
            <div className="text-xs px-3 py-1.5 flex items-center gap-2"
                 style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-dim)' }}>
              <span style={{ color: 'var(--blue)' }}>●</span> preview
            </div>
            <div className="flex-1 overflow-y-auto p-6 prose">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
