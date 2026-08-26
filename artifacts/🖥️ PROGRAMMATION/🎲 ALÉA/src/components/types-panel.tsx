import { Layers, X } from "lucide-react";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAleas } from "@/lib/store";
import {
  PATTERN_IDS,
  PATTERN_LABELS,
  allPatternOptions,
  isBuiltIn,
  patternLabel,
  type PatternId,
} from "@/lib/types";

export function TypesPanel() {
  const [open, setOpen] = useState(false);
  const customTypes = useAleas((s) => s.customTypes);
  const hiddenTypes = useAleas((s) => s.hiddenTypes);
  const subtypes = useAleas((s) => s.subtypes);
  const addType = useAleas((s) => s.addType);
  const updateType = useAleas((s) => s.updateType);
  const removeType = useAleas((s) => s.removeType);
  const restoreType = useAleas((s) => s.restoreType);
  const addSubtype = useAleas((s) => s.addSubtype);
  const updateSubtype = useAleas((s) => s.updateSubtype);
  const removeSubtype = useAleas((s) => s.removeSubtype);

  const [typeName, setTypeName] = useState("");
  const [subtypeName, setSubtypeName] = useState("");
  const [subtypeParent, setSubtypeParent] = useState<PatternId>("objet");
  const [editingType, setEditingType] = useState<string | null>(null);
  const [editingSubtype, setEditingSubtype] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const active = allPatternOptions(customTypes, hiddenTypes);
  const retired = PATTERN_IDS.filter((id) => hiddenTypes.includes(id));
  const parents = active;

  function createType(e: FormEvent) {
    e.preventDefault();
    const created = addType(typeName);
    if (!created) {
      toast("Type vide ou déjà existant");
      return;
    }
    toast(`Type « ${created.name} » créé`);
    setTypeName("");
    setSubtypeParent(created.id);
  }

  function createSubtype(e: FormEvent) {
    e.preventDefault();
    const created = addSubtype(subtypeName, subtypeParent);
    if (!created) {
      toast("Sous-type vide ou déjà existant");
      return;
    }
    toast(`Sous-type « ${created.name} » créé`);
    setSubtypeName("");
  }

  return (
    <>
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        <Layers />
        Types
      </Button>
      {open ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            className="absolute inset-0 bg-background/70"
            aria-label="Fermer les types"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-border bg-card shadow-xl">
            <header className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <p className="font-display text-xl tracking-tight">Types</p>
                <p className="text-sm text-muted-foreground">
                  Objet, thème, phénomène… retirez, ajoutez, rangez.
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Fermer">
                <X />
              </Button>
            </header>
            <div className="flex flex-1 flex-col gap-8 overflow-y-auto px-5 py-5">
              <section className="flex flex-col gap-3">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Types utilisés
                </p>
                <form onSubmit={createType} className="flex gap-2">
                  <Input
                    value={typeName}
                    onChange={(e) => setTypeName(e.target.value)}
                    placeholder="Couleur, animal, métier…"
                  />
                  <Button type="submit">Créer</Button>
                </form>
                <ul className="flex flex-col gap-2">
                  {active.map((type) => (
                    <li
                      key={type.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border px-3 py-2"
                    >
                      {editingType === type.id && !isBuiltIn(type.id) ? (
                        <form
                          className="flex min-w-0 flex-1 gap-2"
                          onSubmit={(e) => {
                            e.preventDefault();
                            updateType(type.id, draft);
                            setEditingType(null);
                          }}
                        >
                          <Input value={draft} onChange={(e) => setDraft(e.target.value)} />
                          <Button type="submit" size="sm">
                            OK
                          </Button>
                        </form>
                      ) : (
                        <p className="text-sm">{type.name}</p>
                      )}
                      {editingType === type.id ? null : (
                        <div className="flex gap-1">
                          {isBuiltIn(type.id) ? null : (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingType(type.id);
                                setDraft(type.name);
                              }}
                            >
                              Renommer
                            </Button>
                          )}
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              removeType(type.id);
                              toast(`${type.name} retiré`);
                            }}
                          >
                            Retirer
                          </Button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </section>

              {retired.length > 0 ? (
                <section className="flex flex-col gap-3">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    Types retirés
                  </p>
                  <ul className="flex flex-col gap-2">
                    {retired.map((id) => (
                      <li
                        key={id}
                        className="flex items-center justify-between gap-2 rounded-md border border-dashed border-border px-3 py-2"
                      >
                        <p className="text-sm text-muted-foreground">{PATTERN_LABELS[id]}</p>
                        <Button type="button" size="sm" variant="outline" onClick={() => restoreType(id)}>
                          Remettre
                        </Button>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              <section className="flex flex-col gap-3">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Sous-types
                </p>
                <form onSubmit={createSubtype} className="grid gap-2 sm:grid-cols-[1fr_8rem_auto]">
                  <Input
                    value={subtypeName}
                    onChange={(e) => setSubtypeName(e.target.value)}
                    placeholder="Fruits, arbres…"
                  />
                  <select
                    value={parents.some((p) => p.id === subtypeParent) ? subtypeParent : parents[0]?.id ?? ""}
                    onChange={(e) => setSubtypeParent(e.target.value)}
                    className="h-11 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    {parents.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <Button type="submit">Créer</Button>
                </form>
                {subtypes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Exemple : Objet → Fruits.</p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {subtypes.map((sub) => (
                      <li
                        key={sub.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border px-3 py-2"
                      >
                        {editingSubtype === sub.id ? (
                          <form
                            className="flex min-w-0 flex-1 gap-2"
                            onSubmit={(e) => {
                              e.preventDefault();
                              updateSubtype(sub.id, draft);
                              setEditingSubtype(null);
                            }}
                          >
                            <Input value={draft} onChange={(e) => setDraft(e.target.value)} />
                            <Button type="submit" size="sm">
                              OK
                            </Button>
                          </form>
                        ) : (
                          <p className="text-sm">
                            <span className="text-muted-foreground">
                              {patternLabel(sub.parent, customTypes)} ·
                            </span>{" "}
                            {sub.name}
                          </p>
                        )}
                        {editingSubtype === sub.id ? null : (
                          <div className="flex gap-1">
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingSubtype(sub.id);
                                setDraft(sub.name);
                              }}
                            >
                              Renommer
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => removeSubtype(sub.id)}
                            >
                              Retirer
                            </Button>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
