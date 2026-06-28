import { createClient, SupabaseClient } from '@supabase/supabase-js'

export type Env = {
  SUPABASE_URL: string
  SUPABASE_SERVICE_ROLE_KEY: string
}

export type WorkerEnv = Env & {
  ASSETS?: Fetcher
}

export type DbNote = {
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

export function getSupabase(env: Env): SupabaseClient {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('缺少 Supabase 环境变量')
  }

  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  })
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

export function notePayload(input: Record<string, unknown>) {
  const payload: Record<string, unknown> = {}

  if (typeof input.title === 'string') payload.title = input.title
  if (typeof input.content === 'string') payload.content = input.content
  if (Array.isArray(input.tags)) {
    payload.tags = input.tags.filter((tag): tag is string => typeof tag === 'string').map((tag) => tag.trim()).filter(Boolean)
  }
  if (typeof input.is_pinned === 'boolean') payload.is_pinned = input.is_pinned
  if (typeof input.is_archived === 'boolean') payload.is_archived = input.is_archived

  return payload
}

export function isEmptyNotePayload(payload: Record<string, unknown>): boolean {
  return !String(payload.title ?? '').trim() && !String(payload.content ?? '').trim()
}
