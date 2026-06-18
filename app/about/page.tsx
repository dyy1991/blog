export default function AboutPage() {
  const skills = [
    { cat: 'Frontend', items: ['TypeScript', 'React', 'Next.js', 'Tailwind CSS'] },
    { cat: 'Backend',  items: ['Node.js', 'Python', 'REST API', 'PostgreSQL'] },
    { cat: 'DevOps',   items: ['Docker', 'GitHub Actions', 'CI/CD', 'Nginx'] },
    { cat: 'AI',       items: ['LLM Integration', 'Prompt Engineering', 'RAG', 'Agents'] },
  ]

  const siteInfo = [
    ['Framework',  'Next.js 15 + TypeScript'],
    ['Styling',    'Tailwind CSS v4'],
    ['Deployment', 'Alibaba Cloud ECS'],
    ['CI/CD',      'GitHub Actions + Docker'],
    ['Source',     'github.com/dyy1991/blog'],
  ]

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <div className="text-xs mb-2" style={{ color: 'var(--text-dim)' }}>~/about</div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-bright)' }}>
          <span style={{ color: 'var(--green)' }}>{'> '}</span>whoami
        </h1>
      </div>

      <div className="terminal-card mb-8 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2"
             style={{ background: 'var(--bg-hover)', borderBottom: '1px solid var(--border)' }}>
          <span className="w-3 h-3 rounded-full" style={{ background: '#ff5f57' }} />
          <span className="w-3 h-3 rounded-full" style={{ background: '#febc2e' }} />
          <span className="w-3 h-3 rounded-full" style={{ background: '#28c840' }} />
          <span className="text-xs ml-2" style={{ color: 'var(--text-dim)' }}>profile.json</span>
        </div>
        <div className="p-6 text-sm leading-7 font-mono">
          <div style={{ color: 'var(--text-dim)' }}>{'{'}</div>
          <div className="ml-4">
            <span style={{ color: 'var(--blue)' }}>&quot;name&quot;</span>
            <span style={{ color: 'var(--text-dim)' }}>: </span>
            <span style={{ color: 'var(--yellow)' }}>&quot;YYDeng&quot;</span>
            <span style={{ color: 'var(--text-dim)' }}>,</span>
          </div>
          <div className="ml-4">
            <span style={{ color: 'var(--blue)' }}>&quot;role&quot;</span>
            <span style={{ color: 'var(--text-dim)' }}>: </span>
            <span style={{ color: 'var(--yellow)' }}>&quot;Full-Stack Developer &amp; AI Builder&quot;</span>
            <span style={{ color: 'var(--text-dim)' }}>,</span>
          </div>
          <div className="ml-4">
            <span style={{ color: 'var(--blue)' }}>&quot;motto&quot;</span>
            <span style={{ color: 'var(--text-dim)' }}>: </span>
            <span style={{ color: 'var(--yellow)' }}>&quot;Build things. Break things. Learn things.&quot;</span>
          </div>
          <div style={{ color: 'var(--text-dim)' }}>{'}'}</div>
        </div>
      </div>

      <section className="mb-8">
        <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-bright)' }}>
          <span style={{ color: 'var(--green)' }}>{'# '}</span>skills
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {skills.map(group => (
            <div key={group.cat} className="terminal-card p-4">
              <div className="text-xs font-semibold mb-2" style={{ color: 'var(--blue)' }}>
                {group.cat}
              </div>
              <div className="flex flex-wrap gap-1">
                {group.items.map(item => (
                  <span key={item} className="text-xs px-2 py-0.5 rounded"
                        style={{ background: 'rgba(88,166,255,0.08)', color: 'var(--text)', border: '1px solid rgba(88,166,255,0.15)' }}>
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-bright)' }}>
          <span style={{ color: 'var(--green)' }}>{'# '}</span>this_site
        </h2>
        <div className="terminal-card p-4 text-xs space-y-2">
          {siteInfo.map(([k, v]) => (
            <div key={k} className="flex gap-3">
              <span style={{ color: 'var(--text-dim)', minWidth: '80px' }}>{k}</span>
              <span style={{ color: 'var(--green)' }}>{'>'}</span>
              <span style={{ color: 'var(--text-bright)' }}>{v}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
