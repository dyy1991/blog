'use client'

import { useRef, useState } from 'react'

export default function ImportExportBar() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    setResult(null)
    try {
      const text = await file.text()
      const json = JSON.parse(text)
      const res = await fetch('/api/support/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(json),
      })
      const data = await res.json()
      if (res.ok) {
        const { imported } = data
        setResult(
          `✅ 导入成功：模板 ${imported.templates} · 清单 ${imported.checklistSets} · 运行记录 ${imported.checklistRuns} · 坑位 ${imported.pitfalls} · 案例 ${imported.cases}`
        )
      } else {
        setResult(`❌ ${data.error ?? '导入失败'}`)
      }
    } catch {
      setResult('❌ 文件解析失败，请确认为有效的备份 JSON')
    } finally {
      setImporting(false)
      // reset so same file can be re-selected
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const btnBase = {
    fontSize: '12px', padding: '5px 12px', borderRadius: '4px',
    cursor: 'pointer', fontFamily: 'inherit',
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        {/* Export */}
        <a
          href="/api/support/export"
          style={{
            ...btnBase,
            background: 'rgba(0,255,136,0.08)',
            color: 'var(--green)',
            border: '1px solid rgba(0,255,136,0.2)',
            textDecoration: 'none',
            display: 'inline-block',
          }}
        >
          ↓ 导出备份
        </a>

        {/* Import trigger */}
        <button
          onClick={() => fileRef.current?.click()}
          disabled={importing}
          style={{
            ...btnBase,
            background: 'rgba(57,208,216,0.08)',
            color: 'var(--cyan)',
            border: '1px solid rgba(57,208,216,0.2)',
            opacity: importing ? 0.5 : 1,
          }}
        >
          {importing ? '导入中…' : '↑ 导入备份'}
        </button>

        {/* Hidden file input */}
        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          style={{ display: 'none' }}
          onChange={handleImport}
        />
      </div>

      {result && (
        <p className="mt-2 text-xs" style={{ color: result.startsWith('✅') ? 'var(--green)' : 'var(--red, #ff6b6b)' }}>
          {result}
        </p>
      )}
    </div>
  )
}
