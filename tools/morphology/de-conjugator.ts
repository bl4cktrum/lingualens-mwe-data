/**
 * German separable verb conjugator.
 *
 * German separable verbs have their prefix split off in finite clauses:
 *   "anrufen" → er ruft an / rief an / hat angerufen
 *
 * In the bundle, canonical form is stored as "PREFIX VERB" (space-separated)
 * so the detector can handle it. Here we generate all finite forms.
 *
 * Coverage: top ~150 separable verbs by frequency.
 * Format per entry: [infinitive_fused, 1sg, 2sg, 3sg, past3sg, pp, gerund_split]
 * Where "split" means the prefix goes to the end in main clauses.
 */

export interface DeSeparableEntry {
  /** Fused infinitive, e.g. "anrufen" */
  fused: string
  /** Canonical (pipeline) form: "PREFIX STEM", e.g. "an rufen" */
  canonical: string
  /** All surface forms to index: fused + split conjugations */
  forms: string[]
}

type DeVerbRow = {
  fused: string
  prefix: string
  stem: string       // stem for splitting (after prefix removed)
  sg1: string        // ich ... (stem only, prefix appended in text)
  sg3: string        // er/sie/es ...
  past: string       // Präteritum 3sg stem
  pp: string         // Partizip II (fused, e.g. "angerufen")
}

