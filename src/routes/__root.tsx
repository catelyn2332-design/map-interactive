import { createRootRoute, HeadContent, Outlet } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { ThemeRoot } from "@/components/theme-root";
import { THEME_BOOT_SCRIPT } from "@/lib/theme";
import { SESSION_BOOT_SCRIPT } from "@/lib/map/session-persist";
import { Toaster } from "sonner";
import appCssInline from "../styles.css?inline";

const APP_NAME = "Atlas";

const PROCESS_BOOT =
  "if(typeof process==='undefined'){var p={env:{NODE_ENV:'development',TSS_ROUTER_BASEPATH:'/'}};try{window.process=p;}catch(e){}}" +
  "document.addEventListener('click',function(ev){if(window.__ATLAS_LIVE)return;var t=ev.target;if(!t||!t.closest)return;var a=t.closest('a[href]');if(a&&a.getAttribute('href')&&a.getAttribute('href').charAt(0)==='/'){return;}var b=t.closest('[data-atlas-floor]');if(!b)return;ev.preventDefault();ev.stopPropagation();if(ev.stopImmediatePropagation)ev.stopImmediatePropagation();var href=b.getAttribute('data-href');if(href)location.assign(href);},true);";

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
      // Fetch the hydration chain in parallel — the preview proxy otherwise
      // stalls after StartClient.js and the UI stays frozen on SSR HTML.
      ...[
        "/node_modules/@tanstack/react-start-client/dist/esm/hydrateStart.js",
        "/node_modules/@tanstack/react-start-client/dist/esm/StartClient.js",
        "/node_modules/@tanstack/start-client-core/dist/esm/client/index.js",
        "/node_modules/@tanstack/start-client-core/dist/esm/client/hydrateStart.js",
        "/node_modules/@tanstack/start-client-core/dist/esm/client/ServerFunctionSerializationAdapter.js",
        "/node_modules/@tanstack/start-client-core/dist/esm/empty-plugin-adapters.js",
        "/node_modules/@tanstack/react-start/dist/plugin/default-entry/start.ts",
        "/node_modules/.vite/deps/@tanstack_react-router.js",
        "/node_modules/.vite/deps/@tanstack_router-core_ssr_client.js",
        "/node_modules/.vite/deps/react_jsx-runtime.js",
        "/@vite/client",
        "/src/router.tsx",
        "/src/routeTree.gen.ts",
        "/src/routes/__root.tsx",
        "/src/routes/index.tsx",
        "/src/components/atlas/atlas-app.tsx",
        "/src/components/theme-root.tsx",
      ].map((href) => ({ rel: "modulepreload" as const, href })),
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
        <script dangerouslySetInnerHTML={{ __html: PROCESS_BOOT }} />
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: SESSION_BOOT_SCRIPT }} />
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
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){function boot(){if(window.__ATLAS_SCRIPTS)return;window.__ATLAS_SCRIPTS=1;var s=document.createElement('script');s.type='module';s.async=true;s.src='/@id/virtual:tanstack-start-dev-client-entry';document.body.appendChild(s);}if('requestIdleCallback' in window)requestIdleCallback(boot,{timeout:1800});else setTimeout(boot,400);})();",
          }}
        />
      </body>
    </html>
  );
}
