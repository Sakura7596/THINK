import { describe, expect, it } from 'vitest'
import { createExcerpt, exportNotesAsMarkdown } from './export'
import type { Note } from '../types/note'

const thought: Note = {
  id: 'note-1',
  title: '一个小想法',
  content: '第一行\n\n第二行',
  tags: ['灵感', '日常'],
  kind: 'thought',
  diary_date: null,
  is_pinned: false,
  is_archived: false,
  is_deleted: false,
  created_at: '2026-06-29T08:00:00.000Z',
  updated_at: '2026-06-29T09:00:00.000Z',
}

const diary: Note = {
  ...thought,
  id: 'diary-1',
  title: '2026年7月2日',
  content: '今天的日记',
  tags: ['日记'],
  kind: 'diary',
  diary_date: '2026-07-02',
}

describe('createExcerpt', () => {
  it('collapses whitespace and limits long text', () => {
    expect(createExcerpt('  one\n\n two   three  ', 9)).toBe('one two...')
  })
})

describe('exportNotesAsMarkdown', () => {
  it('renders notes with type metadata and diary dates', () => {
    const markdown = exportNotesAsMarkdown([thought, diary], new Date('2026-06-29T10:00:00.000Z'))

    expect(markdown).toContain('# think 导出')
    expect(markdown).toContain('导出时间：2026-06-29 10:00')
    expect(markdown).toContain('## 一个小想法')
    expect(markdown).toContain('类型：思考')
    expect(markdown).toContain('标签：灵感, 日常')
    expect(markdown).toContain('第一行\n\n第二行')
    expect(markdown).toContain('## 2026年7月2日')
    expect(markdown).toContain('类型：日记')
    expect(markdown).toContain('日记日期：2026-07-02')
  })
})
