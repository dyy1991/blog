import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')
  const tag = searchParams.get('tag')

  const cases = await prisma.knowledgeCase.findMany({
    where: {
      ...(q ? {
        OR: [
          { title: { contains: q } },
          { scenario: { contains: q } },
          { promptFullText: { contains: q } },
        ],
      } : {}),
      ...(tag ? { tags: { contains: tag } } : {}),
    },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(cases)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { title, scenario, promptFullText, outputSummary, relatedTemplateId, tags } = body
  if (!title || !scenario || !promptFullText) {
    return NextResponse.json({ error: '标题、场景、Prompt 全文为必填项' }, { status: 400 })
  }
  const c = await prisma.knowledgeCase.create({
    data: {
      title,
      scenario,
      promptFullText,
      outputSummary: outputSummary || '',
      relatedTemplateId: relatedTemplateId || null,
      tags: tags || '',
    },
  })
  return NextResponse.json(c, { status: 201 })
}
