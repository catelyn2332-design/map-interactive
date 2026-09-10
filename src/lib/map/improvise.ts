import type { PropDef, PropValue, RoomStep } from "./types";
import { emptyPropValue, uid } from "./props";
import { sanitizeHexColor } from "./types";
import {
  DEFAULT_ASSIST,
  type AssistPrefs,
  type MoodId,
} from "./ui";

type Mood = {
  id: MoodId | "neutral";
  color: string;
  tags: string[];
  sensory: string[];
  sheet: string[];
  match: RegExp;
};

const MOODS: Mood[] = [
  {
    id: "dark",
    color: "#3d4450",
    tags: ["ombre", "froid", "secret"],
    match: /cave|caveau|crypte|sous-sol|cellier|oubliette/i,
    sensory: [
      "L’air y reste lourd, comme s’il n’avait pas bougé depuis des saisons.",
      "La pierre sue. Un filet de lumière suffit à faire reculer les recoins.",
    ],
    sheet: [
      "Accès bas, peu de lumière naturelle, parois humides.",
      "Fonction : réserve, passage secret ou pièce technique.",
    ],
  },
  {
    id: "dust",
    color: "#8a7a62",
    tags: ["poussière", "oubli", "bois"],
    match: /grenier|comble|attique|débarras/i,
    sensory: [
      "Les poutres craquent et la poussière danse dès qu’on avance.",
      "On y a rangé trop de choses trop longtemps — le temps s’y est déposé.",
    ],
    sheet: [
      "Combles, bois apparent, stockage ancien.",
      "Peu fréquenté. Attention aux planchers irréguliers.",
    ],
  },
  {
    id: "warm",
    color: "#c4a574",
    tags: ["chaleur", "ambre", "foyer"],
    match: /cuisine|office|foyer|cheminée|four/i,
    sensory: [
      "Ça sent le bois chaud et quelque chose qui a mijoté récemment.",
      "La lumière rase les plans de travail et s’arrête sur les objets laissés là.",
    ],
    sheet: [
      "Pièce de service, chaleur, eau et feu à proximité.",
      "Usage quotidien : préparer, servir, se rassembler.",
    ],
  },
  {
    id: "grand",
    color: "#d8c9a8",
    tags: ["hauteur", "accueil", "éclat"],
    match: /hall|salon|salle|vestibule|galerie|atrium/i,
    sensory: [
      "Le volume impose le silence un instant, le temps que l’œil prenne la mesure.",
      "Les pas résonnent. On comprend tout de suite que l’endroit a été pensé pour être vu.",
    ],
    sheet: [
      "Grand volume, rôle d’accueil et de représentation.",
      "Circulation principale. Plusieurs issues possibles.",
    ],
  },
  {
    id: "green",
    color: "#6a7a58",
    tags: ["ouvert", "sève", "air"],
    match: /jardin|cour|terrasse|serre|verger|patio/i,
    sensory: [
      "L’air y change : plus d’humidité, plus de vert, moins de murs.",
      "Le regard fuit vers le dehors, même quand on reste encore un pas à l’intérieur.",
    ],
    sheet: [
      "Espace ouvert ou semi-ouvert, végétation, air libre.",
      "Transition intérieur / extérieur.",
    ],
  },
  {
    id: "intimate",
    color: "#a56b6b",
    tags: ["calme", "privé", "drapé"],
    match: /chambre|alcôve|boudoir|nid/i,
    sensory: [
      "On baisse naturellement la voix. L’espace est fait pour s’y retirer.",
      "Les tissus retiennent la lumière. Rien n’y semble accidentel.",
    ],
    sheet: [
      "Pièce privée, accès limité.",
      "Repos, toilette, affaires personnelles.",
    ],
  },
  {
    id: "quiet",
    color: "#6d7c8a",
    tags: ["silence", "encre", "étude"],
    match: /biblioth|étude|bureau|scriptorium|cabinet/i,
    sensory: [
      "Le silence a une densité propre, comme une poussière d’encre.",
      "On y vient pour lire, écrire, ou simplement ne pas être trouvé.",
    ],
    sheet: [
      "Travail, archives, lecture.",
      "Peu de passage. Besoin de calme.",
    ],
  },
  {
    id: "wet",
    color: "#5b7d8a",
    tags: ["eau", "écho", "lisse"],
    match: /bain|douche|lavoir|piscine|thermes/i,
    sensory: [
      "L’écho glisse sur le carrelage. L’humidité a son propre parfum.",
      "Chaque surface semble faite pour que l’eau y circule sans s’attarder.",
    ],
    sheet: [
      "Eau courante, surfaces lisses, évacuation.",
      "Hygiène ou lessive.",
    ],
  },
  {
    id: "transit",
    color: "#7a7468",
    tags: ["passage", "seuil", "courant d’air"],
    match: /couloir|passage|palier|escalier|seuil/i,
    sensory: [
      "On n’y reste pas. Pourtant l’endroit raconte ceux qui le traversent.",
      "Un courant d’air, une porte trop loin, des traces qui ne s’arrêtent pas.",
    ],
    sheet: [
      "Circulation. Relie plusieurs pièces.",
      "Peu de mobilier. Seuils et courants d’air.",
    ],
  },
];

