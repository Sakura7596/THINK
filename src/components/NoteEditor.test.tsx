/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, createNote, updateNote } from '../lib/api'
import type { Note } from '../types/note'
import { NoteEditor } from './NoteEditor'

const navigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => navigate,
  }
})

vi.mock('../lib/api', async () => {
  const actual = await vi.importActual<typeof import('../lib/api')>('../lib/api')
  return {
    ...actual,
    createNote: vi.fn(),
    deleteNote: vi.fn(),
    updateNote: vi.fn(),
  }
})

const note: Note = {
  id: 'note-1',
  title: '原标题',
  content: '原正文',
  tags: [],
  kind: 'thought',
  diary_date: null,
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
    navigate.mockReset()
    localStorage.clear()
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
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
    expect(updateNote).toHaveBeenCalledWith('note-1', expect.objectContaining({ title: '新标题', kind: 'thought' }))
  })

  it('defaults new entries to thoughts', () => {
    render(
      <MemoryRouter>
        <NoteEditor />
      </MemoryRouter>,
    )

    expect(screen.getByRole('button', { name: '思考' }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.queryByLabelText('日记日期')).toBeNull()
  })

  it('switches to diary with today as date title and hides pin controls', async () => {
    vi.setSystemTime(new Date('2026-07-02T08:00:00.000Z'))
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.mocked(createNote).mockResolvedValue({
      ...note,
      id: 'diary-1',
      title: '2026年7月2日',
      content: '今天的日记',
      kind: 'diary',
      diary_date: '2026-07-02',
    })

    render(
      <MemoryRouter>
        <NoteEditor />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: '日记' }))
    expect((screen.getByPlaceholderText('未命名') as HTMLInputElement).value).toBe('2026年7月2日')
    expect((screen.getByLabelText('日记日期') as HTMLInputElement).value).toBe('2026-07-02')
    expect(screen.queryByTitle('置顶')).toBeNull()

    fireEvent.change(screen.getByPlaceholderText('写点什么...'), { target: { value: '今天的日记' } })
    fireEvent.click(screen.getByRole('button', { name: '保存' }))

    await waitFor(() => expect(createNote).toHaveBeenCalledTimes(1))
    expect(createNote).toHaveBeenCalledWith(expect.objectContaining({
      title: '2026年7月2日',
      content: '今天的日记',
      kind: 'diary',
      diary_date: '2026-07-02',
      is_pinned: false,
    }))
    expect(navigate).toHaveBeenCalledWith('/notes/diary-1', { replace: true })
  })

  it('opens the existing diary when the selected diary date already exists', async () => {
    vi.mocked(createNote).mockRejectedValue(new ApiError('diary exists', 409, { error: 'diary_exists', noteId: 'diary-1' }))

    render(
      <MemoryRouter>
        <NoteEditor />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: '日记' }))
    fireEvent.change(screen.getByPlaceholderText('写点什么...'), { target: { value: '重复日记' } })
    fireEvent.click(screen.getByRole('button', { name: '保存' }))

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/notes/diary-1', { replace: true }))
  })
})
