import { notFound } from 'next/navigation'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { getPostBySlug, getAllPosts } from '@/lib/posts'

export async function generateStaticParams() {
  return getAllPosts().map(p => ({ slug: p.slug }))
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) notFound()

  return (
    <article>
      {/* Breadcrumb */}
      <div className="text-xs mb-6" style={{ color: 'var(--text-dim)' }}>
        <Link href="/" style={{ color: 'var(--text-dim)' }} className="no-underline hover:underline">~</Link>
        {' / '}
        <Link href="/blog" style={{ color: 'var(--text-dim)' }} className="no-underline hover:underline">blog</Link>
        {' / '}
        <span style={{ color: 'var(--green)' }}>{slug}.md</span>
      </div>

      {/* Post header */}
      <header className="terminal-card p-6 mb-8">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="text-xs px-2 py-0.5 rounded"
                style={{ background: 'rgba(0,255,136,0.1)', color: 'var(--green)', border: '1px solid rgba(0,255,136,0.2)' }}>
            {post.category}
          </span>
          {post.tags.map(tag => (
            <span key={tag} className="text-xs" style={{ color: 'var(--text-dim)' }}>#{tag}</span>
          ))}
        </div>

        <h1 className="text-xl font-bold mb-3 leading-snug" style={{ color: 'var(--text-bright)' }}>
          {post.title}
        </h1>

        <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-dim)' }}>
          <span>📅 {post.date}</span>
          <span>⏱ {post.readingTime} min read</span>
        </div>
      </header>

      {/* Post content */}
      <div className="prose max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight]}
        >
          {post.content}
        </ReactMarkdown>
      </div>

      {/* Footer nav */}
      <div className="mt-12 pt-6 flex justify-between text-xs" style={{ borderTop: '1px solid var(--border)' }}>
        <Link href="/blog" className="no-underline transition-colors"
              style={{ color: 'var(--text-dim)' }}
              onMouseOver={e => (e.target as HTMLElement).style.color = 'var(--green)'}
              onMouseOut={e => (e.target as HTMLElement).style.color = 'var(--text-dim)'}>
          ← back to blog
        </Link>
        <Link href="/write" className="no-underline transition-colors"
              style={{ color: 'var(--text-dim)' }}
              onMouseOver={e => (e.target as HTMLElement).style.color = 'var(--green)'}
              onMouseOut={e => (e.target as HTMLElement).style.color = 'var(--text-dim)'}>
          write a post →
        </Link>
      </div>
    </article>
  )
}
