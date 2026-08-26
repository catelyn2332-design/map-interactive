import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DEFAULT_PROPS,
  newOption,
  newProp,
  schemasEqual,
  TONE_OPTIONS,
  PROP_TYPES,
} from "@/lib/map/props";
import { useAtlas } from "@/lib/map/store";
import { pressProps } from "@/lib/press";
import type { PropDef, PropTone, PropType } from "@/lib/map/types";
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
        return { ...def, ...patch };
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
    update(def.id, { options: [...latest.options, newOption(trimmed, used)] });
  }

  function patchOption(
    def: PropDef,
    optionId: string,
    patch: { label?: string; tone?: PropTone },
  ) {
    const latest = currentSchema().find((d) => d.id === def.id) ?? def;
    update(def.id, {
      options: latest.options.map((o) =>
        o.id === optionId ? { ...o, ...patch } : o,
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
        Chaque propriété est la vôtre : nom, type, options. L’atlas n’en impose
        aucune. Les pièces s’en servent. Celles marquées filtrables apparaissent
        dans Filtrer. Toutes peuvent être supprimées.
      </p>

      {schema.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border bg-card px-4 py-6 text-sm text-muted-foreground">
          Aucune propriété. Créez celles dont votre histoire a besoin — lumière,
          règle, faction, accès… Rien n’est bloqué.
        </p>
      ) : (
        schema.map((def) => (
          <article
            key={def.id}
            className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4 sm:p-5"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor={`name-${def.id}`}>Nom</Label>
                <Input
                  id={`name-${def.id}`}
                  value={def.name}
                  onChange={(e) => update(def.id, { name: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor={`type-${def.id}`}>Type</Label>
                <select
                  id={`type-${def.id}`}
                  value={def.type}
                  onChange={(e) =>
                    update(def.id, { type: e.target.value as PropType })
                  }
                  className={SELECT_CLASS}
                >
                  {PROP_TYPES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  {PROP_TYPES.find((t) => t.id === def.type)?.hint}
                </p>
              </div>
            </div>

            {def.type !== "text" ? (
              <section className="flex flex-col gap-2">
                <Label>Options</Label>
                <ul className="flex flex-col gap-2">
                  {def.options.map((opt) => (
                    <li key={opt.id} className="flex flex-wrap items-center gap-2">
                      <Input
                        value={opt.label}
                        onChange={(e) =>
                          patchOption(def, opt.id, { label: e.target.value })
                        }
                        className="min-w-0 flex-1"
                        aria-label="Libellé de l’option"
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
                    </li>
                  ))}
                </ul>
                <OptionDraft onAdd={(label) => addOption(def, label)} />
              </section>
            ) : null}

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
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            id="new-prop"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Nom (lumière, règle, chaleur…)"
            className="min-w-0 flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addProp();
              }
            }}
          />
          <select
            value={draftType}
            onChange={(e) => setDraftType(e.target.value as PropType)}
            className={cn(SELECT_CLASS, "sm:w-44")}
            aria-label="Type de la nouvelle propriété"
          >
            {PROP_TYPES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
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
        placeholder="Ajouter une option"
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
        aria-label="Ajouter l’option"
        {...pressProps(add)}
      >
        <Plus className="size-4" />
      </Button>
    </div>
  );
}
