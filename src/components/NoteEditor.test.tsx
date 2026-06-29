/** @vitest-environment jsdom */
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { updateNote } from '../lib/api'
import type { Note } from '../types/note'
import { NoteEditor } from './NoteEditor'

vi.mock('../lib/api', () => ({
  createNote: vi.fn(),
  deleteNote: vi.fn(),
  updateNote: vi.fn(),
}))

const note: Note = {
  id: 'note-1',
  title: '原标题',
  content: '原正文',
  tags: [],
  is_pinned: false,
  is_archived: false,
  is_deleted: false,
  created_at: '2026-06-29T10:00:00.000Z',
  updated_at: '2026-06-29T10:00:00.000Z',
}

describe('NoteEditor manual save', () => {
  beforeEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('does not save while typing and saves only when the save button is clicked', async () => {
    vi.useFakeTimers()
    vi.mocked(updateNote).mockResolvedValue({ ...note, title: '新标题' })
    render(
      <MemoryRouter>
        <NoteEditor note={note} />
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByPlaceholderText('未命名'), { target: { value: '新标题' } })
    vi.advanceTimersByTime(2500)

    expect(updateNote).not.toHaveBeenCalled()
    vi.useRealTimers()

    fireEvent.click(screen.getByRole('button', { name: '保存' }))

    await waitFor(() => expect(updateNote).toHaveBeenCalledTimes(1))
    expect(updateNote).toHaveBeenCalledWith('note-1', expect.objectContaining({ title: '新标题' }))
  })
})