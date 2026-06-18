import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  const q = searchParams.get('q')

  const templates = await prisma.template.findMany({
    where: {
      ...(category ? { category } : {}),
      ...(q ? { title: { contains: q } } : {}),
    },
    orderBy: [{ usageCount: 'desc' }, { updatedAt: 'desc' }],
  })
  return NextResponse.json(templates)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { title, category, roleText, taskTemplate, formatText, guardText, params } = body
  if (!title || !taskTemplate) {
    return NextResponse.json({ error: '标题和任务模板为必填项' }, { status: 400 })
  }
  const template = await prisma.template.create({
    data: {
      title,
      category: category || 'general',
      roleText: roleText || '',
      taskTemplate,
      formatText: formatText || '',
      guardText: guardText || '',
      params: JSON.stringify(params || []),
    },
  })
  return NextResponse.json(template, { status: 201 })
}
