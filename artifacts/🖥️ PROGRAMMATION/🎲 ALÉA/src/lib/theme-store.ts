import { create } from "zustand";
import { applyTheme, DEFAULT_THEME, isHex, type SavedPalette, type Theme } from "./theme";

const STORAGE_KEY = "alea-theme";

function sanitizeTheme(raw: unknown): Theme | null {
  if (!raw || typeof raw !== "object") return null;
  const t = raw as Partial<Theme>;
  if (!isHex(t.background ?? "") || !isHex(t.foreground ?? "") || !isHex(t.card ?? "") || !isHex(t.primary ?? "")) {
    return null;
  }
  return {
    background: t.background!,
    foreground: t.foreground!,
    card: t.card!,
    primary: t.primary!,
    mutedForeground: isHex(t.mutedForeground ?? "") ? t.mutedForeground! : DEFAULT_THEME.mutedForeground,
    displayFont: t.displayFont || DEFAULT_THEME.displayFont,
    sansFont: t.sansFont || DEFAULT_THEME.sansFont,
  };
}

export function loadPersistedTheme(): { theme: Theme; palettes: SavedPalette[] } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state?: { theme?: unknown; palettes?: SavedPalette[] }; theme?: unknown };
    const theme = sanitizeTheme(parsed.state?.theme ?? parsed.theme);
    if (!theme) return null;
    const palettes = Array.isArray(parsed.state?.palettes) ? parsed.state.palettes : [];
    return { theme, palettes };
  } catch {
    return null;
  }
}

function writePersisted(theme: Theme, palettes: SavedPalette[]) {
  if (typeof window === "undefined") return;
  if (!sanitizeTheme(theme)) return;
  const payload = JSON.stringify({ state: { theme, palettes }, version: 0 });
  window.localStorage.setItem(STORAGE_KEY, payload);
  const maxAge = 60 * 60 * 24 * 400;
  document.cookie = `alea-t=${encodeURIComponent(JSON.stringify(theme))}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

const loaded = loadPersistedTheme();

type ThemeState = {
  theme: Theme;
  palettes: SavedPalette[];
  hydrated: boolean;
  setTheme: (patch: Partial<Theme>) => void;
  replaceTheme: (theme: Theme) => void;
  savePalette: (name: string) => void;
  applyPalette: (id: string) => void;
  removePalette: (id: string) => void;
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: loaded?.theme ?? DEFAULT_THEME,
  palettes: loaded?.palettes ?? [],
  hydrated: loaded !== null || typeof window !== "undefined",
  setTheme: (patch) => {
    const merged = { ...get().theme, ...patch };
    const theme = sanitizeTheme(merged);
    if (!theme) return;
    applyTheme(theme);
    set({ theme });
    writePersisted(theme, get().palettes);
  },
  replaceTheme: (next) => {
    const theme = sanitizeTheme(next);
    if (!theme) return;
    applyTheme(theme);
    set({ theme });
    writePersisted(theme, get().palettes);
  },
  savePalette: (name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const palette: SavedPalette = {
      id: `${Date.now().toString(16)}`,
      name: trimmed,
      theme: { ...get().theme },
    };
    const palettes = [palette, ...get().palettes].slice(0, 24);
    set({ palettes });
    writePersisted(get().theme, palettes);
  },
  applyPalette: (id) => {
    const found = get().palettes.find((p) => p.id === id);
    if (!found) return;
    get().replaceTheme(found.theme);
  },
  removePalette: (id) => {
    const palettes = get().palettes.filter((p) => p.id !== id);
    set({ palettes });
    writePersisted(get().theme, palettes);
  },
}));

if (typeof window !== "undefined" && loaded) {
  applyTheme(loaded.theme);
}
