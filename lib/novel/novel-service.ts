// Ported from novel-graph-agent src/app/novel-service.ts
import crypto from 'node:crypto';
import { analyzeIntake } from './analysis';
import {
  exportCanonicalJson,
  exportMarkdownOutline,
  exportMermaidMindmap,
  exportOpml,
  importCanonicalJson,
  importOpml
} from './import-export';
import {
  ProjectRepository,
  branchChain,
  resolveNodesForBranch,
  type ProjectSummary,
  type RevisionComparison
} from './project-repository';
import {
  GraphDeltaSchema,
  ToolResultSchema,
  type Branch,
  type Draft,
  type GraphDelta,
  type Node,
  type ProjectState,
  type ToolResult
} from './story-types';
import { HeuristicPlannerAdapter } from './heuristic-planner-adapter';
import type { PlannerAdapter } from './planner-types';

export type ExportFormat = 'json' | 'opml' | 'markdown' | 'mermaid';
export type ImportFormat = 'json' | 'opml' | 'markdown';

export interface NovelServiceOptions {
  repository: ProjectRepository;
  planner?: PlannerAdapter;
}

export interface CreateProjectRequest {
  project_id: string;
  title: string;
  language: string;
  genre?: string;
  premise?: string;
}

export interface IngestRequest {
  project_id: string;
  branch_id?: string;
  input: {
    text: string;
    source_uri?: string;
  };
}

export interface PlanRequest {
  project_id: string;
  branch_id?: string;
  focus?: string;
}

export interface ResolveRequest {
  project_id: string;
  branch_id?: string;
  issue: string;
  decision?: string;
}

export interface CreateBranchRequest {
  project_id: string;
  branch_id: string;
  name: string;
  purpose: string;
  parent_revision_id?: string | null;
}

export interface WriteDraftRequest {
  project_id: string;
  branch_id?: string;
  kind: Draft['kind'];
  prompt?: string;
}

export interface ImportStoryRequest {
  project_id?: string;
  format: ImportFormat;
  content: string;
}

export interface ExportStoryRequest {
  project_id: string;
  format: ExportFormat;
}

export interface GraphProjection {
  branches: Branch[];
  nodes: Node[];
  edges: ProjectState['edges'];
  /** 当前分支的祖先链 [自身, 父, ...],用于展示分叉来源 */
  branch_chain: string[];
  /** 在当前分支被覆写(写时复制)的节点 id */
  overridden_node_ids: string[];
}

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

function emptyDelta(summary: string, partial?: Partial<GraphDelta>): GraphDelta {
  return GraphDeltaSchema.parse({
    summary,
    nodes_added: [],
    nodes_updated: [],
    nodes_retired: [],
    edges_added: [],
    edges_updated: [],
    edges_retired: [],
    branches_added: [],
    revisions_created: [],
    ...partial
  });
}

function toolResult(input: {
  projectId: string;
  branchId: string;
  revisionId: string;
  status?: ToolResult['status'];
  summary: string;
  graphDelta?: GraphDelta;
  nextQuestion?: string | null;
  draft?: Draft | null;
  exports?: Record<string, string>;
  warnings?: string[];
}): ToolResult {
  return ToolResultSchema.parse({
    project_id: input.projectId,
    branch_id: input.branchId,
    revision_id: input.revisionId,
    status: input.status ?? 'ok',
    summary: input.summary,
    graph_delta: input.graphDelta ?? emptyDelta(input.summary),
    next_question: input.nextQuestion ?? null,
    draft: input.draft ?? null,
    exports: input.exports ?? {},
    warnings: input.warnings ?? []
  });
}

function labelFromText(text: string): string {
  const firstLine = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean) ?? 'Untitled intake';
  const withoutMarkdown = firstLine.replace(/^#{1,6}\s+/, '').replace(/^(?:[-*+]\s+|\d+[.)]\s+)/, '');
  return withoutMarkdown.length > 60 ? `${withoutMarkdown.slice(0, 57)}...` : withoutMarkdown;
}

