import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { templates, checklistSets, checklistRuns, knowledgePitfalls, knowledgeCases } = body

    if (!templates && !checklistSets && !knowledgePitfalls && !knowledgeCases) {
      return NextResponse.json({ error: '无效的备份文件格式' }, { status: 400 })
    }

    const results = {
      templates: 0,
      checklistSets: 0,
      checklistRuns: 0,
      pitfalls: 0,
      cases: 0,
    }

    // 1. Templates
    if (Array.isArray(templates) && templates.length > 0) {
      const r = await prisma.template.createMany({
        data: templates.map((t: Record<string, unknown>) => ({
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
        skipDuplicates: true,
      })
      results.templates = r.count
    }

    // 2. ChecklistSets (strip embedded runs / _count before insert)
    if (Array.isArray(checklistSets) && checklistSets.length > 0) {
      const r = await prisma.checklistSet.createMany({
        data: checklistSets.map((s: Record<string, unknown>) => ({
          id: s.id as string,
          title: s.title as string,
          category: (s.category ?? 'general') as string,
          items: (s.items ?? '[]') as string,
          relatedTemplateId: (s.relatedTemplateId ?? null) as string | null,
          createdAt: new Date(s.createdAt as string),
          updatedAt: new Date(s.updatedAt as string),
        })),
        skipDuplicates: true,
      })
      results.checklistSets = r.count
    }

    // 3. ChecklistRuns — top-level list (not the embedded runs inside checklistSets)
    if (Array.isArray(checklistRuns) && checklistRuns.length > 0) {
      const r = await prisma.checklistRun.createMany({
        data: checklistRuns.map((r: Record<string, unknown>) => ({
          id: r.id as string,
          checklistSetId: r.checklistSetId as string,
          checkedItems: (r.checkedItems ?? '{}') as string,
          note: (r.note ?? '') as string,
          createdAt: new Date(r.createdAt as string),
        })),
        skipDuplicates: true,
      })
      results.checklistRuns = r.count
    }

    // 4. KnowledgePitfalls
    if (Array.isArray(knowledgePitfalls) && knowledgePitfalls.length > 0) {
      const r = await prisma.knowledgePitfall.createMany({
        data: knowledgePitfalls.map((p: Record<string, unknown>) => ({
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
        skipDuplicates: true,
      })
      results.pitfalls = r.count
    }

    // 5. KnowledgeCases
    if (Array.isArray(knowledgeCases) && knowledgeCases.length > 0) {
      const r = await prisma.knowledgeCase.createMany({
        data: knowledgeCases.map((c: Record<string, unknown>) => ({
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
        skipDuplicates: true,
      })
      results.cases = r.count
    }

    const total = Object.values(results).reduce((a, b) => a + b, 0)
    return NextResponse.json({ message: '导入成功', imported: results, total })
  } catch (e) {
    console.error('Import error:', e)
    return NextResponse.json({ error: '导入失败，请检查文件格式是否正确' }, { status: 500 })
  }
}
