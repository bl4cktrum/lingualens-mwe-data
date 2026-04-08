/**
 * Manual CSV fetcher — loads hand-curated override/supplement files from
 * `data/manual/<lang>-overrides.csv`.
 *
 * CSV format (header row required):
 *   expression,type,examples,surfaceForms,separability,gapPositions,confidence
 *
 * Field notes:
 *   - expression      required  — canonical form (will be normalised)
 *   - type            required  — phrasal_verb | collocation | idiom | fixed
 *   - examples        optional  — pipe-separated (|) example sentences
 *   - surfaceForms    optional  — pipe-separated inflected forms
 *   - separability    optional  — 0 | 1 | 2 (default 0)
 *   - gapPositions    optional  — comma-separated token indices (e.g. "1" or "1,2")
 *   - confidence      optional  — 0–1 float (default 1.0 for manual entries)
 *
 * Blank lines and lines starting with # are ignored.
 */

import { createReadStream } from "node:fs"
import { resolve } from "node:path"
import { createInterface } from "node:readline"
import Papa from "papaparse"
import { readFileSync, existsSync } from "node:fs"
import type { MweType } from "../canonical.ts"

export interface ManualCsvRawEntry {
  expression: string
  type: MweType
  examples?: string[]
  surfaceForms?: string[]
  separability?: 0 | 1 | 2
  gapPositions?: number[]
  confidence: number
  lang: string
}

const DATA_DIR = new URL("../../data/manual/", import.meta.url).pathname

export function fetchManualCsv(lang: string): ManualCsvRawEntry[] {
  // Normalise the Windows drive-letter path that URL.pathname produces on win32.
  const filePath = resolve(DATA_DIR.replace(/^\/([A-Za-z]:)/, "$1"), `${lang}-overrides.csv`)

  if (!existsSync(filePath)) {
    console.log(`  [manual-csv] no override file for '${lang}' (${filePath})`)
    return []
  }

  const raw = readFileSync(filePath, "utf8")
  const { data, errors } = Papa.parse<Record<string, string>>(raw, {
    header: true,
    skipEmptyLines: true,
    comments: "#",
    delimiter: "\t"
  })

  if (errors.length > 0) {
    console.warn(`  [manual-csv] ${lang}: ${errors.length} parse errors (first: ${errors[0]?.message})`)
  }

  const results: ManualCsvRawEntry[] = []

  for (const row of data) {
    const expression = (row["expression"] ?? "").trim()
    const typeRaw = (row["type"] ?? "").trim() as MweType
    if (!expression || !typeRaw) continue
    if (!["phrasal_verb", "collocation", "idiom", "fixed"].includes(typeRaw)) {
      console.warn(`  [manual-csv] unknown type '${typeRaw}' for '${expression}' — skipping`)
      continue
    }

    const examplesRaw = (row["examples"] ?? "").trim()
    const surfaceFormsRaw = (row["surfaceForms"] ?? "").trim()
    const separabilityRaw = (row["separability"] ?? "").trim()
    const gapPositionsRaw = (row["gapPositions"] ?? "").trim()
    const confidenceRaw = (row["confidence"] ?? "").trim()

    const entry: ManualCsvRawEntry = {
      expression,
      type: typeRaw,
      confidence: confidenceRaw ? parseFloat(confidenceRaw) : 1.0,
      lang
    }

    if (examplesRaw) {
      entry.examples = examplesRaw
        .split("|")
        .map((s) => s.trim())
        .filter(Boolean)
    }
    if (surfaceFormsRaw) {
      entry.surfaceForms = surfaceFormsRaw
        .split("|")
        .map((s) => s.trim())
        .filter(Boolean)
    }
    if (separabilityRaw === "1") entry.separability = 1
    else if (separabilityRaw === "2") entry.separability = 2
    else if (separabilityRaw === "0") entry.separability = 0

    if (gapPositionsRaw) {
      entry.gapPositions = gapPositionsRaw
        .split(",")
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !isNaN(n))
    }

    results.push(entry)
  }

  console.log(`  [manual-csv] ${lang}: loaded ${results.length} entries`)
  return results
}
