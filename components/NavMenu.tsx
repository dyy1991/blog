'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

const PRIMARY = [
  { href: '/',      label: '~/home' },
  { href: '/blog',  label: '~/blog' },
  { href: '/write', label: '~/write' },
]

const LAB = [
  { href: '/support',     label: 'support', desc: '支持台' },
  { href: '/checkinWall', label: 'checkin', desc: '打卡墙' },
  { href: '/novel',       label: 'novel',   desc: '小说工坊' },
]

const TAIL = [
  { href: '/about', label: '~/about' },
]

export default function NavMenu() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // 点击外部 / Esc 收起
  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  const labActive = LAB.some(l => isActive(l.href))

  return (
    <div className="flex items-center gap-1">
      {PRIMARY.map(link => (
        <Link key={link.href} href={link.href}
              className={`nav-link ${isActive(link.href) ? 'nav-link-active' : ''}`}>
          {link.label}
        </Link>
      ))}

      {/* ~/lab 下拉:support / checkin / novel */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setOpen(o => !o)}
          aria-expanded={open}
          aria-haspopup="menu"
          className={`nav-link ${labActive ? 'nav-link-active' : ''}`}
        >
          ~/lab <span className="nav-caret" style={{ transform: open ? 'rotate(180deg)' : 'none' }}>▾</span>
        </button>

        {open && (
          <div className="nav-dropdown" role="menu">
            {LAB.map(link => (
              <Link key={link.href} href={link.href} role="menuitem"
                    onClick={() => setOpen(false)}
                    className={`nav-dropdown-item ${isActive(link.href) ? 'nav-link-active' : ''}`}>
                <span style={{ color: 'var(--green)' }}>▸</span>
                <span>{link.label}</span>
                <span className="nav-dropdown-desc">{link.desc}</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {TAIL.map(link => (
        <Link key={link.href} href={link.href}
              className={`nav-link ${isActive(link.href) ? 'nav-link-active' : ''}`}>
          {link.label}
        </Link>
      ))}
    </div>
  )
}
