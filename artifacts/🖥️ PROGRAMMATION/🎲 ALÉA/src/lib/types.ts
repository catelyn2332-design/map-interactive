export const PATTERN_IDS = [
  "sujet",
  "theme",
  "style",
  "nom",
  "adjectif",
  "sensation",
  "phenomene",
  "objet",
  "lieu",
  "role",
] as const;

export type BuiltInPattern = (typeof PATTERN_IDS)[number];
export type PatternId = string;

export type Token = {
  word: string;
  pattern: PatternId;
  custom?: boolean;
  subtype?: string;
};

export type CustomType = {
  id: string;
  name: string;
};

export type CustomSubtype = {
  id: string;
  name: string;
  parent: PatternId;
};

export type CustomKeyword = {
  id: string;
  word: string;
  pattern: PatternId;
  subtypeId: string | null;
  active: boolean;
  createdAt: number;
};

export type KeywordSort = "recent" | "alpha" | "type" | "active";

export type Idea = {
  id: string;
  createdAt: number;
  keywords: Token[];
  title: string;
  description: string;
  rapport: string;
  element: string;
  anchor?: { name: string; kind: string; file: string };
  patterns: PatternId[];
};

export const PATTERN_LABELS: Record<BuiltInPattern, string> = {
  sujet: "Sujet",
  theme: "Thème",
  style: "Style",
  nom: "Nom",
  adjectif: "Adjectif",
  sensation: "Sensation",
  phenomene: "Phénomène",
  objet: "Objet",
  lieu: "Lieu",
  role: "Rôle",
};

export const PATTERN_HINTS: Record<BuiltInPattern, string> = {
  sujet: "Matières et motifs à traiter",
  theme: "Idées abstraites",
  style: "Textures formelles",
  nom: "Noms propres inventés",
  adjectif: "Qualités inattendues",
  sensation: "Perceptions physiques",
  phenomene: "Événements sans cause claire",
  objet: "Choses concrètes rares",
  lieu: "Espaces non cartographiés",
  role: "Fonctions humaines odd",
};

export function isBuiltIn(id: string): id is BuiltInPattern {
  return (PATTERN_IDS as readonly string[]).includes(id);
}

export function patternLabel(id: string, customTypes: CustomType[] = []): string {
  if (isBuiltIn(id)) return PATTERN_LABELS[id];
  return customTypes.find((t) => t.id === id)?.name ?? id;
}

export function visibleBuiltIns(hidden: string[] = []): BuiltInPattern[] {
  return PATTERN_IDS.filter((id) => !hidden.includes(id));
}

export function allPatternOptions(
  customTypes: CustomType[],
  hidden: string[] = [],
): { id: string; name: string }[] {
  return [
    ...visibleBuiltIns(hidden).map((id) => ({ id, name: PATTERN_LABELS[id] })),
    ...customTypes.map((t) => ({ id: t.id, name: t.name })),
  ];
}
