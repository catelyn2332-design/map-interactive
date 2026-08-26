import { useLayoutEffect } from "react";
import { loadProgress } from "@/lib/progress";
import { useAleas } from "@/lib/store";
import { applyTheme } from "@/lib/theme";
import { loadPersistedTheme, useThemeStore } from "@/lib/theme-store";

export function PersistGate() {
  useLayoutEffect(() => {
    const progress = loadProgress();
    if (progress) useAleas.getState().applyProgress(progress);
    const saved = loadPersistedTheme();
    if (saved) {
      useThemeStore.setState({ theme: saved.theme, palettes: saved.palettes, hydrated: true });
      applyTheme(saved.theme);
    }
  }, []);
  return null;
}
