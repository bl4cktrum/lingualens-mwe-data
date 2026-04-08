/**
 * English verb conjugator for the MWE build pipeline.
 *
 * Given a phrasal verb like "look up", generates all common surface forms:
 *   ["look up", "looks up", "looked up", "looking up"]
 */

/** [infinitive, 3sg, past, pastParticiple, gerund] */
type VerbForms = [string, string, string, string, string]

const IRREGULAR: Record<string, VerbForms> = {
  be:          ["be",          "is",          "was",       "been",         "being"],
  have:        ["have",        "has",         "had",       "had",          "having"],
  do:          ["do",          "does",        "did",       "done",         "doing"],
  go:          ["go",          "goes",        "went",      "gone",         "going"],
  come:        ["come",        "comes",       "came",      "come",         "coming"],
  get:         ["get",         "gets",        "got",       "gotten",       "getting"],
  give:        ["give",        "gives",       "gave",      "given",        "giving"],
  take:        ["take",        "takes",       "took",      "taken",        "taking"],
  make:        ["make",        "makes",       "made",      "made",         "making"],
  know:        ["know",        "knows",       "knew",      "known",        "knowing"],
  see:         ["see",         "sees",        "saw",       "seen",         "seeing"],
  say:         ["say",         "says",        "said",      "said",         "saying"],
  think:       ["think",       "thinks",      "thought",   "thought",      "thinking"],
  tell:        ["tell",        "tells",       "told",      "told",         "telling"],
  find:        ["find",        "finds",       "found",     "found",        "finding"],
  leave:       ["leave",       "leaves",      "left",      "left",         "leaving"],
  feel:        ["feel",        "feels",       "felt",      "felt",         "feeling"],
  bring:       ["bring",       "brings",      "brought",   "brought",      "bringing"],
  keep:        ["keep",        "keeps",       "kept",      "kept",         "keeping"],
  hold:        ["hold",        "holds",       "held",      "held",         "holding"],
  stand:       ["stand",       "stands",      "stood",     "stood",        "standing"],
  run:         ["run",         "runs",        "ran",       "run",          "running"],
  put:         ["put",         "puts",        "put",       "put",          "putting"],
  set:         ["set",         "sets",        "set",       "set",          "setting"],
  cut:         ["cut",         "cuts",        "cut",       "cut",          "cutting"],
  let:         ["let",         "lets",        "let",       "let",          "letting"],
  hit:         ["hit",         "hits",        "hit",       "hit",          "hitting"],
  read:        ["read",        "reads",       "read",      "read",         "reading"],
  meet:        ["meet",        "meets",       "met",       "met",          "meeting"],
  send:        ["send",        "sends",       "sent",      "sent",         "sending"],
  build:       ["build",       "builds",      "built",     "built",        "building"],
  spend:       ["spend",       "spends",      "spent",     "spent",        "spending"],
  lose:        ["lose",        "loses",       "lost",      "lost",         "losing"],
  win:         ["win",         "wins",        "won",       "won",          "winning"],
  buy:         ["buy",         "buys",        "bought",    "bought",       "buying"],
  pay:         ["pay",         "pays",        "paid",      "paid",         "paying"],
  sell:        ["sell",        "sells",       "sold",      "sold",         "selling"],
  fall:        ["fall",        "falls",       "fell",      "fallen",       "falling"],
  break:       ["break",       "breaks",      "broke",     "broken",       "breaking"],
  write:       ["write",       "writes",      "wrote",     "written",      "writing"],
  drive:       ["drive",       "drives",      "drove",     "driven",       "driving"],
  ride:        ["ride",        "rides",       "rode",      "ridden",       "riding"],
  speak:       ["speak",       "speaks",      "spoke",     "spoken",       "speaking"],
  wake:        ["wake",        "wakes",       "woke",      "woken",        "waking"],
  wear:        ["wear",        "wears",       "wore",      "worn",         "wearing"],
  sleep:       ["sleep",       "sleeps",      "slept",     "slept",        "sleeping"],
  eat:         ["eat",         "eats",        "ate",       "eaten",        "eating"],
  drink:       ["drink",       "drinks",      "drank",     "drunk",        "drinking"],
  swim:        ["swim",        "swims",       "swam",      "swum",         "swimming"],
  sing:        ["sing",        "sings",       "sang",      "sung",         "singing"],
  ring:        ["ring",        "rings",       "rang",      "rung",         "ringing"],
  fly:         ["fly",         "flies",       "flew",      "flown",        "flying"],
  grow:        ["grow",        "grows",       "grew",      "grown",        "growing"],
  draw:        ["draw",        "draws",       "drew",      "drawn",        "drawing"],
  throw:       ["throw",       "throws",      "threw",     "thrown",       "throwing"],
  blow:        ["blow",        "blows",       "blew",      "blown",        "blowing"],
  show:        ["show",        "shows",       "showed",    "shown",        "showing"],
  hide:        ["hide",        "hides",       "hid",       "hidden",       "hiding"],
  rise:        ["rise",        "rises",       "rose",      "risen",        "rising"],
  arise:       ["arise",       "arises",      "arose",     "arisen",       "arising"],
  shake:       ["shake",       "shakes",      "shook",     "shaken",       "shaking"],
  steal:       ["steal",       "steals",      "stole",     "stolen",       "stealing"],
  choose:      ["choose",      "chooses",     "chose",     "chosen",       "choosing"],
  freeze:      ["freeze",      "freezes",     "froze",     "frozen",       "freezing"],
  bite:        ["bite",        "bites",       "bit",       "bitten",       "biting"],
  forbid:      ["forbid",      "forbids",     "forbade",   "forbidden",    "forbidding"],
  forget:      ["forget",      "forgets",     "forgot",    "forgotten",    "forgetting"],
  forgive:     ["forgive",     "forgives",    "forgave",   "forgiven",     "forgiving"],
  begin:       ["begin",       "begins",      "began",     "begun",        "beginning"],
  shrink:      ["shrink",      "shrinks",     "shrank",    "shrunk",       "shrinking"],
  sink:        ["sink",        "sinks",       "sank",      "sunk",         "sinking"],
  spring:      ["spring",      "springs",     "sprang",    "sprung",       "springing"],
  stink:       ["stink",       "stinks",      "stank",     "stunk",        "stinking"],
  swear:       ["swear",       "swears",      "swore",     "sworn",        "swearing"],
  tear:        ["tear",        "tears",       "tore",      "torn",         "tearing"],
  bear:        ["bear",        "bears",       "bore",      "borne",        "bearing"],
  beat:        ["beat",        "beats",       "beat",      "beaten",       "beating"],
  bind:        ["bind",        "binds",       "bound",     "bound",        "binding"],
  bleed:       ["bleed",       "bleeds",      "bled",      "bled",         "bleeding"],
  breed:       ["breed",       "breeds",      "bred",      "bred",         "breeding"],
  deal:        ["deal",        "deals",       "dealt",     "dealt",        "dealing"],
  dig:         ["dig",         "digs",        "dug",       "dug",          "digging"],
  feed:        ["feed",        "feeds",       "fed",       "fed",          "feeding"],
  fight:       ["fight",       "fights",      "fought",    "fought",       "fighting"],
  hang:        ["hang",        "hangs",       "hung",      "hung",         "hanging"],
  hear:        ["hear",        "hears",       "heard",     "heard",        "hearing"],
  hurt:        ["hurt",        "hurts",       "hurt",      "hurt",         "hurting"],
  lead:        ["lead",        "leads",       "led",       "led",          "leading"],
  lean:        ["lean",        "leans",       "leant",     "leant",        "leaning"],
  leap:        ["leap",        "leaps",       "leapt",     "leapt",        "leaping"],
  lend:        ["lend",        "lends",       "lent",      "lent",         "lending"],
  lie:         ["lie",         "lies",        "lay",       "lain",         "lying"],
  light:       ["light",       "lights",      "lit",       "lit",          "lighting"],
  mean:        ["mean",        "means",       "meant",     "meant",        "meaning"],
  seek:        ["seek",        "seeks",       "sought",    "sought",       "seeking"],
  shoot:       ["shoot",       "shoots",      "shot",      "shot",         "shooting"],
  shut:        ["shut",        "shuts",       "shut",      "shut",         "shutting"],
  sit:         ["sit",         "sits",        "sat",       "sat",          "sitting"],
  slide:       ["slide",       "slides",      "slid",      "slid",         "sliding"],
  smell:       ["smell",       "smells",      "smelt",     "smelt",        "smelling"],
  spell:       ["spell",       "spells",      "spelt",     "spelt",        "spelling"],
  spin:        ["spin",        "spins",       "spun",      "spun",         "spinning"],
  split:       ["split",       "splits",      "split",     "split",        "splitting"],
  spread:      ["spread",      "spreads",     "spread",    "spread",       "spreading"],
  stick:       ["stick",       "sticks",      "stuck",     "stuck",        "sticking"],
  sting:       ["sting",       "stings",      "stung",     "stung",        "stinging"],
  strike:      ["strike",      "strikes",     "struck",    "struck",       "striking"],
  swing:       ["swing",       "swings",      "swung",     "swung",        "swinging"],
  teach:       ["teach",       "teaches",     "taught",    "taught",       "teaching"],
  understand:  ["understand",  "understands", "understood","understood",   "understanding"],
  upset:       ["upset",       "upsets",      "upset",     "upset",        "upsetting"],
  weep:        ["weep",        "weeps",       "wept",      "wept",         "weeping"],
  withdraw:    ["withdraw",    "withdraws",   "withdrew",  "withdrawn",    "withdrawing"],
  cast:        ["cast",        "casts",       "cast",      "cast",         "casting"],
  cost:        ["cost",        "costs",       "cost",      "cost",         "costing"],
  fit:         ["fit",         "fits",        "fit",       "fit",          "fitting"],
  knit:        ["knit",        "knits",       "knit",      "knit",         "knitting"],
  quit:        ["quit",        "quits",       "quit",      "quit",         "quitting"],
  rid:         ["rid",         "rids",        "rid",       "rid",          "ridding"],
  spit:        ["spit",        "spits",       "spit",      "spit",         "spitting"],
  thrust:      ["thrust",      "thrusts",     "thrust",    "thrust",       "thrusting"],
  carry:       ["carry",       "carries",     "carried",   "carried",      "carrying"],
  try:         ["try",         "tries",       "tried",     "tried",        "trying"],
  rely:        ["rely",        "relies",      "relied",    "relied",       "relying"],
  deny:        ["deny",        "denies",      "denied",    "denied",       "denying"],
  apply:       ["apply",       "applies",     "applied",   "applied",      "applying"],
  supply:      ["supply",      "supplies",    "supplied",  "supplied",     "supplying"],
  // Common phrasal verb heads (regular, but listed for completeness)
  look:        ["look",        "looks",       "looked",    "looked",       "looking"],
  call:        ["call",        "calls",       "called",    "called",       "calling"],
  turn:        ["turn",        "turns",       "turned",    "turned",       "turning"],
  pull:        ["pull",        "pulls",       "pulled",    "pulled",       "pulling"],
  push:        ["push",        "pushes",      "pushed",    "pushed",       "pushing"],
  pick:        ["pick",        "picks",       "picked",    "picked",       "picking"],
  pass:        ["pass",        "passes",      "passed",    "passed",       "passing"],
  move:        ["move",        "moves",       "moved",     "moved",        "moving"],
  add:         ["add",         "adds",        "added",     "added",        "adding"],
  ask:         ["ask",         "asks",        "asked",     "asked",        "asking"],
  back:        ["back",        "backs",       "backed",    "backed",       "backing"],
  calm:        ["calm",        "calms",       "calmed",    "calmed",       "calming"],
  catch:       ["catch",       "catches",     "caught",    "caught",       "catching"],
  check:       ["check",       "checks",      "checked",   "checked",      "checking"],
  cheer:       ["cheer",       "cheers",      "cheered",   "cheered",      "cheering"],
  clean:       ["clean",       "cleans",      "cleaned",   "cleaned",      "cleaning"],
  clear:       ["clear",       "clears",      "cleared",   "cleared",      "clearing"],
  close:       ["close",       "closes",      "closed",    "closed",       "closing"],
  count:       ["count",       "counts",      "counted",   "counted",      "counting"],
  cover:       ["cover",       "covers",      "covered",   "covered",      "covering"],
  cross:       ["cross",       "crosses",     "crossed",   "crossed",      "crossing"],
  end:         ["end",         "ends",        "ended",     "ended",        "ending"],
  fill:        ["fill",        "fills",       "filled",    "filled",       "filling"],
  fix:         ["fix",         "fixes",       "fixed",     "fixed",        "fixing"],
  gather:      ["gather",      "gathers",     "gathered",  "gathered",     "gathering"],
  hand:        ["hand",        "hands",       "handed",    "handed",       "handing"],
  head:        ["head",        "heads",       "headed",    "headed",       "heading"],
  help:        ["help",        "helps",       "helped",    "helped",       "helping"],
  jump:        ["jump",        "jumps",       "jumped",    "jumped",       "jumping"],
  kick:        ["kick",        "kicks",       "kicked",    "kicked",       "kicking"],
  knock:       ["knock",       "knocks",      "knocked",   "knocked",      "knocking"],
  lay:         ["lay",         "lays",        "laid",      "laid",         "laying"],
  lock:        ["lock",        "locks",       "locked",    "locked",       "locking"],
  mark:        ["mark",        "marks",       "marked",    "marked",       "marking"],
  mix:         ["mix",         "mixes",       "mixed",     "mixed",        "mixing"],
  open:        ["open",        "opens",       "opened",    "opened",       "opening"],
  pack:        ["pack",        "packs",       "packed",    "packed",       "packing"],
  phone:       ["phone",       "phones",      "phoned",    "phoned",       "phoning"],
  place:       ["place",       "places",      "placed",    "placed",       "placing"],
  plan:        ["plan",        "plans",       "planned",   "planned",      "planning"],
  play:        ["play",        "plays",       "played",    "played",       "playing"],
  point:       ["point",       "points",      "pointed",   "pointed",      "pointing"],
  print:       ["print",       "prints",      "printed",   "printed",      "printing"],
  roll:        ["roll",        "rolls",       "rolled",    "rolled",       "rolling"],
  save:        ["save",        "saves",       "saved",     "saved",        "saving"],
  sort:        ["sort",        "sorts",       "sorted",    "sorted",       "sorting"],
  start:       ["start",       "starts",      "started",   "started",      "starting"],
  stop:        ["stop",        "stops",       "stopped",   "stopped",      "stopping"],
  switch:      ["switch",      "switches",    "switched",  "switched",     "switching"],
  talk:        ["talk",        "talks",       "talked",    "talked",       "talking"],
  tie:         ["tie",         "ties",        "tied",      "tied",         "tying"],
  toss:        ["toss",        "tosses",      "tossed",    "tossed",       "tossing"],
  track:       ["track",       "tracks",      "tracked",   "tracked",      "tracking"],
  type:        ["type",        "types",       "typed",     "typed",        "typing"],
  use:         ["use",         "uses",        "used",      "used",         "using"],
  wait:        ["wait",        "waits",       "waited",    "waited",       "waiting"],
  walk:        ["walk",        "walks",       "walked",    "walked",       "walking"],
  wash:        ["wash",        "washes",      "washed",    "washed",       "washing"],
  watch:       ["watch",       "watches",     "watched",   "watched",      "watching"],
  wipe:        ["wipe",        "wipes",       "wiped",     "wiped",        "wiping"],
  work:        ["work",        "works",       "worked",    "worked",       "working"],
  wrap:        ["wrap",        "wraps",       "wrapped",   "wrapped",      "wrapping"],
  zoom:        ["zoom",        "zooms",       "zoomed",    "zoomed",       "zooming"],
}

