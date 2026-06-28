import { ArrowLeft, Archive, Pin, PinOff, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createNote, deleteNote, updateNote } from '../lib/api'
import { readableDate } from '../lib/date'
import { normalizeTags } from '../lib/tags'
import type { Note } from '../types/note'
import { SaveState, SaveStatus } from './SaveStatus'
import { TagInput } from './TagInput'

type Draft = {
  title: string
  content: string
  tags: string[]
  is_pinned: boolean
  is_archived: boolean
}

function draftKey(noteId?: string) {
  return noteId ? `think:draft:${noteId}` : 'think:draft:new'
}

function hasContent(draft: Draft) {
  return Boolean(draft.title.trim() || draft.content.trim())
}

export function NoteEditor({ note }: { note?: Note }) {
  const navigate = useNavigate()
  const [savedNote, setSavedNote] = useState<Note | undefined>(note)
  const [draft, setDraft] = useState<Draft>(() => ({
    title: note?.title ?? '',
    content: note?.content ?? '',
    tags: note?.tags ?? [],
    is_pinned: note?.is_pinned ?? false,
    is_archived: note?.is_archived ?? false,
  }))
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [restoreAvailable, setRestoreAvailable] = useState(() => Boolean(localStorage.getItem(draftKey(note?.id))))
  const firstRun = useRef(true)
  const key = useMemo(() => draftKey(savedNote?.id), [savedNote?.id])

  const saveDraft = useCallback(async () => {
    if (!hasContent(draft)) return

    setSaveState('saving')
    try {
      if (savedNote) {
        const updated = await updateNote(savedNote.id, draft)
        setSavedNote(updated)
      } else {
        const created = await createNote(draft)
        setSavedNote(created)
        navigate(`/notes/${created.id}`, { replace: true })
      }
      localStorage.removeItem(key)
      setRestoreAvailable(false)
      setSaveState('saved')
    } catch {
      localStorage.setItem(key, JSON.stringify(draft))
      setRestoreAvailable(true)
      setSaveState('error')
    }
  }, [draft, key, navigate, savedNote])

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false
      return
    }

    const timer = window.setTimeout(() => {
      void saveDraft()
    }, 1500)

    return () => window.clearTimeout(timer)
  }, [saveDraft])

  function updateDraft(next: Partial<Draft>) {
    setDraft((current) => ({ ...current, ...next }))
  }

  function restoreDraft() {
    const local = localStorage.getItem(key)
    if (!local) return

    try {
      const parsed = JSON.parse(local) as Draft
      setDraft({
        title: parsed.title ?? '',
        content: parsed.content ?? '',
        tags: Array.isArray(parsed.tags) ? normalizeTags(parsed.tags) : [],
        is_pinned: Boolean(parsed.is_pinned),
        is_archived: Boolean(parsed.is_archived),
      })
      setRestoreAvailable(false)
    } catch {
      localStorage.removeItem(key)
      setRestoreAvailable(false)
    }
  }

  async function togglePin() {
    const next = !draft.is_pinned
    updateDraft({ is_pinned: next })
    if (savedNote) await updateNote(savedNote.id, { is_pinned: next })
  }

  async function toggleArchive() {
    const next = !draft.is_archived
    updateDraft({ is_archived: next })
    if (savedNote) await updateNote(savedNote.id, { is_archived: next })
  }

  async function remove() {
    if (!savedNote) {
      navigate('/notes')
      return
    }
    await deleteNote(savedNote.id)
    navigate('/notes')
  }

  return (
    <section className="mx-auto max-w-3xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link to="/notes" className="link-button">
          <ArrowLeft size={16} />
          返回记录
        </Link>
        <div className="flex items-center gap-2">
          <SaveStatus state={saveState} />
          <button className="icon-button" type="button" onClick={togglePin} title={draft.is_pinned ? '取消置顶' : '置顶'}>
            {draft.is_pinned ? <PinOff size={16} /> : <Pin size={16} />}
          </button>
          <button className="icon-button" type="button" onClick={toggleArchive} title={draft.is_archived ? '取消归档' : '归档'}>
            <Archive size={16} />
          </button>
          <button className="icon-button" type="button" onClick={remove} title="删除">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {restoreAvailable ? (
        <div className="mb-5 flex items-center justify-between gap-3 rounded-md border border-line bg-surface px-4 py-3 text-sm text-muted">
          <span>发现本地草稿。</span>
          <button type="button" className="text-accent" onClick={restoreDraft}>
            恢复
          </button>
        </div>
      ) : null}

      <div className="rounded-md border border-line bg-surface p-5 shadow-soft sm:p-7">
        <input
          className="mb-5 w-full border-none bg-transparent text-3xl font-medium text-ink outline-none placeholder:text-muted/55"
          value={draft.title}
          onChange={(event) => updateDraft({ title: event.target.value })}
          placeholder="未命名"
        />
        <textarea
          className="min-h-[48vh] w-full border-none bg-transparent text-base leading-8 text-ink outline-none placeholder:text-muted/65"
          value={draft.content}
          onChange={(event) => updateDraft({ content: event.target.value })}
          placeholder="写点什么..."
        />
        <div className="mt-6 border-t border-line pt-5">
          <TagInput tags={draft.tags} onChange={(tags) => updateDraft({ tags })} />
        </div>
      </div>

      {savedNote ? (
        <p className="mt-4 text-sm text-muted">
          创建于 {readableDate(savedNote.created_at)} · 更新于 {readableDate(savedNote.updated_at)}
        </p>
      ) : null}
    </section>
  )
}
