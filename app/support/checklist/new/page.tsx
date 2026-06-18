'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Item = { id: string; text: string; required: boolean }

const CATEGORIES = ['材料分析', '财务核查', '竞对分析', '多步骤任务', 'general']

const SEED_ITEMS: Item[] = [
  { id: '1', text: 'AI 是否对每个关键数据点标注了来源（材料章节/段落）', required: true },
  { id: '2', text: '是否存在材料未提及、但 AI 仍给出了具体数值的情况（疑似编造）', required: true },
  { id: '3', text: '涉及多份材料时，结论是否出现了不应有的雷同（跨材料混淆）', required: true },
  { id: '4', text: '表格数据是否与原始材料逐项核对（含单位：万/亿、人民币/港币）', required: true },
  { id: '5', text: '结论是否包含 AI 自行推测的市场传闻或背景知识', required: false },
  { id: '6', text: '多步骤任务：AI 是否正确记得前序步骤的结论（无遗忘/跑偏）', required: false },
]

export default function NewChecklistPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('general')
  const [items, setItems] = useState<Item[]>([])

  const addItem = () => setItems(prev => [
    ...prev,
    { id: Date.now().toString(), text: '', required: false },
  ])
  const updateItem = (id: string, k: keyof Item, v: string | boolean) =>
    setItems(prev => prev.map(item => item.id === id ? { ...item, [k]: v } : item))
  const removeItem = (id: string) => setItems(prev => prev.filter(i => i.id !== id))
  const loadSeed = () => setItems(SEED_ITEMS.map(i => ({ ...i, id: Date.now().toString() + i.id })))

  const save = async () => {
    if (!title) return
    setSaving(true)
    const res = await fetch('/api/support/checklist-sets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, category, items }),
    })
    if (res.ok) router.push('/support/checklist')
    else setSaving(false)
  }

  const inputStyle = {
    background: 'var(--bg)', border: '1px solid var(--border)',
    color: 'var(--text-bright)', borderRadius: '4px',
    padding: '8px 10px', fontSize: '13px', width: '100%',
    outline: 'none', fontFamily: 'inherit',
  }
  const labelStyle = { color: 'var(--text-dim)', fontSize: '11px', marginBottom: '4px', display: 'block' as const }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <div className="text-xs mb-1" style={{ color: 'var(--text-dim)' }}>~/support/checklist/new</div>
        <h1 className="text-lg font-bold" style={{ color: 'var(--text-bright)' }}>
          <span style={{ color: 'var(--blue)' }}>+ </span>新建 Checklist
        </h1>
      </div>

      <div className="space-y-4">
        <div className="terminal-card p-5 space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <label style={labelStyle}>清单名称 *</label>
              <input style={inputStyle} value={title} onChange={e => setTitle(e.target.value)}
                placeholder="例：材料分析类通用核查清单" />
            </div>
            <div className="w-40">
              <label style={labelStyle}>分类</label>
              <select style={inputStyle} value={category} onChange={e => setCategory(e.target.value)}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="terminal-card p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold" style={{ color: 'var(--blue)' }}>
              核查项目 ({items.length} 项)
            </span>
            <div className="flex gap-2">
              {items.length === 0 && (
                <button onClick={loadSeed} className="text-xs px-2 py-1 rounded"
                  style={{ background: 'rgba(57,208,216,0.1)', color: 'var(--cyan)', border: '1px solid rgba(57,208,216,0.2)' }}>
                  加载通用模板
                </button>
              )}
              <button onClick={addItem} className="text-xs px-2 py-1 rounded"
                style={{ background: 'rgba(88,166,255,0.1)', color: 'var(--blue)', border: '1px solid rgba(88,166,255,0.2)' }}>
                + 添加项目
              </button>
            </div>
          </div>

          {items.length === 0 ? (
            <p className="text-xs py-4 text-center" style={{ color: 'var(--text-dim)' }}>
              点击"加载通用模板"快速开始，或手动添加核查项目
            </p>
          ) : (
            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={item.id} className="flex items-start gap-2">
                  <span className="text-xs mt-2.5 w-5 shrink-0 text-right" style={{ color: 'var(--text-dim)' }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="flex-1">
                    <input style={{ ...inputStyle, borderColor: 'var(--border)' }}
                      placeholder="核查项描述"
                      value={item.text}
                      onChange={e => updateItem(item.id, 'text', e.target.value)} />
                  </div>
                  <label className="flex items-center gap-1 mt-2 shrink-0 cursor-pointer">
                    <input type="checkbox" checked={item.required}
                      onChange={e => updateItem(item.id, 'required', e.target.checked)} />
                    <span className="text-xs" style={{ color: 'var(--text-dim)' }}>必查</span>
                  </label>
                  <button onClick={() => removeItem(item.id)}
                    className="mt-1.5 shrink-0" style={{ color: 'var(--text-dim)', fontSize: '16px' }}>×</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button onClick={save} disabled={saving || !title}
          className="w-full py-2.5 rounded text-sm font-medium"
          style={{
            background: 'rgba(88,166,255,0.15)', color: 'var(--blue)',
            border: '1px solid rgba(88,166,255,0.3)',
            opacity: !title ? 0.4 : 1, cursor: !title ? 'not-allowed' : 'pointer',
          }}>
          {saving ? '保存中...' : '✓ 保存清单'}
        </button>
      </div>
    </div>
  )
}
