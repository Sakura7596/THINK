import { Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { EmptyState } from '../components/EmptyState'
import { NoteListItem } from '../components/NoteListItem'
import { deleteNote, listNotes, updateNote } from '../lib/api'
import type { Note } from '../types/note'

function matchesSearch(note: Note, query: string) {
  const value = query.trim().toLocaleLowerCase()
  if (!value) return true
  return [note.title, note.content, note.diary_date ?? '', ...note.tags].some((part) => part.toLocaleLowerCase().includes(value))
}

export function ArchivePage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [query, setQuery] = useState('')

  useEffect(() => {
    void refresh()
  }, [])

  async function refresh() {
    setNotes(await listNotes({ archived: true, kind: 'all' }))
  }

  const visible = notes.filter((note) => matchesSearch(note, query))

  async function togglePin(note: Note) {
    if (note.kind === 'diary') return
    await updateNote(note.id, { is_pinned: !note.is_pinned, kind: 'thought' })
    await refresh()
  }

  async function toggleArchive(note: Note) {
    await updateNote(note.id, { is_archived: !note.is_archived, kind: note.kind, diary_date: note.diary_date })
    await refresh()
  }

  async function remove(note: Note) {
    await deleteNote(note.id)
    await refresh()
  }

  return (
    <section className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-ink">归档</h1>
        <p className="mt-2 text-muted">暂时放到一边的思考和日记。</p>
      </div>
      <label className="relative mb-5 block">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
        <input className="field pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索归档" />
      </label>
      {visible.length ? (
        <div className="rounded-md border border-line bg-surface/70 px-5">
          {visible.map((note) => (
            <NoteListItem key={note.id} note={note} onPin={togglePin} onArchive={toggleArchive} onDelete={remove} />
          ))}
        </div>
      ) : (
        <EmptyState title="还没有归档内容。" />
      )}
    </section>
  )
}
