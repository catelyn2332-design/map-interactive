import { create } from "zustand";
import {
  defaultGroundPalette,
  sanitizeGroundPalette,
  type GroundPalette,
} from "./types";

export type CopyLabels = {
  appName: string;
  floorWord: string;
  roomWord: string;
  emptyPlan: string;
  workspaceName: string;
  modeAtelier: string;
  modePartie: string;
  /** Surcharges de titres (panneaux et vrais titres), clé → libellé. */
  titles: Record<string, string>;
};

export type ChromeFlags = {
  showGrid: boolean;
  showCompass: boolean;
  showTokens: boolean;
  showHints: boolean;
};

export type MapChrome = ChromeFlags & {
  handleSize: number;
  labelSize: number;
  toolBtnSize: number;
  groundPalette: GroundPalette;
};

export type AssistIntensity = "sober" | "lively" | "baroque";
export type AssistLength = "short" | "medium" | "long";
export type AssistVoice = "sensory" | "sheet" | "mix";
export type AssistFill = "description" | "assigned" | "add";
export type AssistOverwrite = "skip" | "draft" | "replace";
export type AssistPerimeter = "place" | "floor" | "plan";
export type MapStance = "atelier" | "partie";

export type VaultPrefs = {
  /** Dossier Grok choisi (racine du workspace). */
  workspace: string;
  /** Dossier où naissent les fichiers de pièces, sous le workspace. */
  root: string;
  createOnRoom: boolean;
  syncNotes: boolean;
};

export const DEFAULT_VAULT: VaultPrefs = {
  workspace: "",
  root: "",
  createOnRoom: true,
  syncNotes: true,
};

function cleanVaultPath(raw: unknown, fallback = ""): string {
  if (typeof raw !== "string") return fallback;
  const t = raw.trim().replace(/\\/g, "/").replace(/^\/+|\/+$/g, "").slice(0, 180);
  if (!t || t.includes("..")) return fallback;
  const allowed =
    t.startsWith("artifacts/") ||
    t === "artifacts" ||
    t.startsWith("attachments/") ||
    t === "attachments" ||
    t.startsWith("public/") ||
    t === "public";
  if (!allowed) return fallback;
  if (t === "public/__grok" || t.startsWith("public/__grok/")) return fallback;
  return t;
}

function cleanWorkspace(raw: unknown, fallback = ""): string {
  if (typeof raw !== "string") return fallback;
  const t = raw.trim().replace(/\\/g, "/").replace(/^\/+|\/+$/g, "").slice(0, 180);
  if (!t || t.includes("..") || t.includes("\0")) return fallback;
  if (t.startsWith("grok:")) {
    const id = t.slice(5).replace(/[^a-z0-9-]/gi, "").slice(0, 60);
    return id ? `grok:${id}` : fallback;
  }
  return cleanVaultPath(t, fallback);
}

export function sanitizeVault(raw: unknown): VaultPrefs {
  const t = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const workspace = cleanWorkspace(t.workspace, DEFAULT_VAULT.workspace);
  let root = workspace.startsWith("grok:") ? "" : cleanVaultPath(t.root, DEFAULT_VAULT.root);
  if (workspace && !workspace.startsWith("grok:")) {
    if (root && root !== workspace && !root.startsWith(`${workspace}/`)) root = "";
  } else if (!workspace) {
    root = "";
  }
  return {
    workspace,
    root,
    createOnRoom: t.createOnRoom !== false,
    syncNotes: t.syncNotes !== false,
  };
}

export type MoodId =
  | "dark"
  | "dust"
  | "warm"
  | "grand"
  | "green"
  | "intimate"
  | "quiet"
  | "wet"
  | "transit";

export type AssistPrefs = {
  intensity: AssistIntensity;
  length: AssistLength;
  nameAnchor: boolean;
  moods: MoodId[];
  fill: AssistFill;
  addMax: number;
  overwrite: AssistOverwrite;
  voice: AssistVoice;
  autoApply: boolean;
  perimeter: AssistPerimeter;
  prompt: string;
};

export const HANDLE_MIN = 8;
export const HANDLE_MAX = 32;
export const HANDLE_DEFAULT = 16;
export const LABEL_MIN = 10;
export const LABEL_MAX = 36;
export const LABEL_DEFAULT = 16;
export const TOOL_BTN_MIN = 28;
export const TOOL_BTN_MAX = 56;
export const TOOL_BTN_DEFAULT = 40;

