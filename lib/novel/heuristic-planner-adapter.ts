// Ported from novel-graph-agent src/planner/heuristic-planner-adapter.ts
import crypto from 'node:crypto';
import { DraftSchema, GraphDeltaSchema, ToolResultSchema, type Draft, type ProjectState, type ToolResult } from './story-types';
import type { PlannerAdapter, PlannerDraftRequest, PlannerPlanRequest } from './planner-types';

function nowIso(): string {
  return new Date().toISOString();
}

function stableId(prefix: string, ...parts: string[]): string {
  const digest = crypto.createHash('sha256');
  for (const part of parts) {
    digest.update(part);
    digest.update('\n');
  }
  return `${prefix}_${digest.digest('hex').slice(0, 12)}`;
}

function emptyDelta(summary: string) {
  return GraphDeltaSchema.parse({
    summary,
    nodes_added: [],
    nodes_updated: [],
    nodes_retired: [],
    edges_added: [],
    edges_updated: [],
    edges_retired: [],
    branches_added: [],
    revisions_created: []
  });
}

function contextText(project: ProjectState, branchId: string): string {
  return [
    project.premise,
    ...project.nodes
      .filter((node) => node.branch_scope === branchId || node.branch_scope === 'global')
      .map((node) => `${node.type} ${node.label}: ${node.content}`)
  ]
    .filter(Boolean)
    .join('\n');
}

function nextQuestion(project: ProjectState, branchId: string): string {
  const text = contextText(project, branchId);
  if (!/character|角色|人物|主角|protagonist/i.test(text)) {
    return '主角是谁，TA 在这个世界里最想改变什么？';
  }
  if (!/conflict|冲突|危机|阻碍|反派|enemy|villain/i.test(text)) {
    return '故事的核心冲突是什么，谁或什么在阻止主角？';
  }
  if (!/ending|结局|终局|代价|cost|sacrifice/i.test(text)) {
    return '这条主线最终要把主角推向什么选择或代价？';
  }
  return '现在可以选一个章节或场景，继续细化剧情和对白。';
}

function draftContent(project: ProjectState, request: PlannerDraftRequest): string {
  const context = project.nodes
    .filter((node) => node.branch_scope === request.branchId || node.branch_scope === 'global')
    .slice(0, 8)
    .map((node) => `- ${node.label}: ${node.content}`)
    .join('\n');

  return [
    project.premise ? `Premise: ${project.premise}` : `Project: ${project.title}`,
    request.focusNode
      ? `Focus: ${request.focusNode.label} (${request.focusNode.type})${request.focusNode.content ? `\n${request.focusNode.content}` : ''}`
      : undefined,
    context ? `Context:\n${context}` : 'Context: no confirmed nodes yet.',
    request.prompt ? `Writing request: ${request.prompt}` : undefined,
    request.kind === 'dialogue'
      ? 'Dialogue seed: let the characters reveal desire, friction, and withheld information through the exchange.'
      : 'Scene seed: open with a concrete disturbance, keep the viewpoint anchored, and end on a decision or reversal.'
  ]
    .filter(Boolean)
    .join('\n\n');
}

export class HeuristicPlannerAdapter implements PlannerAdapter {
  async planNext(request: PlannerPlanRequest): Promise<ToolResult> {
    const question = nextQuestion(request.project, request.branchId);
    const needsQuestion = !question.startsWith('现在可以');
    return ToolResultSchema.parse({
      project_id: request.project.project_id,
      branch_id: request.branchId,
      revision_id: request.project.current_revision_id,
      status: needsQuestion ? 'needs_question' : 'ok',
      summary: request.focus ? `Planning focus: ${request.focus}` : 'Planning next story step.',
      graph_delta: emptyDelta('Planning does not change the graph.'),
      next_question: question,
      draft: null,
      exports: {},
      warnings: []
    });
  }

  async writeDraft(request: PlannerDraftRequest): Promise<ToolResult> {
    const timestamp = nowIso();
    const draft: Draft = DraftSchema.parse({
      draft_id: stableId(
        'draft',
        request.project.project_id,
        request.branchId,
        request.kind,
        request.prompt ?? '',
        request.project.current_revision_id
      ),
      project_id: request.project.project_id,
      branch_id: request.branchId,
      revision_id: request.project.current_revision_id,
      kind: request.kind,
      title: request.focusNode
        ? `${request.focusNode.label} · ${request.kind === 'dialogue' ? '对白' : '场景'}`
        : request.prompt
          ? request.prompt.trim().slice(0, 60)
          : `${request.project.title} ${request.kind}`,
      content: draftContent(request.project, request),
      status: 'draft',
      created_at: timestamp,
      updated_at: timestamp
    });

    return ToolResultSchema.parse({
      project_id: request.project.project_id,
      branch_id: request.branchId,
      revision_id: request.project.current_revision_id,
      status: 'ok',
      summary: `Drafted ${request.kind}: ${draft.title}`,
      graph_delta: emptyDelta('Draft generation does not change the graph.'),
      next_question: null,
      draft,
      exports: {},
      warnings: []
    });
  }
}
