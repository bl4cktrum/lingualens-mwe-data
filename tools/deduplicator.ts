/**
 * Deduplicator — merges CanonicalMweEntry arrays from multiple sources.
 *
 * Deduplication key: (expression, lang). Type mismatches across sources are
 * resolved by a priority tiebreak.
 *
 * Merge rules (applied in this order):
 *   1. Source priority wins on type mismatch:
 *        manual > wiktionary > github > tatoeba > opus
 *   2. When two entries agree on type, the one with higher `confidence` wins.
 *   3. Examples are unioned (up to 5, best-confidence source first).
 *   4. surfaceForms from the winning entry are kept; other entry's forms are
 *      appended if missing from the winner's list (deduped).
 *   5. separability / gapPositions: winner's values take precedence.
 *   6. frequencyRank: lowest (= most frequent) is kept.
 */

import type { CanonicalMweEntry } from "./canonical.ts"

const SOURCE_PRIORITY: Record<string, number> = {
  manual: 100,
  wiktionary: 80,
  tatoeba: 60,
  opus: 40
}

function sourcePriority(source: string): number {
  if (source.startsWith("github:")) return 65
  return SOURCE_PRIORITY[source] ?? 50
}

/**
 * Merge `incoming` into `winner`. Mutates `winner` in-place. Returns winner.
 */
function mergeInto(
  winner: CanonicalMweEntry,
  incoming: CanonicalMweEntry
): CanonicalMweEntry {
  // Union examples (max 5).
  if (incoming.examples && incoming.examples.length > 0) {
    const existing = new Set(winner.examples ?? [])
    const extra = incoming.examples.filter((e) => !existing.has(e))
    winner.examples = [...(winner.examples ?? []), ...extra].slice(0, 5)
  }

  // Union surface forms.
  if (incoming.surfaceForms && incoming.surfaceForms.length > 0) {
    const existing = new Set(winner.surfaceForms ?? [])
    const extra = incoming.surfaceForms.filter((f) => !existing.has(f))
    if (extra.length > 0) {
      winner.surfaceForms = [...(winner.surfaceForms ?? [winner.expression]), ...extra]
    }
  }

  // Keep best frequencyRank (lowest = more frequent).
  if (
    incoming.frequencyRank !== undefined &&
    (winner.frequencyRank === undefined || incoming.frequencyRank < winner.frequencyRank)
  ) {
    winner.frequencyRank = incoming.frequencyRank
  }

  // Source list: store as comma-joined string for sourcesUsed tracking.
  // We track this via the `source` field — append if different.
  if (!winner.source.split(",").includes(incoming.source)) {
    winner.source = `${winner.source},${incoming.source}`
  }

  return winner
}

export function deduplicate(entries: CanonicalMweEntry[]): CanonicalMweEntry[] {
  // Map from dedup key → winning entry.
  const map = new Map<string, CanonicalMweEntry>()

  for (const entry of entries) {
    const key = `${entry.lang}::${entry.expression}`
    const existing = map.get(key)

    if (!existing) {
      // Clone so we can mutate freely during merge.
      map.set(key, { ...entry })
      continue
    }

    const existingPriority = sourcePriority(existing.source.split(",")[0] ?? "")
    const incomingPriority = sourcePriority(entry.source)

    if (incomingPriority > existingPriority) {
      // Incoming wins on type/separability/gapPositions — merge examples from existing.
      const winner: CanonicalMweEntry = { ...entry }
      mergeInto(winner, existing)
      map.set(key, winner)
    } else if (
      incomingPriority === existingPriority &&
      entry.confidence > existing.confidence
    ) {
      const winner: CanonicalMweEntry = { ...entry }
      mergeInto(winner, existing)
      map.set(key, winner)
    } else {
      // Existing wins — just merge extras from incoming.
      mergeInto(existing, entry)
    }
  }

  return Array.from(map.values())
}

/** Collect unique source names used across all entries (for BundleFile.sourcesUsed). */
export function collectSourcesUsed(entries: CanonicalMweEntry[]): string[] {
  const sources = new Set<string>()
  for (const entry of entries) {
    for (const s of entry.source.split(",")) {
      const base = s.startsWith("github:") ? "github" : s
      sources.add(base)
    }
  }
  return [...sources].sort()
}
