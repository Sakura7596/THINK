export type Note = {
  id: string
  title: string
  content: string
  tags: string[]
  is_pinned: boolean
  is_archived: boolean
  is_deleted: boolean
  created_at: string
  updated_at: string
}

export type NoteInput = {
  title: string
  content: string
  tags: string[]
  is_pinned?: boolean
  is_archived?: boolean
}
