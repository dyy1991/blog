import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const p = await prisma.knowledgePitfall.findUnique({ where: { id } })
  if (!p) return NextResponse.json({ error: '未找到' }, { status: 404 })
  return NextResponse.json(p)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const updated = await prisma.knowledgePitfall.update({
    where: { id },
    data: {
      ...(body.scenario !== undefined ? { scenario: body.scenario } : {}),
      ...(body.symptom !== undefined ? { symptom: body.symptom } : {}),
      ...(body.triggerCondition !== undefined ? { triggerCondition: body.triggerCondition } : {}),
      ...(body.suggestion !== undefined ? { suggestion: body.suggestion } : {}),
      ...(body.tags !== undefined ? { tags: body.tags } : {}),
      ...(body.relatedTemplateId !== undefined ? { relatedTemplateId: body.relatedTemplateId } : {}),
    },
  })
  return NextResponse.json(updated)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.knowledgePitfall.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
