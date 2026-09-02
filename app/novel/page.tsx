'use client'

// 小说工坊:故事图谱思维导图编排页(数据来自 /api/novel,口令保护)
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

interface NodeT {
  node_id: string
  type: string
  label: string
  content: string
  status: string
  branch_scope: string
  tags: string[]
}

interface EdgeT {
  edge_id: string
  type: string
  from_node_id: string
  to_node_id: string
  label: string
}

interface BranchT {
  branch_id: string
  name: string
  purpose: string
  status: string
  parent_branch_id: string | null
}

interface ProjectSummaryT {
  project_id: string
  title: string
  genre?: string
  nodes_count: number
  active_branch_id: string
}

interface DraftT {
  draft_id?: string
  kind: string
  title: string
  content: string
  status?: string
  created_at?: string
  branch_id?: string
}

interface ToolResultT {
  status: string
  summary: string
  next_question: string | null
  draft: DraftT | null
  warnings: string[]
}

interface GraphResponseT {
  branch_id: string
  summary?: string
  graph: {
    branches: BranchT[]
    nodes: NodeT[]
    edges: EdgeT[]
    branch_chain?: string[]
    overridden_node_ids?: string[]
  }
}

const TYPE_META: Record<string, { name: string; color: string; deprecated?: boolean }> = {
  worldbuilding: { name: '世界观', color: '#0ea5e9' },
  character: { name: '角色', color: '#f59e0b' },
  faction: { name: '势力/组织', color: '#7c3aed' },
  plot: { name: '主线剧情', color: '#ef4444' },
  chapter: { name: '章节', color: '#8b5cf6' },
  scene: { name: '场景', color: '#10b981' },
  branch_note: { name: '分支设定', color: '#6366f1' },
  outline: { name: '大纲', color: '#14b8a6' },
  intake: { name: '素材', color: '#64748b' },
  // 旧数据兼容:节点类型「关系」与关系连线职能重叠,不再作为新建选项
  relationship: { name: '关系(旧)', color: '#ec4899', deprecated: true }
}

/** 可供选择的节点类型(排除已弃用的) */
const SELECTABLE_TYPES = Object.entries(TYPE_META).filter(([, meta]) => !meta.deprecated)

/** 节点状态:定稿程度,用描边样式区分 */
const STATUS_META: Record<string, { name: string; color: string; dash?: string }> = {
  confirmed: { name: '已定稿', color: '#059669' },
  provisional: { name: '待定', color: '#94a3b8', dash: '4 3' },
  disputed: { name: '有冲突', color: '#dc2626', dash: '2 2' }
}
const STATUS_ORDER = ['confirmed', 'provisional', 'disputed'] as const

function statusMeta(status: string) {
  return STATUS_META[status] ?? { name: status, color: '#94a3b8' }
}

function typeMeta(type: string) {
  return TYPE_META[type] ?? { name: type, color: '#94a3b8' }
}

/** 右上角「放大」小按钮 */
function ExpandButton({ onClick, label = '放大查看' }: { onClick: () => void; label?: string }) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className="shrink-0 rounded border border-gray-300 bg-white p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
    >
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M9.5 1.5h5v5M14.5 1.5 9 7M6.5 14.5h-5v-5M1.5 14.5 7 9" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}

type ModalKind = 'intake' | 'node' | 'readonly'

/** 关系边类型:contains 由层级维护,其余可手动创建 */
const EDGE_META: Record<string, { name: string; color: string; dashed: boolean }> = {
  next: { name: '顺序', color: '#0ea5e9', dashed: false },
  relation: { name: '关系', color: '#ec4899', dashed: true },
  conflict: { name: '冲突', color: '#ef4444', dashed: true },
  reference: { name: '引用', color: '#94a3b8', dashed: true }
}
const EDGE_TYPES = ['next', 'relation', 'conflict', 'reference'] as const

function edgeMeta(type: string) {
  return EDGE_META[type] ?? { name: type, color: '#94a3b8', dashed: true }
}

/** 按父节点类型提供的快捷子节点模板 */
const TEMPLATES: Record<string, Array<{ label: string; type: string }>> = {
  character: [
    { label: '背景故事', type: 'worldbuilding' },
    { label: '性格', type: 'character' },
    { label: '动机', type: 'plot' },
    { label: '所属势力', type: 'faction' }
  ],
  faction: [
    { label: '首领', type: 'character' },
    { label: '核心成员', type: 'character' },
    { label: '目标', type: 'plot' },
    { label: '据点', type: 'worldbuilding' }
  ],
  chapter: [
    { label: '场景', type: 'scene' },
    { label: '冲突', type: 'plot' },
    { label: '转折', type: 'plot' }
  ],
  plot: [
    { label: '起因', type: 'plot' },
    { label: '发展', type: 'plot' },
    { label: '高潮', type: 'plot' },
    { label: '结局', type: 'plot' }
  ],
  worldbuilding: [
    { label: '地理', type: 'worldbuilding' },
    { label: '历史', type: 'worldbuilding' },
    { label: '规则体系', type: 'worldbuilding' },
    { label: '势力', type: 'faction' }
  ],
  scene: [
    { label: '出场人物', type: 'character' },
    { label: '冲突', type: 'plot' },
    { label: '结果', type: 'plot' }
  ]
}

/** 新建子节点时的默认类型:沿用父节点类型,让手动搭建的结构保持连贯 */
function childTypeFor(parentType: string): string {
  return parentType || 'intake'
}

interface PlannerInfoT {
  mode: 'model' | 'heuristic'
  plan_model: string | null
  write_model: string | null
  base_host: string | null
}

interface LaidNode {
  node: NodeT
  x: number
  y: number
  depth: number
  childCount: number
  collapsed: boolean
  parentId: string | null
}

const NODE_W = 176
const NODE_H = 40
const V_GAP = 14
const H_GAP = 96
const ROOT_W = 160
const ROOT_X = 12

interface TreeNode {
  node: NodeT
  children: TreeNode[]
}

/** 按 contains 边构建森林;每个节点只认第一条父边,其余关系另行绘制 */
function buildForest(nodes: NodeT[], edges: EdgeT[]): { roots: TreeNode[]; parentOf: Map<string, string> } {
  const byId = new Map(nodes.map((node) => [node.node_id, node]))
  const parentOf = new Map<string, string>()
  const childrenOf = new Map<string, string[]>()

  for (const edge of edges) {
    if (edge.type !== 'contains') continue
    if (!byId.has(edge.from_node_id) || !byId.has(edge.to_node_id)) continue
    if (parentOf.has(edge.to_node_id)) continue
    parentOf.set(edge.to_node_id, edge.from_node_id)
    const list = childrenOf.get(edge.from_node_id) ?? []
    list.push(edge.to_node_id)
    childrenOf.set(edge.from_node_id, list)
  }

  // next 边:在兄弟节点内部决定先后顺序
  const nextOf = new Map<string, string>()
  const hasPrev = new Set<string>()
  for (const edge of edges) {
    if (edge.type !== 'next') continue
    if (!byId.has(edge.from_node_id) || !byId.has(edge.to_node_id)) continue
    if (nextOf.has(edge.from_node_id)) continue
    nextOf.set(edge.from_node_id, edge.to_node_id)
    hasPrev.add(edge.to_node_id)
  }

  /** 同组内按 next 链排序:链头依原序出现,链上后继紧随其后 */
  const orderBySequence = (ids: string[]): string[] => {
    const group = new Set(ids)
    const result: string[] = []
    const placed = new Set<string>()
    for (const id of ids) {
      if (placed.has(id) || hasPrev.has(id)) continue
      let cursor: string | undefined = id
      while (cursor && group.has(cursor) && !placed.has(cursor)) {
        result.push(cursor)
        placed.add(cursor)
        cursor = nextOf.get(cursor)
      }
    }
    // 处于环中或链头不在本组的节点,按原序补齐
    for (const id of ids) {
      if (!placed.has(id)) {
        result.push(id)
        placed.add(id)
      }
    }
    return result
  }

  const build = (id: string, seen: Set<string>): TreeNode => {
    seen.add(id)
    const childIds = orderBySequence((childrenOf.get(id) ?? []).filter((childId) => !seen.has(childId)))
    return { node: byId.get(id)!, children: childIds.map((childId) => build(childId, seen)) }
  }

  const seen = new Set<string>()
  const rootIds = orderBySequence(nodes.filter((node) => !parentOf.has(node.node_id)).map((node) => node.node_id))
  const roots = rootIds.map((id) => build(id, seen))

  return { roots, parentOf }
}

