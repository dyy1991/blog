import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const setId = searchParams.get('setId')
  const runs = await prisma.checklistRun.findMany({
    where: setId ? { checklistSetId: setId } : {},
    include: { checklistSet: { select: { title: true } } },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })
  return NextResponse.json(runs)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { checklistSetId, checkedItems, note } = body
  if (!checklistSetId) return NextResponse.json({ error: 'checklistSetId 必填' }, { status: 400 })
  const run = await prisma.checklistRun.create({
    data: {
      checklistSetId,
      checkedItems: JSON.stringify(checkedItems || {}),
      note: note || '',
    },
  })
  return NextResponse.json(run, { status: 201 })
}
