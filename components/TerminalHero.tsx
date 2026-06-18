'use client'

import { useState, useEffect } from 'react'

const LINES = [
  { prompt: true,  text: 'whoami' },
  { prompt: false, text: 'YYDeng  //  Full-Stack Developer & AI Builder' },
  { prompt: true,  text: 'ls ./skills' },
  { prompt: false, text: 'TypeScript   Docker   Next.js   CI/CD   AI Engineering' },
  { prompt: true,  text: 'cat motto.txt' },
  { prompt: false, text: '"Build things. Break things. Learn things."' },
]

export default function TerminalHero() {
  const [visibleLines, setVisibleLines] = useState(0)

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []
    LINES.forEach((_, i) => {
      timers.push(setTimeout(() => setVisibleLines(i + 1), i * 320))
    })
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <div className="terminal-card mb-10 overflow-hidden">
      {/* Terminal chrome */}
      <div className="flex items-center gap-2 px-4 py-2" style={{ background: 'var(--bg-hover)', borderBottom: '1px solid var(--border)' }}>
        <span className="w-3 h-3 rounded-full" style={{ background: '#ff5f57' }} />
        <span className="w-3 h-3 rounded-full" style={{ background: '#febc2e' }} />
        <span className="w-3 h-3 rounded-full" style={{ background: '#28c840' }} />
        <span className="ml-3 text-xs" style={{ color: 'var(--text-dim)' }}>~/terminal — zsh</span>
      </div>

      {/* Terminal body */}
      <div className="p-6 min-h-40">
        {LINES.slice(0, visibleLines).map((line, i) => (
          <div key={i} className="fade-in leading-7">
            {line.prompt ? (
              <span>
                <span style={{ color: 'var(--green)' }}>❯ </span>
                <span style={{ color: 'var(--text-bright)' }}>{line.text}</span>
              </span>
            ) : (
              <span style={{ color: 'var(--text-muted)' }} className="ml-4">{line.text}</span>
            )}
          </div>
        ))}
        {/* Blinking cursor on last line */}
        {visibleLines >= LINES.length && (
          <div className="leading-7">
            <span style={{ color: 'var(--green)' }}>❯ </span>
            <span style={{ color: 'var(--green)' }} className="cursor-blink">█</span>
          </div>
        )}
      </div>
    </div>
  )
}
