'use client'

import { useEffect, useState, Suspense } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'

type Item = { id: string; text: string; required: boolean }
type Run = { id: string; createdAt: string; checkedItems: string; note: string }
type ChecklistSet = {
  id: string; title: string; category: string; items: string
  runs: Run[]; _count: { runs: number }
}

const CATEGORIES = ['材料分析', '财务核查', '竞对分析', '多步骤任务', 'general']

function ChecklistRunPageInner() {
  const { id } = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()
  const isEdit = searchParams.get('edit') === '1'

  const [set, setSet] = useState<ChecklistSet | null>(null)
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [note, setNote] = useState('')
  const [tempItems, setTempItems] = useState<Item[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Edit state
  const [editTitle, setEditTitle] = useState('')
  const [editCategory, setEditCategory] = useState('general')
  const [editItems, setEditItems] = useState<Item[]>([])

  useEffect(() => {
    fetch(`/api/support/checklist-sets/${id}`)
      .then(r => r.json())
      .then((data: ChecklistSet) => {
        setSet(data)
        if (isEdit) {
          setEditTitle(data.title)
          setEditCategory(data.category)
          setEditItems(JSON.parse(data.items || '[]'))
        }
      })
  }, [id, isEdit])

  const toggle = (itemId: string) =>
    setChecked(prev => ({ ...prev, [itemId]: !prev[itemId] }))

  const addTemp = () =>
    setTempItems(prev => [...prev, { id: 'tmp-' + Date.now(), text: '', required: false }])

  const saveRun = async () => {
    setSaving(true)
    const res = await fetch('/api/support/checklist-runs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checklistSetId: id, checkedItems: checked, note }),
    })
    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      // Refresh run list
      fetch(`/api/support/checklist-sets/${id}`).then(r => r.json()).then(setSet)
    }
    setSaving(false)
  }

  const saveEdit = async () => {
    setSaving(true)
    await fetch(`/api/support/checklist-sets/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: editTitle, category: editCategory, items: editItems }),
    })
    router.push('/support/checklist')
  }

  const deleteSet = async () => {
    if (!confirm('确认删除此清单及所有核查记录？')) return
    await fetch(`/api/support/checklist-sets/${id}`, { method: 'DELETE' })
    router.push('/support/checklist')
  }

  const inputStyle = {
    background: 'var(--bg)', border: '1px solid var(--border)',
    color: 'var(--text-bright)', borderRadius: '4px',
    padding: '8px 10px', fontSize: '13px', width: '100%',
    outline: 'none', fontFamily: 'inherit',
  }

  if (!set) return <div className="text-xs" style={{ color: 'var(--text-dim)' }}>加载中...</div>

  const items: Item[] = JSON.parse(set.items || '[]')
  const allItems = [...items, ...tempItems]
  const checkedCount = allItems.filter(i => checked[i.id]).length
  const requiredItems = allItems.filter(i => i.required)
  const requiredDone = requiredItems.every(i => checked[i.id])

  // ── Edit mode ──────────────────────────────────────────────────
  if (isEdit) {
    const updateItem = (id: string, k: keyof Item, v: string | boolean) =>
      setEditItems(prev => prev.map(i => i.id === id ? { ...i, [k]: v } : i))
    const addItem = () =>
      setEditItems(prev => [...prev, { id: Date.now().toString(), text: '', required: false }])
    const removeItem = (id: string) => setEditItems(prev => prev.filter(i => i.id !== id))

    return (
      <div className="max-w-2xl">
        <div className="mb-6">
          <div className="text-xs mb-1" style={{ color: 'var(--text-dim)' }}>编辑清单</div>
          <h1 className="text-lg font-bold" style={{ color: 'var(--text-bright)' }}>
            <span style={{ color: 'var(--blue)' }}>✎ </span>{set.title}
          </h1>
        </div>
        <div className="space-y-4">
          <div className="terminal-card p-5 space-y-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs mb-1" style={{ color: 'var(--text-dim)' }}>清单名称</label>
                <input style={inputStyle} value={editTitle} onChange={e => setEditTitle(e.target.value)} />
              </div>
              <div className="w-40">
                <label className="block text-xs mb-1" style={{ color: 'var(--text-dim)' }}>分类</label>
                <select style={inputStyle} value={editCategory} onChange={e => setEditCategory(e.target.value)}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div className="terminal-card p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold" style={{ color: 'var(--blue)' }}>核查项目</span>
              <button onClick={addItem} className="text-xs px-2 py-1 rounded"
                style={{ background: 'rgba(88,166,255,0.1)', color: 'var(--blue)', border: '1px solid rgba(88,166,255,0.2)' }}>
                + 添加
              </button>
            </div>
            <div className="space-y-2">
              {editItems.map((item, i) => (
                <div key={item.id} className="flex items-start gap-2">
                  <span className="text-xs mt-2.5 w-5 shrink-0 text-right" style={{ color: 'var(--text-dim)' }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <input style={{ ...inputStyle, flex: 1 }} value={item.text}
                    onChange={e => updateItem(item.id, 'text', e.target.value)} />
                  <label className="flex items-center gap-1 mt-2 shrink-0">
                    <input type="checkbox" checked={item.required}
                      onChange={e => updateItem(item.id, 'required', e.target.checked)} />
                    <span className="text-xs" style={{ color: 'var(--text-dim)' }}>必查</span>
                  </label>
                  <button onClick={() => removeItem(item.id)} style={{ color: 'var(--text-dim)', fontSize: '16px', marginTop: '4px' }}>×</button>
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={saveEdit} disabled={saving}
              className="flex-1 py-2.5 rounded text-sm font-medium"
              style={{ background: 'rgba(88,166,255,0.15)', color: 'var(--blue)', border: '1px solid rgba(88,166,255,0.3)' }}>
              {saving ? '保存中...' : '✓ 保存修改'}
            </button>
            <button onClick={deleteSet}
              className="px-4 py-2.5 rounded text-sm"
              style={{ background: 'rgba(255,80,80,0.08)', color: '#ff6b6b', border: '1px solid rgba(255,80,80,0.2)' }}>
              删除
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Run mode ───────────────────────────────────────────────────
  return (
    <div>
      <div className="mb-6">
        <div className="text-xs mb-1" style={{ color: 'var(--text-dim)' }}>~/support/checklist / 核查</div>
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold" style={{ color: 'var(--text-bright)' }}>
            <span style={{ color: 'var(--blue)' }}>{'[ ] '}</span>{set.title}
          </h1>
          <div className="text-xs px-2 py-1 rounded"
            style={{ background: checkedCount === allItems.length ? 'rgba(0,255,136,0.1)' : 'var(--bg-card)',
                     color: checkedCount === allItems.length ? 'var(--green)' : 'var(--text-dim)',
                     border: '1px solid ' + (checkedCount === allItems.length ? 'rgba(0,255,136,0.2)' : 'var(--border)') }}>
            {checkedCount} / {allItems.length}
          </div>
        </div>
      </div>

      <div className="flex gap-6">
        {/* 左：核查列表 */}
        <div className="flex-1">
          <div className="terminal-card p-4 space-y-1 mb-4">
            {allItems.map((item, i) => (
              <label key={item.id}
                className="flex items-start gap-3 px-3 py-2.5 rounded cursor-pointer transition-colors"
                style={{ background: checked[item.id] ? 'rgba(0,255,136,0.04)' : 'transparent' }}>
                <input type="checkbox" className="mt-0.5 shrink-0" checked={!!checked[item.id]}
                  onChange={() => toggle(item.id)} />
                <div className="flex-1">
                  <span className="text-xs mr-2" style={{ color: 'var(--text-dim)' }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="text-sm" style={{
                    color: checked[item.id] ? 'var(--text-dim)' : 'var(--text-bright)',
                    textDecoration: checked[item.id] ? 'line-through' : 'none',
                  }}>
                    {item.text || '（空项目）'}
                  </span>
                  {item.required && !checked[item.id] && (
                    <span className="ml-2 text-xs" style={{ color: 'var(--yellow)' }}>必查</span>
                  )}
                </div>
              </label>
            ))}

            {/* 临时添加项 */}
            {tempItems.length > 0 && tempItems.map(ti => (
              <div key={ti.id} className="flex items-center gap-2 px-3 py-2">
                <input type="checkbox" className="shrink-0" checked={!!checked[ti.id]}
                  onChange={() => toggle(ti.id)} />
                <input
                  className="flex-1 text-sm bg-transparent outline-none"
                  style={{ color: 'var(--text-bright)', borderBottom: '1px solid var(--border)' }}
                  placeholder="临时核查项…"
                  value={ti.text}
                  onChange={e => setTempItems(prev => prev.map(t => t.id === ti.id ? { ...t, text: e.target.value } : t))} />
              </div>
            ))}
          </div>

          <button onClick={addTemp}
            className="text-xs px-3 py-1.5 rounded mb-4"
            style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
            + 添加临时项目
          </button>

          <div className="terminal-card p-4 mb-4">
            <label className="block text-xs mb-2" style={{ color: 'var(--text-dim)' }}>核查备注</label>
            <textarea
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-bright)',
                borderRadius: '4px', padding: '8px 10px', fontSize: '13px', width: '100%',
                outline: 'none', fontFamily: 'inherit', minHeight: '80px', resize: 'vertical' as const }}
              placeholder="记录本次核查发现的问题，或给自己的备注…"
              value={note}
              onChange={e => setNote(e.target.value)} />
          </div>

          <button onClick={saveRun} disabled={saving || !requiredDone}
            className="w-full py-2.5 rounded text-sm font-medium"
            style={{
              background: saved ? 'rgba(0,255,136,0.25)' : 'rgba(88,166,255,0.15)',
              color: saved ? 'var(--green)' : 'var(--blue)',
              border: '1px solid ' + (saved ? 'rgba(0,255,136,0.3)' : 'rgba(88,166,255,0.3)'),
              opacity: !requiredDone ? 0.5 : 1,
              cursor: !requiredDone ? 'not-allowed' : 'pointer',
            }}>
            {saved ? '✓ 已保存核查记录' : saving ? '保存中...' : '保存核查记录'}
          </button>
          {!requiredDone && (
            <p className="text-xs mt-2 text-center" style={{ color: 'var(--text-dim)' }}>
              请先完成所有必查项
            </p>
          )}
        </div>

        {/* 右：历史记录 */}
        {set.runs.length > 0 && (
          <div className="w-60 shrink-0">
            <div className="sticky top-24">
              <div className="text-xs mb-3 font-semibold" style={{ color: 'var(--text-dim)' }}>历史核查</div>
              <div className="space-y-2">
                {set.runs.map(run => {
                  const runChecked: Record<string,boolean> = JSON.parse(run.checkedItems || '{}')
                  const doneCount = Object.values(runChecked).filter(Boolean).length
                  return (
                    <div key={run.id} className="terminal-card p-3 text-xs">
                      <div className="flex justify-between mb-1">
                        <span style={{ color: 'var(--text-bright)' }}>{doneCount}/{items.length} 项</span>
                        <span style={{ color: 'var(--text-dim)' }}>
                          {new Date(run.createdAt).toLocaleDateString('zh-CN')}
                        </span>
                      </div>
                      {run.note && (
                        <div className="truncate" style={{ color: 'var(--text-muted)' }}>{run.note}</div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ChecklistRunPage() { return <Suspense fallback={null}><ChecklistRunPageInner /></Suspense> }