/** 经典 tidy tree:先按子树高度分配纵向空间,再把父节点对齐到子树中心 */
function layoutTree(title: string, roots: TreeNode[], collapsed: Set<string>, parentOf: Map<string, string>) {
  const laid: LaidNode[] = []
  let cursorY = 24
  let maxX = ROOT_X + ROOT_W

  const place = (item: TreeNode, depth: number): { top: number; bottom: number; center: number } => {
    const x = ROOT_X + ROOT_W + H_GAP + depth * (NODE_W + H_GAP)
    const isCollapsed = collapsed.has(item.node.node_id)
    const hasChildren = item.children.length > 0

    if (!hasChildren || isCollapsed) {
      const y = cursorY
      cursorY += NODE_H + V_GAP
      laid.push({
        node: item.node,
        x,
        y,
        depth,
        childCount: item.children.length,
        collapsed: isCollapsed,
        parentId: parentOf.get(item.node.node_id) ?? null
      })
      maxX = Math.max(maxX, x + NODE_W)
      return { top: y, bottom: y + NODE_H, center: y + NODE_H / 2 }
    }

    const spans = item.children.map((child) => place(child, depth + 1))
    const center = (spans[0].center + spans[spans.length - 1].center) / 2
    const y = center - NODE_H / 2
    laid.push({
      node: item.node,
      x,
      y,
      depth,
      childCount: item.children.length,
      collapsed: false,
      parentId: parentOf.get(item.node.node_id) ?? null
    })
    maxX = Math.max(maxX, x + NODE_W)
    return { top: Math.min(y, spans[0].top), bottom: Math.max(y + NODE_H, spans[spans.length - 1].bottom), center }
  }

  const rootSpans = roots.map((root) => place(root, 0))
  const height = Math.max(cursorY + 24, 420)
  const rootY =
    rootSpans.length > 0
      ? (rootSpans[0].center + rootSpans[rootSpans.length - 1].center) / 2 - NODE_H / 2
      : height / 2 - NODE_H / 2

  return { laid, rootY, width: maxX + 60, height, title, topLevelIds: roots.map((root) => root.node.node_id) }
}

/** 时间线布局:把每条 next 链横向平铺成一行 */
function layoutTimeline(nodes: NodeT[], edges: EdgeT[]) {
  const byId = new Map(nodes.map((node) => [node.node_id, node]))
  const nextOf = new Map<string, string>()
  const hasPrev = new Set<string>()
  for (const edge of edges) {
    if (edge.type !== 'next') continue
    if (!byId.has(edge.from_node_id) || !byId.has(edge.to_node_id)) continue
    if (nextOf.has(edge.from_node_id)) continue
    nextOf.set(edge.from_node_id, edge.to_node_id)
    hasPrev.add(edge.to_node_id)
  }

  const inChain = new Set<string>([...nextOf.keys(), ...hasPrev])
  const chains: NodeT[][] = []
  const placed = new Set<string>()
  for (const node of nodes) {
    if (!inChain.has(node.node_id) || hasPrev.has(node.node_id) || placed.has(node.node_id)) continue
    const chain: NodeT[] = []
    let cursor: string | undefined = node.node_id
    while (cursor && byId.has(cursor) && !placed.has(cursor)) {
      chain.push(byId.get(cursor)!)
      placed.add(cursor)
      cursor = nextOf.get(cursor)
    }
    chains.push(chain)
  }

  const laid: Array<{ node: NodeT; x: number; y: number; row: number; index: number }> = []
  const rowGap = NODE_H + 56
  chains.forEach((chain, row) => {
    chain.forEach((node, index) => {
      laid.push({ node, x: 40 + index * (NODE_W + 56), y: 40 + row * rowGap, row, index })
    })
  })

  const width = Math.max(...laid.map((item) => item.x + NODE_W), 400) + 60
  const height = Math.max(chains.length * rowGap + 80, 320)
  return { laid, chains, width, height }
}

async function api<T>(key: string, path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/novel/${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      'x-novel-key': key,
      ...(init?.headers ?? {})
    }
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message =
      data && typeof data === 'object' && 'error' in data
        ? String((data as { error: { message?: string } }).error?.message ?? response.status)
        : `HTTP ${response.status}`
    throw new Error(message)
  }
  return data as T
}

