import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { ThemeRoot } from "@/components/theme-root";
import { THEME_BOOT_SCRIPT } from "@/lib/theme";
import { Toaster } from "sonner";
import appCssInline from "../styles.css?inline";
import "../styles.css";

const APP_NAME = "Atlas";

const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600&family=Fraunces:opsz,wght@9..144,500;9..144,600&display=swap";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: APP_NAME },
      { name: "theme-color", content: "#3f5344" },
      {
        name: "description",
        content:
          "Atlas — plan bac à sable pour raconter et jouer une maison.",
      },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      { rel: "stylesheet", href: FONT_HREF },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
    ],
  }),
  component: RootDocument,
});

function RootDocument() {
  const inline = typeof appCssInline === "string" ? appCssInline : "";
  return (
    <html lang="fr" className="antialiased" suppressHydrationWarning>
      <head>
        <HeadContent />
        {inline ? (
          <style
            id="atlas-css"
            dangerouslySetInnerHTML={{ __html: inline }}
          />
        ) : null}
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body>
        <PreviewHostBridge />
        <AuthProvider>
          <ThemeRoot>
            <Outlet />
          </ThemeRoot>
        </AuthProvider>
        <Toaster
          position="bottom-center"
          toastOptions={{
            className: "font-sans text-sm",
          }}
        />
        <Scripts />
      </body>
    </html>
  );
}
