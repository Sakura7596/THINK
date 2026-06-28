import { FileText } from 'lucide-react'

export function EmptyState({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-md border border-dashed border-line bg-surface/45 px-6 py-12 text-center">
      <FileText className="mb-4 text-muted" size={28} aria-hidden="true" />
      <p className="text-lg text-ink">{title}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}
