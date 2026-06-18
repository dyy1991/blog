import type { Metadata } from 'next'
import Link from 'next/link'
import './globals.css'

export const metadata: Metadata = {
  title: 'YYDeng // Dev & Builder',
  description: 'Tech notes, project logs, AI exploration',
}

const navLinks = [
  { href: '/',        label: '~/home' },
  { href: '/blog',    label: '~/blog' },
  { href: '/write',   label: '~/write' },
  { href: '/support', label: '~/support' },
  { href: '/about',   label: '~/about' },
]

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className="h-full">
      <body className="min-h-full flex flex-col" style={{ background: 'var(--bg)', color: 'var(--text)' }}>

        <nav style={{ borderBottom: '1px solid var(--border)', background: 'rgba(8,13,20,0.95)' }}
             className="sticky top-0 z-50 backdrop-blur-sm">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 no-underline">
              <span style={{ color: 'var(--green)' }} className="font-bold text-base glow-green">
                {'> _'}
              </span>
              <span style={{ color: 'var(--text-bright)' }} className="font-semibold">YYDeng</span>
              <span style={{ color: 'var(--text-dim)' }} className="text-xs hidden sm:inline">
                {'// dev & builder'}
              </span>
            </Link>

            <div className="flex items-center gap-1">
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-3 py-1 rounded text-xs no-underline"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </nav>

        <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
          {children}
        </main>

        <footer style={{ borderTop: '1px solid var(--border)', color: 'var(--text-dim)' }}
                className="text-center py-4 text-xs">
          <span style={{ color: 'var(--green)' }}>{'>'}</span>
          {' Built with Next.js · GitHub Actions · '}
          {new Date().getFullYear()}
        </footer>

      </body>
    </html>
  )
}
