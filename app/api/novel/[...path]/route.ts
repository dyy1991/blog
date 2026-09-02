// 小说图谱 API:口令保护 + 转发到 NovelService(移植自 novel-graph-agent BFF)
// 所有请求需携带 header: x-novel-key = NOVEL_ACCESS_KEY
import { NextRequest, NextResponse } from 'next/server'
import { describePlanner, getNovelService } from '@/lib/novel/factory'
import type { ExportFormat, ImportFormat } from '@/lib/novel/novel-service'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 模型生成草稿可能较慢

type Body = Record<string, unknown>

/** 可手动创建的关系类型(contains 由层级操作维护,不在此列) */
const EDGE_TYPES = ['next', 'relation', 'conflict', 'reference']

function unauthorized(): NextResponse {
  return NextResponse.json({ error: { message: '口令错误或未提供 (x-novel-key)' } }, { status: 401 })
}

function checkKey(req: NextRequest): boolean {
  const expected = process.env.NOVEL_ACCESS_KEY
  if (!expected) return false
  return req.headers.get('x-novel-key') === expected
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function asOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

function asExportFormat(value: unknown): ExportFormat {
  if (
    value === 'json' ||
    value === 'opml' ||
    value === 'markdown' ||
    value === 'mermaid' ||
    value === 'manuscript'
  ) {
    return value
  }
  return 'json'
}

function asImportFormat(value: unknown): ImportFormat {
  if (value === 'json' || value === 'opml' || value === 'markdown') return value
  return 'json'
}

async function readBody(req: NextRequest): Promise<Body> {
  try {
    const parsed = await req.json()
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed as Body
    return {}
  } catch {
    return {}
  }
}

function fail(error: unknown): NextResponse {
  const message = error instanceof Error ? error.message : 'Unknown error'
  // 顺序链冲突:交给前端询问是否替换
  if (message.startsWith('NEXT_CONFLICT:')) {
    return NextResponse.json(
      { error: { code: 'NEXT_CONFLICT', message: message.slice('NEXT_CONFLICT:'.length) } },
      { status: 409 }
    )
  }
  const status = /not found|已存在|already exists/i.test(message) ? 404 : 500
  return NextResponse.json({ error: { message } }, { status: message.includes('already exists') ? 409 : status })
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  if (!checkKey(req)) return unauthorized()
  const { path } = await ctx.params
  const service = getNovelService()
  const url = new URL(req.url)

  try {
    // GET /api/novel/status —— 当前 planner 配置(不含密钥)
    if (path.length === 1 && path[0] === 'status') {
      return NextResponse.json({ planner: describePlanner() })
    }
    // GET /api/novel/projects
    if (path.length === 1 && path[0] === 'projects') {
      return NextResponse.json({ projects: await service.listProjects() })
    }
    // GET /api/novel/projects/:id
    if (path.length === 2 && path[0] === 'projects') {
      return NextResponse.json(await service.getProject(path[1]))
    }
    // GET /api/novel/projects/:id/branches
    if (path.length === 3 && path[0] === 'projects' && path[2] === 'branches') {
      return NextResponse.json(await service.listBranches(path[1]))
    }
    // GET /api/novel/projects/:id/graph?branch_id=
    if (path.length === 3 && path[0] === 'projects' && path[2] === 'graph') {
      return NextResponse.json(await service.getGraph(path[1], url.searchParams.get('branch_id') ?? undefined))
    }
    // GET /api/novel/projects/:id/classify?branch_id= —— 返回分类建议(不写入)
    if (path.length === 3 && path[0] === 'projects' && path[2] === 'classify') {
      return NextResponse.json(
        await service.suggestNodeTypes(path[1], url.searchParams.get('branch_id') ?? undefined)
      )
    }
    // GET /api/novel/projects/:id/drafts?branch_id=
    if (path.length === 3 && path[0] === 'projects' && path[2] === 'drafts') {
      return NextResponse.json(
        await service.listDrafts(path[1], url.searchParams.get('branch_id') ?? undefined)
      )
    }
    // GET /api/novel/projects/:id/export?format=
    if (path.length === 3 && path[0] === 'projects' && path[2] === 'export') {
      const exported = await service.exportStory({
        project_id: path[1],
        format: asExportFormat(url.searchParams.get('format')),
        branch_id: url.searchParams.get('branch_id') ?? undefined,
        drafts_only: url.searchParams.get('drafts_only') === 'true',
        include_both: url.searchParams.get('include_both') === 'true'
      })
      return NextResponse.json({ ...exported.result, format: exported.format, content: exported.content })
    }
    return NextResponse.json({ error: { message: `Route not found: GET /${path.join('/')}` } }, { status: 404 })
  } catch (error) {
    return fail(error)
  }
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  if (!checkKey(req)) return unauthorized()
  const { path } = await ctx.params
  const service = getNovelService()
  const body = await readBody(req)

  try {
    // POST /api/novel/projects
    if (path.length === 1 && path[0] === 'projects') {
      const result = await service.createProject({
        project_id: asString(body.project_id),
        title: asString(body.title),
        language: asString(body.language, 'zh-CN'),
        genre: asOptionalString(body.genre),
        premise: asOptionalString(body.premise)
      })
      return NextResponse.json(result, { status: 201 })
    }
    if (path.length === 3 && path[0] === 'projects') {
      const projectId = path[1]
      // POST /api/novel/projects/:id/intake
      if (path[2] === 'intake') {
        return NextResponse.json(
          await service.ingest({
            project_id: projectId,
            branch_id: asOptionalString(body.branch_id),
            input: { text: asString(body.text), source_uri: asOptionalString(body.source_uri) }
          })
        )
      }
      // POST /api/novel/projects/:id/plan
      if (path[2] === 'plan') {
        return NextResponse.json(
          await service.plan({
            project_id: projectId,
            branch_id: asOptionalString(body.branch_id),
            focus: asOptionalString(body.focus)
          })
        )
      }
      // POST /api/novel/projects/:id/resolve
      if (path[2] === 'resolve') {
        return NextResponse.json(
          await service.resolve({
            project_id: projectId,
            branch_id: asOptionalString(body.branch_id),
            issue: asString(body.issue),
            decision: asOptionalString(body.decision)
          })
        )
      }
      // POST /api/novel/projects/:id/branches
      if (path[2] === 'branches') {
        const created = await service.createBranch({
          project_id: projectId,
          branch_id: asString(body.branch_id),
          name: asString(body.name),
          purpose: asString(body.purpose),
          parent_revision_id: body.parent_revision_id === null ? null : asOptionalString(body.parent_revision_id)
        })
        return NextResponse.json({ ...created.result, branch: created.branch }, { status: 201 })
      }
      // POST /api/novel/projects/:id/drafts
      if (path[2] === 'drafts') {
        return NextResponse.json(
          await service.writeDraft({
            project_id: projectId,
            branch_id: asOptionalString(body.branch_id),
            kind: body.kind === 'dialogue' ? 'dialogue' : 'scene',
            prompt: asOptionalString(body.prompt),
            focus_node_id: asOptionalString(body.focus_node_id)
          })
        )
      }
      // POST /api/novel/projects/:id/nodes  { label, content?, type?, parent_node_id?, branch_id? }
      if (path[2] === 'nodes') {
        const label = asString(body.label).trim()
        if (!label) {
          return NextResponse.json({ error: { message: '节点名称不能为空' } }, { status: 400 })
        }
        return NextResponse.json(
          await service.createNode(
            projectId,
            {
              label,
              content: asOptionalString(body.content),
              type: asOptionalString(body.type),
              parent_node_id: body.parent_node_id === null ? null : asOptionalString(body.parent_node_id)
            },
            asOptionalString(body.branch_id)
          ),
          { status: 201 }
        )
      }
      // POST /api/novel/projects/:id/classify  { assignments: [{node_id, type}], branch_id? }
      if (path[2] === 'classify') {
        const raw = Array.isArray(body.assignments) ? body.assignments : []
        const assignments = raw
          .map((item) => (item && typeof item === 'object' ? (item as Record<string, unknown>) : {}))
          .filter((item) => typeof item.node_id === 'string' && typeof item.type === 'string')
          .map((item) => ({ node_id: item.node_id as string, type: item.type as string }))
        if (assignments.length === 0) {
          return NextResponse.json({ error: { message: 'assignments 不能为空' } }, { status: 400 })
        }
        return NextResponse.json(
          await service.applyNodeTypes(projectId, assignments, asOptionalString(body.branch_id))
        )
      }
      // POST /api/novel/projects/:id/edges  { from_node_id, to_node_id, type, label?, branch_id? }
      if (path[2] === 'edges') {
        const type = asString(body.type, 'relation')
        if (!EDGE_TYPES.includes(type)) {
          return NextResponse.json(
            { error: { message: `关系类型必须是 ${EDGE_TYPES.join(' / ')} 之一` } },
            { status: 400 }
          )
        }
        return NextResponse.json(
          await service.createEdge(
            projectId,
            {
              from_node_id: asString(body.from_node_id),
              to_node_id: asString(body.to_node_id),
              type,
              label: asOptionalString(body.label),
              replace_existing: body.replace_existing === true
            },
            asOptionalString(body.branch_id)
          ),
          { status: 201 }
        )
      }
      // POST /api/novel/projects/:id/import
      if (path[2] === 'import') {
        return NextResponse.json(
          await service.importStory({
            project_id: projectId,
            format: asImportFormat(body.format),
            content: asString(body.content)
          })
        )
      }
    }
    return NextResponse.json({ error: { message: `Route not found: POST /${path.join('/')}` } }, { status: 404 })
  } catch (error) {
    return fail(error)
  }
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  if (!checkKey(req)) return unauthorized()
  const { path } = await ctx.params
  const service = getNovelService()

  try {
    // PATCH /api/novel/projects/:id/branches/:branchId/activate
    if (path.length === 5 && path[0] === 'projects' && path[2] === 'branches' && path[4] === 'activate') {
      return NextResponse.json(await service.switchBranch(path[1], path[3]))
    }
    // PATCH /api/novel/projects/:id/nodes/:nodeId
    if (path.length === 4 && path[0] === 'projects' && path[2] === 'nodes') {
      const body = await readBody(req)
      const status = body.status
      // 只改父级(拖拽重挂)
      if ('parent_node_id' in body) {
        return NextResponse.json(
          await service.reparentNode(
            path[1],
            path[3],
            body.parent_node_id === null ? null : asString(body.parent_node_id),
            asOptionalString(body.branch_id)
          )
        )
      }
      return NextResponse.json(
        await service.updateNode(
          path[1],
          path[3],
          {
            label: asOptionalString(body.label),
            content: asOptionalString(body.content),
            type: asOptionalString(body.type),
            status:
              status === 'confirmed' || status === 'provisional' || status === 'disputed' || status === 'retired'
                ? status
                : undefined
          },
          asOptionalString(body.branch_id)
        )
      )
    }
    // PATCH /api/novel/projects/:id/edges/:edgeId  { label?, type? }
    if (path.length === 4 && path[0] === 'projects' && path[2] === 'edges') {
      const body = await readBody(req)
      const type = asOptionalString(body.type)
      if (type && !EDGE_TYPES.includes(type)) {
        return NextResponse.json(
          { error: { message: `关系类型必须是 ${EDGE_TYPES.join(' / ')} 之一` } },
          { status: 400 }
        )
      }
      return NextResponse.json(
        await service.updateEdge(
          path[1],
          path[3],
          { label: asOptionalString(body.label), type },
          asOptionalString(body.branch_id)
        )
      )
    }
    // PATCH /api/novel/projects/:id/drafts/:draftId  { status: 'accepted' | 'rejected' }
    if (path.length === 4 && path[0] === 'projects' && path[2] === 'drafts') {
      const body = await readBody(req)
      if (body.status === 'accepted') {
        return NextResponse.json(await service.acceptDraft(path[1], path[3]))
      }
      if (body.status === 'rejected') {
        return NextResponse.json(await service.rejectDraft(path[1], path[3]))
      }
      return NextResponse.json({ error: { message: 'status 必须是 accepted 或 rejected' } }, { status: 400 })
    }
    return NextResponse.json({ error: { message: `Route not found: PATCH /${path.join('/')}` } }, { status: 404 })
  } catch (error) {
    return fail(error)
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  if (!checkKey(req)) return unauthorized()
  const { path } = await ctx.params
  const service = getNovelService()
  const params = new URL(req.url).searchParams
  const branchParam = params.get('branch_id') ?? undefined

  try {
    // DELETE /api/novel/projects/:id/nodes/:nodeId?branch_id=&cascade=true
    if (path.length === 4 && path[0] === 'projects' && path[2] === 'nodes') {
      return NextResponse.json(
        await service.deleteNode(path[1], path[3], branchParam, params.get('cascade') === 'true')
      )
    }
    // DELETE /api/novel/projects/:id/edges/:edgeId?branch_id=
    if (path.length === 4 && path[0] === 'projects' && path[2] === 'edges') {
      return NextResponse.json(await service.deleteEdge(path[1], path[3], branchParam))
    }
    // DELETE /api/novel/projects/:id/drafts/:draftId
    if (path.length === 4 && path[0] === 'projects' && path[2] === 'drafts') {
      return NextResponse.json(await service.deleteDraft(path[1], path[3]))
    }
    return NextResponse.json({ error: { message: `Route not found: DELETE /${path.join('/')}` } }, { status: 404 })
  } catch (error) {
    return fail(error)
  }
}
