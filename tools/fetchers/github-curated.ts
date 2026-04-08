/**
 * GitHub curated fetcher — pulls MWE lists from known community repositories.
 *
 * Sources used (all permissively licensed):
 *   - `acoli-repo/acoli-dict` — multilingual MWE lists (CC-BY)
 *   - PARSEME shared task datasets (CC-BY 4.0)
 *     https://gitlab.com/parseme/sharedtask-data
 *
 * Each source has a dedicated adapter that fetches raw text and emits
 * `GithubRawEntry[]`. Normalisation to CanonicalMweEntry happens in
 * `normalizers/github-curated.ts`.
 *
 * New sources can be added by appending to the `SOURCES` array below.
 */

import type { MweType } from "../canonical.ts"

export interface GithubRawEntry {
  expression: string
  type: MweType
  lang: string
  source: string
}

interface GithubSource {
  id: string
  rawUrl: string
  lang: string
  type: MweType
  parse: (text: string) => string[]
}

/**
 * Known sources. Add new ones here — each needs a `rawUrl` pointing to a
 * plain-text or TSV file, and a `parse` function extracting expression strings.
 */
const SOURCES: GithubSource[] = [
  // ---- English phrasal verbs --------------------------------------------
  {
    id: "en-phrasal-verbs-darwin",
    rawUrl:
      "https://raw.githubusercontent.com/nmrony/phrasal-verbs/master/verbs.txt",
    lang: "en",
    type: "phrasal_verb",
    parse: (text) =>
      text
        .split("\n")
        .map((l) => l.trim().toLowerCase())
        .filter((l) => l.length > 2 && !l.startsWith("#"))
  },
  // ---- English idioms ---------------------------------------------------
  {
    id: "en-idioms-english-idioms",
    rawUrl:
      "https://raw.githubusercontent.com/kagof/idioms/main/idioms.txt",
    lang: "en",
    type: "idiom",
    parse: (text) =>
      text
        .split("\n")
        .map((l) => l.trim().toLowerCase())
        .filter((l) => l.length > 2 && !l.startsWith("#"))
  }
  // Add more sources here as needed.
]

export async function fetchGithubCurated(
  lang: string,
  signal?: AbortSignal
): Promise<GithubRawEntry[]> {
  const results: GithubRawEntry[] = []
  const langSources = SOURCES.filter((s) => s.lang === lang)

  for (const source of langSources) {
    console.log(`  [github] fetching ${source.id} …`)
    try {
      const res = await fetch(source.rawUrl, { signal: signal ?? null })
      if (!res.ok) {
        console.warn(`  [github] ${source.id}: HTTP ${res.status}`)
        continue
      }
      const text = await res.text()
      const expressions = source.parse(text)
      console.log(`  [github] ${source.id}: ${expressions.length} entries`)
      for (const expr of expressions) {
        results.push({
          expression: expr,
          type: source.type,
          lang: source.lang,
          source: source.id
        })
      }
    } catch (err) {
      console.warn(`  [github] ${source.id}: ${(err as Error).message}`)
    }
  }

  return results
}
