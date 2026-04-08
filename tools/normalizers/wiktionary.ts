/**
 * Wiktionary normalizer — converts WiktionaryRawEntry titles to
 * CanonicalMweEntry.
 *
 * Wiktionary page titles for English phrasal verbs look like:
 *   "look up", "come across", "take into account"
 * For other languages they may have parenthetical disambiguation:
 *   "abfahren (phrasal)", "sich anmelden"
 *
 * This normalizer:
 *   1. Strips Wiktionary-specific cruft (parenthetical disambiguation,
 *      language prefixes, reflexive pronouns that are obvious).
 *   2. Applies `normaliseExpression` for lowercase + NFC.
 *   3. Infers separability heuristically for phrasal verbs (lang=="en"):
 *      particle-final two-token phrasal verbs → separability=1.
 *   4. Sets a confidence score based on token count (longer = more specific
 *      = higher confidence, capped at 0.9; single-source Wiktionary entries
 *      start at 0.7 baseline).
 */

import {
  normaliseExpression,
  isValidExpression,
  type CanonicalMweEntry
} from "../canonical.ts"
import type { WiktionaryRawEntry } from "../fetchers/wiktionary.ts"
import { phrasalVerbForms } from "../morphology/en-conjugator.ts"
import { buildDeSeparableEntries } from "../morphology/de-conjugator.ts"

// Pre-build de lookup: canonical → forms
const DE_FORMS = new Map<string, string[]>()
for (const e of buildDeSeparableEntries()) {
  DE_FORMS.set(e.canonical, e.forms)
  DE_FORMS.set(e.fused, e.forms)
}

/** English particles commonly found in phrasal verbs. */
const EN_PARTICLES = new Set([
  "up", "down", "out", "in", "off", "on", "over", "around", "about",
  "away", "back", "by", "forward", "through", "together", "along",
  "apart", "across", "after", "against", "ahead", "aside", "at",
  "beyond", "into", "onto", "past", "round", "under", "with"
])

/** Strip Wiktionary parenthetical disambiguation like "abfahren (1)". */
function stripParenthetical(title: string): string {
  return title.replace(/\s*\([^)]*\)\s*$/, "").trim()
}

/** Heuristically infer separability for English phrasal verbs. */
function inferSeparability(
  tokens: string[],
  type: "phrasal_verb" | "collocation" | "idiom" | "fixed",
  lang: string
): 0 | 1 | 2 {
  if (type !== "phrasal_verb" || lang !== "en") return 0
  // Two-token "verb + particle" → separable (loose).
  if (tokens.length === 2 && EN_PARTICLES.has(tokens[1] ?? "")) return 1
  // Three-token "verb + particle + particle" (e.g. "come up with") → fixed.
  return 0
}

export function normalizeWiktionary(raw: WiktionaryRawEntry[]): CanonicalMweEntry[] {
  const results: CanonicalMweEntry[] = []

  for (const entry of raw) {
    const stripped = stripParenthetical(entry.title)
    const expr = normaliseExpression(stripped)

    if (!isValidExpression(expr)) continue

    const tokens = expr.split(" ")
    const separability = inferSeparability(tokens, entry.type, entry.lang)

    // Confidence: baseline 0.7, +0.05 per extra token (longer = more specific),
    // capped at 0.9.
    const confidence = Math.min(0.7 + (tokens.length - 2) * 0.05, 0.9)

    // Auto-generate surface forms for phrasal verbs.
    let surfaceForms: string[] | undefined
    if (entry.type === "phrasal_verb") {
      if (entry.lang === "en") {
        const forms = phrasalVerbForms(expr)
        if (forms.length > 1) surfaceForms = forms
      } else if (entry.lang === "de") {
        const forms = DE_FORMS.get(expr)
        if (forms && forms.length > 1) surfaceForms = forms
      }
    }

    results.push({
      expression: expr,
      lang: entry.lang,
      type: entry.type,
      separability: separability || undefined,
      ...(surfaceForms ? { surfaceForms } : {}),
      source: "wiktionary",
      confidence
    })
  }

  return results
}
