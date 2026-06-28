import { getSupabase, isEmptyNotePayload, json, notePayload, readJson, text, type Env } from '../_shared/supabase'

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
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

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  const supabase = getSupabase(env)
  const payload = notePayload(await readJson(request))

  if (isEmptyNotePayload(payload)) {
    return text('Title and content cannot both be empty', { status: 400 })
  }

  const { data, error } = await supabase.from('notes').insert(payload).select('*').single()
  if (error) return text(error.message, { status: 500 })

  return json(data, { status: 201 })
}
