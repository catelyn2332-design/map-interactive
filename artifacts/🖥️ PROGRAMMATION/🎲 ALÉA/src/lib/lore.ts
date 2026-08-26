export type LoreKind =
  | "personnage"
  | "lieu"
  | "faction"
  | "période"
  | "secret"
  | "archive"
  | "projet";

export type LoreNode = {
  name: string;
  kind: LoreKind;
  aliases: string[];
  file: string;
  hook: string;
};

export const LORE: LoreNode[] = [
  {
    name: "Stella Bellarosa",
    kind: "personnage",
    aliases: ["Appollyn Ladevèze", "Appollyn", "Appo", "Appopo", "P'tit mouton", "Stella"],
    file: "5. PERSONNAGES / PRINCIPAUX / Stella Bellarosa.md",
    hook: "Jumelle aînée, elle explore les pièces interdites, collectionne les fragments, et parle à son père depuis le toit.",
  },
  {
    name: "Antoine Bellarosa",
    kind: "personnage",
    aliases: ["Antoine"],
    file: "5. PERSONNAGES / PRINCIPAUX / Antoine Bellarosa.md",
    hook: "Jumeau cadet, phobie des supes, possessif, il transforme chaque règle familiale en ligne de défense.",
  },
  {
    name: "Myriam Bellarosa",
    kind: "personnage",
    aliases: ["Mrs Bellarosa", "Myriam", "Maman", "La sorcière", "Daymare"],
    file: "5. PERSONNAGES / PRINCIPAUX / Myriam Bellarosa.md",
    hook: "Mère, ancienne Daymare : règles strictes, magasin BIO, silence sur le passé pour protéger les jumeaux.",
  },
  {
    name: "Gaston",
    kind: "personnage",
    aliases: ["Papy"],
    file: "5. PERSONNAGES / ENJEUX / VOISINAGE / Gaston.md",
    hook: "Voisin marin-pêcheur retiré, témoin discret entre la colline et Anse-les-Vagues.",
  },
  {
    name: "Mylo",
    kind: "personnage",
    aliases: [],
    file: "5. PERSONNAGES / ENJEUX / ÉCOLE / Mylo.md",
    hook: "Camarade d'école encore peu écrit — un blanc utile à remplir par une collision.",
  },
  {
    name: "Maison des Bellarosa",
    kind: "lieu",
    aliases: ["la maison", "maison Bellarosa", "les Hauts"],
    file: "3. MAP / HABITATIONS / Maison des Bellarosa.md",
    hook: "Grande bâtisse isolée sur collines face à la mer : refuge, prison douce, chantier permanent.",
  },
  {
    name: "Côtebelle",
    kind: "lieu",
    aliases: [],
    file: "3. MAP / VILLES / Côtebelle.md",
    hook: "Ville côtière filtre : école, marché, magasin. Assez proche pour exister, assez loin pour rassurer.",
  },
  {
    name: "Anse-les-Vagues",
    kind: "lieu",
    aliases: ["Anse"],
    file: "3. MAP / VILLES / Anse-les-Vagues.md",
    hook: "Crique de pêcheurs, silence salé, temps étiré. Troisième cercle, plus sauvage que Côtebelle.",
  },
  {
    name: "Magasin BIO",
    kind: "lieu",
    aliases: ["le magasin", "BIO"],
    file: "3. MAP / LIEUX / Magasin BIO.md",
    hook: "Interface contrôlée de Myriam : elle y filtre ce qui entre dans la vie familiale.",
  },
  {
    name: "Lignée Bellarosa",
    kind: "faction",
    aliases: ["famille Bellarosa", "les Bellarosa"],
    file: "4. FACTIONS / LIGNÉES / Lignée Bellarosa.md",
    hook: "Famille monoparentale autosuffisante : les enfants ignorent origines et capacités.",
  },
  {
    name: "Fuite originelle",
    kind: "période",
    aliases: ["la fuite"],
    file: "2. TIMELINES / PÉRIODES CLÉS / Fuite originelle.md",
    hook: "Daymare fuit Homelander, change d'identité, porte les jumeaux. Le régime supe s'effondre puis l'ombre le cherche.",
  },
  {
    name: "L'Homme Volant",
    kind: "période",
    aliases: ["sandbox", "période actuelle"],
    file: "2. TIMELINES / PÉRIODES CLÉS / L'Homme Volant.md",
    hook: "Myriam élève Stella et Antoine sur la colline, sans dire qu'ils ne sont pas une famille ordinaire.",
  },
  {
    name: "L'Homme en Rouge",
    kind: "secret",
    aliases: ["man in red", "homme en rouge"],
    file: "5. PERSONNAGES / SECRETS / L'Homme en Rouge.md",
    hook: "Figure non humaine au parc, en fin de parcours, si Antoine n'a jamais croisé le Traqueur.",
  },
  {
    name: "Le Traqueur",
    kind: "secret",
    aliases: ["Traqueur"],
    file: "5. PERSONNAGES / SECRETS / Le Traqueur.md",
    hook: "Antagoniste encore à écrire : une fiche-trou. Le dé peut forcer à le définir.",
  },
  {
    name: "Cassette gouvernementale",
    kind: "archive",
    aliases: ["VHS", "cassette"],
    file: "1. BASES DE DONNÉES / ARCHIVES / Cassette gouvernementale.md",
    hook: "VHS top secrète : protocoles pour neutraliser un supe hors de contrôle, pictogrammes et sifflement.",
  },
  {
    name: "Projet L'Homme Volant",
    kind: "projet",
    aliases: ["l'homme volant", "the boys"],
    file: "0. SYSTÈME DU PROJET / Projet L'Homme Volant.md",
    hook: "Suite dystopique de The Boys / L'Enchanteresse : les supes ont gouverné, puis se sont effondrés sous la méfiance.",
  },
];

function fold(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/gi, " ")
    .trim();
}

export function matchLore(
  query: string,
  prefer?: LoreKind[],
  rand: () => number = Math.random,
): LoreNode {
  const q = fold(query);
  let best: LoreNode | null = null;
  let score = 0;
  for (const node of LORE) {
    const names = [node.name, ...node.aliases, node.kind, node.file];
    let s = 0;
    for (const n of names) {
      const f = fold(n);
      if (!f) continue;
      if (q && f === q) s = Math.max(s, 100);
      else if (q && (f.includes(q) || q.includes(f))) s = Math.max(s, 70 + Math.min(f.length, 20));
    }
    if (prefer?.includes(node.kind)) s += 8;
    if (s > score) {
      score = s;
      best = node;
    }
  }
  if (best && score >= 40) return best;
  const pool = prefer?.length ? LORE.filter((n) => prefer.includes(n.kind)) : LORE;
  const source = pool.length ? pool : LORE;
  const index = Math.floor(rand() * source.length);
  return source[index]!;
}

export function kindsFromTokens(
  patterns: Array<{ pattern: string }>,
): LoreKind[] {
  const kinds = new Set<LoreKind>();
  for (const t of patterns) {
    if (t.pattern === "lieu") kinds.add("lieu");
    if (t.pattern === "role" || t.pattern === "nom") kinds.add("personnage");
    if (t.pattern === "phenomene") {
      kinds.add("période");
      kinds.add("secret");
    }
    if (t.pattern === "objet") kinds.add("archive");
  }
  return [...kinds];
}
