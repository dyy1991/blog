import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const sets = await prisma.checklistSet.findMany({
    include: { _count: { select: { runs: true } } },
    orderBy: { updatedAt: 'desc' },
  })
  return NextResponse.json(sets)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { title, category, items } = body
  if (!title) return NextResponse.json({ error: '标题为必填项' }, { status: 400 })
  const set = await prisma.checklistSet.create({
    data: {
      title,
      category: category || 'general',
      items: JSON.stringify(items || []),
    },
  })
  return NextResponse.json(set, { status: 201 })
}
