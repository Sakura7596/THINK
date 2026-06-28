import { describe, expect, it } from 'vitest'
import { normalizeTags } from './tags'

describe('normalizeTags', () => {
  it('trims tags, removes blanks, and de-duplicates case-insensitively', () => {
    expect(normalizeTags([' idea ', '', 'Idea', 'writing', ' writing '])).toEqual(['idea', 'writing'])
  })
})
