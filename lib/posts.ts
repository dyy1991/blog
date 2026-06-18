import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

export interface Post {
  slug: string
  title: string
  date: string
  category: string
  tags: string[]
  excerpt: string
  content: string
  readingTime: number
}

const postsDir = path.join(process.cwd(), 'content/posts')

function calcReadingTime(text: string): number {
  const words = text.trim().split(/\s+/).length
  return Math.max(1, Math.ceil(words / 200))
}

export function getAllPosts(): Post[] {
  if (!fs.existsSync(postsDir)) return []
  return fs.readdirSync(postsDir)
    .filter(f => f.endsWith('.md'))
    .map(fileName => {
      const slug = fileName.replace(/\.md$/, '')
      const raw = fs.readFileSync(path.join(postsDir, fileName), 'utf8')
      const { data, content } = matter(raw)
      return {
        slug,
        title: data.title ?? slug,
        date: data.date ?? '',
        category: data.category ?? 'uncategorized',
        tags: Array.isArray(data.tags) ? data.tags : [],
        excerpt: data.excerpt ?? content.replace(/#+\s[^\n]*/g, '').trim().slice(0, 120) + '...',
        content,
        readingTime: calcReadingTime(content),
      }
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export function getPostBySlug(slug: string): Post | null {
  try {
    const raw = fs.readFileSync(path.join(postsDir, `${slug}.md`), 'utf8')
    const { data, content } = matter(raw)
    return {
      slug,
      title: data.title ?? slug,
      date: data.date ?? '',
      category: data.category ?? 'uncategorized',
      tags: Array.isArray(data.tags) ? data.tags : [],
      excerpt: data.excerpt ?? content.slice(0, 120) + '...',
      content,
      readingTime: calcReadingTime(content),
    }
  } catch {
    return null
  }
}

export function getCategories(): string[] {
  return [...new Set(getAllPosts().map(p => p.category))]
}
