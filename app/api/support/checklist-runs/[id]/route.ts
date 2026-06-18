import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const run = await prisma.checklistRun.findUnique({
    where: { id },
    include: { checklistSet: true },
  })
  if (!run) return NextResponse.json({ error: '未找到' }, { status: 404 })
  return NextResponse.json(run)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.checklistRun.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
