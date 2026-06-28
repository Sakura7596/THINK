import { describe, expect, it } from 'vitest'
import { createExcerpt, exportNotesAsMarkdown } from './export'
import type { Note } from '../types/note'

const note: Note = {
  id: 'note-1',
  title: 'A small thought',
  content: 'Line one\n\nLine two',
  tags: ['idea', 'daily'],
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
  it('renders notes with metadata and content', () => {
    const markdown = exportNotesAsMarkdown([note], new Date('2026-06-29T10:00:00.000Z'))

    expect(markdown).toContain('# think export')
    expect(markdown).toContain('Exported at: 2026-06-29 10:00')
    expect(markdown).toContain('## A small thought')
    expect(markdown).toContain('Tags: idea, daily')
    expect(markdown).toContain('Line one\n\nLine two')
  })
})
