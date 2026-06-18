'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Param = { key: string; label: string; placeholder: string }

const CATEGORIES = ['尽调', '竞对分析', '行业对比', '财务分析', '公司摘要', 'general']

const DEFAULT_GUARD = '仅基于本次提供的材料作答；每个关键数据请注明对应材料的章节或位置；若材料未提及，请直接说明「材料未提及」，不要使用先验知识推测或补全；若本对话此前提到过其他公司的材料，请不要混用其数据或结论。'

export default function NewTemplatePage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '',
    category: 'general',
    roleText: '',
    taskTemplate: '',
    formatText: '',
    guardText: DEFAULT_GUARD,
  })
  const [params, setParams] = useState<Param[]>([])

  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }))

  const addParam = () => setParams(p => [...p, { key: '', label: '', placeholder: '' }])
  const updateParam = (i: number, k: keyof Param, v: string) =>
    setParams(p => p.map((item, idx) => idx === i ? { ...item, [k]: v } : item))
  const removeParam = (i: number) => setParams(p => p.filter((_, idx) => idx !== i))

  // 预览：用 param label 替换 {key}
  const preview = [
    form.roleText && `[角色]\n${form.roleText}`,
    form.taskTemplate && `[任务]\n${form.taskTemplate}`,
    form.formatText && `[输出格式]\n${form.formatText}`,
    form.guardText && `[约束]\n${form.guardText}`,
  ].filter(Boolean).join('\n\n')

  const save = async () => {
    if (!form.title || !form.taskTemplate) return
    setSaving(true)
    const res = await fetch('/api/support/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, params }),
    })
    if (res.ok) router.push('/support/templates')
    else setSaving(false)
  }

  const inputStyle = {
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    color: 'var(--text-bright)',
    borderRadius: '4px',
    padding: '8px 10px',
    fontSize: '13px',
    width: '100%',
    outline: 'none',
    fontFamily: 'inherit',
  }
  const labelStyle = { color: 'var(--text-dim)', fontSize: '11px', marginBottom: '4px', display: 'block' }

  return (
    <div>
      <div className="mb-6">
        <div className="text-xs mb-1" style={{ color: 'var(--text-dim)' }}>~/support/templates/new</div>
        <h1 className="text-lg font-bold" style={{ color: 'var(--text-bright)' }}>
          <span style={{ color: 'var(--green)' }}>+ </span>新建 Prompt 模板
        </h1>
      </div>

      <div className="flex gap-6">
        {/* 左：表单 */}
        <div className="flex-1 space-y-4">
          <div className="terminal-card p-5 space-y-4">
            {/* 标题 + 分类 */}
            <div className="flex gap-3">
              <div className="flex-1">
                <label style={labelStyle}>模板名称 *</label>
                <input style={inputStyle} value={form.title} onChange={e => set('title', e.target.value)} placeholder="例：公司基本面摘要" />
              </div>
              <div className="w-36">
                <label style={labelStyle}>分类</label>
                <select style={inputStyle} value={form.category} onChange={e => set('category', e.target.value)}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* 角色设定 */}
            <div>
              <label style={labelStyle}>角色设定</label>
              <input style={inputStyle} value={form.roleText} onChange={e => set('roleText', e.target.value)}
                placeholder="你是一位专注于 {industry} 的资深分析师" />
            </div>

            {/* 任务模板 */}
            <div>
              <label style={labelStyle}>任务描述模板 * <span style={{ color: 'var(--text-dim)' }}>（用 {'{参数名}'} 标记占位符）</span></label>
              <textarea style={{ ...inputStyle, minHeight: '90px', resize: 'vertical' }}
                value={form.taskTemplate} onChange={e => set('taskTemplate', e.target.value)}
                placeholder={'基于以下材料，总结 {company_name} 近 {years} 年的营收和利润趋势'} />
            </div>

            {/* 输出格式 */}
            <div>
              <label style={labelStyle}>输出格式要求</label>
              <textarea style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }}
                value={form.formatText} onChange={e => set('formatText', e.target.value)}
                placeholder="请用表格呈现关键财务数据，并附 200 字以内的趋势解读" />
            </div>

            {/* 防护约束 */}
            <div>
              <label style={labelStyle}>防护性约束语句</label>
              <textarea style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                value={form.guardText} onChange={e => set('guardText', e.target.value)} />
            </div>
          </div>

          {/* 参数配置 */}
          <div className="terminal-card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold" style={{ color: 'var(--blue)' }}>参数列表</span>
              <button onClick={addParam}
                className="text-xs px-2 py-1 rounded"
                style={{ background: 'rgba(88,166,255,0.1)', color: 'var(--blue)', border: '1px solid rgba(88,166,255,0.2)' }}>
                + 添加参数
              </button>
            </div>
            {params.length === 0 && (
              <p className="text-xs" style={{ color: 'var(--text-dim)' }}>暂无参数。点击「添加参数」定义占位符，例如 company_name → 公司名称</p>
            )}
            <div className="space-y-2">
              {params.map((p, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input style={{ ...inputStyle, width: '120px' }} placeholder="参数名 (key)" value={p.key}
                    onChange={e => updateParam(i, 'key', e.target.value)} />
                  <input style={{ ...inputStyle, width: '100px' }} placeholder="显示标签" value={p.label}
                    onChange={e => updateParam(i, 'label', e.target.value)} />
                  <input style={{ ...inputStyle, flex: 1 }} placeholder="示例值" value={p.placeholder}
                    onChange={e => updateParam(i, 'placeholder', e.target.value)} />
                  <button onClick={() => removeParam(i)} style={{ color: 'var(--text-dim)', fontSize: '16px', lineHeight: 1 }}>×</button>
                </div>
              ))}
            </div>
          </div>

          <button onClick={save} disabled={saving || !form.title || !form.taskTemplate}
            className="w-full py-2.5 rounded text-sm font-medium"
            style={{ background: 'rgba(0,255,136,0.15)', color: 'var(--green)', border: '1px solid rgba(0,255,136,0.3)',
                     opacity: (!form.title || !form.taskTemplate) ? 0.4 : 1, cursor: (!form.title || !form.taskTemplate) ? 'not-allowed' : 'pointer' }}>
            {saving ? '保存中...' : '✓ 保存模板'}
          </button>
        </div>

        {/* 右：预览 */}
        <div className="w-80 shrink-0">
          <div className="sticky top-24 terminal-card p-4">
            <div className="text-xs mb-3 font-semibold" style={{ color: 'var(--blue)' }}>结构预览</div>
            <pre className="text-xs whitespace-pre-wrap leading-relaxed" style={{ color: 'var(--text-muted)', fontFamily: 'inherit' }}>
              {preview || '填写左侧字段后此处显示预览…'}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}
