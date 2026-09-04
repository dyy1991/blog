// 一致性检查:把图谱交给模型做审阅,返回结构化问题列表。
// 模型输出不可信,统一走规范化;模型不可用时给出明确提示而非静默失败。
import type { Edge, Node } from './story-types';
import type { LanguageModelClient } from './planner-types';

export type ReviewKind = 'worldbuilding' | 'loose_ends' | 'character' | 'timeline' | 'custom';

export interface ReviewFinding {
  severity: 'high' | 'medium' | 'low';
  title: string;
  detail: string;
  node_ids: string[];
  suggestion: string;
}

export interface ReviewResult {
  kind: ReviewKind;
  branch_id: string;
  compare_branch_id?: string;
  summary: string;
  findings: ReviewFinding[];
  warnings: string[];
}

export const REVIEW_PROMPTS: Record<Exclude<ReviewKind, 'custom'>, { name: string; instruction: string }> = {
  worldbuilding: {
    name: '世界观一致性',
    instruction:
      '检查是否存在与已确立的世界观设定、规则体系相矛盾的内容。重点看:新增剧情/场景是否违反了设定里的限制与代价;不同节点对同一设定的描述是否冲突。'
  },
  loose_ends: {
    name: '未闭合伏笔',
    instruction:
      '找出被提及却从未交代结果的线索:出现过但没有后续的物件/人物/悬念;顺序链(next)中断而剧情显然未完结的地方;提出了问题却没有任何节点回答的设定。'
  },
  character: {
    name: '角色行为一致性',
    instruction:
      '检查角色的行为是否符合其性格、动机与处境。重点看:某个场景里的选择是否与角色设定冲突;角色的能力/知识是否超出了他此时应该拥有的。'
  },
  timeline: {
    name: '时间线与因果',
    instruction:
      '检查事件的先后顺序与因果链是否自洽:是否有结果先于原因;顺序链上相邻节点之间是否缺少必要的过渡;是否存在同一时间点的矛盾事件。'
  }
};

/** 压缩图谱为模型可读的紧凑结构,避免把无关字段和长正文全塞进去 */
function compactGraph(nodes: Node[], edges: Edge[], maxContentChars = 400) {
  return {
    nodes: nodes.map((node) => ({
      id: node.node_id,
      type: node.type,
      label: node.label,
      status: node.status,
      content: node.content.slice(0, maxContentChars)
    })),
    edges: edges.map((edge) => ({
      type: edge.type,
      from: edge.from_node_id,
      to: edge.to_node_id,
      label: edge.label
    }))
  };
}

function asSeverity(value: unknown): ReviewFinding['severity'] {
  return value === 'high' || value === 'medium' || value === 'low' ? value : 'medium';
}

function normalizeFindings(value: unknown, validNodeIds: Set<string>): ReviewFinding[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const findings: ReviewFinding[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') continue;
    const record = item as Record<string, unknown>;
    const title = typeof record.title === 'string' ? record.title.trim() : '';
    const detail = typeof record.detail === 'string' ? record.detail.trim() : '';
    if (!title && !detail) continue;
    // 模型可能编造 node_id,只保留真实存在的
    const ids = Array.isArray(record.node_ids)
      ? record.node_ids.filter((id): id is string => typeof id === 'string' && validNodeIds.has(id))
      : [];
    findings.push({
      severity: asSeverity(record.severity),
      title: title || detail.slice(0, 30),
      detail,
      node_ids: ids,
      suggestion: typeof record.suggestion === 'string' ? record.suggestion.trim() : ''
    });
  }
  const rank = { high: 0, medium: 1, low: 2 };
  return findings.sort((left, right) => rank[left.severity] - rank[right.severity]);
}

export interface RunReviewInput {
  client: LanguageModelClient;
  kind: ReviewKind;
  question?: string;
  branchId: string;
  compareBranchId?: string;
  title: string;
  premise?: string;
  nodes: Node[];
  edges: Edge[];
  compareNodes?: Node[];
  compareEdges?: Edge[];
}

export async function runReview(input: RunReviewInput): Promise<ReviewResult> {
  const instruction =
    input.kind === 'custom'
      ? `回答作者的问题:${input.question ?? ''}`
      : REVIEW_PROMPTS[input.kind].instruction;

  const payload: Record<string, unknown> = {
    title: input.title,
    premise: input.premise,
    branch: input.branchId,
    graph: compactGraph(input.nodes, input.edges)
  };
  if (input.compareBranchId && input.compareNodes) {
    payload.compare_branch = input.compareBranchId;
    payload.compare_graph = compactGraph(input.compareNodes, input.compareEdges ?? []);
  }

  const output = await input.client.completeJson({
    operation: 'plan',
    system:
      '你是资深小说编辑,负责审阅故事设定的一致性。只返回 JSON,不要解释。' +
      '每条问题必须引用真实存在的节点 id(取自输入图谱的 nodes[].id),没有可引用节点时 node_ids 留空数组。' +
      '没有发现问题时 findings 返回空数组,不要编造。',
    user: [
      instruction,
      input.compareBranchId
        ? `注意:输入包含两个分支的图谱,请特别关注 branch(${input.branchId})与 compare_branch(${input.compareBranchId})之间的冲突。`
        : '',
      `故事图谱:${JSON.stringify(payload)}`
    ]
      .filter(Boolean)
      .join('\n\n'),
    response_shape:
      '{"summary":"<一句话总体结论>","findings":[{"severity":"high|medium|low","title":"<问题标题>","detail":"<具体说明>","node_ids":["<相关节点id>"],"suggestion":"<修改建议>"}]}'
  });

  const record = output && typeof output === 'object' ? (output as Record<string, unknown>) : {};
  const validIds = new Set([
    ...input.nodes.map((node) => node.node_id),
    ...(input.compareNodes ?? []).map((node) => node.node_id)
  ]);
  const findings = normalizeFindings(record.findings, validIds);

  return {
    kind: input.kind,
    branch_id: input.branchId,
    compare_branch_id: input.compareBranchId,
    summary:
      typeof record.summary === 'string' && record.summary.trim()
        ? record.summary.trim()
        : findings.length > 0
          ? `发现 ${findings.length} 处需要关注的问题。`
          : '未发现明显问题。',
    findings,
    warnings: []
  };
}
