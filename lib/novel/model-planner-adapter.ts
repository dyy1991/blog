// Ported from novel-graph-agent src/planner/model-planner-adapter.ts
import { DraftSchema, ToolResultSchema, type Draft, type ToolResult, type ToolStatus } from './story-types';
import type {
  LanguageModelClient,
  ModelJsonRequest,
  PlannerAdapter,
  PlannerDraftRequest,
  PlannerPlanRequest
} from './planner-types';

function projectContext(project: PlannerPlanRequest['project'], branchId: string): string {
  return JSON.stringify({
    project_id: project.project_id,
    title: project.title,
    genre: project.genre,
    premise: project.premise,
    branch_id: branchId,
    current_revision_id: project.current_revision_id,
    branches: project.branches,
    nodes: project.nodes.filter((node) => node.branch_scope === branchId || node.branch_scope === 'global'),
    edges: project.edges
  });
}

const TOOL_STATUSES: ToolStatus[] = ['ok', 'needs_question', 'needs_review', 'error'];
const DELTA_KEYS = [
  'nodes_added',
  'nodes_updated',
  'nodes_retired',
  'edges_added',
  'edges_updated',
  'edges_retired',
  'branches_added',
  'revisions_created'
] as const;

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

// 模型返回的 JSON 不保证符合 schema(可能多字段、缺字段、状态词自创),
// 这里做规范化,避免直接 zod.parse 抛错把整次调用打断。
function normalizeGraphDelta(value: unknown): { delta: Record<string, unknown>; ignoredProposals: boolean } {
  const record = value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
  const delta: Record<string, unknown> = {
    summary: typeof record.summary === 'string' ? record.summary : 'Model planner did not apply a graph mutation.'
  };
  for (const key of DELTA_KEYS) {
    delta[key] = stringArray(record[key]);
  }
  // 模型有时会塞入完整的 nodes/edges 对象数组;当前不自动写图,仅提示
  const ignoredProposals = Array.isArray(record.nodes) || Array.isArray(record.edges);
  return { delta, ignoredProposals };
}

function normalizeDraft(
  value: unknown,
  project: PlannerPlanRequest['project'],
  branchId: string,
  fallbackKind: Draft['kind']
): Draft | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  const record = value as Record<string, unknown>;
  const content =
    typeof record.content === 'string'
      ? record.content
      : typeof record.text === 'string'
        ? record.text
        : typeof record.body === 'string'
          ? record.body
          : '';
  if (!content.trim()) {
    return null;
  }
  const kind = record.kind;
  const timestamp = new Date().toISOString();
  return DraftSchema.parse({
    draft_id: typeof record.draft_id === 'string' ? record.draft_id : `draft_${Date.now().toString(36)}`,
    project_id: project.project_id,
    branch_id: branchId,
    revision_id: project.current_revision_id,
    kind: kind === 'outline' || kind === 'scene' || kind === 'dialogue' || kind === 'summary' ? kind : fallbackKind,
    title: typeof record.title === 'string' && record.title.trim() ? record.title : `${project.title} ${fallbackKind}`,
    content,
    status: 'draft',
    created_at: timestamp,
    updated_at: timestamp
  });
}

function stringRecord(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }
  const result: Record<string, string> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    if (typeof item === 'string') {
      result[key] = item;
    }
  }
  return result;
}

function baseResult(
  project: PlannerPlanRequest['project'],
  branchId: string,
  output: unknown,
  fallbackKind: Draft['kind'] = 'scene'
): ToolResult {
  const candidate = output && typeof output === 'object' && !Array.isArray(output) ? (output as Record<string, unknown>) : {};
  const { delta, ignoredProposals } = normalizeGraphDelta(candidate.graph_delta);
  const warnings = stringArray(candidate.warnings);
  if (ignoredProposals) {
    warnings.push('模型返回了节点/关系提案,当前版本未自动写入图谱,请按建议手动补充。');
  }

  const status = candidate.status;
  return ToolResultSchema.parse({
    project_id: project.project_id,
    branch_id: branchId,
    revision_id: project.current_revision_id,
    status: typeof status === 'string' && TOOL_STATUSES.includes(status as ToolStatus) ? status : 'ok',
    summary: typeof candidate.summary === 'string' ? candidate.summary : 'Model planner completed.',
    graph_delta: delta,
    next_question: typeof candidate.next_question === 'string' ? candidate.next_question : null,
    draft: normalizeDraft(candidate.draft, project, branchId, fallbackKind),
    exports: stringRecord(candidate.exports),
    warnings
  });
}

export interface ModelPlannerAdapterOptions {
  client: LanguageModelClient;
  systemPrompt?: string;
}

export class ModelPlannerAdapter implements PlannerAdapter {
  private readonly client: LanguageModelClient;
  private readonly systemPrompt: string;

  constructor(options: ModelPlannerAdapterOptions) {
    this.client = options.client;
    this.systemPrompt =
      options.systemPrompt ??
      'You are a novel planning assistant. Return only JSON matching the requested response shape. Keep graph changes separate from prose drafts.';
  }

  async planNext(request: PlannerPlanRequest): Promise<ToolResult> {
    const modelRequest: ModelJsonRequest = {
      operation: 'plan',
      system: this.systemPrompt,
      user: [
        'Choose the next useful planning step for this story.',
        request.focus ? `Focus: ${request.focus}` : undefined,
        `Project context: ${projectContext(request.project, request.branchId)}`
      ]
        .filter(Boolean)
        .join('\n\n'),
      response_shape:
        'Return JSON: {"status":"ok"|"needs_question","summary":"<一句话说明当前进度或建议>","next_question":"<给作者的下一个关键问题>","warnings":[]}. ' +
        '不要返回 project_id / branch_id / revision_id,不要在 graph_delta 里放节点对象。'
    };
    const output = await this.client.completeJson(modelRequest);
    return baseResult(request.project, request.branchId, output);
  }

  async writeDraft(request: PlannerDraftRequest): Promise<ToolResult> {
    const modelRequest: ModelJsonRequest = {
      operation: 'write',
      system: this.systemPrompt,
      user: [
        request.focusNode
          ? `为节点「${request.focusNode.label}」(${request.focusNode.type})撰写${request.kind === 'dialogue' ? '对白' : '场景'}正文。该节点的大纲:${request.focusNode.content || '(暂无)'}`
          : `Write a ${request.kind} draft grounded in the active branch.`,
        request.prompt ? `Prompt: ${request.prompt}` : undefined,
        `Project context: ${projectContext(request.project, request.branchId)}`
      ]
        .filter(Boolean)
        .join('\n\n'),
      response_shape:
        'Return JSON: {"status":"ok","summary":"<一句话说明>","next_question":null,"draft":{"kind":"' +
        request.kind +
        '","title":"<标题>","content":"<正文>"},"warnings":[]}. graph_delta 可省略。draft.content 必须是完整正文字符串。'
    };
    const output = await this.client.completeJson(modelRequest);
    return baseResult(request.project, request.branchId, output, request.kind);
  }
}
