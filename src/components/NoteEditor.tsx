import { ArrowLeft, Archive, Pin, PinOff, Save, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError, createNote, deleteNote, updateNote } from '../lib/api'
import { readableDate } from '../lib/date'
import { normalizeTags } from '../lib/tags'
import type { Note, NoteKind } from '../types/note'
import { SaveState, SaveStatus } from './SaveStatus'
import { TagInput } from './TagInput'

type Draft = {
  title: string
  content: string
  tags: string[]
  kind: NoteKind
  diary_date: string | null
  is_pinned: boolean
  is_archived: boolean
}

function draftKey(noteId?: string) {
  return noteId ? `think:draft:${noteId}` : 'think:draft:new'
}

function hasContent(draft: Draft) {
  return Boolean(draft.title.trim() || draft.content.trim())
}

function todayLocalDate(): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function diaryTitle(dateValue: string): string {
  const [year, month, day] = dateValue.split('-').map(Number)
  return `${year}年${month}月${day}日`
}

function conflictNoteId(error: unknown): string | null {
  if (!(error instanceof ApiError) || error.status !== 409) return null
  if (!error.data || typeof error.data !== 'object') return null
  const noteId = (error.data as { noteId?: unknown }).noteId
  return typeof noteId === 'string' ? noteId : null
}

function initialDraft(note?: Note): Draft {
  const kind = note?.kind ?? 'thought'
  const diaryDate = kind === 'diary' ? note?.diary_date ?? todayLocalDate() : null
  return {
    title: note?.title ?? '',
    content: note?.content ?? '',
    tags: note?.tags ?? [],
    kind,
    diary_date: diaryDate,
    is_pinned: kind === 'diary' ? false : note?.is_pinned ?? false,
    is_archived: note?.is_archived ?? false,
  }
}

