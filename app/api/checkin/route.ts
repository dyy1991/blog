import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const data = await prisma.checkIn.findMany({ orderBy: { date: 'asc' } })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const { user, date, minutes, note } = await req.json()
  if (!user || !date || minutes === undefined) {
    return NextResponse.json({ error: '缺少必填项' }, { status: 400 })
  }
  const record = await prisma.checkIn.upsert({
    where: { user_date: { user, date } },
    create: { user, date, minutes: Number(minutes), note: note || '' },
    update: { minutes: Number(minutes), note: note || '' },
  })
  return NextResponse.json(record)
}
