import { getSupabase, isEmptyNotePayload, json, notePayload, readJson, text, type Env } from '../../_shared/supabase'


export const onRequestGet: PagesFunction<Env, 'id'> = async ({ env, params }) => {
  const supabase = getSupabase(env)
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('id', String(params.id))
    .eq('is_deleted', false)
    .single()

  if (error) return text(error.message, { status: 404 })
  return json(data)
}

export const onRequestPatch: PagesFunction<Env, 'id'> = async ({ env, request, params }) => {
  const supabase = getSupabase(env)
  const payload = notePayload(await readJson(request))

  if ('title' in payload || 'content' in payload) {
    const existing = await supabase.from('notes').select('title, content').eq('id', String(params.id)).single()
    if (existing.error) return text(existing.error.message, { status: 404 })
    const merged = { ...existing.data, ...payload }
    if (isEmptyNotePayload(merged)) return text('Title and content cannot both be empty', { status: 400 })
  }

  const { data, error } = await supabase
    .from('notes')
    .update(payload)
    .eq('id', String(params.id))
    .eq('is_deleted', false)
    .select('*')
    .single()

  if (error) return text(error.message, { status: 500 })
  return json(data)
}

export const onRequestDelete: PagesFunction<Env, 'id'> = async ({ env, params }) => {
  const supabase = getSupabase(env)
  const { data, error } = await supabase
    .from('notes')
    .update({ is_deleted: true })
    .eq('id', String(params.id))
    .select('*')
    .single()

  if (error) return text(error.message, { status: 500 })
  return json(data)
}
