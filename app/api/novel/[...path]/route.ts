// 小说图谱 API:口令保护 + 转发到 NovelService(移植自 novel-graph-agent BFF)
// 所有请求需携带 header: x-novel-key = NOVEL_ACCESS_KEY
import { NextRequest, NextResponse } from 'next/server'
import { getNovelService } from '@/lib/novel/factory'
import type { ExportFormat, ImportFormat } from '@/lib/novel/novel-service'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 模型生成草稿可能较慢

type Body = Record<string, unknown>

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
  if (value === 'json' || value === 'opml' || value === 'markdown' || value === 'mermaid') return value
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
  const status = /not found|已存在|already exists/i.test(message) ? 404 : 500
  return NextResponse.json({ error: { message } }, { status: message.includes('already exists') ? 409 : status })
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  if (!checkKey(req)) return unauthorized()
  const { path } = await ctx.params
  const service = getNovelService()
  const url = new URL(req.url)

  try {
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
    // GET /api/novel/projects/:id/export?format=
    if (path.length === 3 && path[0] === 'projects' && path[2] === 'export') {
      const exported = await service.exportStory({
        project_id: path[1],
        format: asExportFormat(url.searchParams.get('format'))
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
            prompt: asOptionalString(body.prompt)
          })
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
    return NextResponse.json({ error: { message: `Route not found: PATCH /${path.join('/')}` } }, { status: 404 })
  } catch (error) {
    return fail(error)
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  if (!checkKey(req)) return unauthorized()
  const { path } = await ctx.params
  const service = getNovelService()
  const branchParam = new URL(req.url).searchParams.get('branch_id') ?? undefined

  try {
    // DELETE /api/novel/projects/:id/nodes/:nodeId?branch_id=
    if (path.length === 4 && path[0] === 'projects' && path[2] === 'nodes') {
      return NextResponse.json(await service.deleteNode(path[1], path[3], branchParam))
    }
    return NextResponse.json({ error: { message: `Route not found: DELETE /${path.join('/')}` } }, { status: 404 })
  } catch (error) {
    return fail(error)
  }
}
