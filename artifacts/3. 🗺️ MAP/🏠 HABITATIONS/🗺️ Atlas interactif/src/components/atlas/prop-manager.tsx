import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { ColorWheel } from "@/components/atlas/color-wheel";
import { PropIcon, PROP_ICON_MAP } from "@/components/atlas/prop-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DEFAULT_PROPS,
  newOption,
  newProp,
  newVar,
  parseNameList,
  PROP_ICONS,
  PROP_TYPES,
  schemasEqual,
  TONE_OPTIONS,
  typeMeta,
  usesItemVars,
  usesOptions,
  VAR_KINDS,
} from "@/lib/map/props";
import { useAtlas } from "@/lib/map/store";
import { pressProps } from "@/lib/press";
import type {
  PropDef,
  PropIconId,
  PropPrimitive,
  PropTone,
  PropType,
  PropVar,
  PropVarKind,
} from "@/lib/map/types";
import { cn } from "@/lib/utils";

const SELECT_CLASS =
  "h-11 rounded-md border border-input bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function PropManager() {
  const schema = useAtlas((s) => s.schema);
  const setSchema = useAtlas((s) => s.setSchema);
  const resetSchema = useAtlas((s) => s.resetSchema);
  const [draft, setDraft] = useState("");
  const [draftType, setDraftType] = useState<PropType>("choice");

  function currentSchema() {
    return useAtlas.getState().schema;
  }

  function update(id: string, patch: Partial<PropDef>) {
    setSchema(
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
        return next;
      }),
    );
  }

  function remove(id: string) {
    setSchema(currentSchema().filter((def) => def.id !== id));
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

  function setOptionVar(
    def: PropDef,
    optionId: string,
    varId: string,
    value: PropPrimitive,
  ) {
    const latest = currentSchema().find((d) => d.id === def.id) ?? def;
    const opt = latest.options.find((o) => o.id === optionId);
    if (!opt) return;
    patchOption(def, optionId, { vars: { ...(opt.vars ?? {}), [varId]: value } });
  }

  function removeOption(def: PropDef, optionId: string) {
    const latest = currentSchema().find((d) => d.id === def.id) ?? def;
    update(def.id, {
      options: latest.options.filter((o) => o.id !== optionId),
    });
  }

  function addVar(def: PropDef, name: string, kind: PropVarKind) {
    const latest = currentSchema().find((d) => d.id === def.id) ?? def;
    const v = newVar({ name: name.trim() || "Variable", kind });
    update(def.id, { vars: [...latest.vars, v] });
  }

  function patchVar(def: PropDef, varId: string, patch: Partial<PropVar>) {
    const latest = currentSchema().find((d) => d.id === def.id) ?? def;
    update(def.id, {
      vars: latest.vars.map((v) => (v.id === varId ? { ...v, ...patch } : v)),
    });
  }

  function removeVar(def: PropDef, varId: string) {
    const latest = currentSchema().find((d) => d.id === def.id) ?? def;
    update(def.id, {
      vars: latest.vars.filter((v) => v.id !== varId),
      options: latest.options.map((o) => {
        if (!o.vars || o.vars[varId] === undefined) return o;
        const next = { ...o.vars };
        delete next[varId];
        return { ...o, vars: next };
      }),
    });
  }

  function addProp() {
    const name = draft.trim();
    setSchema([
      ...currentSchema(),
      newProp({ name: name || "Nouvelle propriété", type: draftType }),
    ]);
    setDraft("");
  }

  const dirty = !schemasEqual(schema, DEFAULT_PROPS);

  return (
    <div className="flex flex-col gap-6">
      <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground text-pretty">
        Chaque propriété a un type (icône), des données prédéfinies si besoin, et
        les variables que vous inventez. Le type Pions recrée des personnages
        posables sur le plan — abréviation, couleur, rôle, ou tout autre champ.
      </p>

      {schema.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border bg-card px-4 py-6 text-sm text-muted-foreground">
          Aucune propriété. Créez celles dont votre histoire a besoin — lumière,
          règle, faction, pions… Rien n’est bloqué.
        </p>
      ) : (
        schema.map((def) => (
          <article
            key={def.id}
            className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4 sm:p-5"
          >
            <div className="flex items-start gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-md border border-border bg-background text-foreground">
                <PropIcon id={def.icon} type={def.type} className="size-5" />
              </span>
              <div className="grid min-w-0 flex-1 gap-4 sm:grid-cols-2">
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
                    id={`type-${def.id}`}
                    value={def.type}
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
                </div>
              </div>
            </div>

            <section className="flex flex-col gap-2">
              <Label>Icône</Label>
              <div className="flex flex-wrap gap-1">
                {PROP_ICONS.map((id) => {
                  const Icon = PROP_ICON_MAP[id];
                  const on = (def.icon ?? typeMeta(def.type).icon) === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      {...pressProps(() => update(def.id, { icon: id }))}
                      aria-label={`Icône ${id}`}
                      aria-pressed={on}
                      className={cn(
                        "grid size-11 place-items-center rounded-md border transition-colors",
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
            </section>

            {usesOptions(def.type) ? (
              <section className="flex flex-col gap-3">
                <Label>
                  {def.type === "token"
                    ? "Pions prédéfinis"
                    : "Données prédéfinies"}
                </Label>
                <p className="text-xs text-muted-foreground">
                  Donnez un nom à chaque entrée. Pour un choix multiple, cochez
                  ensuite celles qui s’appliquent à la pièce.
                </p>
                <ul className="flex flex-col gap-3">
                  {def.options.map((opt) => (
                    <li
                      key={opt.id}
                      className="flex flex-col gap-2 rounded-md border border-border bg-background p-3"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <Input
                          value={opt.label}
                          onChange={(e) =>
                            patchOption(def, opt.id, { label: e.target.value })
                          }
                          className="min-w-0 flex-1"
                          aria-label="Nom de la donnée"
                        />
                        {def.mapTint ? (
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
                      </div>
                      {def.vars.length ? (
                        <div className="grid gap-2 sm:grid-cols-2">
                          {def.vars.map((v) => (
                            <VarInput
                              key={v.id}
                              variable={v}
                              value={opt.vars?.[v.id]}
                              onChange={(value) =>
                                setOptionVar(def, opt.id, v.id, value)
                              }
                            />
                          ))}
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ul>
                <OptionDraft onAdd={(label) => addOption(def, label)} />
                <BulkNames onAdd={(raw) => addOptions(def, raw)} />
              </section>
            ) : null}

            <section className="flex flex-col gap-3">
              <Label>Variables</Label>
              <p className="text-xs text-muted-foreground">
                {usesItemVars(def.type)
                  ? "Champs propres à chaque donnée prédéfinie — couleur, initiale, rôle, ce que vous voulez."
                  : "Champs supplémentaires remplis pièce par pièce, en plus de la valeur principale."}
              </p>
              {def.vars.length ? (
                <ul className="flex flex-col gap-2">
                  {def.vars.map((v) => (
                    <li key={v.id} className="flex flex-wrap items-center gap-2">
                      <Input
                        value={v.name}
                        onChange={(e) =>
                          patchVar(def, v.id, { name: e.target.value })
                        }
                        className="min-w-0 flex-1"
                        aria-label="Nom de la variable"
                      />
                      <select
                        value={v.kind}
                        onChange={(e) =>
                          patchVar(def, v.id, {
                            kind: e.target.value as PropVarKind,
                          })
                        }
                        className={cn(SELECT_CLASS, "sm:w-40")}
                        aria-label="Type de variable"
                      >
                        {VAR_KINDS.map((k) => (
                          <option key={k.id} value={k.id}>
                            {k.label}
                          </option>
                        ))}
                      </select>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        aria-label={`Retirer ${v.name}`}
                        {...pressProps(() => removeVar(def, v.id))}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Aucune variable. Ajoutez-en pour rendre cette propriété unique.
                </p>
              )}
              <VarDraft onAdd={(name, kind) => addVar(def, name, kind)} />
            </section>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={def.filterable ? "default" : "outline"}
                size="sm"
                {...pressProps(() =>
                  update(def.id, { filterable: !def.filterable }),
                )}
              >
                {def.filterable ? "Filtrable" : "Non filtrable"}
              </Button>
              <Button
                type="button"
                variant={def.mapTint ? "default" : "outline"}
                size="sm"
                {...pressProps(() => update(def.id, { mapTint: !def.mapTint }))}
              >
                {def.mapTint ? "Teinte le plan" : "Sans teinte"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                {...pressProps(() => remove(def.id))}
              >
                <Trash2 className="size-4" />
                Supprimer
              </Button>
            </div>
          </article>
        ))
      )}

      <div className="flex flex-col gap-3 rounded-lg border border-dashed border-border p-4">
        <Label htmlFor="new-prop">Nouvelle propriété</Label>
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
            placeholder="Nom (lumière, pions, règle…)"
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

function OptionDraft({ onAdd }: { onAdd: (label: string) => void }) {
  const [value, setValue] = useState("");
  function add() {
    onAdd(value);
    setValue("");
  }
  return (
    <div className="flex gap-2">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Nom d’une donnée"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            add();
          }
        }}
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label="Ajouter la donnée"
        {...pressProps(add)}
      >
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
        aria-label="Liste de noms prédéfinis"
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

function VarDraft({
  onAdd,
}: {
  onAdd: (name: string, kind: PropVarKind) => void;
}) {
  const [name, setName] = useState("");
  const [kind, setKind] = useState<PropVarKind>("text");
  function add() {
    onAdd(name, kind);
    setName("");
  }
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nom de variable (couleur, initiale…)"
        className="min-w-0 flex-1"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            add();
          }
        }}
      />
      <select
        value={kind}
        onChange={(e) => setKind(e.target.value as PropVarKind)}
        className={cn(SELECT_CLASS, "sm:w-40")}
        aria-label="Type de la variable"
      >
        {VAR_KINDS.map((k) => (
          <option key={k.id} value={k.id}>
            {k.label}
          </option>
        ))}
      </select>
      <Button type="button" variant="outline" {...pressProps(add)}>
        <Plus className="size-4" />
        Variable
      </Button>
    </div>
  );
}

function VarInput({
  variable,
  value,
  onChange,
}: {
  variable: PropVar;
  value: PropPrimitive | undefined;
  onChange: (value: PropPrimitive) => void;
}) {
  if (variable.kind === "toggle") {
    const on = value === true;
    return (
      <div className="flex flex-col gap-1.5">
        <p className="text-xs text-muted-foreground">{variable.name}</p>
        <Button
          type="button"
          size="sm"
          variant={on ? "default" : "outline"}
          {...pressProps(() => onChange(!on))}
        >
          {on ? "Oui" : "Non"}
        </Button>
      </div>
    );
  }
  if (variable.kind === "color") {
    const hex = typeof value === "string" ? value : "#6a7a58";
    return (
      <ColorWheel
        id={`var-${variable.id}`}
        label={variable.name}
        value={hex}
        onChange={onChange}
      />
    );
  }
  if (variable.kind === "number") {
    return (
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`var-${variable.id}`}>{variable.name}</Label>
        <Input
          id={`var-${variable.id}`}
          type="number"
          value={typeof value === "number" ? value : value === "" ? "" : Number(value) || ""}
          onChange={(e) => {
            const n = e.target.value;
            onChange(n === "" ? 0 : Number(n));
          }}
        />
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={`var-${variable.id}`}>{variable.name}</Label>
      <Input
        id={`var-${variable.id}`}
        value={typeof value === "string" ? value : value == null ? "" : String(value)}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
