import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { m as Save } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { a as useConfigDirty, i as savePreferences, o as usePrefs, p as formatSavedAt } from "./router-0jzItr0j.mjs";
import { n as cn, r as pressProps, t as Button } from "./press-UBLDE-un.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/prefs-save-bar-Dju-onwJ.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var GuardBoundary = class extends import_react.Component {
	state = { error: null };
	static getDerivedStateFromError(error) {
		return { error };
	}
	componentDidCatch(error, info) {
		console.warn("[atlas-guard]", this.props.label ?? "ui", error, info);
	}
	render() {
		if (this.state.error) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col gap-3 rounded-lg border border-border bg-card p-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-foreground",
					children: this.props.label ? `${this.props.label} a rencontré un problème.` : "Cette section a rencontré un problème."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs break-words text-muted-foreground",
					children: this.state.error.message || "Erreur inattendue."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						variant: "outline",
						...pressProps(() => this.setState({ error: null })),
						children: "Réessayer"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						...pressProps(() => window.location.reload()),
						children: "Recharger"
					})]
				})
			]
		});
		return this.props.children;
	}
};
function PrefsSaveBar({ sticky = true, className }) {
	const dirty = useConfigDirty();
	const saving = usePrefs((s) => s.saving);
	const lastSavedAt = usePrefs((s) => s.lastSavedAt);
	const loaded = usePrefs((s) => s.loaded);
	const lock = (0, import_react.useRef)(false);
	async function onSave() {
		if (lock.current || saving || !dirty || !loaded) return;
		lock.current = true;
		try {
			if (await savePreferences()) toast.success("Préférences enregistrées");
			else toast.error("Enregistrement impossible — réessayez");
		} catch {
			toast.error("Enregistrement impossible — réessayez");
		} finally {
			lock.current = false;
		}
	}
	const status = !loaded ? "Chargement des préférences…" : saving ? "Enregistrement…" : dirty ? "Modifications non enregistrées" : lastSavedAt ? `Enregistré le ${formatSavedAt(lastSavedAt)}` : "Aucune modification";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn("border-t border-border bg-background/95 py-3", sticky && "sticky bottom-0 z-20 -mx-4 px-4 backdrop-blur sm:-mx-6 sm:px-6", !sticky && "pt-4", className),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-wrap items-center justify-between gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: cn("text-xs", dirty ? "text-foreground" : "text-muted-foreground"),
				"aria-live": "polite",
				children: status
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				type: "button",
				disabled: !dirty || saving || !loaded,
				"aria-busy": saving,
				...pressProps(() => void onSave()),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Save, { className: "size-4" }), "Sauvegarder les préférences"]
			})]
		})
	});
}
//#endregion
export { PrefsSaveBar as n, GuardBoundary as t };
