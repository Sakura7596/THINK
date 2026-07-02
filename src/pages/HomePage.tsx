import { BookOpen, PenLine } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState } from '../components/EmptyState'
import { NoteListItem } from '../components/NoteListItem'
import { deleteNote, listNotes, updateNote } from '../lib/api'
import type { Note } from '../types/note'

export function HomePage() {
  const [notes, setNotes] = useState<Note[]>([])

  useEffect(() => {
    void listNotes({ archived: false, kind: 'all', limit: 5 }).then(setNotes).catch(() => setNotes([]))
  }, [])

  async function refresh() {
    setNotes(await listNotes({ archived: false, kind: 'all', limit: 5 }))
  }

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
      <div className="mb-10 pt-4 sm:pt-8">
        <p className="mb-3 text-sm text-muted">think</p>
        <h1 className="max-w-2xl text-4xl font-semibold leading-tight text-ink sm:text-5xl">
          一个存放日记和未完成想法的地方。
        </h1>
        <p className="mt-4 text-lg leading-8 text-muted">思考可以流动，日记按日期留下来。</p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link className="link-button" to="/write">
            <PenLine size={16} />
            写下
          </Link>
          <Link className="link-button" to="/notes">
            查看记录
          </Link>
          <Link className="link-button" to="/diary">
            <BookOpen size={16} />
            查看日记
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
        <EmptyState title="还没有内容。" action={<Link className="link-button" to="/write">从任何一句话开始</Link>} />
      )}
    </section>
  )
}
