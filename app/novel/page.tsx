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
}

interface ProjectSummaryT {
  project_id: string
  title: string
  genre?: string
  nodes_count: number
  active_branch_id: string
}

interface DraftT {
  kind: string
  title: string
  content: string
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
  graph: { branches: BranchT[]; nodes: NodeT[]; edges: EdgeT[] }
}

const TYPE_META: Record<string, { name: string; color: string }> = {
  worldbuilding: { name: '世界观', color: '#0ea5e9' },
  character: { name: '角色', color: '#f59e0b' },
  relationship: { name: '关系', color: '#ec4899' },
  plot: { name: '主线剧情', color: '#ef4444' },
  chapter: { name: '章节', color: '#8b5cf6' },
  scene: { name: '场景', color: '#10b981' },
  branch_note: { name: '分支设定', color: '#6366f1' },
  outline: { name: '大纲', color: '#14b8a6' },
  intake: { name: '素材', color: '#64748b' }
}

function typeMeta(type: string) {
  return TYPE_META[type] ?? { name: type, color: '#94a3b8' }
}

interface LaidNode {
  node: NodeT
  x: number
  y: number
}

interface LaidGroup {
  type: string
  x: number
  y: number
  nodes: LaidNode[]
}

const NODE_W = 168
const NODE_H = 40
const GROUP_W = 120
const V_GAP = 12
const ROOT_W = 150

