/**
 * Manual CSV normalizer — converts ManualCsvRawEntry to CanonicalMweEntry.
 *
 * Manual entries have the highest confidence (default 1.0) and their fields
 * map 1:1 to canonical fields. The main jobs here are:
 *   - normaliseExpression on the expression string
 *   - validate the type enum value
 *   - pass all optional fields through unchanged
 */

import {
  normaliseExpression,
  isValidExpression,
  type CanonicalMweEntry
} from "../canonical.ts"
import type { ManualCsvRawEntry } from "../fetchers/manual-csv.ts"

export function normalizeManualCsv(raw: ManualCsvRawEntry[]): CanonicalMweEntry[] {
  const results: CanonicalMweEntry[] = []

  for (const entry of raw) {
    const expr = normaliseExpression(entry.expression)
    if (!isValidExpression(expr)) {
      console.warn(`  [manual-csv] invalid expression '${entry.expression}' — skipping`)
      continue
    }

    const canonical: CanonicalMweEntry = {
      expression: expr,
      lang: entry.lang,
      type: entry.type,
      confidence: entry.confidence,
      source: "manual"
    }

    if (entry.examples && entry.examples.length > 0) canonical.examples = entry.examples
    if (entry.surfaceForms && entry.surfaceForms.length > 0) {
      // Ensure canonical form is always the first surface form.
      const forms = entry.surfaceForms.map((f) => normaliseExpression(f))
      if (!forms.includes(expr)) forms.unshift(expr)
      canonical.surfaceForms = forms
    }
    if (entry.separability !== undefined) canonical.separability = entry.separability
    if (entry.gapPositions && entry.gapPositions.length > 0) canonical.gapPositions = entry.gapPositions

    results.push(canonical)
  }

  return results
}
