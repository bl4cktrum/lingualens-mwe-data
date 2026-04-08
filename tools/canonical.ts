/**
 * Canonical MWE entry — single source of truth for the data pipeline.
 *
 * Every fetcher/normalizer emits `CanonicalMweEntry[]`. The deduplicator
 * merges them, the validator checks invariants, and the builder compacts them
 * into `CompactBundleEntry[]` for the final `BundleFile`.
 *
 * Wire types (CompactBundleEntry / BundleFile) are defined separately in
 * `bundle-format.ts` — imported here only for the compaction helper so this
 * file stays the single place that knows both shapes.
 */

import { z } from "zod"

// ---------------------------------------------------------------------------
// MWE kind
// ---------------------------------------------------------------------------

export const MWE_TYPES = [
  "phrasal_verb",
  "collocation",
  "idiom",
  "fixed"
] as const

export type MweType = (typeof MWE_TYPES)[number]

/** Maps MweType → kind index used in the wire format (must stay in sync with
 *  the extension's `bundle-format.ts` KIND_TO_TYPE array). */
export const TYPE_TO_KIND: Record<MweType, number> = {
  phrasal_verb: 0,
  collocation: 1,
  idiom: 2,
  fixed: 3
}

// ---------------------------------------------------------------------------
// Separability
// ---------------------------------------------------------------------------

export const SeparabilitySchema = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2)
])
export type Separability = z.infer<typeof SeparabilitySchema>

// ---------------------------------------------------------------------------
// Canonical entry schema (Zod)
// ---------------------------------------------------------------------------

export const CanonicalMweEntrySchema = z.object({
  /**
   * Canonical/lemma form. Must be lowercase + NFC-normalised. Tokens
   * separated by single spaces. No leading/trailing whitespace.
   * Example: "look up", "take into account", "kick the bucket"
   */
  expression: z.string().min(3),

  /** ISO 639-1 source language code. */
  lang: z.string().regex(/^[a-z]{2,3}$/),

  /** MWE kind — determines which bucket in the bundle. */
  type: z.enum(MWE_TYPES),

  /**
   * Example sentences in the source language (max 5). Used in the
   * concordance UI and for SRS card generation.
   */
  examples: z.array(z.string().min(1)).max(5).optional(),

  /**
   * Inflected surface forms (include the canonical form as the first
   * element). When omitted the compactor writes no `f` field and the
   * runtime synthesises `[expression]` on load.
   * Example: ["look up", "looking up", "looks up", "looked up"]
   */
  surfaceForms: z.array(z.string().min(1)).optional(),

  /**
   * Separability mode for the detector's skip-gap matcher.
   *   0 = fixed (no gap): "of course", "in spite of"
   *   1 = loose (any 1–3 token gap): "look [pronoun] up"
   *   2 = tight (gap tokens must be in skipGapTokens whitelist)
   * Defaults to 0 when omitted.
   */
  separability: SeparabilitySchema.optional(),

  /**
   * Token index positions (0-based, inside the canonical token list) where
   * a gap may be inserted. For "look up" → [1] (gap between "look" and
   * "up"). When omitted and separability > 0, the runtime defaults to
   * "right before the last token".
   */
  gapPositions: z.array(z.number().int().nonnegative()).optional(),

  // ---- provenance fields (stripped before compaction) --------------------

  /** Which pipeline source produced this entry. */
  source: z.string(),

  /**
   * Confidence score [0,1]. Used by the deduplicator to break ties and
   * pick the highest-quality entry when merging duplicates across sources.
   */
  confidence: z.number().min(0).max(1),

  /** Frequency rank within the source (lower = more frequent). Optional. */
  frequencyRank: z.number().int().positive().optional()
})

export type CanonicalMweEntry = z.infer<typeof CanonicalMweEntrySchema>

// ---------------------------------------------------------------------------
// Bundle meta schema
// ---------------------------------------------------------------------------

