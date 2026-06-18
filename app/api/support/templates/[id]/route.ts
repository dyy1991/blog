import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const template = await prisma.template.findUnique({ where: { id } })
  if (!template) return NextResponse.json({ error: '未找到' }, { status: 404 })
  return NextResponse.json(template)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const { title, category, roleText, taskTemplate, formatText, guardText, params: p, incrementUsage } = body

  if (incrementUsage) {
    const updated = await prisma.template.update({
      where: { id },
      data: { usageCount: { increment: 1 } },
    })
    return NextResponse.json(updated)
  }

  const updated = await prisma.template.update({
    where: { id },
    data: {
      ...(title !== undefined ? { title } : {}),
      ...(category !== undefined ? { category } : {}),
      ...(roleText !== undefined ? { roleText } : {}),
      ...(taskTemplate !== undefined ? { taskTemplate } : {}),
      ...(formatText !== undefined ? { formatText } : {}),
      ...(guardText !== undefined ? { guardText } : {}),
      ...(p !== undefined ? { params: JSON.stringify(p) } : {}),
    },
  })
  return NextResponse.json(updated)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.template.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
