import { describe, expect, it } from 'vitest'
import { createExcerpt, exportNotesAsMarkdown } from './export'
import type { Note } from '../types/note'

const note: Note = {
  id: 'note-1',
  title: '一个小想法',
  content: '第一行\n\n第二行',
  tags: ['灵感', '日常'],
  is_pinned: false,
  is_archived: false,
  is_deleted: false,
  created_at: '2026-06-29T08:00:00.000Z',
  updated_at: '2026-06-29T09:00:00.000Z',
}

describe('createExcerpt', () => {
  it('collapses whitespace and limits long text', () => {
    expect(createExcerpt('  one\n\n two   three  ', 9)).toBe('one two...')
  })
})

describe('exportNotesAsMarkdown', () => {
  it('renders notes with Chinese metadata and content', () => {
    const markdown = exportNotesAsMarkdown([note], new Date('2026-06-29T10:00:00.000Z'))

    expect(markdown).toContain('# think 导出')
    expect(markdown).toContain('导出时间：2026-06-29 10:00')
    expect(markdown).toContain('## 一个小想法')
    expect(markdown).toContain('标签：灵感, 日常')
    expect(markdown).toContain('第一行\n\n第二行')
  })
})
