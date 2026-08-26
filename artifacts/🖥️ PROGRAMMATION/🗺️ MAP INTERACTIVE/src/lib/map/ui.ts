import { create } from "zustand";

export type CopyLabels = {
  appName: string;
  floorWord: string;
  roomWord: string;
  emptyPlan: string;
};

export type ChromeFlags = {
  showGrid: boolean;
  showCompass: boolean;
  showTokens: boolean;
  showHints: boolean;
};

export type MapChrome = ChromeFlags & {
  handleSize: number;
};

export const HANDLE_MIN = 8;
export const HANDLE_MAX = 32;
export const HANDLE_DEFAULT = 16;

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
  appName: "Atlas",
  floorWord: "Étage",
  roomWord: "Pièce",
  emptyPlan: "Plan vide. Choisissez une forme, puis tracez une pièce.",
};

export const DEFAULT_CHROME: MapChrome = {
  showGrid: true,
  showCompass: true,
  showTokens: true,
  showHints: true,
  handleSize: HANDLE_DEFAULT,
};

export function sanitizeCopy(raw: unknown): CopyLabels {
  const t = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const str = (key: keyof CopyLabels, fallback: string) => {
    const v = t[key];
    return typeof v === "string" && v.trim() ? v.trim().slice(0, 120) : fallback;
  };
  return {
    appName: str("appName", DEFAULT_COPY.appName),
    floorWord: str("floorWord", DEFAULT_COPY.floorWord),
    roomWord: str("roomWord", DEFAULT_COPY.roomWord),
    emptyPlan: str("emptyPlan", DEFAULT_COPY.emptyPlan),
  };
}

export function sanitizeHandleSize(raw: unknown): number {
  if (raw === "sm") return 10;
  if (raw === "md") return HANDLE_DEFAULT;
  if (raw === "lg") return 24;
  const n = Number(raw);
  if (!Number.isFinite(n)) return HANDLE_DEFAULT;
  return Math.min(HANDLE_MAX, Math.max(HANDLE_MIN, Math.round(n)));
}

export function handleSizePx(size: unknown): number {
  return sanitizeHandleSize(size);
}

function readFlag(
  t: Record<string, unknown>,
  key: keyof ChromeFlags,
  fallback: boolean,
): boolean {
  if (t[key] === false) return false;
  if (t[key] === true) return true;
  return fallback;
}

export function sanitizeChrome(raw: unknown): MapChrome {
  const t = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return {
    showGrid: readFlag(t, "showGrid", DEFAULT_CHROME.showGrid),
    showCompass: readFlag(t, "showCompass", DEFAULT_CHROME.showCompass),
    showTokens: readFlag(t, "showTokens", DEFAULT_CHROME.showTokens),
    showHints: readFlag(t, "showHints", DEFAULT_CHROME.showHints),
    handleSize: sanitizeHandleSize(t.handleSize),
  };
}

const LS_KEY = "atlas-bellarosa-ui";

function readLocal(): { copy: CopyLabels; chrome: MapChrome } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { copy?: unknown; chrome?: unknown };
    return {
      copy: sanitizeCopy(parsed.copy),
      chrome: sanitizeChrome(parsed.chrome),
    };
  } catch {
    return null;
  }
}

function writeLocal(copy: CopyLabels, chrome: MapChrome) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({ copy, chrome }));
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
  setCopy: (patch: Partial<CopyLabels>) => void;
  setChrome: (patch: Partial<MapChrome>) => void;
  replaceUi: (next: { copy?: unknown; chrome?: unknown }) => void;
  resetUi: () => void;
};

export const useUiStore = create<UiState>((set, get) => ({
  copy: DEFAULT_COPY,
  chrome: DEFAULT_CHROME,
  setCopy: (patch) => {
    const copy = sanitizeCopy({ ...get().copy, ...patch });
    writeLocal(copy, get().chrome);
    set({ copy });
  },
  setChrome: (patch) => {
    const chrome = sanitizeChrome({ ...get().chrome, ...patch });
    writeLocal(get().copy, chrome);
    set({ chrome });
  },
  replaceUi: (next) => {
    const copy = sanitizeCopy(next.copy ?? get().copy);
    const chrome = sanitizeChrome(next.chrome ?? get().chrome);
    writeLocal(copy, chrome);
    set({ copy, chrome });
  },
  resetUi: () => {
    writeLocal(DEFAULT_COPY, DEFAULT_CHROME);
    set({ copy: DEFAULT_COPY, chrome: DEFAULT_CHROME });
  },
}));

export function hydrateUi(raw?: { copy?: unknown; chrome?: unknown }) {
  if (raw && (raw.copy !== undefined || raw.chrome !== undefined)) {
    useUiStore.getState().replaceUi(raw);
    return;
  }
  const local = readLocal();
  if (local) useUiStore.setState(local);
}
