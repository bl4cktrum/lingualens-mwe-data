/**
 * GitHub curated normalizer — converts GithubRawEntry to CanonicalMweEntry.
 *
 * GitHub sources vary in quality; we use a baseline confidence of 0.65
 * (below Wiktionary's 0.7) because they're less structured. Manual overrides
 * (confidence 1.0) always win in the deduplicator.
 */

import {
  normaliseExpression,
  isValidExpression,
  type CanonicalMweEntry
} from "../canonical.ts"
import type { GithubRawEntry } from "../fetchers/github-curated.ts"

export function normalizeGithubCurated(raw: GithubRawEntry[]): CanonicalMweEntry[] {
  const results: CanonicalMweEntry[] = []

  for (const entry of raw) {
    const expr = normaliseExpression(entry.expression)
    if (!isValidExpression(expr)) continue

    results.push({
      expression: expr,
      lang: entry.lang,
      type: entry.type,
      confidence: 0.65,
      source: `github:${entry.source}`
    })
  }

  return results
}
