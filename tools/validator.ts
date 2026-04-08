/**
 * Validator — post-deduplication sanity checks.
 *
 * Runs two passes:
 *   1. Per-entry schema validation via Zod (fast).
 *   2. Aggregate sanity thresholds (fails the build if violated).
 *
 * Build failure threshold: >5% invalid entries.
 */

import { CanonicalMweEntrySchema, type CanonicalMweEntry } from "./canonical.ts"
import type { BundleFile } from "./canonical.ts"

export interface ValidationResult {
  valid: CanonicalMweEntry[]
  invalid: Array<{ entry: unknown; error: string }>
  /** True if the invalid rate exceeds the build threshold. */
  shouldFail: boolean
}

const INVALID_RATE_THRESHOLD = 0.05 // 5%

export function validateEntries(entries: CanonicalMweEntry[]): ValidationResult {
  const valid: CanonicalMweEntry[] = []
  const invalid: Array<{ entry: unknown; error: string }> = []

  for (const entry of entries) {
    const result = CanonicalMweEntrySchema.safeParse(entry)
    if (result.success) {
      valid.push(result.data)
    } else {
      invalid.push({
        entry,
        error: result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")
      })
    }
  }

  const total = entries.length
  const rate = total > 0 ? invalid.length / total : 0
  const shouldFail = rate > INVALID_RATE_THRESHOLD

  return { valid, invalid, shouldFail }
}

/** Validate the final assembled BundleFile shape. Throws on error. */
export function validateBundleFile(file: BundleFile): void {
  if (!file.lang || !/^[a-z]{2,3}$/.test(file.lang)) {
    throw new Error(`Invalid bundle lang: ${file.lang}`)
  }
  if (file.formatVersion !== 2) {
    throw new Error(`Unexpected formatVersion: ${file.formatVersion}`)
  }
  if (!Array.isArray(file.entries)) {
    throw new Error("entries must be an array")
  }
  // Sample-check first 10 entries.
  for (const e of file.entries.slice(0, 10)) {
    if (typeof e.e !== "string" || e.e.length === 0) {
      throw new Error(`Entry missing 'e' field: ${JSON.stringify(e)}`)
    }
    if (typeof e.k !== "number") {
      throw new Error(`Entry missing 'k' field: ${JSON.stringify(e)}`)
    }
  }
}

/** Print a validation report to stdout. */
export function printValidationReport(
  lang: string,
  result: ValidationResult
): void {
  const total = result.valid.length + result.invalid.length
  const rate = (result.invalid.length / Math.max(total, 1)) * 100
  console.log(
    `[validate] ${lang}: ${result.valid.length}/${total} valid (${rate.toFixed(1)}% invalid)`
  )
  if (result.invalid.length > 0) {
    console.log(`  First 5 invalid entries:`)
    for (const { entry, error } of result.invalid.slice(0, 5)) {
      const expr = (entry as { expression?: string }).expression ?? "(unknown)"
      console.log(`    - '${expr}': ${error}`)
    }
  }
  if (result.shouldFail) {
    console.error(
      `[validate] FAIL: invalid rate ${rate.toFixed(1)}% exceeds threshold ${(INVALID_RATE_THRESHOLD * 100).toFixed(0)}%`
    )
  }
}
