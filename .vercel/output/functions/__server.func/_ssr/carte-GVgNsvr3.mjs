import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { C as useUiStore, S as handleSizePx, x as CHROME_TOGGLES } from "./router-0jzItr0j.mjs";
import { n as cn, r as pressProps, t as Button } from "./press-UBLDE-un.mjs";
import { t as Label } from "./label-Dn6Iajez.mjs";
import { t as SettingsShell } from "./settings-shell-B4409fB9.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/carte-GVgNsvr3.js
var import_jsx_runtime = require_jsx_runtime();
function CartePage() {
	const chrome = useUiStore((s) => s.chrome);
	const setChrome = useUiStore((s) => s.setChrome);
	const handleSize = handleSizePx(chrome.handleSize);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SettingsShell, {
		title: "Carte",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm leading-relaxed text-muted-foreground",
				children: "Affichez seulement ce dont vous avez besoin sur le plan. Ces choix restent sur cet appareil, et se copient sur le compte si vous êtes connecté."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-col gap-2",
				children: CHROME_TOGGLES.map((item) => {
					const on = chrome[item.key] !== false;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						"aria-pressed": on,
						...pressProps(() => setChrome({ [item.key]: !on })),
						className: cn("flex appearance-none items-center justify-between gap-3 rounded-lg border p-4 text-left transition-colors", on ? "border-primary bg-accent" : "border-border bg-card hover:bg-accent"),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "block text-sm font-medium",
							children: item.label
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "block text-xs text-muted-foreground",
							children: item.hint
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs font-medium text-muted-foreground",
							children: on ? "Affiché" : "Masqué"
						})]
					}, item.key);
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "flex flex-col gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-lg font-medium tracking-[-0.02em]",
					children: "Poignées de redimension"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm leading-relaxed text-muted-foreground",
					children: "Taille des carrés aux coins des pièces, ainsi qu’aux extrémités des fenêtres, portes et escaliers."
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-4 rounded-lg border border-border bg-card p-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "shrink-0 rounded-sm border-2 border-primary bg-card",
						style: {
							width: handleSize,
							height: handleSize
						},
						"aria-hidden": true
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex min-w-0 flex-1 flex-col gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Label, {
							htmlFor: "handle-size",
							className: "flex items-center justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Taille" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "font-mono text-xs text-muted-foreground",
								children: [handleSize, " px"]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							id: "handle-size",
							type: "range",
							min: 8,
							max: 32,
							step: 1,
							value: handleSize,
							"aria-valuemin": 8,
							"aria-valuemax": 32,
							"aria-valuenow": handleSize,
							"aria-label": "Taille des poignées de redimension",
							onChange: (e) => setChrome({ handleSize: Number(e.target.value) }),
							className: "w-full accent-primary"
						})]
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				type: "button",
				variant: "outline",
				...pressProps(() => setChrome({
					showGrid: true,
					showCompass: true,
					showTokens: true,
					showHints: true,
					handleSize
				})),
				children: "Tout afficher"
			})
		]
	});
}
//#endregion
export { CartePage as component };