export const MOOD_OPTIONS: Array<{ id: MoodId; label: string; hint: string }> = [
  { id: "dark", label: "Ombre", hint: "Caves, cryptes" },
  { id: "dust", label: "Poussière", hint: "Greniers, débarras" },
  { id: "warm", label: "Chaleur", hint: "Cuisine, foyer" },
  { id: "grand", label: "Grandeur", hint: "Hall, salon" },
  { id: "green", label: "Vert", hint: "Jardin, cour" },
  { id: "intimate", label: "Intimité", hint: "Chambre, alcôve" },
  { id: "quiet", label: "Silence", hint: "Étude, bibliothèque" },
  { id: "wet", label: "Eau", hint: "Bains, lavoir" },
  { id: "transit", label: "Passage", hint: "Couloir, palier" },
];

export const MOOD_IDS = MOOD_OPTIONS.map((m) => m.id);

export const CHROME_TOGGLES: Array<{
  key: keyof ChromeFlags;
  label: string;
  hint: string;
}> = [
  { key: "showGrid", label: "Grille", hint: "Quadrillage sous le plan" },
  { key: "showCompass", label: "Nord", hint: "Petite boussole en bas à gauche" },
  { key: "showTokens", label: "Pions", hint: "Marqueurs de personnages" },
  { key: "showHints", label: "Conseils", hint: "Légendes sous les onglets et la barre d’outils" },
];

export const DEFAULT_COPY: CopyLabels = {
  appName: "🗺️ MAP",
  floorWord: "Étage",
  roomWord: "Pièce",
  emptyPlan: "Plan vide. Choisissez une forme, puis tracez une pièce.",
  workspaceName: "",
  modeAtelier: "Atelier",
  modePartie: "Partie",
  titles: {},
};

export const DEFAULT_CHROME: MapChrome = {
  showGrid: true,
  showCompass: true,
  showTokens: true,
  showHints: true,
  handleSize: HANDLE_DEFAULT,
  labelSize: LABEL_DEFAULT,
  toolBtnSize: TOOL_BTN_DEFAULT,
  groundPalette: defaultGroundPalette(),
};

export const DEFAULT_ASSIST: AssistPrefs = {
  intensity: "lively",
  length: "medium",
  nameAnchor: true,
  moods: [...MOOD_IDS],
  fill: "assigned",
  addMax: 3,
  overwrite: "draft",
  voice: "sensory",
  autoApply: false,
  perimeter: "place",
  prompt: "",
};

export function sanitizeCopy(raw: unknown): CopyLabels {
  const t = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const str = (key: keyof CopyLabels, fallback: string, allowEmpty = false) => {
    const v = t[key];
    if (typeof v !== "string") return fallback;
    const trimmed = v.trim().slice(0, 120);
    if (!trimmed) return allowEmpty ? "" : fallback;
    return trimmed;
  };
  return {
    appName: str("appName", DEFAULT_COPY.appName),
    floorWord: str("floorWord", DEFAULT_COPY.floorWord),
    roomWord: str("roomWord", DEFAULT_COPY.roomWord),
    emptyPlan: str("emptyPlan", DEFAULT_COPY.emptyPlan),
    workspaceName:
      typeof t.workspaceName === "string"
        ? t.workspaceName.trim().slice(0, 80)
        : DEFAULT_COPY.workspaceName,
    modeAtelier: str("modeAtelier", DEFAULT_COPY.modeAtelier),
    modePartie: str("modePartie", DEFAULT_COPY.modePartie),
    titles: sanitizeTitles(t.titles, t),
  };
}

function sanitizeTitles(raw: unknown, legacy: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  const take = (key: string, value: unknown) => {
    if (typeof value !== "string") return;
    const v = value.trim().slice(0, 80);
    const k = key.trim().slice(0, 40);
    if (k && v) out[k] = v;
  };
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) take(k, v);
  }
  const migrate: Array<[string, string]> = [
    ["panelMode", "mode"],
    ["panelMap", "map"],
    ["panelFloors", "floors"],
    ["panelDossier", "dossier"],
  ];
  for (const [from, to] of migrate) {
    if (!out[to]) take(to, legacy[from]);
  }
  return out;
}

export function sanitizeHandleSize(raw: unknown): number {
  if (raw === "sm") return 10;
  if (raw === "md") return HANDLE_DEFAULT;
  if (raw === "lg") return 24;
  const n = Number(raw);
  if (!Number.isFinite(n)) return HANDLE_DEFAULT;
  return Math.min(HANDLE_MAX, Math.max(HANDLE_MIN, Math.round(n)));
}

