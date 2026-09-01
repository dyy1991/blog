// Ported from novel-graph-agent src/core/project-repository.ts
import crypto from 'node:crypto';
import type { Dirent } from 'node:fs';
import fs from 'node:fs/promises';
import {
  BranchSchema,
  GraphDeltaSchema,
  RevisionSchema,
  StoryGraphStateSchema,
  type Edge,
  type GraphDelta,
  type Node,
  type ProjectState,
  type Revision
} from './story-types';
import { projectDir, projectStatePath } from './paths';
import { readJsonFile, writeJsonFileAtomic } from './atomic-json';

export interface ProjectRepositoryOptions {
  dataDir: string;
}

export interface CreateProjectInput {
  projectId: string;
  title: string;
  language: string;
  genre?: string;
  premise?: string;
}

export interface CreateBranchInput {
  branchId: string;
  name: string;
  purpose: string;
  parentRevisionId?: string | null;
}

export interface UpsertNodesAndEdgesInput {
  branchId?: string;
  summary: string;
  createdBy: 'user' | 'system' | 'import';
  nodes?: Node[];
  edges?: Edge[];
  nextQuestion?: string | null;
}

export interface RevisionComparison {
  left: Revision;
  right: Revision;
  summary: string;
}

export interface ProjectSummary {
  project_id: string;
  title: string;
  genre?: string;
  premise?: string;
  language: string;
  active_branch_id: string;
  current_revision_id: string;
  branches_count: number;
  nodes_count: number;
}

class AsyncMutex {
  private pending: Promise<void> = Promise.resolve();

  async runExclusive<T>(fn: () => Promise<T>): Promise<T> {
    const prior = this.pending;
    let release!: () => void;
    const current = new Promise<void>((resolve) => {
      release = resolve;
    });

    this.pending = prior.then(() => current, () => current);
    await prior.catch(() => undefined);

    try {
      return await fn();
    } finally {
      release();
    }
  }
}

function nowIso(): string {
  return new Date().toISOString();
}

function newId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
}

