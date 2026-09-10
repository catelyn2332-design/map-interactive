import { create } from "zustand";
import {
  applyTheme,
  DEFAULT_THEME,
  ensureThemeFonts,
  isHex,
  mix,
  THEME_STORAGE_KEY,
  themesEqual,
  type Theme,
} from "./theme";

export function sanitizeTheme(raw: unknown): Theme | null {
  if (!raw || typeof raw !== "object") return null;
  const t = raw as Partial<Theme>;
  const background = isHex(t.background ?? "") ? t.background! : "";
  const foreground = isHex(t.foreground ?? "") ? t.foreground! : "";
  if (!background || !foreground) return null;
  const card = isHex(t.card ?? "") ? t.card! : mix(background, foreground, 0.06);
  const secondary = isHex(t.secondary ?? "")
    ? t.secondary!
    : mix(card, foreground, 0.08);
  return {
    background,
    foreground,
    paper: isHex(t.paper ?? "") ? t.paper! : mix(background, foreground, 0.04),
    card,
    primary: isHex(t.primary ?? "") ? t.primary! : DEFAULT_THEME.primary,
    mutedForeground: isHex(t.mutedForeground ?? "")
      ? t.mutedForeground!
      : mix(background, foreground, 0.45),
    clay: isHex(t.clay ?? "") ? t.clay! : DEFAULT_THEME.clay,
    border: isHex(t.border ?? "")
      ? t.border!
      : mix(background, foreground, 0.18),
    secondary,
    field: isHex(t.field ?? "") ? t.field! : mix(card, "#ffffff", 0.32),
    icon: isHex(t.icon ?? "") ? t.icon! : mix(card, foreground, 0.12),
    iconStroke: isHex(t.iconStroke ?? "")
      ? t.iconStroke!
      : isHex(t.mutedForeground ?? "")
        ? t.mutedForeground!
        : mix(foreground, background, 0.15),
    displayFont: t.displayFont || DEFAULT_THEME.displayFont,
    sansFont: t.sansFont || DEFAULT_THEME.sansFont,
    radius:
      typeof t.radius === "number" && t.radius >= 4 && t.radius <= 24
        ? t.radius
        : DEFAULT_THEME.radius,
  };
}

export function loadPersisted(): Theme | null {
  if (typeof window === "undefined") return null;
  const keys = [THEME_STORAGE_KEY, `${THEME_STORAGE_KEY}-backup`];
  for (const key of keys) {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as {
        state?: { theme?: unknown };
        theme?: unknown;
      };
      const candidate =
        parsed.state?.theme ?? parsed.theme ?? (parsed as unknown);
      const theme = sanitizeTheme(candidate);
      if (theme) return theme;
    } catch {
      /* try next key */
    }
  }
  return null;
}

function writePersisted(theme: Theme) {
  if (typeof window === "undefined") return;
  const payload = JSON.stringify({ state: { theme }, version: 0 });
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, payload);
  } catch {
    /* quota */
  }
  try {
    window.localStorage.setItem(`${THEME_STORAGE_KEY}-backup`, payload);
  } catch {
    /* quota */
  }
}

export function persistTheme(theme: Theme) {
  writePersisted(theme);
}

type ThemeState = {
  theme: Theme;
  setTheme: (patch: Partial<Theme>) => void;
  replaceTheme: (theme: Theme) => void;
  resetTheme: () => void;
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: DEFAULT_THEME,
  setTheme: (patch) => {
    const next = sanitizeTheme({ ...get().theme, ...patch });
    if (!next) return;
    applyTheme(next);
    ensureThemeFonts(next);
    set({ theme: next });
    writePersisted(next);
  },
  replaceTheme: (incoming) => {
    const next = sanitizeTheme(incoming);
    if (!next) return;
    applyTheme(next);
    ensureThemeFonts(next);
    set({ theme: next });
    writePersisted(next);
  },
  resetTheme: () => {
    applyTheme(DEFAULT_THEME);
    ensureThemeFonts(DEFAULT_THEME);
    set({ theme: DEFAULT_THEME });
    writePersisted(DEFAULT_THEME);
  },
}));

export function applyPersistedTheme(theme: Theme) {
  const current = useThemeStore.getState().theme;
  if (!themesEqual(current, theme)) {
    useThemeStore.setState({ theme });
  }
  applyTheme(theme);
  ensureThemeFonts(theme);
}

export function hydrateTheme(): Theme | null {
  if (typeof window === "undefined") return null;
  const persisted = loadPersisted();
  if (!persisted) return null;
  applyPersistedTheme(persisted);
  return persisted;
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (
      event.key === THEME_STORAGE_KEY ||
      event.key === `${THEME_STORAGE_KEY}-backup`
    ) {
      hydrateTheme();
    }
  });
}
