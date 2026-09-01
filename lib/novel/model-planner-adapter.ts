// Ported from novel-graph-agent src/planner/model-planner-adapter.ts
import { ToolResultSchema, type ToolResult } from './story-types';
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

function baseResult(
  project: PlannerPlanRequest['project'],
  branchId: string,
  output: unknown
): ToolResult {
  const candidate = output && typeof output === 'object' ? (output as Record<string, unknown>) : {};
  return ToolResultSchema.parse({
    project_id: project.project_id,
    branch_id: branchId,
    revision_id: project.current_revision_id,
    status: typeof candidate.status === 'string' ? candidate.status : 'ok',
    summary: typeof candidate.summary === 'string' ? candidate.summary : 'Model planner completed.',
    graph_delta: candidate.graph_delta ?? {
      summary: 'Model planner did not apply a graph mutation.',
      nodes_added: [],
      nodes_updated: [],
      nodes_retired: [],
      edges_added: [],
      edges_updated: [],
      edges_retired: [],
      branches_added: [],
      revisions_created: []
    },
    next_question: candidate.next_question ?? null,
    draft: candidate.draft ?? null,
    exports: candidate.exports ?? {},
    warnings: Array.isArray(candidate.warnings) ? candidate.warnings : []
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
        '{status, summary, graph_delta, next_question, draft, exports, warnings}; do not invent project_id, branch_id, or revision_id'
    };
    const output = await this.client.completeJson(modelRequest);
    return baseResult(request.project, request.branchId, output);
  }

  async writeDraft(request: PlannerDraftRequest): Promise<ToolResult> {
    const modelRequest: ModelJsonRequest = {
      operation: 'write',
      system: this.systemPrompt,
      user: [
        `Write a ${request.kind} draft grounded in the active branch.`,
        request.prompt ? `Prompt: ${request.prompt}` : undefined,
        `Project context: ${projectContext(request.project, request.branchId)}`
      ]
        .filter(Boolean)
        .join('\n\n'),
      response_shape:
        '{status, summary, graph_delta, next_question, draft, exports, warnings}; draft must be a structured Draft object'
    };
    const output = await this.client.completeJson(modelRequest);
    return baseResult(request.project, request.branchId, output);
  }
}
