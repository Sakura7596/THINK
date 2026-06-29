import { isEmptyNotePayload, json, notePayload, readJson, supabaseRest, text, type DbNote, type WorkerEnv } from '../functions/_shared/supabase'

function formatDateTime(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value)
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  const hours = String(date.getUTCHours()).padStart(2, '0')
  const minutes = String(date.getUTCMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

function markdown(notes: DbNote[], exportedAt = new Date()): string {
  const sections = notes.map((note) => [
    `## ${note.title.trim() || '未命名'}`,
    '',
    `创建时间：${formatDateTime(note.created_at)}`,
    `更新时间：${formatDateTime(note.updated_at)}`,
    `标签：${note.tags.length ? note.tags.join(', ') : '-'}`,
    '',
    note.content,
    '',
    '---',
  ].join('\n'))

  return ['# think 导出', '', `导出时间：${formatDateTime(exportedAt)}`, '', '---', '', ...sections].join('\n')
}

function notesQuery(request: Request): string {
  const url = new URL(request.url)
  const archived = url.searchParams.get('archived')
  const limit = Number(url.searchParams.get('limit') ?? 0)
  const params = new URLSearchParams({
    select: '*',
    is_deleted: 'eq.false',
    order: 'is_pinned.desc,updated_at.desc',
  })

  if (archived === 'true') params.set('is_archived', 'eq.true')
  if (archived === 'false') params.set('is_archived', 'eq.false')
  if (Number.isFinite(limit) && limit > 0) params.set('limit', String(Math.min(limit, 200)))

  return `?${params.toString()}`
}

function noteByIdQuery(id: string): string {
  const params = new URLSearchParams({
    select: '*',
    id: `eq.${id}`,
    is_deleted: 'eq.false',
    limit: '1',
  })
  return `?${params.toString()}`
}

async function findNote(env: WorkerEnv, id: string): Promise<DbNote | null> {
  const data = await supabaseRest<DbNote[]>(env, 'notes', { query: noteByIdQuery(id) })
  return data[0] ?? null
}

async function listNotes(env: WorkerEnv, request: Request): Promise<Response> {
  const data = await supabaseRest<DbNote[]>(env, 'notes', { query: notesQuery(request) })
  return json(data)
}

async function createNote(env: WorkerEnv, request: Request): Promise<Response> {
  const payload = notePayload(await readJson(request))

  if (isEmptyNotePayload(payload)) {
    return text('标题和正文不能同时为空', { status: 400 })
  }

  const data = await supabaseRest<DbNote[]>(env, 'notes', {
    method: 'POST',
    body: payload,
    prefer: 'return=representation',
  })
  return json(data[0], { status: 201 })
}

async function getNote(env: WorkerEnv, id: string): Promise<Response> {
  const note = await findNote(env, id)
  if (!note) return text('笔记不存在', { status: 404 })
  return json(note)
}

async function updateNote(env: WorkerEnv, request: Request, id: string): Promise<Response> {
  const payload = notePayload(await readJson(request))

  if ('title' in payload || 'content' in payload) {
    const existing = await findNote(env, id)
    if (!existing) return text('笔记不存在', { status: 404 })
    const merged = { title: existing.title, content: existing.content, ...payload }
    if (isEmptyNotePayload(merged)) return text('标题和正文不能同时为空', { status: 400 })
  }

  const params = new URLSearchParams({ id: `eq.${id}`, is_deleted: 'eq.false' })
  const data = await supabaseRest<DbNote[]>(env, 'notes', {
    method: 'PATCH',
    query: `?${params.toString()}`,
    body: payload,
    prefer: 'return=representation',
  })

  if (!data[0]) return text('笔记不存在', { status: 404 })
  return json(data[0])
}

async function deleteNote(env: WorkerEnv, id: string): Promise<Response> {
  const params = new URLSearchParams({ id: `eq.${id}`, is_deleted: 'eq.false' })
  const data = await supabaseRest<DbNote[]>(env, 'notes', {
    method: 'PATCH',
    query: `?${params.toString()}`,
    body: { is_deleted: true },
    prefer: 'return=representation',
  })

  if (!data[0]) return text('笔记不存在', { status: 404 })
  return json(data[0])
}

async function exportNotes(env: WorkerEnv, request: Request): Promise<Response> {
  const url = new URL(request.url)
  const format = url.searchParams.get('format') ?? 'json'
  const params = new URLSearchParams({
    select: '*',
    is_deleted: 'eq.false',
    order: 'updated_at.desc',
  })
  const data = await supabaseRest<DbNote[]>(env, 'notes', { query: `?${params.toString()}` })

  if (format === 'markdown') {
    return new Response(markdown(data), {
      headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
    })
  }

  return new Response(JSON.stringify(data, null, 2), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })
}

async function handleApi(request: Request, env: WorkerEnv): Promise<Response> {
  const url = new URL(request.url)
  const parts = url.pathname.split('/').filter(Boolean)

  if (parts[0] !== 'api') return text('Not found', { status: 404 })
  if (parts[1] === 'health' && request.method === 'GET') {
    const result: Record<string, unknown> = {
      ok: true,
      hasSupabaseUrl: Boolean(env.SUPABASE_URL),
      hasServiceRoleKey: Boolean(env.SUPABASE_SERVICE_ROLE_KEY),
    }

    if (url.searchParams.get('db') === '1') {
      try {
        await supabaseRest<DbNote[]>(env, 'notes', { query: '?select=id&limit=1' })
        result.database = { ok: true }
      } catch {
        result.database = { ok: false }
      }
    }

    return json(result)
  }
  if (parts[1] === 'export' && request.method === 'GET') return exportNotes(env, request)

  if (parts[1] === 'notes' && parts.length === 2) {
    if (request.method === 'GET') return listNotes(env, request)
    if (request.method === 'POST') return createNote(env, request)
  }

  if (parts[1] === 'notes' && parts[2]) {
    const id = parts[2]
    if (request.method === 'GET') return getNote(env, id)
    if (request.method === 'PATCH') return updateNote(env, request, id)
    if (request.method === 'DELETE') return deleteNote(env, id)
  }

  return text('Method not allowed', { status: 405 })
}

export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    const url = new URL(request.url)
    if (url.pathname.startsWith('/api/')) {
      try {
        return await handleApi(request, env)
      } catch {
        return text('保存服务暂时不可用', { status: 500 })
      }
    }
    if (env.ASSETS) {
      const hasFileExtension = /\.[a-zA-Z0-9]+$/.test(url.pathname)
      if (!hasFileExtension) {
        const fallbackUrl = new URL(request.url)
        fallbackUrl.pathname = '/'
        return env.ASSETS.fetch(new Request(fallbackUrl, request))
      }

      return env.ASSETS.fetch(request)
    }
    return text('静态资源绑定未配置', { status: 500 })
  },
} satisfies ExportedHandler<WorkerEnv>
