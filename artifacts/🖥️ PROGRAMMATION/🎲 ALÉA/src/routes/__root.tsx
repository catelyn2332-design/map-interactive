import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { AppHeader } from "@/components/app-header";
import { PersistGate } from "@/components/persist-gate";
import { ThemeRoot } from "@/components/theme-root";
import { Toaster } from "@/components/ui/sonner";
import { THEME_BOOT_SCRIPT } from "@/lib/theme";
import appCss from "../styles.css?url";

const APP_NAME = "Aléa";

const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600&family=Figtree:wght@400;500;600&family=Fraunces:opsz,wght@9..144,500;9..144,600&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Serif:wght@500;600&family=Libre+Baskerville:wght@400;700&family=Newsreader:opsz,wght@6..72,500;6..72,600&family=Source+Sans+3:wght@400;500;600&family=Space+Grotesk:wght@500;600&family=Work+Sans:wght@400;500;600&display=swap";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: APP_NAME },
      {
        name: "description",
        content:
          "Un dé pour des mots inconnus — sujets, styles, noms et sensations, hors des patterns déjà écrits.",
      },
      { name: "theme-color", content: "#0c0c0b" },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "stylesheet", href: appCss },
      { rel: "stylesheet", href: FONT_HREF },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
    ],
    scripts: [{ children: THEME_BOOT_SCRIPT }],
  }),
  component: () => (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
        <HeadContent />
      </head>
      <body suppressHydrationWarning>
        <PreviewHostBridge />
        <AuthProvider>
          <PersistGate />
          <ThemeRoot>
            <AppHeader />
            <Outlet />
          </ThemeRoot>
          <Toaster />
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  ),
});
