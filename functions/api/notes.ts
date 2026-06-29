import { isEmptyNotePayload, json, notePayload, readJson, supabaseRest, text, type DbNote, type Env } from '../_shared/supabase'

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

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  const data = await supabaseRest<DbNote[]>(env, 'notes', { query: notesQuery(request) })
  return json(data)
}

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
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
