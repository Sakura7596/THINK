import { Search } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState } from '../components/EmptyState'
import { NoteListItem } from '../components/NoteListItem'
import { deleteNote, listNotes, updateNote } from '../lib/api'
import type { Note } from '../types/note'

function matchesSearch(note: Note, query: string) {
  const value = query.trim().toLocaleLowerCase()
  if (!value) return true
  return [note.title, note.content, ...note.tags].some((part) => part.toLocaleLowerCase().includes(value))
}

export function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [query, setQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState('')
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      setNotes(await listNotes({ archived: false, limit: query ? undefined : 50 }))
    } finally {
      setLoading(false)
    }
  }, [query])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refresh()
    }, 250)
    return () => window.clearTimeout(timer)
  }, [refresh])

  const tags = useMemo(() => [...new Set(notes.flatMap((note) => note.tags))].sort(), [notes])
  const visible = notes.filter((note) => matchesSearch(note, query)).filter((note) => !selectedTag || note.tags.includes(selectedTag))

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
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-ink">记录</h1>
          <p className="mt-2 text-muted">所有未归档记录，按最近更新排序。</p>
        </div>
        <Link className="link-button" to="/write">新建</Link>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-[1fr_auto]">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
          <input className="field pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索" />
        </label>
        <select className="field sm:w-44" value={selectedTag} onChange={(event) => setSelectedTag(event.target.value)}>
          <option value="">全部标签</option>
          {tags.map((tag) => <option key={tag} value={tag}>{tag}</option>)}
        </select>
      </div>

      {loading ? <p className="text-muted">加载中...</p> : null}
      {!loading && visible.length ? (
        <div className="rounded-md border border-line bg-surface/70 px-5">
          {visible.map((note) => (
            <NoteListItem key={note.id} note={note} onPin={togglePin} onArchive={toggleArchive} onDelete={remove} />
          ))}
        </div>
      ) : null}
      {!loading && !visible.length ? <EmptyState title="这里还没有内容。" action={<Link className="link-button" to="/write">写一点小东西。</Link>} /> : null}
    </section>
  )
}