export function sanitizeLabelSize(raw: unknown): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return LABEL_DEFAULT;
  return Math.min(LABEL_MAX, Math.max(LABEL_MIN, Math.round(n)));
}

export function sanitizeToolBtnSize(raw: unknown): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return TOOL_BTN_DEFAULT;
  return Math.min(TOOL_BTN_MAX, Math.max(TOOL_BTN_MIN, Math.round(n)));
}

export function handleSizePx(size: unknown): number {
  return sanitizeHandleSize(size);
}

function readFlag(
  t: Record<string, unknown>,
  key: string,
  fallback: boolean,
): boolean {
  if (t[key] === false) return false;
  if (t[key] === true) return true;
  return fallback;
}

function oneOf<T extends string>(raw: unknown, allowed: readonly T[], fallback: T): T {
  return typeof raw === "string" && (allowed as readonly string[]).includes(raw)
    ? (raw as T)
    : fallback;
}

export function sanitizeAssist(raw: unknown): AssistPrefs {
  const t = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const moods = Array.isArray(t.moods)
    ? t.moods.filter((id): id is MoodId => typeof id === "string" && MOOD_IDS.includes(id as MoodId))
    : DEFAULT_ASSIST.moods;
  const addMax = Number(t.addMax);
  return {
    intensity: oneOf(t.intensity, ["sober", "lively", "baroque"] as const, DEFAULT_ASSIST.intensity),
    length: oneOf(t.length, ["short", "medium", "long"] as const, DEFAULT_ASSIST.length),
    nameAnchor: readFlag(t, "nameAnchor", DEFAULT_ASSIST.nameAnchor),
    moods: moods.length ? moods : [...MOOD_IDS],
    fill: oneOf(t.fill, ["description", "assigned", "add"] as const, DEFAULT_ASSIST.fill),
    addMax: Number.isFinite(addMax) ? Math.min(8, Math.max(1, Math.round(addMax))) : DEFAULT_ASSIST.addMax,
    overwrite: oneOf(t.overwrite, ["skip", "draft", "replace"] as const, DEFAULT_ASSIST.overwrite),
    voice: oneOf(t.voice, ["sensory", "sheet", "mix"] as const, DEFAULT_ASSIST.voice),
    autoApply: readFlag(t, "autoApply", DEFAULT_ASSIST.autoApply),
    perimeter: oneOf(t.perimeter, ["place", "floor", "plan"] as const, DEFAULT_ASSIST.perimeter),
    prompt: typeof t.prompt === "string" ? t.prompt.slice(0, 800) : "",
  };
}

export function sanitizeChrome(raw: unknown): MapChrome {
  const t = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return {
    showGrid: readFlag(t, "showGrid", DEFAULT_CHROME.showGrid),
    showCompass: readFlag(t, "showCompass", DEFAULT_CHROME.showCompass),
    showTokens: readFlag(t, "showTokens", DEFAULT_CHROME.showTokens),
    showHints: readFlag(t, "showHints", DEFAULT_CHROME.showHints),
    handleSize: sanitizeHandleSize(t.handleSize),
    labelSize: sanitizeLabelSize(t.labelSize),
    toolBtnSize: sanitizeToolBtnSize(t.toolBtnSize),
    groundPalette: sanitizeGroundPalette(t.groundPalette),
  };
}

const LS_KEY = "atlas-bellarosa-ui";

function readLocal(): {
  copy: CopyLabels;
  chrome: MapChrome;
  assist: AssistPrefs;
  stance: MapStance;
  vault: VaultPrefs;
} | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      copy?: unknown;
      chrome?: unknown;
      assist?: unknown;
      stance?: unknown;
      vault?: unknown;
    };
    return {
      copy: sanitizeCopy(parsed.copy),
      chrome: sanitizeChrome(parsed.chrome),
      assist: sanitizeAssist(parsed.assist),
      stance: parsed.stance === "partie" ? "partie" : "atelier",
      vault: sanitizeVault(parsed.vault),
    };
  } catch {
    return null;
  }
}

function writeLocal(
  copy: CopyLabels,
  chrome: MapChrome,
  assist: AssistPrefs,
  stance: MapStance,
  vault: VaultPrefs,
) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({ copy, chrome, assist, stance, vault }));
  } catch {
    /* quota */
  }
}

export function hasLocalUi(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return Boolean(localStorage.getItem(LS_KEY));
  } catch {
    return false;
  }
}