function layoutMindmap(title: string, nodes: NodeT[]) {
  const byType = new Map<string, NodeT[]>()
  for (const node of nodes) {
    const list = byType.get(node.type) ?? []
    list.push(node)
    byType.set(node.type, list)
  }
  const order = [...byType.keys()].sort(
    (a, b) => (byType.get(b)?.length ?? 0) - (byType.get(a)?.length ?? 0)
  )

  const groups: LaidGroup[] = []
  let cursorY = 40
  const groupX = ROOT_W + 100
  const nodeX = groupX + GROUP_W + 90
  for (const type of order) {
    const members = byType.get(type) ?? []
    const blockH = Math.max(members.length * (NODE_H + V_GAP), NODE_H + V_GAP)
    const laid: LaidNode[] = members.map((node, index) => ({
      node,
      x: nodeX,
      y: cursorY + index * (NODE_H + V_GAP)
    }))
    groups.push({ type, x: groupX, y: cursorY + blockH / 2 - NODE_H / 2, nodes: laid })
    cursorY += blockH + 28
  }

  const height = Math.max(cursorY + 20, 360)
  const rootY = height / 2 - NODE_H / 2
  const width = nodeX + NODE_W + 60
  return { groups, rootY, width, height, title }
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

  const [intakeText, setIntakeText] = useState('')
  const [planResult, setPlanResult] = useState<ToolResultT | null>(null)
  const [draftPrompt, setDraftPrompt] = useState('')
  const [draftResult, setDraftResult] = useState<DraftT | null>(null)

  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const dragRef = useRef<{ startX: number; startY: number; baseX: number; baseY: number } | null>(null)
  const fileRef = useRef<HTMLInputElement | null>(null)

  const loadProjects = useCallback(async (k: string) => {
    const data = await api<{ projects: ProjectSummaryT[] }>(k, 'projects')
    setProjects(data.projects)
    return data.projects
  }, [])

  const loadGraph = useCallback(
    async (k: string, pid: string, bid?: string) => {
      const query = bid ? `?branch_id=${encodeURIComponent(bid)}` : ''
      const data = await api<GraphResponseT>(k, `projects/${encodeURIComponent(pid)}/graph${query}`)
      setGraph(data)
      setBranchId(data.branch_id)
    },
    []
  )

  useEffect(() => {
    const saved = window.localStorage.getItem('novel-access-key')
    if (saved) {
      setKey(saved)
      loadProjects(saved)
        .then((list) => {
          setAuthed(true)
          if (list.length > 0) {
            setProjectId(list[0].project_id)
            return loadGraph(saved, list[0].project_id)
          }
        })
        .catch(() => window.localStorage.removeItem('novel-access-key'))
    }
  }, [loadProjects, loadGraph])

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

  const writeDraft = (kind: 'scene' | 'dialogue') =>
    run(async () => {
      const result = await api<ToolResultT>(key, `projects/${encodeURIComponent(projectId)}/drafts`, {
        method: 'POST',
        body: JSON.stringify({ branch_id: branchId, kind, prompt: draftPrompt || undefined })
      })
      setDraftResult(result.draft)
    })

  const exportAs = (format: string) =>
    run(async () => {
      const data = await api<{ content: string }>(
        key,
        `projects/${encodeURIComponent(projectId)}/export?format=${format}`
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

  const layout = useMemo(() => {
    if (!graph) return null
    const project = projects.find((item) => item.project_id === projectId)
    return layoutMindmap(project?.title ?? projectId, graph.graph.nodes)
  }, [graph, projects, projectId])

  const nodePositions = useMemo(() => {
    const map = new Map<string, LaidNode>()
    if (layout) {
      for (const group of layout.groups) {
        for (const laid of group.nodes) {
          map.set(laid.node.node_id, laid)
        }
      }
    }
    return map
  }, [layout])

  const onPointerDown = (event: React.PointerEvent<SVGSVGElement>) => {
    dragRef.current = { startX: event.clientX, startY: event.clientY, baseX: pan.x, baseY: pan.y }
  }
  const onPointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    const drag = dragRef.current
    if (!drag) return
    setPan({ x: drag.baseX + (event.clientX - drag.startX), y: drag.baseY + (event.clientY - drag.startY) })
  }
  const onPointerUp = () => {
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
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="mr-2 text-xl font-bold">小说工坊</h1>
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
            <div className="ml-auto flex items-center gap-2">
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

      {message && <p className="mt-2 text-sm text-red-500">{message}</p>}
      {busy && <p className="mt-2 text-sm text-gray-400">处理中…</p>}

      <div className="mt-4 flex flex-col gap-4 lg:flex-row">
        <div className="min-h-[420px] flex-1 overflow-hidden rounded-xl border border-gray-200 bg-white">
          {layout && graph ? (
            <svg
              width="100%"
              height={Math.max(layout.height, 480)}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerLeave={onPointerUp}
              className="cursor-grab touch-none select-none active:cursor-grabbing"
            >
              <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
                {/* 根 → 类型组 连线 */}
                {layout.groups.map((group) => (
                  <path
                    key={`root-${group.type}`}
                    d={`M ${ROOT_W + 20} ${layout.rootY + NODE_H / 2} C ${ROOT_W + 60} ${layout.rootY + NODE_H / 2}, ${group.x - 40} ${group.y + NODE_H / 2}, ${group.x} ${group.y + NODE_H / 2}`}
                    fill="none"
                    stroke="#cbd5e1"
                    strokeWidth={1.5}
                  />
                ))}
                {/* 类型组 → 节点 连线 */}
                {layout.groups.map((group) =>
                  group.nodes.map((laid) => (
                    <path
                      key={`g-${laid.node.node_id}`}
                      d={`M ${group.x + GROUP_W} ${group.y + NODE_H / 2} C ${group.x + GROUP_W + 40} ${group.y + NODE_H / 2}, ${laid.x - 40} ${laid.y + NODE_H / 2}, ${laid.x} ${laid.y + NODE_H / 2}`}
                      fill="none"
                      stroke={typeMeta(group.type).color}
                      strokeOpacity={0.35}
                      strokeWidth={1.5}
                    />
                  ))
                )}
                {/* 关系边(节点间) */}
                {graph.graph.edges.map((edge) => {
                  const from = nodePositions.get(edge.from_node_id)
                  const to = nodePositions.get(edge.to_node_id)
                  if (!from || !to) return null
                  const x1 = from.x + NODE_W
                  const y1 = from.y + NODE_H / 2
                  const x2 = to.x + NODE_W
                  const y2 = to.y + NODE_H / 2
                  const bend = 60 + Math.abs(y2 - y1) / 4
                  return (
                    <g key={edge.edge_id}>
                      <path
                        d={`M ${x1} ${y1} C ${x1 + bend} ${y1}, ${x2 + bend} ${y2}, ${x2} ${y2}`}
                        fill="none"
                        stroke="#f472b6"
                        strokeDasharray="4 3"
                        strokeWidth={1.2}
                      />
                      {edge.label && (
                        <text x={Math.max(x1, x2) + bend - 4} y={(y1 + y2) / 2} fontSize={10} fill="#db2777" textAnchor="start">
                          {edge.label}
                        </text>
                      )}
                    </g>
                  )
                })}
                {/* 根节点 */}
                <g>
                  <rect x={10} y={layout.rootY} width={ROOT_W} height={NODE_H} rx={12} fill="#1e293b" />
                  <text x={10 + ROOT_W / 2} y={layout.rootY + NODE_H / 2 + 4} textAnchor="middle" fontSize={13} fill="#fff">
                    {layout.title.length > 10 ? `${layout.title.slice(0, 10)}…` : layout.title}
                  </text>
                </g>
                {/* 类型组节点 */}
                {layout.groups.map((group) => {
                  const meta = typeMeta(group.type)
                  return (
                    <g key={group.type}>
                      <rect x={group.x} y={group.y} width={GROUP_W} height={NODE_H} rx={10} fill={meta.color} fillOpacity={0.15} stroke={meta.color} />
                      <text x={group.x + GROUP_W / 2} y={group.y + NODE_H / 2 + 4} textAnchor="middle" fontSize={12} fill={meta.color}>
                        {meta.name} · {group.nodes.length}
                      </text>
                    </g>
                  )
                })}
                {/* 内容节点 */}
                {layout.groups.map((group) =>
                  group.nodes.map((laid) => {
                    const meta = typeMeta(laid.node.type)
                    const isSelected = selected?.node_id === laid.node.node_id
                    return (
                      <g
                        key={laid.node.node_id}
                        onClick={() => setSelected(laid.node)}
                        className="cursor-pointer"
                      >
                        <rect
                          x={laid.x}
                          y={laid.y}
                          width={NODE_W}
                          height={NODE_H}
                          rx={8}
                          fill="#fff"
                          stroke={isSelected ? '#2563eb' : meta.color}
                          strokeWidth={isSelected ? 2.5 : 1.2}
                        />
                        <circle cx={laid.x + 12} cy={laid.y + NODE_H / 2} r={4} fill={meta.color} />
                        <text x={laid.x + 24} y={laid.y + NODE_H / 2 + 4} fontSize={12} fill="#334155">
                          {laid.node.label.length > 11 ? `${laid.node.label.slice(0, 11)}…` : laid.node.label}
                        </text>
                      </g>
                    )
                  })
                )}
              </g>
            </svg>
          ) : (
            <div className="flex h-full min-h-[420px] items-center justify-center text-sm text-gray-400">
              {projects.length === 0 ? '还没有项目,点击「+ 新项目」开始' : '加载图谱中…'}
            </div>
          )}
        </div>

        <div className="w-full space-y-4 lg:w-96">
          {selected && (
            <div className="rounded-xl border border-gray-200 bg-white p-4 text-slate-800">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">{selected.label}</h2>
                <button onClick={() => setSelected(null)} className="text-sm text-gray-400 hover:text-gray-600">
                  关闭
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-400">
                {typeMeta(selected.type).name} · {selected.status} · {selected.branch_scope}
              </p>
              <p className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap text-sm text-gray-700">{selected.content}</p>
            </div>
          )}

          <div className="rounded-xl border border-gray-200 bg-white p-4 text-slate-800">
            <h2 className="font-semibold">输入设定 / 剧情</h2>
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
                <p className="text-sm font-medium text-emerald-800">{draftResult.title}</p>
                <p className="mt-1 max-h-56 overflow-auto whitespace-pre-wrap text-sm text-gray-700">{draftResult.content}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