const FALLBACK: Mood = {
  id: "neutral",
  color: "#7d8b78",
  tags: ["usage", "seuil", "matière"],
  match: /$/,
  sensory: [
    "Rien n’y clame sa fonction, mais tout y a déjà servi.",
    "La lumière y entre sans cérémonie et s’arrête où les murs le décident.",
  ],
  sheet: [
    "Pièce d’usage non précisé.",
    "À définir selon le plan et les liaisons.",
  ],
};

function pick<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)]!;
}

function allowedMoods(prefs: AssistPrefs): Mood[] {
  const ids = new Set(prefs.moods);
  const pool = MOODS.filter((m) => ids.has(m.id as MoodId));
  return pool.length ? pool : MOODS;
}

function promptHay(prompt: string) {
  return prompt.toLowerCase();
}

function scoreMood(mood: Mood, name: string, prompt: string) {
  let n = 0;
  if (mood.match.test(name)) n += 6;
  const hay = promptHay(prompt);
  if (hay) {
    for (const tag of mood.tags) {
      if (hay.includes(tag)) n += 3;
    }
    if (mood.match.test(prompt)) n += 4;
  }
  return n + Math.random() * 0.3;
}

function moodFor(name: string, prefs: AssistPrefs): Mood {
  const pool = allowedMoods(prefs);
  if (prefs.nameAnchor) {
    const ranked = pool
      .map((m) => ({ m, s: scoreMood(m, name, prefs.prompt) }))
      .sort((a, b) => b.s - a.s);
    const top = ranked[0];
    if (top && top.s >= 4) return top.m;
  }
  if (prefs.prompt.trim()) {
    const ranked = pool
      .map((m) => ({ m, s: scoreMood(m, name, prefs.prompt) }))
      .sort((a, b) => b.s - a.s);
    if (ranked[0] && ranked[0].s >= 2) return ranked[0].m;
  }
  return pick(pool) ?? FALLBACK;
}

function phrasesFor(mood: Mood, prefs: AssistPrefs): string[] {
  if (prefs.voice === "sheet") return mood.sheet;
  if (prefs.voice === "mix") return [pick(mood.sensory), pick(mood.sheet)];
  return mood.sensory;
}

function flourish(prefs: AssistPrefs, mood: Mood): string | null {
  if (prefs.intensity === "sober") return null;
  if (prefs.intensity === "baroque") {
    return pick([
      `Les détails s’accumulent : ${mood.tags.join(", ")}.`,
      "Rien n’y est neutre ; chaque surface a une opinion.",
      "On sent que le lieu a une mémoire plus longue que ceux qui le traversent.",
    ]);
  }
  return null;
}

