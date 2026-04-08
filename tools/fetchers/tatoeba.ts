/**
 * Tatoeba fetcher — example sentence extraction.
 *
 * Tatoeba's primary value in this pipeline is NOT discovery (finding new
 * MWEs) but augmentation: given a known expression, find real example
 * sentences containing it. These sentences go into the `examples` field of
 * the canonical entry.
 *
 * API used:
 *   https://tatoeba.org/en/api_v0/search?from={lang}&query={expression}&limit=5
 *
 * This fetcher is called AFTER deduplication, enriching entries that have
 * fewer than 3 examples. The builder wires this call appropriately.
 *
 * Rate limiting: Tatoeba asks for ≤1 req/s. We use 1 100 ms delay between
 * requests.
 */

const API_BASE = "https://tatoeba.org/en/api_v0/search"
const DELAY_MS = 1100
const MAX_EXAMPLES = 5

export interface TatoebaResult {
  expression: string
  lang: string
  examples: string[]
}

let lastCallAt = 0

async function rateLimitedFetch(url: string, signal?: AbortSignal): Promise<Response> {
  const now = Date.now()
  const wait = DELAY_MS - (now - lastCallAt)
  if (wait > 0) await new Promise((r) => setTimeout(r, wait))
  lastCallAt = Date.now()
  return fetch(url, { signal: signal ?? null })
}

export async function fetchTatoebaExamples(
  expression: string,
  lang: string,
  signal?: AbortSignal
): Promise<TatoebaResult> {
  const params = new URLSearchParams({
    from: lang,
    query: expression,
    limit: String(MAX_EXAMPLES)
  })
  const url = `${API_BASE}?${params}`

  try {
    const res = await rateLimitedFetch(url, signal)
    if (!res.ok) {
      return { expression, lang, examples: [] }
    }
    const json = (await res.json()) as {
      results?: Array<{ text?: string }>
    }
    const examples = (json.results ?? [])
      .map((r) => r.text ?? "")
      .filter(Boolean)
      .slice(0, MAX_EXAMPLES)
    return { expression, lang, examples }
  } catch {
    return { expression, lang, examples: [] }
  }
}

/**
 * Bulk-enrich entries that have fewer than `minExamples` examples.
 * Mutates entries in-place. Returns the count of entries that were enriched.
 */
export async function enrichWithTatoeba(
  entries: Array<{ expression: string; lang: string; examples?: string[] }>,
  minExamples = 2,
  signal?: AbortSignal
): Promise<number> {
  let enriched = 0
  for (const entry of entries) {
    if ((entry.examples?.length ?? 0) >= minExamples) continue
    const result = await fetchTatoebaExamples(entry.expression, entry.lang, signal)
    if (result.examples.length > 0) {
      entry.examples = [
        ...(entry.examples ?? []),
        ...result.examples
      ].slice(0, MAX_EXAMPLES)
      enriched++
    }
  }
  return enriched
}
