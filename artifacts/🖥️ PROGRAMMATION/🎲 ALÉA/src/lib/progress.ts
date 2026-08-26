import type {
  CustomKeyword,
  CustomSubtype,
  CustomType,
  Idea,
  KeywordSort,
  PatternId,
} from "./types";
import type { SavedPalette, Theme } from "./theme";

export const PROGRESS_KEY = "alea-inconnu";
export const PROGRESS_FILE_TYPE = "alea-progress";

export type ProgressSnapshot = {
  patterns: PatternId[];
  subtypeFilters: string[];
  count: number;
  batch: 1 | 3;
  element: string;
  ideas: Idea[];
  archive: Idea[];
  customKeywords: CustomKeyword[];
  subtypes: CustomSubtype[];
  customTypes: CustomType[];
  hiddenTypes: string[];
  useCustom: boolean;
  exclusiveCustom: boolean;
  keywordSort: KeywordSort;
};

export type ProgressFile = {
  type: typeof PROGRESS_FILE_TYPE;
  version: number;
  savedAt: string;
  progress: ProgressSnapshot;
  theme?: { theme: Theme; palettes: SavedPalette[] };
};

export const EMPTY_PROGRESS: ProgressSnapshot = {
  patterns: [],
  subtypeFilters: [],
  count: 5,
  batch: 1,
  element: "",
  ideas: [],
  archive: [],
  customKeywords: [],
  subtypes: [],
  customTypes: [],
  hiddenTypes: [],
  useCustom: true,
  exclusiveCustom: false,
  keywordSort: "recent",
};

function asArray<T>(value: unknown, fallback: T[]): T[] {
  return Array.isArray(value) ? (value as T[]) : fallback;
}

export function normalizeProgress(raw: unknown): ProgressSnapshot | null {
  if (!raw || typeof raw !== "object") return null;
  const p = raw as Partial<ProgressSnapshot>;
  return {
    ...EMPTY_PROGRESS,
    patterns: asArray(p.patterns, []),
    subtypeFilters: asArray(p.subtypeFilters, []),
    count: typeof p.count === "number" ? p.count : 5,
    batch: p.batch === 3 ? 3 : 1,
    element: typeof p.element === "string" ? p.element : "",
    ideas: asArray(p.ideas, []),
    archive: asArray(p.archive, []),
    customKeywords: asArray<CustomKeyword>(p.customKeywords, []).map((k) => ({
      ...k,
      subtypeId: k.subtypeId ?? null,
      active: k.active !== false,
    })),
    subtypes: asArray(p.subtypes, []),
    customTypes: asArray(p.customTypes, []),
    hiddenTypes: asArray(p.hiddenTypes, []),
    useCustom: p.useCustom !== false,
    exclusiveCustom: Boolean(p.exclusiveCustom),
    keywordSort: p.keywordSort ?? "recent",
  };
}

export function loadProgress(): ProgressSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PROGRESS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state?: unknown } | ProgressSnapshot;
    return normalizeProgress(
      parsed && typeof parsed === "object" && "state" in parsed
        ? parsed.state
        : parsed,
    );
  } catch {
    return null;
  }
}

export function saveProgress(snapshot: ProgressSnapshot) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      PROGRESS_KEY,
      JSON.stringify({ state: snapshot, version: 1 }),
    );
  } catch {
    /* quota */
  }
}

export function buildProgressFile(
  progress: ProgressSnapshot,
  theme?: { theme: Theme; palettes: SavedPalette[] },
): ProgressFile {
  return {
    type: PROGRESS_FILE_TYPE,
    version: 1,
    savedAt: new Date().toISOString(),
    progress,
    theme,
  };
}

export function parseProgressFile(raw: string): ProgressFile | null {
  try {
    const parsed = JSON.parse(raw) as ProgressFile & { state?: unknown };
    if (parsed?.type === PROGRESS_FILE_TYPE && parsed.progress) {
      const progress = normalizeProgress(parsed.progress);
      if (!progress) return null;
      return { ...parsed, type: PROGRESS_FILE_TYPE, progress };
    }
    const nested = normalizeProgress(parsed.state ?? parsed);
    if (!nested) return null;
    return {
      type: PROGRESS_FILE_TYPE,
      version: 1,
      savedAt: new Date().toISOString(),
      progress: nested,
    };
  } catch {
    return null;
  }
}

export function downloadProgressFile(file: ProgressFile) {
  const blob = new Blob([JSON.stringify(file, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const day = file.savedAt.slice(0, 10);
  a.href = url;
  a.download = `alea-progression-${day}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
