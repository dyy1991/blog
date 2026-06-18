import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const c = await prisma.knowledgeCase.findUnique({ where: { id } })
  if (!c) return NextResponse.json({ error: '未找到' }, { status: 404 })
  return NextResponse.json(c)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const updated = await prisma.knowledgeCase.update({
    where: { id },
    data: {
      ...(body.title !== undefined ? { title: body.title } : {}),
      ...(body.scenario !== undefined ? { scenario: body.scenario } : {}),
      ...(body.promptFullText !== undefined ? { promptFullText: body.promptFullText } : {}),
      ...(body.outputSummary !== undefined ? { outputSummary: body.outputSummary } : {}),
      ...(body.relatedTemplateId !== undefined ? { relatedTemplateId: body.relatedTemplateId } : {}),
      ...(body.tags !== undefined ? { tags: body.tags } : {}),
    },
  })
  return NextResponse.json(updated)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.knowledgeCase.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
