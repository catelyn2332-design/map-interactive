/** Projets Grok du compte (pas les sous-dossiers locaux d’Atlas). */
export type GrokWorkspace = {
  id: string;
  name: string;
  hint: string;
  /** Racine fichiers si ce projet est monté dans Atlas. */
  path: string;
};

export const GROK_WORKSPACES: GrokWorkspace[] = [
  {
    id: "homme-volant",
    name: "🦸‍♂️ L'Homme Volant",
    hint: "Worldbuilding",
    path: "artifacts",
  },
  {
    id: "enchanteresse",
    name: "👁️ L'Enchanteresse",
    hint: "Worldbuilding",
    path: "",
  },
  {
    id: "espace-de-travail",
    name: "Espace de travail",
    hint: "Projet Grok",
    path: "",
  },
  {
    id: "planification",
    name: "Plannification du projet",
    hint: "Épanouissement personnel",
    path: "",
  },
  {
    id: "programmation-ia",
    name: "🤖 PROGRAMMATION: Intelligence Artificielle",
    hint: "Projet Grok",
    path: "",
  },
  {
    id: "divers-sims",
    name: "DIVERS: SIMS 4",
    hint: "Veille",
    path: "",
  },
];

export function grokWorkspaceRef(id: string) {
  return `grok:${id}`;
}

export function isGrokRef(path: string) {
  return path.startsWith("grok:");
}

export function listGrokWorkspaces() {
  return GROK_WORKSPACES.map((item) => ({
    id: item.id,
    name: item.name,
    hint: item.path ? "Fichiers ouverts dans Atlas" : "Fichiers absents de cet Atlas",
    path: item.path || grokWorkspaceRef(item.id),
    available: Boolean(item.path),
  }));
}
