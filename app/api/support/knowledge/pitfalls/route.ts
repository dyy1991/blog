import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')
  const tag = searchParams.get('tag')
  const relatedTemplateId = searchParams.get('relatedTemplateId')

  const pitfalls = await prisma.knowledgePitfall.findMany({
    where: {
      ...(relatedTemplateId ? { relatedTemplateId } : {}),
      ...(q ? {
        OR: [
          { scenario: { contains: q } },
          { symptom: { contains: q } },
          { suggestion: { contains: q } },
        ],
      } : {}),
      ...(tag ? { tags: { contains: tag } } : {}),
    },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(pitfalls)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { scenario, symptom, triggerCondition, suggestion, tags, relatedTemplateId } = body
  if (!scenario || !symptom || !suggestion) {
    return NextResponse.json({ error: '场景、错误表现、应对建议为必填项' }, { status: 400 })
  }
  const pitfall = await prisma.knowledgePitfall.create({
    data: {
      scenario,
      symptom,
      triggerCondition: triggerCondition || '',
      suggestion,
      tags: tags || '',
      relatedTemplateId: relatedTemplateId || null,
    },
  })
  return NextResponse.json(pitfall, { status: 201 })
}
