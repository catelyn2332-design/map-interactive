import { Toaster as Sonner } from "sonner";
import { isDarkTheme } from "@/lib/theme";
import { useThemeStore } from "@/lib/theme-store";

export function Toaster() {
  const theme = useThemeStore((s) => s.theme);
  return (
    <Sonner
      theme={isDarkTheme(theme) ? "dark" : "light"}
      position="bottom-center"
      toastOptions={{
        className:
          "bg-card text-foreground border border-border font-sans text-sm",
      }}
    />
  );
}
