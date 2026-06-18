import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // 已有数据则跳过
  const count = await prisma.template.count()
  if (count > 0) {
    console.log('种子数据已存在，跳过')
    return
  }

  // ── 示例模板：公司基本面摘要（来自设计文档附录） ──────────────
  await prisma.template.create({
    data: {
      title: '公司基本面摘要',
      category: '公司摘要',
      roleText: '你是一位专注于 {industry} 的资深分析师。',
      taskTemplate: '基于以下材料，总结 {company_name} 近 {years} 年的营收和利润趋势，并指出主要驱动因素。',
      formatText: '请用表格呈现关键财务数据，并附 200 字以内的趋势解读。',
      guardText: '仅基于本次提供的材料作答；每个关键数据请注明对应材料的章节或位置；若材料未提及，请直接说明「材料未提及」，不要使用先验知识推测或补全；若本对话此前提到过其他公司的材料，请不要混用其数据或结论。',
      params: JSON.stringify([
        { key: 'industry',     label: '行业',     placeholder: '例：消费品' },
        { key: 'company_name', label: '公司名称', placeholder: '例：某某股份' },
        { key: 'years',        label: '年数',     placeholder: '例：3' },
      ]),
    },
  })

  // ── 示例 Checklist：材料分析类通用核查（来自设计文档附录） ──
  await prisma.checklistSet.create({
    data: {
      title: '材料分析类通用核查清单',
      category: '材料分析',
      items: JSON.stringify([
        { id: '1', text: 'AI 对每个关键数据点标注了来源（材料章节/段落）', required: true },
        { id: '2', text: '未发现材料外推测的具体数值（疑似编造或借用先验知识）', required: true },
        { id: '3', text: '多公司/多材料场景下未出现结论雷同（跨材料混淆）', required: true },
        { id: '4', text: '表格数字与原始材料核对一致（含单位：万/亿、人民币/港币）', required: true },
        { id: '5', text: '结论未包含 AI 自行推测的市场传闻或背景知识', required: false },
        { id: '6', text: '多步骤任务中前后结论保持一致，无遗忘/跑偏', required: false },
      ]),
    },
  })

  console.log('✅ 种子数据写入完成')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
