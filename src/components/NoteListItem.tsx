import { Archive, Pin, PinOff, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { createExcerpt } from '../lib/export'
import { relativeTime } from '../lib/date'
import type { Note } from '../types/note'

export function NoteListItem({
  note,
  onPin,
  onArchive,
  onDelete,
}: {
  note: Note
  onPin: (note: Note) => void
  onArchive: (note: Note) => void
  onDelete: (note: Note) => void
}) {
  return (
    <article className="group border-b border-line py-5 last:border-b-0">
      <div className="flex items-start justify-between gap-4">
        <Link to={`/notes/${note.id}`} className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2 text-sm text-muted">
            <time>{relativeTime(note.updated_at)}</time>
            {note.is_pinned ? <span className="rounded-md bg-accent/10 px-2 py-0.5 text-accent">置顶</span> : null}
            {note.tags.map((tag) => (
              <span key={tag} className="rounded-md bg-surface px-2 py-0.5">
                {tag}
              </span>
            ))}
          </div>
          <h2 className="truncate text-lg font-medium text-ink">{note.title.trim() || '未命名'}</h2>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">{createExcerpt(note.content) || '没有正文'}</p>
        </Link>
        <div className="flex shrink-0 items-center gap-1 opacity-100 sm:opacity-0 sm:transition sm:group-hover:opacity-100">
          <button className="icon-button" type="button" onClick={() => onPin(note)} title={note.is_pinned ? '取消置顶' : '置顶'}>
            {note.is_pinned ? <PinOff size={16} /> : <Pin size={16} />}
          </button>
          <button className="icon-button" type="button" onClick={() => onArchive(note)} title={note.is_archived ? '取消归档' : '归档'}>
            <Archive size={16} />
          </button>
          <button className="icon-button" type="button" onClick={() => onDelete(note)} title="删除">
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </article>
  )
}
