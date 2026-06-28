export type SaveState = 'idle' | 'saving' | 'saved' | 'error'

const labels: Record<SaveState, string> = {
  idle: '',
  saving: '保存中...',
  saved: '已保存',
  error: '未保存',
}

export function SaveStatus({ state }: { state: SaveState }) {
  if (state === 'idle') return null

  return (
    <span
      className={`text-sm ${state === 'error' ? 'text-red-700' : state === 'saving' ? 'text-muted' : 'text-accent'}`}
      role="status"
    >
      {labels[state]}
    </span>
  )
}
