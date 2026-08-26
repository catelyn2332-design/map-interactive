import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { i as Upload, j as Download, k as FolderOpen, m as Save, s as Trash2 } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { _ as saveBlurb, c as createNamedSave, d as downloadCurrent, f as downloadSave, g as restoreSave, h as overwriteSave, l as defaultSaveName, m as importSaveFile, n as adoptPreferences, p as formatSavedAt, s as appearanceOf, u as deleteSave, v as useSaveCatalog } from "./router-0jzItr0j.mjs";
import { r as pressProps, t as Button } from "./press-UBLDE-un.mjs";
import { t as Label } from "./label-Dn6Iajez.mjs";
import { t as Input } from "./input-Cu1eRQUe.mjs";
import { n as PageHeader } from "./app-header-D4WBOYKd.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/sauvegardes-CxTyodF9.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function SaveManager() {
	const named = useSaveCatalog((s) => s.named);
	const autos = useSaveCatalog((s) => s.autos);
	const lastAutoAt = useSaveCatalog((s) => s.lastAutoAt);
	const [draft, setDraft] = (0, import_react.useState)("");
	const fileRef = (0, import_react.useRef)(null);
	function saveNow() {
		const rec = createNamedSave(draft || defaultSaveName());
		setDraft("");
		toast.success(`« ${rec.name} » enregistrée`);
	}
	function restore(rec) {
		if (!restoreSave(rec.id)) {
			toast.error("Impossible de restaurer ces réglages");
			return;
		}
		adoptPreferences(rec.payload);
		toast.success(`Réglages restaurés : ${rec.name}`);
	}
	async function onFile(file) {
		if (!file) return;
		try {
			const text = await file.text();
			const rec = importSaveFile(JSON.parse(text), true);
			if (!rec) {
				toast.error("Fichier illisible");
				return;
			}
			toast.success(`Importés : ${rec.name}`);
			adoptPreferences(rec.payload);
		} catch {
			toast.error("Fichier illisible");
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "max-w-2xl text-sm leading-relaxed text-muted-foreground text-pretty",
				children: "Couleurs, polices, propriétés, étages, pièces et leurs textes. Les pions et les notes de partie restent à part — ceci n’enregistre que le plan et l’interface."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:p-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						htmlFor: "save-name",
						children: "Nouveau jeu de réglages"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col gap-2 sm:flex-row",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "save-name",
							value: draft,
							onChange: (e) => setDraft(e.target.value),
							placeholder: defaultSaveName(),
							className: "min-w-0 flex-1",
							onKeyDown: (e) => {
								if (e.key === "Enter") {
									e.preventDefault();
									saveNow();
								}
							}
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							type: "button",
							...pressProps(saveNow),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Save, { className: "size-4" }), "Enregistrer"]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								type: "button",
								variant: "outline",
								size: "sm",
								...pressProps(() => downloadCurrent(draft || defaultSaveName())),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "size-4" }), "Télécharger"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								type: "button",
								variant: "outline",
								size: "sm",
								...pressProps(() => fileRef.current?.click()),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, { className: "size-4" }), "Importer un fichier"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								ref: fileRef,
								type: "file",
								accept: "application/json,.json",
								className: "sr-only",
								"aria-label": "Importer des réglages",
								onChange: (e) => {
									const file = e.target.files?.[0];
									e.target.value = "";
									onFile(file);
								}
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted-foreground",
						children: lastAutoAt ? `Dernière copie automatique : ${formatSavedAt(lastAutoAt)}` : "Une copie se fait toute seule dès que vous changez l’apparence, une propriété ou un texte."
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "flex flex-col gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-lg font-medium tracking-[-0.02em]",
					children: "Mes réglages"
				}), named.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "rounded-lg border border-dashed border-border bg-card px-4 py-6 text-sm text-muted-foreground",
					children: "Aucun jeu enregistré. Changez les couleurs ou les pièces, puis donnez un nom à cette configuration."
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "flex flex-col gap-2",
					children: named.map((rec) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SaveCard, {
						record: rec,
						onRestore: () => restore(rec),
						onDownload: () => downloadSave(rec),
						onOverwrite: () => {
							overwriteSave(rec.id);
							toast.success(`« ${rec.name} » mise à jour`);
						},
						onDelete: () => {
							deleteSave(rec.id);
							toast.message("Réglages retirés");
						}
					}, rec.id))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "flex flex-col gap-3 pb-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-lg font-medium tracking-[-0.02em]",
					children: "Historique automatique"
				}), autos.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted-foreground",
					children: "Rien encore. Modifiez l’apparence, une propriété ou une description."
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "flex flex-col gap-2",
					children: autos.map((rec) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SaveCard, {
						record: rec,
						auto: true,
						onRestore: () => restore(rec),
						onDownload: () => downloadSave(rec),
						onDelete: () => {
							deleteSave(rec.id);
							toast.message("Copie retirée");
						}
					}, rec.id))
				})]
			})
		]
	});
}
function SaveCard({ record, auto, onRestore, onDownload, onOverwrite, onDelete }) {
	const theme = appearanceOf(record.payload);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
		className: "flex flex-col gap-3 rounded-lg border border-border bg-card p-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex min-w-0 items-start gap-3",
			children: [theme ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "flex shrink-0 gap-1 pt-0.5",
				"aria-hidden": true,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "size-4 rounded-sm border border-border",
					style: { background: theme.background }
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "size-4 rounded-sm border border-border",
					style: { background: theme.primary }
				})]
			}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-w-0",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "truncate text-sm font-medium",
					children: record.name
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-xs text-muted-foreground",
					children: [formatSavedAt(record.savedAt), saveBlurb(record.payload) ? ` · ${saveBlurb(record.payload)}` : ""]
				})]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-wrap gap-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					type: "button",
					size: "sm",
					...pressProps(onRestore),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FolderOpen, { className: "size-4" }), "Restaurer"]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					type: "button",
					variant: "outline",
					size: "sm",
					...pressProps(onDownload),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "size-4" }), "Fichier"]
				}),
				onOverwrite && !auto ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					type: "button",
					variant: "outline",
					size: "sm",
					...pressProps(onOverwrite),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Save, { className: "size-4" }), "Écraser"]
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					type: "button",
					variant: "outline",
					size: "sm",
					"aria-label": `Supprimer ${record.name}`,
					...pressProps(onDelete),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-4" }), "Supprimer"]
				})
			]
		})]
	});
}
function SauvegardesPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-dvh bg-background text-foreground",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
			className: "border-b border-border",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mx-auto flex h-12 w-full max-w-2xl items-center px-4 sm:px-6",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, { title: "Sauvegardes" })
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
			className: "mx-auto w-full max-w-2xl px-4 py-6 sm:px-6 sm:py-8",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SaveManager, {})
		})]
	});
}
//#endregion
export { SauvegardesPage as component };
