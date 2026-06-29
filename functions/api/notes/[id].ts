import { isEmptyNotePayload, json, notePayload, readJson, supabaseRest, text, type DbNote, type Env } from '../../_shared/supabase'

function noteByIdQuery(id: string): string {
  const params = new URLSearchParams({
    select: '*',
    id: `eq.${id}`,
    is_deleted: 'eq.false',
    limit: '1',
  })
  return `?${params.toString()}`
}

async function findNote(env: Env, id: string): Promise<DbNote | null> {
  const data = await supabaseRest<DbNote[]>(env, 'notes', { query: noteByIdQuery(id) })
  return data[0] ?? null
}

export const onRequestGet: PagesFunction<Env, 'id'> = async ({ env, params }) => {
  const note = await findNote(env, String(params.id))
  if (!note) return text('笔记不存在', { status: 404 })
  return json(note)
}

export const onRequestPatch: PagesFunction<Env, 'id'> = async ({ env, request, params }) => {
  const id = String(params.id)
  const payload = notePayload(await readJson(request))

  if ('title' in payload || 'content' in payload) {
    const existing = await findNote(env, id)
    if (!existing) return text('笔记不存在', { status: 404 })
    const merged = { title: existing.title, content: existing.content, ...payload }
    if (isEmptyNotePayload(merged)) return text('标题和正文不能同时为空', { status: 400 })
  }

  const query = new URLSearchParams({ id: `eq.${id}`, is_deleted: 'eq.false' })
  const data = await supabaseRest<DbNote[]>(env, 'notes', {
    method: 'PATCH',
    query: `?${query.toString()}`,
    body: payload,
    prefer: 'return=representation',
  })

  if (!data[0]) return text('笔记不存在', { status: 404 })
  return json(data[0])
}

export const onRequestDelete: PagesFunction<Env, 'id'> = async ({ env, params }) => {
  const id = String(params.id)
  const query = new URLSearchParams({ id: `eq.${id}`, is_deleted: 'eq.false' })
  const data = await supabaseRest<DbNote[]>(env, 'notes', {
    method: 'PATCH',
    query: `?${query.toString()}`,
    body: { is_deleted: true },
    prefer: 'return=representation',
  })

  if (!data[0]) return text('笔记不存在', { status: 404 })
  return json(data[0])
}
