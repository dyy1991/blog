import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 一键导出全部数据为 JSON，作为备份手段
export async function GET() {
  const [templates, checklistSets, runs, pitfalls, cases] = await Promise.all([
    prisma.template.findMany(),
    prisma.checklistSet.findMany({ include: { runs: true } }),
    prisma.checklistRun.findMany(),
    prisma.knowledgePitfall.findMany(),
    prisma.knowledgeCase.findMany(),
  ])

  const data = {
    exportedAt: new Date().toISOString(),
    templates,
    checklistSets,
    checklistRuns: runs,
    knowledgePitfalls: pitfalls,
    knowledgeCases: cases,
  }

  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="support-backup-${new Date().toISOString().split('T')[0]}.json"`,
    },
  })
}