function scoreOption(label: string, hay: string) {
  const words = label
    .toLowerCase()
    .split(/[^a-zàâäéèêëïîôùûüç0-9]+/i)
    .filter((w) => w.length > 2);
  if (!words.length) return 0;
  return words.reduce((n, w) => n + (hay.includes(w) ? 2 : 0), 0);
}

function pickPreset(def: PropDef, hay: string): string {
  if (!def.options.length) return "";
  let best = def.options[0]!;
  let bestScore = -1;
  for (const opt of def.options) {
    const s = scoreOption(opt.label, hay) + Math.random() * 0.4;
    if (s > bestScore) {
      best = opt;
      bestScore = s;
    }
  }
  return best.id;
}

function valueFor(
  def: PropDef,
  mood: Mood,
  description: string,
  name: string,
  prompt: string,
): PropValue {
  const hay = `${description} ${mood.tags.join(" ")} ${name} ${prompt}`.toLowerCase();
  if (def.type === "path") return "";
  if (def.type === "preset" && def.multi) {
    const one = pickPreset(def, hay);
    return one ? [one] : [];
  }
  if (def.type === "preset" || def.type === "token") return pickPreset(def, hay);
  if (def.type === "choice") {
    const scored = def.options.length ? pickPreset(def, hay) : "";
    if (scored) {
      return def.options.find((o) => o.id === scored)?.label ?? pick(mood.tags);
    }
    return pick(mood.tags);
  }
  if (def.type === "tags" || def.type === "keyword") {
    const fromOpts = def.options
      .filter((o) => scoreOption(o.label, hay) > 0)
      .map((o) => o.label);
    const picked = fromOpts.length ? fromOpts.slice(0, 2) : mood.tags.slice(0, 2);
    return picked;
  }
  if (def.type === "toggle") {
    return /ombre|secret|fermé|interdit|verrou/i.test(hay)
      ? true
      : /ouvert|air|accueil/i.test(hay)
        ? Math.random() > 0.45
        : Math.random() > 0.5;
  }
  if (def.type === "color") {
    return sanitizeHexColor(mood.color) ?? mood.color;
  }
  if (def.type === "number") {
    if (/temp|degré|chaleur/i.test(def.name)) return mood.id === "warm" ? 22 : mood.id === "dark" ? 12 : 18;
    if (/mètre|surface|aire|taille/i.test(def.name)) return 8 + Math.floor(Math.random() * 24);
    return 1 + Math.floor(Math.random() * 6);
  }
  if (def.type === "text" || def.type === "longtext") {
    return pick(mood.sensory);
  }
  return emptyPropValue(def);
}

export type ImproviseResult = {
  description: string;
  props: Record<string, PropValue>;
  skippedDescription: boolean;
  steps?: RoomStep[];
};

export function completeText(existing: string | undefined, addition: string): string {
  const a = (existing ?? "").trim();
  const b = addition.trim();
  if (!a) return b;
  if (!b) return a;
  if (b.startsWith(a.slice(0, Math.min(48, a.length)))) return b;
  const glue = /[.!?…:]$/.test(a) ? " " : ". ";
  return `${a}${glue}${b.replace(/^(cette pièce|cette zone)\s+/i, "")}`;
}

function stepIdeas(mood: Mood): string[] {
  const byMood: Record<string, string[]> = {
    dark: ["Descendre sans bruit", "Tâter le mur humide", "Écouter le goutte-à-goutte"],
    dust: ["Soulever un drap", "Chercher un coffre", "Lire une étiquette oubliée"],
    warm: ["Goûter ce qui mijote", "Raviver le feu", "Ouvrir un placard"],
    grand: ["Observer le plafond", "Saluer l’hôte", "Chercher une issue latérale"],
    green: ["Respirer l’air libre", "Suivre un sentier", "Cueillir ce qui pousse"],
    intimate: ["Tirer le rideau", "Ouvrir un tiroir", "S’asseoir un instant"],
    quiet: ["Parcourir une page", "Noter ce qu’on voit", "Écouter le silence"],
    wet: ["Fermer un robinet", "Marcher hors de l’eau", "Chercher une serviette"],
    transit: ["Choisir une direction", "Écouter derrière une porte", "Marquer le seuil"],
    neutral: ["Fouiller un recoin", "Écouter", "Ouvrir ce qui cède"],
  };
  return byMood[mood.id] ?? byMood.neutral!;
}

