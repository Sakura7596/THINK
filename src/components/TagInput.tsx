import { X } from 'lucide-react'
import { KeyboardEvent, useState } from 'react'
import { normalizeTags } from '../lib/tags'

export function TagInput({ tags, onChange }: { tags: string[]; onChange: (tags: string[]) => void }) {
  const [value, setValue] = useState('')

  function addTag() {
    const next = normalizeTags([...tags, value])
    onChange(next)
    setValue('')
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault()
      addTag()
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <button
            key={tag}
            type="button"
            className="inline-flex items-center gap-1 rounded-md border border-line bg-surface px-2 py-1 text-sm text-muted transition hover:text-ink"
            onClick={() => onChange(tags.filter((item) => item !== tag))}
            title={`Remove ${tag}`}
          >
            {tag}
            <X size={13} aria-hidden="true" />
          </button>
        ))}
      </div>
      <input
        className="field max-w-xs"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => {
          if (value.trim()) addTag()
        }}
        placeholder="Add tag"
      />
    </div>
  )
}
