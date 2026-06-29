import { getSupabase, isEmptyNotePayload, json, notePayload, readJson, text, type DbNote, type WorkerEnv } from '../functions/_shared/supabase'

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

async function listNotes(env: WorkerEnv, request: Request): Promise<Response> {
  const supabase = getSupabase(env)
  const url = new URL(request.url)
  const archived = url.searchParams.get('archived')
  const limit = Number(url.searchParams.get('limit') ?? 0)

  let query = supabase
    .from('notes')
    .select('*')
    .eq('is_deleted', false)
    .order('is_pinned', { ascending: false })
    .order('updated_at', { ascending: false })

  if (archived === 'true') query = query.eq('is_archived', true)
  if (archived === 'false') query = query.eq('is_archived', false)
  if (Number.isFinite(limit) && limit > 0) query = query.limit(Math.min(limit, 200))

  const { data, error } = await query
  if (error) return text(error.message, { status: 500 })
  return json(data ?? [])
}

async function createNote(env: WorkerEnv, request: Request): Promise<Response> {
  const supabase = getSupabase(env)
  const payload = notePayload(await readJson(request))

  if (isEmptyNotePayload(payload)) {
    return text('标题和正文不能同时为空', { status: 400 })
  }

  const { data, error } = await supabase.from('notes').insert(payload).select('*').single()
  if (error) return text(error.message, { status: 500 })
  return json(data, { status: 201 })
}

async function getNote(env: WorkerEnv, id: string): Promise<Response> {
  const supabase = getSupabase(env)
  const { data, error } = await supabase.from('notes').select('*').eq('id', id).eq('is_deleted', false).single()
  if (error) return text(error.message, { status: 404 })
  return json(data)
}

async function updateNote(env: WorkerEnv, request: Request, id: string): Promise<Response> {
  const supabase = getSupabase(env)
  const payload = notePayload(await readJson(request))

  if ('title' in payload || 'content' in payload) {
    const existing = await supabase.from('notes').select('title, content').eq('id', id).single()
    if (existing.error) return text(existing.error.message, { status: 404 })
    const merged = { ...existing.data, ...payload }
    if (isEmptyNotePayload(merged)) return text('标题和正文不能同时为空', { status: 400 })
  }

  const { data, error } = await supabase.from('notes').update(payload).eq('id', id).eq('is_deleted', false).select('*').single()
  if (error) return text(error.message, { status: 500 })
  return json(data)
}

async function deleteNote(env: WorkerEnv, id: string): Promise<Response> {
  const supabase = getSupabase(env)
  const { data, error } = await supabase.from('notes').update({ is_deleted: true }).eq('id', id).select('*').single()
  if (error) return text(error.message, { status: 500 })
  return json(data)
}

async function exportNotes(env: WorkerEnv, request: Request): Promise<Response> {
  const supabase = getSupabase(env)
  const url = new URL(request.url)
  const format = url.searchParams.get('format') ?? 'json'
  const { data, error } = await supabase.from('notes').select('*').eq('is_deleted', false).order('updated_at', { ascending: false })

  if (error) return text(error.message, { status: 500 })

  if (format === 'markdown') {
    return new Response(markdown((data ?? []) as DbNote[]), {
      headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
    })
  }

  return new Response(JSON.stringify(data ?? [], null, 2), {
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
        const supabase = getSupabase(env)
        const { count, error } = await supabase.from('notes').select('id', { count: 'exact', head: true })
        result.database = error
          ? { ok: false, code: error.code, message: error.message, details: error.details, hint: error.hint }
          : { ok: true, count }
      } catch (error) {
        result.database = { ok: false, message: error instanceof Error ? error.message : String(error) }
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
      } catch (error) {
        const message = error instanceof Error ? error.message : '未知错误'
        return text(message, { status: 500 })
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
