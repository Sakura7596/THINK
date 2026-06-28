import type { Note, NoteInput } from '../types/note'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })

  if (!response.ok) {
    const message = await response.text().catch(() => '')
    throw new Error(message || `Request failed: ${response.status}`)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

export type ListNotesOptions = {
  archived?: boolean
  limit?: number
}

export function listNotes(options: ListNotesOptions = {}): Promise<Note[]> {
  const params = new URLSearchParams()
  if (typeof options.archived === 'boolean') params.set('archived', String(options.archived))
  if (options.limit) params.set('limit', String(options.limit))
  const suffix = params.toString() ? `?${params}` : ''
  return request<Note[]>(`/api/notes${suffix}`)
}

export function getNote(id: string): Promise<Note> {
  return request<Note>(`/api/notes/${id}`)
}

export function createNote(input: NoteInput): Promise<Note> {
  return request<Note>('/api/notes', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function updateNote(id: string, input: Partial<NoteInput>): Promise<Note> {
  return request<Note>(`/api/notes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
}

export function deleteNote(id: string): Promise<Note> {
  return request<Note>(`/api/notes/${id}`, { method: 'DELETE' })
}

export async function downloadExport(format: 'json' | 'markdown'): Promise<string> {
  const response = await fetch(`/api/export?format=${format}`)
  if (!response.ok) throw new Error(await response.text())
  return response.text()
}