export const BundleMetaSchema = z.object({
  skipGapTokens: z.array(z.string()).optional()
})
export type BundleMeta = z.infer<typeof BundleMetaSchema>

// ---------------------------------------------------------------------------
// Language config (per-language pipeline settings)
// ---------------------------------------------------------------------------

/** Per-language build configuration shipped in `tools/lang-config.ts`. */
export interface LangConfig {
  /** ISO 639-1 code. */
  lang: string
  /** Human-readable name (for logs). */
  name: string
  /**
   * Sources to use for this language, in priority order (highest first).
   * The deduplicator processes them in this order so earlier sources "win"
   * on duplicate resolution.
   */
  sources: Array<"wiktionary" | "tatoeba" | "github" | "manual" | "opus">
  /** Tokens allowed inside a tight-separable gap (mode 2). */
  skipGapTokens?: string[]
  /**
   * Wiktionary category names that contain MWE lists for this language.
   * Fetcher uses these as starting points for category member traversal.
   */
  wiktionaryCategories?: Partial<Record<MweType, string[]>>
}

// ---------------------------------------------------------------------------
// Wire-format compaction
// ---------------------------------------------------------------------------

/** Compact wire entry exactly matching the extension's CompactBundleEntry. */
export interface CompactEntry {
  e: string
  k: number
  x?: string[]
  f?: string[]
  s?: Separability
  g?: number[]
}

/** Convert a canonical entry to the compact wire format. Strips provenance. */
export function compact(entry: CanonicalMweEntry): CompactEntry {
  const out: CompactEntry = {
    e: entry.expression,
    k: TYPE_TO_KIND[entry.type]
  }
  if (entry.examples && entry.examples.length > 0) out.x = entry.examples
  if (entry.surfaceForms && entry.surfaceForms.length > 0) out.f = entry.surfaceForms
  if (entry.separability !== undefined && entry.separability !== 0) out.s = entry.separability
  if (entry.gapPositions && entry.gapPositions.length > 0) out.g = entry.gapPositions
  return out
}

/** Top-level bundle file shape (matches extension's BundleFile). */
export interface BundleFile {
  lang: string
  version: string
  formatVersion: 2
  generatedAt: string
  sourcesUsed: string[]
  meta?: BundleMeta
  entries: CompactEntry[]
}

export const BUNDLE_FORMAT_VERSION = 2 as const

/** Assemble a BundleFile from deduplicated canonical entries. */
export function assembleBundleFile(
  lang: string,
  version: string,
  sourcesUsed: string[],
  entries: CanonicalMweEntry[],
  meta?: BundleMeta
): BundleFile {
  // Sort: by frequencyRank asc (most frequent first), then alpha.
  const sorted = [...entries].sort((a, b) => {
    if (a.frequencyRank !== undefined && b.frequencyRank !== undefined) {
      return a.frequencyRank - b.frequencyRank
    }
    if (a.frequencyRank !== undefined) return -1
    if (b.frequencyRank !== undefined) return 1
    return a.expression.localeCompare(b.expression)
  })

  return {
    lang,
    version,
    formatVersion: BUNDLE_FORMAT_VERSION,
    generatedAt: new Date().toISOString(),
    sourcesUsed,
    ...(meta ? { meta } : {}),
    entries: sorted.map(compact)
  }
}

// ---------------------------------------------------------------------------
// Normalisation helpers shared across normalizers
// ---------------------------------------------------------------------------

/** Lowercase + NFC + collapse whitespace. */
export function normaliseExpression(s: string): string {
  return s
    .normalize("NFC")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
}

/** Return true if an expression looks like a valid MWE (≥2 tokens, no junk). */
export function isValidExpression(expr: string): boolean {
  const tokens = expr.split(" ")
  if (tokens.length < 2) return false
  if (tokens.length > 8) return false
  // Allow only word characters, apostrophes, and hyphens inside tokens.
  return tokens.every((t) => /^[\p{L}\p{N}'-]+$/u.test(t))
}
