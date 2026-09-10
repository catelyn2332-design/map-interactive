import { Pencil, Plus, Redo2, Trash2, Undo2 } from "lucide-react";
import { useState } from "react";
import { ColorWheel } from "@/components/atlas/color-wheel";
import { PropIcon, PROP_ICON_MAP } from "@/components/atlas/prop-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import {
  DEFAULT_PROPS,
  hasAction,
  isBuiltinProp,
  MAP_ACTION_GROUPS,
  MAP_ACTIONS,
  newOption,
  newProp,
  newRule,
  parseNameList,
  PROP_ICONS,
  PROP_TYPES,
  RULE_OPS,
  schemasEqual,
  TONE_OPTIONS,
  typeMeta,
  usesClosedList,
  usesDictionary,
  usesOpenChoices,
} from "@/lib/map/props";
import { useAtlas } from "@/lib/map/store";
import { pressProps } from "@/lib/press";
import type {
  PropActionId,
  PropDef,
  PropIconId,
  PropPrimitive,
  PropRule,
  PropTone,
  PropType,
} from "@/lib/map/types";
import { cn } from "@/lib/utils";

const SELECT_CLASS =
  "h-11 rounded-md border border-input bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function PropManager() {
  const schema = useAtlas((s) => s.schema);
  const setSchema = useAtlas((s) => s.setSchema);
  const resetSchema = useAtlas((s) => s.resetSchema);
  const [draft, setDraft] = useState("");
  const [draftType, setDraftType] = useState<PropType>("preset");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [past, setPast] = useState<PropDef[][]>([]);
  const [future, setFuture] = useState<PropDef[][]>([]);

  function currentSchema() {
    return useAtlas.getState().schema;
  }

  function commit(next: PropDef[]) {
    const prev = currentSchema();
    setPast((p) => [...p, prev].slice(-40));
    setFuture([]);
    setSchema(next);
  }

  function undo() {
    const prev = past[past.length - 1];
    if (!prev) return;
    setPast((p) => p.slice(0, -1));
    setFuture((f) => [...f, currentSchema()]);
    setSchema(prev);
  }

  function redo() {
    const next = future[future.length - 1];
    if (!next) return;
    setFuture((f) => f.slice(0, -1));
    setPast((p) => [...p, currentSchema()]);
    setSchema(next);
  }

  function update(id: string, patch: Partial<PropDef>) {
    commit(
      currentSchema().map((def) => {
        if (def.id !== id) {
          if (patch.mapTint) return { ...def, mapTint: false };
          return def;
        }
        let next: PropDef = { ...def, ...patch };
        if (patch.type && patch.type !== def.type) {
          const meta = typeMeta(patch.type);
          if (patch.filterable === undefined) next.filterable = meta.filterable;
          if (!patch.icon) next.icon = meta.icon;
          if (patch.type === "token" && def.vars.length === 0) {
            next.vars = newProp({ type: "token" }).vars;
          }
        }
        if (next.actions) {
          next.mapTint = next.actions.includes("tint");
          next.filterable = next.actions.includes("filter") || Boolean(next.filterable);
        }
        return next;
      }),
    );
  }

  function toggleAction(def: PropDef, id: PropActionId) {
    const current = new Set(def.actions ?? []);
    if (id === "tint" && def.mapTint) current.add("tint");
    if (id === "filter" && def.filterable) current.add("filter");
    if (current.has(id)) current.delete(id);
    else current.add(id);
    const actions = [...current] as PropActionId[];
    update(def.id, {
      actions,
      mapTint: actions.includes("tint"),
      filterable: actions.includes("filter"),
    });
  }

  function remove(id: string) {
    if (isBuiltinProp(id)) return;
    if (editingId === id) setEditingId(null);
    commit(currentSchema().filter((def) => def.id !== id));
  }

  function addOption(def: PropDef, label: string) {
    const trimmed = label.trim();
    if (!trimmed) return;
    const latest = currentSchema().find((d) => d.id === def.id) ?? def;
    const used = new Set(latest.options.map((o) => o.id));
    update(def.id, {
      options: [...latest.options, newOption(trimmed, used, latest.vars)],
    });
  }

  function addOptions(def: PropDef, raw: string) {
    const names = parseNameList(raw);
    if (!names.length) return;
    const latest = currentSchema().find((d) => d.id === def.id) ?? def;
    const used = new Set(latest.options.map((o) => o.id));
    const options = [...latest.options];
    for (const name of names) options.push(newOption(name, used, latest.vars));
    update(def.id, { options });
  }

  function patchOption(
    def: PropDef,
    optionId: string,
    patch: { label?: string; tone?: PropTone; vars?: Record<string, PropPrimitive> },
  ) {
    const latest = currentSchema().find((d) => d.id === def.id) ?? def;
    update(def.id, {
      options: latest.options.map((o) =>
        o.id === optionId ? { ...o, ...patch, vars: patch.vars ?? o.vars } : o,
      ),
    });
  }

  function removeOption(def: PropDef, optionId: string) {
    const latest = currentSchema().find((d) => d.id === def.id) ?? def;
    update(def.id, {
      options: latest.options.filter((o) => o.id !== optionId),
    });
  }

  function addProp() {
    const name = draft.trim();
    const created = newProp({ name: name || "Nouvelle propriété", type: draftType });
    commit([...currentSchema(), created]);
    setDraft("");
    setEditingId(created.id);
    setCreating(false);
  }

  const dirty = !schemasEqual(schema, DEFAULT_PROPS);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!past.length}
          aria-label="Annuler"
          {...pressProps(undo)}
        >
          <Undo2 className="size-4" />
          Annuler
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!future.length}
          aria-label="Rétablir"
          {...pressProps(redo)}
        >
          <Redo2 className="size-4" />
          Rétablir
        </Button>
      </div>

      <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground text-pretty">
        Chaque propriété s’affiche en aperçu. Touchez le crayon pour modifier.
        L’icône s’ouvre dans une petite page. Les actions décident de l’effet
        sur le plan.
      </p>

      {schema.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border bg-card px-4 py-6 text-sm text-muted-foreground">
          Aucune propriété. Créez celles dont votre histoire a besoin.
        </p>
      ) : (
        schema.map((def) => {
          const open = editingId === def.id;
          const meta = typeMeta(def.type);
          return (
            <article
              key={def.id}
              className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:p-5"
            >
              <div className="flex items-start gap-3">
                {open ? (
                  <IconPicker
                    value={def.icon ?? meta.icon}
                    type={def.type}
                    onChange={(icon) => update(def.id, { icon })}
                  />
                ) : (
                  <span className="grid size-11 shrink-0 place-items-center rounded-md border border-border bg-background text-foreground">
                    <PropIcon id={def.icon} type={def.type} className="size-5" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-medium leading-tight">{def.name || "Sans nom"}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {meta.label}
                    {isBuiltinProp(def.id) ? " · par défaut" : ""}
                    {usesClosedList(def.type)
                      ? ` · ${def.options.length} valeur${def.options.length > 1 ? "s" : ""}${def.multi ? " · plusieurs" : ""}`
                      : usesDictionary(def.type)
                        ? ` · ${def.options.length} mot${def.options.length > 1 ? "s" : ""}-clé${def.options.length > 1 ? "s" : ""}`
                        : usesOpenChoices(def.type)
                        ? " · sur pièce / zone"
                        : def.type === "path"
                          ? " · fichier du workspace"
                          : ""}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    type="button"
                    variant={open ? "default" : "outline"}
                    size="icon"
                    aria-label={open ? "Fermer l’édition" : "Modifier"}
                    {...pressProps(() => setEditingId(open ? null : def.id))}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label={`Supprimer ${def.name}`}
                    disabled={isBuiltinProp(def.id)}
                    title={isBuiltinProp(def.id) ? "Propriété par défaut" : undefined}
                    {...pressProps(() => remove(def.id))}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>

              {open ? (
                <PropEditor
                  def={def}
                  update={update}
                  toggleAction={toggleAction}
                  addOption={addOption}
                  addOptions={addOptions}
                  patchOption={patchOption}
                  removeOption={removeOption}
                />
              ) : null}
            </article>
          );
        })
      )}

      {creating ? (
      <div className="flex flex-col gap-3 rounded-lg border border-dashed border-border p-4">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="new-prop">Nouvelle propriété</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            {...pressProps(() => setCreating(false))}
          >
            Annuler
          </Button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PROP_TYPES.map((t) => (
            <button
              key={t.id}
              type="button"
              {...pressProps(() => setDraftType(t.id))}
              aria-pressed={draftType === t.id}
              className={cn(
                "inline-flex h-11 items-center gap-2 rounded-md border px-3 text-sm transition-colors",
                draftType === t.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <PropIcon id={t.icon} />
              {t.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">{typeMeta(draftType).hint}</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            id="new-prop"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Nom (lumière, accès, faction…)"
            className="min-w-0 flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addProp();
              }
            }}
          />
          <Button type="button" variant="outline" {...pressProps(addProp)}>
            <Plus className="size-4" />
            Ajouter
          </Button>
        </div>
      </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="self-start"
          {...pressProps(() => setCreating(true))}
        >
          <Plus className="size-4" />
          Nouvelle propriété
        </Button>
      )}

      <div className="flex flex-wrap items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={!dirty}
          {...pressProps(resetSchema)}
        >
          Tout retirer
        </Button>
      </div>
    </div>
  );
}

function PropEditor({
  def,
  update,
  toggleAction,
  addOption,
  addOptions,
  patchOption,
  removeOption,
}: {
  def: PropDef;
  update: (id: string, patch: Partial<PropDef>) => void;
  toggleAction: (def: PropDef, id: PropActionId) => void;
  addOption: (def: PropDef, label: string) => void;
  addOptions: (def: PropDef, raw: string) => void;
  patchOption: (
    def: PropDef,
    optionId: string,
    patch: { label?: string; tone?: PropTone; vars?: Record<string, PropPrimitive> },
  ) => void;
  removeOption: (def: PropDef, optionId: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4 border-t border-border pt-4">
      <div className="grid min-w-0 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor={`name-${def.id}`}>Nom</Label>
          <Input
            id={`name-${def.id}`}
            value={def.name}
            onChange={(e) => update(def.id, { name: e.target.value })}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Type</Label>
          <select
            value={def.type}
            disabled={isBuiltinProp(def.id)}
            onChange={(e) =>
              update(def.id, { type: e.target.value as PropType })
            }
            className={SELECT_CLASS}
            aria-label="Type de propriété"
          >
            {PROP_TYPES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            {typeMeta(def.type).hint}
          </p>
          {def.type === "preset" && !isBuiltinProp(def.id) ? (
            <button
              type="button"
              aria-pressed={Boolean(def.multi)}
              {...pressProps(() => update(def.id, { multi: !def.multi }))}
              className={cn(
                "mt-1 flex h-11 items-center justify-between rounded-md border px-3 text-sm",
                def.multi
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground",
              )}
            >
              Plusieurs valeurs
              <span className="text-xs">{def.multi ? "Oui" : "Non"}</span>
            </button>
          ) : null}
        </div>
      </div>

      {usesClosedList(def.type) || def.type === "color" || usesDictionary(def.type) ? (
        <section className="flex flex-col gap-3">
          <Label>
            {def.type === "token"
              ? "Pions"
              : def.type === "color"
                ? "Teintes prédéfinies"
                : def.type === "keyword"
                  ? "Mots-clés"
                  : "Valeurs prédéfinies"}
          </Label>
          {def.type === "keyword" ? (
            <p className="text-xs text-muted-foreground">
              Vous pouvez seulement renommer la propriété ici. Les mots-clés se
              créent aussi en tapant Entrée sur une pièce ou une zone.
            </p>
          ) : null}
          <ul className="flex flex-col gap-2">
            {def.options.map((opt) => (
              <li
                key={opt.id}
                className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-background p-2"
              >
                {def.type === "color" ? (
                  <ColorWheel
                    id={`opt-color-${opt.id}`}
                    label=""
                    value={
                      typeof opt.vars?.color === "string"
                        ? opt.vars.color
                        : "#6a7a58"
                    }
                    onChange={(color) =>
                      patchOption(def, opt.id, {
                        vars: { ...(opt.vars ?? {}), color },
                        label: opt.label,
                      })
                    }
                  />
                ) : null}
                <Input
                  value={opt.label}
                  onChange={(e) =>
                    patchOption(def, opt.id, { label: e.target.value })
                  }
                  className="min-w-0 flex-1"
                  aria-label="Nom de la valeur"
                />
                {hasAction(def, "tint") ? (
                  <select
                    value={opt.tone ?? "default"}
                    onChange={(e) =>
                      patchOption(def, opt.id, {
                        tone: e.target.value as PropTone,
                      })
                    }
                    className={cn(SELECT_CLASS, "h-11 w-32 shrink-0")}
                    aria-label="Teinte sur le plan"
                  >
                    {TONE_OPTIONS.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                ) : null}
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label={`Retirer ${opt.label}`}
                  {...pressProps(() => removeOption(def, opt.id))}
                >
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
          <TypedValueDraft type={def.type} onAdd={(label) => addOption(def, label)} />
          {def.type !== "color" ? (
            <BulkNames onAdd={(raw) => addOptions(def, raw)} />
          ) : null}
        </section>
      ) : usesOpenChoices(def.type) ? (
        <p className="text-xs text-muted-foreground">
          Les valeurs se saisissent sur chaque pièce ou zone, pas ici.
        </p>
      ) : def.type === "path" ? (
        <p className="text-xs text-muted-foreground">
          Sur une pièce, vous choisissez un fichier du workspace (chemin).
        </p>
      ) : def.type === "toggle" ? (
        <p className="text-xs text-muted-foreground">
          Sur une pièce, seules les valeurs Oui et Non sont proposées.
        </p>
      ) : def.type === "number" ? (
        <p className="text-xs text-muted-foreground">
          Sur une pièce, seul un nombre peut être saisi.
        </p>
      ) : null}

      <section className="flex flex-col gap-2">
        <Label>Actions sur la carte</Label>
        <p className="text-xs text-muted-foreground">
          Effets de cette propriété. Ouvrez un groupe, puis choisissez.
        </p>
        {MAP_ACTION_GROUPS.map((group) => (
          <details key={group.id} className="rounded-md border border-border bg-background">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 px-3 text-sm font-medium">
              <span>
                {group.label}
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  {group.hint}
                </span>
              </span>
              <span className="text-xs text-muted-foreground">
                {group.actions.filter((a) => hasAction(def, a.id)).length || ""}
              </span>
            </summary>
            <div className="flex flex-wrap gap-1.5 border-t border-border p-3">
              {group.actions.map((action) => {
                const on = hasAction(def, action.id);
                return (
                  <button
                    key={action.id}
                    type="button"
                    {...pressProps(() => toggleAction(def, action.id))}
                    aria-pressed={on}
                    title={action.hint}
                    className={cn(
                      "inline-flex h-11 items-center rounded-md border px-3 text-sm transition-colors",
                      on
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground",
                    )}
                  >
                    {action.label}
                  </button>
                );
              })}
            </div>
          </details>
        ))}
      </section>

      <RulesEditor
        def={def}
        onChange={(rules) => update(def.id, { rules })}
      />
    </div>
  );
}

function RulesEditor({
  def,
  onChange,
}: {
  def: PropDef;
  onChange: (rules: PropRule[]) => void;
}) {
  const rules = def.rules ?? [];
  function patch(id: string, next: Partial<PropRule>) {
    onChange(rules.map((r) => (r.id === id ? { ...r, ...next } : r)));
  }
  return (
    <section className="flex flex-col gap-2">
      <Label>Règles</Label>
      <p className="text-xs text-muted-foreground">
        Si la valeur de cette propriété correspond, l’action se déclenche.
      </p>
      <ul className="flex flex-col gap-2">
        {rules.map((rule) => {
          const op = RULE_OPS.find((o) => o.id === rule.op) ?? RULE_OPS[0]!;
          return (
            <li
              key={rule.id}
              className="flex flex-col gap-2 rounded-md border border-border bg-background p-3 sm:flex-row sm:flex-wrap sm:items-center"
            >
              <span className="text-xs text-muted-foreground">Si</span>
              <select
                value={rule.op}
                onChange={(e) =>
                  patch(rule.id, { op: e.target.value as PropRule["op"] })
                }
                className={cn(SELECT_CLASS, "h-11 min-w-[9rem]")}
                aria-label="Condition"
              >
                {RULE_OPS.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
              {op.needsValue ? (
                <Input
                  value={rule.value ?? ""}
                  onChange={(e) => patch(rule.id, { value: e.target.value })}
                  placeholder="valeur"
                  className="min-w-0 flex-1"
                  aria-label="Valeur de la règle"
                />
              ) : null}
              <span className="text-xs text-muted-foreground">alors</span>
              <select
                value={rule.action}
                onChange={(e) =>
                  patch(rule.id, { action: e.target.value as PropActionId })
                }
                className={cn(SELECT_CLASS, "h-11 min-w-[10rem]")}
                aria-label="Action de la règle"
              >
                {MAP_ACTIONS.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label}
                  </option>
                ))}
              </select>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Retirer la règle"
                {...pressProps(() => onChange(rules.filter((r) => r.id !== rule.id)))}
              >
                <Trash2 className="size-4" />
              </Button>
            </li>
          );
        })}
      </ul>
      <Button
        type="button"
        variant="outline"
        className="self-start"
        {...pressProps(() => onChange([...rules, newRule()]))}
      >
        <Plus className="size-4" />
        Ajouter une règle
      </Button>
    </section>
  );
}

function IconPicker({
  value,
  type,
  onChange,
}: {
  value: PropIconId;
  type: PropType;
  onChange: (id: PropIconId) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Changer l’icône"
          className="grid size-11 shrink-0 place-items-center rounded-md border border-border bg-background text-foreground hover:bg-accent"
        >
          <PropIcon id={value} type={type} className="size-5" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="start">
        <p className="mb-2 px-1 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Icône
        </p>
        <div className="flex flex-wrap gap-1">
          {PROP_ICONS.map((id) => {
            const Icon = PROP_ICON_MAP[id];
            const on = value === id;
            return (
              <button
                key={id}
                type="button"
                {...pressProps(() => {
                  onChange(id);
                  setOpen(false);
                })}
                aria-label={`Icône ${id}`}
                aria-pressed={on}
                className={cn(
                  "grid size-10 place-items-center rounded-md border transition-colors",
                  on
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <Icon className="size-4" />
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function TypedValueDraft({
  type,
  onAdd,
}: {
  type: PropType;
  onAdd: (label: string) => void;
}) {
  const [value, setValue] = useState("");
  const [hex, setHex] = useState("#6a7a58");
  function add() {
    if (type === "color") onAdd(value.trim() || hex);
    else if (type === "toggle") return;
    else onAdd(value);
    setValue("");
  }
  if (type === "toggle") return null;
  if (type === "color") {
    return (
      <div className="flex flex-wrap items-end gap-2">
        <ColorWheel id="new-swatch" label="" value={hex} onChange={setHex} />
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Nom de la teinte"
          className="min-w-0 flex-1"
        />
        <Button type="button" variant="outline" size="icon" aria-label="Ajouter" {...pressProps(add)}>
          <Plus className="size-4" />
        </Button>
      </div>
    );
  }
  if (type === "number") {
    return (
      <div className="flex gap-2">
        <Input
          type="number"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Nombre"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <Button type="button" variant="outline" size="icon" aria-label="Ajouter" {...pressProps(add)}>
          <Plus className="size-4" />
        </Button>
      </div>
    );
  }
  return (
    <div className="flex gap-2">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Nom d’une valeur"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            add();
          }
        }}
      />
      <Button type="button" variant="outline" size="icon" aria-label="Ajouter" {...pressProps(add)}>
        <Plus className="size-4" />
      </Button>
    </div>
  );
}

function BulkNames({ onAdd }: { onAdd: (raw: string) => void }) {
  const [value, setValue] = useState("");
  function add() {
    onAdd(value);
    setValue("");
  }
  return (
    <div className="flex flex-col gap-2">
      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={3}
        placeholder="Plusieurs noms, un par ligne ou séparés par des virgules"
        aria-label="Liste de valeurs prédéfinies"
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="self-start"
        disabled={!value.trim()}
        {...pressProps(add)}
      >
        <Plus className="size-4" />
        Ajouter ces noms
      </Button>
    </div>
  );
}
