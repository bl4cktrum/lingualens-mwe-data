/**
 * CLI entry point.
 *
 * Usage:
 *   pnpm build-bundle --lang en
 *   pnpm build-bundle --lang en,de,fr
 *   pnpm build-bundle --all
 *   pnpm build-bundle --all --tatoeba
 *   pnpm build-bundle --lang en --validate-only
 *   pnpm build-bundle --all --version 2024.06.01
 *
 * On success writes:
 *   bundles/<lang>.json   — per-language bundle
 *   bundles/index.json    — manifest with sha256 + entry counts
 *
 * Exit code 1 on any build failure.
 */

import { program } from "commander"
import { LANG_CONFIGS } from "./lang-config.ts"
import { buildLanguage, writeIndex } from "./builder.ts"

const BASE_URL = "https://cdn.jsdelivr.net/gh/bl4cktrum/lingualens-mwe-data@v1/bundles/"

program
  .name("build-bundle")
  .description("LinguaLens MWE bundle pipeline")
  .option("--lang <codes>", "Comma-separated ISO 639-1 language codes")
  .option("--all", "Build all configured languages")
  .option("--tatoeba", "Enrich with Tatoeba example sentences (slow: ~1 req/s)")
  .option("--validate-only", "Run validation without writing output files")
  .option("--version <ver>", "Override bundle version (default: YYYY.MM.DD)")
  .parse()

const opts = program.opts<{
  lang?: string
  all?: boolean
  tatoeba?: boolean
  validateOnly?: boolean
  version?: string
}>()

// Resolve target languages.
let langs: string[]
if (opts.all) {
  langs = LANG_CONFIGS.map((c) => c.lang)
} else if (opts.lang) {
  langs = opts.lang.split(",").map((l) => l.trim()).filter(Boolean)
} else {
  console.error("Error: specify --lang <codes> or --all")
  process.exit(1)
}

console.log(`Building bundles for: ${langs.join(", ")}`)

const ac = new AbortController()
process.on("SIGINT", () => {
  console.log("\nAborted by user.")
  ac.abort()
  process.exit(130)
})

;(async () => {
  const results = []
  let anyFailed = false

  for (const lang of langs) {
    try {
      const result = await buildLanguage(lang, {
        version: opts.version,
        enrichTatoeba: opts.tatoeba,
        validateOnly: opts.validateOnly,
        signal: ac.signal
      })
      results.push(result)
    } catch (err) {
      console.error(`\n[cli] FAILED: ${lang} — ${(err as Error).message}`)
      anyFailed = true
    }
  }

  if (!opts.validateOnly && results.length > 0) {
    // Determine index version: use the highest bundle version across results.
    const indexVersion = results
      .map((r) => r.version)
      .sort()
      .at(-1) ?? "0.0.0"
    writeIndex(results, BASE_URL, indexVersion)
  }

  console.log(
    `\n[cli] Done. ${results.length}/${langs.length} languages built successfully.`
  )
  process.exit(anyFailed ? 1 : 0)
})()