export function improviseSteps(
  mood: Mood,
  existing: RoomStep[] | undefined,
  length: AssistPrefs["length"],
): RoomStep[] {
  const ideas = stepIdeas(mood);
  const cur = (existing ?? []).map((s) => ({ ...s }));
  let used = 0;
  for (const step of cur) {
    if (!step.label.trim() && ideas[used]) {
      step.label = ideas[used]!;
      used += 1;
    }
  }
  const want = length === "short" ? 2 : length === "long" ? 4 : 3;
  while (cur.length < want && used < ideas.length) {
    cur.push({ id: uid("step"), label: ideas[used]!, done: false });
    used += 1;
  }
  return cur;
}

export function improvisePlace(opts: {
  name: string;
  kind: "room" | "zone";
  schema: PropDef[];
  current: Record<string, PropValue>;
  existingDescription?: string;
  existingSteps?: RoomStep[];
  prefs?: AssistPrefs;
}): ImproviseResult {
  const prefs = opts.prefs ?? DEFAULT_ASSIST;
  const name = opts.name.trim() || (opts.kind === "zone" ? "cette zone" : "cette pièce");
  const mood = moodFor(name, prefs);
  const kindWord = opts.kind === "zone" ? "Cette zone" : "Cette pièce";
  const lead =
    opts.kind === "zone"
      ? `${name} s’étend comme un lieu à part, plutôt qu’une simple pièce.`
      : `${name} a une présence nette dès le seuil.`;
  const pool = phrasesFor(mood, prefs);
  const extra = flourish(prefs, mood);
  const hadDescription = Boolean(opts.existingDescription?.trim());
  const skippedDescription = hadDescription && prefs.overwrite === "skip";
  const parts: string[] = [];
  if (!hadDescription || prefs.overwrite === "replace") {
    parts.push(lead);
  }
  if (prefs.length !== "short") parts.push(pick(pool));
  if (prefs.length === "long") {
    const rest = pool.filter((p) => !parts.includes(p));
    if (rest.length) parts.push(pick(rest));
  }
  if (extra) parts.push(extra);
  let addition = parts
    .filter(Boolean)
    .filter((p, i, all) => all.indexOf(p) === i)
    .join(" ")
    .replace(/Cette pièce|Cette zone/g, kindWord);

  let description = addition;
  if (skippedDescription) {
    description = opts.existingDescription ?? description;
  } else if (hadDescription && prefs.overwrite !== "replace") {
    description = completeText(opts.existingDescription, addition);
  }

  const usable = opts.schema.filter((d) => d.type !== "token");
  const assignedIds = usable.filter((d) => d.id in opts.current).map((d) => d.id);
  let targets: string[] = [];
  if (prefs.fill === "description") {
    targets = [];
  } else if (assignedIds.length > 0 && prefs.fill !== "add") {
    targets = assignedIds;
  } else if (prefs.fill === "add") {
    const extraIds = usable
      .filter((d) => !(d.id in opts.current))
      .sort(() => Math.random() - 0.5)
      .slice(0, prefs.addMax)
      .map((d) => d.id);
    targets = [...assignedIds, ...extraIds];
  } else if (assignedIds.length === 0) {
    targets = usable
      .slice()
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(prefs.addMax, usable.length))
      .map((d) => d.id);
  }

  const props: Record<string, PropValue> = { ...opts.current };
  for (const id of targets) {
    const def = usable.find((d) => d.id === id);
    if (!def) continue;
    props[id] = valueFor(def, mood, description, name, prefs.prompt);
  }
  return {
    description,
    props,
    skippedDescription,
    steps: opts.kind === "room" ? improviseSteps(mood, opts.existingSteps, prefs.length) : undefined,
  };
}
