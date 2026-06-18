'use client'

import { useState, useCallback } from 'react'
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

写完后点 **Download .md**，把文件放入 \`content/posts/\` 目录，commit 后自动部署。
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

export default function WritePage() {
  const [content, setContent] = useState(INITIAL_CONTENT)
  const [meta, setMeta] = useState({ title: '新文章', category: 'tech', tags: '', excerpt: '' })
  const [view, setView] = useState<ViewMode>('split')

  const handleDownload = useCallback(() => {
    const date = new Date().toISOString().split('T')[0]
    const slug = meta.title.toLowerCase().replace(/[\s\W]+/g, '-').replace(/^-|-$/g, '') || 'untitled'
    const tagsArr = meta.tags.split(',').map(t => t.trim()).filter(Boolean)
    const fm = `---
title: "${meta.title}"
date: "${date}"
category: "${meta.category}"
tags: [${tagsArr.map(t => `"${t}"`).join(', ')}]
excerpt: "${meta.excerpt || meta.title}"
---

`
    const blob = new Blob([fm + content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${slug}.md`
    a.click()
    URL.revokeObjectURL(url)
  }, [meta, content])

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
            onChange={e => setMeta(m => ({ ...m, title: e.target.value }))}
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
          <button onClick={handleDownload}
                  className="text-xs px-3 py-1.5 rounded font-medium transition-colors"
                  style={{ background: 'rgba(0,255,136,0.15)', color: 'var(--green)', border: '1px solid rgba(0,255,136,0.3)' }}>
            ↓ Download .md
          </button>
        </div>
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
