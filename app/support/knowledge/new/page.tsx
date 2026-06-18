'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

type TemplateOption = { id: string; title: string }

function NewKnowledgePageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultType = searchParams.get('type') === 'case' ? 'case' : 'pitfall'

  const [type, setType] = useState<'pitfall' | 'case'>(defaultType)
  const [saving, setSaving] = useState(false)
  const [relatedTemplateId, setRelatedTemplateId] = useState('')
  const [templates, setTemplates] = useState<TemplateOption[]>([])

  const [pitfall, setPitfall] = useState({ scenario: '', symptom: '', triggerCondition: '', suggestion: '', tags: '' })
  const [kcase, setKcase] = useState({ title: '', scenario: '', promptFullText: '', outputSummary: '', tags: '' })

  useEffect(() => {
    fetch('/api/support/templates').then(r => r.json()).then(setTemplates)
  }, [])

  const setP = (k: keyof typeof pitfall, v: string) => setPitfall(f => ({ ...f, [k]: v }))
  const setC = (k: keyof typeof kcase, v: string) => setKcase(f => ({ ...f, [k]: v }))

  const save = async () => {
    setSaving(true)
    if (type === 'pitfall') {
      if (!pitfall.scenario || !pitfall.symptom || !pitfall.suggestion) { setSaving(false); return }
      const res = await fetch('/api/support/knowledge/pitfalls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...pitfall, relatedTemplateId: relatedTemplateId || null }),
      })
      if (res.ok) router.push('/support/knowledge')
    } else {
      if (!kcase.title || !kcase.scenario || !kcase.promptFullText) { setSaving(false); return }
      const res = await fetch('/api/support/knowledge/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...kcase, relatedTemplateId: relatedTemplateId || null }),
      })
      if (res.ok) router.push('/support/knowledge')
    }
    setSaving(false)
  }

  const inputStyle = {
    background: 'var(--bg)', border: '1px solid var(--border)',
    color: 'var(--text-bright)', borderRadius: '4px',
    padding: '8px 10px', fontSize: '13px', width: '100%',
    outline: 'none', fontFamily: 'inherit',
  }
  const textareaStyle = { ...inputStyle, minHeight: '80px', resize: 'vertical' as const }
  const labelStyle = { color: 'var(--text-muted)', fontSize: '11px', marginBottom: '4px', display: 'block' as const }

  const canSave = type === 'pitfall'
    ? !!(pitfall.scenario && pitfall.symptom && pitfall.suggestion)
    : !!(kcase.title && kcase.scenario && kcase.promptFullText)

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>~/support/knowledge/new</div>
        <h1 className="text-lg font-bold" style={{ color: 'var(--text-bright)' }}>
          <span style={{ color: 'var(--cyan)' }}>+ </span>新增知识记录
        </h1>
      </div>

      {/* 类型选择 */}
      <div className="flex gap-2 mb-6">
        {(['pitfall', 'case'] as const).map(t => (
          <button key={t} onClick={() => setType(t)}
            className="text-sm px-4 py-2 rounded font-medium"
            style={{
              background: type === t ? 'rgba(57,208,216,0.15)' : 'var(--bg-card)',
              color: type === t ? 'var(--cyan)' : 'var(--text-muted)',
              border: '1px solid ' + (type === t ? 'rgba(57,208,216,0.3)' : 'var(--border)'),
            }}>
            {t === 'pitfall' ? '⚠ 坑位记录' : '✦ 复用案例'}
          </button>
        ))}
      </div>

      <div className="terminal-card p-5 space-y-4">
        {/* 关联模板选择器 */}
        <div>
          <label style={labelStyle}>
            关联 Prompt 模板 <span style={{ color: 'var(--text-dim)' }}>（选填，关联后在模板使用页自动显示{type === 'pitfall' ? '此坑位' : '此案例'}）</span>
          </label>
          <select style={inputStyle} value={relatedTemplateId} onChange={e => setRelatedTemplateId(e.target.value)}>
            <option value="">不关联</option>
            {templates.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select>
        </div>

        {type === 'pitfall' ? (
          <>
            <div>
              <label style={labelStyle}>任务场景 * <span style={{ color: 'var(--text-dim)' }}>（什么类型的任务容易出现这个问题）</span></label>
              <input style={inputStyle} value={pitfall.scenario} onChange={e => setP('scenario', e.target.value)}
                placeholder="例：财务分析 · 多家公司横向对比" />
            </div>
            <div>
              <label style={labelStyle}>错误表现 * <span style={{ color: 'var(--text-dim)' }}>（AI 具体出了什么问题）</span></label>
              <textarea style={textareaStyle} value={pitfall.symptom} onChange={e => setP('symptom', e.target.value)}
                placeholder="例：将 A 公司 2023 年的营收数据错误引用到 B 公司分析结论中" />
            </div>
            <div>
              <label style={labelStyle}>触发条件 <span style={{ color: 'var(--text-dim)' }}>（什么情况下容易出现）</span></label>
              <input style={inputStyle} value={pitfall.triggerCondition} onChange={e => setP('triggerCondition', e.target.value)}
                placeholder="例：同一对话中连续分析超过 2 家公司" />
            </div>
            <div>
              <label style={labelStyle}>应对建议 *</label>
              <textarea style={textareaStyle} value={pitfall.suggestion} onChange={e => setP('suggestion', e.target.value)}
                placeholder="例：在 Prompt 开头明确说「本次只分析 X 公司，请忽略之前的分析」" />
            </div>
            <div>
              <label style={labelStyle}>标签 <span style={{ color: 'var(--text-dim)' }}>（逗号分隔）</span></label>
              <input style={inputStyle} value={pitfall.tags} onChange={e => setP('tags', e.target.value)}
                placeholder="跨材料混淆, 数据编造, 多步骤任务" />
            </div>
          </>
        ) : (
          <>
            <div>
              <label style={labelStyle}>案例标题 *</label>
              <input style={inputStyle} value={kcase.title} onChange={e => setC('title', e.target.value)}
                placeholder="例：消费行业公司 3 年财务趋势分析 · 高质量版本" />
            </div>
            <div>
              <label style={labelStyle}>适用场景 *</label>
              <input style={inputStyle} value={kcase.scenario} onChange={e => setC('scenario', e.target.value)}
                placeholder="例：单一公司财务摘要，基于年报材料" />
            </div>
            <div>
              <label style={labelStyle}>Prompt 全文 * <span style={{ color: 'var(--text-dim)' }}>（使用脱敏/虚构示例，不含真实业务数据）</span></label>
              <textarea style={{ ...textareaStyle, minHeight: '160px' }} value={kcase.promptFullText}
                onChange={e => setC('promptFullText', e.target.value)}
                placeholder="你是一位专注于消费行业的资深分析师。基于以下材料…" />
            </div>
            <div>
              <label style={labelStyle}>输出要点摘录</label>
              <textarea style={textareaStyle} value={kcase.outputSummary}
                onChange={e => setC('outputSummary', e.target.value)}
                placeholder="记录这个 Prompt 产出的结果亮点，帮助下次快速判断是否值得复用" />
            </div>
            <div>
              <label style={labelStyle}>标签</label>
              <input style={inputStyle} value={kcase.tags} onChange={e => setC('tags', e.target.value)}
                placeholder="财务分析, 消费行业, 年报" />
            </div>
          </>
        )}
      </div>

      <button onClick={save} disabled={saving || !canSave}
        className="mt-4 w-full py-2.5 rounded text-sm font-medium"
        style={{
          background: 'rgba(57,208,216,0.15)', color: 'var(--cyan)',
          border: '1px solid rgba(57,208,216,0.3)',
          opacity: !canSave ? 0.4 : 1, cursor: !canSave ? 'not-allowed' : 'pointer',
        }}>
        {saving ? '保存中...' : `✓ 保存${type === 'pitfall' ? '坑位记录' : '复用案例'}`}
      </button>
    </div>
  )
}

export default function NewKnowledgePage() { return <Suspense fallback={null}><NewKnowledgePageInner /></Suspense> }
