import { getSupabase, text, type DbNote, type Env } from '../_shared/supabase'

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
    `## ${note.title.trim() || 'Untitled'}`,
    '',
    `Created: ${formatDateTime(note.created_at)}`,
    `Updated: ${formatDateTime(note.updated_at)}`,
    `Tags: ${note.tags.length ? note.tags.join(', ') : '-'}`,
    '',
    note.content,
    '',
    '---',
  ].join('\n'))

  return ['# think export', '', `Exported at: ${formatDateTime(exportedAt)}`, '', '---', '', ...sections].join('\n')
}

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  const supabase = getSupabase(env)
  const url = new URL(request.url)
  const format = url.searchParams.get('format') ?? 'json'

  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('is_deleted', false)
    .order('updated_at', { ascending: false })

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