function inferNodeType(text: string): string {
  if (/角色|人物|主角|配角|character|protagonist|hero|villain/i.test(text)) {
    return 'character';
  }
  if (/人物关系|关系网|盟友|敌人|relationship|relation|ally|enemy/i.test(text)) {
    return 'relationship';
  }
  if (/主线|剧情|冲突|目标|plot|conflict|goal|arc/i.test(text)) {
    return 'plot';
  }
  if (/分支|支线|if|branch|alternate/i.test(text)) {
    return 'branch_note';
  }
  if (/章节|章|chapter|act/i.test(text)) {
    return 'chapter';
  }
  if (/场景|地点|scene|location/i.test(text)) {
    return 'scene';
  }
  if (/世界观|设定|背景|城市|王国|世界|world|setting|kingdom|city|planet|harbor/i.test(text)) {
    return 'worldbuilding';
  }
  return 'intake';
}

interface IntakeSection {
  title: string
  body: string
  bullets: string[]
}

// 把长文本按 Markdown 标题 / 空行段落 / 列表切成若干片段,
// 每个片段成为一个图谱节点(标题片段为父节点,其下条目为子节点)。
function splitIntakeSections(text: string): IntakeSection[] {
  const lines = text.split(/\r?\n/);
  const sections: IntakeSection[] = [];
  let current: IntakeSection | null = null;
  let looseParagraph: string[] = [];

  const flushLoose = () => {
    const body = looseParagraph.join('\n').trim();
    looseParagraph = [];
    if (!body) return;
    if (current) {
      current.body = current.body ? `${current.body}\n${body}` : body;
    } else {
      sections.push({ title: labelFromText(body), body, bullets: [] });
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      flushLoose();
      current = { title: heading[2].trim(), body: '', bullets: [] };
      sections.push(current);
      continue;
    }

    const bullet = line.match(/^(?:[-*+]\s+|\d+[.)]\s+)(.+)$/);
    if (bullet) {
      flushLoose();
      const item = bullet[1].trim();
      if (current) {
        current.bullets.push(item);
      } else {
        sections.push({ title: labelFromText(item), body: item, bullets: [] });
      }
      continue;
    }

    if (!line) {
      flushLoose();
      continue;
    }

    // 「标签：内容」单独成节,如「世界观：...」
    const labelled = line.match(
      /^(世界观|设定|背景|角色|人物|主线|剧情|分支|章节|场景|冲突|目标|主题|人物关系|关系网)\s*[：:]\s*(.+)$/
    );
    if (labelled) {
      flushLoose();
      current = { title: labelled[1], body: labelled[2].trim(), bullets: [] };
      sections.push(current);
      continue;
    }

    looseParagraph.push(line);
  }
  flushLoose();

  return sections.filter((section) => section.title || section.body || section.bullets.length > 0);
}

function buildIntakeNode(projectId: string, branchId: string, text: string, sourceUri?: string): Node {
  const timestamp = nowIso();
  return {
    node_id: stableId('node', projectId, branchId, text),
    type: inferNodeType(text),
    label: labelFromText(text),
    content: text,
    status: 'provisional',
    branch_scope: branchId,
    source_refs: [
      {
        kind: 'input',
        text,
        uri: sourceUri
      }
    ].filter((source) => source.text || source.uri),
    tags: ['intake'],
    created_at: timestamp,
    updated_at: timestamp
  };
}

