/**
 * Wiktionary fetcher — MediaWiki API category member traversal.
 *
 * Strategy:
 *   For each language + MWE type, one or more Wiktionary categories are
 *   defined in `lang-config.ts`. This fetcher walks those categories with
 *   `action=query&list=categorymembers`, collects the page titles (which are
 *   the MWE expressions), and returns them as raw strings. Normalisation to
 *   CanonicalMweEntry happens in `normalizers/wiktionary.ts`.
 *
 * Rate limiting: MediaWiki imposes a soft limit of 500 requests/min for
 * anonymous clients. We use a 150 ms inter-request delay and batch up to 500
 * members per call (the API maximum).
 *
 * API reference:
 *   https://www.mediawiki.org/wiki/API:Categorymembers
 */

import type { MweType } from "../canonical.ts"

const API_BASE = "https://en.wiktionary.org/w/api.php"
const BATCH_SIZE = 500
const DELAY_MS = 150

export interface WiktionaryRawEntry {
  title: string
  type: MweType
  lang: string
}

/** Fetch all page titles from a Wiktionary category (handles continuation). */
async function fetchCategoryMembers(
  category: string,
  signal?: AbortSignal
): Promise<string[]> {
  const titles: string[] = []
  let cmcontinue: string | undefined

  do {
    await delay(DELAY_MS)

    const params = new URLSearchParams({
      action: "query",
      list: "categorymembers",
      cmtitle: category.startsWith("Category:") ? category : `Category:${category}`,
      cmlimit: String(BATCH_SIZE),
      cmnamespace: "0", // Main namespace only (entry pages, not talk/user)
      format: "json",
      origin: "*"
    })
    if (cmcontinue) params.set("cmcontinue", cmcontinue)

    const url = `${API_BASE}?${params}`
    const res = await fetch(url, { signal: signal ?? null })
    if (!res.ok) throw new Error(`Wiktionary API error ${res.status} for ${category}`)

    const json = (await res.json()) as {
      query: { categorymembers: Array<{ title: string }> }
      continue?: { cmcontinue: string }
    }

    for (const m of json.query.categorymembers) {
      titles.push(m.title)
    }

    cmcontinue = json.continue?.cmcontinue
  } while (cmcontinue)

  return titles
}

/**
 * Fetch raw MWE titles from Wiktionary for the given language + categories.
 *
 * @param lang  ISO 639-1 language code (e.g. "en", "de")
 * @param categoryMap  Map of MweType → category names to fetch
 * @param signal  Optional AbortSignal for cancellation
 */
export async function fetchWiktionary(
  lang: string,
  categoryMap: Partial<Record<MweType, string[]>>,
  signal?: AbortSignal
): Promise<WiktionaryRawEntry[]> {
  const results: WiktionaryRawEntry[] = []

  for (const [type, categories] of Object.entries(categoryMap) as Array<
    [MweType, string[]]
  >) {
    for (const cat of categories) {
      console.log(`  [wiktionary] fetching ${cat} …`)
      try {
        const titles = await fetchCategoryMembers(cat, signal)
        console.log(`  [wiktionary] ${cat}: ${titles.length} entries`)
        for (const title of titles) {
          results.push({ title, type, lang })
        }
      } catch (err) {
        // Non-fatal: log and continue with other categories.
        console.warn(`  [wiktionary] skipped ${cat}: ${(err as Error).message}`)
      }
    }
  }

  return results
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
