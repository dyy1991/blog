// Ported from novel-graph-agent src/core/import-export.ts
import {
  BranchSchema,
  GraphDeltaSchema,
  NodeSchema,
  RevisionSchema,
  StoryGraphStateSchema,
  type Branch,
  type Node,
  type ProjectState
} from './story-types';

function nowIso(): string {
  return new Date().toISOString();
}

function emptyGraphDelta(summary: string) {
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

function sortById<T>(items: readonly T[], getId: (item: T) => string): T[] {
  return [...items].sort((left, right) => getId(left).localeCompare(getId(right)));
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function unescapeXml(value: string): string {
  return value
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&amp;/g, '&');
}

function attribute(value: unknown): string {
  return escapeXml(value == null ? '' : String(value));
}

function parseAttributes(fragment: string): Record<string, string> {
  const attributes: Record<string, string> = {};
  const matcher = /([A-Za-z_:-][A-Za-z0-9_.:-]*)="([^"]*)"/g;
  let match: RegExpExecArray | null;
  while ((match = matcher.exec(fragment))) {
    attributes[match[1]] = unescapeXml(match[2]);
  }
  return attributes;
}

function parseJsonAttribute<T>(value: string | undefined, fallback: T): T {
  if (!value) {
    return fallback;
  }
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'project';
}

function branchLine(branch: Branch): string {
  const extras = [branch.purpose, branch.status !== 'active' ? branch.status : '']
    .filter(Boolean)
    .join(', ');
  return extras ? `- [${branch.branch_id}] ${branch.name} (${extras})` : `- [${branch.branch_id}] ${branch.name}`;
}

function branchGroupForMarkdown(branch: Branch, nodes: Node[]): string[] {
  const lines = [branchLine(branch)];
  for (const node of nodes) {
    lines.push(`  - ${node.label}${node.type ? ` (${node.type})` : ''}`);
  }
  return lines;
}

export function exportCanonicalJson(state: ProjectState): string {
  return JSON.stringify(StoryGraphStateSchema.parse(state), null, 2);
}

export function importCanonicalJson(text: string): ProjectState {
  return StoryGraphStateSchema.parse(JSON.parse(text));
}

export function exportMarkdownOutline(state: ProjectState): string {
  const parsed = StoryGraphStateSchema.parse(state);
  const branches = sortById(parsed.branches, (branch) => branch.branch_id);
  const nodesByBranch = new Map<string, Node[]>();

  for (const node of sortById(parsed.nodes, (item) => `${item.branch_scope}:${item.label}:${item.node_id}`)) {
    const list = nodesByBranch.get(node.branch_scope) ?? [];
    list.push(node);
    nodesByBranch.set(node.branch_scope, list);
  }

  const lines: string[] = [`# ${parsed.title}`, ''];
  lines.push(`- Language: ${parsed.language}`);
  if (parsed.genre) {
    lines.push(`- Genre: ${parsed.genre}`);
  }
  if (parsed.premise) {
    lines.push(`- Premise: ${parsed.premise}`);
  }
  lines.push('', '## Outline');

  for (const branch of branches) {
    lines.push(...branchGroupForMarkdown(branch, nodesByBranch.get(branch.branch_id) ?? []));
  }

  return `${lines.join('\n')}\n`;
}

function mermaidText(value: string): string {
  return value.replace(/\r?\n+/g, ' ').trim();
}

export function exportMermaidMindmap(state: ProjectState): string {
  const parsed = StoryGraphStateSchema.parse(state);
  const branches = sortById(parsed.branches, (branch) => branch.branch_id);
  const nodesByBranch = new Map<string, Node[]>();

  for (const node of sortById(parsed.nodes, (item) => `${item.branch_scope}:${item.label}:${item.node_id}`)) {
    const list = nodesByBranch.get(node.branch_scope) ?? [];
    list.push(node);
    nodesByBranch.set(node.branch_scope, list);
  }

  const lines: string[] = ['mindmap', `  root((${mermaidText(parsed.title)}))`];
  for (const branch of branches) {
    lines.push(`    [${branch.branch_id}] ${mermaidText(branch.name)}`);
    for (const node of nodesByBranch.get(branch.branch_id) ?? []) {
      lines.push(`      ${mermaidText(node.label)}`);
    }
  }
  return `${lines.join('\n')}\n`;
}

