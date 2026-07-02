import type { Note } from '../types/note'

export function formatDateTime(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value)
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  const hours = String(date.getUTCHours()).padStart(2, '0')
  const minutes = String(date.getUTCMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

export function createExcerpt(content: string, maxLength = 140): string {
  const compact = content.replace(/\s+/g, ' ').trim()
  if (compact.length <= maxLength) return compact

  const truncated = compact.slice(0, maxLength)
  const wordBoundary = truncated.lastIndexOf(' ')
  const excerpt = wordBoundary > 0 ? truncated.slice(0, wordBoundary) : truncated
  return `${excerpt.trimEnd()}...`
}

export function exportNotesAsMarkdown(notes: Note[], exportedAt = new Date()): string {
  const sections = notes.map((note) => {
    const title = note.title.trim() || '未命名'
    const tags = note.tags.length ? note.tags.join(', ') : '-'
    const lines = [
      `## ${title}`,
      '',
      `类型：${note.kind === 'diary' ? '日记' : '思考'}`,
    ]

    if (note.kind === 'diary' && note.diary_date) lines.push(`日记日期：${note.diary_date}`)

    lines.push(
      `创建时间：${formatDateTime(note.created_at)}`,
      `更新时间：${formatDateTime(note.updated_at)}`,
      `标签：${tags}`,
      '',
      note.content,
      '',
      '---',
    )

    return lines.join('\n')
  })

  return ['# think 导出', '', `导出时间：${formatDateTime(exportedAt)}`, '', '---', '', ...sections].join('\n')
}

export function downloadTextFile(filename: string, content: string, type: string): void {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export function exportDateStamp(date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
