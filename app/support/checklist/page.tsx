import Link from 'next/link'
import { prisma } from '@/lib/prisma'

export default async function ChecklistPage() {
  const sets = await prisma.checklistSet.findMany({
    include: { _count: { select: { runs: true } } },
    orderBy: { updatedAt: 'desc' },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-xs mb-1" style={{ color: 'var(--text-dim)' }}>~/support/checklist</div>
          <h1 className="text-lg font-bold" style={{ color: 'var(--text-bright)' }}>
            <span style={{ color: 'var(--blue)' }}>{'[ ] '}</span>Checklist
            <span className="text-sm font-normal ml-2" style={{ color: 'var(--text-dim)' }}>
              [{sets.length} 份清单]
            </span>
          </h1>
        </div>
        <Link href="/support/checklist/new"
          className="text-xs px-3 py-1.5 rounded no-underline"
          style={{ background: 'rgba(88,166,255,0.1)', color: 'var(--blue)', border: '1px solid rgba(88,166,255,0.2)' }}>
          + 新建清单
        </Link>
      </div>

      {sets.length === 0 ? (
        <div className="terminal-card p-10 text-center" style={{ color: 'var(--text-dim)' }}>
          <p className="mb-3">暂无 Checklist</p>
          <Link href="/support/checklist/new" style={{ color: 'var(--blue)' }}>创建第一份清单 →</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {sets.map(s => {
            const items: {id:string,text:string,required:boolean}[] = JSON.parse(s.items || '[]')
            return (
              <div key={s.id} className="terminal-card p-4 flex items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-2 py-0.5 rounded"
                      style={{ background: 'rgba(88,166,255,0.08)', color: 'var(--blue)', border: '1px solid rgba(88,166,255,0.15)' }}>
                      {s.category}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--text-dim)' }}>{items.length} 项</span>
                  </div>
                  <div className="font-medium text-sm mb-1" style={{ color: 'var(--text-bright)' }}>{s.title}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {items.slice(0, 2).map(i => i.text).join(' · ')}{items.length > 2 ? ' …' : ''}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className="text-xs" style={{ color: 'var(--text-dim)' }}>已核查 {s._count.runs} 次</span>
                  <div className="flex gap-2">
                    <Link href={`/support/checklist/${s.id}`}
                      className="text-xs px-2 py-1 rounded no-underline"
                      style={{ background: 'rgba(88,166,255,0.1)', color: 'var(--blue)', border: '1px solid rgba(88,166,255,0.2)' }}>
                      开始核查
                    </Link>
                    <Link href={`/support/checklist/${s.id}?edit=1`}
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
