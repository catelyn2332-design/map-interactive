import { useLayoutEffect, useRef } from "react";
import { ButtonTips } from "@/components/atlas/button-tips";
import { applyTheme, ensureThemeFonts } from "@/lib/theme";
import { hydrateTheme, useThemeStore } from "@/lib/theme-store";
import { hydratePrefs, startCloudAutosave } from "@/lib/map/prefs";
import { hydrateSaves, startAutosave } from "@/lib/map/saves";
import { startSessionPersist } from "@/lib/map/session-persist";
import { ensureRoomSelected, hydrateAtlas } from "@/lib/map/store";
import { hydrateUi } from "@/lib/map/ui";

export function ThemeRoot({ children }: { children: React.ReactNode }) {
  const theme = useThemeStore((s) => s.theme);
  const skipFirst = useRef(true);

  useLayoutEffect(() => {
    startSessionPersist();
    hydrateTheme();
    hydrateUi();
    hydrateAtlas();
    const current = useThemeStore.getState().theme;
    applyTheme(current);
    ensureThemeFonts(current);
    void hydratePrefs().then(() => {
      void hydrateSaves();
      startAutosave();
      startCloudAutosave();
      ensureRoomSelected();
      const next = useThemeStore.getState().theme;
      applyTheme(next);
      ensureThemeFonts(next);
    });
  }, []);

  useLayoutEffect(() => {
    if (skipFirst.current) {
      skipFirst.current = false;
      return;
    }
    applyTheme(theme);
    ensureThemeFonts(theme);
  }, [theme]);

  return (
    <>
      {children}
      <ButtonTips />
    </>
  );
}
