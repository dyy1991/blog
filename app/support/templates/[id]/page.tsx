'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'

type Param = { key: string; label: string; placeholder: string }
type Template = {
  id: string; title: string; category: string
  roleText: string; taskTemplate: string; formatText: string; guardText: string
  params: string; usageCount: number
}

const CATEGORIES = ['尽调', '竞对分析', '行业对比', '财务分析', '公司摘要', 'general']
const DEFAULT_GUARD = '仅基于本次提供的材料作答；每个关键数据请注明对应材料的章节或位置；若材料未提及，请直接说明「材料未提及」，不要使用先验知识推测或补全；若本对话此前提到过其他公司的材料，请不要混用其数据或结论。'

function assemblePrompt(t: Template, values: Record<string, string>): string {
  const replace = (s: string) =>
    s.replace(/\{(\w+)\}/g, (_, k) => values[k] || `{${k}}`)

  return [
    t.roleText && `${replace(t.roleText)}`,
    t.taskTemplate && `\n${replace(t.taskTemplate)}`,
    t.formatText && `\n\n${replace(t.formatText)}`,
    t.guardText && `\n\n${replace(t.guardText)}`,
  ].filter(Boolean).join('')
}

function TemplatePageInner() {
  const { id } = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()
  const isEdit = searchParams.get('edit') === '1'

  const [template, setTemplate] = useState<Template | null>(null)
  const [values, setValues] = useState<Record<string, string>>({})
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(false)

  // Edit mode state
  const [editForm, setEditForm] = useState<Omit<Template, 'id' | 'usageCount' | 'params'> & { params: Param[] } | null>(null)

  useEffect(() => {
    fetch(`/api/support/templates/${id}`)
      .then(r => r.json())
      .then((t: Template) => {
        setTemplate(t)
        const ps: Param[] = JSON.parse(t.params || '[]')
        const init: Record<string, string> = {}
        ps.forEach(p => { init[p.key] = '' })
        setValues(init)
        if (isEdit) {
          setEditForm({
            title: t.title, category: t.category, roleText: t.roleText,
            taskTemplate: t.taskTemplate, formatText: t.formatText, guardText: t.guardText,
            params: ps,
          })
        }
      })
  }, [id, isEdit])

  const copy = useCallback(async () => {
    if (!template) return
    const text = assemblePrompt(template, values)
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    fetch(`/api/support/templates/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ incrementUsage: true }),
    })
  }, [template, values, id])

  const saveEdit = async () => {
    if (!editForm) return
    setSaving(true)
    await fetch(`/api/support/templates/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...editForm, params: editForm.params }),
    })
    router.push('/support/templates')
  }

  const deleteTemplate = async () => {
    if (!confirm('确认删除此模板？')) return
    await fetch(`/api/support/templates/${id}`, { method: 'DELETE' })
    router.push('/support/templates')
  }

  const inputStyle = {
    background: 'var(--bg)', border: '1px solid var(--border)',
    color: 'var(--text-bright)', borderRadius: '4px',
    padding: '8px 10px', fontSize: '13px', width: '100%',
    outline: 'none', fontFamily: 'inherit',
  }
  const labelStyle = { color: 'var(--text-dim)', fontSize: '11px', marginBottom: '4px', display: 'block' as const }

  if (!template) return <div className="text-xs" style={{ color: 'var(--text-dim)' }}>加载中...</div>

  const params: Param[] = JSON.parse(template.params || '[]')

  // ── Edit mode ──────────────────────────────────────────────────
  if (isEdit && editForm) {
    const setF = (k: keyof typeof editForm, v: string) => setEditForm(f => f ? { ...f, [k]: v } : f)
    const updateParam = (i: number, k: keyof Param, v: string) =>
      setEditForm(f => f ? { ...f, params: f.params.map((p, idx) => idx === i ? { ...p, [k]: v } : p) } : f)
    const addParam = () => setEditForm(f => f ? { ...f, params: [...f.params, { key: '', label: '', placeholder: '' }] } : f)
    const removeParam = (i: number) => setEditForm(f => f ? { ...f, params: f.params.filter((_, idx) => idx !== i) } : f)

    return (
      <div>
        <div className="mb-6">
          <div className="text-xs mb-1" style={{ color: 'var(--text-dim)' }}>编辑模板</div>
          <h1 className="text-lg font-bold" style={{ color: 'var(--text-bright)' }}>
            <span style={{ color: 'var(--green)' }}>✎ </span>{editForm.title}
          </h1>
        </div>
        <div className="flex gap-6">
          <div className="flex-1 space-y-4">
            <div className="terminal-card p-5 space-y-4">
              <div className="flex gap-3">
                <div className="flex-1">
                  <label style={labelStyle}>模板名称</label>
                  <input style={inputStyle} value={editForm.title} onChange={e => setF('title', e.target.value)} />
                </div>
                <div className="w-36">
                  <label style={labelStyle}>分类</label>
                  <select style={inputStyle} value={editForm.category} onChange={e => setF('category', e.target.value)}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={labelStyle}>角色设定</label>
                <input style={inputStyle} value={editForm.roleText} onChange={e => setF('roleText', e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>任务描述模板</label>
                <textarea style={{ ...inputStyle, minHeight: '90px', resize: 'vertical' as const }}
                  value={editForm.taskTemplate} onChange={e => setF('taskTemplate', e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>输出格式要求</label>
                <textarea style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' as const }}
                  value={editForm.formatText} onChange={e => setF('formatText', e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>防护性约束语句</label>
                <textarea style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' as const }}
                  value={editForm.guardText} onChange={e => setF('guardText', e.target.value)} />
              </div>
            </div>
            <div className="terminal-card p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold" style={{ color: 'var(--blue)' }}>参数列表</span>
                <button onClick={addParam} className="text-xs px-2 py-1 rounded"
                  style={{ background: 'rgba(88,166,255,0.1)', color: 'var(--blue)', border: '1px solid rgba(88,166,255,0.2)' }}>
                  + 添加参数
                </button>
              </div>
              <div className="space-y-2">
                {editForm.params.map((p, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input style={{ ...inputStyle, width: '120px' }} placeholder="参数名" value={p.key}
                      onChange={e => updateParam(i, 'key', e.target.value)} />
                    <input style={{ ...inputStyle, width: '100px' }} placeholder="标签" value={p.label}
                      onChange={e => updateParam(i, 'label', e.target.value)} />
                    <input style={{ ...inputStyle, flex: 1 }} placeholder="示例值" value={p.placeholder}
                      onChange={e => updateParam(i, 'placeholder', e.target.value)} />
                    <button onClick={() => removeParam(i)} style={{ color: 'var(--text-dim)', fontSize: '16px' }}>×</button>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={saveEdit} disabled={saving}
                className="flex-1 py-2.5 rounded text-sm font-medium"
                style={{ background: 'rgba(0,255,136,0.15)', color: 'var(--green)', border: '1px solid rgba(0,255,136,0.3)' }}>
                {saving ? '保存中...' : '✓ 保存修改'}
              </button>
              <button onClick={deleteTemplate}
                className="px-4 py-2.5 rounded text-sm"
                style={{ background: 'rgba(255,80,80,0.08)', color: '#ff6b6b', border: '1px solid rgba(255,80,80,0.2)' }}>
                删除
              </button>
            </div>
          </div>
          <div className="w-80 shrink-0">
            <div className="sticky top-24 terminal-card p-4">
              <div className="text-xs mb-3 font-semibold" style={{ color: 'var(--blue)' }}>结构预览</div>
              <pre className="text-xs whitespace-pre-wrap leading-relaxed" style={{ color: 'var(--text-muted)', fontFamily: 'inherit' }}>
                {[editForm.roleText, editForm.taskTemplate, editForm.formatText, editForm.guardText].filter(Boolean).join('\n\n') || '…'}
              </pre>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Use mode ───────────────────────────────────────────────────
  const prompt = assemblePrompt(template, values)
  const allFilled = params.every(p => values[p.key]?.trim())

  return (
    <div>
      <div className="mb-6">
        <div className="text-xs mb-1" style={{ color: 'var(--text-dim)' }}>~/support/templates / 使用</div>
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold" style={{ color: 'var(--text-bright)' }}>
            <span style={{ color: 'var(--green)' }}>{'{ } '}</span>{template.title}
          </h1>
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-dim)' }}>
            <span className="px-2 py-0.5 rounded"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              {template.category}
            </span>
            <span>used {template.usageCount}x</span>
          </div>
        </div>
      </div>

      <div className="flex gap-6">
        {/* 左：填参数 */}
        <div className="w-64 shrink-0">
          <div className="sticky top-24 terminal-card p-4">
            <div className="text-xs font-semibold mb-4" style={{ color: 'var(--blue)' }}>填写参数</div>
            {params.length === 0 ? (
              <p className="text-xs" style={{ color: 'var(--text-dim)' }}>此模板无参数，可直接复制</p>
            ) : (
              <div className="space-y-3">
                {params.map(p => (
                  <div key={p.key}>
                    <label style={labelStyle}>{p.label || p.key}</label>
                    <input
                      style={{ ...inputStyle, borderColor: values[p.key] ? 'rgba(0,255,136,0.3)' : 'var(--border)' }}
                      placeholder={p.placeholder || p.key}
                      value={values[p.key] || ''}
                      onChange={e => setValues(v => ({ ...v, [p.key]: e.target.value }))}
                    />
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={copy}
              disabled={params.length > 0 && !allFilled}
              className="mt-5 w-full py-2.5 rounded text-sm font-bold transition-all"
              style={{
                background: copied ? 'rgba(0,255,136,0.25)' : 'rgba(0,255,136,0.15)',
                color: 'var(--green)',
                border: '1px solid rgba(0,255,136,0.3)',
                opacity: (params.length > 0 && !allFilled) ? 0.4 : 1,
                cursor: (params.length > 0 && !allFilled) ? 'not-allowed' : 'pointer',
              }}>
              {copied ? '✓ 已复制！' : '📋 复制 Prompt'}
            </button>
            {params.length > 0 && !allFilled && (
              <p className="text-xs mt-2 text-center" style={{ color: 'var(--text-dim)' }}>请先填写所有参数</p>
            )}
          </div>
        </div>

        {/* 右：Prompt 预览 */}
        <div className="flex-1 terminal-card">
          <div className="flex items-center gap-2 px-4 py-2" style={{ borderBottom: '1px solid var(--border)' }}>
            <span className="w-3 h-3 rounded-full" style={{ background: '#ff5f57' }} />
            <span className="w-3 h-3 rounded-full" style={{ background: '#febc2e' }} />
            <span className="w-3 h-3 rounded-full" style={{ background: '#28c840' }} />
            <span className="text-xs ml-2" style={{ color: 'var(--text-dim)' }}>prompt_preview.txt</span>
          </div>
          <div className="p-6">
            <pre className="text-sm whitespace-pre-wrap leading-relaxed font-mono" style={{ color: 'var(--text-bright)' }}>
              {prompt}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function TemplatePage() { return <Suspense fallback={null}><TemplatePageInner /></Suspense> }