export default function NovelStudioPage() {
  const [key, setKey] = useState('')
  const [authed, setAuthed] = useState(false)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  const [projects, setProjects] = useState<ProjectSummaryT[]>([])
  const [projectId, setProjectId] = useState('')
  const [graph, setGraph] = useState<GraphResponseT | null>(null)
  const [branchId, setBranchId] = useState('')
  const [selected, setSelected] = useState<NodeT | null>(null)

  const [editLabel, setEditLabel] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editType, setEditType] = useState('')
  const [intakeText, setIntakeText] = useState('')
  const [planResult, setPlanResult] = useState<ToolResultT | null>(null)
  const [draftPrompt, setDraftPrompt] = useState('')
  const [draftResult, setDraftResult] = useState<DraftT | null>(null)
  const [drafts, setDrafts] = useState<DraftT[]>([])
  const [openDraftId, setOpenDraftId] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [hoverNodeId, setHoverNodeId] = useState<string | null>(null)
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null)
  const [linkState, setLinkState] = useState<{ fromId: string; x: number; y: number; overId: string | null } | null>(null)
  const [viewMode, setViewMode] = useState<'mindmap' | 'timeline'>('mindmap')
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [linkType, setLinkType] = useState<string>('relation')
  const [linkTargetId, setLinkTargetId] = useState('')
  const [linkLabel, setLinkLabel] = useState('')
  const [dragState, setDragState] = useState<
    { nodeId: string; x: number; y: number; startX: number; startY: number; moved: boolean; overId: string | null } | null
  >(null)
  const [planner, setPlanner] = useState<PlannerInfoT | null>(null)
  const [modal, setModal] = useState<{ kind: ModalKind; title: string } | null>(null)
  const [readonlyText, setReadonlyText] = useState('')

  const openReadonlyModal = (title: string, text: string) => {
    setReadonlyText(text)
    setModal({ kind: 'readonly', title })
  }

  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const dragRef = useRef<{ startX: number; startY: number; baseX: number; baseY: number } | null>(null)
  const fileRef = useRef<HTMLInputElement | null>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)

  const loadProjects = useCallback(async (k: string) => {
    const data = await api<{ projects: ProjectSummaryT[] }>(k, 'projects')
    setProjects(data.projects)
    api<{ planner: PlannerInfoT }>(k, 'status')
      .then((status) => setPlanner(status.planner))
      .catch(() => setPlanner(null))
    return data.projects
  }, [])

  const loadDrafts = useCallback(async (k: string, pid: string, bid: string) => {
    const data = await api<{ drafts: DraftT[] }>(
      k,
      `projects/${encodeURIComponent(pid)}/drafts?branch_id=${encodeURIComponent(bid)}`
    )
    setDrafts(data.drafts)
  }, [])

  const loadGraph = useCallback(
    async (k: string, pid: string, bid?: string) => {
      const query = bid ? `?branch_id=${encodeURIComponent(bid)}` : ''
      const data = await api<GraphResponseT>(k, `projects/${encodeURIComponent(pid)}/graph${query}`)
      setGraph(data)
      setBranchId(data.branch_id)
      await loadDrafts(k, pid, data.branch_id)
    },
    [loadDrafts]
  )

  useEffect(() => {
    // 恢复已保存的口令并自动登录;放入宏任务回调,避免在 effect 体内(同步路径)触发 setState
    const timer = window.setTimeout(() => {
      const saved = window.localStorage.getItem('novel-access-key')
      if (!saved) return
      loadProjects(saved)
        .then((list) => {
          setKey(saved)
          setAuthed(true)
          if (list.length > 0) {
            setProjectId(list[0].project_id)
            return loadGraph(saved, list[0].project_id)
          }
        })
        .catch(() => window.localStorage.removeItem('novel-access-key'))
    }, 0)
    return () => window.clearTimeout(timer)
  }, [loadProjects, loadGraph])

  // 折叠状态按 项目+分支 存 localStorage
  const collapseKey = projectId && branchId ? `novel-collapsed-${projectId}-${branchId}` : ''
  useEffect(() => {
    if (!collapseKey) return
    // 放入宏任务回调:effect 体内同步 setState 会触发级联渲染(react-hooks/set-state-in-effect)
    const timer = window.setTimeout(() => {
      try {
        const saved = window.localStorage.getItem(collapseKey)
        setCollapsed(new Set<string>(saved ? (JSON.parse(saved) as string[]) : []))
      } catch {
        setCollapsed(new Set())
      }
    }, 0)
    return () => window.clearTimeout(timer)
  }, [collapseKey])

  const persistCollapsed = (next: Set<string>) => {
    setCollapsed(next)
    if (!collapseKey) return
    try {
      window.localStorage.setItem(collapseKey, JSON.stringify([...next]))
    } catch {
      /* 存储不可用时仅保持内存状态 */
    }
  }

  const toggleCollapse = (nodeId: string) => {
    const next = new Set(collapsed)
    if (next.has(nodeId)) next.delete(nodeId)
    else next.add(nodeId)
    persistCollapsed(next)
  }

  const collapseAll = () => {
    const withChildren = new Set<string>()
    for (const laid of layout?.laid ?? []) {
      if (laid.childCount > 0) withChildren.add(laid.node.node_id)
    }
    // 折叠后子节点不再出现在 laid 中,需从完整边集重算
    for (const edge of graph?.graph.edges ?? []) {
      if (edge.type === 'contains') withChildren.add(edge.from_node_id)
    }
    persistCollapsed(withChildren)
  }

  useEffect(() => {
    if (!modal) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setModal(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [modal])

  const unlock = async () => {
    setBusy(true)
    setMessage('')
    try {
      const list = await loadProjects(key)
      window.localStorage.setItem('novel-access-key', key)
      setAuthed(true)
      if (list.length > 0) {
        setProjectId(list[0].project_id)
        await loadGraph(key, list[0].project_id)
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '验证失败')
    } finally {
      setBusy(false)
    }
  }

  const run = async (fn: () => Promise<void>) => {
    setBusy(true)
    setMessage('')
    try {
      await fn()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '操作失败')
    } finally {
      setBusy(false)
    }
  }

  const createProject = () =>
    run(async () => {
      const pid = window.prompt('项目 ID(小写字母数字连字符):')
      if (!pid) return
      const title = window.prompt('小说标题:') ?? pid
      const premise = window.prompt('一句话前提(可留空):') ?? undefined
      await api(key, 'projects', {
        method: 'POST',
        body: JSON.stringify({ project_id: pid, title, language: 'zh-CN', premise })
      })
      await loadProjects(key)
      setProjectId(pid)
      await loadGraph(key, pid)
    })

  const switchProject = (pid: string) =>
    run(async () => {
      setProjectId(pid)
      setSelected(null)
      setPlanResult(null)
      setDraftResult(null)
      setOpenDraftId(null)
      setModal(null)
      await loadGraph(key, pid)
    })

  const switchBranch = (bid: string) =>
    run(async () => {
      await api(key, `projects/${encodeURIComponent(projectId)}/branches/${encodeURIComponent(bid)}/activate`, {
        method: 'PATCH'
      })
      await loadGraph(key, projectId, bid)
    })

  const createBranch = () =>
    run(async () => {
      const bid = window.prompt('分支 ID:')
      if (!bid) return
      const name = window.prompt('分支名称:') ?? bid
      const purpose = window.prompt('分支目的:') ?? ''
      await api(key, `projects/${encodeURIComponent(projectId)}/branches`, {
        method: 'POST',
        body: JSON.stringify({ branch_id: bid, name, purpose })
      })
      await loadGraph(key, projectId)
    })

  const ingest = () =>
    run(async () => {
      if (!intakeText.trim()) return
      const result = await api<ToolResultT>(key, `projects/${encodeURIComponent(projectId)}/intake`, {
        method: 'POST',
        body: JSON.stringify({ text: intakeText, branch_id: branchId })
      })
      setIntakeText('')
      setPlanResult(result)
      await loadGraph(key, projectId, branchId)
    })

  const plan = () =>
    run(async () => {
      const result = await api<ToolResultT>(key, `projects/${encodeURIComponent(projectId)}/plan`, {
        method: 'POST',
        body: JSON.stringify({ branch_id: branchId })
      })
      setPlanResult(result)
    })

  const writeDraft = (kind: 'scene' | 'dialogue', focusNodeId?: string) =>
    run(async () => {
      const result = await api<ToolResultT>(key, `projects/${encodeURIComponent(projectId)}/drafts`, {
        method: 'POST',
        body: JSON.stringify({
          branch_id: branchId,
          kind,
          prompt: draftPrompt || undefined,
          focus_node_id: focusNodeId
        })
      })
      setDraftResult(result.draft)
      await loadDrafts(key, projectId, branchId)
    })

  const acceptDraft = (draftId: string) =>
    run(async () => {
      await api(key, `projects/${encodeURIComponent(projectId)}/drafts/${encodeURIComponent(draftId)}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'accepted' })
      })
      await loadGraph(key, projectId, branchId)
    })

  const removeDraft = (draftId: string, title: string) =>
    run(async () => {
      if (!window.confirm(`删除草稿「${title}」?`)) return
      await api(key, `projects/${encodeURIComponent(projectId)}/drafts/${encodeURIComponent(draftId)}`, {
        method: 'DELETE'
      })
      if (openDraftId === draftId) setOpenDraftId(null)
      await loadDrafts(key, projectId, branchId)
    })

  const exportAs = (format: string, extra = '') =>
    run(async () => {
      const data = await api<{ content: string }>(
        key,
        `projects/${encodeURIComponent(projectId)}/export?format=${format}&branch_id=${encodeURIComponent(branchId)}${extra}`
      )
      const extension = format === 'json' ? 'json' : format === 'opml' ? 'opml' : 'md'
      const blob = new Blob([data.content], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `${projectId}-${format}.${extension}`
      anchor.click()
      URL.revokeObjectURL(url)
    })

  const selectNode = (node: NodeT) => {
    setSelected(node)
    setEditLabel(node.label)
    setEditContent(node.content)
    setEditType(node.type)
  }

  const saveNode = () =>
    run(async () => {
      if (!selected) return
      await api(key, `projects/${encodeURIComponent(projectId)}/nodes/${encodeURIComponent(selected.node_id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ label: editLabel, content: editContent, type: editType, branch_id: branchId })
      })
      setSelected(null)
      setModal((current) => (current?.kind === 'node' ? null : current))
      await loadGraph(key, projectId, branchId)
    })

  const addChildNode = (parentNodeId: string | null, label: string, type?: string) =>
    run(async () => {
      if (!label.trim()) return
      await api(key, `projects/${encodeURIComponent(projectId)}/nodes`, {
        method: 'POST',
        body: JSON.stringify({ label: label.trim(), type, parent_node_id: parentNodeId, branch_id: branchId })
      })
      if (parentNodeId && collapsed.has(parentNodeId)) {
        const next = new Set(collapsed)
        next.delete(parentNodeId)
        persistCollapsed(next)
      }
      await loadGraph(key, projectId, branchId)
    })

  const promptAddChild = (parentNodeId: string | null, parentType?: string) => {
    const label = window.prompt(parentNodeId ? '子节点名称:' : '顶层节点名称:')
    if (!label) return
    addChildNode(parentNodeId, label, parentType ? childTypeFor(parentType) : undefined)
  }

  const addTemplateChildren = (parentNodeId: string, parentType: string) =>
    run(async () => {
      const preset = TEMPLATES[parentType]
      if (!preset) return
      for (const item of preset) {
        await api(key, `projects/${encodeURIComponent(projectId)}/nodes`, {
          method: 'POST',
          body: JSON.stringify({
            label: item.label,
            type: item.type,
            parent_node_id: parentNodeId,
            branch_id: branchId
          })
        })
      }
      const next = new Set(collapsed)
      next.delete(parentNodeId)
      persistCollapsed(next)
      await loadGraph(key, projectId, branchId)
    })

  const classifyNodes = () =>
    run(async () => {
      const data = await api<{
        source: 'model' | 'heuristic'
        suggestions: Array<{ node_id: string; label: string; current_type: string; suggested_type: string }>
      }>(key, `projects/${encodeURIComponent(projectId)}/classify?branch_id=${encodeURIComponent(branchId)}`)

      if (data.suggestions.length === 0) {
        setMessage(`分类完成:没有需要调整的节点(依据:${data.source === 'model' ? '模型' : '本地规则'})`)
        return
      }
      const preview = data.suggestions
        .slice(0, 20)
        .map((item) => `· ${item.label}:${typeMeta(item.current_type).name} → ${typeMeta(item.suggested_type).name}`)
        .join('\n')
      const more = data.suggestions.length > 20 ? `\n…另有 ${data.suggestions.length - 20} 项` : ''
      const confirmed = window.confirm(
        `依据${data.source === 'model' ? '模型' : '本地规则'}的分类建议(${data.suggestions.length} 项):\n\n${preview}${more}\n\n应用这些改动?`
      )
      if (!confirmed) return

      await api(key, `projects/${encodeURIComponent(projectId)}/classify`, {
        method: 'POST',
        body: JSON.stringify({
          branch_id: branchId,
          assignments: data.suggestions.map((item) => ({ node_id: item.node_id, type: item.suggested_type }))
        })
      })
      await loadGraph(key, projectId, branchId)
    })

  const setNodeStatus = (status: string) =>
    run(async () => {
      if (!selected) return
      await api(key, `projects/${encodeURIComponent(projectId)}/nodes/${encodeURIComponent(selected.node_id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ status, branch_id: branchId })
      })
      setSelected({ ...selected, status })
      await loadGraph(key, projectId, branchId)
    })

  const createEdge = (fromId: string, toId: string, type: string, label?: string) =>
    run(async () => {
      const post = (replace: boolean) =>
        api(key, `projects/${encodeURIComponent(projectId)}/edges`, {
          method: 'POST',
          body: JSON.stringify({
            from_node_id: fromId,
            to_node_id: toId,
            type,
            label,
            branch_id: branchId,
            replace_existing: replace
          })
        })
      try {
        await post(false)
      } catch (error) {
        // 顺序链是线性的:命中冲突时询问是否替换原连接,而不是静默丢弃
        const detail = error instanceof Error ? error.message : ''
        if (!detail.includes('顺序链是线性的')) throw error
        if (!window.confirm(`${detail}\n\n点「确定」替换,点「取消」保留原有顺序。`)) return
        await post(true)
      }
      await loadGraph(key, projectId, branchId)
    })

  const removeEdge = (edgeId: string) =>
    run(async () => {
      await api(
        key,
        `projects/${encodeURIComponent(projectId)}/edges/${encodeURIComponent(edgeId)}?branch_id=${encodeURIComponent(branchId)}`,
        { method: 'DELETE' }
      )
      if (selectedEdgeId === edgeId) setSelectedEdgeId(null)
      await loadGraph(key, projectId, branchId)
    })

  /** 拖拽连线松手后:选类型和标签 */
  const finishLink = (fromId: string, toId: string) => {
    const typeInput = window.prompt(
      '关系类型:\n  1 = 顺序(主线先后)\n  2 = 关系(角色/势力)\n  3 = 冲突\n  4 = 引用',
      '1'
    )
    if (!typeInput) return
    const type = { '1': 'next', '2': 'relation', '3': 'conflict', '4': 'reference' }[typeInput.trim()]
    if (!type) {
      setMessage('未识别的关系类型,已取消')
      return
    }
    const label = type === 'next' ? '' : window.prompt('关系标签(可留空,如「师徒」「宿敌」):') ?? ''
    createEdge(fromId, toId, type, label)
  }

  const reparentNode = (nodeId: string, parentNodeId: string | null) =>
    run(async () => {
      await api(key, `projects/${encodeURIComponent(projectId)}/nodes/${encodeURIComponent(nodeId)}`, {
        method: 'PATCH',
        body: JSON.stringify({ parent_node_id: parentNodeId, branch_id: branchId })
      })
      await loadGraph(key, projectId, branchId)
    })

  const deleteNode = () =>
    run(async () => {
      if (!selected) return
      const childCount = nodePositions.get(selected.node_id)?.childCount ?? 0
      const inherited = selected.branch_scope !== branchId
      const inheritedNote = inherited
        ? `\n\n注意:该节点继承自分支 ${selected.branch_scope},只会在当前分支 ${branchId} 隐藏,父分支保持不变。`
        : ''

      let cascade = false
      if (childCount > 0) {
        // 「确定」= 连子节点一起删,「取消」后再问是否只删自己
        cascade = window.confirm(
          `「${selected.label}」有 ${childCount} 个直接子节点。\n\n` +
            `点「确定」= 连同整棵子树一起删除\n点「取消」= 只删这一个,子节点上提到它的父级${inheritedNote}`
        )
        if (!cascade && !window.confirm(`只删除「${selected.label}」,把子节点上提到上一级?`)) {
          return
        }
      } else if (!window.confirm(`删除节点「${selected.label}」?关联的连线也会一并移除。${inheritedNote}`)) {
        return
      }

      await api(
        key,
        `projects/${encodeURIComponent(projectId)}/nodes/${encodeURIComponent(selected.node_id)}?branch_id=${encodeURIComponent(branchId)}&cascade=${cascade}`,
        { method: 'DELETE' }
      )
      setSelected(null)
      setModal((current) => (current?.kind === 'node' ? null : current))
      await loadGraph(key, projectId, branchId)
    })

  const importJsonFile = (file: File) =>
    run(async () => {
      const content = await file.text()
      let pid = ''
      try {
        const parsed = JSON.parse(content) as { project_id?: string }
        pid = parsed.project_id ?? ''
      } catch {
        throw new Error('不是合法的故事图谱 JSON 文件')
      }
      if (!pid) throw new Error('JSON 中缺少 project_id')
      await api(key, `projects/${encodeURIComponent(pid)}/import`, {
        method: 'POST',
        body: JSON.stringify({ format: 'json', content })
      })
      await loadProjects(key)
      setProjectId(pid)
      await loadGraph(key, pid)
    })

  const forest = useMemo(() => {
    if (!graph) return null
    return buildForest(graph.graph.nodes, graph.graph.edges)
  }, [graph])

  const filterActive = Boolean(search.trim() || filterType || filterStatus)

  /** 命中集合:关键词匹配名称或正文,叠加类型/状态筛选 */
  const matchedIds = useMemo(() => {
    if (!graph || !filterActive) return null
    const keyword = search.trim().toLowerCase()
    const hits = new Set<string>()
    for (const node of graph.graph.nodes) {
      if (filterType && node.type !== filterType) continue
      if (filterStatus && node.status !== filterStatus) continue
      if (
        keyword &&
        !node.label.toLowerCase().includes(keyword) &&
        !node.content.toLowerCase().includes(keyword)
      ) {
        continue
      }
      hits.add(node.node_id)
    }
    return hits
  }, [graph, search, filterType, filterStatus, filterActive])

  /** 命中节点的祖先链(用于自动展开,让命中项一定可见) */
  const matchedAncestors = useMemo(() => {
    if (!matchedIds || !forest) return null
    const chain = new Set<string>()
    for (const id of matchedIds) {
      let cursor = forest.parentOf.get(id)
      const guard = new Set<string>()
      while (cursor && !guard.has(cursor)) {
        guard.add(cursor)
        chain.add(cursor)
        cursor = forest.parentOf.get(cursor)
      }
    }
    return chain
  }, [matchedIds, forest])

  // 不手写 useMemo:依赖里有 Set/树结构,React Compiler 无法保留手动记忆化,
  // 交给它自动记忆化反而更稳(react-hooks/preserve-manual-memoization)。
  const layout = (() => {
    if (!graph || !forest) return null
    const project = projects.find((item) => item.project_id === projectId)
    // 搜索时临时展开命中节点的祖先链,保证命中项一定可见(不改动已保存的折叠状态)
    const effectiveCollapsed = matchedAncestors
      ? new Set([...collapsed].filter((id) => !matchedAncestors.has(id)))
      : collapsed
    return layoutTree(project?.title ?? projectId, forest.roots, effectiveCollapsed, forest.parentOf)
  })()

  const overriddenIds = useMemo(
    () => new Set(graph?.graph.overridden_node_ids ?? []),
    [graph]
  )

  const nodePositions = (() => {
    const map = new Map<string, LaidNode>()
    for (const laid of layout?.laid ?? []) {
      map.set(laid.node.node_id, laid)
    }
    return map
  })()

  const timeline = useMemo(() => {
    if (!graph || viewMode !== 'timeline') return null
    return layoutTimeline(graph.graph.nodes, graph.graph.edges)
  }, [graph, viewMode])

  /** 选中节点的非层级关系(双向) */
  const nodeEdges = useMemo(() => {
    if (!selected || !graph) return []
    const byId = new Map(graph.graph.nodes.map((node) => [node.node_id, node]))
    return graph.graph.edges
      .filter(
        (edge) =>
          edge.type !== 'contains' &&
          (edge.from_node_id === selected.node_id || edge.to_node_id === selected.node_id)
      )
      .map((edge) => ({
        edge,
        direction: edge.from_node_id === selected.node_id ? ('out' as const) : ('in' as const),
        other: byId.get(edge.from_node_id === selected.node_id ? edge.to_node_id : edge.from_node_id)
      }))
  }, [selected, graph])

  /** 图例仍按类型统计,数据源改为可见节点 */
  const typeCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const node of graph?.graph.nodes ?? []) {
      counts.set(node.type, (counts.get(node.type) ?? 0) + 1)
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1])
  }, [graph])

  /** 屏幕坐标 → 图坐标 */
  const toGraphPoint = (clientX: number, clientY: number) => {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return { x: 0, y: 0 }
    return { x: (clientX - rect.left - pan.x) / zoom, y: (clientY - rect.top - pan.y) / zoom }
  }

  /** 命中测试:落点位于哪个节点矩形内 */
  const nodeAt = (x: number, y: number, excludeId?: string) => {
    for (const laid of layout?.laid ?? []) {
      if (laid.node.node_id === excludeId) continue
      if (x >= laid.x && x <= laid.x + NODE_W && y >= laid.y && y <= laid.y + NODE_H) {
        return laid.node.node_id
      }
    }
    return null
  }

  const onNodePointerDown = (event: React.PointerEvent<SVGRectElement>, nodeId: string) => {
    // 阻止冒泡,避免触发画布平移
    event.stopPropagation()
    const point = toGraphPoint(event.clientX, event.clientY)
    setDragState({
      nodeId,
      x: point.x,
      y: point.y,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
      overId: null
    })
    ;(event.target as Element).releasePointerCapture?.(event.pointerId)
  }

  const onLinkPointerDown = (event: React.PointerEvent<SVGCircleElement>, nodeId: string) => {
    event.stopPropagation()
    const point = toGraphPoint(event.clientX, event.clientY)
    setLinkState({ fromId: nodeId, x: point.x, y: point.y, overId: null })
    ;(event.target as Element).releasePointerCapture?.(event.pointerId)
  }

  const onPointerDown = (event: React.PointerEvent<SVGSVGElement>) => {
    if (dragState || linkState) return
    setSelectedEdgeId(null)
    dragRef.current = { startX: event.clientX, startY: event.clientY, baseX: pan.x, baseY: pan.y }
  }

  const onPointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    if (linkState) {
      const point = toGraphPoint(event.clientX, event.clientY)
      setLinkState({ ...linkState, x: point.x, y: point.y, overId: nodeAt(point.x, point.y, linkState.fromId) })
      return
    }
    if (dragState) {
      const point = toGraphPoint(event.clientX, event.clientY)
      // 位移超过 5px 才算拖拽,避免单击被误判成「拖到空白 → 提升为顶层」
      const moved =
        dragState.moved ||
        Math.hypot(event.clientX - dragState.startX, event.clientY - dragState.startY) > 5
      setDragState({
        ...dragState,
        x: point.x,
        y: point.y,
        moved,
        overId: moved ? nodeAt(point.x, point.y, dragState.nodeId) : null
      })
      return
    }
    const drag = dragRef.current
    if (!drag) return
    setPan({ x: drag.baseX + (event.clientX - drag.startX), y: drag.baseY + (event.clientY - drag.startY) })
  }

  const onPointerUp = () => {
    if (linkState) {
      const { fromId, overId } = linkState
      setLinkState(null)
      if (overId) finishLink(fromId, overId)
      return
    }
    if (dragState) {
      const { nodeId, overId, moved } = dragState
      const currentParent = nodePositions.get(nodeId)?.parentId ?? null
      setDragState(null)
      // 拖到别的节点 => 挂到它下面;拖到空白 => 提升为顶层;未真正拖动则视为单击
      if (moved && overId !== currentParent) {
        reparentNode(nodeId, overId)
      }
      return
    }
    dragRef.current = null
  }

  if (!authed) {
    return (
      <div className="mx-auto max-w-sm px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">小说工坊</h1>
        <p className="mt-2 text-sm text-gray-500">输入访问口令,进入故事图谱编排</p>
        <input
          type="password"
          value={key}
          onChange={(event) => setKey(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') unlock()
          }}
          placeholder="访问口令"
          className="mt-6 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-slate-800 focus:border-blue-500 focus:outline-none"
        />
        <button
          onClick={unlock}
          disabled={busy || !key}
          className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {busy ? '验证中…' : '进入'}
        </button>
        {message && <p className="mt-3 text-sm text-red-500">{message}</p>}
      </div>
    )
  }

  return (
    // 全屏出血:突破博客 layout 的 max-w-5xl 限制,给思维导图更多横向空间
    <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen px-4 py-6 lg:px-8">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="mr-2 text-xl font-bold">小说工坊</h1>
        {planner && (
          <span
            title={
              planner.mode === 'model'
                ? `规划模型 ${planner.plan_model ?? '未配置'} / 写作模型 ${planner.write_model ?? '未配置'}${planner.base_host ? ` · ${planner.base_host}` : ''}`
                : '未配置 NOVEL_LLM_* 环境变量,建议与草稿由内置规则生成,非模型输出'
            }
            className={`rounded-full px-2 py-0.5 text-xs ${
              planner.mode === 'model'
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-amber-100 text-amber-700'
            }`}
          >
            {planner.mode === 'model'
              ? `模型模式 · 规划 ${planner.plan_model ?? '—'} / 写作 ${planner.write_model ?? '—'}`
              : '规则模式(未接模型)'}
          </span>
        )}
        <select
          value={projectId}
          onChange={(event) => switchProject(event.target.value)}
          className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-slate-800"
        >
          {projects.map((project) => (
            <option key={project.project_id} value={project.project_id}>
              {project.title}({project.nodes_count} 节点)
            </option>
          ))}
        </select>
        <button onClick={createProject} className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-slate-800 hover:bg-gray-100">
          + 新项目
        </button>
        <button
          onClick={() => fileRef.current?.click()}
          className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-slate-800 hover:bg-gray-100"
        >
          导入 JSON
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) importJsonFile(file)
            event.target.value = ''
          }}
        />
        {graph && (
          <>
            <span className="ml-2 text-sm text-gray-400">分支</span>
            <select
              value={branchId}
              onChange={(event) => switchBranch(event.target.value)}
              className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-slate-800"
            >
              {graph.graph.branches.map((branch) => (
                <option key={branch.branch_id} value={branch.branch_id}>
                  {branch.name}
                </option>
              ))}
            </select>
            <button onClick={createBranch} className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-slate-800 hover:bg-gray-100">
              + 分支
            </button>
            <button
              onClick={() => promptAddChild(null)}
              className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-slate-800 hover:bg-gray-100"
            >
              + 顶层节点
            </button>
            {(graph.graph.branch_chain?.length ?? 0) > 1 && (
              <span className="text-xs text-gray-400">
                分叉自 {graph.graph.branch_chain!.slice(1).join(' → ')}
              </span>
            )}
            <div className="ml-auto flex items-center gap-2">
              <div className="flex overflow-hidden rounded-md border border-gray-300">
                {(['mindmap', 'timeline'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`px-2 py-1 text-xs ${
                      viewMode === mode ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 hover:bg-gray-100'
                    }`}
                  >
                    {mode === 'mindmap' ? '思维导图' : '时间线'}
                  </button>
                ))}
              </div>
              <button onClick={() => setZoom((value) => Math.min(value * 1.2, 3))} className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-slate-800">
                +
              </button>
              <button onClick={() => setZoom((value) => Math.max(value / 1.2, 0.3))} className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-slate-800">
                −
              </button>
              <button
                onClick={() => {
                  setZoom(1)
                  setPan({ x: 0, y: 0 })
                }}
                className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-slate-800"
              >
                复位
              </button>
              <button
                onClick={() => persistCollapsed(new Set())}
                className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-600 hover:bg-gray-100"
              >
                全部展开
              </button>
              <button
                onClick={collapseAll}
                className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-600 hover:bg-gray-100"
              >
                全部折叠
              </button>
              <button
                onClick={classifyNodes}
                disabled={busy}
                title="让模型重新判定节点类型,预览后再决定是否应用"
                className="rounded-md border border-violet-300 bg-white px-2 py-1 text-xs text-violet-700 hover:bg-violet-50 disabled:opacity-50"
              >
                智能分类
              </button>
              <button
                onClick={() => exportAs('manuscript')}
                disabled={busy}
                title="按章节顺序拼接成稿:已采纳草稿优先,无正文时用节点大纲"
                className="rounded-md border border-emerald-300 bg-white px-2 py-1 text-xs text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
              >
                导出成稿
              </button>
              {(['markdown', 'mermaid', 'opml', 'json'] as const).map((format) => (
                <button
                  key={format}
                  onClick={() => exportAs(format)}
                  className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-600 hover:bg-gray-100"
                >
                  导出 {format}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* 搜索与筛选 */}
      {graph && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="搜索节点名称或正文…"
            className="w-56 rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-slate-800 focus:border-blue-500 focus:outline-none"
          />
          <select
            value={filterType}
            onChange={(event) => setFilterType(event.target.value)}
            className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-slate-800"
          >
            <option value="">全部类型</option>
            {typeCounts.map(([type, count]) => (
              <option key={type} value={type}>
                {typeMeta(type).name}({count})
              </option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(event) => setFilterStatus(event.target.value)}
            className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-slate-800"
          >
            <option value="">全部状态</option>
            {STATUS_ORDER.map((value) => (
              <option key={value} value={value}>
                {STATUS_META[value].name}
              </option>
            ))}
          </select>
          {filterActive && (
            <>
              <span className="text-xs text-gray-400">
                命中 {matchedIds?.size ?? 0} / {graph.graph.nodes.length}
              </span>
              <button
                onClick={() => {
                  setSearch('')
                  setFilterType('')
                  setFilterStatus('')
                }}
                className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-600 hover:bg-gray-100"
              >
                清除筛选
              </button>
            </>
          )}
        </div>
      )}

      {message && <p className="mt-2 text-sm text-red-500">{message}</p>}
      {busy && <p className="mt-2 text-sm text-gray-400">处理中…(模型生成可能需要 10-60 秒)</p>}

      {/* 放大浮层:居中盖在画布上方,外层 pointer-events-none 使画布其余部分仍可操作 */}
      {modal && (
        <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center p-4 sm:p-8">
          <div className="pointer-events-auto flex max-h-[82vh] w-full max-w-3xl flex-col rounded-xl border border-gray-300 bg-white text-slate-800 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2.5">
              <h3 className="truncate text-sm font-semibold">{modal.title}</h3>
              <button
                onClick={() => setModal(null)}
                className="shrink-0 rounded border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100"
              >
                还原
              </button>
            </div>
            {modal.kind === 'readonly' ? (
              <p className="flex-1 overflow-auto whitespace-pre-wrap p-4 text-sm leading-relaxed text-gray-700">
                {readonlyText}
              </p>
            ) : (
              <textarea
                autoFocus
                value={modal.kind === 'intake' ? intakeText : editContent}
                onChange={(event) =>
                  modal.kind === 'intake' ? setIntakeText(event.target.value) : setEditContent(event.target.value)
                }
                className="min-h-[50vh] flex-1 resize-none overflow-auto p-4 text-sm leading-relaxed text-gray-700 focus:outline-none"
              />
            )}
            <p className="border-t border-gray-100 px-4 py-1.5 text-xs text-gray-400">
              按 Esc 或点「还原」收起{modal.kind !== 'readonly' && ';编辑内容会同步回右侧面板'}
            </p>
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-4 lg:flex-row">
        <div className="h-[calc(100vh-16rem)] min-h-[520px] flex-1 overflow-hidden rounded-xl border border-gray-200 bg-white">
          {viewMode === 'timeline' && graph ? (
            timeline && timeline.chains.length > 0 ? (
              <svg
                ref={svgRef}
                width="100%"
                height="100%"
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerLeave={onPointerUp}
                className="cursor-grab touch-none select-none active:cursor-grabbing"
              >
                <defs>
                  <marker id="tl-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill={EDGE_META.next.color} />
                  </marker>
                </defs>
                <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
                  {timeline.chains.map((chain, row) => (
                    <text key={`row-${row}`} x={12} y={40 + row * (NODE_H + 56) - 8} fontSize={11} fill="#94a3b8">
                      线 {row + 1} · {chain.length} 节 · 起点「{chain[0].label}」
                    </text>
                  ))}
                  {timeline.laid.map((item, index) => {
                    const nextItem = timeline.laid[index + 1]
                    const sameRow = nextItem && nextItem.row === item.row
                    return (
                      <g
                        key={item.node.node_id}
                        opacity={!matchedIds || matchedIds.has(item.node.node_id) ? 1 : 0.25}
                      >
                        {sameRow && (
                          <line
                            x1={item.x + NODE_W}
                            y1={item.y + NODE_H / 2}
                            x2={nextItem.x}
                            y2={nextItem.y + NODE_H / 2}
                            stroke={EDGE_META.next.color}
                            strokeWidth={2}
                            markerEnd="url(#tl-arrow)"
                          />
                        )}
                        <rect
                          x={item.x}
                          y={item.y}
                          width={NODE_W}
                          height={NODE_H}
                          rx={8}
                          fill={item.node.branch_scope !== branchId ? '#f8fafc' : '#fff'}
                          stroke={selected?.node_id === item.node.node_id ? '#2563eb' : typeMeta(item.node.type).color}
                          strokeWidth={selected?.node_id === item.node.node_id ? 2.5 : 1.2}
                          className="cursor-pointer"
                          onClick={() => selectNode(item.node)}
                        />
                        <circle cx={item.x + 12} cy={item.y + NODE_H / 2} r={4} fill={typeMeta(item.node.type).color} pointerEvents="none" />
                        <text x={item.x + 24} y={item.y + NODE_H / 2 + 4} fontSize={12} fill="#334155" pointerEvents="none">
                          {item.node.label.length > 12 ? `${item.node.label.slice(0, 12)}…` : item.node.label}
                        </text>
                        <text x={item.x + NODE_W - 8} y={item.y + 14} fontSize={10} fill="#94a3b8" textAnchor="end" pointerEvents="none">
                          {item.index + 1}
                        </text>
                      </g>
                    )
                  })}
                </g>
              </svg>
            ) : (
              <div className="flex h-full items-center justify-center px-8 text-center text-sm text-gray-400">
                还没有顺序关系。在思维导图里拖节点底部的蓝色圆点到下一个节点,选「顺序」即可串成时间线。
              </div>
            )
          ) : layout && graph ? (
            <svg
              ref={svgRef}
              width="100%"
              height="100%"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerLeave={onPointerUp}
              className="cursor-grab touch-none select-none active:cursor-grabbing"
            >
              <defs>
                <marker
                  id="seq-arrow"
                  viewBox="0 0 10 10"
                  refX="9"
                  refY="5"
                  markerWidth="5"
                  markerHeight="5"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill={EDGE_META.next.color} />
                </marker>
              </defs>
              <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
                {/* 根 → 顶层节点 连线 */}
                {layout.laid
                  .filter((laid) => laid.parentId === null)
                  .map((laid) => (
                    <path
                      key={`root-${laid.node.node_id}`}
                      d={`M ${ROOT_X + ROOT_W} ${layout.rootY + NODE_H / 2} C ${ROOT_X + ROOT_W + 50} ${layout.rootY + NODE_H / 2}, ${laid.x - 50} ${laid.y + NODE_H / 2}, ${laid.x} ${laid.y + NODE_H / 2}`}
                      fill="none"
                      stroke="#cbd5e1"
                      strokeWidth={1.5}
                    />
                  ))}
                {/* 父 → 子 层级连线 */}
                {layout.laid.map((laid) => {
                  if (!laid.parentId) return null
                  const parent = nodePositions.get(laid.parentId)
                  if (!parent) return null
                  const x1 = parent.x + NODE_W
                  const y1 = parent.y + NODE_H / 2
                  const x2 = laid.x
                  const y2 = laid.y + NODE_H / 2
                  return (
                    <path
                      key={`tree-${laid.node.node_id}`}
                      d={`M ${x1} ${y1} C ${x1 + 48} ${y1}, ${x2 - 48} ${y2}, ${x2} ${y2}`}
                      fill="none"
                      stroke={typeMeta(laid.node.type).color}
                      strokeOpacity={0.45}
                      strokeWidth={1.5}
                    />
                  )
                })}
                {/* 非层级关系边:next 走左侧竖向带箭头,其余走右侧曲线 */}
                {graph.graph.edges
                  .filter((edge) => edge.type !== 'contains')
                  .map((edge) => {
                    const from = nodePositions.get(edge.from_node_id)
                    const to = nodePositions.get(edge.to_node_id)
                    if (!from || !to) return null
                    const meta = edgeMeta(edge.type)
                    const isSelected = selectedEdgeId === edge.edge_id

                    if (edge.type === 'next') {
                      // 顺序链:从上一节点底部连到下一节点顶部,箭头指向后继
                      const x1 = from.x + NODE_W / 2
                      const y1 = from.y + NODE_H
                      const x2 = to.x + NODE_W / 2
                      const y2 = to.y
                      const mid = (y1 + y2) / 2
                      return (
                        <g key={edge.edge_id} className="cursor-pointer" onClick={() => setSelectedEdgeId(edge.edge_id)}>
                          <path
                            d={`M ${x1} ${y1} C ${x1} ${mid}, ${x2} ${mid}, ${x2} ${y2}`}
                            fill="none"
                            stroke={meta.color}
                            strokeWidth={isSelected ? 3 : 2}
                            markerEnd="url(#seq-arrow)"
                          />
                          {edge.label && (
                            <text x={(x1 + x2) / 2 + 6} y={mid} fontSize={10} fill={meta.color}>
                              {edge.label}
                            </text>
                          )}
                        </g>
                      )
                    }

                    const x1 = from.x + NODE_W
                    const y1 = from.y + NODE_H / 2
                    const x2 = to.x + NODE_W
                    const y2 = to.y + NODE_H / 2
                    const bend = 60 + Math.abs(y2 - y1) / 4
                    return (
                      <g key={edge.edge_id} className="cursor-pointer" onClick={() => setSelectedEdgeId(edge.edge_id)}>
                        <path
                          d={`M ${x1} ${y1} C ${x1 + bend} ${y1}, ${x2 + bend} ${y2}, ${x2} ${y2}`}
                          fill="none"
                          stroke={meta.color}
                          strokeDasharray={meta.dashed ? '4 3' : undefined}
                          strokeWidth={isSelected ? 2.6 : 1.4}
                        />
                        {edge.label && (
                          <text x={Math.max(x1, x2) + bend - 4} y={(y1 + y2) / 2} fontSize={10} fill={meta.color}>
                            {edge.label}
                          </text>
                        )}
                      </g>
                    )
                  })}
                {/* 连线预览 */}
                {linkState && nodePositions.get(linkState.fromId) && (
                  <path
                    d={`M ${nodePositions.get(linkState.fromId)!.x + NODE_W / 2} ${nodePositions.get(linkState.fromId)!.y + NODE_H} L ${linkState.x} ${linkState.y}`}
                    stroke="#0ea5e9"
                    strokeWidth={2}
                    strokeDasharray="5 4"
                    fill="none"
                  />
                )}
                {/* 拖拽时的指示线 */}
                {dragState && nodePositions.get(dragState.nodeId) && (
                  <path
                    d={`M ${nodePositions.get(dragState.nodeId)!.x + NODE_W / 2} ${nodePositions.get(dragState.nodeId)!.y + NODE_H / 2} L ${dragState.x} ${dragState.y}`}
                    stroke="#2563eb"
                    strokeWidth={2}
                    strokeDasharray="5 4"
                    fill="none"
                  />
                )}
                {/* 根节点(项目标题) */}
                <g
                  onPointerEnter={() => setHoverNodeId('__root__')}
                  onPointerLeave={() => setHoverNodeId((current) => (current === '__root__' ? null : current))}
                >
                  {/* 透明命中区,连通根节点与右侧「+」 */}
                  <rect
                    x={ROOT_X - 4}
                    y={layout.rootY - 6}
                    width={ROOT_W + 34}
                    height={NODE_H + 12}
                    fill="transparent"
                  />
                  <rect x={ROOT_X} y={layout.rootY} width={ROOT_W} height={NODE_H} rx={12} fill="#1e293b" />
                  <text
                    x={ROOT_X + ROOT_W / 2}
                    y={layout.rootY + NODE_H / 2 + 4}
                    textAnchor="middle"
                    fontSize={13}
                    fill="#fff"
                    pointerEvents="none"
                  >
                    {layout.title.length > 10 ? `${layout.title.slice(0, 10)}…` : layout.title}
                  </text>
                  {hoverNodeId === '__root__' && !dragState && (
                    <g className="cursor-pointer" onClick={() => promptAddChild(null)}>
                      <circle cx={ROOT_X + ROOT_W + 12} cy={layout.rootY + NODE_H / 2} r={9} fill="#2563eb" />
                      <text
                        x={ROOT_X + ROOT_W + 12}
                        y={layout.rootY + NODE_H / 2 + 4}
                        textAnchor="middle"
                        fontSize={13}
                        fill="#fff"
                        pointerEvents="none"
                      >
                        +
                      </text>
                    </g>
                  )}
                </g>
                {/* 内容节点 */}
                {layout.laid.map((laid) => {
                  const meta = typeMeta(laid.node.type)
                  const nodeId = laid.node.node_id
                  const isSelected = selected?.node_id === nodeId
                  const isInherited = laid.node.branch_scope !== branchId
                  const isOverridden = overriddenIds.has(nodeId)
                  const isDropTarget = dragState?.overId === nodeId || linkState?.overId === nodeId
                  const isDragging = dragState?.nodeId === nodeId
                  const isMatched = !matchedIds || matchedIds.has(nodeId)
                  const status = statusMeta(laid.node.status)
                  return (
                    <g
                      key={nodeId}
                      opacity={isDragging ? 0.4 : isMatched ? 1 : 0.25}
                      onPointerEnter={() => setHoverNodeId(nodeId)}
                      onPointerLeave={() => setHoverNodeId((current) => (current === nodeId ? null : current))}
                    >
                      {/* 透明命中区:把节点与右侧「+」连成一片,避免鼠标经过空隙时 hover 中断 */}
                      <rect
                        x={laid.x - 4}
                        y={laid.y - 6}
                        width={NODE_W + 44}
                        height={NODE_H + 12}
                        fill="transparent"
                      />
                      <rect
                        x={laid.x}
                        y={laid.y}
                        width={NODE_W}
                        height={NODE_H}
                        rx={8}
                        fill={isDropTarget ? '#eff6ff' : isInherited ? '#f8fafc' : '#fff'}
                        stroke={
                          linkState?.overId === nodeId
                            ? '#0ea5e9'
                            : isDropTarget || isSelected
                              ? '#2563eb'
                              : meta.color
                        }
                        strokeWidth={isDropTarget ? 3 : isSelected ? 2.5 : 1.2}
                        strokeDasharray={isInherited ? '4 3' : undefined}
                        className="cursor-grab"
                        onPointerDown={(event) => onNodePointerDown(event, nodeId)}
                        onClick={() => selectNode(laid.node)}
                      />
                      {/* 命中高亮外框 */}
                      {matchedIds && isMatched && (
                        <rect
                          x={laid.x - 3}
                          y={laid.y - 3}
                          width={NODE_W + 6}
                          height={NODE_H + 6}
                          rx={10}
                          fill="none"
                          stroke="#facc15"
                          strokeWidth={3}
                          pointerEvents="none"
                        />
                      )}
                      {/* 状态条:左侧竖线,颜色/线型表示定稿程度 */}
                      <line
                        x1={laid.x + 3}
                        y1={laid.y + 7}
                        x2={laid.x + 3}
                        y2={laid.y + NODE_H - 7}
                        stroke={status.color}
                        strokeWidth={3}
                        strokeDasharray={status.dash}
                        pointerEvents="none"
                      >
                        <title>{status.name}</title>
                      </line>
                      {isOverridden && <circle cx={laid.x + NODE_W - 8} cy={laid.y + 8} r={3.5} fill="#2563eb" />}
                      <circle cx={laid.x + 14} cy={laid.y + NODE_H / 2} r={4} fill={meta.color} pointerEvents="none" />
                      <text
                        x={laid.x + 26}
                        y={laid.y + NODE_H / 2 + 4}
                        fontSize={12}
                        fill="#334155"
                        pointerEvents="none"
                      >
                        {laid.node.label.length > 12 ? `${laid.node.label.slice(0, 12)}…` : laid.node.label}
                      </text>
                      {/* 折叠/展开手柄 */}
                      {laid.childCount > 0 && (
                        <g className="cursor-pointer" onClick={() => toggleCollapse(nodeId)}>
                          <circle
                            cx={laid.x + NODE_W}
                            cy={laid.y + NODE_H / 2}
                            r={8}
                            fill="#fff"
                            stroke={meta.color}
                            strokeWidth={1.2}
                          />
                          <text
                            x={laid.x + NODE_W}
                            y={laid.y + NODE_H / 2 + 3.5}
                            textAnchor="middle"
                            fontSize={laid.collapsed ? 10 : 12}
                            fill={meta.color}
                            pointerEvents="none"
                          >
                            {laid.collapsed ? laid.childCount : '−'}
                          </text>
                        </g>
                      )}
                      {/* 悬停时的底部手柄:拖到目标节点建立关系边 */}
                      {(hoverNodeId === nodeId || linkState?.fromId === nodeId) && !dragState && (
                        <circle
                          cx={laid.x + NODE_W / 2}
                          cy={laid.y + NODE_H}
                          r={6}
                          fill="#fff"
                          stroke="#0ea5e9"
                          strokeWidth={2}
                          className="cursor-crosshair"
                          onPointerDown={(event) => onLinkPointerDown(event, nodeId)}
                        >
                          <title>拖到另一个节点建立关系(顺序/关系/冲突/引用)</title>
                        </circle>
                      )}
                      {/* 悬停时的「+」:新建子节点 */}
                      {hoverNodeId === nodeId && !dragState && !linkState && (
                        <g className="cursor-pointer" onClick={() => promptAddChild(nodeId, laid.node.type)}>
                          <circle cx={laid.x + NODE_W + 26} cy={laid.y + NODE_H / 2} r={9} fill="#2563eb" />
                          <text
                            x={laid.x + NODE_W + 26}
                            y={laid.y + NODE_H / 2 + 4}
                            textAnchor="middle"
                            fontSize={13}
                            fill="#fff"
                            pointerEvents="none"
                          >
                            +
                          </text>
                        </g>
                      )}
                    </g>
                  )
                })}
              </g>
            </svg>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-gray-400">
              {projects.length === 0 ? '还没有项目,点击「+ 新项目」开始' : '加载图谱中…'}
            </div>
          )}
        </div>

        <div className="w-full space-y-4 lg:w-96">
          {typeCounts.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-4 text-slate-800">
              <h2 className="text-sm font-semibold text-gray-500">图例 · 节点类型</h2>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5">
                {typeCounts.map(([type, count]) => {
                  const meta = typeMeta(type)
                  return (
                    <span key={type} className="flex items-center gap-1.5 text-xs">
                      <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: meta.color }} />
                      {meta.name}
                      <span className="text-gray-400">{count}</span>
                    </span>
                  )
                })}
              </div>
              <div className="mt-2 space-y-1 border-t border-gray-100 pt-2 text-xs text-gray-400">
                <p>悬停节点点「+」加子节点;拖节点本体改挂父级(拖到空白处提升为顶层);拖底部蓝点到另一节点建立关系;右侧圆圈折叠/展开。</p>
                <p>类型由输入文本自动判定,可在节点详情中修改。</p>
              </div>
              <div className="mt-2 border-t border-gray-100 pt-2">
                <p className="text-xs text-gray-400">节点状态(左侧竖条)</p>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                  {STATUS_ORDER.map((value) => {
                    const meta = STATUS_META[value]
                    return (
                      <span key={value} className="flex items-center gap-1 text-xs">
                        <svg width="6" height="12">
                          <line
                            x1="3"
                            y1="0"
                            x2="3"
                            y2="12"
                            stroke={meta.color}
                            strokeWidth="3"
                            strokeDasharray={meta.dash}
                          />
                        </svg>
                        {meta.name}
                      </span>
                    )
                  })}
                </div>
              </div>
              <div className="mt-2 border-t border-gray-100 pt-2">
                <p className="text-xs text-gray-400">关系线</p>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                  {EDGE_TYPES.map((type) => {
                    const meta = edgeMeta(type)
                    return (
                      <span key={type} className="flex items-center gap-1 text-xs">
                        <svg width="18" height="6">
                          <line
                            x1="0"
                            y1="3"
                            x2="18"
                            y2="3"
                            stroke={meta.color}
                            strokeWidth="2"
                            strokeDasharray={meta.dashed ? '3 2' : undefined}
                          />
                        </svg>
                        {meta.name}
                        {type === 'next' && <span className="text-gray-400">(带箭头,决定排序)</span>}
                      </span>
                    )
                  })}
                </div>
                <p>
                  <span className="mr-1 inline-block h-2.5 w-4 rounded-sm border border-dashed border-gray-400 bg-slate-50 align-middle" />
                  虚线灰底 = 继承自父分支(改动会自动生成本分支副本)
                  <span className="ml-2 mr-1 inline-block h-2 w-2 rounded-full bg-blue-600 align-middle" />
                  = 本分支已覆写
                </p>
              </div>
            </div>
          )}

          {selected && (
            <div className="rounded-xl border border-blue-300 bg-white p-4 text-slate-800">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block rounded px-1.5 py-0.5 text-xs text-white"
                    style={{ backgroundColor: typeMeta(selected.type).color }}
                  >
                    {typeMeta(selected.type).name}
                  </span>
                  <h2 className="text-sm font-semibold text-gray-500">节点详情</h2>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <ExpandButton
                    onClick={() => setModal({ kind: 'node', title: `编辑节点正文 · ${editLabel}` })}
                    label="放大编辑"
                  />
                  <button
                    onClick={() => {
                      setSelected(null)
                      setModal((current) => (current?.kind === 'node' ? null : current))
                    }}
                    className="text-sm text-gray-400 hover:text-gray-600"
                  >
                    关闭
                  </button>
                </div>
              </div>
              <input
                value={editLabel}
                onChange={(event) => setEditLabel(event.target.value)}
                className="mt-2 w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm font-semibold text-slate-800 focus:border-blue-500 focus:outline-none"
              />
              <select
                value={editType}
                onChange={(event) => setEditType(event.target.value)}
                className="mt-2 w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-slate-800"
              >
                {SELECTABLE_TYPES.map(([value, meta]) => (
                  <option key={value} value={value}>
                    {meta.name}
                  </option>
                ))}
                {!TYPE_META[editType] && <option value={editType}>{editType}</option>}
              </select>
              <textarea
                value={editContent}
                onChange={(event) => setEditContent(event.target.value)}
                rows={7}
                className="mt-2 w-full rounded-md border border-gray-300 bg-white p-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none"
              />
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-gray-400">状态</span>
                {STATUS_ORDER.map((value) => {
                  const meta = STATUS_META[value]
                  const active = selected.status === value
                  return (
                    <button
                      key={value}
                      onClick={() => setNodeStatus(value)}
                      disabled={busy || active}
                      className="rounded border px-2 py-0.5 text-xs disabled:opacity-100"
                      style={{
                        borderColor: meta.color,
                        backgroundColor: active ? meta.color : 'transparent',
                        color: active ? '#fff' : meta.color
                      }}
                    >
                      {meta.name}
                    </button>
                  )
                })}
              </div>
              <p className="mt-1 text-xs text-gray-400">
                来源分支 {selected.branch_scope}
                {selected.branch_scope !== branchId && (
                  <span className="ml-1 text-amber-600">(继承,保存后将在 {branchId} 生成副本)</span>
                )}
                {overriddenIds.has(selected.node_id) && <span className="ml-1 text-blue-600">(本分支已覆写)</span>}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  onClick={saveNode}
                  disabled={busy}
                  className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  保存
                </button>
                <button
                  onClick={() => promptAddChild(selected.node_id, selected.type)}
                  disabled={busy}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  + 子节点
                </button>
                <button
                  onClick={() => reparentNode(selected.node_id, null)}
                  disabled={busy || !nodePositions.get(selected.node_id)?.parentId}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-gray-50 disabled:opacity-50"
                  title="脱离当前父节点,变成顶层节点"
                >
                  提升为顶层
                </button>
                <button
                  onClick={deleteNode}
                  disabled={busy}
                  className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  删除节点
                </button>
              </div>
              {/* 针对该节点生成草稿:上下文自动裁剪为它的子树+祖先链+关联节点 */}
              <div className="mt-2 border-t border-gray-100 pt-2">
                <p className="text-xs text-gray-400">为此节点写正文(上下文自动聚焦到它所在的章节与关联角色)</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  <button
                    onClick={() => writeDraft('scene', selected.node_id)}
                    disabled={busy}
                    className="rounded border border-emerald-300 px-2 py-0.5 text-xs text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
                  >
                    生成场景
                  </button>
                  <button
                    onClick={() => writeDraft('dialogue', selected.node_id)}
                    disabled={busy}
                    className="rounded border border-emerald-300 px-2 py-0.5 text-xs text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
                  >
                    生成对白
                  </button>
                </div>
              </div>

              {/* 关系管理 */}
              <div className="mt-2 border-t border-gray-100 pt-2">
                <p className="text-xs text-gray-400">关系(不含层级)</p>
                {nodeEdges.length > 0 && (
                  <ul className="mt-1 space-y-1">
                    {nodeEdges.map(({ edge, other, direction }) => {
                      const meta = edgeMeta(edge.type)
                      return (
                        <li key={edge.edge_id} className="flex items-center justify-between gap-2 text-xs">
                          <span className="truncate">
                            <span style={{ color: meta.color }}>{meta.name}</span>
                            <span className="mx-1 text-gray-400">{direction === 'out' ? '→' : '←'}</span>
                            {other?.label ?? other?.node_id ?? '?'}
                            {edge.label && <span className="ml-1 text-gray-400">({edge.label})</span>}
                          </span>
                          <button
                            onClick={() => removeEdge(edge.edge_id)}
                            disabled={busy}
                            className="shrink-0 rounded border border-gray-300 px-1.5 py-0.5 text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                          >
                            删
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                )}
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <select
                    value={linkType}
                    onChange={(event) => setLinkType(event.target.value)}
                    className="rounded border border-gray-300 bg-white px-1.5 py-0.5 text-xs text-slate-800"
                  >
                    {EDGE_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {edgeMeta(type).name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={linkTargetId}
                    onChange={(event) => setLinkTargetId(event.target.value)}
                    className="max-w-[10rem] rounded border border-gray-300 bg-white px-1.5 py-0.5 text-xs text-slate-800"
                  >
                    <option value="">选择目标节点…</option>
                    {(graph?.graph.nodes ?? [])
                      .filter((node) => node.node_id !== selected.node_id)
                      .map((node) => (
                        <option key={node.node_id} value={node.node_id}>
                          {node.label}
                        </option>
                      ))}
                  </select>
                  <input
                    value={linkLabel}
                    onChange={(event) => setLinkLabel(event.target.value)}
                    placeholder="标签(可空)"
                    className="w-24 rounded border border-gray-300 bg-white px-1.5 py-0.5 text-xs text-slate-800"
                  />
                  <button
                    onClick={() => {
                      if (!linkTargetId) return
                      createEdge(selected.node_id, linkTargetId, linkType, linkLabel)
                      setLinkTargetId('')
                      setLinkLabel('')
                    }}
                    disabled={busy || !linkTargetId}
                    className="rounded border border-blue-300 px-2 py-0.5 text-xs text-blue-700 hover:bg-blue-50 disabled:opacity-50"
                  >
                    添加关系
                  </button>
                </div>
              </div>

              {TEMPLATES[selected.type] && (
                <div className="mt-2 border-t border-gray-100 pt-2">
                  <p className="text-xs text-gray-400">
                    快捷模板:一键为「{typeMeta(selected.type).name}」补齐常用子节点
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    <button
                      onClick={() => addTemplateChildren(selected.node_id, selected.type)}
                      disabled={busy}
                      className="rounded border border-blue-300 px-2 py-0.5 text-xs text-blue-700 hover:bg-blue-50 disabled:opacity-50"
                    >
                      + {TEMPLATES[selected.type].map((item) => item.label).join(' / ')}
                    </button>
                    {TEMPLATES[selected.type].map((item) => (
                      <button
                        key={item.label}
                        onClick={() => addChildNode(selected.node_id, item.label, item.type)}
                        disabled={busy}
                        className="rounded border border-gray-300 px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                      >
                        + {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="rounded-xl border border-gray-200 bg-white p-4 text-slate-800">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">输入设定 / 剧情</h2>
              <ExpandButton onClick={() => setModal({ kind: 'intake', title: '输入设定 / 剧情' })} label="放大编辑" />
            </div>
            <textarea
              value={intakeText}
              onChange={(event) => setIntakeText(event.target.value)}
              rows={5}
              placeholder="粘贴或输入设定、角色、剧情片段…系统会自动归类为图谱节点"
              className="mt-2 w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
            />
            <div className="mt-2 flex gap-2">
              <button
                onClick={ingest}
                disabled={busy || !projectId || !intakeText.trim()}
                className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
              >
                写入图谱
              </button>
              <button
                onClick={plan}
                disabled={busy || !projectId}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
              >
                下一步建议
              </button>
            </div>
            {planResult && (
              <div className="mt-3 rounded-lg bg-blue-50 p-3 text-sm">
                <p className="text-gray-600">{planResult.summary}</p>
                {planResult.next_question && <p className="mt-1 font-medium text-blue-700">{planResult.next_question}</p>}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 text-slate-800">
            <h2 className="font-semibold">草稿生成</h2>
            <input
              value={draftPrompt}
              onChange={(event) => setDraftPrompt(event.target.value)}
              placeholder="写作提示,如:主角初见反派"
              className="mt-2 w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
            />
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => writeDraft('scene')}
                disabled={busy || !projectId}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
              >
                场景草稿
              </button>
              <button
                onClick={() => writeDraft('dialogue')}
                disabled={busy || !projectId}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
              >
                对白草稿
              </button>
            </div>
            {draftResult && (
              <div className="mt-3 rounded-lg bg-emerald-50 p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-emerald-800">{draftResult.title}</p>
                  <ExpandButton onClick={() => openReadonlyModal(draftResult.title, draftResult.content)} />
                </div>
                <p className="mt-1 max-h-56 overflow-auto whitespace-pre-wrap text-sm text-gray-700">{draftResult.content}</p>
                <p className="mt-1 text-xs text-emerald-700">已自动保存到下方草稿箱</p>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 text-slate-800">
            <h2 className="font-semibold">
              草稿箱 <span className="text-xs font-normal text-gray-400">分支 {branchId} · {drafts.length} 篇</span>
            </h2>
            {drafts.length === 0 ? (
              <p className="mt-2 text-sm text-gray-400">还没有草稿。生成的场景/对白会自动保存在这里。</p>
            ) : (
              <ul className="mt-2 divide-y divide-gray-100">
                {drafts.map((draft) => {
                  const id = draft.draft_id ?? ''
                  const isOpen = openDraftId === id
                  return (
                    <li key={id} className="py-2">
                      <div className="flex items-start justify-between gap-2">
                        <button
                          onClick={() => setOpenDraftId(isOpen ? null : id)}
                          className="flex-1 text-left text-sm hover:text-blue-600"
                        >
                          <span className="mr-1 text-xs text-gray-400">
                            {draft.kind === 'dialogue' ? '对白' : draft.kind === 'scene' ? '场景' : draft.kind}
                          </span>
                          {draft.title}
                          {draft.status === 'accepted' && <span className="ml-1 text-xs text-emerald-600">已采纳</span>}
                          {draft.status === 'rejected' && <span className="ml-1 text-xs text-gray-400">已弃用</span>}
                        </button>
                        <div className="flex shrink-0 gap-1">
                          {draft.status !== 'accepted' && (
                            <button
                              onClick={() => acceptDraft(id)}
                              disabled={busy}
                              className="rounded border border-emerald-300 px-1.5 py-0.5 text-xs text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
                            >
                              采纳
                            </button>
                          )}
                          <button
                            onClick={() => removeDraft(id, draft.title)}
                            disabled={busy}
                            className="rounded border border-gray-300 px-1.5 py-0.5 text-xs text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                          >
                            删除
                          </button>
                        </div>
                      </div>
                      {isOpen && (
                        <div className="relative mt-1">
                          <div className="absolute right-1 top-1">
                            <ExpandButton onClick={() => openReadonlyModal(draft.title, draft.content)} />
                          </div>
                          <p className="max-h-64 overflow-auto whitespace-pre-wrap rounded bg-gray-50 p-2 pr-10 text-sm text-gray-700">
                            {draft.content}
                          </p>
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
