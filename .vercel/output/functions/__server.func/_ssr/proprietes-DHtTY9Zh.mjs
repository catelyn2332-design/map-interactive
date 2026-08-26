import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { _ as Plus, s as Trash2 } from "../_libs/lucide-react.mjs";
import { B as newProp, F as DEFAULT_PROPS, I as PROP_TYPES, L as TONE_OPTIONS, U as schemasEqual, b as useAtlas, z as newOption } from "./router-0jzItr0j.mjs";
import { n as cn, r as pressProps, t as Button } from "./press-UBLDE-un.mjs";
import { t as Label } from "./label-Dn6Iajez.mjs";
import { t as SettingsShell } from "./settings-shell-B4409fB9.mjs";
import { t as Input } from "./input-Cu1eRQUe.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/proprietes-DHtTY9Zh.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var SELECT_CLASS = "h-11 rounded-md border border-input bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
function PropManager() {
	const schema = useAtlas((s) => s.schema);
	const setSchema = useAtlas((s) => s.setSchema);
	const resetSchema = useAtlas((s) => s.resetSchema);
	const [draft, setDraft] = (0, import_react.useState)("");
	const [draftType, setDraftType] = (0, import_react.useState)("choice");
	function currentSchema() {
		return useAtlas.getState().schema;
	}
	function update(id, patch) {
		setSchema(currentSchema().map((def) => {
			if (def.id !== id) {
				if (patch.mapTint) return {
					...def,
					mapTint: false
				};
				return def;
			}
			return {
				...def,
				...patch
			};
		}));
	}
	function remove(id) {
		setSchema(currentSchema().filter((def) => def.id !== id));
	}
	function addOption(def, label) {
		const trimmed = label.trim();
		if (!trimmed) return;
		const latest = currentSchema().find((d) => d.id === def.id) ?? def;
		const used = new Set(latest.options.map((o) => o.id));
		update(def.id, { options: [...latest.options, newOption(trimmed, used)] });
	}
	function patchOption(def, optionId, patch) {
		const latest = currentSchema().find((d) => d.id === def.id) ?? def;
		update(def.id, { options: latest.options.map((o) => o.id === optionId ? {
			...o,
			...patch
		} : o) });
	}
	function removeOption(def, optionId) {
		const latest = currentSchema().find((d) => d.id === def.id) ?? def;
		update(def.id, { options: latest.options.filter((o) => o.id !== optionId) });
	}
	function addProp() {
		const name = draft.trim();
		setSchema([...currentSchema(), newProp({
			name: name || "Nouvelle propriété",
			type: draftType
		})]);
		setDraft("");
	}
	const dirty = !schemasEqual(schema, DEFAULT_PROPS);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "max-w-2xl text-sm leading-relaxed text-muted-foreground text-pretty",
				children: "Chaque propriété est la vôtre : nom, type, options. L’atlas n’en impose aucune. Les pièces s’en servent. Celles marquées filtrables apparaissent dans Filtrer. Toutes peuvent être supprimées."
			}),
			schema.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "rounded-lg border border-dashed border-border bg-card px-4 py-6 text-sm text-muted-foreground",
				children: "Aucune propriété. Créez celles dont votre histoire a besoin — lumière, règle, faction, accès… Rien n’est bloqué."
			}) : schema.map((def) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
				className: "flex flex-col gap-4 rounded-lg border border-border bg-card p-4 sm:p-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-4 sm:grid-cols-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: `name-${def.id}`,
								children: "Nom"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: `name-${def.id}`,
								value: def.name,
								onChange: (e) => update(def.id, { name: e.target.value })
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: `type-${def.id}`,
									children: "Type"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
									id: `type-${def.id}`,
									value: def.type,
									onChange: (e) => update(def.id, { type: e.target.value }),
									className: SELECT_CLASS,
									children: PROP_TYPES.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: t.id,
										children: t.label
									}, t.id))
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-muted-foreground",
									children: PROP_TYPES.find((t) => t.id === def.type)?.hint
								})
							]
						})]
					}),
					def.type !== "text" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "flex flex-col gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Options" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
								className: "flex flex-col gap-2",
								children: def.options.map((opt) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
									className: "flex flex-wrap items-center gap-2",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											value: opt.label,
											onChange: (e) => patchOption(def, opt.id, { label: e.target.value }),
											className: "min-w-0 flex-1",
											"aria-label": "Libellé de l’option"
										}),
										def.mapTint ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
											value: opt.tone ?? "default",
											onChange: (e) => patchOption(def, opt.id, { tone: e.target.value }),
											className: cn(SELECT_CLASS, "h-11 w-32 shrink-0"),
											"aria-label": "Teinte sur le plan",
											children: TONE_OPTIONS.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: t.id,
												children: t.label
											}, t.id))
										}) : null,
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											type: "button",
											variant: "outline",
											size: "icon",
											"aria-label": `Retirer ${opt.label}`,
											...pressProps(() => removeOption(def, opt.id)),
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-4" })
										})
									]
								}, opt.id))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OptionDraft, { onAdd: (label) => addOption(def, label) })
						]
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								variant: def.filterable ? "default" : "outline",
								size: "sm",
								...pressProps(() => update(def.id, { filterable: !def.filterable })),
								children: def.filterable ? "Filtrable" : "Non filtrable"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								variant: def.mapTint ? "default" : "outline",
								size: "sm",
								...pressProps(() => update(def.id, { mapTint: !def.mapTint })),
								children: def.mapTint ? "Teinte le plan" : "Sans teinte"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								type: "button",
								variant: "outline",
								size: "sm",
								...pressProps(() => remove(def.id)),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-4" }), "Supprimer"]
							})
						]
					})
				]
			}, def.id)),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-3 rounded-lg border border-dashed border-border p-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
					htmlFor: "new-prop",
					children: "Nouvelle propriété"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-2 sm:flex-row",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "new-prop",
							value: draft,
							onChange: (e) => setDraft(e.target.value),
							placeholder: "Nom (lumière, règle, chaleur…)",
							className: "min-w-0 flex-1",
							onKeyDown: (e) => {
								if (e.key === "Enter") {
									e.preventDefault();
									addProp();
								}
							}
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
							value: draftType,
							onChange: (e) => setDraftType(e.target.value),
							className: cn(SELECT_CLASS, "sm:w-44"),
							"aria-label": "Type de la nouvelle propriété",
							children: PROP_TYPES.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: t.id,
								children: t.label
							}, t.id))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							type: "button",
							variant: "outline",
							...pressProps(addProp),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" }), "Ajouter"]
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-wrap items-center justify-end gap-3",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "button",
					variant: "outline",
					disabled: !dirty,
					...pressProps(resetSchema),
					children: "Tout retirer"
				})
			})
		]
	});
}
function OptionDraft({ onAdd }) {
	const [value, setValue] = (0, import_react.useState)("");
	function add() {
		onAdd(value);
		setValue("");
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex gap-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
			value,
			onChange: (e) => setValue(e.target.value),
			placeholder: "Ajouter une option",
			onKeyDown: (e) => {
				if (e.key === "Enter") {
					e.preventDefault();
					add();
				}
			}
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
			type: "button",
			variant: "outline",
			size: "icon",
			"aria-label": "Ajouter l’option",
			...pressProps(add),
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" })
		})]
	});
}
function ProprietesSettingsPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsShell, {
		title: "Propriétés",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PropManager, {})
	});
}
//#endregion
export { ProprietesSettingsPage as component };