function parseMarkdownProject(content: string, projectId?: string): ProjectState {
  const timestamp = nowIso();
  const title = content.match(/^#\s+(.+)$/m)?.[1]?.trim() || projectId || 'Imported project';
  const id = projectId || stableId('project', title).replace(/^project_/, 'project-');
  const revisionId = stableId('rev', id, content);
  const node: Node = {
    node_id: stableId('node', id, 'main', content),
    type: 'outline',
    label: title,
    content,
    status: 'provisional',
    branch_scope: 'main',
    source_refs: [{ kind: 'import', text: content }],
    tags: ['imported', 'markdown'],
    created_at: timestamp,
    updated_at: timestamp
  };

  return {
    project_id: id,
    title,
    language: 'zh-CN',
    active_branch_id: 'main',
    current_revision_id: revisionId,
    branches: [
      {
        branch_id: 'main',
        name: 'main',
        parent_branch_id: null,
        head_revision_id: revisionId,
        status: 'active',
        purpose: 'imported markdown outline'
      }
    ],
    revisions: [
      {
        revision_id: revisionId,
        parent_revision_id: null,
        branch_id: 'main',
        created_at: timestamp,
        created_by: 'import',
        summary: 'Imported from Markdown',
        delta: emptyDelta('Imported from Markdown', {
          nodes_added: [node.node_id],
          branches_added: ['main'],
          revisions_created: [revisionId]
        })
      }
    ],
    nodes: [node],
    edges: [],
    drafts: []
  };
}

function projectForBranch(state: ProjectState, branchId: string): ProjectState {
  const branch = state.branches.find((item) => item.branch_id === branchId);
  if (!branch) {
    throw new Error(`Branch not found: ${branchId}`);
  }
  // planner 按 branch_scope 过滤,这里把继承来的节点重贴到当前分支(只读投影)
  const { nodes } = resolveNodesForBranch(state, branchId);
  return {
    ...state,
    active_branch_id: branch.branch_id,
    current_revision_id: branch.head_revision_id,
    nodes: nodes.map((node) => (node.branch_scope === branchId ? node : { ...node, branch_scope: branchId }))
  };
}

export class NovelService {
  private readonly repository: ProjectRepository;
  private readonly planner: PlannerAdapter;

  constructor(options: NovelServiceOptions) {
    this.repository = options.repository;
    this.planner = options.planner ?? new HeuristicPlannerAdapter();
  }

  async createProject(input: CreateProjectRequest): Promise<ToolResult> {
    const state = await this.repository.createProject({
      projectId: input.project_id,
      title: input.title,
      language: input.language,
      genre: input.genre,
      premise: input.premise
    });
    return toolResult({
      projectId: state.project_id,
      branchId: state.active_branch_id,
      revisionId: state.current_revision_id,
      summary: `Created project ${state.title}.`,
      graphDelta: state.revisions.at(-1)?.delta
    });
  }

  async listProjects(): Promise<ProjectSummary[]> {
    return this.repository.listProjects();
  }

  async getProject(projectId: string): Promise<ProjectState> {
    return this.repository.getProject(projectId);
  }

  async ingest(input: IngestRequest): Promise<ToolResult> {
    const state = await this.repository.getProject(input.project_id);
    const branchId = input.branch_id ?? state.active_branch_id;
    const analysis = analyzeIntake({
      projectId: input.project_id,
      branchId,
      text: input.input.text
    });
    const text = input.input.text.trim();
    const sections = splitIntakeSections(text);
    const timestamp = nowIso();
    const nodes: Node[] = [];
    const edges: ProjectState['edges'] = [];

    // 单一片段(短输入)沿用原逻辑:整段一个节点
    if (sections.length <= 1) {
      nodes.push(buildIntakeNode(input.project_id, branchId, text, input.input.source_uri));
    } else {
      for (const section of sections) {
        const sectionText = [section.title, section.body].filter(Boolean).join('\n');
        const parent: Node = {
          node_id: stableId('node', input.project_id, branchId, section.title, section.body),
          type: inferNodeType(sectionText),
          label: section.title || labelFromText(section.body),
          content: section.body || section.title,
          status: 'provisional',
          branch_scope: branchId,
          source_refs: input.input.source_uri ? [{ kind: 'input', uri: input.input.source_uri }] : [],
          tags: ['intake'],
          created_at: timestamp,
          updated_at: timestamp
        };
        nodes.push(parent);

        for (const bullet of section.bullets) {
          const child: Node = {
            node_id: stableId('node', input.project_id, branchId, section.title, bullet),
            type: inferNodeType(`${section.title} ${bullet}`),
            label: labelFromText(bullet),
            content: bullet,
            status: 'provisional',
            branch_scope: branchId,
            source_refs: [],
            tags: ['intake'],
            created_at: timestamp,
            updated_at: timestamp
          };
          nodes.push(child);
          edges.push({
            edge_id: stableId('edge', parent.node_id, child.node_id),
            type: 'contains',
            from_node_id: parent.node_id,
            to_node_id: child.node_id,
            label: '',
            status: 'provisional',
            source_refs: []
          });
        }
      }
    }

    const saved = await this.repository.upsertNodesAndEdges(input.project_id, {
      branchId,
      summary:
        nodes.length > 1
          ? `Ingest intake: ${nodes.length} 个节点(${sections.length} 个片段)`
          : `Ingest intake: ${nodes[0].label}`,
      createdBy: 'user',
      nodes,
      edges
    });
    return ToolResultSchema.parse({
      ...analysis,
      revision_id: saved.revision.revision_id,
      summary:
        nodes.length > 1
          ? `已解析为 ${nodes.length} 个节点(${sections.length} 个片段)。${analysis.summary}`
          : analysis.summary,
      graph_delta: saved.revision.delta
    });
  }

  async plan(input: PlanRequest): Promise<ToolResult> {
    const state = await this.repository.getProject(input.project_id);
    const branchId = input.branch_id ?? state.active_branch_id;
    return this.planner.planNext({
      project: projectForBranch(state, branchId),
      branchId,
      focus: input.focus
    });
  }

  async resolve(input: ResolveRequest): Promise<ToolResult> {
    const state = await this.repository.getProject(input.project_id);
    const branchId = input.branch_id ?? state.active_branch_id;
    if (!input.decision) {
      return toolResult({
        projectId: state.project_id,
        branchId,
        revisionId: state.current_revision_id,
        status: 'needs_question',
        summary: `Resolution needed: ${input.issue}`,
        nextQuestion: '这个冲突最终以哪条事实为准？',
        warnings: ['No decision was supplied, so the graph was not changed.']
      });
    }

    const saved = await this.repository.upsertNodesAndEdges(input.project_id, {
      branchId,
      summary: `Resolve issue: ${input.issue}`,
      createdBy: 'user'
    });
    return toolResult({
      projectId: state.project_id,
      branchId,
      revisionId: saved.revision.revision_id,
      summary: `Resolved: ${input.decision}`,
      graphDelta: saved.revision.delta
    });
  }

  async createBranch(input: CreateBranchRequest): Promise<{ result: ToolResult; branch: Branch }> {
    const branch = await this.repository.createBranch(input.project_id, {
      branchId: input.branch_id,
      name: input.name,
      purpose: input.purpose,
      parentRevisionId: input.parent_revision_id
    });
    return {
      result: toolResult({
        projectId: input.project_id,
        branchId: branch.branch_id,
        revisionId: branch.head_revision_id,
        summary: `Created branch ${branch.name}.`,
        graphDelta: emptyDelta(`Created branch ${branch.name}.`, {
          branches_added: [branch.branch_id]
        })
      }),
      branch
    };
  }

  async switchBranch(projectId: string, branchId: string): Promise<ToolResult> {
    const state = await this.repository.switchBranch(projectId, branchId);
    return toolResult({
      projectId: state.project_id,
      branchId: state.active_branch_id,
      revisionId: state.current_revision_id,
      summary: `Switched to branch ${state.active_branch_id}.`
    });
  }

  async listBranches(projectId: string): Promise<{ project_id: string; branch_id: string; revision_id: string; status: 'ok'; summary: string; branches: Branch[] }> {
    const state = await this.repository.getProject(projectId);
    return {
      project_id: state.project_id,
      branch_id: state.active_branch_id,
      revision_id: state.current_revision_id,
      status: 'ok',
      summary: `Listed ${state.branches.length} branch(es).`,
      branches: state.branches
    };
  }

  async writeDraft(input: WriteDraftRequest): Promise<ToolResult> {
    const state = await this.repository.getProject(input.project_id);
    const branchId = input.branch_id ?? state.active_branch_id;
    const result = await this.planner.writeDraft({
      project: projectForBranch(state, branchId),
      branchId,
      kind: input.kind,
      prompt: input.prompt
    });
    // 生成即持久化,避免刷新丢失
    if (result.draft) {
      await this.repository.saveDraft(input.project_id, result.draft);
    }
    return result;
  }

  async listDrafts(projectId: string, branchId?: string): Promise<{ project_id: string; branch_id: string; drafts: Draft[] }> {
    const state = await this.repository.getProject(projectId);
    const targetBranch = branchId ?? state.active_branch_id;
    return {
      project_id: projectId,
      branch_id: targetBranch,
      drafts: await this.repository.listDrafts(projectId, targetBranch)
    };
  }

  /** 采纳草稿:标记为 accepted,并把内容落成图谱节点 */
  async acceptDraft(projectId: string, draftId: string): Promise<ToolResult> {
    const draft = await this.repository.setDraftStatus(projectId, draftId, 'accepted');
    const timestamp = nowIso();
    const node: Node = {
      node_id: stableId('node', projectId, draft.branch_id, draft.draft_id),
      type: draft.kind === 'outline' || draft.kind === 'summary' ? 'outline' : 'scene',
      label: draft.title,
      content: draft.content,
      status: 'provisional',
      branch_scope: draft.branch_id,
      source_refs: [{ kind: 'draft', text: draft.draft_id }],
      tags: ['draft', draft.kind],
      created_at: timestamp,
      updated_at: timestamp
    };
    const saved = await this.repository.upsertNodesAndEdges(projectId, {
      branchId: draft.branch_id,
      summary: `Accept draft: ${draft.title}`,
      createdBy: 'user',
      nodes: [node]
    });
    return toolResult({
      projectId,
      branchId: draft.branch_id,
      revisionId: saved.revision.revision_id,
      summary: `已采纳草稿「${draft.title}」并写入图谱。`,
      graphDelta: saved.revision.delta,
      draft
    });
  }

  async rejectDraft(projectId: string, draftId: string): Promise<ToolResult> {
    const draft = await this.repository.setDraftStatus(projectId, draftId, 'rejected');
    const state = await this.repository.getProject(projectId);
    return toolResult({
      projectId,
      branchId: draft.branch_id,
      revisionId: state.current_revision_id,
      summary: `已标记草稿「${draft.title}」为弃用。`
    });
  }

  async deleteDraft(projectId: string, draftId: string): Promise<ToolResult> {
    const draft = await this.repository.deleteDraft(projectId, draftId);
    const state = await this.repository.getProject(projectId);
    return toolResult({
      projectId,
      branchId: draft.branch_id,
      revisionId: state.current_revision_id,
      summary: `已删除草稿「${draft.title}」。`
    });
  }

  async importStory(input: ImportStoryRequest): Promise<ToolResult> {
    const imported = input.format === 'json'
      ? importCanonicalJson(input.content)
      : input.format === 'opml'
        ? importOpml(input.content)
        : parseMarkdownProject(input.content, input.project_id);
    const state = !input.project_id || imported.project_id === input.project_id
      ? imported
      : { ...imported, project_id: input.project_id, edges: [] };

    await this.repository.saveProject(state);
    return toolResult({
      projectId: state.project_id,
      branchId: state.active_branch_id,
      revisionId: state.current_revision_id,
      summary: `Imported project ${state.title}.`,
      graphDelta: state.revisions.at(-1)?.delta
    });
  }

  async exportStory(input: ExportStoryRequest): Promise<{ result: ToolResult; format: ExportFormat; content: string }> {
    const state = await this.repository.getProject(input.project_id);
    const content = input.format === 'json'
      ? exportCanonicalJson(state)
      : input.format === 'opml'
        ? exportOpml(state)
        : input.format === 'mermaid'
          ? exportMermaidMindmap(state)
          : exportMarkdownOutline(state);
    return {
      result: toolResult({
        projectId: state.project_id,
        branchId: state.active_branch_id,
        revisionId: state.current_revision_id,
        summary: `Exported ${input.format}.`,
        exports: { [input.format]: content }
      }),
      format: input.format,
      content
    };
  }

  async getGraph(projectId: string, branchId?: string): Promise<{ project_id: string; branch_id: string; revision_id: string; status: 'ok'; summary: string; graph: GraphProjection }> {
    const state = await this.repository.getProject(projectId);
    const activeBranchId = branchId ?? state.active_branch_id;
    const { nodes, overriddenNodeIds } = resolveNodesForBranch(state, activeBranchId);
    const nodeIds = new Set(nodes.map((node) => node.node_id));
    const edges = state.edges.filter((edge) => nodeIds.has(edge.from_node_id) && nodeIds.has(edge.to_node_id));
    const chain = branchChain(state, activeBranchId);
    const inheritedCount = nodes.filter((node) => node.branch_scope !== activeBranchId).length;
    return {
      project_id: state.project_id,
      branch_id: activeBranchId,
      revision_id: state.current_revision_id,
      status: 'ok',
      summary:
        chain.length > 1
          ? `分支 ${activeBranchId}:${nodes.length} 个节点(其中 ${inheritedCount} 个继承自 ${chain.slice(1).join(' → ')})。`
          : `分支 ${activeBranchId}:${nodes.length} 个节点。`,
      graph: {
        branches: state.branches,
        nodes,
        edges,
        branch_chain: chain,
        overridden_node_ids: overriddenNodeIds
      }
    };
  }

  // 博客端扩展:节点编辑 / 删除
  async updateNode(
    projectId: string,
    nodeId: string,
    patch: { label?: string; content?: string; type?: string; status?: Node['status'] },
    branchId?: string
  ): Promise<ToolResult> {
    const state = await this.repository.getProject(projectId);
    const targetBranch = branchId ?? state.active_branch_id;
    const saved = await this.repository.updateNode(projectId, targetBranch, nodeId, patch);
    return toolResult({
      projectId,
      branchId: saved.revision.branch_id,
      revisionId: saved.revision.revision_id,
      summary: saved.revision.summary,
      graphDelta: saved.revision.delta,
      warnings: saved.copied
        ? [`该节点继承自父分支,已在分支 ${targetBranch} 生成独立副本,父分支不受影响。`]
        : []
    });
  }

  async deleteNode(projectId: string, nodeId: string, branchId?: string): Promise<ToolResult> {
    const state = await this.repository.getProject(projectId);
    const targetBranch = branchId ?? state.active_branch_id;
    const saved = await this.repository.deleteNode(projectId, targetBranch, nodeId);
    return toolResult({
      projectId,
      branchId: saved.revision.branch_id,
      revisionId: saved.revision.revision_id,
      summary: saved.revision.summary,
      graphDelta: saved.revision.delta,
      warnings: saved.tombstoned
        ? [`该节点继承自父分支,已在分支 ${targetBranch} 隐藏,父分支仍保留。`]
        : []
    });
  }

  async diffRevisions(projectId: string, leftRevisionId: string, rightRevisionId: string): Promise<{ project_id: string; branch_id: string; revision_id: string; status: 'ok'; summary: string; diff: RevisionComparison }> {
    const diff = await this.repository.diffRevisions(projectId, leftRevisionId, rightRevisionId);
    return {
      project_id: projectId,
      branch_id: diff.right.branch_id,
      revision_id: diff.right.revision_id,
      status: 'ok',
      summary: diff.summary,
      diff
    };
  }
}
