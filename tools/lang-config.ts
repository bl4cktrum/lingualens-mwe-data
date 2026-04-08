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
  },
  {
    lang: "nl",
    name: "Dutch",
    sources: ["manual", "wiktionary"],
    skipGapTokens: [
      "me", "je", "ze", "hem", "haar", "ons", "jullie", "hen", "hun",
      "zich", "het", "de", "een"
    ],
    wiktionaryCategories: {
      phrasal_verb: [
        "Category:Dutch phrasal verbs"
      ],
      idiom: [
        "Category:Dutch idioms",
        "Category:Dutch set phrases"
      ],
      fixed: [
        "Category:Dutch fixed expressions"
      ]
    }
  },
  {
    lang: "fi",
    name: "Finnish",
    sources: ["manual", "wiktionary"],
    // Finnish is agglutinative — particle verbs are the primary MWE type.
    skipGapTokens: [],
    wiktionaryCategories: {
      phrasal_verb: [
        "Category:Finnish phrasal verbs"
      ],
      idiom: [
        "Category:Finnish idioms",
        "Category:Finnish set phrases"
      ],
      fixed: [
        "Category:Finnish fixed expressions"
      ]
    }
  },
  {
    lang: "it",
    name: "Italian",
    sources: ["manual", "wiktionary"],
    skipGapTokens: [
      "mi", "ti", "si", "ci", "vi", "lo", "la", "li", "le", "gli",
      "ne", "me", "te", "se", "noi", "voi"
    ],
    wiktionaryCategories: {
      phrasal_verb: [
        "Category:Italian phrasal verbs"
      ],
      idiom: [
        "Category:Italian idioms",
        "Category:Italian set phrases"
      ],
      fixed: [
        "Category:Italian fixed expressions"
      ]
    }
  },
  {
    lang: "pt",
    name: "Portuguese",
    sources: ["manual", "wiktionary"],
    skipGapTokens: [
      "me", "te", "se", "nos", "vos", "o", "a", "os", "as",
      "lhe", "lhes", "lo", "la", "los", "las"
    ],
    wiktionaryCategories: {
      phrasal_verb: [
        "Category:Portuguese phrasal verbs"
      ],
      idiom: [
        "Category:Portuguese idioms",
        "Category:Portuguese set phrases"
      ],
      fixed: [
        "Category:Portuguese fixed expressions"
      ]
    }
  },
  {
    lang: "sv",
    name: "Swedish",
    sources: ["manual", "wiktionary"],
    skipGapTokens: [
      "mig", "dig", "sig", "oss", "er", "honom", "henne", "dem",
      "det", "den", "en", "ett"
    ],
    wiktionaryCategories: {
      phrasal_verb: [
        "Category:Swedish phrasal verbs"
      ],
      idiom: [
        "Category:Swedish idioms",
        "Category:Swedish set phrases"
      ],
      fixed: [
        "Category:Swedish fixed expressions"
      ]
    }
  },
  {
    lang: "ja",
    name: "Japanese",
    sources: ["manual", "wiktionary"],
    // Japanese uses no spaces between words — MWE detection is script-level.
    // For v1 we ship idiomatic expressions only (yojijukugo + set phrases).
    skipGapTokens: [],
    wiktionaryCategories: {
      idiom: [
        "Category:Japanese idioms",
        "Category:Japanese set phrases"
      ],
      fixed: [
        "Category:Japanese fixed expressions"
      ]
    }
  },
  {
    lang: "zh",
    name: "Chinese",
    sources: ["manual", "wiktionary"],
    // Chinese uses no spaces — MWE detection is script-level.
    // Chengyu (成語) and set phrases are the primary MWE type.
    skipGapTokens: [],
    wiktionaryCategories: {
      idiom: [
        "Category:Chinese idioms",
        "Category:Chinese set phrases"
      ],
      fixed: [
        "Category:Chinese fixed expressions"
      ]
    }
  }
]

/** Look up config by ISO 639-1 code. Returns undefined for unknown languages. */
export function getLangConfig(lang: string): LangConfig | undefined {
  return LANG_CONFIGS.find((c) => c.lang === lang)
}
