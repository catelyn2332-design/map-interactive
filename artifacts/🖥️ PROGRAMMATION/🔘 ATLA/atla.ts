export type AtlaCategoryId =
  | "personnages"
  | "map"
  | "timelines"
  | "factions"
  | "systeme";

export type AtlaFiche = {
  name: string;
  subcategory: string;
};

export type AtlaCategory = {
  id: AtlaCategoryId;
  label: string;
  colorToken: string;
  fiches: AtlaFiche[];
};

export const ATLA_MEASURED_ON = "2026-08-21";
export const ATLA_MEASURED_LABEL = "21 août 2026";

export const ATLA_CATEGORIES: AtlaCategory[] = [
  {
    id: "personnages",
    label: "Personnages",
    colorToken: "var(--color-cat-personnages)",
    fiches: [
      { name: "Stella Bellarosa", subcategory: "Principaux" },
      { name: "Myriam Bellarosa", subcategory: "Principaux" },
      { name: "Antoine Bellarosa", subcategory: "Principaux" },
      { name: "Le Traqueur", subcategory: "Secrets" },
      { name: "L'Homme en Rouge", subcategory: "Secrets" },
      { name: "Mylo", subcategory: "Enjeux · École" },
      { name: "Gaston", subcategory: "Enjeux · Voisinage" },
    ],
  },
  {
    id: "map",
    label: "Map",
    colorToken: "var(--color-cat-map)",
    fiches: [
      { name: "Magasin BIO", subcategory: "Lieux" },
      { name: "Côtebelle", subcategory: "Villes" },
      { name: "Anse-les-Vagues", subcategory: "Villes" },
      { name: "Maison des Bellarosa", subcategory: "Habitations" },
    ],
  },
  {
    id: "timelines",
    label: "Timelines",
    colorToken: "var(--color-cat-timelines)",
    fiches: [
      { name: "Fuite originelle", subcategory: "Périodes clés" },
      { name: "L'Homme Volant", subcategory: "Périodes clés" },
      { name: "Scènes Fuite Originelle", subcategory: "Scènes" },
      { name: "Scènes L'Homme Volant", subcategory: "Scènes" },
    ],
  },
  {
    id: "factions",
    label: "Factions",
    colorToken: "var(--color-cat-factions)",
    fiches: [{ name: "Lignée Bellarosa", subcategory: "Lignées" }],
  },
  {
    id: "systeme",
    label: "Système du projet",
    colorToken: "var(--color-cat-systeme)",
    fiches: [
      { name: "Projet L'Homme Volant", subcategory: "Projet" },
      { name: "Mécanismes du gameplay", subcategory: "Implémentation" },
    ],
  },
];

export const ATLA_TOTAL = ATLA_CATEGORIES.reduce(
  (sum, category) => sum + category.fiches.length,
  0,
);

export function atlaPercent(count: number): string {
  return ((count / ATLA_TOTAL) * 100).toFixed(1).replace(".", ",");
}

export function findCategory(id: AtlaCategoryId | null) {
  if (!id) return null;
  return ATLA_CATEGORIES.find((category) => category.id === id) ?? null;
}
