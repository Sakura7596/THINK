import { afterEach, describe, expect, it, vi } from 'vitest'
import { SupabaseRestError, supabaseRest } from './supabase'

describe('supabaseRest', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('calls Supabase REST with service role headers and parses JSON', async () => {
    const fetchMock = vi.fn(async () => new Response('[{"id":"note-1"}]', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    const data = await supabaseRest<{ id: string }[]>(
      { SUPABASE_URL: 'https://example.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'service-key' },
      'notes',
      {
        method: 'POST',
        query: '?select=*',
        body: { title: '测试' },
        prefer: 'return=representation',
      },
    )

    expect(data).toEqual([{ id: 'note-1' }])
    expect(fetchMock).toHaveBeenCalledWith('https://example.supabase.co/rest/v1/notes?select=*', {
      method: 'POST',
      headers: {
        apikey: 'service-key',
        Authorization: 'Bearer service-key',
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({ title: '测试' }),
    })
  })

  it('does not expose Supabase response bodies in thrown errors', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('database internals', { status: 500, statusText: 'Internal Server Error' })))

    await expect(supabaseRest({ SUPABASE_URL: 'https://example.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'service-key' }, 'notes')).rejects.toMatchObject({
      name: 'SupabaseRestError',
      message: 'Supabase REST failed: 500 Internal Server Error',
      status: 500,
    })
    await expect(supabaseRest({ SUPABASE_URL: 'https://example.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'service-key' }, 'notes')).rejects.toBeInstanceOf(SupabaseRestError)
  })
})