import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { EmptyState } from '../components/EmptyState'
import { NoteEditor } from '../components/NoteEditor'
import { getNote } from '../lib/api'
import type { Note } from '../types/note'

export function NoteDetailPage() {
  const { id } = useParams()
  const [note, setNote] = useState<Note | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!id) return
    void getNote(id).then(setNote).catch(() => setError(true))
  }, [id])

  if (error) return <EmptyState title="Note not found." />
  if (!note) return <p className="text-muted">loading...</p>
  return <NoteEditor note={note} />
}