type UiState = {
  copy: CopyLabels;
  chrome: MapChrome;
  assist: AssistPrefs;
  stance: MapStance;
  vault: VaultPrefs;
  mapFullscreen: boolean;
  setCopy: (patch: Partial<CopyLabels>) => void;
  setChrome: (patch: Partial<MapChrome>) => void;
  setAssist: (patch: Partial<AssistPrefs>) => void;
  setStance: (stance: MapStance) => void;
  setVault: (patch: Partial<VaultPrefs>) => void;
  setFullscreen: (on: boolean) => void;
  replaceUi: (next: {
    copy?: unknown;
    chrome?: unknown;
    assist?: unknown;
    stance?: unknown;
    vault?: unknown;
  }) => void;
  resetUi: () => void;
};

export const useUiStore = create<UiState>((set, get) => ({
  copy: DEFAULT_COPY,
  chrome: DEFAULT_CHROME,
  assist: DEFAULT_ASSIST,
  stance: "atelier",
  vault: DEFAULT_VAULT,
  mapFullscreen: false,
  setCopy: (patch) => {
    const copy = sanitizeCopy({ ...get().copy, ...patch });
    writeLocal(copy, get().chrome, get().assist, get().stance, get().vault);
    set({ copy });
  },
  setChrome: (patch) => {
    const chrome = sanitizeChrome({ ...get().chrome, ...patch });
    writeLocal(get().copy, chrome, get().assist, get().stance, get().vault);
    set({ chrome });
  },
  setAssist: (patch) => {
    const assist = sanitizeAssist({ ...get().assist, ...patch });
    writeLocal(get().copy, get().chrome, assist, get().stance, get().vault);
    set({ assist });
  },
  setStance: (stance) => {
    const next: MapStance = stance === "partie" ? "partie" : "atelier";
    writeLocal(get().copy, get().chrome, get().assist, next, get().vault);
    set({ stance: next });
  },
  setVault: (patch) => {
    const vault = sanitizeVault({ ...get().vault, ...patch });
    writeLocal(get().copy, get().chrome, get().assist, get().stance, vault);
    set({ vault });
  },
  setFullscreen: (mapFullscreen) => set({ mapFullscreen }),
  replaceUi: (next) => {
    const copy = sanitizeCopy(next.copy ?? get().copy);
    const chrome = sanitizeChrome(next.chrome ?? get().chrome);
    const assist = sanitizeAssist(next.assist ?? get().assist);
    const stance: MapStance = next.stance === "partie" ? "partie" : get().stance;
    const vault = sanitizeVault(next.vault ?? get().vault);
    writeLocal(copy, chrome, assist, stance, vault);
    set({ copy, chrome, assist, stance, vault });
  },
  resetUi: () => {
    writeLocal(DEFAULT_COPY, DEFAULT_CHROME, DEFAULT_ASSIST, "atelier", DEFAULT_VAULT);
    set({
      copy: DEFAULT_COPY,
      chrome: DEFAULT_CHROME,
      assist: DEFAULT_ASSIST,
      stance: "atelier",
      vault: DEFAULT_VAULT,
      mapFullscreen: false,
    });
  },
}));

if (import.meta.hot) {
  const prev = import.meta.hot.data.uiBag as
    | {
        copy?: CopyLabels;
        chrome?: MapChrome;
        assist?: AssistPrefs;
        stance?: MapStance;
        vault?: VaultPrefs;
      }
    | undefined;
  if (prev?.copy && prev?.chrome) {
    useUiStore.setState({
      copy: prev.copy,
      chrome: prev.chrome,
      assist: prev.assist ?? DEFAULT_ASSIST,
      stance: prev.stance === "partie" ? "partie" : "atelier",
      vault: prev.vault ? sanitizeVault(prev.vault) : DEFAULT_VAULT,
    });
  }
  import.meta.hot.dispose(() => {
    import.meta.hot!.data.uiBag = {
      copy: useUiStore.getState().copy,
      chrome: useUiStore.getState().chrome,
      assist: useUiStore.getState().assist,
      stance: useUiStore.getState().stance,
      vault: useUiStore.getState().vault,
    };
  });
}

export function hydrateUi(raw?: {
  copy?: unknown;
  chrome?: unknown;
  assist?: unknown;
  vault?: unknown;
}) {
  if (raw && (raw.copy !== undefined || raw.chrome !== undefined || raw.assist !== undefined || raw.vault !== undefined)) {
    useUiStore.getState().replaceUi(raw);
    return;
  }
  const local = readLocal();
  if (local) useUiStore.setState(local);
}