export function NoteEditor({ note }: { note?: Note }) {
  const navigate = useNavigate()
  const [savedNote, setSavedNote] = useState<Note | undefined>(note)
  const [draft, setDraft] = useState<Draft>(() => initialDraft(note))
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [restoreAvailable, setRestoreAvailable] = useState(() => Boolean(localStorage.getItem(draftKey(note?.id))))
  const key = useMemo(() => draftKey(savedNote?.id), [savedNote?.id])
  const canSave = hasContent(draft) && saveState !== 'saving'
  const isDiary = draft.kind === 'diary'
  const backPath = savedNote?.kind === 'diary' || draft.kind === 'diary' ? '/diary' : '/notes'

  async function saveDraft() {
    if (!canSave) return

    const payload = {
      title: draft.title,
      content: draft.content,
      tags: draft.tags,
      kind: draft.kind,
      diary_date: draft.kind === 'diary' ? draft.diary_date : null,
      is_pinned: draft.kind === 'diary' ? false : draft.is_pinned,
      is_archived: draft.is_archived,
    }

    setSaveState('saving')
    try {
      if (savedNote) {
        const updated = await updateNote(savedNote.id, payload)
        setSavedNote(updated)
      } else {
        const created = await createNote(payload)
        localStorage.removeItem(key)
        setRestoreAvailable(false)
        setSaveState('saved')
        setSavedNote(created)
        navigate(`/notes/${created.id}`, { replace: true })
        return
      }
      localStorage.removeItem(key)
      setRestoreAvailable(false)
      setSaveState('saved')
    } catch (error) {
      const existingId = conflictNoteId(error)
      if (existingId) {
        navigate(`/notes/${existingId}`, { replace: true })
        return
      }
      localStorage.setItem(key, JSON.stringify(draft))
      setRestoreAvailable(true)
      setSaveState('error')
    }
  }

  function updateDraft(next: Partial<Draft>) {
    setDraft((current) => {
      const updated = { ...current, ...next }
      setSaveState(hasContent(updated) ? 'error' : 'idle')
      return updated
    })
  }

  function switchKind(kind: NoteKind) {
    setDraft((current) => {
      if (current.kind === kind) return current
      if (kind === 'diary') {
        const diaryDate = current.diary_date ?? todayLocalDate()
        const title = current.title.trim() ? current.title : diaryTitle(diaryDate)
        const updated = { ...current, kind, diary_date: diaryDate, title, is_pinned: false }
        setSaveState(hasContent(updated) ? 'error' : 'idle')
        return updated
      }

      const updated = { ...current, kind, diary_date: null }
      setSaveState(hasContent(updated) ? 'error' : 'idle')
      return updated
    })
  }

  function changeDiaryDate(diaryDate: string) {
    setDraft((current) => {
      const oldTitle = current.diary_date ? diaryTitle(current.diary_date) : ''
      const shouldUpdateTitle = !current.title.trim() || current.title === oldTitle
      const updated = {
        ...current,
        diary_date: diaryDate,
        title: shouldUpdateTitle ? diaryTitle(diaryDate) : current.title,
      }
      setSaveState(hasContent(updated) ? 'error' : 'idle')
      return updated
    })
  }

  function restoreDraft() {
    const local = localStorage.getItem(key)
    if (!local) return

    try {
      const parsed = JSON.parse(local) as Partial<Draft>
      const kind = parsed.kind === 'diary' ? 'diary' : 'thought'
      const restored: Draft = {
        title: parsed.title ?? '',
        content: parsed.content ?? '',
        tags: Array.isArray(parsed.tags) ? normalizeTags(parsed.tags) : [],
        kind,
        diary_date: kind === 'diary' ? parsed.diary_date ?? todayLocalDate() : null,
        is_pinned: kind === 'diary' ? false : Boolean(parsed.is_pinned),
        is_archived: Boolean(parsed.is_archived),
      }
      setDraft(restored)
      setSaveState(hasContent(restored) ? 'error' : 'idle')
      setRestoreAvailable(false)
    } catch {
      localStorage.removeItem(key)
      setRestoreAvailable(false)
    }
  }

  function togglePin() {
    if (isDiary) return
    updateDraft({ is_pinned: !draft.is_pinned })
  }

  function toggleArchive() {
    updateDraft({ is_archived: !draft.is_archived })
  }

  async function remove() {
    if (!savedNote) {
      navigate(backPath)
      return
    }
    await deleteNote(savedNote.id)
    navigate(backPath)
  }

  return (
    <section className="mx-auto max-w-3xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link to={backPath} className="link-button">
          <ArrowLeft size={16} />
          返回{backPath === '/diary' ? '日记' : '记录'}
        </Link>
        <div className="flex items-center gap-2">
          <SaveStatus state={saveState} />
          <button className="link-button" type="button" onClick={saveDraft} disabled={!canSave}>
            <Save size={16} />
            保存
          </button>
          {!isDiary ? (
            <button className="icon-button" type="button" onClick={togglePin} title={draft.is_pinned ? '取消置顶' : '置顶'}>
              {draft.is_pinned ? <PinOff size={16} /> : <Pin size={16} />}
            </button>
          ) : null}
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
        {!savedNote ? (
          <div className="mb-5 flex flex-wrap items-center gap-2 border-b border-line pb-5">
            <span className="text-sm text-muted">类型</span>
            {(['thought', 'diary'] as const).map((kind) => (
              <button
                key={kind}
                type="button"
                aria-pressed={draft.kind === kind}
                className={`rounded-md border px-3 py-1.5 text-sm transition ${
                  draft.kind === kind ? 'border-accent/40 bg-accent/10 text-accent' : 'border-line text-muted hover:text-ink'
                }`}
                onClick={() => switchKind(kind)}
              >
                {kind === 'thought' ? '思考' : '日记'}
              </button>
            ))}
          </div>
        ) : null}

        {isDiary ? (
          <label className="mb-5 block max-w-xs text-sm text-muted">
            日记日期
            <input className="field mt-2" type="date" value={draft.diary_date ?? todayLocalDate()} onChange={(event) => changeDiaryDate(event.target.value)} />
          </label>
        ) : null}

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
          {isDiary && draft.diary_date ? `日记日期 ${draft.diary_date} · ` : null}
          创建于 {readableDate(savedNote.created_at)} · 更新于 {readableDate(savedNote.updated_at)}
        </p>
      ) : null}
    </section>
  )
}
