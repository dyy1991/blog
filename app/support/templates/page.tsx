export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { prisma } from '@/lib/prisma'

export default async function TemplatesPage() {
  const templates = await prisma.template.findMany({
    orderBy: [{ usageCount: 'desc' }, { updatedAt: 'desc' }],
  })

  const categories = [...new Set(templates.map(t => t.category))]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-xs mb-1" style={{ color: 'var(--text-dim)' }}>~/support/templates</div>
          <h1 className="text-lg font-bold" style={{ color: 'var(--text-bright)' }}>
            <span style={{ color: 'var(--green)' }}>{'{ } '}</span>Prompt 模板库
            <span className="text-sm font-normal ml-2" style={{ color: 'var(--text-dim)' }}>
              [{templates.length} 个]
            </span>
          </h1>
        </div>
        <Link href="/support/templates/new"
          className="text-xs px-3 py-1.5 rounded no-underline"
          style={{ background: 'rgba(0,255,136,0.1)', color: 'var(--green)', border: '1px solid rgba(0,255,136,0.2)' }}>
          + 新建模板
        </Link>
      </div>

      {/* 分类标签 */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map(cat => (
            <span key={cat} className="text-xs px-2 py-1 rounded"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
              {cat}
            </span>
          ))}
        </div>
      )}

      {/* 模板列表 */}
      {templates.length === 0 ? (
        <div className="terminal-card p-10 text-center" style={{ color: 'var(--text-dim)' }}>
          <p className="mb-3">暂无模板</p>
          <Link href="/support/templates/new" style={{ color: 'var(--green)' }}>创建第一个模板 →</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {templates.map(t => {
            const params: {key:string, label:string}[] = JSON.parse(t.params || '[]')
            return (
              <div key={t.id} className="terminal-card p-4 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs px-2 py-0.5 rounded"
                      style={{ background: 'rgba(0,255,136,0.08)', color: 'var(--green)', border: '1px solid rgba(0,255,136,0.15)' }}>
                      {t.category}
                    </span>
                    {params.slice(0, 3).map(p => (
                      <span key={p.key} className="text-xs" style={{ color: 'var(--text-dim)' }}>
                        {'{' + p.label + '}'}
                      </span>
                    ))}
                  </div>
                  <div className="font-medium text-sm mb-1" style={{ color: 'var(--text-bright)' }}>{t.title}</div>
                  <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{t.taskTemplate}</div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className="text-xs" style={{ color: 'var(--text-dim)' }}>used {t.usageCount}x</span>
                  <div className="flex gap-2">
                    <Link href={`/support/templates/${t.id}`}
                      className="text-xs px-2 py-1 rounded no-underline"
                      style={{ background: 'rgba(0,255,136,0.1)', color: 'var(--green)', border: '1px solid rgba(0,255,136,0.2)' }}>
                      使用
                    </Link>
                    <Link href={`/support/templates/${t.id}?edit=1`}
                      className="text-xs px-2 py-1 rounded no-underline"
                      style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                      编辑
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
