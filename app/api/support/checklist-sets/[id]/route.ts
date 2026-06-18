import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const set = await prisma.checklistSet.findUnique({
    where: { id },
    include: {
      runs: { orderBy: { createdAt: 'desc' }, take: 10 },
      _count: { select: { runs: true } },
    },
  })
  if (!set) return NextResponse.json({ error: '未找到' }, { status: 404 })
  return NextResponse.json(set)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const { title, category, items } = body
  const updated = await prisma.checklistSet.update({
    where: { id },
    data: {
      ...(title !== undefined ? { title } : {}),
      ...(category !== undefined ? { category } : {}),
      ...(items !== undefined ? { items: JSON.stringify(items) } : {}),
    },
  })
  return NextResponse.json(updated)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.checklistSet.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
