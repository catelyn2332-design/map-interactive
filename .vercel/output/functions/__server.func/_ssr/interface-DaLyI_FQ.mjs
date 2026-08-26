import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { C as useUiStore, _t as useThemeStore, bt as isHex, vt as DEFAULT_THEME, xt as themesEqual, yt as FONT_OPTIONS } from "./router-0jzItr0j.mjs";
import { r as pressProps, t as Button } from "./press-UBLDE-un.mjs";
import { t as Label } from "./label-Dn6Iajez.mjs";
import { t as SettingsShell } from "./settings-shell-B4409fB9.mjs";
import { t as Separator } from "./separator-D4L1gUfN.mjs";
import { t as Input } from "./input-Cu1eRQUe.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/interface-DaLyI_FQ.js
var import_jsx_runtime = require_jsx_runtime();
var COLOR_FIELDS = [
	{
		key: "background",
		label: "Fond d’écran",
		hint: "Page entière"
	},
	{
		key: "paper",
		label: "Fond de la carte",
		hint: "Plan et zones"
	},
	{
		key: "card",
		label: "Panneaux",
		hint: "Dossier, en-tête"
	},
	{
		key: "foreground",
		label: "Texte",
		hint: "Titres et corps"
	},
	{
		key: "mutedForeground",
		label: "Texte secondaire",
		hint: "Légendes"
	},
	{
		key: "primary",
		label: "Boutons",
		hint: "Actions, sélection"
	},
	{
		key: "secondary",
		label: "Boutons discrets",
		hint: "Secondaires"
	},
	{
		key: "border",
		label: "Bordures",
		hint: "Lignes, cadres"
	},
	{
		key: "clay",
		label: "Alerte",
		hint: "Erreur, danger"
	}
];
var COPY_FIELDS = [
	{
		key: "appName",
		label: "Nom de l’application",
		hint: "Titre de l’en-tête"
	},
	{
		key: "floorWord",
		label: "Mot « étage »",
		hint: "Onglets et nouveau niveau"
	},
	{
		key: "roomWord",
		label: "Mot « pièce »",
		hint: "Nom par défaut d’une pièce"
	},
	{
		key: "emptyPlan",
		label: "Message du plan vide",
		hint: "Affiché tant qu’il n’y a rien"
	}
];
function ColorField({ id, label, hint, value, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center gap-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "relative size-11 shrink-0 overflow-hidden rounded-md border border-border",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "sr-only",
					children: label
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "color",
					value,
					onChange: (e) => onChange(e.target.value),
					className: "absolute inset-0 size-[150%] -translate-x-1/4 -translate-y-1/4 cursor-pointer border-0 p-0"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-w-0 flex-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
					htmlFor: id,
					children: label
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-muted-foreground",
					children: hint
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
				id,
				value,
				onChange: (e) => {
					const next = e.target.value.trim();
					if (isHex(next)) onChange(next);
				},
				"aria-label": label,
				className: "h-11 w-[7.5rem] font-mono text-sm uppercase",
				maxLength: 7
			})
		]
	});
}
function InterfacePage() {
	const theme = useThemeStore((s) => s.theme);
	const setTheme = useThemeStore((s) => s.setTheme);
	const resetTheme = useThemeStore((s) => s.resetTheme);
	const copy = useUiStore((s) => s.copy);
	const setCopy = useUiStore((s) => s.setCopy);
	const displayFonts = FONT_OPTIONS.filter((f) => f.kind === "display");
	const sansFonts = FONT_OPTIONS.filter((f) => f.kind === "sans");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SettingsShell, {
		title: "Interface",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "flex flex-col gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-lg font-medium tracking-[-0.02em]",
					children: "Aperçu"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-4 rounded-lg border border-border bg-card p-4 sm:p-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-display text-xl font-medium tracking-[-0.03em]",
							children: copy.appName
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm leading-relaxed text-muted-foreground",
							children: "Un plan vide, des pièces que vous tracez, une histoire que vous écrivez."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, { children: "Ouvrir" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "secondary",
									children: "Notes"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "outline",
									children: "Annuler"
								})
							]
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "flex flex-col gap-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-lg font-medium tracking-[-0.02em]",
						children: "Couleurs"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted-foreground",
						children: "Votre palette reste en place. Rien ne la remplace par un thème tout fait."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex flex-col gap-4 rounded-lg border border-border bg-card p-4 sm:p-5",
						children: COLOR_FIELDS.map((field) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ColorField, {
							id: `color-${field.key}`,
							label: field.label,
							hint: field.hint,
							value: String(theme[field.key]),
							onChange: (hex) => setTheme({ [field.key]: hex })
						}, field.key))
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "flex flex-col gap-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-lg font-medium tracking-[-0.02em]",
					children: "Mots de l’interface"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex flex-col gap-4 rounded-lg border border-border bg-card p-4 sm:p-5",
					children: COPY_FIELDS.map((field) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: `copy-${field.key}`,
								children: field.label
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: `copy-${field.key}`,
								value: copy[field.key],
								onChange: (e) => setCopy({ [field.key]: e.target.value })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-muted-foreground",
								children: field.hint
							})
						]
					}, field.key))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "flex flex-col gap-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-lg font-medium tracking-[-0.02em]",
					children: "Typographie"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-4 sm:grid-cols-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "display-font",
							children: "Titres"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
							id: "display-font",
							value: theme.displayFont,
							onChange: (e) => setTheme({ displayFont: e.target.value }),
							className: "h-11 rounded-md border border-input bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
							children: displayFonts.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: f.id,
								children: f.id
							}, f.id))
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "sans-font",
							children: "Texte"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
							id: "sans-font",
							value: theme.sansFont,
							onChange: (e) => setTheme({ sansFont: e.target.value }),
							className: "h-11 rounded-md border border-input bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
							children: sansFonts.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: f.id,
								children: f.id
							}, f.id))
						})]
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "flex flex-col gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-lg font-medium tracking-[-0.02em]",
					children: "Coins des boutons"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex flex-wrap gap-2",
					children: [
						{
							n: 8,
							label: "Nets"
						},
						{
							n: 12,
							label: "Souples"
						},
						{
							n: 16,
							label: "Ronds"
						}
					].map((opt) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						variant: theme.radius === opt.n ? "default" : "outline",
						...pressProps(() => setTheme({ radius: opt.n })),
						children: opt.label
					}, opt.n))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Separator, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-wrap justify-end gap-3",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "button",
					variant: "outline",
					disabled: themesEqual(theme, DEFAULT_THEME),
					...pressProps(resetTheme),
					children: "Rétablir l’apparence"
				})
			})
		]
	});
}
//#endregion
export { InterfacePage as component };