export function exportOpml(state: ProjectState): string {
  const parsed = StoryGraphStateSchema.parse(state);
  const branches = sortById(parsed.branches, (branch) => branch.branch_id);
  const nodes = sortById(parsed.nodes, (node) => `${node.branch_scope}:${node.label}:${node.node_id}`);

  const headProperties: Array<[string, string | undefined]> = [
    ['project_id', parsed.project_id],
    ['title', parsed.title],
    ['language', parsed.language],
    ['genre', parsed.genre],
    ['premise', parsed.premise],
    ['active_branch_id', parsed.active_branch_id],
    ['current_revision_id', parsed.current_revision_id]
  ];

  const lines: string[] = ['<?xml version="1.0" encoding="UTF-8"?>', '<opml version="2.0">', '  <head>'];
  for (const [name, value] of headProperties) {
    if (value === undefined) {
      continue;
    }
    lines.push(`    <property name="${attribute(name)}" value="${attribute(value)}" />`);
  }
  lines.push('  </head>', '  <body>');

  for (const branch of branches) {
    lines.push(
      `    <outline text="${attribute(branch.name)}" kind="branch" branch_id="${attribute(branch.branch_id)}" name="${attribute(branch.name)}" status="${attribute(branch.status)}" purpose="${attribute(branch.purpose)}" parent_branch_id="${attribute(branch.parent_branch_id ?? '')}" head_revision_id="${attribute(branch.head_revision_id)}" />`
    );
  }

  for (const node of nodes) {
    lines.push(
      `    <outline text="${attribute(node.label)}" kind="node" node_id="${attribute(node.node_id)}" type="${attribute(node.type)}" branch_scope="${attribute(node.branch_scope)}" status="${attribute(node.status)}" content="${attribute(node.content)}" source_refs="${attribute(JSON.stringify(node.source_refs))}" tags="${attribute(JSON.stringify(node.tags))}" created_at="${attribute(node.created_at)}" updated_at="${attribute(node.updated_at)}" />`
    );
  }

  lines.push('  </body>', '</opml>');
  return `${lines.join('\n')}\n`;
}

function parseOpmlOutlines(text: string): Array<{ kind: string; attributes: Record<string, string> }> {
  const outlines: Array<{ kind: string; attributes: Record<string, string> }> = [];
  const matcher = /<outline\b([^>]*)\/>/g;
  let match: RegExpExecArray | null;
  while ((match = matcher.exec(text))) {
    const attributes = parseAttributes(match[1]);
    outlines.push({ kind: attributes.kind ?? attributes.type ?? 'node', attributes });
  }
  return outlines;
}

function findHeadProperties(text: string): Record<string, string> {
  const properties: Record<string, string> = {};
  const matcher = /<property\b([^>]*)\/>/g;
  let match: RegExpExecArray | null;
  while ((match = matcher.exec(text))) {
    const attributes = parseAttributes(match[1]);
    if (attributes.name) {
      properties[attributes.name] = attributes.value ?? '';
    }
  }
  return properties;
}

export function importOpml(text: string): ProjectState {
  const head = findHeadProperties(text);
  const outlines = parseOpmlOutlines(text);
  const branches: Branch[] = [];
  const nodes: Node[] = [];

  for (const outline of outlines) {
    const attributes = outline.attributes;
    if (outline.kind === 'branch') {
      branches.push(
        BranchSchema.parse({
          branch_id: attributes.branch_id || attributes.text || `branch_${branches.length + 1}`,
          name: attributes.name || attributes.text || attributes.branch_id || `branch_${branches.length + 1}`,
          parent_branch_id: attributes.parent_branch_id ? attributes.parent_branch_id : null,
          head_revision_id: attributes.head_revision_id || head.current_revision_id || 'rev_imported',
          status: attributes.status || 'active',
          purpose: attributes.purpose || ''
        })
      );
      continue;
    }

    nodes.push(
      NodeSchema.parse({
        node_id: attributes.node_id || `node_${nodes.length + 1}`,
        type: attributes.type || 'note',
        label: attributes.text || attributes.label || attributes.node_id || `Node ${nodes.length + 1}`,
        content: attributes.content || attributes.text || attributes.label || '',
        status: attributes.status || 'provisional',
        branch_scope: attributes.branch_scope || head.active_branch_id || 'main',
        source_refs: parseJsonAttribute(attributes.source_refs, []),
        tags: parseJsonAttribute(attributes.tags, []),
        created_at: attributes.created_at || nowIso(),
        updated_at: attributes.updated_at || attributes.created_at || nowIso()
      })
    );
  }

  const projectTitle = head.title || head.project_id || 'Imported project';
  const projectId = head.project_id || slugify(projectTitle);
  const activeBranchId = head.active_branch_id || branches[0]?.branch_id || 'main';
  const currentRevisionId = head.current_revision_id || branches[0]?.head_revision_id || 'rev_imported';

  const normalizedBranches = branches.length > 0
    ? branches
    : [
        BranchSchema.parse({
          branch_id: activeBranchId,
          name: activeBranchId,
          parent_branch_id: null,
          head_revision_id: currentRevisionId,
          status: 'active',
          purpose: 'imported'
        })
      ];

  const importedRevision = RevisionSchema.parse({
    revision_id: currentRevisionId,
    parent_revision_id: null,
    branch_id: activeBranchId,
    created_at: nowIso(),
    created_by: 'import',
    summary: 'Imported from OPML',
    delta: emptyGraphDelta('Imported from OPML')
  });

  return StoryGraphStateSchema.parse({
    project_id: projectId,
    title: projectTitle,
    genre: head.genre || undefined,
    premise: head.premise || undefined,
    language: head.language || 'zh-CN',
    active_branch_id: activeBranchId,
    current_revision_id: currentRevisionId,
    branches: normalizedBranches,
    revisions: [importedRevision],
    nodes,
    edges: []
  });
}
