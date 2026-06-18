import Link from 'next/link'

const NAV = [
  { href: '/support',            label: '概览',    icon: '▸' },
  { href: '/support/templates',  label: '模板库',  icon: '▸' },
  { href: '/support/checklist',  label: 'Checklist', icon: '▸' },
  { href: '/support/knowledge',  label: '知识库',  icon: '▸' },
]

export default function SupportLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-6 min-h-full">
      {/* 左侧边栏 */}
      <aside className="w-44 shrink-0">
        <div className="sticky top-24">
          <div className="text-xs mb-3 font-mono" style={{ color: 'var(--text-dim)' }}>
            ~/support
          </div>
          <nav className="space-y-1">
            {NAV.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 px-3 py-2 rounded text-xs no-underline hover-green transition-colors"
                style={{ color: 'var(--text-muted)', border: '1px solid transparent' }}
              >
                <span style={{ color: 'var(--green)' }}>{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>

          {/* 数据备份 */}
          <div className="mt-8 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
            <a
              href="/api/support/export"
              download
              className="flex items-center gap-2 px-3 py-2 rounded text-xs no-underline hover-green transition-colors"
              style={{ color: 'var(--text-dim)' }}
            >
              <span>↓</span> 导出备份
            </a>
          </div>
        </div>
      </aside>

      {/* 主内容区 */}
      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  )
}
