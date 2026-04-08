/**
 * Per-language build configuration.
 *
 * To add a new language:
 *   1. Add a `LangConfig` entry below.
 *   2. Add a `data/manual/<lang>-overrides.csv` file (can be empty).
 *   3. Run `pnpm build-bundle --lang <code>`.
 */

import type { LangConfig } from "./canonical.ts"

export const LANG_CONFIGS: LangConfig[] = [
  {
    lang: "en",
    name: "English",
    sources: ["manual", "wiktionary", "github"],
    skipGapTokens: [
      // Pronouns that may appear inside separable phrasal verbs: "look it up"
      "it", "him", "her", "them", "me", "us", "you", "one",
      // Articles in some collocations
      "a", "an", "the",
      // Reflexive
      "himself", "herself", "itself", "themselves", "yourself", "myself", "ourselves"
    ],
    wiktionaryCategories: {
      phrasal_verb: [
        "Category:English phrasal verbs",
        "Category:English phrasal verbs with particle (up)",
        "Category:English phrasal verbs with particle (out)",
        "Category:English phrasal verbs with particle (down)",
        "Category:English phrasal verbs with particle (off)",
        "Category:English phrasal verbs with particle (on)",
        "Category:English phrasal verbs with particle (in)",
        "Category:English phrasal verbs with particle (over)",
        "Category:English phrasal verbs with particle (away)"
      ],
      idiom: [
        "Category:English idioms",
        "Category:English set phrases"
      ],
      collocation: [
        "Category:English collocations"
      ],
      fixed: [
        "Category:English fixed expressions"
      ]
    }
  },
  {
    lang: "de",
    name: "German",
    sources: ["manual", "wiktionary"],
    skipGapTokens: [
      // Pronouns used in separable verb contexts: "ruf mich an"
      "mich", "dich", "sich", "uns", "euch",
      "mir", "dir", "ihm", "ihr", "ihnen",
      "mein", "dein", "sein", "ihr", "unser", "euer"
    ],
    wiktionaryCategories: {
      phrasal_verb: [
        "Category:German separable verbs"
      ],
      idiom: [
        "Category:German idioms",
        "Category:German set phrases"
      ],
      collocation: [
        "Category:German collocations"
      ]
    }
  },
  {
    lang: "es",
    name: "Spanish",
    sources: ["manual", "wiktionary"],
    skipGapTokens: [
      "me", "te", "se", "nos", "os", "le", "les", "lo", "la", "los", "las"
    ],
    wiktionaryCategories: {
      phrasal_verb: [
        "Category:Spanish phrasal verbs"
      ],
      idiom: [
        "Category:Spanish idioms",
        "Category:Spanish set phrases"
      ],
      collocation: [
        "Category:Spanish collocations"
      ]
    }
  },
  {
    lang: "fr",
    name: "French",
    sources: ["manual", "wiktionary"],
    skipGapTokens: [
      "me", "te", "se", "nous", "vous", "le", "la", "les", "lui", "leur", "y", "en"
    ],
    wiktionaryCategories: {
      phrasal_verb: [
        "Category:French phrasal verbs"
      ],
      idiom: [
        "Category:French idioms",
        "Category:French set phrases"
      ],
      collocation: [
        "Category:French collocations"
      ]
    }
  },
  {
    lang: "tr",
    name: "Turkish",
    sources: ["manual", "wiktionary"],
    // Turkish is agglutinative — MWE detection is morphology-heavy.
    // For v1 we ship only fixed expressions and collocations.
    skipGapTokens: [],
    wiktionaryCategories: {
      idiom: [
        "Category:Turkish idioms",
        "Category:Turkish set phrases"
      ],
      collocation: [
        "Category:Turkish collocations"
      ],
      fixed: [
        "Category:Turkish fixed expressions"
      ]
    }
  }
]

/** Look up config by ISO 639-1 code. Returns undefined for unknown languages. */
export function getLangConfig(lang: string): LangConfig | undefined {
  return LANG_CONFIGS.find((c) => c.lang === lang)
}