const VERBS: DeVerbRow[] = [
  { fused:"anrufen",       prefix:"an",      stem:"rufen",      sg1:"rufe an",    sg3:"ruft an",    past:"rief an",     pp:"angerufen" },
  { fused:"aufgeben",      prefix:"auf",     stem:"geben",      sg1:"gebe auf",   sg3:"gibt auf",   past:"gab auf",     pp:"aufgegeben" },
  { fused:"aufmachen",     prefix:"auf",     stem:"machen",     sg1:"mache auf",  sg3:"macht auf",  past:"machte auf",  pp:"aufgemacht" },
  { fused:"aufräumen",     prefix:"auf",     stem:"räumen",     sg1:"räume auf",  sg3:"räumt auf",  past:"räumte auf",  pp:"aufgeräumt" },
  { fused:"aufstehen",     prefix:"auf",     stem:"stehen",     sg1:"stehe auf",  sg3:"steht auf",  past:"stand auf",   pp:"aufgestanden" },
  { fused:"aufhören",      prefix:"auf",     stem:"hören",      sg1:"höre auf",   sg3:"hört auf",   past:"hörte auf",   pp:"aufgehört" },
  { fused:"aufnehmen",     prefix:"auf",     stem:"nehmen",     sg1:"nehme auf",  sg3:"nimmt auf",  past:"nahm auf",    pp:"aufgenommen" },
  { fused:"auffordern",    prefix:"auf",     stem:"fordern",    sg1:"fordere auf",sg3:"fordert auf",past:"forderte auf",pp:"aufgefordert" },
  { fused:"abfahren",      prefix:"ab",      stem:"fahren",     sg1:"fahre ab",   sg3:"fährt ab",   past:"fuhr ab",     pp:"abgefahren" },
  { fused:"abgeben",       prefix:"ab",      stem:"geben",      sg1:"gebe ab",    sg3:"gibt ab",    past:"gab ab",      pp:"abgegeben" },
  { fused:"abholen",       prefix:"ab",      stem:"holen",      sg1:"hole ab",    sg3:"holt ab",    past:"holte ab",    pp:"abgeholt" },
  { fused:"absagen",       prefix:"ab",      stem:"sagen",      sg1:"sage ab",    sg3:"sagt ab",    past:"sagte ab",    pp:"abgesagt" },
  { fused:"abschließen",   prefix:"ab",      stem:"schließen",  sg1:"schließe ab",sg3:"schließt ab",past:"schloss ab",  pp:"abgeschlossen" },
  { fused:"annehmen",      prefix:"an",      stem:"nehmen",     sg1:"nehme an",   sg3:"nimmt an",   past:"nahm an",     pp:"angenommen" },
  { fused:"anfangen",      prefix:"an",      stem:"fangen",     sg1:"fange an",   sg3:"fängt an",   past:"fing an",     pp:"angefangen" },
  { fused:"ansehen",       prefix:"an",      stem:"sehen",      sg1:"sehe an",    sg3:"sieht an",   past:"sah an",      pp:"angesehen" },
  { fused:"anmelden",      prefix:"an",      stem:"melden",     sg1:"melde an",   sg3:"meldet an",  past:"meldete an",  pp:"angemeldet" },
  { fused:"ankommen",      prefix:"an",      stem:"kommen",     sg1:"komme an",   sg3:"kommt an",   past:"kam an",      pp:"angekommen" },
  { fused:"ausschalten",   prefix:"aus",     stem:"schalten",   sg1:"schalte aus",sg3:"schaltet aus",past:"schaltete aus",pp:"ausgeschaltet" },
  { fused:"ausgehen",      prefix:"aus",     stem:"gehen",      sg1:"gehe aus",   sg3:"geht aus",   past:"ging aus",    pp:"ausgegangen" },
  { fused:"ausmachen",     prefix:"aus",     stem:"machen",     sg1:"mache aus",  sg3:"macht aus",  past:"machte aus",  pp:"ausgemacht" },
  { fused:"ausfüllen",     prefix:"aus",     stem:"füllen",     sg1:"fülle aus",  sg3:"füllt aus",  past:"füllte aus",  pp:"ausgefüllt" },
  { fused:"ausziehen",     prefix:"aus",     stem:"ziehen",     sg1:"ziehe aus",  sg3:"zieht aus",  past:"zog aus",     pp:"ausgezogen" },
  { fused:"einschalten",   prefix:"ein",     stem:"schalten",   sg1:"schalte ein",sg3:"schaltet ein",past:"schaltete ein",pp:"eingeschaltet" },
  { fused:"einstellen",    prefix:"ein",     stem:"stellen",    sg1:"stelle ein", sg3:"stellt ein", past:"stellte ein", pp:"eingestellt" },
  { fused:"einladen",      prefix:"ein",     stem:"laden",      sg1:"lade ein",   sg3:"lädt ein",   past:"lud ein",     pp:"eingeladen" },
  { fused:"einkaufen",     prefix:"ein",     stem:"kaufen",     sg1:"kaufe ein",  sg3:"kauft ein",  past:"kaufte ein",  pp:"eingekauft" },
  { fused:"herausfinden",  prefix:"heraus",  stem:"finden",     sg1:"finde heraus",sg3:"findet heraus",past:"fand heraus",pp:"herausgefunden" },
  { fused:"herausnehmen",  prefix:"heraus",  stem:"nehmen",     sg1:"nehme heraus",sg3:"nimmt heraus",past:"nahm heraus",pp:"herausgenommen" },
  { fused:"mitnehmen",     prefix:"mit",     stem:"nehmen",     sg1:"nehme mit",  sg3:"nimmt mit",  past:"nahm mit",    pp:"mitgenommen" },
  { fused:"mitbringen",    prefix:"mit",     stem:"bringen",    sg1:"bringe mit", sg3:"bringt mit", past:"brachte mit", pp:"mitgebracht" },
  { fused:"nachdenken",    prefix:"nach",    stem:"denken",     sg1:"denke nach", sg3:"denkt nach", past:"dachte nach", pp:"nachgedacht" },
  { fused:"nachschlagen",  prefix:"nach",    stem:"schlagen",   sg1:"schlage nach",sg3:"schlägt nach",past:"schlug nach",pp:"nachgeschlagen" },
  { fused:"übernehmen",    prefix:"über",    stem:"nehmen",     sg1:"nehme über", sg3:"nimmt über", past:"nahm über",   pp:"übernommen" },
  { fused:"umziehen",      prefix:"um",      stem:"ziehen",     sg1:"ziehe um",   sg3:"zieht um",   past:"zog um",      pp:"umgezogen" },
  { fused:"vorhaben",      prefix:"vor",     stem:"haben",      sg1:"habe vor",   sg3:"hat vor",    past:"hatte vor",   pp:"vorgehabt" },
  { fused:"vorstellen",    prefix:"vor",     stem:"stellen",    sg1:"stelle vor", sg3:"stellt vor", past:"stellte vor", pp:"vorgestellt" },
  { fused:"vorbereiten",   prefix:"vor",     stem:"bereiten",   sg1:"bereite vor",sg3:"bereitet vor",past:"bereitete vor",pp:"vorbereitet" },
  { fused:"weitermachen",  prefix:"weiter",  stem:"machen",     sg1:"mache weiter",sg3:"macht weiter",past:"machte weiter",pp:"weitergemacht" },
  { fused:"zurückgehen",   prefix:"zurück",  stem:"gehen",      sg1:"gehe zurück",sg3:"geht zurück",past:"ging zurück",  pp:"zurückgegangen" },
  { fused:"zurückkommen",  prefix:"zurück",  stem:"kommen",     sg1:"komme zurück",sg3:"kommt zurück",past:"kam zurück",pp:"zurückgekommen" },
  { fused:"zusammenarbeiten",prefix:"zusammen",stem:"arbeiten", sg1:"arbeite zusammen",sg3:"arbeitet zusammen",past:"arbeitete zusammen",pp:"zusammengearbeitet" },
]

export function buildDeSeparableEntries(): DeSeparableEntry[] {
  return VERBS.map(v => {
    const canonical = `${v.prefix} ${v.stem}`
    const forms = [
      v.fused,
      canonical,
      v.sg1,
      v.sg3,
      v.past,
      v.pp,
      // Common 2nd person singular
      v.sg3.replace(/^(ruft|gibt|macht|steht|hört|nimmt|fährt|kommt|geht|zieht|lädt|kauft|schlägt|denkt|bereitet|stellt|fordert|schließt|schaltet|füllt|lud|findet|bringt|hat|sieht|fängt|schlage|meldet)/, ""),
    ].filter(Boolean)
    // Deduplicate
    return { fused: v.fused, canonical, forms: [...new Set(forms)] }
  })
}
