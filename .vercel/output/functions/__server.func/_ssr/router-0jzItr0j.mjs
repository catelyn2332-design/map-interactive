import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { f as createRouter, g as createRootRoute, h as createFileRoute, l as Scripts, m as lazyRouteComponent, p as Outlet, u as HeadContent, y as useRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { a as getServerFnById, i as TSS_SERVER_FUNCTION, r as createServerFn, s as __exportAll } from "./ssr.mjs";
import { L as string, N as number, P as object, R as union, j as literal } from "../_libs/@better-auth/core+[...].mjs";
import { t as authMiddleware } from "./middleware-LXT0xpiK.mjs";
import { n as auth } from "./server-DuSMeD84.mjs";
import { o as TriangleAlert } from "../_libs/lucide-react.mjs";
import { n as persist, r as create, t as createJSONStorage } from "../_libs/zustand.mjs";
import { t as Toaster } from "../_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/router-0jzItr0j.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function AppErrorComponent({ error }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "flex min-h-dvh flex-col items-center justify-center gap-4 bg-background px-6 text-center text-foreground",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-clay",
				"aria-hidden": "true",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, {
					className: "size-10",
					strokeWidth: 2
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-lg font-medium tracking-[-0.02em]",
				children: "Un problème est survenu"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "max-w-md text-sm break-words text-muted-foreground",
				children: error.message || "Erreur inattendue. Rechargez la page."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "inline-flex h-11 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground",
				onClick: () => window.location.reload(),
				children: "Recharger"
			})
		]
	});
}
/**
* App-wide client provider mounted once near the root (in `src/routes/__root.tsx`):
*
*   <AuthProvider><Outlet /></AuthProvider>
*
* Better Auth's React client (`@/lib/auth/client`) needs NO context provider —
* its `useSession()` works standalone — so this is a passthrough today. It's
* kept as the single, stable mount point for any future client-side providers
* (e.g. a toast or theme provider) without churning the root shell.
*/
function AuthProvider({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children });
}
function isGrokEmbedderOrigin(origin) {
	try {
		const url = new URL(origin);
		if (url.protocol !== "https:" && url.protocol !== "http:") return false;
		const host = url.hostname.toLowerCase();
		if (host === "grok.com" || host.endsWith(".grok.com")) return true;
		if (host === "localhost" || host === "127.0.0.1" || host === "[::1]") return true;
		return false;
	} catch {
		return false;
	}
}
function isSandboxPreviewGuestHost(hostname) {
	const host = hostname.toLowerCase();
	return host === "grok-sandbox.com" || host.endsWith(".grok-sandbox.com");
}
function isRemintPreviewPair(guestHost, parentHost) {
	const guest = guestHost.toLowerCase();
	const parent = parentHost.toLowerCase();
	const i = guest.indexOf(".preview.");
	if (i <= 0) return false;
	const label = guest.slice(0, i);
	const rest = guest.slice(i + 9);
	if (label.includes(".") || !rest.includes(".")) return false;
	return parent === rest || parent === `grok.${rest}`;
}
function resolveParentEmbedderOrigin(parentIsSelf, referrer, ancestorOrigin, guestHostname = "") {
	if (parentIsSelf) return null;
	for (const candidate of [referrer, ancestorOrigin ?? ""].filter(Boolean)) try {
		const url = new URL(candidate.includes("://") ? candidate : `https://${candidate}`);
		if (url.protocol !== "https:" && url.protocol !== "http:") continue;
		if (isGrokEmbedderOrigin(url.origin)) return url.origin;
		if (isSandboxPreviewGuestHost(guestHostname) || isRemintPreviewPair(guestHostname, url.hostname)) return url.origin;
	} catch {}
	return null;
}
/**
* Guest side of the grok-web ↔ sandbox preview postMessage bridge.
*
* Activates only when this page is framed by an allowlisted Grok embedder.
* Top-level runs (download/export, local `npm run dev`, deployed sites) noop.
*/
var PREVIEW_BRIDGE_CHANNEL = "grok-preview-bridge";
var EnvelopeSchema = object({
	channel: literal(PREVIEW_BRIDGE_CHANNEL),
	version: number().int().positive(),
	type: string().min(1)
});
var HelloSchema = EnvelopeSchema.extend({ type: literal("hello") });
var NavigateSchema = EnvelopeSchema.extend({
	type: literal("navigate"),
	path: string().min(1)
});
var HistorySchema = EnvelopeSchema.extend({
	type: literal("history"),
	delta: union([literal(-1), literal(1)])
});
function isSafeBridgePath(path) {
	if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return false;
	try {
		return new URL(path, "https://preview.invalid").origin === "https://preview.invalid";
	} catch {
		return false;
	}
}
/**
* Install host↔guest messaging. Returns a dispose function.
* Noops (returns a no-op dispose) when not embedded under a Grok parent.
*/
function installPreviewHostBridge(options = {}) {
	if (typeof window === "undefined") return () => {};
	const ancestorOrigin = typeof location.ancestorOrigins !== "undefined" && location.ancestorOrigins.length > 0 ? location.ancestorOrigins[0] : null;
	const parentOrigin = resolveParentEmbedderOrigin(window.parent === window, document.referrer, ancestorOrigin, window.location.hostname);
	if (parentOrigin === null) return () => {};
	const ROOT_STATE_KEY = "__grokPreviewBridgeRoot";
	const originalPushState = window.history.pushState.bind(window.history);
	const originalReplaceState = window.history.replaceState.bind(window.history);
	const isAtHistoryRoot = () => {
		const state = window.history.state;
		return Boolean(state && typeof state === "object" && state[ROOT_STATE_KEY] === true);
	};
	try {
		const current = window.history.state;
		if (!(current !== null && typeof current === "object" && Object.prototype.hasOwnProperty.call(current, ROOT_STATE_KEY))) {
			const isRoot = window.history.length <= 1;
			originalReplaceState(current && typeof current === "object" ? {
				...current,
				[ROOT_STATE_KEY]: isRoot
			} : { [ROOT_STATE_KEY]: isRoot }, "", window.location.href);
		}
	} catch {}
	const post = (message) => {
		window.parent.postMessage(message, parentOrigin);
	};
	const reportLocation = () => {
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "location",
			path: window.location.pathname || "/",
			search: window.location.search,
			hash: window.location.hash
		});
	};
	const reportRoutes = () => {
		const paths = options.getRoutePaths?.() ?? [];
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "routes",
			paths
		});
	};
	const defaultNavigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		try {
			const url = new URL(path, window.location.origin);
			if (url.origin !== window.location.origin) return;
			const next = `${url.pathname}${url.search}${url.hash}`;
			window.history.pushState(window.history.state, "", next);
			window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }));
		} catch {}
	};
	const navigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		if (options.navigate) {
			options.navigate(path);
			return;
		}
		defaultNavigate(path);
	};
	const announce = () => {
		reportLocation();
		reportRoutes();
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "ready"
		});
	};
	const onMessage = (event) => {
		if (event.source !== window.parent) return;
		if (event.origin !== parentOrigin) return;
		const envelope = EnvelopeSchema.safeParse(event.data);
		if (!envelope.success || envelope.data.version !== 1) return;
		if (envelope.data.type === "hello") {
			if (!HelloSchema.safeParse(event.data).success) return;
			announce();
			return;
		}
		if (envelope.data.type === "navigate") {
			const parsed = NavigateSchema.safeParse(event.data);
			if (!parsed.success) return;
			navigate(parsed.data.path);
			queueMicrotask(reportLocation);
			return;
		}
		if (envelope.data.type === "history") {
			const parsed = HistorySchema.safeParse(event.data);
			if (!parsed.success) return;
			if (parsed.data.delta === -1 && isAtHistoryRoot()) return;
			window.history.go(parsed.data.delta);
		}
	};
	const onPopState = () => {
		reportLocation();
	};
	const onHashChange = () => {
		reportLocation();
	};
	window.history.pushState = (data, unused, url) => {
		const next = data && typeof data === "object" ? {
			...data,
			[ROOT_STATE_KEY]: false
		} : data;
		originalPushState(next, unused, url);
		reportLocation();
	};
	window.history.replaceState = (data, unused, url) => {
		const next = isAtHistoryRoot() ? {
			...data && typeof data === "object" ? data : {},
			[ROOT_STATE_KEY]: true
		} : data;
		originalReplaceState(next, unused, url);
		reportLocation();
	};
	window.addEventListener("message", onMessage);
	window.addEventListener("popstate", onPopState);
	window.addEventListener("hashchange", onHashChange);
	announce();
	return () => {
		window.removeEventListener("message", onMessage);
		window.removeEventListener("popstate", onPopState);
		window.removeEventListener("hashchange", onHashChange);
		window.history.pushState = originalPushState;
		window.history.replaceState = originalReplaceState;
	};
}
/** Collect static path patterns from a TanStack route tree (best-effort). */
function collectRoutePathsFromTree(routeTree) {
	const paths = /* @__PURE__ */ new Set();
	const walk = (node) => {
		if (!node || typeof node !== "object") return;
		const record = node;
		const full = typeof record.fullPath === "string" ? record.fullPath : typeof record.path === "string" ? record.path : null;
		if (full !== null && full !== "") paths.add(full.startsWith("/") ? full : `/${full}`);
		else if (full === "") paths.add("/");
		const children = record.children;
		if (Array.isArray(children)) for (const child of children) walk(child);
		else if (children && typeof children === "object") for (const child of Object.values(children)) walk(child);
	};
	walk(routeTree);
	return [...paths];
}
/**
* Mount once in `__root.tsx` so the Grok preview chrome can drive navigation
* (and later receive registered routes). Noops when the app is not embedded.
*/
function PreviewHostBridge() {
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		return installPreviewHostBridge({
			navigate: (path) => {
				router.history.push(path);
			},
			getRoutePaths: () => collectRoutePathsFromTree(router.routeTree)
		});
	}, [router]);
	return null;
}
var FONT_CSS = {
	Fraunces: "Fraunces:opsz,wght@9..144,500;9..144,600",
	Newsreader: "Newsreader:opsz,wght@6..72,500;6..72,600",
	"Libre Baskerville": "Libre+Baskerville:wght@400;700",
	Spectral: "Spectral:wght@400;600",
	Figtree: "Figtree:wght@400;500;600",
	"Source Sans 3": "Source+Sans+3:wght@400;500;600",
	"Work Sans": "Work+Sans:wght@400;500;600",
	Karla: "Karla:wght@400;500;600"
};
function extraFontsHref(theme) {
	const names = [theme.displayFont, theme.sansFont].filter((n) => n && n !== "Figtree" && n !== "Fraunces");
	const unique = [...new Set(names)];
	if (!unique.length) return null;
	return `https://fonts.googleapis.com/css2?${unique.map((n) => `family=${FONT_CSS[n] ?? encodeURIComponent(n)}`).join("&")}&display=swap`;
}
function ensureThemeFonts(theme) {
	if (typeof document === "undefined") return;
	const href = extraFontsHref(theme);
	const id = "atlas-extra-fonts";
	const existing = document.getElementById(id);
	if (!href) {
		existing?.remove();
		return;
	}
	if (existing instanceof HTMLLinkElement) {
		if (existing.getAttribute("href") !== href) existing.href = href;
		return;
	}
	const link = document.createElement("link");
	link.id = id;
	link.rel = "stylesheet";
	link.href = href;
	document.head.appendChild(link);
}
var FONT_OPTIONS = [
	{
		id: "Fraunces",
		stack: "\"Fraunces\", ui-serif, Georgia, serif",
		kind: "display"
	},
	{
		id: "Newsreader",
		stack: "\"Newsreader\", ui-serif, Georgia, serif",
		kind: "display"
	},
	{
		id: "Libre Baskerville",
		stack: "\"Libre Baskerville\", ui-serif, Georgia, serif",
		kind: "display"
	},
	{
		id: "Spectral",
		stack: "\"Spectral\", ui-serif, Georgia, serif",
		kind: "display"
	},
	{
		id: "Figtree",
		stack: "\"Figtree\", ui-sans-serif, system-ui, sans-serif",
		kind: "sans"
	},
	{
		id: "Source Sans 3",
		stack: "\"Source Sans 3\", ui-sans-serif, system-ui, sans-serif",
		kind: "sans"
	},
	{
		id: "Work Sans",
		stack: "\"Work Sans\", ui-sans-serif, system-ui, sans-serif",
		kind: "sans"
	},
	{
		id: "Karla",
		stack: "\"Karla\", ui-sans-serif, system-ui, sans-serif",
		kind: "sans"
	}
];
var DEFAULT_THEME = {
	background: "#efe8d8",
	foreground: "#1f1c17",
	paper: "#f3eee4",
	card: "#f7f1e6",
	primary: "#3f5344",
	mutedForeground: "#6b6458",
	clay: "#8f3d32",
	border: "#d5ccbb",
	secondary: "#e4dccb",
	displayFont: "Fraunces",
	sansFont: "Figtree",
	radius: 12
};
function isHex(value) {
	return /^#[0-9a-fA-F]{6}$/.test(value);
}
function hexToRgb(hex) {
	const n = hex.replace("#", "");
	return {
		r: parseInt(n.slice(0, 2), 16),
		g: parseInt(n.slice(2, 4), 16),
		b: parseInt(n.slice(4, 6), 16)
	};
}
function rgbToHex(r, g, b) {
	const to = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
	return `#${to(r)}${to(g)}${to(b)}`;
}
function mix(a, b, t) {
	const A = hexToRgb(a);
	const B = hexToRgb(b);
	return rgbToHex(A.r + (B.r - A.r) * t, A.g + (B.g - A.g) * t, A.b + (B.b - A.b) * t);
}
function luminance(hex) {
	const { r, g, b } = hexToRgb(hex);
	const lin = [
		r,
		g,
		b
	].map((v) => {
		const s = v / 255;
		return s <= .03928 ? s / 12.92 : ((s + .055) / 1.055) ** 2.4;
	});
	return .2126 * lin[0] + .7152 * lin[1] + .0722 * lin[2];
}
function contrastInk(hex) {
	return luminance(hex) > .45 ? "#1f1c17" : "#f3eee4";
}
function isDarkTheme(theme) {
	return luminance(theme.background) < .45;
}
function fontStack(name, fallback) {
	const found = FONT_OPTIONS.find((f) => f.id === name);
	if (found) return found.stack;
	return fallback === "display" ? "ui-serif, Georgia, serif" : "ui-sans-serif, system-ui, sans-serif";
}
function themesEqual(a, b) {
	return Object.keys(DEFAULT_THEME).every((key) => a[key] === b[key]);
}
function themeCssVars(theme) {
	const bg = theme.background;
	const fg = theme.foreground;
	const r = theme.radius;
	return {
		"--color-background": bg,
		"--color-foreground": fg,
		"--color-paper": theme.paper,
		"--color-card": theme.card,
		"--color-card-foreground": fg,
		"--color-muted": mix(bg, fg, .08),
		"--color-muted-foreground": theme.mutedForeground,
		"--color-primary": theme.primary,
		"--color-primary-foreground": contrastInk(theme.primary),
		"--color-secondary": theme.secondary,
		"--color-secondary-foreground": fg,
		"--color-accent": mix(theme.card, theme.primary, .16),
		"--color-accent-foreground": fg,
		"--color-border": theme.border,
		"--color-input": theme.border,
		"--color-ring": theme.primary,
		"--color-destructive": theme.clay,
		"--color-destructive-foreground": contrastInk(theme.clay),
		"--color-ink": fg,
		"--color-stone": mix(theme.paper, fg, .28),
		"--color-clay": theme.clay,
		"--color-token-stella": mix(fg, theme.paper, .35),
		"--color-token-antoine": mix(theme.primary, fg, .35),
		"--color-token-myriam": theme.primary,
		"--font-sans": fontStack(theme.sansFont, "sans"),
		"--font-display": fontStack(theme.displayFont, "display"),
		"--radius": `${r}px`,
		"--radius-sm": `${Math.max(4, r - 4)}px`,
		"--radius-md": `${r}px`,
		"--radius-lg": `${r + 4}px`,
		"--radius-xl": `${r + 12}px`
	};
}
function applyTheme(theme) {
	if (typeof document === "undefined") return;
	if (!isHex(theme.background) || !isHex(theme.foreground)) return;
	const root = document.documentElement;
	const vars = themeCssVars(theme);
	for (const [key, value] of Object.entries(vars)) root.style.setProperty(key, value);
	root.style.backgroundColor = theme.background;
	root.style.colorScheme = isDarkTheme(theme) ? "dark" : "light";
	const meta = document.querySelector("meta[name=\"theme-color\"]");
	if (meta) meta.setAttribute("content", theme.background);
}
var THEME_STORAGE_KEY = "atlas-bellarosa-theme";
var THEME_BOOT_SCRIPT = `(function(){try{function read(k){try{var raw=localStorage.getItem(k);if(!raw)return null;var parsed=JSON.parse(raw);var t=(parsed&&parsed.state&&parsed.state.theme)||(parsed&&parsed.theme)||parsed;if(t&&typeof t==="object"&&t.background&&t.foreground)return t;return null;}catch(err){return null;}}var t=read("${THEME_STORAGE_KEY}")||read("${THEME_STORAGE_KEY}-backup");if(!t)return;function hexToRgb(h){h=String(h).replace("#","");return{r:parseInt(h.slice(0,2),16),g:parseInt(h.slice(2,4),16),b:parseInt(h.slice(4,6),16)};}function rgbToHex(r,g,b){function to(v){return Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,"0");}return"#"+to(r)+to(g)+to(b);}function mix(a,b,p){var A=hexToRgb(a),B=hexToRgb(b);return rgbToHex(A.r+(B.r-A.r)*p,A.g+(B.g-A.g)*p,A.b+(B.b-A.b)*p);}function lum(h){var c=hexToRgb(h),l=[c.r,c.g,c.b].map(function(v){v=v/255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4);});return 0.2126*l[0]+0.7152*l[1]+0.0722*l[2];}var fonts={"Fraunces":'"Fraunces", ui-serif, Georgia, serif',"Newsreader":'"Newsreader", ui-serif, Georgia, serif',"Libre Baskerville":'"Libre Baskerville", ui-serif, Georgia, serif',"Spectral":'"Spectral", ui-serif, Georgia, serif',"Figtree":'"Figtree", ui-sans-serif, system-ui, sans-serif',"Source Sans 3":'"Source Sans 3", ui-sans-serif, system-ui, sans-serif',"Work Sans":'"Work Sans", ui-sans-serif, system-ui, sans-serif',"Karla":'"Karla", ui-sans-serif, system-ui, sans-serif'};var bg=t.background,fg=t.foreground,r=document.documentElement,rad=typeof t.radius==="number"?t.radius:12;r.style.setProperty("--color-background",bg);r.style.setProperty("--color-foreground",fg);r.style.setProperty("--color-paper",t.paper||mix(bg,fg,0.04));r.style.setProperty("--color-card",t.card||mix(bg,fg,0.06));r.style.setProperty("--color-card-foreground",fg);r.style.setProperty("--color-muted",mix(bg,fg,0.08));r.style.setProperty("--color-muted-foreground",t.mutedForeground||mix(bg,fg,0.45));r.style.setProperty("--color-primary",t.primary||fg);r.style.setProperty("--color-primary-foreground",lum(t.primary||fg)>0.45?"#1f1c17":"#f3eee4");r.style.setProperty("--color-secondary",t.secondary||mix(t.card||bg,fg,0.08));r.style.setProperty("--color-secondary-foreground",fg);r.style.setProperty("--color-accent",mix(t.card||bg,t.primary||fg,0.16));r.style.setProperty("--color-accent-foreground",fg);r.style.setProperty("--color-border",t.border||mix(bg,fg,0.18));r.style.setProperty("--color-input",t.border||mix(bg,fg,0.18));r.style.setProperty("--color-ring",t.primary||fg);r.style.setProperty("--color-destructive",t.clay||"#8f3d32");r.style.setProperty("--color-ink",fg);r.style.setProperty("--color-clay",t.clay||"#8f3d32");r.style.setProperty("--color-stone",mix(t.paper||bg,fg,0.28));if(t.sansFont&&fonts[t.sansFont])r.style.setProperty("--font-sans",fonts[t.sansFont]);if(t.displayFont&&fonts[t.displayFont])r.style.setProperty("--font-display",fonts[t.displayFont]);r.style.setProperty("--radius",rad+"px");r.style.setProperty("--radius-sm",Math.max(4,rad-4)+"px");r.style.setProperty("--radius-md",rad+"px");r.style.setProperty("--radius-lg",(rad+4)+"px");r.style.setProperty("--radius-xl",(rad+12)+"px");r.style.backgroundColor=bg;r.style.colorScheme=lum(bg)<0.45?"dark":"light";var meta=document.querySelector('meta[name="theme-color"]');if(meta)meta.setAttribute("content",bg);}catch(e){}})();`;
function sanitizeTheme(raw) {
	if (!raw || typeof raw !== "object") return null;
	const t = raw;
	const background = isHex(t.background ?? "") ? t.background : "";
	const foreground = isHex(t.foreground ?? "") ? t.foreground : "";
	if (!background || !foreground) return null;
	const card = isHex(t.card ?? "") ? t.card : mix(background, foreground, .06);
	return {
		background,
		foreground,
		paper: isHex(t.paper ?? "") ? t.paper : mix(background, foreground, .04),
		card,
		primary: isHex(t.primary ?? "") ? t.primary : DEFAULT_THEME.primary,
		mutedForeground: isHex(t.mutedForeground ?? "") ? t.mutedForeground : mix(background, foreground, .45),
		clay: isHex(t.clay ?? "") ? t.clay : DEFAULT_THEME.clay,
		border: isHex(t.border ?? "") ? t.border : mix(background, foreground, .18),
		secondary: isHex(t.secondary ?? "") ? t.secondary : mix(card, foreground, .08),
		displayFont: t.displayFont || DEFAULT_THEME.displayFont,
		sansFont: t.sansFont || DEFAULT_THEME.sansFont,
		radius: typeof t.radius === "number" && t.radius >= 4 && t.radius <= 24 ? t.radius : DEFAULT_THEME.radius
	};
}
function loadPersisted() {
	if (typeof window === "undefined") return null;
	const keys = [THEME_STORAGE_KEY, `${THEME_STORAGE_KEY}-backup`];
	for (const key of keys) try {
		const raw = window.localStorage.getItem(key);
		if (!raw) continue;
		const parsed = JSON.parse(raw);
		const theme = sanitizeTheme(parsed.state?.theme ?? parsed.theme ?? parsed);
		if (theme) return theme;
	} catch {}
	return null;
}
function writePersisted(theme) {
	if (typeof window === "undefined") return;
	const payload = JSON.stringify({
		state: { theme },
		version: 0
	});
	try {
		window.localStorage.setItem(THEME_STORAGE_KEY, payload);
	} catch {}
	try {
		window.localStorage.setItem(`${THEME_STORAGE_KEY}-backup`, payload);
	} catch {}
}
function persistTheme(theme) {
	writePersisted(theme);
}
var useThemeStore = create((set, get) => ({
	theme: DEFAULT_THEME,
	setTheme: (patch) => {
		const next = sanitizeTheme({
			...get().theme,
			...patch
		});
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
	}
}));
function applyPersistedTheme(theme) {
	const current = useThemeStore.getState().theme;
	if (!themesEqual(current, theme)) useThemeStore.setState({ theme });
	applyTheme(theme);
	ensureThemeFonts(theme);
}
function hydrateTheme() {
	if (typeof window === "undefined") return null;
	const persisted = loadPersisted();
	if (!persisted) return null;
	applyPersistedTheme(persisted);
	return persisted;
}
if (typeof window !== "undefined") window.addEventListener("storage", (event) => {
	if (event.key === "atlas-bellarosa-theme" || event.key === `atlas-bellarosa-theme-backup`) hydrateTheme();
});
var IDB_NAME = "atlas-bellarosa";
var IDB_VERSION = 2;
var IDB_CATALOG = "catalog";
var IDB_PREFS = "prefs";
function openAtlasDb() {
	if (typeof indexedDB === "undefined") return Promise.resolve(null);
	return new Promise((resolve) => {
		try {
			const req = indexedDB.open(IDB_NAME, IDB_VERSION);
			req.onupgradeneeded = () => {
				const db = req.result;
				if (!db.objectStoreNames.contains("catalog")) db.createObjectStore(IDB_CATALOG);
				if (!db.objectStoreNames.contains("prefs")) db.createObjectStore(IDB_PREFS);
			};
			req.onsuccess = () => resolve(req.result);
			req.onerror = () => resolve(null);
			req.onblocked = () => resolve(null);
		} catch {
			resolve(null);
		}
	});
}
function putCatalog(key, value) {
	openAtlasDb().then((db) => {
		if (!db) return;
		try {
			db.transaction(IDB_CATALOG, "readwrite").objectStore(IDB_CATALOG).put(value, key);
		} catch {}
	});
}
function getCatalog(key) {
	return openAtlasDb().then((db) => new Promise((resolve) => {
		if (!db) {
			resolve(null);
			return;
		}
		try {
			const req = db.transaction(IDB_CATALOG, "readonly").objectStore(IDB_CATALOG).get(key);
			req.onsuccess = () => resolve(req.result ?? null);
			req.onerror = () => resolve(null);
		} catch {
			resolve(null);
		}
	}));
}
function centroid(poly) {
	let x = 0;
	let y = 0;
	const n = poly.length;
	if (n === 0) return [0, 0];
	for (const [px, py] of poly) {
		x += px;
		y += py;
	}
	return [x / n, y / n];
}
function bounds(poly) {
	let minX = Infinity;
	let minY = Infinity;
	let maxX = -Infinity;
	let maxY = -Infinity;
	for (const [x, y] of poly) {
		if (x < minX) minX = x;
		if (y < minY) minY = y;
		if (x > maxX) maxX = x;
		if (y > maxY) maxY = y;
	}
	return {
		minX,
		minY,
		maxX,
		maxY
	};
}
function area(poly) {
	let a = 0;
	const n = poly.length;
	for (let i = 0; i < n; i++) {
		const [x1, y1] = poly[i];
		const [x2, y2] = poly[(i + 1) % n];
		a += x1 * y2 - x2 * y1;
	}
	return Math.abs(a) / 2;
}
function pointInPoly(poly, x, y) {
	let inside = false;
	const n = poly.length;
	for (let i = 0, j = n - 1; i < n; j = i++) {
		const [xi, yi] = poly[i];
		const [xj, yj] = poly[j];
		if (yi > y !== yj > y && x < (xj - xi) * (y - yi) / (yj - yi + 1e-5) + xi) inside = !inside;
	}
	return inside;
}
function polyToPath(poly) {
	if (poly.length === 0) return "";
	const [x0, y0] = poly[0];
	let d = `M ${x0} ${y0}`;
	for (let i = 1; i < poly.length; i++) {
		const [x, y] = poly[i];
		d += ` L ${x} ${y}`;
	}
	return d + " Z";
}
function rect(x, y, w, h) {
	return [
		[x, y],
		[x + w, y],
		[x + w, y + h],
		[x, y + h]
	];
}
function ellipsePoly(cx, cy, rx, ry, n = 28) {
	const out = [];
	const nx = Math.max(12, n);
	for (let i = 0; i < nx; i++) {
		const a = Math.PI * 2 * i / nx;
		out.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
	}
	return out;
}
function translatePoly(poly, dx, dy) {
	if (!dx && !dy) return poly;
	return poly.map(([x, y]) => [x + dx, y + dy]);
}
function scalePoly(poly, from, to) {
	const w = from.maxX - from.minX || 1;
	const h = from.maxY - from.minY || 1;
	const nw = to.maxX - to.minX;
	const nh = to.maxY - to.minY;
	return poly.map(([x, y]) => [to.minX + (x - from.minX) / w * nw, to.minY + (y - from.minY) / h * nh]);
}
function applyHandle(box, handle, x, y, min = 48) {
	let { minX, minY, maxX, maxY } = box;
	if (handle.includes("n")) minY = Math.min(y, maxY - min);
	if (handle.includes("s")) maxY = Math.max(y, minY + min);
	if (handle.includes("w")) minX = Math.min(x, maxX - min);
	if (handle.includes("e")) maxX = Math.max(x, minX + min);
	return {
		minX,
		minY,
		maxX,
		maxY
	};
}
function handleCursor(handle) {
	if (handle === "n" || handle === "s") return "ns-resize";
	if (handle === "e" || handle === "w") return "ew-resize";
	if (handle === "ne" || handle === "sw") return "nesw-resize";
	return "nwse-resize";
}
function closestPoints(a, b) {
	let best = {
		ax: 0,
		ay: 0,
		bx: 0,
		by: 0,
		dist: Infinity
	};
	const steps = 5;
	for (let i = 0; i < a.length; i++) {
		const a1 = a[i];
		const a2 = a[(i + 1) % a.length];
		for (let j = 0; j < b.length; j++) {
			const b1 = b[j];
			const b2 = b[(j + 1) % b.length];
			for (let t = 0; t <= steps; t++) {
				const ax = a1[0] + (a2[0] - a1[0]) * t / steps;
				const ay = a1[1] + (a2[1] - a1[1]) * t / steps;
				for (let u = 0; u <= steps; u++) {
					const bx = b1[0] + (b2[0] - b1[0]) * u / steps;
					const by = b1[1] + (b2[1] - b1[1]) * u / steps;
					const d = Math.hypot(ax - bx, ay - by);
					if (d < best.dist) best = {
						ax,
						ay,
						bx,
						by,
						dist: d
					};
				}
			}
		}
	}
	return best;
}
function doorMark(a, b) {
	const c = closestPoints(a, b);
	if (c.dist > 28) return null;
	const x = (c.ax + c.bx) / 2;
	const y = (c.ay + c.by) / 2;
	let tx = c.ay - c.by;
	let ty = c.bx - c.ax;
	const len = Math.hypot(tx, ty) || 1;
	tx /= len;
	ty /= len;
	return {
		x,
		y,
		tx,
		ty
	};
}
function stairLines(poly, count = 8) {
	const b = bounds(poly);
	const wide = b.maxX - b.minX >= b.maxY - b.minY;
	const lines = [];
	for (let i = 1; i <= count; i++) {
		const t = i / (count + 1);
		if (wide) {
			const y = b.minY + (b.maxY - b.minY) * t;
			lines.push([[b.minX + 18, y], [b.maxX - 18, y]]);
		} else {
			const x = b.minX + (b.maxX - b.minX) * t;
			lines.push([[x, b.minY + 18], [x, b.maxY - 18]]);
		}
	}
	return lines;
}
function labelSize(text, fontSize) {
	return {
		w: Math.max(36, text.length * fontSize * .58 + 16),
		h: fontSize + 12
	};
}
function boxesOverlap(a, b, pad = 6) {
	return !(a.x + a.w + pad < b.x || b.x + b.w + pad < a.x || a.y + a.h + pad < b.y || b.y + b.h + pad < a.y);
}
function distToSegment(px, py, ax, ay, bx, by) {
	const abx = bx - ax;
	const aby = by - ay;
	const t = ((px - ax) * abx + (py - ay) * aby) / (abx * abx + aby * aby || 1);
	const u = Math.max(0, Math.min(1, t));
	return Math.hypot(px - (ax + abx * u), py - (ay + aby * u));
}
function nearPoint(a, b, thresh = 32) {
	return Math.hypot(a[0] - b[0], a[1] - b[1]) <= thresh;
}
function axisAlign(prev, next, thresh = 32) {
	const dx = Math.abs(next[0] - prev[0]);
	const dy = Math.abs(next[1] - prev[1]);
	if (dx <= thresh && dx <= dy) return [prev[0], next[1]];
	if (dy <= thresh) return [next[0], prev[1]];
	return next;
}
function snapToPoints(p, pts, thresh = 32) {
	let best = p;
	let d0 = thresh;
	for (const q of pts) {
		const d = Math.hypot(p[0] - q[0], p[1] - q[1]);
		if (d <= d0) {
			d0 = d;
			best = q;
		}
	}
	return best;
}
function snapZonePoint(pts, raw) {
	let p = raw;
	if (pts.length) p = axisAlign(pts[pts.length - 1], p);
	if (pts.length) p = snapToPoints(p, pts);
	return p;
}
function canCloseZone(pts, p) {
	return pts.length >= 3 && nearPoint(p, pts[0]);
}
function closedPoly(pts) {
	if (pts.length < 3) return null;
	const first = pts[0];
	const last = pts[pts.length - 1];
	const out = nearPoint(last, first) ? pts.slice(0, -1) : pts.slice();
	return out.length >= 3 ? out : null;
}
function simplifyStroke(pts, minDist = 8) {
	if (pts.length < 2) return pts.slice();
	const out = [pts[0]];
	for (let i = 1; i < pts.length; i++) {
		const p = pts[i];
		const q = out[out.length - 1];
		if (Math.hypot(p[0] - q[0], p[1] - q[1]) >= minDist) out.push(p);
	}
	const last = pts[pts.length - 1];
	const tail = out[out.length - 1];
	if (last[0] !== tail[0] || last[1] !== tail[1]) out.push(last);
	return out;
}
function lineReady(pts) {
	if (pts.length < 3) return null;
	const poly = closedPoly(pts) ?? pts;
	if (poly.length < 3) return null;
	if (area(poly) < 900) return null;
	return poly;
}
/** IbisPaint-style lasso: freehand loop, auto-closed, no axis constraint. */
function lassoReady(pts) {
	const simple = simplifyStroke(pts, 6);
	if (simple.length < 6) return null;
	const poly = closedPoly(simple);
	if (!poly || poly.length < 6) return null;
	if (area(poly) < 900) return null;
	return poly;
}
function markEnds(f) {
	const rad = f.rotation * Math.PI / 180;
	const dx = Math.cos(rad) * (f.length / 2);
	const dy = Math.sin(rad) * (f.length / 2);
	return {
		a: [f.x - dx, f.y - dy],
		b: [f.x + dx, f.y + dy]
	};
}
function markFromEnds(a, b) {
	return {
		x: (a[0] + b[0]) / 2,
		y: (a[1] + b[1]) / 2,
		length: Math.max(24, Math.hypot(b[0] - a[0], b[1] - a[1])),
		rotation: Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI
	};
}
function fixtureWidth(f) {
	if (typeof f.width === "number" && Number.isFinite(f.width)) return Math.max(16, f.width);
	if (f.kind === "stair") return Math.max(32, f.length * .45);
	return 16;
}
function markSides(f) {
	const w = fixtureWidth(f) / 2;
	const rad = f.rotation * Math.PI / 180;
	const nx = -Math.sin(rad);
	const ny = Math.cos(rad);
	return {
		n: [f.x + nx * w, f.y + ny * w],
		s: [f.x - nx * w, f.y - ny * w]
	};
}
function widthFromPoint(f, wx, wy) {
	const rad = f.rotation * Math.PI / 180;
	const nx = -Math.sin(rad);
	const ny = Math.cos(rad);
	return Math.max(16, Math.abs((wx - f.x) * nx + (wy - f.y) * ny) * 2);
}
function pointInRotatedRect(f, wx, wy, pad = 8) {
	const w = fixtureWidth(f);
	const rad = f.rotation * Math.PI / 180;
	const dx = wx - f.x;
	const dy = wy - f.y;
	const lx = dx * Math.cos(rad) + dy * Math.sin(rad);
	const ly = -dx * Math.sin(rad) + dy * Math.cos(rad);
	return Math.abs(lx) <= f.length / 2 + pad && Math.abs(ly) <= w / 2 + pad;
}
var PROP_TYPES = [
	{
		id: "choice",
		label: "Choix unique",
		hint: "Une valeur dans une liste"
	},
	{
		id: "tags",
		label: "Choix multiple",
		hint: "Plusieurs valeurs"
	},
	{
		id: "text",
		label: "Texte",
		hint: "Saisie libre"
	}
];
var TONE_OPTIONS = [
	{
		id: "default",
		label: "Neutre"
	},
	{
		id: "sage",
		label: "Sage"
	},
	{
		id: "stone",
		label: "Pierre"
	},
	{
		id: "clay",
		label: "Alerte"
	},
	{
		id: "ink",
		label: "Encre"
	}
];
/** Empty on purpose: the atlas is a sandbox. Accès / Style are not built-in. */
var DEFAULT_PROPS = [];
var TONES = [
	"default",
	"sage",
	"stone",
	"clay",
	"ink"
];
var TYPES = [
	"text",
	"choice",
	"tags"
];
function uid(prefix) {
	return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}
