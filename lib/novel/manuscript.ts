// 成稿导出:按「顺序链 + 层级」遍历图谱,已采纳草稿优先,无则回退到节点正文。
// 目的是把编排结果拼成可直接阅读/投稿的稿件,而不是大纲结构。
import type { Draft, Edge, Node, ProjectState } from './story-types';

export interface ManuscriptOptions {
  /** 只输出已采纳草稿(跳过仅有大纲的节点) */
  draftsOnly?: boolean;
  /** 大纲与正文都输出,便于对照检查 */
  includeBoth?: boolean;
}

interface WalkContext {
  childrenOf: Map<string, string[]>;
  byId: Map<string, Node>;
  draftByNode: Map<string, Draft>;
}

/** 与画布一致的兄弟排序:有 next 链的按链序,其余保持原序 */
function orderSiblings(ids: string[], nextOf: Map<string, string>, hasPrev: Set<string>): string[] {
  const group = new Set(ids);
  const result: string[] = [];
  const placed = new Set<string>();
  for (const id of ids) {
    if (placed.has(id) || hasPrev.has(id)) continue;
    let cursor: string | undefined = id;
    while (cursor && group.has(cursor) && !placed.has(cursor)) {
      result.push(cursor);
      placed.add(cursor);
      cursor = nextOf.get(cursor);
    }
  }
  for (const id of ids) {
    if (!placed.has(id)) {
      result.push(id);
      placed.add(id);
    }
  }
  return result;
}

function buildContext(nodes: Node[], edges: Edge[], drafts: Draft[]): WalkContext {
  const byId = new Map(nodes.map((node) => [node.node_id, node]));
  const parentOf = new Map<string, string>();
  const childrenOf = new Map<string, string[]>();
  const nextOf = new Map<string, string>();
  const hasPrev = new Set<string>();

  for (const edge of edges) {
    if (!byId.has(edge.from_node_id) || !byId.has(edge.to_node_id)) continue;
    if (edge.type === 'contains') {
      if (parentOf.has(edge.to_node_id)) continue;
      parentOf.set(edge.to_node_id, edge.from_node_id);
      const list = childrenOf.get(edge.from_node_id) ?? [];
      list.push(edge.to_node_id);
      childrenOf.set(edge.from_node_id, list);
    } else if (edge.type === 'next') {
      if (nextOf.has(edge.from_node_id)) continue;
      nextOf.set(edge.from_node_id, edge.to_node_id);
      hasPrev.add(edge.to_node_id);
    }
  }

  for (const [parent, children] of childrenOf) {
    childrenOf.set(parent, orderSiblings(children, nextOf, hasPrev));
  }

  // 采纳的草稿按节点归档:节点是通过 source_refs 关联的,也可能同名匹配
  const draftByNode = new Map<string, Draft>();
  const accepted = drafts.filter((draft) => draft.status === 'accepted');
  for (const node of nodes) {
    const ref = node.source_refs.find((item) => item.kind === 'draft');
    const match = ref
      ? accepted.find((draft) => draft.draft_id === ref.text)
      : accepted.find((draft) => draft.title === node.label);
    if (match) {
      draftByNode.set(node.node_id, match);
    }
  }

  const roots = orderSiblings(
    nodes.filter((node) => !parentOf.has(node.node_id)).map((node) => node.node_id),
    nextOf,
    hasPrev
  );
  childrenOf.set('__root__', roots);

  return { childrenOf, byId, draftByNode };
}

/** 只有这些类型会作为「章节骨架」输出;角色/世界观等设定不进正文 */
const NARRATIVE_TYPES = new Set(['chapter', 'scene', 'plot', 'outline']);

export function exportManuscript(
  state: ProjectState,
  nodes: Node[],
  edges: Edge[],
  options: ManuscriptOptions = {}
): string {
  const context = buildContext(nodes, edges, state.drafts);
  const lines: string[] = [`# ${state.title}`, ''];
  if (state.premise) {
    lines.push(`> ${state.premise}`, '');
  }

  let wordCount = 0;
  let writtenSections = 0;
  let outlineOnlySections = 0;

  const walk = (nodeId: string, depth: number) => {
    const node = context.byId.get(nodeId);
    if (!node) return;

    const draft = context.draftByNode.get(nodeId);
    const isNarrative = NARRATIVE_TYPES.has(node.type);
    const hasBody = Boolean(draft) || Boolean(node.content.trim());

    // 非叙事类型(角色、世界观等)不进成稿,但其子节点若是叙事仍继续遍历
    if (isNarrative && hasBody) {
      if (options.draftsOnly && !draft) {
        // 只要成稿时跳过仅有大纲的小节
      } else {
        lines.push(`${'#'.repeat(Math.min(depth + 2, 6))} ${node.label}`, '');
        if (draft) {
          lines.push(draft.content.trim(), '');
          wordCount += draft.content.replace(/\s/g, '').length;
          writtenSections += 1;
          if (options.includeBoth && node.content.trim()) {
            lines.push(`<!-- 大纲:${node.content.replace(/\s+/g, ' ').trim()} -->`, '');
          }
        } else {
          lines.push(node.content.trim(), '');
          outlineOnlySections += 1;
        }
      }
    }

    for (const childId of context.childrenOf.get(nodeId) ?? []) {
      walk(childId, depth + 1);
    }
  };

  for (const rootId of context.childrenOf.get('__root__') ?? []) {
    walk(rootId, 0);
  }

  lines.push(
    '---',
    '',
    `*成稿统计:已写正文 ${writtenSections} 节(约 ${wordCount} 字)` +
      (options.draftsOnly ? '' : `,仅大纲 ${outlineOnlySections} 节`) +
      ` · 导出于 ${new Date().toISOString().slice(0, 10)}*`
  );

  return `${lines.join('\n')}\n`;
}
