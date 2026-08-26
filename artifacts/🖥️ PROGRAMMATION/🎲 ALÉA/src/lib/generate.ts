import { allTokens } from "./lexicon";
import { kindsFromTokens, matchLore, type LoreNode } from "./lore";
import type { Idea, PatternId, Token } from "./types";

function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function pickN(pool: Token[], n: number, rand: () => number): Token[] {
  const copy = [...pool];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  const seen = new Set<string>();
  const out: Token[] = [];
  for (const token of copy) {
    const key = token.word.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(token);
    if (out.length >= n) break;
  }
  return out;
}

function cap(word: string) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function tok(tokens: Token[], i: number): Token {
  return tokens[i % tokens.length]!;
}

function w(tokens: Token[], i: number) {
  return tok(tokens, i).word;
}

function pick<T>(list: T[], rand: () => number): T {
  return list[Math.floor(rand() * list.length)]!;
}

function buildTitle(tokens: Token[], rand: () => number): string {
  const first = tokens[0]!;
  const a = first.word;
  if (tokens.length === 1) return cap(a);
  const b = w(tokens, 1);
  const c = tokens[2] ? w(tokens, 2) : "";
  const long = a.includes(" ") || a.length > 18;
  const forms: string[] = [`${cap(a)}`, `${cap(a)} — ${b}`, `${cap(a)} / ${cap(b)}`];
  if (!long && first.pattern !== "role" && first.pattern !== "sensation") {
    forms.push(`Sous ${a}`, `${cap(a)} de ${b}`, `${cap(a)}, ${b}`, `Contre ${a}`);
  }
  if (first.pattern === "nom") forms.push(`${a}`, `${a} : ${b}`);
  if (c && c !== a) forms.push(`${cap(c)} : ${a}`);
  return pick(forms, rand);
}

function buildDescription(tokens: Token[], rand: () => number): string {
  const n = tokens.length;
  const a = w(tokens, 0);
  const pa = tok(tokens, 0).pattern;
  if (n === 1) {
    return pick(
      [
        `Une seule contrainte : ${a}. Construire une scène entière qui n'a pas le droit d'en sortir — ni par métaphore, ni par explication.`,
        `Faire durer ${a} trop longtemps, jusqu'à ce que ça devienne une habitude, puis une règle, puis un problème.`,
        `Poser ${a} au milieu d'une journée banale. Ne pas le commenter. Observer qui dans la pièce change de geste.`,
        `Si ${a} était une tâche plutôt qu'un symbole : qui la fait, qui la cache, qui la paye.`,
      ],
      rand,
    );
  }
  const b = w(tokens, 1);
  if (n === 2) {
    return pick(
      [
        `Faire s'affronter ${a} et ${b} dans un espace trop petit. L'un devient outil, l'autre devient coût.`,
        `Commencer par ${a}. Dès que c'est joli, introduire ${b} pour casser la pose.`,
        `${cap(a)} n'explique rien. ${cap(b)} non plus. Leur coexistence force un choix concret (garder, cacher, réparer, fuir).`,
        `Hypothèse : ${a} est déjà là. ${cap(b)} arrive comme une erreur de procédure.`,
      ],
      rand,
    );
  }
  const c = w(tokens, 2);
  const extras = tokens.slice(3).map((t) => t.word);
  const tail = extras.length
    ? ` Reste à caser sans illustrer : ${extras.join(", ")}.`
    : "";

  const byPattern: Partial<Record<PatternId, string[]>> = {
    sensation: [
      `Partir du corps : ${a}. Laisser ${b} contaminer un geste banal (ouvrir une porte, servir à table, monter au toit). ${cap(c)} est ce qui reste dans la pièce après.${tail}`,
      `Quelqu'un ressent ${a} sans le nommer. ${cap(b)} devient l'excuse. ${cap(c)} trahit que ce n'est pas l'excuse.${tail}`,
    ],
    lieu: [
      `Installer ${a} comme un lieu de travail, pas un décor. Y ranger ${b} comme un outil mal adapté. ${cap(c)} est la panne.${tail}`,
      `${cap(a)} a déjà trop de fonctions. En ajouter une seule, sale : ${b}. Si ça embellit, couper et garder ${c}.${tail}`,
    ],
    nom: [
      `${cap(a)} n'entre pas comme un destin. Lui donner une tâche liée à ${b}. ${cap(c)} est ce qu'il/elle ne sait pas faire.${tail}`,
    ],
    objet: [
      `Un objet : ${a}. S'en servir trop. ${cap(b)} explique pourquoi on ne le range pas. ${cap(c)} est la trace qu'il laisse sur les mains.${tail}`,
    ],
    phenomene: [
      `${cap(a)} se produit sans témoin fiable. ${cap(b)} est la version qu'on raconte. ${cap(c)} est ce qui ne rentre dans aucune version.${tail}`,
    ],
    role: [
      `Quelqu'un joue ${a} sans le titre. ${cap(b)} est la compétence réelle. ${cap(c)} est la peur qui justifie le rôle.${tail}`,
    ],
    theme: [
      `Ne pas illustrer ${a}. Le traiter comme une contrainte de mise en scène. ${cap(b)} en est le matériel. ${cap(c)} en est l'accident.${tail}`,
    ],
  };

  const generic = [
    `Scène brute : ${a} occupe le premier plan. ${cap(b)} force un choix. ${cap(c)} reste après, inutilisable comme morale.${tail}`,
    `Réduire l'idée à une texture (${a}), une règle (${b}), un accident (${c}). Couper dès que l'un des trois devient symbole.${tail}`,
    `Faire durer ${a} trop longtemps. Interrompre par ${b}. Terminer trop tôt, au moment où ${c} devient lisible.${tail}`,
    `Inventaire de travail : ${a} / ${b} / ${c}. Observer lequel devient une habitude, lequel une arme, lequel un silence.${tail}`,
    `Si ${a} et ${b} partagent la même pièce, ${c} cesse d'être métaphorique. Noter le premier geste qui change.${tail}`,
  ];

  return pick([...(byPattern[pa] ?? []), ...generic], rand);
}

