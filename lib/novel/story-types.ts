// Ported from novel-graph-agent (D:\novel-graph-agent) src/core/story-types.ts
// 与 MCP 仓库保持同步:修改请先改 MCP 仓库再同步过来
import { z } from 'zod';

export const NodeStatusSchema = z.enum(['confirmed', 'provisional', 'disputed', 'retired']);
export const BranchStatusSchema = z.enum(['active', 'paused', 'retired']);
export const ToolStatusSchema = z.enum(['ok', 'needs_question', 'needs_review', 'error']);

export const SourceRefSchema = z.object({
  kind: z.string(),
  text: z.string().optional(),
  uri: z.string().optional(),
  line_start: z.number().int().nonnegative().optional(),
  line_end: z.number().int().nonnegative().optional()
}).strict();

export const NodeSchema = z.object({
  node_id: z.string(),
  type: z.string(),
  label: z.string(),
  content: z.string(),
  status: NodeStatusSchema,
  branch_scope: z.string(),
  source_refs: z.array(SourceRefSchema).default([]),
  tags: z.array(z.string()).default([]),
  created_at: z.string(),
  updated_at: z.string()
}).strict();

export const EdgeSchema = z.object({
  edge_id: z.string(),
  type: z.string(),
  from_node_id: z.string(),
  to_node_id: z.string(),
  label: z.string(),
  status: NodeStatusSchema,
  source_refs: z.array(SourceRefSchema).default([])
}).strict();

export const BranchSchema = z.object({
  branch_id: z.string(),
  name: z.string(),
  parent_branch_id: z.string().nullable(),
  head_revision_id: z.string(),
  status: BranchStatusSchema,
  purpose: z.string()
}).strict();

export const GraphDeltaSchema = z.object({
  summary: z.string(),
  nodes_added: z.array(z.string()).default([]),
  nodes_updated: z.array(z.string()).default([]),
  nodes_retired: z.array(z.string()).default([]),
  edges_added: z.array(z.string()).default([]),
  edges_updated: z.array(z.string()).default([]),
  edges_retired: z.array(z.string()).default([]),
  branches_added: z.array(z.string()).default([]),
  revisions_created: z.array(z.string()).default([])
}).strict();

export const RevisionSchema = z.object({
  revision_id: z.string(),
  parent_revision_id: z.string().nullable(),
  branch_id: z.string(),
  created_at: z.string(),
  created_by: z.enum(['user', 'system', 'import']),
  summary: z.string(),
  delta: GraphDeltaSchema
}).strict();

export const DraftSchema = z.object({
  draft_id: z.string(),
  project_id: z.string(),
  branch_id: z.string(),
  revision_id: z.string(),
  kind: z.enum(['outline', 'scene', 'dialogue', 'summary']),
  title: z.string(),
  content: z.string(),
  status: z.enum(['draft', 'accepted', 'rejected']).default('draft'),
  created_at: z.string(),
  updated_at: z.string()
}).strict();

export const ToolResultSchema = z.object({
  project_id: z.string(),
  branch_id: z.string(),
  revision_id: z.string(),
  status: ToolStatusSchema,
  summary: z.string(),
  graph_delta: GraphDeltaSchema,
  next_question: z.string().nullable().default(null),
  draft: DraftSchema.nullable().default(null),
  exports: z.record(z.string(), z.string()).default({}),
  warnings: z.array(z.string()).default([])
}).strict();

export const StoryGraphStateSchema = z.object({
  project_id: z.string(),
  title: z.string(),
  genre: z.string().optional(),
  premise: z.string().optional(),
  language: z.string(),
  active_branch_id: z.string(),
  current_revision_id: z.string(),
  branches: z.array(BranchSchema),
  revisions: z.array(RevisionSchema),
  nodes: z.array(NodeSchema),
  edges: z.array(EdgeSchema)
}).strict();

export type NodeStatus = z.infer<typeof NodeStatusSchema>;
export type BranchStatus = z.infer<typeof BranchStatusSchema>;
export type ToolStatus = z.infer<typeof ToolStatusSchema>;
export type SourceRef = z.infer<typeof SourceRefSchema>;
export type Node = z.infer<typeof NodeSchema>;
export type Edge = z.infer<typeof EdgeSchema>;
export type Branch = z.infer<typeof BranchSchema>;
export type GraphDelta = z.infer<typeof GraphDeltaSchema>;
export type Revision = z.infer<typeof RevisionSchema>;
export type Draft = z.infer<typeof DraftSchema>;
export type ToolResult = z.infer<typeof ToolResultSchema>;
export type ProjectState = z.infer<typeof StoryGraphStateSchema>;
