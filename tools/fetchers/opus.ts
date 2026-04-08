/**
 * OPUS fetcher — stub for corpus-based MWE mining.
 *
 * Full implementation deferred: extracting MWEs from OPUS sentence pairs
 * requires statistical collocation extraction (PMI, log-likelihood, etc.)
 * which is effectively a separate NLP pipeline. The output of such a pipeline
 * would be a ranked list of n-gram candidates that then need manual filtering.
 *
 * What this stub does TODAY:
 *   - Documents the intended approach so it can be implemented later.
 *   - Returns an empty array so the builder can call it without special-casing.
 *
 * Intended approach (v2):
 *   1. Query OPUS API for a parallel corpus subset:
 *        GET https://opus.nlpl.eu/opusapi/
 *            ?source={lang}&corpus=OpenSubtitles&preprocessing=moses&version=latest
 *   2. Download the monolingual source-side file (gzipped plain text).
 *   3. Run a sliding window bigram/trigram frequency count.
 *   4. Apply PMI threshold (≥3.5) and minimum frequency (≥50 occurrences).
 *   5. Post-filter with a stopword list to remove generic collocations.
 *   6. Emit the surviving candidates as CanonicalMweEntry with confidence
 *      derived from normalised PMI.
 *
 * This is non-trivial (~500 lines of NLP code) and requires significant
 * memory for large corpora. It's phase 6+ work.
 */

import type { CanonicalMweEntry } from "../canonical.ts"

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function fetchOpus(
  _lang: string,
  _signal?: AbortSignal
): Promise<CanonicalMweEntry[]> {
  console.log("  [opus] stub — skipping (not yet implemented)")
  return []
}
