import { beforeEach, describe, expect, it, vi } from 'vitest'
import worker from './worker'
import type { WorkerEnv } from '../functions/_shared/supabase'

const env: WorkerEnv = {
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'service-key',
}

describe('worker note API diary support', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  it('filters and sorts diary lists by diary date', async () => {
    const fetchMock = vi.fn(async () => new Response('[]', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    const response = await worker.fetch(new Request('https://think.test/api/notes?kind=diary'), env)

    expect(response.status).toBe(200)
    const calls = fetchMock.mock.calls as unknown as Array<[RequestInfo | URL, RequestInit?]>
    const url = String(calls[0]?.[0])
    expect(url).toContain('kind=eq.diary')
    expect(url).toContain('order=diary_date.desc%2Cupdated_at.desc')
  })

  it('returns an existing diary instead of creating a duplicate date', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('[{"id":"diary-1"}]', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    const response = await worker.fetch(
      new Request('https://think.test/api/notes', {
        method: 'POST',
        body: JSON.stringify({
          kind: 'diary',
          diary_date: '2026-07-02',
          title: '2026年7月2日',
          content: '今天的日记',
          tags: [],
        }),
      }),
      env,
    )

    expect(response.status).toBe(409)
    await expect(response.json()).resolves.toEqual({ error: 'diary_exists', noteId: 'diary-1' })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
