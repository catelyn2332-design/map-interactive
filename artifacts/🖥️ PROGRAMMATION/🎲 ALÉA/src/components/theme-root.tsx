import { useLayoutEffect } from "react";
import { applyTheme } from "@/lib/theme";
import { useThemeStore } from "@/lib/theme-store";

export function ThemeRoot({ children }: { children: React.ReactNode }) {
  const theme = useThemeStore((s) => s.theme);

  useLayoutEffect(() => {
    applyTheme(useThemeStore.getState().theme);
  }, [theme]);

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      {children}
    </div>
  );
}
