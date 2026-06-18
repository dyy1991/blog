export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import ImportExportBar from './ImportExportBar'

export default async function SupportDashboard() {
  const [templateCount, checklistCount, pitfallCount, caseCount, recentRuns] = await Promise.all([
    prisma.template.count(),
    prisma.checklistSet.count(),
    prisma.knowledgePitfall.count(),
    prisma.knowledgeCase.count(),
    prisma.checklistRun.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' },
      include: { checklistSet: { select: { title: true } } },
    }),
  ])

  const modules = [
    {
      href: '/support/templates',
      title: 'Prompt 模板库',
      desc: '填参数即生成完整 Prompt，一键复制',
      count: templateCount,
      unit: '个模板',
      color: 'var(--green)',
      icon: '{ }',
    },
    {
      href: '/support/checklist',
      title: 'Checklist',
      desc: '结构化核查清单，降低 AI 输出失误率',
      count: checklistCount,
      unit: '份清单',
      color: 'var(--blue)',
      icon: '[ ]',
    },
    {
      href: '/support/knowledge',
      title: '知识库',
      desc: `坑位记录 ${pitfallCount} 条 · 复用案例 ${caseCount} 条`,
      count: pitfallCount + caseCount,
      unit: '条记录',
      color: 'var(--cyan)',
      icon: '##',
    },
  ]

  return (
    <div>
      <div className="mb-8">
        <div className="text-xs mb-2" style={{ color: 'var(--text-dim)' }}>~/support</div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-bright)' }}>
          <span style={{ color: 'var(--green)' }}>{'> '}</span>分析师工作台
        </h1>
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
          Prompt 模板 · Checklist · 知识积累 — 本地工具，不接触业务数据
        </p>
      </div>

      {/* 模块卡片 */}
      <div className="grid gap-4 sm:grid-cols-3 mb-10">
        {modules.map(m => (
          <Link key={m.href} href={m.href} className="terminal-card block no-underline p-5 hover-green group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-base font-mono font-bold" style={{ color: m.color }}>{m.icon}</span>
              <span className="text-xs" style={{ color: 'var(--text-dim)' }}>{m.count} {m.unit}</span>
            </div>
            <div className="text-sm font-semibold mb-1" style={{ color: 'var(--text-bright)' }}>{m.title}</div>
            <div className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{m.desc}</div>
          </Link>
        ))}
      </div>

      {/* 快速入口 */}
      <section className="mb-10">
        <div className="text-xs mb-3 font-semibold" style={{ color: 'var(--text-bright)' }}>
          <span style={{ color: 'var(--green)' }}># </span>快速操作
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { href: '/support/templates/new',  label: '+ 新建模板' },
            { href: '/support/checklist/new',  label: '+ 新建 Checklist' },
            { href: '/support/knowledge/new',  label: '+ 记录坑位/案例' },
          ].map(a => (
            <Link key={a.href} href={a.href}
              className="text-xs px-3 py-1.5 rounded no-underline"
              style={{ background: 'rgba(0,255,136,0.08)', color: 'var(--green)', border: '1px solid rgba(0,255,136,0.2)' }}>
              {a.label}
            </Link>
          ))}
        </div>
        <ImportExportBar />
      </section>

      {/* 最近核查记录 */}
      {recentRuns.length > 0 && (
        <section>
          <div className="text-xs mb-3 font-semibold" style={{ color: 'var(--text-bright)' }}>
            <span style={{ color: 'var(--blue)' }}># </span>最近核查
          </div>
          <div className="space-y-2">
            {recentRuns.map(run => (
              <div key={run.id} className="terminal-card flex items-center justify-between px-4 py-3 text-xs">
                <span style={{ color: 'var(--text-bright)' }}>{run.checklistSet.title}</span>
                <span style={{ color: 'var(--text-dim)' }}>
                  {new Date(run.createdAt).toLocaleDateString('zh-CN')}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