function slug(raw) {
	return raw.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 32);
}
function newProp(partial) {
	return {
		id: uid("p"),
		name: "Nouvelle propriété",
		type: "choice",
		options: [],
		filterable: true,
		mapTint: false,
		...partial
	};
}
function newOption(label, used) {
	const base = slug(label) || uid("o");
	let id = base;
	let n = 2;
	while (used.has(id)) {
		id = `${base}-${n}`;
		n += 1;
	}
	used.add(id);
	return {
		id,
		label: label.trim() || "Option"
	};
}
function asTone(v) {
	return typeof v === "string" && TONES.includes(v) ? v : void 0;
}
function asType(v) {
	return typeof v === "string" && TYPES.includes(v) ? v : void 0;
}
function sanitizeOption(raw) {
	if (!raw || typeof raw !== "object") return null;
	const t = raw;
	const label = typeof t.label === "string" ? t.label.trim() : "";
	const id = (typeof t.id === "string" ? t.id.trim() : "") || slug(label);
	if (!id) return null;
	const option = {
		id,
		label: label || id
	};
	const tone = asTone(t.tone);
	if (tone && tone !== "default") option.tone = tone;
	return option;
}
function sanitizeProp(raw) {
	if (!raw || typeof raw !== "object") return null;
	const t = raw;
	const id = typeof t.id === "string" ? t.id.trim() : "";
	if (!id) return null;
	const name = typeof t.name === "string" ? t.name.trim() : "";
	const type = asType(t.type) ?? "text";
	const seen = /* @__PURE__ */ new Set();
	const options = [];
	if (Array.isArray(t.options)) for (const item of t.options) {
		const option = sanitizeOption(item);
		if (!option || seen.has(option.id)) continue;
		seen.add(option.id);
		options.push(option);
	}
	return {
		id,
		name: name || id,
		type,
		options,
		filterable: t.filterable !== false,
		mapTint: t.mapTint === true
	};
}
function cloneSchema(schema = DEFAULT_PROPS) {
	return schema.map((p) => ({
		...p,
		options: p.options.map((o) => ({ ...o }))
	}));
}
function sanitizeSchema(raw) {
	if (!Array.isArray(raw)) return cloneSchema();
	const seen = /* @__PURE__ */ new Set();
	const out = [];
	for (const item of raw) {
		const def = sanitizeProp(item);
		if (!def || seen.has(def.id)) continue;
		seen.add(def.id);
		out.push(def);
	}
	let tinted = false;
	return out.map((def) => {
		if (!def.mapTint) return def;
		if (tinted) return {
			...def,
			mapTint: false
		};
		tinted = true;
		return def;
	});
}
function coerceValue(def, raw) {
	if (def.type === "tags") {
		const arr = Array.isArray(raw) ? raw.filter((x) => typeof x === "string") : typeof raw === "string" && raw ? [raw] : [];
		if (!def.options.length) return arr;
		const allowed = new Set(def.options.map((o) => o.id));
		return arr.filter((id) => allowed.has(id));
	}
	const str = Array.isArray(raw) ? typeof raw[0] === "string" ? raw[0] : "" : typeof raw === "string" ? raw : "";
	if (def.type === "choice" && def.options.length) return def.options.some((o) => o.id === str) ? str : "";
	return str;
}
function seedProps(room, schema) {
	const out = { ...room.props ?? {} };
	if (!schema) return out;
	const wanted = new Set(schema.map((d) => d.id));
	for (const key of Object.keys(out)) if (!wanted.has(key)) delete out[key];
	return out;
}
function readProp(props, def) {
	if (props[def.id] !== void 0) return coerceValue(def, props[def.id]);
	const name = def.name.trim().toLowerCase();
	for (const [key, value] of Object.entries(props)) if (key.toLowerCase() === name) return coerceValue(def, value);
	return coerceValue(def, void 0);
}
function optionLabel(def, id) {
	return def.options.find((o) => o.id === id)?.label ?? id;
}
function formatProp(def, value) {
	if (def.type === "tags") return (Array.isArray(value) ? value : []).map((id) => optionLabel(def, id));
	const str = typeof value === "string" ? value : "";
	if (!str) return [];
	if (def.type === "choice") return [optionLabel(def, str)];
	return [str];
}
function tintOf(props, schema) {
	const def = schema.find((p) => p.mapTint);
	if (!def) return void 0;
	const value = readProp(props, def);
	const id = Array.isArray(value) ? value[0] : value;
	if (!id) return void 0;
	return def.options.find((o) => o.id === id)?.tone;
}
function schemasEqual(a, b) {
	return JSON.stringify(a) === JSON.stringify(b);
}
var LEGACY_FACTORY_PROP_IDS = /* @__PURE__ */ new Set(["access", "style"]);
/** Old built-in Accès / Style — not user-created, never locked. */
function isLegacyFactorySchema(schema) {
	return schema.length > 0 && schema.every((def) => LEGACY_FACTORY_PROP_IDS.has(def.id));
}
function scrubLegacySchema(schema) {
	return isLegacyFactorySchema(schema) ? [] : schema;
}
var ZONE_FILLS = [
	{
		id: "sage",
		label: "Sauge",
		css: "var(--color-primary)",
		hex: "#6a7a58"
	},
	{
		id: "stone",
		label: "Pierre",
		css: "var(--color-stone)",
		hex: "#8a8476"
	},
	{
		id: "clay",
		label: "Terre",
		css: "var(--color-clay)",
		hex: "#b45a45"
	},
	{
		id: "ink",
		label: "Encre",
		css: "var(--color-ink)",
		hex: "#2c2a26"
	},
	{
		id: "sky",
		label: "Ciel",
		css: "var(--color-token-antoine)",
		hex: "#5b7fa6"
	},
	{
		id: "sand",
		label: "Sable",
		css: "var(--color-token-stella)",
		hex: "#c4a36a"
	}
];
var STAIR_STYLES = [
	{
		id: "straight",
		label: "Droit",
		hint: "Volée simple"
	},
	{
		id: "spiral",
		label: "Colimaçon",
		hint: "Escalier hélicoïdal"
	},
	{
		id: "quarter",
		label: "Quartier tournant",
		hint: "Deux volées en L"
	},
	{
		id: "switchback",
		label: "Demi-tour",
		hint: "Deux volées en U"
	}
];
function sanitizeHexColor(raw) {
	if (typeof raw !== "string") return void 0;
	const v = raw.trim();
	if (/^#([0-9a-f]{3})$/i.test(v)) return `#${v[1]}${v[1]}${v[2]}${v[2]}${v[3]}${v[3]}`.toLowerCase();
	if (/^#([0-9a-f]{6})$/i.test(v)) return v.toLowerCase();
}
function zoneCss(fill) {
	return ZONE_FILLS.find((z) => z.id === fill)?.css ?? "var(--color-primary)";
}
function zoneHex(fill) {
	return ZONE_FILLS.find((z) => z.id === fill)?.hex ?? "#6a7a58";
}
function zonePaint(f) {
	return sanitizeHexColor(f.color) ?? zoneCss(f.fill);
}
function sanitizeStairStyle(raw) {
	return raw === "spiral" || raw === "quarter" || raw === "switchback" || raw === "straight" ? raw : "straight";
}
function sanitizePhotos(raw) {
	if (!Array.isArray(raw)) return [];
	const out = [];
	for (const item of raw) {
		if (!item || typeof item !== "object") continue;
		const t = item;
		const src = typeof t.src === "string" ? t.src.trim() : "";
		if (!src) continue;
		if (!(src.startsWith("data:image/") || src.startsWith("/") || src.startsWith("http://") || src.startsWith("https://"))) continue;
		if (src.startsWith("data:") && src.length > 12e5) continue;
		const id = typeof t.id === "string" && t.id.trim() ? t.id.trim() : `ph-${out.length + 1}`;
		const name = typeof t.name === "string" && t.name.trim() ? t.name.trim().slice(0, 80) : void 0;
		out.push({
			id,
			src,
			name
		});
		if (out.length >= 12) break;
	}
	return out;
}
var SANDBOX_VIEW = [
	0,
	0,
	1600,
	1e3
];
function factoryCharacters() {
	return [];
}
function factoryFloors() {
	return [{
		id: "etage-1",
		name: "Étage 1",
		short: "1",
		order: 0,
		viewBox: [...SANDBOX_VIEW],
		blurb: "",
		material: ""
	}];
}
function factoryRooms() {
	return [];
}
function factoryFixtures() {
	return [];
}
function emptyRoom(partial) {
	const n = partial.name ?? "Pièce";
	return {
		id: partial.id ?? uid("room"),
		floorId: partial.floorId,
		name: n,
		label: partial.label ?? n,
		poly: partial.poly ?? rect(200, 200, 360, 240),
		connections: partial.connections ?? [],
		description: partial.description ?? "",
		steps: partial.steps ?? [],
		props: partial.props ?? {},
		travel: partial.travel,
		photos: partial.photos ?? []
	};
}
function roomsOnFloor(rooms, floorId) {
	return rooms.filter((room) => room.floorId === floorId);
}
function floorById(floors, id) {
	return floors.find((floor) => floor.id === id);
}
function roomById(rooms, id) {
	return rooms.find((room) => room.id === id);
}
function linkFloors(floors) {
	const sorted = [...floors].sort((a, b) => a.order - b.order);
	return sorted.map((floor, i) => ({
		...floor,
		order: i,
		down: sorted[i - 1]?.id,
		up: sorted[i + 1]?.id
	}));
}
function asPoint(raw) {
	if (!Array.isArray(raw) || raw.length < 2) return null;
	const x = Number(raw[0]);
	const y = Number(raw[1]);
	if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
	return [x, y];
}
function sanitizePoly(raw) {
	if (!Array.isArray(raw) || raw.length < 3) return null;
	const out = [];
	for (const item of raw) {
		const p = asPoint(item);
		if (p) out.push(p);
	}
	return out.length >= 3 ? out : null;
}
function sanitizeFloor(raw) {
	if (!raw || typeof raw !== "object") return null;
	const t = raw;
	const id = typeof t.id === "string" ? t.id.trim() : "";
	if (!id) return null;
	const vb = Array.isArray(t.viewBox) ? t.viewBox.map(Number) : SANDBOX_VIEW;
	const viewBox = vb.length === 4 && vb.every((n) => Number.isFinite(n)) ? [
		vb[0],
		vb[1],
		vb[2],
		vb[3]
	] : [...SANDBOX_VIEW];
	const order = typeof t.order === "number" && Number.isFinite(t.order) ? t.order : 0;
	return {
		id,
		name: typeof t.name === "string" && t.name.trim() ? t.name.trim() : id,
		short: typeof t.short === "string" && t.short.trim() ? t.short.trim() : id.slice(0, 8),
		order,
		viewBox,
		blurb: typeof t.blurb === "string" ? t.blurb : "",
		material: typeof t.material === "string" ? t.material : "",
		up: typeof t.up === "string" ? t.up : void 0,
		down: typeof t.down === "string" ? t.down : void 0
	};
}
function sanitizeFloors(raw) {
	if (!Array.isArray(raw)) return factoryFloors();
	const seen = /* @__PURE__ */ new Set();
	const out = [];
	for (const item of raw) {
		const floor = sanitizeFloor(item);
		if (!floor || seen.has(floor.id)) continue;
		seen.add(floor.id);
		out.push(floor);
	}
	if (out.length === 0) return factoryFloors();
	return linkFloors(out);
}
function sanitizeTravel(raw) {
	if (!Array.isArray(raw)) return void 0;
	const out = [];
	for (const item of raw) {
		if (!item || typeof item !== "object") continue;
		const t = item;
		const toFloor = typeof t.toFloor === "string" ? t.toFloor : "";
		const label = typeof t.label === "string" ? t.label : "";
		if (!toFloor || !label) continue;
		out.push({
			toFloor,
			label,
			toRoom: typeof t.toRoom === "string" ? t.toRoom : void 0
		});
	}
	return out.length ? out : void 0;
}
function sanitizeRoom(raw) {
	if (!raw || typeof raw !== "object") return null;
	const t = raw;
	const id = typeof t.id === "string" ? t.id.trim() : "";
	const floorId = typeof t.floorId === "string" ? t.floorId.trim() : "";
	const poly = sanitizePoly(t.poly);
	if (!id || !floorId || !poly) return null;
	const name = typeof t.name === "string" && t.name.trim() ? t.name.trim() : "Pièce";
	const connections = Array.isArray(t.connections) ? t.connections.filter((c) => typeof c === "string" && c.trim().length > 0) : [];
	const props = {};
	if (t.props && typeof t.props === "object" && !Array.isArray(t.props)) for (const [key, value] of Object.entries(t.props)) {
		if (!key.trim()) continue;
		if (typeof value === "string") props[key] = value;
		else if (Array.isArray(value)) props[key] = value.filter((x) => typeof x === "string");
	}
	const steps = Array.isArray(t.steps) ? t.steps.map((item, i) => {
		if (!item || typeof item !== "object") return null;
		const s = item;
		const label = typeof s.label === "string" ? s.label : "";
		return {
			id: typeof s.id === "string" && s.id.trim() ? s.id.trim() : `step-${i + 1}`,
			label,
			done: s.done === true
		};
	}).filter((s) => Boolean(s)) : [];
	const photos = sanitizePhotos(t.photos);
	return {
		id,
		floorId,
		name,
		label: typeof t.label === "string" && t.label.trim() ? t.label.trim() : name,
		poly,
		connections,
		description: typeof t.description === "string" ? t.description : "",
		steps,
		props,
		travel: sanitizeTravel(t.travel),
		photos: photos.length ? photos : void 0
	};
}
function sanitizeRooms(raw, floors) {
	if (!Array.isArray(raw)) return [];
	const floorIds = new Set(floors.map((f) => f.id));
	const seen = /* @__PURE__ */ new Set();
	const out = [];
	for (const item of raw) {
		const room = sanitizeRoom(item);
		if (!room || seen.has(room.id) || !floorIds.has(room.floorId)) continue;
		seen.add(room.id);
		out.push(room);
	}
	return out.map((room) => ({
		...room,
		connections: room.connections.filter((id) => seen.has(id) && id !== room.id)
	}));
}
var FIXTURE_KINDS = /* @__PURE__ */ new Set([
	"door",
	"window",
	"stair",
	"zone"
]);
var FILL_IDS = new Set(ZONE_FILLS.map((z) => z.id));
function sanitizeFill(raw) {
	return typeof raw === "string" && FILL_IDS.has(raw) ? raw : "sage";
}
function sanitizeFixture(raw) {
	if (!raw || typeof raw !== "object") return null;
	const t = raw;
	const id = typeof t.id === "string" ? t.id.trim() : "";
	const floorId = typeof t.floorId === "string" ? t.floorId.trim() : "";
	const kind = typeof t.kind === "string" ? t.kind : "";
	if (!id || !floorId || !FIXTURE_KINDS.has(kind)) return null;
	const label = typeof t.label === "string" && t.label.trim() ? t.label.trim() : void 0;
	const description = typeof t.description === "string" ? t.description : void 0;
	const photos = sanitizePhotos(t.photos);
	const color = sanitizeHexColor(t.color);
	if (kind === "zone") {
		const poly = sanitizePoly(t.poly);
		if (!poly) return null;
		const [cx, cy] = centroid(poly);
		const x = Number(t.x);
		const y = Number(t.y);
		return {
			id,
			floorId,
			kind: "zone",
			x: Number.isFinite(x) ? x : cx,
			y: Number.isFinite(y) ? y : cy,
			rotation: 0,
			length: 48,
			label,
			description,
			poly,
			fill: sanitizeFill(t.fill),
			color,
			photos: photos.length ? photos : void 0
		};
	}
	const x = Number(t.x);
	const y = Number(t.y);
	if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
	const rotation = Number(t.rotation);
	const length = Number(t.length);
	const widthRaw = Number(t.width);
	const kindMark = kind;
	const style = kindMark === "stair" ? sanitizeStairStyle(t.style) : void 0;
	return {
		id,
		floorId,
		kind: kindMark,
		x,
		y,
		rotation: Number.isFinite(rotation) ? rotation : 0,
		length: Number.isFinite(length) ? Math.max(24, length) : 72,
		width: kindMark === "stair" && Number.isFinite(widthRaw) ? Math.max(16, widthRaw) : void 0,
		style,
		label,
		description,
		toFloor: typeof t.toFloor === "string" && t.toFloor ? t.toFloor : void 0,
		photos: photos.length ? photos : void 0
	};
}
function sanitizeFixtures(raw, floors) {
	if (!Array.isArray(raw)) return [];
	const floorIds = new Set(floors.map((f) => f.id));
	const seen = /* @__PURE__ */ new Set();
	const out = [];
	for (const item of raw) {
		const mark = sanitizeFixture(item);
		if (!mark || seen.has(mark.id) || !floorIds.has(mark.floorId)) continue;
		if (mark.toFloor && !floorIds.has(mark.toFloor)) mark.toFloor = void 0;
		seen.add(mark.id);
		out.push(mark);
	}
	return out;
}
function sanitizeCharacter(raw) {
	if (!raw || typeof raw !== "object") return null;
	const t = raw;
	const id = typeof t.id === "string" ? t.id.trim() : "";
	if (!id) return null;
	const name = typeof t.name === "string" && t.name.trim() ? t.name.trim().slice(0, 80) : "Pion";
	return {
		id,
		name,
		short: typeof t.short === "string" && t.short.trim() ? t.short.trim().slice(0, 3) : name.slice(0, 1).toUpperCase(),
		role: typeof t.role === "string" ? t.role.slice(0, 80) : ""
	};
}
function sanitizeCharacters(raw) {
	if (!Array.isArray(raw)) return [];
	const seen = /* @__PURE__ */ new Set();
	const out = [];
	for (const item of raw) {
		const c = sanitizeCharacter(item);
		if (!c || seen.has(c.id)) continue;
		seen.add(c.id);
		out.push(c);
	}
	return out;
}
function sanitizeTokenMap(raw, rooms, floors, characters) {
	const roomIds = new Set(rooms.map((r) => r.id));
	const floorIds = new Set(floors.map((f) => f.id));
	const fallbackFloor = floors[0]?.id ?? "etage-1";
	const out = {};
	const rec = raw && typeof raw === "object" ? raw : {};
	for (const who of characters) {
		const pos = rec[who.id];
		const p = pos && typeof pos === "object" ? pos : {};
		const roomId = typeof p.roomId === "string" && roomIds.has(p.roomId) ? p.roomId : "";
		const floorId = typeof p.floorId === "string" && floorIds.has(p.floorId) ? p.floorId : fallbackFloor;
		const x = Number(p.x);
		const y = Number(p.y);
		const next = {
			floorId,
			roomId
		};
		if (Number.isFinite(x) && Number.isFinite(y)) {
			next.x = x;
			next.y = y;
		}
		out[who.id] = next;
	}
	return out;
}
function worldsEqual(a, b) {
	return JSON.stringify(a) === JSON.stringify(b);
}
function factoryWorld() {
	return {
		floors: factoryFloors(),
		rooms: factoryRooms(),
		fixtures: factoryFixtures(),
		characters: factoryCharacters(),
		tokens: {}
	};
}
function isFactoryWorld(floors, rooms, fixtures = [], characters = []) {
	return characters.length === 0 && worldsEqual({
		floors,
		rooms,
		fixtures,
		characters: [],
		tokens: {}
	}, factoryWorld());
}
var LEGACY_FLOOR_IDS = /* @__PURE__ */ new Set([
	"parcelle",
	"cave",
	"rdc",
	"etage",
	"combles",
	"toit"
]);
var LEGACY_ROOM_IDS = /* @__PURE__ */ new Set([
	"salon",
	"cuisine",
	"chambre-stella",
	"chambre-antoine",
	"vue-mer",
	"porche",
	"veranda",
	"bibliotheque",
	"grenier"
]);
function isLegacyFactoryWorld(floors, rooms) {
	const ids = new Set(floors.map((f) => f.id));
	const floorHits = [...LEGACY_FLOOR_IDS].filter((id) => ids.has(id)).length;
	const roomHits = rooms.filter((r) => LEGACY_ROOM_IDS.has(r.id)).length;
	return floorHits >= 2 || roomHits >= 3;
}
function scrubLegacyWorld(floors, rooms, fixtures = [], characters = [], tokens = {}) {
	if (isLegacyFactoryWorld(floors, rooms)) return factoryWorld();
	return {
		floors,
		rooms,
		fixtures,
		characters,
		tokens
	};
}
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
function isRecord(raw) {
	return Boolean(raw) && typeof raw === "object" && !Array.isArray(raw);
}
var loadCloudPrefs = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("994483c8865cf3a0a1b79004353266d3d35d745ea47c8fbdc954e07c5ab869d8"));
var saveCloudPrefs = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => {
	if (!isRecord(data) || typeof data.savedAt !== "number" || typeof data.payloadJson !== "string") throw new Error("invalid cloud prefs");
	return {
		savedAt: data.savedAt,
		payloadJson: data.payloadJson
	};
}).handler(createSsrRpc("81971174ac0cf4fd91b14e4497b90ab537607fa2bb83cc8f373dc660e14c6d0d"));
createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(createSsrRpc("308f6180ab4873bf6213a8d79116a4b6f20a9b9a053cecb2c5662179703595f3"));
function mergeRoom(room, edit, schema = DEFAULT_PROPS) {
	const seed = seedProps(room, schema);
	const overlay = edit?.props ?? {};
	const merged = {
		...seed,
		...overlay
	};
	const props = {};
	for (const def of schema) props[def.id] = readProp(merged, def);
	for (const [key, value] of Object.entries(overlay)) if (props[key] === void 0) props[key] = value;
	return {
		...room,
		name: edit?.name ?? room.name,
		label: edit?.label ?? room.label,
		description: edit?.description ?? room.description,
		props,
		steps: edit?.steps ?? room.steps ?? []
	};
}
function resolveRoom(id, rooms, schema = DEFAULT_PROPS, edit) {
	const base = rooms.find((r) => r.id === id);
	if (!base) return void 0;
	return mergeRoom(base, edit, schema);
}
function resolveFloor(floorId, rooms, schema = DEFAULT_PROPS) {
	return rooms.filter((room) => room.floorId === floorId).map((room) => mergeRoom(room, void 0, schema));
}
var CHROME_TOGGLES = [
	{
		key: "showGrid",
		label: "Grille",
		hint: "Quadrillage sous le plan"
	},
	{
		key: "showCompass",
		label: "Nord",
		hint: "Petite boussole en bas à gauche"
	},
	{
		key: "showTokens",
		label: "Pions",
		hint: "Marqueurs de personnages"
	},
	{
		key: "showHints",
		label: "Conseils",
		hint: "Légendes sous les onglets et la barre d’outils"
	}
];
var DEFAULT_COPY = {
	appName: "Atlas",
	floorWord: "Étage",
	roomWord: "Pièce",
	emptyPlan: "Plan vide. Choisissez une forme, puis tracez une pièce."
};
var DEFAULT_CHROME = {
	showGrid: true,
	showCompass: true,
	showTokens: true,
	showHints: true,
	handleSize: 16
};
function sanitizeCopy(raw) {
	const t = raw && typeof raw === "object" ? raw : {};
	const str = (key, fallback) => {
		const v = t[key];
		return typeof v === "string" && v.trim() ? v.trim().slice(0, 120) : fallback;
	};
	return {
		appName: str("appName", DEFAULT_COPY.appName),
		floorWord: str("floorWord", DEFAULT_COPY.floorWord),
		roomWord: str("roomWord", DEFAULT_COPY.roomWord),
		emptyPlan: str("emptyPlan", DEFAULT_COPY.emptyPlan)
	};
}
function sanitizeHandleSize(raw) {
	if (raw === "sm") return 10;
	if (raw === "md") return 16;
	if (raw === "lg") return 24;
	const n = Number(raw);
	if (!Number.isFinite(n)) return 16;
	return Math.min(32, Math.max(8, Math.round(n)));
}
function handleSizePx(size) {
	return sanitizeHandleSize(size);
}
function readFlag(t, key, fallback) {
	if (t[key] === false) return false;
	if (t[key] === true) return true;
	return fallback;
}
function sanitizeChrome(raw) {
	const t = raw && typeof raw === "object" ? raw : {};
	return {
		showGrid: readFlag(t, "showGrid", DEFAULT_CHROME.showGrid),
		showCompass: readFlag(t, "showCompass", DEFAULT_CHROME.showCompass),
		showTokens: readFlag(t, "showTokens", DEFAULT_CHROME.showTokens),
		showHints: readFlag(t, "showHints", DEFAULT_CHROME.showHints),
		handleSize: sanitizeHandleSize(t.handleSize)
	};
}
var LS_KEY$2 = "atlas-bellarosa-ui";
function readLocal$2() {
	if (typeof window === "undefined") return null;
	try {
		const raw = localStorage.getItem(LS_KEY$2);
		if (!raw) return null;
		const parsed = JSON.parse(raw);
		return {
			copy: sanitizeCopy(parsed.copy),
			chrome: sanitizeChrome(parsed.chrome)
		};
	} catch {
		return null;
	}
}
function writeLocal$2(copy, chrome) {
	if (typeof window === "undefined") return;
	try {
		localStorage.setItem(LS_KEY$2, JSON.stringify({
			copy,
			chrome
		}));
	} catch {}
}
function hasLocalUi() {
	if (typeof window === "undefined") return false;
	try {
		return Boolean(localStorage.getItem(LS_KEY$2));
	} catch {
		return false;
	}
}
var useUiStore = create((set, get) => ({
	copy: DEFAULT_COPY,
	chrome: DEFAULT_CHROME,
	setCopy: (patch) => {
		const copy = sanitizeCopy({
			...get().copy,
			...patch
		});
		writeLocal$2(copy, get().chrome);
		set({ copy });
	},
	setChrome: (patch) => {
		const chrome = sanitizeChrome({
			...get().chrome,
			...patch
		});
		writeLocal$2(get().copy, chrome);
		set({ chrome });
	},
	replaceUi: (next) => {
		const copy = sanitizeCopy(next.copy ?? get().copy);
		const chrome = sanitizeChrome(next.chrome ?? get().chrome);
		writeLocal$2(copy, chrome);
		set({
			copy,
			chrome
		});
	},
	resetUi: () => {
		writeLocal$2(DEFAULT_COPY, DEFAULT_CHROME);
		set({
			copy: DEFAULT_COPY,
			chrome: DEFAULT_CHROME
		});
	}
}));
function hydrateUi(raw) {
	if (raw && (raw.copy !== void 0 || raw.chrome !== void 0)) {
		useUiStore.getState().replaceUi(raw);
		return;
	}
	const local = readLocal$2();
	if (local) useUiStore.setState(local);
}
var STORAGE_KEY = "atlas-bellarosa-v1";
var SCHEMA_KEY = "atlas-bellarosa-schema";
var WORLD_KEY = "atlas-bellarosa-world";
function defaultTokens(characters = []) {
	const floorId = factoryFloors()[0]?.id ?? "etage-1";
	const out = {};
	for (const c of characters) out[c.id] = {
		floorId,
		roomId: ""
	};
	return out;
}
var persistReady = false;
var allowFactoryWrite = false;
var manualHydrateDone = false;
var persistWriteTimer;
var persistWritePending = null;
function writeJson(key, value) {
	try {
		const raw = JSON.stringify(value);
		localStorage.setItem(key, raw);
		localStorage.setItem(`${key}-backup`, raw);
	} catch {}
}
function readJson(key) {
	for (const k of [key, `${key}-backup`]) try {
		const raw = localStorage.getItem(k);
		if (!raw) continue;
		return JSON.parse(raw);
	} catch {}
	return null;
}
function persistSchema(schema, force = false) {
	if (typeof window === "undefined") return;
	const next = sanitizeSchema(schema);
	if (!force && schemasEqual(next, cloneSchema())) {
		const existing = loadPersistedSchema();
		if (existing && !schemasEqual(existing, cloneSchema())) return;
	}
	writeJson(SCHEMA_KEY, next);
	putCatalog("schema", next);
}
function persistWorld(floors, rooms, force = false, fixtures, extra) {
	if (typeof window === "undefined") return;
	const nextFloors = sanitizeFloors(floors);
	const nextRooms = sanitizeRooms(rooms, nextFloors);
	const nextFixtures = sanitizeFixtures(fixtures ?? liveFixtures(), nextFloors);
	const nextCharacters = sanitizeCharacters(extra?.characters ?? liveCharacters());
	const nextTokens = sanitizeTokenMap(extra?.tokens ?? liveTokens(), nextRooms, nextFloors, nextCharacters);
	if (!force && isFactoryWorld(nextFloors, nextRooms, nextFixtures, nextCharacters)) {
		const existing = loadPersistedWorld();
		if (existing && !isFactoryWorld(existing.floors, existing.rooms, existing.fixtures, existing.characters)) return;
	}
	const payload = {
		floors: nextFloors,
		rooms: nextRooms,
		fixtures: nextFixtures,
		characters: nextCharacters,
		tokens: nextTokens
	};
	writeJson(WORLD_KEY, payload);
	putCatalog("world", payload);
}
function liveFixtures() {
	try {
		return useAtlas.getState().fixtures ?? [];
	} catch {
		return [];
	}
}
function liveCharacters() {
	try {
		return useAtlas.getState().characters ?? [];
	} catch {
		return [];
	}
}
function liveTokens() {
	try {
		return useAtlas.getState().tokens ?? {};
	} catch {
		return {};
	}
}
function loadPersistedSchema() {
	if (typeof window === "undefined") return null;
	const raw = readJson(SCHEMA_KEY);
	if (!Array.isArray(raw)) return null;
	return sanitizeSchema(raw);
}
function loadPersistedWorld() {
	if (typeof window === "undefined") return null;
	const raw = readJson(WORLD_KEY);
	if (!raw || typeof raw !== "object") return null;
	const rec = raw;
	if (!Array.isArray(rec.floors) && !Array.isArray(rec.rooms)) return null;
	const floors = sanitizeFloors(rec.floors);
	const rooms = sanitizeRooms(rec.rooms, floors);
	const fixtures = sanitizeFixtures(rec.fixtures, floors);
	const hasCharacters = Array.isArray(rec.characters);
	const hasTokens = rec.tokens !== void 0;
	const characters = sanitizeCharacters(rec.characters);
	return {
		floors,
		rooms,
		fixtures,
		characters,
		tokens: sanitizeTokenMap(rec.tokens, rooms, floors, characters),
		hasCharacters,
		hasTokens
	};
}
function isFactorySnapshot(st) {
	const schema = st.schema;
	const factory = cloneSchema();
	const schemaMatch = Array.isArray(schema) && schemasEqual(schema, factory);
	const worldMatch = isFactoryWorld(Array.isArray(st.floors) ? st.floors : factoryFloors(), Array.isArray(st.rooms) ? st.rooms : [], Array.isArray(st.fixtures) ? st.fixtures : [], Array.isArray(st.characters) ? st.characters : []);
	const notes = st.notes;
	const noNotes = !notes || typeof notes === "object" && Object.keys(notes).length === 0;
	return schemaMatch && worldMatch && noNotes;
}
function writePersistNow(name, value) {
	try {
		const existing = localStorage.getItem(name);
		if (existing) {
			const prev = JSON.parse(existing);
			const incoming = JSON.parse(value);
			const pst = prev.state ?? prev;
			const ist = incoming.state ?? incoming;
			if (!isFactorySnapshot(pst) && isFactorySnapshot(ist) && !allowFactoryWrite) return;
		}
		allowFactoryWrite = false;
		localStorage.setItem(name, value);
	} catch {}
}
function flushPersistWrite() {
	if (persistWriteTimer) {
		clearTimeout(persistWriteTimer);
		persistWriteTimer = void 0;
	}
	if (!persistWritePending) return;
	const { name, value } = persistWritePending;
	persistWritePending = null;
	writePersistNow(name, value);
}
function syncStorage() {
	return {
		getItem: (name) => {
			try {
				return localStorage.getItem(name);
			} catch {
				return null;
			}
		},
		setItem: (name, value) => {
			if (!persistReady) return;
			persistWritePending = {
				name,
				value
			};
			if (persistWriteTimer) clearTimeout(persistWriteTimer);
			persistWriteTimer = setTimeout(flushPersistWrite, 48);
		},
		removeItem: (name) => {
			try {
				localStorage.removeItem(name);
			} catch {}
		}
	};
}
function knownIds(rooms) {
	return new Set(rooms.map((r) => r.id));
}
function sanitizeTokens(raw, rooms, floors, characters) {
	return sanitizeTokenMap(raw, rooms, floors, characters);
}
function sanitizeNotes(raw, rooms) {
	if (!raw || typeof raw !== "object") return {};
	const ids = knownIds(rooms);
	const out = {};
	for (const [key, value] of Object.entries(raw)) {
		if (!ids.has(key) || typeof value !== "string") continue;
		out[key] = value;
	}
	return out;
}
function sanitizeExplored(raw, rooms) {
	const ids = knownIds(rooms);
	const out = {};
	if (raw && typeof raw === "object") for (const [key, value] of Object.entries(raw)) {
		if (!ids.has(key)) continue;
		if (value) out[key] = true;
	}
	return out;
}
function pruneFilters(filters, schema) {
	const ids = new Set(schema.map((d) => d.id));
	const next = {};
	for (const [key, value] of Object.entries(filters)) if (ids.has(key)) next[key] = value;
	return next;
}
function normalizeSlice(s, fallbackRooms, fallbackFloors, fallbackCharacters) {
	const out = {};
	if (s.floors !== void 0) out.floors = sanitizeFloors(s.floors);
	const floors = out.floors ?? fallbackFloors ?? factoryFloors();
	if (s.rooms !== void 0) out.rooms = sanitizeRooms(s.rooms, floors);
	const rooms = out.rooms ?? fallbackRooms ?? [];
	if (s.characters !== void 0) out.characters = sanitizeCharacters(s.characters);
	const characters = out.characters ?? fallbackCharacters ?? [];
	if (s.tokens) out.tokens = sanitizeTokens(s.tokens, rooms, floors, characters);
	if (s.notes) out.notes = sanitizeNotes(s.notes, rooms);
	if (s.sceneRoomId === null) out.sceneRoomId = null;
	else if (typeof s.sceneRoomId === "string" && knownIds(rooms).has(s.sceneRoomId)) out.sceneRoomId = s.sceneRoomId;
	if (s.explored) out.explored = sanitizeExplored(s.explored, rooms);
	if (typeof s.floorId === "string" && floors.some((f) => f.id === s.floorId)) out.floorId = s.floorId;
	if (s.selectedId === null) out.selectedId = null;
	else if (typeof s.selectedId === "string" && knownIds(rooms).has(s.selectedId)) out.selectedId = s.selectedId;
	if (s.schema !== void 0) out.schema = sanitizeSchema(s.schema);
	if (s.fixtures !== void 0) out.fixtures = sanitizeFixtures(s.fixtures, floors);
	return out;
}
function readPersistedRaw() {
	if (typeof window === "undefined") return null;
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw);
		return parsed.state ?? parsed;
	} catch {
		return null;
	}
}
function firstRoomOn(rooms, floorId) {
	return roomsOnFloor(rooms, floorId)[0]?.id ?? null;
}
function cloneSnap(s) {
	return JSON.parse(JSON.stringify({
		floors: s.floors,
		rooms: s.rooms,
		fixtures: s.fixtures,
		floorId: s.floorId,
		selectedId: s.selectedId,
		selectedMarkId: s.selectedMarkId
	}));
}
var histKind = "";
var histAt = 0;
function takeHistory(s, kind) {
	const now = Date.now();
	if (kind !== "world" && kind === histKind && now - histAt < 900) {
		histAt = now;
		return {};
	}
	histKind = kind;
	histAt = now;
	return {
		history: [...s.history ?? [], cloneSnap(s)].slice(-60),
		future: []
	};
}
function roomPatchKind(patch) {
	if (patch.poly || patch.connections || patch.travel) return "world";
	return "room-text";
}
function floorPatchKind(patch) {
	if (patch.viewBox || patch.order !== void 0 || patch.up || patch.down) return "world";
	return "floor-text";
}
function markPatchKind(patch) {
	if (patch.x !== void 0 || patch.y !== void 0 || patch.rotation !== void 0 || patch.length !== void 0 || patch.poly || patch.kind || patch.width !== void 0 || patch.style) return "world";
	return "mark-text";
}
var starterFloors = factoryFloors();
var starterRooms = factoryRooms();
var useAtlas = create()(persist((set, get) => ({
	floorId: starterFloors[0].id,
	selectedId: null,
	query: "",
	filters: {},
	tokens: defaultTokens(),
	notes: {},
	sceneRoomId: null,
	explored: {},
	schema: cloneSchema(),
	floors: starterFloors,
	rooms: starterRooms,
	fixtures: factoryFixtures(),
	characters: factoryCharacters(),
	placingTokenId: null,
	tool: "select",
	drawShape: "rect",
	stairStyle: "straight",
	selectedMarkId: null,
	zoneFill: "sage",
	history: [],
	future: [],
	setFloor: (id) => set((s) => {
		if (s.floorId === id) return s;
		if (!s.floors.some((f) => f.id === id)) return s;
		return {
			floorId: id,
			selectedId: firstRoomOn(s.rooms, id),
			tool: "select"
		};
	}),
	select: (id) => {
		if (!id) {
			set({
				selectedId: null,
				selectedMarkId: null
			});
			return;
		}
		const room = roomById(get().rooms, id);
		if (!room) return;
		set((s) => ({
			selectedId: id,
			selectedMarkId: null,
			floorId: room.floorId,
			explored: {
				...s.explored,
				[id]: true
			}
		}));
	},
	selectMark: (id) => {
		if (!id) {
			set({ selectedMarkId: null });
			return;
		}
		const mark = get().fixtures.find((f) => f.id === id);
		if (!mark) return;
		set({
			selectedMarkId: id,
			selectedId: null,
			floorId: mark.floorId
		});
	},
	setQuery: (query) => set({ query }),
	setFilter: (propId, value) => set((s) => ({ filters: {
		...s.filters,
		[propId]: value
	} })),
	clearFilters: () => set({
		filters: {},
		query: ""
	}),
	moveToken: (who, pos) => set((s) => {
		const tokens = {
			...s.tokens,
			[who]: pos
		};
		persistWorld(s.floors, s.rooms, true, s.fixtures, {
			characters: s.characters,
			tokens
		});
		return {
			tokens,
			explored: pos.roomId ? {
				...s.explored,
				[pos.roomId]: true
			} : s.explored
		};
	}),
	setNote: (roomId, text) => set((s) => ({ notes: {
		...s.notes,
		[roomId]: text
	} })),
	setScene: (sceneRoomId) => set({ sceneRoomId }),
	markExplored: (roomId) => set((s) => ({ explored: {
		...s.explored,
		[roomId]: true
	} })),
	patchRoom: (id, patch) => set((s) => {
		if (!roomById(s.rooms, id)) return s;
		const rooms = s.rooms.map((room) => room.id === id ? {
			...room,
			...patch
		} : room);
		persistWorld(s.floors, rooms, true);
		return {
			...takeHistory(s, roomPatchKind(patch)),
			rooms
		};
	}),
	setRoomProp: (id, propId, value) => set((s) => {
		if (!roomById(s.rooms, id)) return s;
		const rooms = s.rooms.map((r) => r.id === id ? {
			...r,
			props: {
				...r.props ?? {},
				[propId]: value
			}
		} : r);
		persistWorld(s.floors, rooms, true);
		return {
			...takeHistory(s, "room-text"),
			rooms
		};
	}),
	resetRoom: (id) => set((s) => {
		if (!roomById(s.rooms, id)) return s;
		const word = useUiStore.getState().copy.roomWord;
		const rooms = s.rooms.map((r) => r.id === id ? {
			...r,
			name: word,
			label: word,
			description: "",
			steps: [],
			props: {}
		} : r);
		persistWorld(s.floors, rooms, true);
		return {
			...takeHistory(s, "world"),
			rooms
		};
	}),
	addRoom: (poly) => {
		const s = get();
		const count = roomsOnFloor(s.rooms, s.floorId).length + 1;
		const word = useUiStore.getState().copy.roomWord;
		const room = emptyRoom({
			floorId: s.floorId,
			name: `${word} ${count}`,
			label: String(count),
			poly
		});
		const rooms = [...s.rooms, room];
		persistWorld(s.floors, rooms, true);
		set({
			...takeHistory(s, "world"),
			rooms,
			selectedId: room.id,
			tool: "select",
			explored: {
				...s.explored,
				[room.id]: true
			}
		});
		return room.id;
	},
	deleteRoom: (id) => set((s) => {
		if (!roomById(s.rooms, id)) return s;
		const rooms = s.rooms.filter((r) => r.id !== id).map((r) => ({
			...r,
			connections: r.connections.filter((c) => c !== id)
		}));
		allowFactoryWrite = true;
		persistWorld(s.floors, rooms, true);
		const tokens = { ...s.tokens };
		for (const who of Object.keys(tokens)) if (tokens[who]?.roomId === id) {
			const prev = tokens[who];
			tokens[who] = {
				floorId: prev.floorId || s.floorId,
				roomId: "",
				x: prev.x,
				y: prev.y
			};
		}
		return {
			...takeHistory(s, "world"),
			rooms,
			tokens,
			selectedId: s.selectedId === id ? firstRoomOn(rooms, s.floorId) : s.selectedId,
			sceneRoomId: s.sceneRoomId === id ? null : s.sceneRoomId
		};
	}),
	addFloor: () => {
		const s = get();
		const n = s.floors.length + 1;
		const word = useUiStore.getState().copy.floorWord;
		const floor = {
			id: uid("fl"),
			name: `${word} ${n}`,
			short: String(n),
			order: n,
			viewBox: [...factoryFloors()[0].viewBox],
			blurb: "",
			material: ""
		};
		const floors = linkFloors([...s.floors, floor]);
		persistWorld(floors, s.rooms, true, s.fixtures);
		set({
			...takeHistory(s, "world"),
			floors,
			floorId: floor.id,
			selectedId: null,
			selectedMarkId: null,
			tool: "select"
		});
		return floor.id;
	},
	deleteFloor: (id) => set((s) => {
		if (s.floors.length <= 1) return s;
		if (!s.floors.some((f) => f.id === id)) return s;
		const floors = linkFloors(s.floors.filter((f) => f.id !== id));
		const rooms = s.rooms.filter((r) => r.floorId !== id);
		const fixtures = s.fixtures.filter((f) => f.floorId !== id);
		allowFactoryWrite = true;
		persistWorld(floors, rooms, true, fixtures);
		const nextId = s.floorId === id ? floors[0].id : s.floorId;
		return {
			...takeHistory(s, "world"),
			floors,
			rooms,
			fixtures,
			floorId: nextId,
			selectedId: firstRoomOn(rooms, nextId),
			selectedMarkId: null
		};
	}),
	patchFloor: (id, patch) => set((s) => {
		if (!s.floors.some((f) => f.id === id)) return s;
		const floors = linkFloors(s.floors.map((f) => f.id === id ? {
			...f,
			...patch,
			id: f.id
		} : f));
		persistWorld(floors, s.rooms, true, s.fixtures);
		return {
			...takeHistory(s, floorPatchKind(patch)),
			floors
		};
	}),
	moveFloor: (id, dir) => set((s) => {
		const i = s.floors.findIndex((f) => f.id === id);
		const j = i + dir;
		if (i < 0 || j < 0 || j >= s.floors.length) return s;
		const next = [...s.floors];
		const a = next[i];
		next[i] = next[j];
		next[j] = a;
		const floors = linkFloors(next);
		persistWorld(floors, s.rooms, true, s.fixtures);
		return {
			...takeHistory(s, "world"),
			floors
		};
	}),
	addFixture: (partial) => {
		const s = get();
		const mark = {
			id: partial.id ?? uid("mk"),
			floorId: partial.floorId,
			kind: partial.kind,
			x: partial.x,
			y: partial.y,
			rotation: partial.rotation ?? 0,
			length: Math.max(24, partial.length ?? 72),
			width: partial.width,
			style: partial.style,
			label: partial.label ?? (partial.kind === "zone" ? `Zone ${s.fixtures.filter((f) => f.kind === "zone").length + 1}` : void 0),
			description: partial.description,
			toFloor: partial.toFloor,
			poly: partial.poly,
			fill: partial.fill,
			color: partial.color,
			photos: partial.photos
		};
		const fixtures = [...s.fixtures, mark];
		persistWorld(s.floors, s.rooms, true, fixtures);
		set({
			...takeHistory(s, "world"),
			fixtures,
			selectedMarkId: mark.id,
			selectedId: null,
			tool: "select"
		});
		return mark.id;
	},
	patchFixture: (id, patch) => set((s) => {
		if (!s.fixtures.some((f) => f.id === id)) return s;
		const fixtures = s.fixtures.map((f) => f.id === id ? {
			...f,
			...patch,
			id: f.id
		} : f);
		persistWorld(s.floors, s.rooms, true, fixtures);
		return {
			...takeHistory(s, markPatchKind(patch)),
			fixtures
		};
	}),
	deleteFixture: (id) => set((s) => {
		if (!s.fixtures.some((f) => f.id === id)) return s;
		const fixtures = s.fixtures.filter((f) => f.id !== id);
		allowFactoryWrite = true;
		persistWorld(s.floors, s.rooms, true, fixtures);
		return {
			...takeHistory(s, "world"),
			fixtures,
			selectedMarkId: s.selectedMarkId === id ? null : s.selectedMarkId
		};
	}),
	addCharacter: (name) => {
		const s = get();
		const n = s.characters.length + 1;
		const full = (name ?? "").trim() || `Pion ${n}`;
		const character = {
			id: uid("pion"),
			name: full.slice(0, 80),
			short: full.slice(0, 1).toUpperCase(),
			role: ""
		};
		const characters = [...s.characters, character];
		const tokens = {
			...s.tokens,
			[character.id]: {
				floorId: s.floorId,
				roomId: ""
			}
		};
		persistWorld(s.floors, s.rooms, true, s.fixtures, {
			characters,
			tokens
		});
		set({
			characters,
			tokens,
			placingTokenId: character.id,
			tool: "token"
		});
		return character.id;
	},
	patchCharacter: (id, patch) => set((s) => {
		if (!s.characters.some((c) => c.id === id)) return s;
		const characters = s.characters.map((c) => {
			if (c.id !== id) return c;
			const name = typeof patch.name === "string" && patch.name.trim() ? patch.name.trim().slice(0, 80) : c.name;
			const short = typeof patch.short === "string" && patch.short.trim() ? patch.short.trim().slice(0, 3) : name.slice(0, 1).toUpperCase();
			return {
				...c,
				...patch,
				id: c.id,
				name,
				short
			};
		});
		persistWorld(s.floors, s.rooms, true, s.fixtures, {
			characters,
			tokens: s.tokens
		});
		return { characters };
	}),
	deleteCharacter: (id) => set((s) => {
		if (!s.characters.some((c) => c.id === id)) return s;
		const characters = s.characters.filter((c) => c.id !== id);
		const tokens = { ...s.tokens };
		delete tokens[id];
		persistWorld(s.floors, s.rooms, true, s.fixtures, {
			characters,
			tokens
		});
		return {
			characters,
			tokens,
			placingTokenId: s.placingTokenId === id ? null : s.placingTokenId,
			tool: s.placingTokenId === id && s.tool === "token" ? "select" : s.tool
		};
	}),
	setPlacingToken: (id) => set({
		placingTokenId: id,
		tool: id ? "token" : "select"
	}),
	setTool: (tool) => set({
		tool,
		selectedMarkId: tool === "select" ? get().selectedMarkId : null
	}),
	setDrawShape: (drawShape) => set({
		drawShape,
		tool: "draw"
	}),
	setStairStyle: (stairStyle) => set({
		stairStyle,
		tool: "stair"
	}),
	setZoneFill: (zoneFill) => set({
		zoneFill,
		tool: "zone"
	}),
	undo: () => set((s) => {
		const past = s.history ?? [];
		if (!past.length) return s;
		const prev = past[past.length - 1];
		const current = cloneSnap(s);
		histKind = "";
		histAt = 0;
		allowFactoryWrite = true;
		persistWorld(prev.floors, prev.rooms, true, prev.fixtures);
		return {
			floors: prev.floors,
			rooms: prev.rooms,
			fixtures: prev.fixtures,
			floorId: prev.floorId,
			selectedId: prev.selectedId,
			selectedMarkId: prev.selectedMarkId,
			history: past.slice(0, -1),
			future: [...s.future ?? [], current].slice(-60),
			tool: "select"
		};
	}),
	redo: () => set((s) => {
		const nextStack = s.future ?? [];
		if (!nextStack.length) return s;
		const next = nextStack[nextStack.length - 1];
		const current = cloneSnap(s);
		histKind = "";
		histAt = 0;
		allowFactoryWrite = true;
		persistWorld(next.floors, next.rooms, true, next.fixtures);
		return {
			floors: next.floors,
			rooms: next.rooms,
			fixtures: next.fixtures,
			floorId: next.floorId,
			selectedId: next.selectedId,
			selectedMarkId: next.selectedMarkId,
			history: [...s.history ?? [], current].slice(-60),
			future: nextStack.slice(0, -1),
			tool: "select"
		};
	}),
	setSchema: (schema) => set((s) => {
		const next = sanitizeSchema(schema);
		allowFactoryWrite = true;
		persistSchema(next, true);
		return {
			schema: next,
			filters: pruneFilters(s.filters, next)
		};
	}),
	resetSchema: () => {
		allowFactoryWrite = true;
		const next = cloneSchema();
		persistSchema(next, true);
		set({
			schema: next,
			filters: {}
		});
	},
	resetWorld: () => {
		const s = get();
		allowFactoryWrite = true;
		const floors = factoryFloors();
		const rooms = factoryRooms();
		const fixtures = factoryFixtures();
		const characters = factoryCharacters();
		persistWorld(floors, rooms, true, fixtures, {
			characters,
			tokens: {}
		});
		persistSchema(cloneSchema(), true);
		set({
			...takeHistory(s, "world"),
			floors,
			rooms,
			fixtures,
			characters,
			placingTokenId: null,
			schema: cloneSchema(),
			floorId: floors[0].id,
			selectedId: null,
			selectedMarkId: null,
			filters: {},
			notes: {},
			sceneRoomId: null,
			explored: {},
			tokens: {},
			tool: "select",
			drawShape: "rect",
			stairStyle: "straight",
			future: []
		});
	},
	wander: () => {
		const { floorId, query, filters, rooms, schema } = get();
		const pool = resolveFloor(floorId, rooms, schema).filter((r) => roomMatches(r, schema, filters, query));
		if (pool.length === 0) return null;
		const pick = pool[Math.floor(Math.random() * pool.length)];
		get().select(pick.id);
		return pick.id;
	},
	resetSession: () => set((s) => ({
		tokens: defaultTokens(s.characters),
		notes: {},
		sceneRoomId: null,
		explored: {},
		selectedId: firstRoomOn(s.rooms, s.floorId),
		placingTokenId: null
	}))
}), {
	name: STORAGE_KEY,
	version: 6,
	skipHydration: true,
	storage: createJSONStorage(syncStorage),
	partialize: (s) => ({
		tokens: s.tokens,
		notes: s.notes,
		sceneRoomId: s.sceneRoomId,
		explored: s.explored,
		floorId: s.floorId,
		selectedId: s.selectedId,
		schema: s.schema,
		floors: s.floors,
		rooms: s.rooms,
		fixtures: s.fixtures,
		characters: s.characters,
		appearance: useThemeStore.getState().theme
	}),
	merge: (persisted, current) => {
		if (manualHydrateDone) return current;
		const p = normalizeSlice(persisted ?? {});
		return {
			...current,
			...p,
			schema: p.schema ?? current.schema,
			floors: p.floors ?? current.floors,
			rooms: p.rooms ?? current.rooms,
			fixtures: p.fixtures ?? current.fixtures,
			characters: p.characters ?? current.characters,
			filters: {},
			tool: "select",
			drawShape: "rect",
			stairStyle: "straight",
			selectedMarkId: null,
			history: [],
			future: []
		};
	},
	migrate: (persisted, version) => {
		const rec = persisted ?? {};
		if (version < 5) {
			delete rec.edits;
			if (rec.schema !== void 0) rec.schema = scrubLegacySchema(sanitizeSchema(rec.schema));
			if (rec.floors !== void 0 || rec.rooms !== void 0) {
				const floors = sanitizeFloors(rec.floors);
				const world = scrubLegacyWorld(floors, sanitizeRooms(rec.rooms, floors));
				rec.floors = world.floors;
				rec.rooms = world.rooms;
			}
		}
		if (version < 6 && rec.characters === void 0) rec.characters = [];
		return rec;
	}
}));
function restoreAppearance(raw) {
	if (loadPersisted()) return;
	const theme = sanitizeTheme(raw);
	if (!theme) return;
	applyPersistedTheme(theme);
	persistTheme(theme);
}
function hydrateAtlas() {
	if (typeof window === "undefined") return;
	const raw = readPersistedRaw();
	if (raw) {
		const slice = normalizeSlice(raw);
		let scrubbed = false;
		if (slice.schema && isLegacyFactorySchema(slice.schema)) {
			slice.schema = [];
			scrubbed = true;
		}
		if (slice.floors && slice.rooms && isLegacyFactoryWorld(slice.floors, slice.rooms)) {
			const world = factoryWorld();
			slice.floors = world.floors;
			slice.rooms = world.rooms;
			slice.fixtures = world.fixtures;
			slice.floorId = world.floors[0].id;
			slice.selectedId = null;
			slice.characters = world.characters;
			slice.tokens = world.tokens;
			scrubbed = true;
		}
		if (Object.keys(slice).length) useAtlas.setState({
			...slice,
			filters: {},
			tool: "select",
			history: [],
			future: []
		});
		if (scrubbed) {
			allowFactoryWrite = true;
			const s = useAtlas.getState();
			persistSchema(s.schema, true);
			persistWorld(s.floors, s.rooms, true, s.fixtures);
		}
		restoreAppearance(raw.appearance);
	}
	applyDedicatedConfig();
	manualHydrateDone = true;
	persistReady = true;
	useAtlas.persist.rehydrate();
	document.documentElement.dataset.atlasHydrated = "1";
}
function applyDedicatedConfig() {
	const schemaRaw = loadPersistedSchema();
	const worldRaw = loadPersistedWorld();
	const live = useAtlas.getState();
	const patch = { filters: {} };
	if (schemaRaw) {
		const schema = scrubLegacySchema(schemaRaw);
		patch.schema = schema;
		if (isLegacyFactorySchema(schemaRaw)) {
			allowFactoryWrite = true;
			persistSchema(schema, true);
		}
	}
	if (worldRaw) {
		const world = scrubLegacyWorld(worldRaw.floors, worldRaw.rooms, worldRaw.fixtures, worldRaw.characters, worldRaw.tokens);
		const liveRich = !isFactoryWorld(live.floors, live.rooms, live.fixtures, live.characters);
		const incomingFactory = isFactoryWorld(world.floors, world.rooms, world.fixtures, world.characters);
		if (isLegacyFactoryWorld(worldRaw.floors, worldRaw.rooms)) {
			allowFactoryWrite = true;
			persistWorld(world.floors, world.rooms, true, world.fixtures, {
				characters: world.characters,
				tokens: world.tokens
			});
		}
		if (!(liveRich && incomingFactory)) {
			patch.floors = world.floors;
			patch.rooms = world.rooms;
			patch.fixtures = world.fixtures;
			if (worldRaw.hasCharacters) patch.characters = world.characters;
			if (worldRaw.hasTokens) patch.tokens = world.tokens;
			if (!world.floors.some((f) => f.id === live.floorId)) {
				patch.floorId = world.floors[0]?.id ?? live.floorId;
				patch.selectedId = firstRoomOn(world.rooms, patch.floorId ?? world.floors[0]?.id ?? "");
			}
		}
	}
	if (patch.schema || patch.floors || patch.rooms || patch.fixtures || patch.characters || patch.tokens) useAtlas.setState({
		...patch,
		filters: patch.schema ? pruneFilters(live.filters, patch.schema) : live.filters
	});
}
if (typeof window !== "undefined") {
	if (document.documentElement.dataset.atlasHydrated === "1") hydrateAtlas();
	if (!document.documentElement.dataset.atlasPersistFlush) {
		document.documentElement.dataset.atlasPersistFlush = "1";
		window.addEventListener("pagehide", flushPersistWrite);
		document.addEventListener("visibilitychange", () => {
			if (document.visibilityState === "hidden") flushPersistWrite();
		});
	}
}
function isPersistReady() {
	return persistReady;
}
function flushLivePersist() {
	if (typeof window === "undefined") return;
	persistReady = true;
	flushPersistWrite();
	try {
		const s = useAtlas.getState();
		const snapshot = {
			state: {
				tokens: s.tokens,
				notes: s.notes,
				sceneRoomId: s.sceneRoomId,
				explored: s.explored,
				floorId: s.floorId,
				selectedId: s.selectedId,
				schema: s.schema,
				floors: s.floors,
				rooms: s.rooms,
				fixtures: s.fixtures,
				characters: s.characters,
				appearance: useThemeStore.getState().theme
			},
			version: 6
		};
		writePersistNow(STORAGE_KEY, JSON.stringify(snapshot));
		persistSchema(s.schema);
		persistWorld(s.floors, s.rooms, false, s.fixtures);
	} catch {}
}
function captureConfigPayload() {
	const s = useAtlas.getState();
	const ui = useUiStore.getState();
	return JSON.parse(JSON.stringify({
		schema: s.schema,
		floors: s.floors,
		rooms: s.rooms,
		fixtures: s.fixtures,
		characters: s.characters,
		tokens: s.tokens,
		appearance: useThemeStore.getState().theme,
		copy: ui.copy,
		chrome: ui.chrome
	}));
}
function applyConfigPayload(raw, opts = {}) {
	if (!raw || typeof raw !== "object") return false;
	const rec = raw;
	const slice = normalizeSlice(rec);
	const theme = sanitizeTheme(rec.appearance);
	const applyAppearance = opts.appearance !== false;
	const applyUi = opts.ui !== false;
	if (slice.schema === void 0 && slice.floors === void 0 && slice.rooms === void 0 && slice.fixtures === void 0 && slice.characters === void 0 && !theme && rec.copy === void 0 && rec.chrome === void 0) return false;
	allowFactoryWrite = true;
	persistReady = true;
	const patch = {
		filters: {},
		tool: "select",
		history: [],
		future: []
	};
	if (slice.schema !== void 0) patch.schema = slice.schema;
	if (slice.floors !== void 0) patch.floors = slice.floors;
	if (slice.rooms !== void 0) patch.rooms = slice.rooms;
	if (slice.fixtures !== void 0) patch.fixtures = slice.fixtures;
	if (slice.characters !== void 0) patch.characters = slice.characters;
	if (slice.tokens !== void 0) patch.tokens = slice.tokens;
	if (slice.floorId) patch.floorId = slice.floorId;
	if (slice.selectedId !== void 0) patch.selectedId = slice.selectedId;
	useAtlas.setState(patch);
	if (theme && applyAppearance) {
		applyPersistedTheme(theme);
		persistTheme(theme);
	}
	if (applyUi && (rec.copy !== void 0 || rec.chrome !== void 0)) hydrateUi({
		copy: rec.copy !== void 0 ? sanitizeCopy(rec.copy) : void 0,
		chrome: rec.chrome !== void 0 ? sanitizeChrome(rec.chrome) : void 0
	});
	const s = useAtlas.getState();
	persistSchema(s.schema, true);
	persistWorld(s.floors, s.rooms, true, s.fixtures, {
		characters: s.characters,
		tokens: s.tokens
	});
	return true;
}
function roomMatches(room, schema, filters, query) {
	const props = room.props ?? {};
	for (const def of schema) {
		if (!def.filterable) continue;
		const filter = filters[def.id];
		if (!filter || filter === "tous") continue;
		const value = readProp(props, def);
		if (def.type === "tags") {
			if (!(Array.isArray(value) ? value : []).includes(filter)) return false;
		} else if (def.type === "choice") {
			if (value !== filter) return false;
		} else if (!String(value ?? "").toLowerCase().includes(filter.toLowerCase())) return false;
	}
	const q = query.trim().toLowerCase();
	if (!q) return true;
	return `${room.name} ${room.label} ${room.description}`.toLowerCase().includes(q);
}
var SAVE_FILE_KIND = "atlas-bellarosa-save";
var LS_KEY$1 = "atlas-bellarosa-saves";
var MAX_NAMED = 24;
var MAX_AUTO = 12;
var AUTO_WAIT_MS = 900;
function clone(value) {
	return JSON.parse(JSON.stringify(value));
}
function asConfig(raw) {
	if (!raw || typeof raw !== "object") return null;
	const t = raw;
	const source = t.payload && typeof t.payload === "object" ? t.payload : t;
	if (source.schema === void 0 && source.floors === void 0 && source.rooms === void 0 && source.appearance === void 0 && source.edits === void 0) return null;
	return {
		schema: source.schema ?? [],
		floors: source.floors ?? [],
		rooms: source.rooms ?? [],
		fixtures: source.fixtures ?? [],
		characters: source.characters ?? [],
		tokens: source.tokens ?? {},
		appearance: source.appearance,
		copy: source.copy,
		chrome: source.chrome
	};
}
function fingerprint(payload) {
	return JSON.stringify({
		schema: payload.schema,
		floors: payload.floors,
		rooms: payload.rooms,
		fixtures: payload.fixtures ?? [],
		characters: payload.characters ?? [],
		tokens: payload.tokens ?? {},
		appearance: payload.appearance,
		copy: payload.copy,
		chrome: payload.chrome
	});
}
function mergeById(list) {
	const map = /* @__PURE__ */ new Map();
	for (const item of list) {
		const prev = map.get(item.id);
		if (!prev || item.savedAt >= prev.savedAt) map.set(item.id, item);
	}
	return [...map.values()].sort((a, b) => b.savedAt - a.savedAt);
}
function sanitizeRecord(raw) {
	if (!raw || typeof raw !== "object") return null;
	const t = raw;
	const id = typeof t.id === "string" && t.id ? t.id : "";
	const name = typeof t.name === "string" ? t.name.trim() : "";
	const savedAt = typeof t.savedAt === "number" ? t.savedAt : 0;
	const kind = t.kind === "auto" ? "auto" : "named";
	const payload = asConfig(t.payload ?? t);
	if (!id || !savedAt || !payload) return null;
	return {
		id,
		name: name || (kind === "auto" ? "Copie automatique" : "Réglages"),
		kind,
		savedAt,
		payload
	};
}
function sanitizeCatalog(raw) {
	if (!raw || typeof raw !== "object") return {
		named: [],
		autos: []
	};
	const t = raw;
	const named = [];
	const autos = [];
	if (Array.isArray(t.named)) for (const item of t.named) {
		const rec = sanitizeRecord(item);
		if (rec) named.push({
			...rec,
			kind: "named"
		});
	}
	if (Array.isArray(t.autos)) for (const item of t.autos) {
		const rec = sanitizeRecord(item);
		if (rec) autos.push({
			...rec,
			kind: "auto"
		});
	}
	return {
		named: mergeById(named).slice(0, MAX_NAMED),
		autos: mergeById(autos).slice(0, MAX_AUTO)
	};
}
function mergeCatalogs(a, b) {
	return {
		named: mergeById([...a.named, ...b.named]).slice(0, MAX_NAMED),
		autos: mergeById([...a.autos, ...b.autos]).slice(0, MAX_AUTO)
	};
}
function readLocal$1() {
	if (typeof window === "undefined") return {
		named: [],
		autos: []
	};
	try {
		const raw = localStorage.getItem(LS_KEY$1);
		if (!raw) return {
			named: [],
			autos: []
		};
		return sanitizeCatalog(JSON.parse(raw));
	} catch {
		return {
			named: [],
			autos: []
		};
	}
}
function writeLocal$1(catalog) {
	if (typeof window === "undefined") return;
	localStorage.setItem(LS_KEY$1, JSON.stringify(catalog));
}
function openDb() {
	return openAtlasDb();
}
async function readIdb$1() {
	const db = await openDb();
	if (!db) return {
		named: [],
		autos: []
	};
	return new Promise((resolve) => {
		try {
			const req = db.transaction(IDB_CATALOG, "readonly").objectStore(IDB_CATALOG).get("main");
			req.onsuccess = () => resolve(sanitizeCatalog(req.result));
			req.onerror = () => resolve({
				named: [],
				autos: []
			});
		} catch {
			resolve({
				named: [],
				autos: []
			});
		}
	});
}
async function writeIdb$1(catalog) {
	const db = await openDb();
	if (!db) return;
	try {
		db.transaction(IDB_CATALOG, "readwrite").objectStore(IDB_CATALOG).put(catalog, "main");
	} catch {}
}
function persistCatalog(catalog) {
	try {
		writeLocal$1(catalog);
	} catch {}
	writeIdb$1(catalog);
}
var useSaveCatalog = create(() => ({
	named: [],
	autos: [],
	loaded: false,
	lastAutoAt: null
}));
function setCatalog(catalog) {
	useSaveCatalog.setState({
		named: catalog.named,
		autos: catalog.autos,
		loaded: true,
		lastAutoAt: catalog.autos[0]?.savedAt ?? useSaveCatalog.getState().lastAutoAt
	});
	persistCatalog(catalog);
}
async function hydrateSaves() {
	if (typeof window === "undefined") return;
	const merged = mergeCatalogs(readLocal$1(), await readIdb$1());
	useSaveCatalog.setState({
		named: merged.named,
		autos: merged.autos,
		loaded: true,
		lastAutoAt: merged.autos[0]?.savedAt ?? null
	});
	persistCatalog(merged);
}
function appearanceOf(payload) {
	return sanitizeTheme(payload.appearance);
}
function saveBlurb(payload) {
	const nProps = payload.schema?.length ?? 0;
	const nRooms = payload.rooms?.length ?? 0;
	const nFloors = payload.floors?.length ?? 0;
	const parts = [];
	parts.push("Apparence personnalisée");
	parts.push(nProps === 0 ? "Sans propriétés" : `${nProps} propriété${nProps > 1 ? "s" : ""}`);
	parts.push(`${nFloors} étage${nFloors > 1 ? "s" : ""} · ${nRooms} pièce${nRooms > 1 ? "s" : ""}`);
	return parts.join(" · ");
}
function formatSavedAt(ts) {
	return new Date(ts).toLocaleString("fr-FR", {
		dateStyle: "short",
		timeStyle: "short"
	});
}
function defaultSaveName() {
	return `Réglages ${(/* @__PURE__ */ new Date()).toLocaleDateString("fr-FR", {
		day: "numeric",
		month: "short"
	})}`;
}
function createNamedSave(name) {
	const trimmed = name.trim() || defaultSaveName();
	const record = {
		id: uid("save"),
		name: trimmed.slice(0, 64),
		kind: "named",
		savedAt: Date.now(),
		payload: captureConfigPayload()
	};
	const state = useSaveCatalog.getState();
	setCatalog({
		named: mergeById([record, ...state.named]).slice(0, MAX_NAMED),
		autos: state.autos
	});
	lastFingerprint = fingerprint(record.payload);
	return record;
}
function overwriteSave(id) {
	const state = useSaveCatalog.getState();
	const prev = state.named.find((s) => s.id === id);
	if (!prev) return null;
	const next = {
		...prev,
		savedAt: Date.now(),
		payload: captureConfigPayload()
	};
	setCatalog({
		named: mergeById([next, ...state.named]).slice(0, MAX_NAMED),
		autos: state.autos
	});
	lastFingerprint = fingerprint(next.payload);
	return next;
}
function deleteSave(id) {
	const state = useSaveCatalog.getState();
	setCatalog({
		named: state.named.filter((s) => s.id !== id),
		autos: state.autos.filter((s) => s.id !== id)
	});
}
function restoreSave(id) {
	const state = useSaveCatalog.getState();
	const rec = state.named.find((s) => s.id === id) ?? state.autos.find((s) => s.id === id);
	if (!rec) return false;
	const ok = applyConfigPayload(clone(rec.payload));
	if (ok) lastFingerprint = fingerprint(rec.payload);
	return ok;
}
function toSaveFile(record) {
	return {
		kind: SAVE_FILE_KIND,
		version: 2,
		name: record.name,
		savedAt: record.savedAt,
		payload: record.payload
	};
}
function parseSaveFile(raw) {
	const payload = asConfig(raw);
	if (!payload) return null;
	const t = raw;
	return {
		kind: SAVE_FILE_KIND,
		version: typeof t.version === "number" ? t.version : 2,
		name: typeof t.name === "string" && t.name.trim() ? t.name.trim() : "Réglages importés",
		savedAt: typeof t.savedAt === "number" ? t.savedAt : Date.now(),
		payload
	};
}
function importSaveFile(raw, restore = true) {
	const file = parseSaveFile(raw);
	if (!file) return null;
	const record = {
		id: uid("save"),
		name: file.name.slice(0, 64),
		kind: "named",
		savedAt: Date.now(),
		payload: file.payload
	};
	const state = useSaveCatalog.getState();
	setCatalog({
		named: mergeById([record, ...state.named]).slice(0, MAX_NAMED),
		autos: state.autos
	});
	if (restore) {
		applyConfigPayload(clone(file.payload));
		lastFingerprint = fingerprint(file.payload);
	}
	return record;
}
function downloadSave(record) {
	const file = toSaveFile(record);
	const blob = new Blob([JSON.stringify(file, null, 2)], { type: "application/json" });
	const slug = file.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 32) || "reglages";
	const day = new Date(file.savedAt).toISOString().slice(0, 10);
	const a = document.createElement("a");
	a.href = URL.createObjectURL(blob);
	a.download = `bellarosa-reglages-${day}-${slug}.json`;
	document.body.appendChild(a);
	a.click();
	a.remove();
	window.setTimeout(() => URL.revokeObjectURL(a.href), 1e3);
}
function downloadCurrent(name) {
	downloadSave({
		name: name?.trim() || defaultSaveName(),
		savedAt: Date.now(),
		payload: captureConfigPayload()
	});
}
function noteConfigSaved(payload) {
	lastFingerprint = fingerprint(payload);
}
function journalAutosave() {
	if (!isPersistReady()) return;
	const payload = captureConfigPayload();
	const fp = fingerprint(payload);
	if (fp === lastFingerprint) return;
	lastFingerprint = fp;
	const record = {
		id: uid("auto"),
		name: "Copie automatique",
		kind: "auto",
		savedAt: Date.now(),
		payload
	};
	const state = useSaveCatalog.getState();
	setCatalog({
		named: state.named,
		autos: mergeById([record, ...state.autos]).slice(0, MAX_AUTO)
	});
}
var lastFingerprint = "";
var autoTimer;
var autosaveStarted = false;
function scheduleAutosave() {
	if (!isPersistReady()) return;
	if (autoTimer) clearTimeout(autoTimer);
	autoTimer = setTimeout(journalAutosave, AUTO_WAIT_MS);
}
function startAutosave() {
	if (typeof window === "undefined" || autosaveStarted) return;
	autosaveStarted = true;
	lastFingerprint = fingerprint(captureConfigPayload());
	useAtlas.subscribe((s, prev) => {
		if (s.schema === prev.schema && s.floors === prev.floors && s.rooms === prev.rooms && s.fixtures === prev.fixtures && s.characters === prev.characters && s.tokens === prev.tokens) return;
		scheduleAutosave();
	});
	useThemeStore.subscribe(() => scheduleAutosave());
	window.addEventListener("pagehide", () => {
		if (autoTimer) {
			clearTimeout(autoTimer);
			autoTimer = void 0;
		}
		journalAutosave();
	});
	document.addEventListener("visibilitychange", () => {
		if (document.visibilityState === "hidden") journalAutosave();
	});
}
var LS_KEY = "atlas-bellarosa-prefs";
var usePrefs = create(() => ({
	lastSaved: null,
	lastSavedAt: null,
	saving: false,
	loaded: false
}));
function fingerprintConfig(payload) {
	return JSON.stringify({
		schema: payload.schema,
		floors: payload.floors,
		rooms: payload.rooms,
		fixtures: payload.fixtures ?? [],
		characters: payload.characters ?? [],
		tokens: payload.tokens ?? {},
		appearance: payload.appearance,
		copy: payload.copy ?? DEFAULT_COPY,
		chrome: payload.chrome ?? DEFAULT_CHROME
	});
}
function factoryPayload() {
	return {
		schema: cloneSchema(),
		floors: factoryFloors(),
		rooms: factoryRooms(),
		fixtures: [],
		characters: [],
		tokens: {},
		appearance: DEFAULT_THEME,
		copy: DEFAULT_COPY,
		chrome: DEFAULT_CHROME
	};
}
function isFactoryConfig(payload) {
	return fingerprintConfig(payload) === fingerprintConfig(factoryPayload());
}
function parseRecord(raw) {
	if (!raw || typeof raw !== "object") return null;
	const t = raw;
	const savedAt = typeof t.savedAt === "number" ? t.savedAt : 0;
	const payload = t.payload;
	if (!savedAt || !payload || typeof payload !== "object") return null;
	const p = payload;
	const floorsRaw = Array.isArray(p.floors) ? sanitizeFloors(p.floors) : factoryFloors();
	const roomsRaw = Array.isArray(p.rooms) ? sanitizeRooms(p.rooms, floorsRaw) : [];
	const fixturesRaw = sanitizeFixtures(p.fixtures, floorsRaw);
	const charactersRaw = sanitizeCharacters(p.characters);
	const tokensRaw = sanitizeTokenMap(p.tokens, roomsRaw, floorsRaw, charactersRaw);
	const world = isLegacyFactoryWorld(floorsRaw, roomsRaw) ? scrubLegacyWorld(floorsRaw, roomsRaw, fixturesRaw, charactersRaw, tokensRaw) : {
		floors: floorsRaw,
		rooms: roomsRaw,
		fixtures: fixturesRaw,
		characters: charactersRaw,
		tokens: tokensRaw
	};
	return {
		savedAt,
		payload: {
			schema: scrubLegacySchema(sanitizeSchema(p.schema)),
			floors: world.floors,
			rooms: world.rooms,
			fixtures: world.fixtures,
			characters: world.characters,
			tokens: world.tokens,
			appearance: p.appearance,
			copy: sanitizeCopy(p.copy),
			chrome: sanitizeChrome(p.chrome)
		}
	};
}
function readLocal() {
	if (typeof window === "undefined") return null;
	try {
		const raw = localStorage.getItem(LS_KEY);
		if (!raw) return null;
		return parseRecord(JSON.parse(raw));
	} catch {
		return null;
	}
}
function writeLocal(record) {
	if (typeof window === "undefined") return false;
	try {
		const raw = JSON.stringify(record);
		localStorage.setItem(LS_KEY, raw);
		if (localStorage.getItem(LS_KEY) !== raw) localStorage.setItem(LS_KEY, raw);
		return localStorage.getItem(LS_KEY) === raw;
	} catch {
		return false;
	}
}
async function readIdb() {
	const db = await openAtlasDb();
	if (!db) return null;
	return new Promise((resolve) => {
		try {
			const req = db.transaction(IDB_PREFS, "readonly").objectStore(IDB_PREFS).get("committed");
			req.onsuccess = () => resolve(parseRecord(req.result));
			req.onerror = () => resolve(null);
		} catch {
			resolve(null);
		}
	});
}
async function writeIdb(record) {
	const db = await openAtlasDb();
	if (!db) return false;
	return new Promise((resolve) => {
		try {
			const tx = db.transaction(IDB_PREFS, "readwrite");
			tx.objectStore(IDB_PREFS).put(record, "committed");
			tx.oncomplete = () => resolve(true);
			tx.onerror = () => resolve(false);
		} catch {
			resolve(false);
		}
	});
}
function newest(records) {
	const list = records.filter((r) => Boolean(r));
	const rich = list.filter((r) => !isFactoryConfig(r.payload));
	const pool = rich.length ? rich : list;
	let best = null;
	for (const rec of pool) if (!best || rec.savedAt >= best.savedAt) best = rec;
	return best;
}
function rememberCommitted(record) {
	usePrefs.setState({
		lastSaved: record.payload,
		lastSavedAt: record.savedAt,
		loaded: true
	});
}
function applyCommitted(record, opts = {}) {
	const keepLocalTheme = Boolean(loadPersisted());
	const applyAppearance = opts.appearance === true || !keepLocalTheme && opts.appearance !== false;
	const keepLocalUi = hasLocalUi() && opts.ui !== true;
	applyConfigPayload(record.payload, {
		appearance: applyAppearance,
		ui: !keepLocalUi
	});
	if (applyAppearance) {
		const theme = sanitizeTheme(record.payload.appearance);
		if (theme) persistTheme(theme);
	}
	if (!keepLocalUi) hydrateUi({
		copy: record.payload.copy,
		chrome: record.payload.chrome
	});
	flushLivePersist();
	rememberCommitted(record);
	noteConfigSaved(record.payload);
}
var autoApplyAllowed = true;
function tryRecover(record) {
	if (autoApplyAllowed) {
		if (isFactoryConfig(captureConfigPayload()) && !isFactoryConfig(record.payload)) {
			applyCommitted(record);
			persistSchema(record.payload.schema, true);
			persistWorld(record.payload.floors, record.payload.rooms, true, record.payload.fixtures, {
				characters: record.payload.characters,
				tokens: record.payload.tokens
			});
			return true;
		}
	}
	return recoverMissingSlices(record);
}
function recoverMissingSlices(record) {
	const live = captureConfigPayload();
	const saved = record.payload;
	const patch = {};
	const liveSchemaFactory = schemasEqual(live.schema ?? [], cloneSchema());
	const savedSchema = scrubLegacySchema(sanitizeSchema(saved.schema));
	if (liveSchemaFactory && !schemasEqual(savedSchema, cloneSchema())) {
		patch.schema = savedSchema;
		patch.filters = {};
	}
	const liveWorldFactory = isFactoryWorld(live.floors ?? [], live.rooms ?? [], live.fixtures ?? [], live.characters ?? []);
	const savedWorld = scrubLegacyWorld(saved.floors ?? factoryFloors(), saved.rooms ?? [], saved.fixtures ?? [], saved.characters ?? [], saved.tokens ?? {});
	if (liveWorldFactory && !isFactoryWorld(savedWorld.floors, savedWorld.rooms, savedWorld.fixtures, savedWorld.characters)) {
		patch.floors = savedWorld.floors;
		patch.rooms = savedWorld.rooms;
		patch.fixtures = savedWorld.fixtures;
		patch.characters = savedWorld.characters;
		patch.tokens = savedWorld.tokens;
	}
	if (!patch.schema && !patch.floors && !patch.rooms && !patch.fixtures && !patch.characters) return false;
	useAtlas.setState(patch);
	if (patch.schema) persistSchema(patch.schema);
	if (patch.floors || patch.rooms || patch.fixtures || patch.characters) {
		const s = useAtlas.getState();
		persistWorld(s.floors, s.rooms, true, s.fixtures, {
			characters: s.characters,
			tokens: s.tokens
		});
	}
	flushLivePersist();
	rememberCommitted(record);
	return true;
}
function isConfigDirty() {
	const current = captureConfigPayload();
	const baseline = usePrefs.getState().lastSaved ?? factoryPayload();
	return fingerprintConfig(current) !== fingerprintConfig(baseline);
}
function useConfigDirty() {
	const lastSaved = usePrefs((s) => s.lastSaved);
	usePrefs((s) => s.loaded);
	const current = {
		schema: useAtlas((s) => s.schema),
		floors: useAtlas((s) => s.floors),
		rooms: useAtlas((s) => s.rooms),
		fixtures: useAtlas((s) => s.fixtures),
		characters: useAtlas((s) => s.characters),
		tokens: useAtlas((s) => s.tokens),
		appearance: useThemeStore((s) => s.theme),
		copy: useUiStore((s) => s.copy),
		chrome: useUiStore((s) => s.chrome)
	};
	const baseline = lastSaved ?? factoryPayload();
	return fingerprintConfig(current) !== fingerprintConfig(baseline);
}
async function persistRecord(record) {
	const lsOk = writeLocal(record);
	const idbOk = await writeIdb(record);
	let cloudOk = false;
	try {
		const res = await Promise.race([saveCloudPrefs({ data: {
			savedAt: record.savedAt,
			payloadJson: JSON.stringify(record.payload)
		} }), new Promise((resolve) => setTimeout(() => resolve({ ok: false }), 2500))]);
		cloudOk = Boolean(res && res.ok);
	} catch {
		cloudOk = false;
	}
	const theme = sanitizeTheme(record.payload.appearance);
	if (theme) persistTheme(theme);
	persistSchema(record.payload.schema, true);
	persistWorld(record.payload.floors, record.payload.rooms, true, record.payload.fixtures, {
		characters: record.payload.characters,
		tokens: record.payload.tokens
	});
	hydrateUi({
		copy: record.payload.copy,
		chrome: record.payload.chrome
	});
	flushLivePersist();
	return lsOk || idbOk || cloudOk;
}
async function adoptPreferences(payload) {
	const record = {
		savedAt: Date.now(),
		payload
	};
	usePrefs.setState({
		lastSaved: payload,
		lastSavedAt: record.savedAt
	});
	noteConfigSaved(payload);
	return persistRecord(record);
}
var hydratePromise = null;
function hydratePrefs() {
	if (typeof window === "undefined") return Promise.resolve();
	if (usePrefs.getState().loaded) return Promise.resolve();
	if (!hydratePromise) hydratePromise = doHydratePrefs();
	return hydratePromise;
}
async function doHydratePrefs() {
	startPrefsGuards();
	try {
		const local = readLocal();
		if (local) {
			rememberCommitted(local);
			tryRecover(local);
		}
		let server = null;
		let idb = null;
		let catalogSchema = null;
		let catalogWorld = null;
		try {
			const [cloud, remote, catSchema, catWorld] = await Promise.all([
				loadCloudPrefs().catch(() => null),
				readIdb(),
				getCatalog("schema"),
				getCatalog("world")
			]);
			try {
				server = cloud ? parseRecord({
					savedAt: cloud.savedAt,
					payload: JSON.parse(cloud.payloadJson)
				}) : null;
			} catch {
				server = null;
			}
			idb = remote;
			catalogSchema = catSchema;
			catalogWorld = catWorld;
		} catch {}
		const best = newest([
			server,
			local,
			idb
		]);
		if (best) {
			rememberCommitted(best);
			tryRecover(best);
			try {
				writeLocal(best);
				writeIdb(best);
			} catch {}
		} else usePrefs.setState({ loaded: true });
		const liveAfter = captureConfigPayload();
		if (Array.isArray(catalogSchema)) {
			const schema = scrubLegacySchema(sanitizeSchema(catalogSchema));
			if (schemasEqual(liveAfter.schema, cloneSchema()) && !schemasEqual(schema, cloneSchema())) {
				useAtlas.setState({
					schema,
					filters: {}
				});
				persistSchema(schema, true);
			}
		}
		if (catalogWorld && typeof catalogWorld === "object") {
			const rec = catalogWorld;
			const floors = sanitizeFloors(rec.floors);
			const rooms = sanitizeRooms(rec.rooms, floors);
			const fixtures = sanitizeFixtures(rec.fixtures, floors);
			const characters = sanitizeCharacters(rec.characters);
			const world = scrubLegacyWorld(floors, rooms, fixtures, characters, sanitizeTokenMap(rec.tokens, rooms, floors, characters));
			const live = useAtlas.getState();
			if (isFactoryWorld(live.floors, live.rooms, live.fixtures, live.characters) && !isFactoryWorld(world.floors, world.rooms, world.fixtures, world.characters)) {
				useAtlas.setState({
					floors: world.floors,
					rooms: world.rooms,
					fixtures: world.fixtures,
					characters: world.characters,
					tokens: world.tokens
				});
				persistWorld(world.floors, world.rooms, true, world.fixtures, {
					characters: world.characters,
					tokens: world.tokens
				});
			}
		}
	} catch {
		usePrefs.setState({ loaded: true });
	} finally {
		try {
			applyDedicatedConfig();
		} catch {}
		autoApplyAllowed = false;
		if (typeof document !== "undefined") document.documentElement.dataset.prefsHydrated = "1";
	}
}
async function restoreCloudPreferences() {
	try {
		const cloud = await loadCloudPrefs();
		const record = cloud ? parseRecord({
			savedAt: cloud.savedAt,
			payload: JSON.parse(cloud.payloadJson)
		}) : null;
		if (!record) return false;
		applyCommitted(record, {
			appearance: true,
			ui: true
		});
		writeLocal(record);
		writeIdb(record);
		return true;
	} catch {
		return false;
	}
}
async function savePreferences() {
	if (typeof window === "undefined") return false;
	const payload = captureConfigPayload();
	const record = {
		savedAt: Date.now(),
		payload
	};
	usePrefs.setState({ saving: true });
	try {
		const ok = await persistRecord(record);
		if (!ok) writeLocal(record);
		const verified = readLocal();
		const match = verified && fingerprintConfig(verified.payload) === fingerprintConfig(payload);
		if (!ok && !match) {
			usePrefs.setState({ saving: false });
			return false;
		}
		usePrefs.setState({
			lastSaved: payload,
			lastSavedAt: record.savedAt,
			saving: false
		});
		noteConfigSaved(payload);
		lastCloudFp = fingerprintConfig(payload);
		return true;
	} catch {
		usePrefs.setState({ saving: false });
		return false;
	}
}
var guardsStarted = false;
function startPrefsGuards() {
	if (typeof window === "undefined" || guardsStarted) return;
	guardsStarted = true;
	window.addEventListener("beforeunload", (event) => {
		if (!isConfigDirty()) return;
		event.preventDefault();
		event.returnValue = "";
	});
	window.addEventListener("storage", (event) => {
		if (event.key !== LS_KEY || !event.newValue) return;
		try {
			const rec = parseRecord(JSON.parse(event.newValue));
			if (!rec) return;
			rememberCommitted(rec);
			tryRecover(rec);
		} catch {}
	});
}
var cloudTimer;
var cloudAutosaveStarted = false;
var lastCloudFp = "";
var cloudBusy = false;
async function flushCloudAutosave() {
	if (cloudTimer) {
		clearTimeout(cloudTimer);
		cloudTimer = void 0;
	}
	if (cloudBusy) return;
	const payload = captureConfigPayload();
	const last = usePrefs.getState().lastSaved;
	if (isFactoryConfig(payload) && last && !isFactoryConfig(last)) return;
	const fp = fingerprintConfig(payload);
	if (fp === lastCloudFp) return;
	cloudBusy = true;
	try {
		const record = {
			savedAt: Date.now(),
			payload
		};
		writeLocal(record);
		writeIdb(record);
		persistSchema(payload.schema, true);
		persistWorld(payload.floors, payload.rooms, true, payload.fixtures, {
			characters: payload.characters,
			tokens: payload.tokens
		});
		flushLivePersist();
		const res = await Promise.race([saveCloudPrefs({ data: {
			savedAt: record.savedAt,
			payloadJson: JSON.stringify(record.payload)
		} }), new Promise((resolve) => setTimeout(() => resolve({ ok: false }), 2500))]);
		if (res && res.ok) {
			lastCloudFp = fp;
			rememberCommitted(record);
			noteConfigSaved(payload);
		}
	} catch {} finally {
		cloudBusy = false;
	}
}
function scheduleCloudSave() {
	if (cloudTimer) clearTimeout(cloudTimer);
	cloudTimer = setTimeout(() => {
		flushCloudAutosave();
	}, 1400);
}
/** Debounced cloud copy of the live plan when a session is connected. */
function startCloudAutosave() {
	if (typeof window === "undefined" || cloudAutosaveStarted) return;
	cloudAutosaveStarted = true;
	lastCloudFp = fingerprintConfig(captureConfigPayload());
	useAtlas.subscribe((s, prev) => {
		if (s.schema === prev.schema && s.floors === prev.floors && s.rooms === prev.rooms && s.fixtures === prev.fixtures && s.characters === prev.characters && s.tokens === prev.tokens) return;
		scheduleCloudSave();
	});
	useUiStore.subscribe(() => scheduleCloudSave());
	window.addEventListener("pagehide", () => {
		flushCloudAutosave();
	});
	document.addEventListener("visibilitychange", () => {
		if (document.visibilityState === "hidden") flushCloudAutosave();
	});
	window.setTimeout(() => {
		flushCloudAutosave();
	}, 1800);
}
function ThemeRoot({ children }) {
	const theme = useThemeStore((s) => s.theme);
	const skipFirst = (0, import_react.useRef)(true);
	(0, import_react.useLayoutEffect)(() => {
		hydrateTheme();
		hydrateUi();
		hydrateAtlas();
		const current = useThemeStore.getState().theme;
		applyTheme(current);
		ensureThemeFonts(current);
		hydratePrefs().then(() => {
			hydrateSaves();
			startAutosave();
			startCloudAutosave();
			const next = useThemeStore.getState().theme;
			applyTheme(next);
			ensureThemeFonts(next);
		});
	}, []);
	(0, import_react.useLayoutEffect)(() => {
		if (skipFirst.current) {
			skipFirst.current = false;
			return;
		}
		applyTheme(theme);
		ensureThemeFonts(theme);
	}, [theme]);
	return children;
}
var styles_default = "/*! tailwindcss v4.3.3 | MIT License | https://tailwindcss.com */\n@layer properties{@supports (((-webkit-hyphens:none)) and (not (margin-trim:inline))) or ((-moz-orient:inline) and (not (color:rgb(from red r g b)))){*,:before,:after,::backdrop{--tw-translate-x:0;--tw-translate-y:0;--tw-translate-z:0;--tw-scale-x:1;--tw-scale-y:1;--tw-scale-z:1;--tw-rotate-x:initial;--tw-rotate-y:initial;--tw-rotate-z:initial;--tw-skew-x:initial;--tw-skew-y:initial;--tw-space-y-reverse:0;--tw-border-style:solid;--tw-leading:initial;--tw-font-weight:initial;--tw-tracking:initial;--tw-ordinal:initial;--tw-slashed-zero:initial;--tw-numeric-figure:initial;--tw-numeric-spacing:initial;--tw-numeric-fraction:initial;--tw-shadow:0 0 #0000;--tw-shadow-color:initial;--tw-shadow-alpha:100%;--tw-inset-shadow:0 0 #0000;--tw-inset-shadow-color:initial;--tw-inset-shadow-alpha:100%;--tw-ring-color:initial;--tw-ring-shadow:0 0 #0000;--tw-inset-ring-color:initial;--tw-inset-ring-shadow:0 0 #0000;--tw-ring-inset:initial;--tw-ring-offset-width:0px;--tw-ring-offset-color:#fff;--tw-ring-offset-shadow:0 0 #0000;--tw-outline-style:solid;--tw-blur:initial;--tw-brightness:initial;--tw-contrast:initial;--tw-grayscale:initial;--tw-hue-rotate:initial;--tw-invert:initial;--tw-opacity:initial;--tw-saturate:initial;--tw-sepia:initial;--tw-drop-shadow:initial;--tw-drop-shadow-color:initial;--tw-drop-shadow-alpha:100%;--tw-drop-shadow-size:initial;--tw-backdrop-blur:initial;--tw-backdrop-brightness:initial;--tw-backdrop-contrast:initial;--tw-backdrop-grayscale:initial;--tw-backdrop-hue-rotate:initial;--tw-backdrop-invert:initial;--tw-backdrop-opacity:initial;--tw-backdrop-saturate:initial;--tw-backdrop-sepia:initial;--tw-duration:initial;--tw-ease:initial;--tw-content:\"\";--tw-animation-delay:0s;--tw-animation-direction:normal;--tw-animation-duration:initial;--tw-animation-fill-mode:none;--tw-animation-iteration-count:1;--tw-enter-blur:0;--tw-enter-opacity:1;--tw-enter-rotate:0;--tw-enter-scale:1;--tw-enter-translate-x:0;--tw-enter-translate-y:0;--tw-exit-blur:0;--tw-exit-opacity:1;--tw-exit-rotate:0;--tw-exit-scale:1;--tw-exit-translate-x:0;--tw-exit-translate-y:0}}}@layer theme{:root,:host{--font-sans:\"Figtree\", ui-sans-serif, system-ui, sans-serif;--font-mono:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace;--color-red-500:oklch(63.7% .237 25.331);--color-zinc-50:oklch(98.5% 0 none);--color-zinc-400:oklch(70.5% .015 286.067);--color-zinc-500:oklch(55.2% .016 285.938);--color-zinc-900:oklch(21% .006 285.885);--color-zinc-950:oklch(14.1% .005 285.823);--color-neutral-100:oklch(97% 0 none);--color-neutral-300:oklch(87% 0 none);--color-neutral-500:oklch(55.6% 0 none);--color-neutral-700:oklch(37.1% 0 none);--color-neutral-900:oklch(20.5% 0 none);--color-black:#000;--color-white:#fff;--spacing:.25rem;--container-sm:24rem;--container-md:28rem;--container-2xl:42rem;--container-3xl:48rem;--container-4xl:56rem;--container-6xl:72rem;--text-xs:.75rem;--text-xs--line-height:calc(1 / .75);--text-sm:.875rem;--text-sm--line-height:calc(1.25 / .875);--text-base:1rem;--text-base--line-height:calc(1.5 / 1);--text-lg:1.125rem;--text-lg--line-height:calc(1.75 / 1.125);--text-xl:1.25rem;--text-xl--line-height:calc(1.75 / 1.25);--text-2xl:1.5rem;--text-2xl--line-height:calc(2 / 1.5);--text-3xl:1.875rem;--text-3xl--line-height:calc(2.25 / 1.875);--text-4xl:2.25rem;--text-4xl--line-height:calc(2.5 / 2.25);--text-5xl:3rem;--text-5xl--line-height:1;--font-weight-medium:500;--font-weight-semibold:600;--tracking-tight:-.025em;--leading-tight:1.25;--leading-snug:1.375;--leading-normal:1.5;--leading-relaxed:1.625;--radius-xs:.125rem;--radius-sm:8px;--radius-md:12px;--radius-lg:16px;--radius-xl:24px;--radius-2xl:1rem;--ease-out:cubic-bezier(.23, 1, .32, 1);--ease-in-out:cubic-bezier(.4, 0, .2, 1);--animate-pulse:pulse 2s cubic-bezier(.4, 0, .6, 1) infinite;--default-transition-duration:.15s;--default-transition-timing-function:cubic-bezier(.4, 0, .2, 1);--default-font-family:var(--font-sans);--default-mono-font-family:var(--font-mono);--radius:12px;--color-background:#efe8d8;--color-foreground:#1f1c17;--color-paper:#f3eee4;--color-card:#f7f1e6;--color-card-foreground:#1f1c17;--color-muted:#e4dccb;--color-muted-foreground:#6b6458;--color-primary:#3f5344;--color-primary-foreground:#f3eee4;--color-secondary:#e4dccb;--color-secondary-foreground:#1f1c17;--color-accent:#e7dfcf;--color-accent-foreground:#1f1c17;--color-border:#d5ccbb;--color-input:#d5ccbb;--color-ring:#3f5344;--color-destructive:#8f3d32;--color-destructive-foreground:#f3eee4;--color-ink:#1f1c17;--color-stone:#b7a894;--color-clay:#8f3d32;--color-token-stella:#7a6a58;--color-token-antoine:#5d7380;--color-token-myriam:#3f5344;--font-display:\"Fraunces\", ui-serif, Georgia, \"Times New Roman\", serif}}@layer base{*,:after,:before,::backdrop{box-sizing:border-box;border:0 solid;margin:0;padding:0}::file-selector-button{box-sizing:border-box;border:0 solid;margin:0;padding:0}html,:host{-webkit-text-size-adjust:100%;tab-size:4;line-height:1.5;font-family:var(--default-font-family,-apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", \"Noto Sans\", Arial, sans-serif, \"Apple Color Emoji\", \"Segoe UI Emoji\", \"Segoe UI Symbol\", \"Noto Color Emoji\");font-feature-settings:var(--default-font-feature-settings,normal);font-variation-settings:var(--default-font-variation-settings,normal);-webkit-tap-highlight-color:transparent}hr{height:0;color:inherit;border-top-width:1px}abbr:where([title]){-webkit-text-decoration:underline dotted;text-decoration:underline dotted}h1,h2,h3,h4,h5,h6{font-size:inherit;font-weight:inherit}a{color:inherit;-webkit-text-decoration:inherit;-webkit-text-decoration:inherit;-webkit-text-decoration:inherit;-webkit-text-decoration:inherit;text-decoration:inherit}b,strong{font-weight:bolder}code,kbd,samp,pre{font-family:var(--default-mono-font-family,ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace);font-feature-settings:var(--default-mono-font-feature-settings,normal);font-variation-settings:var(--default-mono-font-variation-settings,normal);font-size:1em}small{font-size:80%}sub,sup{vertical-align:baseline;font-size:75%;line-height:0;position:relative}sub{bottom:-.25em}sup{top:-.5em}table{text-indent:0;border-color:inherit;border-collapse:collapse}:-moz-focusring:where(:not(iframe)){outline:auto}progress{vertical-align:baseline}summary{display:list-item}ol,ul,menu{list-style:none}img,svg,video,canvas,audio,iframe,embed,object{vertical-align:middle;display:block}img,video{max-width:100%;height:auto}button,input,select,optgroup,textarea{font:inherit;font-feature-settings:inherit;font-variation-settings:inherit;letter-spacing:inherit;color:inherit;opacity:1;background-color:#0000;border-radius:0}::file-selector-button{font:inherit;font-feature-settings:inherit;font-variation-settings:inherit;letter-spacing:inherit;color:inherit;opacity:1;background-color:#0000;border-radius:0}:where(select:is([multiple],[size])) optgroup{font-weight:bolder}:where(select:is([multiple],[size])) optgroup option{padding-inline-start:20px}::file-selector-button{margin-inline-end:4px}::placeholder{opacity:1}@supports (not ((-webkit-appearance:-apple-pay-button))) or (contain-intrinsic-size:1px){::placeholder{color:currentColor}@supports (color:color-mix(in lab, red, red)){::placeholder{color:color-mix(in oklab, currentcolor 50%, transparent)}}}textarea{resize:vertical}::-webkit-search-decoration{-webkit-appearance:none}::-webkit-date-and-time-value{min-height:1lh;text-align:inherit}::-webkit-datetime-edit{display:inline-flex}::-webkit-datetime-edit-fields-wrapper{padding:0}::-webkit-datetime-edit{padding-block:0}::-webkit-datetime-edit-year-field{padding-block:0}::-webkit-datetime-edit-month-field{padding-block:0}::-webkit-datetime-edit-day-field{padding-block:0}::-webkit-datetime-edit-hour-field{padding-block:0}::-webkit-datetime-edit-minute-field{padding-block:0}::-webkit-datetime-edit-second-field{padding-block:0}::-webkit-datetime-edit-millisecond-field{padding-block:0}::-webkit-datetime-edit-meridiem-field{padding-block:0}::-webkit-calendar-picker-indicator{line-height:1}:-moz-ui-invalid{box-shadow:none}button,input:where([type=button],[type=reset],[type=submit]){appearance:button}::file-selector-button{appearance:button}::-webkit-inner-spin-button{height:auto}::-webkit-outer-spin-button{height:auto}[hidden]:where(:not([hidden=until-found])){display:none!important}*{border-color:var(--color-border)}html{--lightningcss-light:initial;--lightningcss-dark: ;color-scheme:light}html,body,#app{background:var(--color-background);min-height:100%;color:var(--color-foreground);font-family:var(--font-sans);-webkit-font-smoothing:antialiased}h1,h2,h3{text-wrap:balance;font-family:var(--font-display)}p{text-wrap:pretty}a{color:inherit;text-decoration:none}button,[type=button],[type=submit],[role=button]{appearance:none}button:not(:disabled),[role=button]:not(:disabled){cursor:pointer;touch-action:manipulation}}@layer components;@layer utilities{.pointer-events-none{pointer-events:none}.collapse{visibility:collapse}.invisible{visibility:hidden}.visible{visibility:visible}.sr-only{clip-path:inset(50%);white-space:nowrap;border-width:0;width:1px;height:1px;margin:-1px;padding:0;position:absolute;overflow:hidden}.\\!sticky{position:sticky!important}.absolute{position:absolute}.fixed{position:fixed}.relative{position:relative}.static{position:static}.sticky{position:sticky}.inset-0{inset:0}.inset-y-0{inset-block:0}.top-1\\.5{top:calc(var(--spacing) * 1.5)}.top-1\\/2{top:50%}.top-3{top:calc(var(--spacing) * 3)}.right-0{right:0}.right-1{right:var(--spacing)}.right-1\\.5{right:calc(var(--spacing) * 1.5)}.right-2{right:calc(var(--spacing) * 2)}.right-3{right:calc(var(--spacing) * 3)}.right-4{right:calc(var(--spacing) * 4)}.bottom-0{bottom:0}.bottom-3{bottom:calc(var(--spacing) * 3)}.left-1{left:var(--spacing)}.left-2{left:calc(var(--spacing) * 2)}.left-3{left:calc(var(--spacing) * 3)}.left-4{left:calc(var(--spacing) * 4)}.z-10{z-index:10}.z-20{z-index:20}.z-50{z-index:50}.container{width:100%}@media (width>=40rem){.container{max-width:40rem}}@media (width>=48rem){.container{max-width:48rem}}@media (width>=64rem){.container{max-width:64rem}}@media (width>=80rem){.container{max-width:80rem}}@media (width>=96rem){.container{max-width:96rem}}.-mx-1{margin-inline:calc(var(--spacing) * -1)}.-mx-4{margin-inline:calc(var(--spacing) * -4)}.mx-auto{margin-inline:auto}.my-1{margin-block:var(--spacing)}.mt-0\\.5{margin-top:calc(var(--spacing) * .5)}.mt-1{margin-top:var(--spacing)}.mt-1\\.5{margin-top:calc(var(--spacing) * 1.5)}.mt-2{margin-top:calc(var(--spacing) * 2)}.mt-3{margin-top:calc(var(--spacing) * 3)}.mt-4{margin-top:calc(var(--spacing) * 4)}.mt-8{margin-top:calc(var(--spacing) * 8)}.mb-1\\.5{margin-bottom:calc(var(--spacing) * 1.5)}.mb-3{margin-bottom:calc(var(--spacing) * 3)}.ml-px{margin-left:1px}.block{display:block}.flex{display:flex}.grid{display:grid}.hidden{display:none}.inline{display:inline}.inline-flex{display:inline-flex}.table{display:table}.aspect-\\[4\\/3\\]{aspect-ratio:4/3}.aspect-square{aspect-ratio:1}.size-2\\.5{width:calc(var(--spacing) * 2.5);height:calc(var(--spacing) * 2.5)}.size-3{width:calc(var(--spacing) * 3);height:calc(var(--spacing) * 3)}.size-4{width:calc(var(--spacing) * 4);height:calc(var(--spacing) * 4)}.size-5{width:calc(var(--spacing) * 5);height:calc(var(--spacing) * 5)}.size-6{width:calc(var(--spacing) * 6);height:calc(var(--spacing) * 6)}.size-8{width:calc(var(--spacing) * 8);height:calc(var(--spacing) * 8)}.size-9{width:calc(var(--spacing) * 9);height:calc(var(--spacing) * 9)}.size-10{width:calc(var(--spacing) * 10);height:calc(var(--spacing) * 10)}.size-11{width:calc(var(--spacing) * 11);height:calc(var(--spacing) * 11)}.size-\\[7\\.25rem\\]{width:7.25rem;height:7.25rem}.size-\\[72px\\]{width:72px;height:72px}.size-\\[150\\%\\]{width:150%;height:150%}.h-5{height:calc(var(--spacing) * 5)}.h-8{height:calc(var(--spacing) * 8)}.h-9{height:calc(var(--spacing) * 9)}.h-10{height:calc(var(--spacing) * 10)}.h-11{height:calc(var(--spacing) * 11)}.h-12{height:calc(var(--spacing) * 12)}.h-72{height:calc(var(--spacing) * 72)}.h-full{height:100%}.h-px{height:1px}.max-h-\\[min\\(28rem\\,70vh\\)\\]{max-height:min(28rem,70vh)}.min-h-24{min-height:calc(var(--spacing) * 24)}.min-h-dvh{min-height:100dvh}.min-h-screen{min-height:100vh}.w-2\\.5{width:calc(var(--spacing) * 2.5)}.w-6{width:calc(var(--spacing) * 6)}.w-8{width:calc(var(--spacing) * 8)}.w-11{width:calc(var(--spacing) * 11)}.w-14{width:calc(var(--spacing) * 14)}.w-32{width:calc(var(--spacing) * 32)}.w-52{width:calc(var(--spacing) * 52)}.w-60{width:calc(var(--spacing) * 60)}.w-72{width:calc(var(--spacing) * 72)}.w-\\[7\\.5rem\\]{width:7.5rem}.w-\\[16\\.5rem\\]{width:16.5rem}.w-\\[min\\(20rem\\,calc\\(100vw-1\\.5rem\\)\\)\\]{width:min(20rem,100vw - 1.5rem)}.w-full{width:100%}.w-px{width:1px}.max-w-2xl{max-width:var(--container-2xl)}.max-w-3xl{max-width:var(--container-3xl)}.max-w-4xl{max-width:var(--container-4xl)}.max-w-6xl{max-width:var(--container-6xl)}.max-w-\\[26rem\\]{max-width:26rem}.max-w-\\[min\\(100\\%\\,24rem\\)\\]{max-width:min(100%,24rem)}.max-w-md{max-width:var(--container-md)}.max-w-prose{max-width:65ch}.max-w-sm{max-width:var(--container-sm)}.min-w-0{min-width:0}.min-w-28{min-width:calc(var(--spacing) * 28)}.min-w-44{min-width:calc(var(--spacing) * 44)}.flex-1{flex:1}.shrink{flex-shrink:1}.shrink-0{flex-shrink:0}.origin-\\[--radix-dropdown-menu-content-transform-origin\\]{transform-origin:--radix-dropdown-menu-content-transform-origin}.origin-\\[--radix-popover-content-transform-origin\\]{transform-origin:--radix-popover-content-transform-origin}.-translate-x-1\\/4{--tw-translate-x:calc(calc(1 / 4 * 100%) * -1);translate:var(--tw-translate-x) var(--tw-translate-y)}.-translate-y-1\\/2{--tw-translate-y:calc(calc(1 / 2 * 100%) * -1);translate:var(--tw-translate-x) var(--tw-translate-y)}.-translate-y-1\\/4{--tw-translate-y:calc(calc(1 / 4 * 100%) * -1);translate:var(--tw-translate-x) var(--tw-translate-y)}.scale-100{--tw-scale-x:100%;--tw-scale-y:100%;--tw-scale-z:100%;scale:var(--tw-scale-x) var(--tw-scale-y)}.scale-110{--tw-scale-x:110%;--tw-scale-y:110%;--tw-scale-z:110%;scale:var(--tw-scale-x) var(--tw-scale-y)}.scale-\\[0\\.25\\]{scale:.25}.transform{transform:var(--tw-rotate-x,) var(--tw-rotate-y,) var(--tw-rotate-z,) var(--tw-skew-x,) var(--tw-skew-y,)}.animate-pulse{animation:var(--animate-pulse)}.cursor-grab{cursor:grab}.cursor-pointer{cursor:pointer}.touch-manipulation{touch-action:manipulation}.touch-none{touch-action:none}.resize{resize:both}.appearance-none{appearance:none}.grid-cols-2{grid-template-columns:repeat(2,minmax(0,1fr))}.grid-cols-3{grid-template-columns:repeat(3,minmax(0,1fr))}.flex-col{flex-direction:column}.flex-wrap{flex-wrap:wrap}.place-items-center{place-items:center}.items-baseline{align-items:baseline}.items-center{align-items:center}.items-end{align-items:flex-end}.items-start{align-items:flex-start}.justify-between{justify-content:space-between}.justify-center{justify-content:center}.justify-end{justify-content:flex-end}.justify-start{justify-content:flex-start}.gap-1{gap:var(--spacing)}.gap-1\\.5{gap:calc(var(--spacing) * 1.5)}.gap-2{gap:calc(var(--spacing) * 2)}.gap-3{gap:calc(var(--spacing) * 3)}.gap-4{gap:calc(var(--spacing) * 4)}.gap-5{gap:calc(var(--spacing) * 5)}.gap-6{gap:calc(var(--spacing) * 6)}.gap-7{gap:calc(var(--spacing) * 7)}.gap-8{gap:calc(var(--spacing) * 8)}:where(.space-y-3>:not(:last-child)){--tw-space-y-reverse:0;margin-block-start:calc(calc(var(--spacing) * 3) * var(--tw-space-y-reverse));margin-block-end:calc(calc(var(--spacing) * 3) * calc(1 - var(--tw-space-y-reverse)))}.self-start{align-self:flex-start}.truncate{text-overflow:ellipsis;white-space:nowrap;overflow:hidden}.overflow-hidden{overflow:hidden}.overflow-y-auto{overflow-y:auto}.rounded{border-radius:var(--radius)}.rounded-2xl{border-radius:var(--radius-2xl)}.rounded-\\[inherit\\]{border-radius:inherit}.rounded-full{border-radius:2147483647px}.rounded-lg{border-radius:var(--radius-lg)}.rounded-md{border-radius:var(--radius-md)}.rounded-sm{border-radius:var(--radius-sm)}.rounded-xl{border-radius:var(--radius-xl)}.rounded-l-none{border-top-left-radius:0;border-bottom-left-radius:0}.rounded-r-none{border-top-right-radius:0;border-bottom-right-radius:0}.border{border-style:var(--tw-border-style);border-width:1px}.border\\!{border-style:var(--tw-border-style)!important;border-width:1px!important}.border-0{border-style:var(--tw-border-style);border-width:0}.border-2{border-style:var(--tw-border-style);border-width:2px}.border-t{border-top-style:var(--tw-border-style);border-top-width:1px}.border-b{border-bottom-style:var(--tw-border-style);border-bottom-width:1px}.border-l{border-left-style:var(--tw-border-style);border-left-width:1px}.border-l-0{border-left-style:var(--tw-border-style);border-left-width:0}.border-dashed{--tw-border-style:dashed;border-style:dashed}.border-border{border-color:var(--color-border)}.border-foreground{border-color:var(--color-foreground)}.border-input{border-color:var(--color-input)}.border-neutral-300{border-color:var(--color-neutral-300)}.border-primary{border-color:var(--color-primary)}.border-transparent{border-color:#0000}.bg-accent{background-color:var(--color-accent)}.bg-background{background-color:var(--color-background)}.bg-background\\/70{background-color:#efe8d8b3}@supports (color:color-mix(in lab, red, red)){.bg-background\\/70{background-color:color-mix(in oklab, var(--color-background) 70%, transparent)}}.bg-background\\/92{background-color:#efe8d8eb}@supports (color:color-mix(in lab, red, red)){.bg-background\\/92{background-color:color-mix(in oklab, var(--color-background) 92%, transparent)}}.bg-background\\/95{background-color:#efe8d8f2}@supports (color:color-mix(in lab, red, red)){.bg-background\\/95{background-color:color-mix(in oklab, var(--color-background) 95%, transparent)}}.bg-black{background-color:var(--color-black)}.bg-black\\/10{background-color:#0000001a}@supports (color:color-mix(in lab, red, red)){.bg-black\\/10{background-color:color-mix(in oklab, var(--color-black) 10%, transparent)}}.bg-border{background-color:var(--color-border)}.bg-card{background-color:var(--color-card)}.bg-card\\/90{background-color:#f7f1e6e6}@supports (color:color-mix(in lab, red, red)){.bg-card\\/90{background-color:color-mix(in oklab, var(--color-card) 90%, transparent)}}.bg-card\\/95{background-color:#f7f1e6f2}@supports (color:color-mix(in lab, red, red)){.bg-card\\/95{background-color:color-mix(in oklab, var(--color-card) 95%, transparent)}}.bg-clay\\/15{background-color:#8f3d3226}@supports (color:color-mix(in lab, red, red)){.bg-clay\\/15{background-color:color-mix(in oklab, var(--color-clay) 15%, transparent)}}.bg-destructive{background-color:var(--color-destructive)}.bg-muted{background-color:var(--color-muted)}.bg-paper{background-color:var(--color-paper)}.bg-primary{background-color:var(--color-primary)}.bg-primary-foreground\\/20{background-color:#f3eee433}@supports (color:color-mix(in lab, red, red)){.bg-primary-foreground\\/20{background-color:color-mix(in oklab, var(--color-primary-foreground) 20%, transparent)}}.bg-primary\\/15{background-color:#3f534426}@supports (color:color-mix(in lab, red, red)){.bg-primary\\/15{background-color:color-mix(in oklab, var(--color-primary) 15%, transparent)}}.bg-secondary{background-color:var(--color-secondary)}.bg-transparent{background-color:#0000}.bg-zinc-50{background-color:var(--color-zinc-50)}.object-cover{object-fit:cover}.p-0{padding:0}.p-0\\.5{padding:calc(var(--spacing) * .5)}.p-1{padding:var(--spacing)}.p-2{padding:calc(var(--spacing) * 2)}.p-3{padding:calc(var(--spacing) * 3)}.p-4{padding:calc(var(--spacing) * 4)}.p-5{padding:calc(var(--spacing) * 5)}.p-6{padding:calc(var(--spacing) * 6)}.p-8{padding:calc(var(--spacing) * 8)}.p-\\[16px\\]{padding:16px}.px-1\\.5{padding-inline:calc(var(--spacing) * 1.5)}.px-2{padding-inline:calc(var(--spacing) * 2)}.px-2\\.5{padding-inline:calc(var(--spacing) * 2.5)}.px-3{padding-inline:calc(var(--spacing) * 3)}.px-3\\.5{padding-inline:calc(var(--spacing) * 3.5)}.px-4{padding-inline:calc(var(--spacing) * 4)}.px-5{padding-inline:calc(var(--spacing) * 5)}.px-6{padding-inline:calc(var(--spacing) * 6)}.py-0\\.5{padding-block:calc(var(--spacing) * .5)}.py-1{padding-block:var(--spacing)}.py-1\\.5{padding-block:calc(var(--spacing) * 1.5)}.py-2{padding-block:calc(var(--spacing) * 2)}.py-3{padding-block:calc(var(--spacing) * 3)}.py-4{padding-block:calc(var(--spacing) * 4)}.py-5{padding-block:calc(var(--spacing) * 5)}.py-6{padding-block:calc(var(--spacing) * 6)}.py-7{padding-block:calc(var(--spacing) * 7)}.py-8{padding-block:calc(var(--spacing) * 8)}.py-12{padding-block:calc(var(--spacing) * 12)}.py-16{padding-block:calc(var(--spacing) * 16)}.pt-0\\.5{padding-top:calc(var(--spacing) * .5)}.pt-1{padding-top:var(--spacing)}.pt-3{padding-top:calc(var(--spacing) * 3)}.pt-4{padding-top:calc(var(--spacing) * 4)}.pr-3\\.5{padding-right:calc(var(--spacing) * 3.5)}.pb-8{padding-bottom:calc(var(--spacing) * 8)}.pb-24{padding-bottom:calc(var(--spacing) * 24)}.pl-4{padding-left:calc(var(--spacing) * 4)}.pl-9{padding-left:calc(var(--spacing) * 9)}.text-center{text-align:center}.text-left{text-align:left}.text-right{text-align:right}.font-display{font-family:var(--font-display)}.font-mono{font-family:var(--font-mono)}.font-sans{font-family:var(--font-sans)}.text-2xl{font-size:var(--text-2xl);line-height:var(--tw-leading,var(--text-2xl--line-height))}.text-4xl{font-size:var(--text-4xl);line-height:var(--tw-leading,var(--text-4xl--line-height))}.text-base{font-size:var(--text-base);line-height:var(--tw-leading,var(--text-base--line-height))}.text-lg{font-size:var(--text-lg);line-height:var(--tw-leading,var(--text-lg--line-height))}.text-sm{font-size:var(--text-sm);line-height:var(--tw-leading,var(--text-sm--line-height))}.text-xl{font-size:var(--text-xl);line-height:var(--tw-leading,var(--text-xl--line-height))}.text-xs{font-size:var(--text-xs);line-height:var(--tw-leading,var(--text-xs--line-height))}.text-\\[0\\.65rem\\]{font-size:.65rem}.text-\\[11px\\]{font-size:11px}.text-\\[13px\\]{font-size:13px}.leading-none{--tw-leading:1;line-height:1}.leading-relaxed{--tw-leading:var(--leading-relaxed);line-height:var(--leading-relaxed)}.leading-tight{--tw-leading:var(--leading-tight);line-height:var(--leading-tight)}.font-medium{--tw-font-weight:var(--font-weight-medium);font-weight:var(--font-weight-medium)}.font-semibold{--tw-font-weight:var(--font-weight-semibold);font-weight:var(--font-weight-semibold)}.tracking-\\[-0\\.02em\\]{--tw-tracking:-.02em;letter-spacing:-.02em}.tracking-\\[-0\\.03em\\]{--tw-tracking:-.03em;letter-spacing:-.03em}.tracking-\\[0\\.14em\\]{--tw-tracking:.14em;letter-spacing:.14em}.tracking-\\[0\\.16em\\]{--tw-tracking:.16em;letter-spacing:.16em}.tracking-\\[0\\.22em\\]{--tw-tracking:.22em;letter-spacing:.22em}.tracking-tight{--tw-tracking:var(--tracking-tight);letter-spacing:var(--tracking-tight)}.text-balance{text-wrap:balance}.text-pretty{text-wrap:pretty}.text-wrap{text-wrap:wrap}.break-words{overflow-wrap:break-word}.whitespace-nowrap{white-space:nowrap}.text-card-foreground{color:var(--color-card-foreground)}.text-clay{color:var(--color-clay)}.text-destructive-foreground{color:var(--color-destructive-foreground)}.text-foreground{color:var(--color-foreground)}.text-muted-foreground{color:var(--color-muted-foreground)}.text-neutral-500{color:var(--color-neutral-500)}.text-primary{color:var(--color-primary)}.text-primary-foreground{color:var(--color-primary-foreground)}.text-red-500{color:var(--color-red-500)}.text-secondary-foreground{color:var(--color-secondary-foreground)}.text-white{color:var(--color-white)}.text-zinc-500{color:var(--color-zinc-500)}.text-zinc-900{color:var(--color-zinc-900)}.uppercase{text-transform:uppercase}.tabular-nums{--tw-numeric-spacing:tabular-nums;font-variant-numeric:var(--tw-ordinal,) var(--tw-slashed-zero,) var(--tw-numeric-figure,) var(--tw-numeric-spacing,) var(--tw-numeric-fraction,)}.line-through{text-decoration-line:line-through}.underline-offset-4{text-underline-offset:4px}.antialiased{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}.accent-primary{accent-color:var(--color-primary)}.opacity-0{opacity:0}.opacity-60{opacity:.6}.opacity-70{opacity:.7}.opacity-100{opacity:1}.shadow{--tw-shadow:0 1px 3px 0 var(--tw-shadow-color,#0000001a), 0 1px 2px -1px var(--tw-shadow-color,#0000001a);box-shadow:var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow)}.shadow-md{--tw-shadow:0 4px 6px -1px var(--tw-shadow-color,#0000001a), 0 2px 4px -2px var(--tw-shadow-color,#0000001a);box-shadow:var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow)}.shadow-none{--tw-shadow:0 0 #0000;box-shadow:var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow)}.shadow-sm{--tw-shadow:0 1px 3px 0 var(--tw-shadow-color,#0000001a), 0 1px 2px -1px var(--tw-shadow-color,#0000001a);box-shadow:var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow)}.shadow-xl{--tw-shadow:0 20px 25px -5px var(--tw-shadow-color,#0000001a), 0 8px 10px -6px var(--tw-shadow-color,#0000001a);box-shadow:var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow)}.ring{--tw-ring-shadow:var(--tw-ring-inset,) 0 0 0 calc(1px + var(--tw-ring-offset-width)) var(--tw-ring-color,currentcolor);box-shadow:var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow)}.ring-ring{--tw-ring-color:var(--color-ring)}.outline,.outline-1{outline-style:var(--tw-outline-style);outline-width:1px}.-outline-offset-1{outline-offset:calc(1px * -1)}.outline-black\\/10{outline-color:#0000001a}@supports (color:color-mix(in lab, red, red)){.outline-black\\/10{outline-color:color-mix(in oklab, var(--color-black) 10%, transparent)}}.blur{--tw-blur:blur(8px);filter:var(--tw-blur,) var(--tw-brightness,) var(--tw-contrast,) var(--tw-grayscale,) var(--tw-hue-rotate,) var(--tw-invert,) var(--tw-saturate,) var(--tw-sepia,) var(--tw-drop-shadow,)}.blur-\\[4px\\]{--tw-blur:blur(4px);filter:var(--tw-blur,) var(--tw-brightness,) var(--tw-contrast,) var(--tw-grayscale,) var(--tw-hue-rotate,) var(--tw-invert,) var(--tw-saturate,) var(--tw-sepia,) var(--tw-drop-shadow,)}.blur-none{--tw-blur: ;filter:var(--tw-blur,) var(--tw-brightness,) var(--tw-contrast,) var(--tw-grayscale,) var(--tw-hue-rotate,) var(--tw-invert,) var(--tw-saturate,) var(--tw-sepia,) var(--tw-drop-shadow,)}.grayscale{--tw-grayscale:grayscale(100%);filter:var(--tw-blur,) var(--tw-brightness,) var(--tw-contrast,) var(--tw-grayscale,) var(--tw-hue-rotate,) var(--tw-invert,) var(--tw-saturate,) var(--tw-sepia,) var(--tw-drop-shadow,)}.invert{--tw-invert:invert(100%);filter:var(--tw-blur,) var(--tw-brightness,) var(--tw-contrast,) var(--tw-grayscale,) var(--tw-hue-rotate,) var(--tw-invert,) var(--tw-saturate,) var(--tw-sepia,) var(--tw-drop-shadow,)}.sepia{--tw-sepia:sepia(100%);filter:var(--tw-blur,) var(--tw-brightness,) var(--tw-contrast,) var(--tw-grayscale,) var(--tw-hue-rotate,) var(--tw-invert,) var(--tw-saturate,) var(--tw-sepia,) var(--tw-drop-shadow,)}.filter{filter:var(--tw-blur,) var(--tw-brightness,) var(--tw-contrast,) var(--tw-grayscale,) var(--tw-hue-rotate,) var(--tw-invert,) var(--tw-saturate,) var(--tw-sepia,) var(--tw-drop-shadow,)}.backdrop-blur{--tw-backdrop-blur:blur(8px);-webkit-backdrop-filter:var(--tw-backdrop-blur,) var(--tw-backdrop-brightness,) var(--tw-backdrop-contrast,) var(--tw-backdrop-grayscale,) var(--tw-backdrop-hue-rotate,) var(--tw-backdrop-invert,) var(--tw-backdrop-opacity,) var(--tw-backdrop-saturate,) var(--tw-backdrop-sepia,);backdrop-filter:var(--tw-backdrop-blur,) var(--tw-backdrop-brightness,) var(--tw-backdrop-contrast,) var(--tw-backdrop-grayscale,) var(--tw-backdrop-hue-rotate,) var(--tw-backdrop-invert,) var(--tw-backdrop-opacity,) var(--tw-backdrop-saturate,) var(--tw-backdrop-sepia,)}.transition{transition-property:color,background-color,border-color,outline-color,text-decoration-color,fill,stroke,--tw-gradient-from,--tw-gradient-via,--tw-gradient-to,opacity,box-shadow,transform,translate,scale,rotate,filter,-webkit-backdrop-filter,backdrop-filter,display,content-visibility,overlay,pointer-events;transition-timing-function:var(--tw-ease,var(--default-transition-timing-function));transition-duration:var(--tw-duration,var(--default-transition-duration))}.transition-\\[background-color\\,opacity\\,color\\]{transition-property:background-color,opacity,color;transition-timing-function:var(--tw-ease,var(--default-transition-timing-function));transition-duration:var(--tw-duration,var(--default-transition-duration))}.transition-\\[box-shadow\\]{transition-property:box-shadow;transition-timing-function:var(--tw-ease,var(--default-transition-timing-function));transition-duration:var(--tw-duration,var(--default-transition-duration))}.transition-\\[opacity\\,filter\\,scale\\]{transition-property:opacity,filter,scale;transition-timing-function:var(--tw-ease,var(--default-transition-timing-function));transition-duration:var(--tw-duration,var(--default-transition-duration))}.transition-\\[scale\\,background-color\\]{transition-property:scale,background-color;transition-timing-function:var(--tw-ease,var(--default-transition-timing-function));transition-duration:var(--tw-duration,var(--default-transition-duration))}.transition-\\[scale\\,opacity\\,filter\\]{transition-property:scale,opacity,filter;transition-timing-function:var(--tw-ease,var(--default-transition-timing-function));transition-duration:var(--tw-duration,var(--default-transition-duration))}.transition-colors{transition-property:color,background-color,border-color,outline-color,text-decoration-color,fill,stroke,--tw-gradient-from,--tw-gradient-via,--tw-gradient-to;transition-timing-function:var(--tw-ease,var(--default-transition-timing-function));transition-duration:var(--tw-duration,var(--default-transition-duration))}.transition-opacity{transition-property:opacity;transition-timing-function:var(--tw-ease,var(--default-transition-timing-function));transition-duration:var(--tw-duration,var(--default-transition-duration))}.transition-transform{transition-property:transform,translate,scale,rotate;transition-timing-function:var(--tw-ease,var(--default-transition-timing-function));transition-duration:var(--tw-duration,var(--default-transition-duration))}.duration-100{--tw-duration:.1s;transition-duration:.1s}.duration-150{--tw-duration:.15s;transition-duration:.15s}.duration-300{--tw-duration:.3s;transition-duration:.3s}.ease-\\[cubic-bezier\\(0\\.2\\,0\\,0\\,1\\)\\]{--tw-ease:cubic-bezier(.2,0,0,1);transition-timing-function:cubic-bezier(.2,0,0,1)}.ease-\\[var\\(--ease-out\\)\\],.ease-out{--tw-ease:var(--ease-out);transition-timing-function:var(--ease-out)}.outline-none{--tw-outline-style:none;outline-style:none}.select-none{-webkit-user-select:none;user-select:none}.paused{animation-play-state:paused}.running{animation-play-state:running}.zoom-in{--tw-enter-scale:0}.placeholder\\:text-muted-foreground::placeholder{color:var(--color-muted-foreground)}.after\\:absolute:after{content:var(--tw-content);position:absolute}.after\\:top-1\\/2:after{content:var(--tw-content);top:50%}.after\\:left-1\\/2:after{content:var(--tw-content);left:50%}.after\\:size-10:after{content:var(--tw-content);width:calc(var(--spacing) * 10);height:calc(var(--spacing) * 10)}.after\\:-translate-1\\/2:after{content:var(--tw-content);--tw-translate-x:calc(calc(1 / 2 * 100%) * -1);--tw-translate-y:calc(calc(1 / 2 * 100%) * -1);translate:var(--tw-translate-x) var(--tw-translate-y)}@media (hover:hover){.hover\\:scale-105:hover{--tw-scale-x:105%;--tw-scale-y:105%;--tw-scale-z:105%;scale:var(--tw-scale-x) var(--tw-scale-y)}.hover\\:border-primary:hover{border-color:var(--color-primary)}.hover\\:bg-accent:hover{background-color:var(--color-accent)}.hover\\:bg-neutral-100:hover{background-color:var(--color-neutral-100)}.hover\\:text-foreground:hover{color:var(--color-foreground)}.hover\\:underline:hover{text-decoration-line:underline}.hover\\:opacity-90:hover{opacity:.9}.hover\\:opacity-95:hover{opacity:.95}}.focus\\:bg-accent:focus{background-color:var(--color-accent)}.focus\\:text-accent-foreground:focus{color:var(--color-accent-foreground)}.focus-visible\\:ring-2:focus-visible{--tw-ring-shadow:var(--tw-ring-inset,) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color,currentcolor);box-shadow:var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow)}.focus-visible\\:ring-ring:focus-visible{--tw-ring-color:var(--color-ring)}.focus-visible\\:outline-none:focus-visible{--tw-outline-style:none;outline-style:none}.active\\:scale-\\[0\\.96\\]:active{scale:.96}.active\\:scale-\\[0\\.98\\]:active{scale:.98}.active\\:not-disabled\\:scale-\\[0\\.96\\]:active:not(:disabled){scale:.96}.disabled\\:pointer-events-none:disabled{pointer-events:none}.disabled\\:cursor-not-allowed:disabled{cursor:not-allowed}.disabled\\:cursor-wait:disabled{cursor:wait}.disabled\\:no-underline:disabled{text-decoration-line:none}.disabled\\:opacity-40:disabled{opacity:.4}.disabled\\:opacity-50:disabled{opacity:.5}.disabled\\:opacity-80:disabled{opacity:.8}.data-\\[disabled\\]\\:pointer-events-none[data-disabled]{pointer-events:none}.data-\\[disabled\\]\\:opacity-40[data-disabled]{opacity:.4}@media (width>=40rem){.sm\\:-mx-6{margin-inline:calc(var(--spacing) * -6)}.sm\\:block{display:block}.sm\\:hidden{display:none}.sm\\:inline{display:inline}.sm\\:size-32{width:calc(var(--spacing) * 32);height:calc(var(--spacing) * 32)}.sm\\:h-80{height:calc(var(--spacing) * 80)}.sm\\:w-44{width:calc(var(--spacing) * 44)}.sm\\:max-w-4xl{max-width:var(--container-4xl)}.sm\\:grid-cols-2{grid-template-columns:repeat(2,minmax(0,1fr))}.sm\\:grid-cols-3{grid-template-columns:repeat(3,minmax(0,1fr))}.sm\\:grid-cols-4{grid-template-columns:repeat(4,minmax(0,1fr))}.sm\\:grid-cols-\\[1fr_8rem_auto\\]{grid-template-columns:1fr 8rem auto}.sm\\:flex-row{flex-direction:row}.sm\\:p-5{padding:calc(var(--spacing) * 5)}.sm\\:p-6{padding:calc(var(--spacing) * 6)}.sm\\:px-6{padding-inline:calc(var(--spacing) * 6)}.sm\\:py-8{padding-block:calc(var(--spacing) * 8)}.sm\\:py-10{padding-block:calc(var(--spacing) * 10)}.sm\\:text-3xl{font-size:var(--text-3xl);line-height:var(--tw-leading,var(--text-3xl--line-height))}.sm\\:text-5xl{font-size:var(--text-5xl);line-height:var(--tw-leading,var(--text-5xl--line-height))}.sm\\:text-xl{font-size:var(--text-xl);line-height:var(--tw-leading,var(--text-xl--line-height))}}@media (width>=64rem){.lg\\:h-96{height:calc(var(--spacing) * 96)}.lg\\:grid-cols-2{grid-template-columns:repeat(2,minmax(0,1fr))}.lg\\:grid-cols-\\[minmax\\(0\\,1fr\\)_minmax\\(0\\,1\\.1fr\\)\\]{grid-template-columns:minmax(0,1fr) minmax(0,1.1fr)}.lg\\:items-start{align-items:flex-start}}@media (prefers-color-scheme:dark){.dark\\:border-neutral-700{border-color:var(--color-neutral-700)}.dark\\:bg-white\\/20{background-color:#fff3}@supports (color:color-mix(in lab, red, red)){.dark\\:bg-white\\/20{background-color:color-mix(in oklab, var(--color-white) 20%, transparent)}}.dark\\:bg-zinc-950{background-color:var(--color-zinc-950)}.dark\\:text-zinc-50{color:var(--color-zinc-50)}.dark\\:text-zinc-400{color:var(--color-zinc-400)}.dark\\:outline-white\\/10{outline-color:#ffffff1a}@supports (color:color-mix(in lab, red, red)){.dark\\:outline-white\\/10{outline-color:color-mix(in oklab, var(--color-white) 10%, transparent)}}@media (hover:hover){.dark\\:hover\\:bg-neutral-900:hover{background-color:var(--color-neutral-900)}}}.\\[\\&_svg\\]\\:pointer-events-none svg{pointer-events:none}.\\[\\&_svg\\]\\:size-4 svg{width:calc(var(--spacing) * 4);height:calc(var(--spacing) * 4)}.\\[\\&_svg\\]\\:shrink-0 svg{flex-shrink:0}}@property --tw-animation-delay{syntax:\"*\";inherits:false;initial-value:0s}@property --tw-animation-direction{syntax:\"*\";inherits:false;initial-value:normal}@property --tw-animation-duration{syntax:\"*\";inherits:false}@property --tw-animation-fill-mode{syntax:\"*\";inherits:false;initial-value:none}@property --tw-animation-iteration-count{syntax:\"*\";inherits:false;initial-value:1}@property --tw-enter-blur{syntax:\"*\";inherits:false;initial-value:0}@property --tw-enter-opacity{syntax:\"*\";inherits:false;initial-value:1}@property --tw-enter-rotate{syntax:\"*\";inherits:false;initial-value:0}@property --tw-enter-scale{syntax:\"*\";inherits:false;initial-value:1}@property --tw-enter-translate-x{syntax:\"*\";inherits:false;initial-value:0}@property --tw-enter-translate-y{syntax:\"*\";inherits:false;initial-value:0}@property --tw-exit-blur{syntax:\"*\";inherits:false;initial-value:0}@property --tw-exit-opacity{syntax:\"*\";inherits:false;initial-value:1}@property --tw-exit-rotate{syntax:\"*\";inherits:false;initial-value:0}@property --tw-exit-scale{syntax:\"*\";inherits:false;initial-value:1}@property --tw-exit-translate-x{syntax:\"*\";inherits:false;initial-value:0}@property --tw-exit-translate-y{syntax:\"*\";inherits:false;initial-value:0}@media (prefers-reduced-motion:reduce){*,:before,:after{transition-duration:.01ms!important;animation-duration:.01ms!important;animation-iteration-count:1!important}}@property --tw-translate-x{syntax:\"*\";inherits:false;initial-value:0}@property --tw-translate-y{syntax:\"*\";inherits:false;initial-value:0}@property --tw-translate-z{syntax:\"*\";inherits:false;initial-value:0}@property --tw-scale-x{syntax:\"*\";inherits:false;initial-value:1}@property --tw-scale-y{syntax:\"*\";inherits:false;initial-value:1}@property --tw-scale-z{syntax:\"*\";inherits:false;initial-value:1}@property --tw-rotate-x{syntax:\"*\";inherits:false}@property --tw-rotate-y{syntax:\"*\";inherits:false}@property --tw-rotate-z{syntax:\"*\";inherits:false}@property --tw-skew-x{syntax:\"*\";inherits:false}@property --tw-skew-y{syntax:\"*\";inherits:false}@property --tw-space-y-reverse{syntax:\"*\";inherits:false;initial-value:0}@property --tw-border-style{syntax:\"*\";inherits:false;initial-value:solid}@property --tw-leading{syntax:\"*\";inherits:false}@property --tw-font-weight{syntax:\"*\";inherits:false}@property --tw-tracking{syntax:\"*\";inherits:false}@property --tw-ordinal{syntax:\"*\";inherits:false}@property --tw-slashed-zero{syntax:\"*\";inherits:false}@property --tw-numeric-figure{syntax:\"*\";inherits:false}@property --tw-numeric-spacing{syntax:\"*\";inherits:false}@property --tw-numeric-fraction{syntax:\"*\";inherits:false}@property --tw-shadow{syntax:\"*\";inherits:false;initial-value:0 0 #0000}@property --tw-shadow-color{syntax:\"*\";inherits:false}@property --tw-shadow-alpha{syntax:\"<percentage>\";inherits:false;initial-value:100%}@property --tw-inset-shadow{syntax:\"*\";inherits:false;initial-value:0 0 #0000}@property --tw-inset-shadow-color{syntax:\"*\";inherits:false}@property --tw-inset-shadow-alpha{syntax:\"<percentage>\";inherits:false;initial-value:100%}@property --tw-ring-color{syntax:\"*\";inherits:false}@property --tw-ring-shadow{syntax:\"*\";inherits:false;initial-value:0 0 #0000}@property --tw-inset-ring-color{syntax:\"*\";inherits:false}@property --tw-inset-ring-shadow{syntax:\"*\";inherits:false;initial-value:0 0 #0000}@property --tw-ring-inset{syntax:\"*\";inherits:false}@property --tw-ring-offset-width{syntax:\"<length>\";inherits:false;initial-value:0}@property --tw-ring-offset-color{syntax:\"*\";inherits:false;initial-value:#fff}@property --tw-ring-offset-shadow{syntax:\"*\";inherits:false;initial-value:0 0 #0000}@property --tw-outline-style{syntax:\"*\";inherits:false;initial-value:solid}@property --tw-blur{syntax:\"*\";inherits:false}@property --tw-brightness{syntax:\"*\";inherits:false}@property --tw-contrast{syntax:\"*\";inherits:false}@property --tw-grayscale{syntax:\"*\";inherits:false}@property --tw-hue-rotate{syntax:\"*\";inherits:false}@property --tw-invert{syntax:\"*\";inherits:false}@property --tw-opacity{syntax:\"*\";inherits:false}@property --tw-saturate{syntax:\"*\";inherits:false}@property --tw-sepia{syntax:\"*\";inherits:false}@property --tw-drop-shadow{syntax:\"*\";inherits:false}@property --tw-drop-shadow-color{syntax:\"*\";inherits:false}@property --tw-drop-shadow-alpha{syntax:\"<percentage>\";inherits:false;initial-value:100%}@property --tw-drop-shadow-size{syntax:\"*\";inherits:false}@property --tw-backdrop-blur{syntax:\"*\";inherits:false}@property --tw-backdrop-brightness{syntax:\"*\";inherits:false}@property --tw-backdrop-contrast{syntax:\"*\";inherits:false}@property --tw-backdrop-grayscale{syntax:\"*\";inherits:false}@property --tw-backdrop-hue-rotate{syntax:\"*\";inherits:false}@property --tw-backdrop-invert{syntax:\"*\";inherits:false}@property --tw-backdrop-opacity{syntax:\"*\";inherits:false}@property --tw-backdrop-saturate{syntax:\"*\";inherits:false}@property --tw-backdrop-sepia{syntax:\"*\";inherits:false}@property --tw-duration{syntax:\"*\";inherits:false}@property --tw-ease{syntax:\"*\";inherits:false}@property --tw-content{syntax:\"*\";inherits:false;initial-value:\"\"}@keyframes pulse{50%{opacity:.5}}";
var APP_NAME = "Atlas";
var FONT_HREF = "https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600&family=Fraunces:opsz,wght@9..144,500;9..144,600&display=swap";
var Route$10 = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: APP_NAME },
			{
				name: "theme-color",
				content: "#3f5344"
			},
			{
				name: "description",
				content: "Atlas — plan bac à sable pour raconter et jouer une maison."
			}
		],
		links: [
			{
				rel: "icon",
				type: "image/svg+xml",
				href: "/favicon.svg"
			},
			{
				rel: "preconnect",
				href: "https://fonts.googleapis.com"
			},
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous"
			},
			{
				rel: "stylesheet",
				href: FONT_HREF
			},
			{
				rel: "manifest",
				href: "/__grok/manifest.webmanifest"
			},
			{
				rel: "apple-touch-icon",
				href: "/__grok/icon-180.png"
			}
		]
	}),
	component: RootDocument
});
function RootDocument() {
	const inline = styles_default;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "fr",
		className: "antialiased",
		suppressHydrationWarning: true,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("head", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}),
			inline ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("style", {
				id: "atlas-css",
				dangerouslySetInnerHTML: { __html: inline }
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("script", { dangerouslySetInnerHTML: { __html: THEME_BOOT_SCRIPT } })
		] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PreviewHostBridge, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ThemeRoot, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}) }) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster, {
				position: "bottom-center",
				toastOptions: { className: "font-sans text-sm" }
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})
		] })]
	});
}
var $$splitComponentImporter$8 = () => import("./routes-CwCHQZFE.mjs");
var Route$9 = createFileRoute("/")({ component: lazyRouteComponent($$splitComponentImporter$8, "component") });
var $$splitComponentImporter$7 = () => import("./login-QiIHuqmy.mjs");
var Route$8 = createFileRoute("/login")({ component: lazyRouteComponent($$splitComponentImporter$7, "component") });
var $$splitComponentImporter$6 = () => import("./proprietes-BkucEljg.mjs");
var Route$7 = createFileRoute("/proprietes")({ component: lazyRouteComponent($$splitComponentImporter$6, "component") });
var $$splitComponentImporter$5 = () => import("./sauvegardes-CxTyodF9.mjs");
var Route$6 = createFileRoute("/sauvegardes")({ component: lazyRouteComponent($$splitComponentImporter$5, "component") });
var $$splitComponentImporter$4 = () => import("./parametres-D3PtfddY.mjs");
var Route$5 = createFileRoute("/parametres/")({ component: lazyRouteComponent($$splitComponentImporter$4, "component") });
var $$splitComponentImporter$3 = () => import("./carte-GVgNsvr3.mjs");
var Route$4 = createFileRoute("/parametres/carte")({ component: lazyRouteComponent($$splitComponentImporter$3, "component") });
var $$splitComponentImporter$2 = () => import("./compte-Byw54Bru.mjs");
var Route$3 = createFileRoute("/parametres/compte")({ component: lazyRouteComponent($$splitComponentImporter$2, "component") });
var $$splitComponentImporter$1 = () => import("./interface-DaLyI_FQ.mjs");
var Route$2 = createFileRoute("/parametres/interface")({ component: lazyRouteComponent($$splitComponentImporter$1, "component") });
var $$splitComponentImporter = () => import("./proprietes-DHtTY9Zh.mjs");
var Route$1 = createFileRoute("/parametres/proprietes")({ component: lazyRouteComponent($$splitComponentImporter, "component") });
var Route = createFileRoute("/api/auth/$")({ server: { handlers: {
	GET: ({ request }) => auth.handler(request),
	POST: ({ request }) => auth.handler(request)
} } });
var IndexRoute = Route$9.update({
	id: "/",
	path: "/",
	getParentRoute: () => Route$10
});
var LoginRoute = Route$8.update({
	id: "/login",
	path: "/login",
	getParentRoute: () => Route$10
});
var ProprietesRoute = Route$7.update({
	id: "/proprietes",
	path: "/proprietes",
	getParentRoute: () => Route$10
});
var SauvegardesRoute = Route$6.update({
	id: "/sauvegardes",
	path: "/sauvegardes",
	getParentRoute: () => Route$10
});
var ParametresIndexRoute = Route$5.update({
	id: "/parametres/",
	path: "/parametres/",
	getParentRoute: () => Route$10
});
var rootRouteChildren = {
	IndexRoute,
	LoginRoute,
	ProprietesRoute,
	SauvegardesRoute,
	ParametresCarteRoute: Route$4.update({
		id: "/parametres/carte",
		path: "/parametres/carte",
		getParentRoute: () => Route$10
	}),
	ParametresCompteRoute: Route$3.update({
		id: "/parametres/compte",
		path: "/parametres/compte",
		getParentRoute: () => Route$10
	}),
	ParametresInterfaceRoute: Route$2.update({
		id: "/parametres/interface",
		path: "/parametres/interface",
		getParentRoute: () => Route$10
	}),
	ParametresProprietesRoute: Route$1.update({
		id: "/parametres/proprietes",
		path: "/parametres/proprietes",
		getParentRoute: () => Route$10
	}),
	ParametresIndexRoute,
	ApiAuthSplatRoute: Route.update({
		id: "/api/auth/$",
		path: "/api/auth/$",
		getParentRoute: () => Route$10
	})
};
var routeTree = Route$10._addFileChildren(rootRouteChildren)._addFileTypes();
var router_exports = /* @__PURE__ */ __exportAll({ getRouter: () => getRouter });
function getRouter() {
	return createRouter({
		routeTree,
		defaultErrorComponent: AppErrorComponent
	});
}
//#endregion
export { doorMark as $, sanitizeHexColor as A, newProp as B, useUiStore as C, roomById as D, floorById as E, DEFAULT_PROPS as F, uid as G, readProp as H, PROP_TYPES as I, bounds as J, applyHandle as K, TONE_OPTIONS as L, zoneCss as M, zoneHex as N, STAIR_STYLES as O, zonePaint as P, distToSegment as Q, formatProp as R, handleSizePx as S, resolveRoom as T, schemasEqual as U, optionLabel as V, tintOf as W, canCloseZone as X, boxesOverlap as Y, centroid as Z, saveBlurb as _, useThemeStore as _t, useConfigDirty as a, lineReady as at, useAtlas as b, isHex as bt, createNamedSave as c, markSides as ct, downloadCurrent as d, polyToPath as dt, ellipsePoly as et, downloadSave as f, scalePoly as ft, restoreSave as g, widthFromPoint as gt, overwriteSave as h, translatePoly as ht, savePreferences as i, lassoReady as it, sanitizePhotos as j, ZONE_FILLS as k, defaultSaveName as l, pointInPoly as lt, importSaveFile as m, stairLines as mt, adoptPreferences as n, handleCursor as nt, usePrefs as o, markEnds as ot, formatSavedAt as p, snapZonePoint as pt, area as q, restoreCloudPreferences as r, labelSize as rt, appearanceOf as s, markFromEnds as st, router_exports as t, fixtureWidth as tt, deleteSave as u, pointInRotatedRect as ut, useSaveCatalog as v, DEFAULT_THEME as vt, resolveFloor as w, CHROME_TOGGLES as x, themesEqual as xt, roomMatches as y, FONT_OPTIONS as yt, newOption as z };