function createDelta(summary: string, partial?: Partial<GraphDelta>): GraphDelta {
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

function mergeNode(existing: Node | undefined, incoming: Node): { node: Node; changed: boolean } {
  if (!existing) {
    return { node: incoming, changed: true };
  }

  const merged: Node = {
    ...existing,
    ...incoming,
    source_refs: incoming.source_refs.length > 0 ? incoming.source_refs : existing.source_refs,
    tags: incoming.tags.length > 0 ? incoming.tags : existing.tags,
    updated_at: incoming.updated_at ?? nowIso()
  };

  return {
    node: merged,
    changed: JSON.stringify(existing) !== JSON.stringify(merged)
  };
}

function mergeEdge(existing: Edge | undefined, incoming: Edge): { edge: Edge; changed: boolean } {
  if (!existing) {
    return { edge: incoming, changed: true };
  }

  const merged: Edge = {
    ...existing,
    ...incoming,
    source_refs: incoming.source_refs.length > 0 ? incoming.source_refs : existing.source_refs
  };

  return {
    edge: merged,
    changed: JSON.stringify(existing) !== JSON.stringify(merged)
  };
}

export class ProjectRepository {
  private readonly dataDir: string;
  private readonly locks = new Map<string, AsyncMutex>();

  constructor(options: ProjectRepositoryOptions) {
    this.dataDir = options.dataDir;
  }

  private lockFor(projectId: string): AsyncMutex {
    const existing = this.locks.get(projectId);
    if (existing) {
      return existing;
    }
    const mutex = new AsyncMutex();
    this.locks.set(projectId, mutex);
    return mutex;
  }

  private async read(projectId: string): Promise<ProjectState> {
    const filePath = projectStatePath(this.dataDir, projectId);
    return readJsonFile(filePath, StoryGraphStateSchema);
  }

  private async write(state: ProjectState): Promise<void> {
    await writeJsonFileAtomic(projectStatePath(this.dataDir, state.project_id), state);
  }

  private async update<T>(projectId: string, fn: (state: ProjectState) => Promise<T> | T): Promise<T> {
    return this.lockFor(projectId).runExclusive(async () => {
      const state = await this.read(projectId);
      const result = await fn(state);
      await this.write(state);
      return result;
    });
  }

  async createProject(input: CreateProjectInput): Promise<ProjectState> {
    return this.lockFor(input.projectId).runExclusive(async () => {
      const filePath = projectStatePath(this.dataDir, input.projectId);
      try {
        await fs.access(filePath);
        throw new Error(`Project already exists: ${input.projectId}`);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
          throw error;
        }
      }

      const revisionId = newId('rev');
      const mainBranch = BranchSchema.parse({
        branch_id: 'main',
        name: 'main',
        parent_branch_id: null,
        head_revision_id: revisionId,
        status: 'active',
        purpose: 'mainline'
      });

      const revision = RevisionSchema.parse({
        revision_id: revisionId,
        parent_revision_id: null,
        branch_id: 'main',
        created_at: nowIso(),
        created_by: 'system',
        summary: 'Initialize project',
        delta: createDelta('Initialize project', {
          branches_added: ['main'],
          revisions_created: [revisionId]
        })
      });

      const state: ProjectState = StoryGraphStateSchema.parse({
        project_id: input.projectId,
        title: input.title,
        genre: input.genre,
        premise: input.premise,
        language: input.language,
        active_branch_id: 'main',
        current_revision_id: revisionId,
        branches: [mainBranch],
        revisions: [revision],
        nodes: [],
        edges: []
      });

      await this.write(state);
      return state;
    });
  }

  async getProject(projectId: string): Promise<ProjectState> {
    return this.read(projectId);
  }

  async listProjects(): Promise<ProjectSummary[]> {
    const projectsRoot = projectDir(this.dataDir, '');
    let entries: Dirent[];
    try {
      entries = await fs.readdir(projectsRoot, { withFileTypes: true });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return [];
      }
      throw error;
    }

    const summaries: ProjectSummary[] = [];
    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }
      const state = await this.read(entry.name);
      summaries.push({
        project_id: state.project_id,
        title: state.title,
        genre: state.genre,
        premise: state.premise,
        language: state.language,
        active_branch_id: state.active_branch_id,
        current_revision_id: state.current_revision_id,
        branches_count: state.branches.length,
        nodes_count: state.nodes.length
      });
    }

    return summaries.sort((left, right) => left.project_id.localeCompare(right.project_id));
  }

  async saveProject(state: ProjectState): Promise<ProjectState> {
    await this.write(state);
    return state;
  }

  async listBranches(projectId: string) {
    const state = await this.read(projectId);
    return state.branches;
  }

  async createBranch(projectId: string, input: CreateBranchInput) {
    return this.update(projectId, async (state) => {
      if (state.branches.some((branch) => branch.branch_id === input.branchId)) {
        throw new Error(`Branch already exists: ${input.branchId}`);
      }

      const parentBranch = state.branches.find((branch) => branch.branch_id === state.active_branch_id);
      const headRevisionId = input.parentRevisionId ?? state.current_revision_id;
      const branch = BranchSchema.parse({
        branch_id: input.branchId,
        name: input.name,
        parent_branch_id: parentBranch?.branch_id ?? null,
        head_revision_id: headRevisionId,
        status: 'active',
        purpose: input.purpose
      });

      state.branches.push(branch);
      return branch;
    });
  }

  async switchBranch(projectId: string, branchId: string): Promise<ProjectState> {
    return this.update(projectId, async (state) => {
      const branch = state.branches.find((item) => item.branch_id === branchId);
      if (!branch) {
        throw new Error(`Branch not found: ${branchId}`);
      }
      state.active_branch_id = branchId;
      state.current_revision_id = branch.head_revision_id;
      return state;
    });
  }

  async upsertNodesAndEdges(projectId: string, input: UpsertNodesAndEdgesInput): Promise<{ state: ProjectState; revision: Revision }> {
    return this.lockFor(projectId).runExclusive(async () => {
      const state = await this.read(projectId);
      const branchId = input.branchId ?? state.active_branch_id;
      const branch = state.branches.find((item) => item.branch_id === branchId);
      if (!branch) {
        throw new Error(`Branch not found: ${branchId}`);
      }

      const nodeMap = new Map(state.nodes.map((node) => [node.node_id, node]));
      const edgeMap = new Map(state.edges.map((edge) => [edge.edge_id, edge]));
      const delta: GraphDelta = createDelta(input.summary);

      for (const node of input.nodes ?? []) {
        const existing = nodeMap.get(node.node_id);
        const merged = mergeNode(existing, node);
        nodeMap.set(node.node_id, merged.node);
        if (existing) {
          if (merged.changed) {
            delta.nodes_updated.push(node.node_id);
          }
        } else {
          delta.nodes_added.push(node.node_id);
        }
      }

      for (const edge of input.edges ?? []) {
        const existing = edgeMap.get(edge.edge_id);
        const merged = mergeEdge(existing, edge);
        edgeMap.set(edge.edge_id, merged.edge);
        if (existing) {
          if (merged.changed) {
            delta.edges_updated.push(edge.edge_id);
          }
        } else {
          delta.edges_added.push(edge.edge_id);
        }
      }

      const revision = RevisionSchema.parse({
        revision_id: newId('rev'),
        parent_revision_id: branch.head_revision_id,
        branch_id: branchId,
        created_at: nowIso(),
        created_by: input.createdBy,
        summary: input.summary,
        delta
      });

      state.nodes = [...nodeMap.values()].sort((a, b) => a.node_id.localeCompare(b.node_id));
      state.edges = [...edgeMap.values()].sort((a, b) => a.edge_id.localeCompare(b.edge_id));
      state.revisions.push(revision);
      branch.head_revision_id = revision.revision_id;
      if (state.active_branch_id === branchId) {
        state.current_revision_id = revision.revision_id;
      }

      await this.write(state);
      return { state, revision };
    });
  }

  // 博客端扩展(MCP 仓库暂无):节点编辑
  async updateNode(
    projectId: string,
    nodeId: string,
    patch: { label?: string; content?: string; type?: string; status?: Node['status'] }
  ): Promise<{ state: ProjectState; revision: Revision }> {
    return this.lockFor(projectId).runExclusive(async () => {
      const state = await this.read(projectId);
      const index = state.nodes.findIndex((node) => node.node_id === nodeId);
      if (index === -1) {
        throw new Error(`Node not found: ${nodeId}`);
      }
      const existing = state.nodes[index];
      const updated: Node = {
        ...existing,
        label: patch.label ?? existing.label,
        content: patch.content ?? existing.content,
        type: patch.type ?? existing.type,
        status: patch.status ?? existing.status,
        updated_at: nowIso()
      };
      state.nodes[index] = updated;

      const branch = state.branches.find((item) => item.branch_id === existing.branch_scope)
        ?? state.branches.find((item) => item.branch_id === state.active_branch_id);
      const revision = RevisionSchema.parse({
        revision_id: newId('rev'),
        parent_revision_id: branch?.head_revision_id ?? null,
        branch_id: branch?.branch_id ?? state.active_branch_id,
        created_at: nowIso(),
        created_by: 'user',
        summary: `Update node ${updated.label}`,
        delta: createDelta(`Update node ${updated.label}`, { nodes_updated: [nodeId] })
      });
      state.revisions.push(revision);
      if (branch) {
        branch.head_revision_id = revision.revision_id;
        if (state.active_branch_id === branch.branch_id) {
          state.current_revision_id = revision.revision_id;
        }
      }

      await this.write(state);
      return { state, revision };
    });
  }

  // 博客端扩展(MCP 仓库暂无):删除节点及其关联边
  async deleteNode(projectId: string, nodeId: string): Promise<{ state: ProjectState; revision: Revision }> {
    return this.lockFor(projectId).runExclusive(async () => {
      const state = await this.read(projectId);
      const existing = state.nodes.find((node) => node.node_id === nodeId);
      if (!existing) {
        throw new Error(`Node not found: ${nodeId}`);
      }

      const removedEdges = state.edges
        .filter((edge) => edge.from_node_id === nodeId || edge.to_node_id === nodeId)
        .map((edge) => edge.edge_id);

      state.nodes = state.nodes.filter((node) => node.node_id !== nodeId);
      state.edges = state.edges.filter((edge) => edge.from_node_id !== nodeId && edge.to_node_id !== nodeId);

      const branch = state.branches.find((item) => item.branch_id === existing.branch_scope)
        ?? state.branches.find((item) => item.branch_id === state.active_branch_id);
      const revision = RevisionSchema.parse({
        revision_id: newId('rev'),
        parent_revision_id: branch?.head_revision_id ?? null,
        branch_id: branch?.branch_id ?? state.active_branch_id,
        created_at: nowIso(),
        created_by: 'user',
        summary: `Delete node ${existing.label}`,
        delta: createDelta(`Delete node ${existing.label}`, {
          nodes_retired: [nodeId],
          edges_retired: removedEdges
        })
      });
      state.revisions.push(revision);
      if (branch) {
        branch.head_revision_id = revision.revision_id;
        if (state.active_branch_id === branch.branch_id) {
          state.current_revision_id = revision.revision_id;
        }
      }

      await this.write(state);
      return { state, revision };
    });
  }

  async diffRevisions(projectId: string, leftRevisionId: string, rightRevisionId: string): Promise<RevisionComparison> {
    const state = await this.read(projectId);
    const left = state.revisions.find((revision) => revision.revision_id === leftRevisionId);
    const right = state.revisions.find((revision) => revision.revision_id === rightRevisionId);
    if (!left) {
      throw new Error(`Revision not found: ${leftRevisionId}`);
    }
    if (!right) {
      throw new Error(`Revision not found: ${rightRevisionId}`);
    }
    return {
      left,
      right,
      summary: `${left.summary} -> ${right.summary}`
    };
  }
}
