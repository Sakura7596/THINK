export function normalizeTags(tags: string[]): string[] {
  const seen = new Set<string>()
  const normalized: string[] = []

  for (const tag of tags) {
    const value = tag.trim().replace(/\s+/g, ' ')
    if (!value) continue

    const key = value.toLocaleLowerCase()
    if (seen.has(key)) continue

    seen.add(key)
    normalized.push(key)
  }

  return normalized
}