function buildRapport(
  tokens: Token[],
  element: string,
  node: LoreNode,
  rand: () => number,
): string {
  const a = w(tokens, 0);
  const b = tokens[1] ? w(tokens, 1) : a;
  const c = tokens[2] ? w(tokens, 2) : b;
  const typed = element.trim();
  const same = typed && typed.toLowerCase() !== node.name.toLowerCase();
  const via = same ? ` (demandé : ${typed})` : "";

  const forms = [
    `${node.name} — ${node.kind}${via}. ${node.hook} Coller ${a} dessus jusqu'à ce que ça frotte : pas comme décor, comme tâche. ${cap(b)} révèle une maladresse déjà là. ${cap(c)} reste après la scène, dans ${node.file}.`,
    `Fiche : ${node.file}. ${node.name} ${node.hook} ${cap(a)} n'illustre pas ça — ça le dérègle. Si ${b} devient trop joli, le donner à quelqu'un d'autre. Garder ${c} pour ${node.name} seul.`,
    `Avec ${node.name} (${node.kind})${via} : ${a} devient une habitude secrète, compatible avec ce qu'on sait déjà (${node.hook}) mais qui n'y est pas écrit. ${cap(b)} force un choix que la fiche actuelle élude. ${cap(c)} en est la trace.`,
    `${node.name} est trop défini par sa fiche. ${cap(a)} le désaxe sans le trahir. ${cap(b)} empêche le retour à l'équilibre connu. ${cap(c)} propose une compétence, ou une peur, absente de ${node.file}.`,
    `Mettre ${node.name} au travail avec ${a}. La relation n'est pas affective d'abord : c'est une procédure. ${cap(b)} est le matériel. ${cap(c)} est l'erreur — et ${node.hook}`,
    `Si ${node.name} ignore ${a}, l'histoire tourne dans ${node.file}. ${cap(b)} force à sortir du déjà-écrit. ${cap(c)} est ce qu'on pourra ajouter à la fiche, même si le choix n'a pas lieu.`,
  ];
  return pick(forms, rand);
}

export function generateIdea(input: {
  patterns: PatternId[];
  count: number;
  element: string;
  extra?: Token[];
  exclusive?: boolean;
  seed?: number;
}): Idea | null {
  const seed = input.seed ?? (Math.floor(Math.random() * 0xffffffff) ^ Date.now());
  const rand = mulberry32(seed);
  const n = Math.min(7, Math.max(1, input.count));
  const extra = input.extra ?? [];
  const base = input.exclusive ? [] : allTokens(input.patterns);

  let keywords: Token[];
  if (input.exclusive) {
    keywords = pickN(extra, Math.min(n, extra.length), rand);
    if (keywords.length === 0) return null;
  } else if (extra.length === 0) {
    keywords = pickN(base, n, rand);
  } else {
    const reserved = Math.min(extra.length, Math.max(1, Math.ceil(n * 0.4)));
    const fromCustom = pickN(extra, reserved, rand);
    const taken = new Set(fromCustom.map((t) => t.word.toLowerCase()));
    const fromBase = pickN(
      base.filter((t) => !taken.has(t.word.toLowerCase())),
      Math.max(0, n - fromCustom.length),
      rand,
    );
    keywords = pickN([...fromCustom, ...fromBase], n, rand);
  }

  if (keywords.length === 0) return null;

  const prefer = kindsFromTokens(keywords);
  const node = matchLore(input.element, prefer.length ? prefer : undefined, rand);

  return {
    id: `${seed.toString(16)}-${Date.now().toString(16)}`,
    createdAt: Date.now(),
    keywords,
    title: buildTitle(keywords, rand),
    description: buildDescription(keywords, rand),
    rapport: buildRapport(keywords, input.element, node, rand),
    element: input.element.trim() || node.name,
    anchor: { name: node.name, kind: node.kind, file: node.file },
    patterns: [...input.patterns],
  };
}

export function formatIdea(idea: Idea): string {
  const keys = idea.keywords.map((k) => k.word).join(" · ");
  const file = idea.anchor ? `\nFiche : ${idea.anchor.file}` : "";
  return `* ${idea.title}\n\n* ${idea.description}\n\n* ${idea.rapport}${file}\n\nMots-clés : ${keys}`;
}
