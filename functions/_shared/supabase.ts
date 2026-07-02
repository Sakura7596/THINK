export type Env = {
  SUPABASE_URL: string
  SUPABASE_SERVICE_ROLE_KEY: string
}

export type WorkerEnv = Env & {
  ASSETS?: Fetcher
}

export type NoteKind = 'thought' | 'diary'

export type DbNote = {
  id: string
  title: string
  content: string
  tags: string[]
  kind: NoteKind
  diary_date: string | null
  is_pinned: boolean
  is_archived: boolean
  is_deleted: boolean
  created_at: string
  updated_at: string
}

export function assertEnv(env: Env): void {
  if (!env.SUPABASE_URL.trim() || !env.SUPABASE_SERVICE_ROLE_KEY.trim()) {
    throw new Error('缺少 Supabase 环境变量')
  }
}

export function serviceKeyType(env: Env): 'secret' | 'publishable' | 'jwt' | 'unknown' {
  const key = env.SUPABASE_SERVICE_ROLE_KEY.trim()
  if (key.startsWith('sb_secret_')) return 'secret'
  if (key.startsWith('sb_publishable_')) return 'publishable'
  if (key.split('.').length === 3) return 'jwt'
  return 'unknown'
}

export function json(data: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...init.headers,
    },
  })
}

export function text(data: string, init: ResponseInit = {}): Response {
  return new Response(data, {
    ...init,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      ...init.headers,
    },
  })
}

export async function readJson(request: Request): Promise<Record<string, unknown>> {
  try {
    const value = await request.json()
    return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {}
  } catch {
    return {}
  }
}

export function isNoteKind(value: unknown): value is NoteKind {
  return value === 'thought' || value === 'diary'
}

export function isIsoDate(value: unknown): value is string {
  if (typeof value !== 'string') return false
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

export function notePayload(input: Record<string, unknown>) {
  const payload: Record<string, unknown> = {}

  if (typeof input.title === 'string') payload.title = input.title
  if (typeof input.content === 'string') payload.content = input.content
  if (Array.isArray(input.tags)) {
    payload.tags = input.tags.filter((tag): tag is string => typeof tag === 'string').map((tag) => tag.trim()).filter(Boolean)
  }
  if (isNoteKind(input.kind)) payload.kind = input.kind
  if (isIsoDate(input.diary_date)) payload.diary_date = input.diary_date
  if (typeof input.is_pinned === 'boolean') payload.is_pinned = input.is_pinned
  if (typeof input.is_archived === 'boolean') payload.is_archived = input.is_archived

  return payload
}

export function isEmptyNotePayload(payload: Record<string, unknown>): boolean {
  return !String(payload.title ?? '').trim() && !String(payload.content ?? '').trim()
}

export class SupabaseRestError extends Error {
  constructor(public readonly status: number, statusText: string) {
    super(`Supabase REST failed: ${status} ${statusText}`)
    this.name = 'SupabaseRestError'
  }
}

type SupabaseRequestOptions = {
  method?: string
  query?: string
  body?: unknown
  prefer?: string
}

export async function supabaseRest<T>(env: Env, path: string, options: SupabaseRequestOptions = {}): Promise<T> {
  assertEnv(env)
  const supabaseUrl = env.SUPABASE_URL.trim().replace(/\/$/, '')
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY.trim()
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}${options.query ?? ''}`, {
    method: options.method ?? 'GET',
    headers: {
      apikey: serviceKey,
      ...(serviceKey.startsWith('sb_secret_') ? {} : { Authorization: `Bearer ${serviceKey}` }),
      'Content-Type': 'application/json',
      ...(options.prefer ? { Prefer: options.prefer } : {}),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  })

  const body = await response.text()
  if (!response.ok) {
    throw new SupabaseRestError(response.status, response.statusText)
  }

  return body ? (JSON.parse(body) as T) : ([] as T)
}
