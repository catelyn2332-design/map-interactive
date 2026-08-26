import { _ as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { C as Map, b as Palette, c as Tags, r as UserRound } from "../_libs/lucide-react.mjs";
import { t as SettingsShell } from "./settings-shell-B4409fB9.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/parametres-D3PtfddY.js
var import_jsx_runtime = require_jsx_runtime();
var SECTIONS = [
	{
		to: "/parametres/interface",
		title: "Personnalisation de l’interface",
		hint: "Couleurs, polices, titres et coins.",
		Icon: Palette
	},
	{
		to: "/parametres/proprietes",
		title: "Les propriétés",
		hint: "Champs que vous posez sur les pièces.",
		Icon: Tags
	},
	{
		to: "/parametres/carte",
		title: "Paramétrages de la map",
		hint: "Grille, boussole, pions, légendes.",
		Icon: Map
	},
	{
		to: "/parametres/compte",
		title: "Gestion du compte et données",
		hint: "Connexion, copie sur le compte, plan local.",
		Icon: UserRound
	}
];
function ParametresHub() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SettingsShell, {
		title: "Paramètres",
		backTo: "/",
		backLabel: "Atlas",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-sm leading-relaxed text-muted-foreground",
			children: "Quatre sections, une seule sauvegarde. Votre apparence n’est plus écrasée par un thème imposé."
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex flex-col gap-2",
			children: SECTIONS.map((section) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
				to: section.to,
				className: "flex items-center gap-3 rounded-lg border border-border bg-card p-4 text-left transition-colors hover:bg-accent",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "grid size-11 shrink-0 place-items-center rounded-md border border-border bg-background",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(section.Icon, { className: "size-5" })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "min-w-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "block text-sm font-medium",
						children: section.title
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "block text-xs text-muted-foreground",
						children: section.hint
					})]
				})]
			}, section.to))
		})]
	});
}
//#endregion
export { ParametresHub as component };