// ---------------------------------------------------------------------------
// Regular conjugation rules
// ---------------------------------------------------------------------------

function regularForms(verb: string): VerbForms {
  return [verb, regularThirdSg(verb), regularPast(verb), regularPast(verb), regularGerund(verb)]
}

function regularThirdSg(v: string): string {
  if (/(?:ch|sh|ss|x|zz)$/.test(v)) return v + "es"
  if (/[^aeiou]y$/.test(v)) return v.slice(0, -1) + "ies"
  if (/[^aeiou]o$/.test(v)) return v + "es"
  return v + "s"
}

function regularPast(v: string): string {
  if (v.endsWith("e")) return v + "d"
  if (/[^aeiou]y$/.test(v)) return v.slice(0, -1) + "ied"
  if (/[^aeiou][aeiou][^aeiouyw]$/.test(v)) return v + v.slice(-1) + "ed"
  return v + "ed"
}

function regularGerund(v: string): string {
  if (v.endsWith("ie")) return v.slice(0, -2) + "ying"
  if (v.endsWith("e") && !v.endsWith("ee") && !v.endsWith("oe")) return v.slice(0, -1) + "ing"
  if (/[^aeiou][aeiou][^aeiouyw]$/.test(v)) return v + v.slice(-1) + "ing"
  return v + "ing"
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function conjugate(verb: string): VerbForms {
  const lower = verb.toLowerCase()
  return IRREGULAR[lower] ?? regularForms(lower)
}

/**
 * Generate all surface forms for an English phrasal verb expression.
 * "look up" → ["look up", "looks up", "looked up", "looking up"]
 */
export function phrasalVerbForms(expression: string): string[] {
  const tokens = expression.toLowerCase().trim().split(/\s+/)
  if (tokens.length < 2) return [expression]

  const verbHead = tokens[0]!
  const tail = tokens.slice(1).join(" ")
  const [inf, thirdSg, past, pastPp, gerund] = conjugate(verbHead)

  const raw = [
    `${inf} ${tail}`,
    `${thirdSg} ${tail}`,
    `${past} ${tail}`,
    `${gerund} ${tail}`,
  ]
  if (pastPp !== past) raw.push(`${pastPp} ${tail}`)
  return [...new Set(raw)]
}
