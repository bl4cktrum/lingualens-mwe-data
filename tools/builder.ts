/**
 * Per-language pipeline orchestration.
 *
 * For each language:
 *   1. Run the configured fetchers in parallel.
 *   2. Normalise each source's output to CanonicalMweEntry[].
 *   3. Deduplicate across sources.
 *   4. Optionally enrich with Tatoeba examples (if `tatoeba` in sources).
 *   5. Validate; abort if invalid rate exceeds threshold.
 *   6. Assemble into BundleFile.
 *   7. Write to `bundles/<lang>.json`.
 *   8. Return the entry count + sha256 for the index.
 */

import { createHash } from "node:crypto"
import { writeFileSync, mkdirSync } from "node:fs"
import { resolve } from "node:path"

import {
  assembleBundleFile,
  type CanonicalMweEntry,
  type BundleFile
} from "./canonical.ts"
import { deduplicate, collectSourcesUsed } from "./deduplicator.ts"
import { validateEntries, validateBundleFile, printValidationReport } from "./validator.ts"
import { getLangConfig } from "./lang-config.ts"

import { fetchWiktionary } from "./fetchers/wiktionary.ts"
import { fetchManualCsv } from "./fetchers/manual-csv.ts"
import { fetchGithubCurated } from "./fetchers/github-curated.ts"
import { fetchOpus } from "./fetchers/opus.ts"
import { enrichWithTatoeba } from "./fetchers/tatoeba.ts"

import { normalizeWiktionary } from "./normalizers/wiktionary.ts"
import { normalizeManualCsv } from "./normalizers/manual-csv.ts"
import { normalizeGithubCurated } from "./normalizers/github-curated.ts"

const BUNDLES_DIR = new URL("../bundles/", import.meta.url).pathname.replace(
  /^\/([A-Za-z]:)/,
  "$1"
)

export interface BuildResult {
  lang: string
  entryCount: number
  sizeBytes: number
  sha256: string
  version: string
  sourcesUsed: string[]
}

export interface BuildOptions {
  /** Bundle data semver. Defaults to today's date as "YYYY.MM.DD". */
  version?: string
  /** Enrich entries with Tatoeba examples. Slow (1 req/s). Default: false. */
  enrichTatoeba?: boolean
  /** Validate only — skip writing output files. */
  validateOnly?: boolean
  signal?: AbortSignal
}

export async function buildLanguage(
  lang: string,
  opts: BuildOptions = {}
): Promise<BuildResult> {
  const config = getLangConfig(lang)
  if (!config) throw new Error(`No config found for language '${lang}'`)

  const version = opts.version ?? todayVersion()
  console.log(`\n[builder] Building '${lang}' (${config.name}) — v${version}`)

  // ---- 1. Fetch ----------------------------------------------------------
  const allRaw: CanonicalMweEntry[] = []

  for (const source of config.sources) {
    if (source === "manual") {
      console.log(`[builder] ${lang}: fetching manual-csv …`)
      const raw = fetchManualCsv(lang)
      allRaw.push(...normalizeManualCsv(raw))
    }

    if (source === "wiktionary" && config.wiktionaryCategories) {
      console.log(`[builder] ${lang}: fetching wiktionary …`)
      const raw = await fetchWiktionary(lang, config.wiktionaryCategories, opts.signal)
      allRaw.push(...normalizeWiktionary(raw))
    }

    if (source === "github") {
      console.log(`[builder] ${lang}: fetching github-curated …`)
      const raw = await fetchGithubCurated(lang, opts.signal)
      allRaw.push(...normalizeGithubCurated(raw))
    }

    if (source === "opus") {
      console.log(`[builder] ${lang}: fetching opus …`)
      const raw = await fetchOpus(lang, opts.signal)
      allRaw.push(...raw)
    }
  }

  console.log(`[builder] ${lang}: ${allRaw.length} raw entries collected`)

  // ---- 2. Deduplicate ----------------------------------------------------
  const deduped = deduplicate(allRaw)
  console.log(`[builder] ${lang}: ${deduped.length} after deduplication`)

  // ---- 3. Tatoeba enrichment (optional, slow) ----------------------------
  if (opts.enrichTatoeba && config.sources.includes("tatoeba")) {
    console.log(`[builder] ${lang}: enriching with Tatoeba examples …`)
    const enriched = await enrichWithTatoeba(deduped, 2, opts.signal)
    console.log(`[builder] ${lang}: ${enriched} entries enriched with examples`)
  }

  // ---- 4. Validate -------------------------------------------------------
  const validation = validateEntries(deduped)
  printValidationReport(lang, validation)
  if (validation.shouldFail) {
    throw new Error(`[builder] ${lang}: validation failure — too many invalid entries`)
  }

  if (opts.validateOnly) {
    console.log(`[builder] ${lang}: validate-only mode — skipping file write`)
    return {
      lang,
      entryCount: validation.valid.length,
      sizeBytes: 0,
      sha256: "",
      version,
      sourcesUsed: collectSourcesUsed(validation.valid)
    }
  }

  // ---- 5. Assemble -------------------------------------------------------
  const sourcesUsed = collectSourcesUsed(validation.valid)
  const meta =
    config.skipGapTokens && config.skipGapTokens.length > 0
      ? { skipGapTokens: config.skipGapTokens }
      : undefined

  const bundleFile = assembleBundleFile(
    lang,
    version,
    sourcesUsed,
    validation.valid,
    meta
  )
  validateBundleFile(bundleFile)

  // ---- 6. Write ----------------------------------------------------------
  mkdirSync(resolve(BUNDLES_DIR), { recursive: true })
  const outPath = resolve(BUNDLES_DIR, `${lang}.json`)
  const json = JSON.stringify(bundleFile)
  writeFileSync(outPath, json, "utf8")

  const sizeBytes = Buffer.byteLength(json, "utf8")
  const sha256 = createHash("sha256").update(json, "utf8").digest("hex")

  console.log(
    `[builder] ${lang}: wrote ${outPath} (${(sizeBytes / 1024).toFixed(1)} KB, ` +
    `${bundleFile.entries.length} entries, sha256=${sha256.slice(0, 16)}…)`
  )

  return {
    lang,
    entryCount: bundleFile.entries.length,
    sizeBytes,
    sha256,
    version,
    sourcesUsed
  }
}

/** Write the `bundles/index.json` from an array of build results. */
export function writeIndex(
  results: BuildResult[],
  baseUrl: string,
  indexVersion: string
): void {
  mkdirSync(resolve(BUNDLES_DIR), { recursive: true })

  const bundles: Record<
    string,
    { version: string; entries: number; sizeBytes: number; sha256: string }
  > = {}
  for (const r of results) {
    bundles[r.lang] = {
      version: r.version,
      entries: r.entryCount,
      sizeBytes: r.sizeBytes,
      sha256: r.sha256
    }
  }

  const index = { version: indexVersion, baseUrl, bundles }
  const outPath = resolve(BUNDLES_DIR, "index.json")
  writeFileSync(outPath, JSON.stringify(index, null, 2), "utf8")
  console.log(`\n[builder] index written to ${outPath}`)
}

function todayVersion(): string {
  const d = new Date()
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, "0")
  const day = String(d.getUTCDate()).padStart(2, "0")
  return `${y}.${m}.${day}`
}
