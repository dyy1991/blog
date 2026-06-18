'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type Pitfall = {
  id: string; scenario: string; symptom: string;
  triggerCondition: string; suggestion: string; tags: string; createdAt: string
}
type Case = {
  id: string; title: string; scenario: string;
  promptFullText: string; outputSummary: string; tags: string; createdAt: string
}

export default function KnowledgePage() {
  const [tab, setTab] = useState<'pitfalls' | 'cases'>('pitfalls')
  const [pitfalls, setPitfalls] = useState<Pitfall[]>([])
  const [cases, setCases] = useState<Case[]>([])
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    const [p, c] = await Promise.all([
      fetch(`/api/support/knowledge/pitfalls${q ? `?q=${encodeURIComponent(q)}` : ''}`).then(r => r.json()),
      fetch(`/api/support/knowledge/cases${q ? `?q=${encodeURIComponent(q)}` : ''}`).then(r => r.json()),
    ])
    setPitfalls(p)
    setCases(c)
    setLoading(false)
  }

  useEffect(() => { fetchData() }, []) // eslint-disable-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect

  const search = (e: React.FormEvent) => { e.preventDefault(); fetchData() }

  const deleteItem = async (type: 'pitfalls' | 'cases', id: string) => {
    if (!confirm('确认删除？')) return
    await fetch(`/api/support/knowledge/${type}/${id}`, { method: 'DELETE' })
    fetchData()
  }

  const inputStyle = {
    background: 'var(--bg)', border: '1px solid var(--border)',
    color: 'var(--text-bright)', borderRadius: '4px',
    padding: '8px 12px', fontSize: '13px',
    outline: 'none', fontFamily: 'inherit',
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-xs mb-1" style={{ color: 'var(--text-dim)' }}>~/support/knowledge</div>
          <h1 className="text-lg font-bold" style={{ color: 'var(--text-bright)' }}>
            <span style={{ color: 'var(--cyan)' }}>## </span>知识库
            <span className="text-sm font-normal ml-2" style={{ color: 'var(--text-dim)' }}>
              [{pitfalls.length} 坑位 · {cases.length} 案例]
            </span>
          </h1>
        </div>
        <Link href="/support/knowledge/new"
          className="text-xs px-3 py-1.5 rounded no-underline"
          style={{ background: 'rgba(57,208,216,0.1)', color: 'var(--cyan)', border: '1px solid rgba(57,208,216,0.2)' }}>
          + 新增记录
        </Link>
      </div>

      {/* 搜索 */}
      <form onSubmit={search} className="flex gap-2 mb-6">
        <input style={{ ...inputStyle, flex: 1 }} placeholder="搜索场景、症状、标签…"
          value={q} onChange={e => setQ(e.target.value)} />
        <button type="submit"
          className="px-4 py-2 rounded text-xs"
          style={{ background: 'rgba(57,208,216,0.1)', color: 'var(--cyan)', border: '1px solid rgba(57,208,216,0.2)' }}>
          搜索
        </button>
      </form>

      {/* 标签页 */}
      <div className="flex gap-1 mb-4">
        {(['pitfalls', 'cases'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="text-xs px-4 py-2 rounded"
            style={{
              background: tab === t ? 'rgba(57,208,216,0.15)' : 'var(--bg-card)',
              color: tab === t ? 'var(--cyan)' : 'var(--text-muted)',
              border: '1px solid ' + (tab === t ? 'rgba(57,208,216,0.3)' : 'var(--border)'),
            }}>
            {t === 'pitfalls' ? `坑位记录 (${pitfalls.length})` : `复用案例 (${cases.length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-xs" style={{ color: 'var(--text-dim)' }}>搜索中…</div>
      ) : tab === 'pitfalls' ? (
        <div className="space-y-3">
          {pitfalls.length === 0 && (
            <div className="terminal-card p-8 text-center" style={{ color: 'var(--text-dim)' }}>
              暂无坑位记录 · <Link href="/support/knowledge/new?type=pitfall" style={{ color: 'var(--cyan)' }}>记录第一个坑位 →</Link>
            </div>
          )}
          {pitfalls.map(p => (
            <div key={p.id} className="terminal-card p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-xs px-2 py-0.5 rounded"
                      style={{ background: 'rgba(255,166,87,0.1)', color: 'var(--yellow)', border: '1px solid rgba(255,166,87,0.2)' }}>
                      坑位
                    </span>
                    {p.tags.split(',').filter(Boolean).map(tag => (
                      <span key={tag} className="text-xs" style={{ color: 'var(--text-dim)' }}>#{tag.trim()}</span>
                    ))}
                    <span className="text-xs ml-auto" style={{ color: 'var(--text-dim)' }}>
                      {new Date(p.createdAt).toLocaleDateString('zh-CN')}
                    </span>
                  </div>
                  <div className="text-sm font-medium mb-1" style={{ color: 'var(--text-bright)' }}>{p.scenario}</div>
                  <div className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
                    <span style={{ color: 'var(--yellow)' }}>症状：</span>{p.symptom}
                  </div>
                  {expanded === p.id && (
                    <div className="space-y-1 mt-2 text-xs">
                      {p.triggerCondition && (
                        <div><span style={{ color: 'var(--text-dim)' }}>触发条件：</span>
                          <span style={{ color: 'var(--text)' }}>{p.triggerCondition}</span></div>
                      )}
                      <div><span style={{ color: 'var(--green)' }}>应对建议：</span>
                        <span style={{ color: 'var(--text)' }}>{p.suggestion}</span></div>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <button onClick={() => setExpanded(expanded === p.id ? null : p.id)}
                    className="text-xs px-2 py-1 rounded"
                    style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                    {expanded === p.id ? '收起' : '展开'}
                  </button>
                  <button onClick={() => deleteItem('pitfalls', p.id)}
                    className="text-xs px-2 py-1 rounded"
                    style={{ background: 'rgba(255,80,80,0.06)', color: '#ff6b6b', border: '1px solid rgba(255,80,80,0.15)' }}>
                    删除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {cases.length === 0 && (
            <div className="terminal-card p-8 text-center" style={{ color: 'var(--text-dim)' }}>
              暂无复用案例 · <Link href="/support/knowledge/new?type=case" style={{ color: 'var(--cyan)' }}>记录第一个案例 →</Link>
            </div>
          )}
          {cases.map(c => (
            <div key={c.id} className="terminal-card p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-xs px-2 py-0.5 rounded"
                      style={{ background: 'rgba(57,208,216,0.1)', color: 'var(--cyan)', border: '1px solid rgba(57,208,216,0.2)' }}>
                      案例
                    </span>
                    {c.tags.split(',').filter(Boolean).map(tag => (
                      <span key={tag} className="text-xs" style={{ color: 'var(--text-dim)' }}>#{tag.trim()}</span>
                    ))}
                    <span className="text-xs ml-auto" style={{ color: 'var(--text-dim)' }}>
                      {new Date(c.createdAt).toLocaleDateString('zh-CN')}
                    </span>
                  </div>
                  <div className="text-sm font-medium mb-1" style={{ color: 'var(--text-bright)' }}>{c.title}</div>
                  <div className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>{c.scenario}</div>
                  {expanded === c.id && (
                    <div className="space-y-2 mt-2">
                      <div className="terminal-card p-3">
                        <div className="text-xs mb-1" style={{ color: 'var(--text-dim)' }}>Prompt 全文</div>
                        <pre className="text-xs whitespace-pre-wrap leading-relaxed" style={{ color: 'var(--text)' }}>
                          {c.promptFullText}
                        </pre>
                      </div>
                      {c.outputSummary && (
                        <div className="text-xs">
                          <span style={{ color: 'var(--green)' }}>输出要点：</span>
                          <span style={{ color: 'var(--text)' }}>{c.outputSummary}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <button onClick={() => setExpanded(expanded === c.id ? null : c.id)}
                    className="text-xs px-2 py-1 rounded"
                    style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                    {expanded === c.id ? '收起' : '查看'}
                  </button>
                  <button onClick={() => deleteItem('cases', c.id)}
                    className="text-xs px-2 py-1 rounded"
                    style={{ background: 'rgba(255,80,80,0.06)', color: '#ff6b6b', border: '1px solid rgba(255,80,80,0.15)' }}>
                    删除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
