// Ported from novel-graph-agent src/planner/planner-types.ts
import type { Draft, ProjectState, ToolResult } from './story-types';

export interface PlannerPlanRequest {
  project: ProjectState;
  branchId: string;
  focus?: string;
}

export interface PlannerDraftRequest {
  project: ProjectState;
  branchId: string;
  kind: Draft['kind'];
  prompt?: string;
  /** 聚焦节点:写这个节点的正文,project.nodes 已裁剪为相关上下文 */
  focusNode?: { node_id: string; label: string; content: string; type: string };
}

export interface ModelJsonRequest {
  operation: 'plan' | 'write';
  system: string;
  user: string;
  response_shape: string;
}

export interface LanguageModelClient {
  completeJson(request: ModelJsonRequest): Promise<unknown>;
}

export interface PlannerAdapter {
  planNext(request: PlannerPlanRequest): Promise<ToolResult>;
  writeDraft(request: PlannerDraftRequest): Promise<ToolResult>;
}
