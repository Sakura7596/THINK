import { PenLine } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState } from '../components/EmptyState'
import { NoteListItem } from '../components/NoteListItem'
import { deleteNote, listNotes, updateNote } from '../lib/api'
import type { Note } from '../types/note'

export function HomePage() {
  const [notes, setNotes] = useState<Note[]>([])

  useEffect(() => {
    void listNotes({ archived: false, limit: 5 }).then(setNotes).catch(() => setNotes([]))
  }, [])

  async function refresh() {
    setNotes(await listNotes({ archived: false, limit: 5 }))
  }

  async function togglePin(note: Note) {
    await updateNote(note.id, { is_pinned: !note.is_pinned })
    await refresh()
  }

  async function toggleArchive(note: Note) {
    await updateNote(note.id, { is_archived: !note.is_archived })
    await refresh()
  }

  async function remove(note: Note) {
    await deleteNote(note.id)
    await refresh()
  }

  return (
    <section className="mx-auto max-w-3xl">
      <div className="mb-10 pt-4 sm:pt-8">
        <p className="mb-3 text-sm text-muted">think</p>
        <h1 className="max-w-2xl text-4xl font-semibold leading-tight text-ink sm:text-5xl">
          A quiet place for unfinished thoughts.
        </h1>
        <p className="mt-4 text-lg leading-8 text-muted">一个存放未完成想法的地方。</p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link className="link-button" to="/write">
            <PenLine size={16} />
            write
          </Link>
          <Link className="link-button" to="/notes">
            notes
          </Link>
        </div>
      </div>

      {notes.length ? (
        <div className="rounded-md border border-line bg-surface/70 px-5">
          {notes.map((note) => (
            <NoteListItem key={note.id} note={note} onPin={togglePin} onArchive={toggleArchive} onDelete={remove} />
          ))}
        </div>
      ) : (
        <EmptyState title="No thoughts yet." action={<Link className="link-button" to="/write">Start with anything.</Link>} />
      )}
    </section>
  )
}
