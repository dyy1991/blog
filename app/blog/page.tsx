import Link from 'next/link'
import { getAllPosts, getCategories } from '@/lib/posts'

interface Props {
  searchParams: Promise<{ cat?: string }>
}

export default async function BlogPage({ searchParams }: Props) {
  const { cat } = await searchParams
  const allPosts = getAllPosts()
  const categories = getCategories()

  const filtered = cat ? allPosts.filter(p => p.category === cat) : allPosts

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="text-xs mb-2" style={{ color: 'var(--text-dim)' }}>
          ~/blog
        </div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-bright)' }}>
          <span style={{ color: 'var(--green)' }}>❯ </span>
          {cat ? cat : 'All Posts'}
          <span className="text-sm font-normal ml-2" style={{ color: 'var(--text-dim)' }}>
            [{filtered.length} files]
          </span>
        </h1>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-8">
        <Link href="/blog"
           className="text-xs px-3 py-1.5 rounded no-underline transition-colors"
           style={!cat
             ? { background: 'var(--bg-card)', border: '1px solid var(--green)', color: 'var(--green)' }
             : { background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
          all
        </Link>
        {categories.map(c => (
          <Link key={c} href={`/blog?cat=${c}`}
             className="text-xs px-3 py-1.5 rounded no-underline transition-colors"
             style={cat === c
               ? { background: 'var(--bg-card)', border: '1px solid var(--green)', color: 'var(--green)' }
               : { background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
            {c}
          </Link>
        ))}
      </div>

      {/* Post list */}
      <div className="space-y-3">
        {filtered.map((post, i) => (
          <Link key={post.slug} href={`/blog/${post.slug}`}
                className="terminal-card flex items-start gap-4 p-4 no-underline block">
            <span className="text-xs mt-0.5 w-6 text-right shrink-0" style={{ color: 'var(--text-dim)' }}>
              {String(i + 1).padStart(2, '0')}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-xs px-2 py-0.5 rounded"
                      style={{ background: 'rgba(0,255,136,0.08)', color: 'var(--green)', border: '1px solid rgba(0,255,136,0.15)' }}>
                  {post.category}
                </span>
                {post.tags.slice(0, 3).map(tag => (
                  <span key={tag} className="text-xs" style={{ color: 'var(--text-dim)' }}>#{tag}</span>
                ))}
              </div>
              <div className="font-medium text-sm truncate" style={{ color: 'var(--text-bright)' }}>
                {post.title}
              </div>
              <div className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
                {post.excerpt}
              </div>
            </div>
            <div className="text-xs text-right shrink-0" style={{ color: 'var(--text-dim)' }}>
              <div>{post.date}</div>
              <div>{post.readingTime}m</div>
            </div>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="terminal-card p-10 text-center" style={{ color: 'var(--text-dim)' }}>
          <p className="mb-2">No posts found.</p>
          <Link href="/write" style={{ color: 'var(--green)' }}>Write the first one →</Link>
        </div>
      )}
    </div>
  )
}
