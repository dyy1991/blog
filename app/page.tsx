import Link from 'next/link'
import { getAllPosts, getCategories } from '@/lib/posts'
import TerminalHero from '@/components/TerminalHero'

export default function Home() {
  const posts = getAllPosts().slice(0, 6)
  const categories = getCategories()
  const totalPosts = getAllPosts().length

  return (
    <div>
      {/* Hero */}
      <TerminalHero />

      {/* Stats bar */}
      <div className="flex gap-6 mb-10 text-xs" style={{ color: 'var(--text-dim)' }}>
        {[
          { label: 'posts',      value: totalPosts },
          { label: 'categories', value: categories.length },
          { label: 'status',     value: 'online' },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-2">
            <span style={{ color: 'var(--green)' }}>▸</span>
            <span style={{ color: 'var(--text-muted)' }}>{s.label}:</span>
            <span style={{ color: 'var(--text-bright)' }}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Recent posts */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-bright)' }}>
            <span style={{ color: 'var(--green)' }}># </span>recent_posts
          </h2>
          <Link href="/blog" className="text-xs no-underline hover-green"
                style={{ color: 'var(--text-dim)' }}>
            view all →
          </Link>
        </div>

        {posts.length === 0 ? (
          <div className="terminal-card p-8 text-center" style={{ color: 'var(--text-dim)' }}>
            <p>No posts yet. <Link href="/write" style={{ color: 'var(--green)' }}>Write one →</Link></p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map(post => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="terminal-card block no-underline p-5">
                {/* File path header */}
                <div className="text-xs mb-3 truncate" style={{ color: 'var(--text-dim)' }}>
                  ./posts/{post.slug}.md
                </div>

                {/* Category badge */}
                <span className="inline-block text-xs px-2 py-0.5 rounded mb-3"
                      style={{ background: 'rgba(0,255,136,0.1)', color: 'var(--green)', border: '1px solid rgba(0,255,136,0.2)' }}>
                  {post.category}
                </span>

                {/* Title */}
                <h3 className="text-sm font-semibold mb-2 leading-snug" style={{ color: 'var(--text-bright)' }}>
                  {post.title}
                </h3>

                {/* Excerpt */}
                <p className="text-xs leading-relaxed mb-4 line-clamp-2" style={{ color: 'var(--text-muted)' }}>
                  {post.excerpt}
                </p>

                {/* Meta */}
                <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-dim)' }}>
                  <span>{post.date}</span>
                  <span>{post.readingTime} min read</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="mt-12">
          <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-bright)' }}>
            <span style={{ color: 'var(--blue)' }}># </span>categories
          </h2>
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <Link key={cat} href={`/blog?cat=${cat}`}
                    className="text-xs px-3 py-1.5 rounded no-underline hover-blue"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                {cat}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
