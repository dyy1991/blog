import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

type Row = Record<string, unknown>

function filterNew(existing: { id: string }[], rows: Row[]): Row[] {
  const ids = new Set(existing.map(e => e.id))
  return rows.filter(r => !ids.has(r.id as string))
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { templates, checklistSets, checklistRuns, knowledgePitfalls, knowledgeCases } = body

    if (!templates && !checklistSets && !knowledgePitfalls && !knowledgeCases) {
      return NextResponse.json({ error: '无效的备份文件格式' }, { status: 400 })
    }

    const results = { templates: 0, checklistSets: 0, checklistRuns: 0, pitfalls: 0, cases: 0 }

    // 1. Templates
    if (Array.isArray(templates) && templates.length > 0) {
      const existing = await prisma.template.findMany({ select: { id: true } })
      const rows = filterNew(existing, templates as Row[])
      if (rows.length > 0) {
        const r = await prisma.template.createMany({
          data: rows.map(t => ({
            id: t.id as string,
            title: t.title as string,
            category: (t.category ?? 'general') as string,
            roleText: (t.roleText ?? '') as string,
            taskTemplate: (t.taskTemplate ?? '') as string,
            formatText: (t.formatText ?? '') as string,
            guardText: (t.guardText ?? '') as string,
            params: (t.params ?? '[]') as string,
            usageCount: (t.usageCount ?? 0) as number,
            createdAt: new Date(t.createdAt as string),
            updatedAt: new Date(t.updatedAt as string),
          })),
        })
        results.templates = r.count
      }
    }

    // 2. ChecklistSets
    if (Array.isArray(checklistSets) && checklistSets.length > 0) {
      const existing = await prisma.checklistSet.findMany({ select: { id: true } })
      const rows = filterNew(existing, checklistSets as Row[])
      if (rows.length > 0) {
        const r = await prisma.checklistSet.createMany({
          data: rows.map(s => ({
            id: s.id as string,
            title: s.title as string,
            category: (s.category ?? 'general') as string,
            items: (s.items ?? '[]') as string,
            relatedTemplateId: (s.relatedTemplateId ?? null) as string | null,
            createdAt: new Date(s.createdAt as string),
            updatedAt: new Date(s.updatedAt as string),
          })),
        })
        results.checklistSets = r.count
      }
    }

    // 3. ChecklistRuns
    if (Array.isArray(checklistRuns) && checklistRuns.length > 0) {
      const existing = await prisma.checklistRun.findMany({ select: { id: true } })
      const rows = filterNew(existing, checklistRuns as Row[])
      if (rows.length > 0) {
        const r = await prisma.checklistRun.createMany({
          data: rows.map(run => ({
            id: run.id as string,
            checklistSetId: run.checklistSetId as string,
            checkedItems: (run.checkedItems ?? '{}') as string,
            note: (run.note ?? '') as string,
            createdAt: new Date(run.createdAt as string),
          })),
        })
        results.checklistRuns = r.count
      }
    }

    // 4. KnowledgePitfalls
    if (Array.isArray(knowledgePitfalls) && knowledgePitfalls.length > 0) {
      const existing = await prisma.knowledgePitfall.findMany({ select: { id: true } })
      const rows = filterNew(existing, knowledgePitfalls as Row[])
      if (rows.length > 0) {
        const r = await prisma.knowledgePitfall.createMany({
          data: rows.map(p => ({
            id: p.id as string,
            scenario: p.scenario as string,
            symptom: p.symptom as string,
            triggerCondition: (p.triggerCondition ?? '') as string,
            suggestion: p.suggestion as string,
            tags: (p.tags ?? '') as string,
            relatedTemplateId: (p.relatedTemplateId ?? null) as string | null,
            createdAt: new Date(p.createdAt as string),
            updatedAt: new Date(p.updatedAt as string),
          })),
        })
        results.pitfalls = r.count
      }
    }

    // 5. KnowledgeCases
    if (Array.isArray(knowledgeCases) && knowledgeCases.length > 0) {
      const existing = await prisma.knowledgeCase.findMany({ select: { id: true } })
      const rows = filterNew(existing, knowledgeCases as Row[])
      if (rows.length > 0) {
        const r = await prisma.knowledgeCase.createMany({
          data: rows.map(c => ({
            id: c.id as string,
            title: c.title as string,
            scenario: c.scenario as string,
            promptFullText: (c.promptFullText ?? '') as string,
            outputSummary: (c.outputSummary ?? '') as string,
            relatedTemplateId: (c.relatedTemplateId ?? null) as string | null,
            tags: (c.tags ?? '') as string,
            createdAt: new Date(c.createdAt as string),
            updatedAt: new Date(c.updatedAt as string),
          })),
        })
        results.cases = r.count
      }
    }

    const total = Object.values(results).reduce((a, b) => a + b, 0)
    return NextResponse.json({ message: '导入成功', imported: results, total })
  } catch (e) {
    console.error('Import error:', e)
    return NextResponse.json({ error: '导入失败，请检查文件格式是否正确' }, { status: 500 })
  }
}
