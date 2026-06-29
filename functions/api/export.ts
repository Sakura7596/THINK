import { supabaseRest, type DbNote, type Env } from '../_shared/supabase'

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

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
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
