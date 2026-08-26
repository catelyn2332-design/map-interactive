import { createFileRoute } from "@tanstack/react-router";
import { type FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";
import { TypesPanel } from "@/components/types-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAleas } from "@/lib/store";
import {
  allPatternOptions,
  patternLabel,
  type CustomKeyword,
  type KeywordSort,
  type PatternId,
} from "@/lib/types";

export const Route = createFileRoute("/mots")({ component: MotsPage });

const SORT_LABELS: Record<KeywordSort, string> = {
  recent: "Plus récents",
  alpha: "A → Z",
  type: "Type",
  active: "Actifs d'abord",
};

function MotsPage() {
  const customKeywords = useAleas((s) => s.customKeywords);
  const customTypes = useAleas((s) => s.customTypes);
  const hiddenTypes = useAleas((s) => s.hiddenTypes);
  const subtypes = useAleas((s) => s.subtypes);
  const keywordSort = useAleas((s) => s.keywordSort);
  const addKeywords = useAleas((s) => s.addKeywords);
  const updateKeyword = useAleas((s) => s.updateKeyword);
  const toggleKeyword = useAleas((s) => s.toggleKeyword);
  const removeKeyword = useAleas((s) => s.removeKeyword);
  const clearKeywords = useAleas((s) => s.clearKeywords);
  const setKeywordSort = useAleas((s) => s.setKeywordSort);

  const [word, setWord] = useState("");
  const [bulk, setBulk] = useState("");
  const [pattern, setPattern] = useState<PatternId>("objet");
  const [subtypeId, setSubtypeId] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterSubtype, setFilterSubtype] = useState<string>("all");
  const [editingId, setEditingId] = useState<string | null>(null);

  const typeOptions = allPatternOptions(customTypes, hiddenTypes);
  const subtypesForPattern = subtypes.filter((s) => s.parent === pattern);
  const filterSubtypes =
    filterType === "all" ? subtypes : subtypes.filter((s) => s.parent === filterType);

  const visible = useMemo(() => {
    let list = customKeywords;
    if (filterType !== "all") list = list.filter((k) => k.pattern === filterType);
    if (filterSubtype !== "all") list = list.filter((k) => k.subtypeId === filterSubtype);
    const copy = [...list];
    copy.sort((a, b) => {
      if (keywordSort === "alpha") return a.word.localeCompare(b.word, "fr");
      if (keywordSort === "type") {
        const byType = patternLabel(a.pattern, customTypes).localeCompare(
          patternLabel(b.pattern, customTypes),
          "fr",
        );
        if (byType !== 0) return byType;
        return a.word.localeCompare(b.word, "fr");
      }
      if (keywordSort === "active") {
        if (a.active !== b.active) return a.active ? -1 : 1;
        return b.createdAt - a.createdAt;
      }
      return b.createdAt - a.createdAt;
    });
    return copy;
  }, [customKeywords, customTypes, filterType, filterSubtype, keywordSort]);

  function submit(e: FormEvent) {
    e.preventDefault();
    const lines = [word, ...bulk.split("\n")];
    const result = addKeywords(lines, pattern, subtypeId || null);
    if (result.added === 0 && result.skipped === 0) {
      toast("Écrivez au moins un mot");
      return;
    }
    if (result.added)
      toast(`${result.added} mot${result.added > 1 ? "s" : ""} ajouté${result.added > 1 ? "s" : ""}`);
    if (result.skipped) toast(`${result.skipped} déjà présent${result.skipped > 1 ? "s" : ""}`);
    setWord("");
    setBulk("");
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl tracking-tight">Lexique perso</h1>
          <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted-foreground">
            Ajoutez des mots, filtrez-les, inventez les types qui manquent.
          </p>
        </div>
        <TypesPanel />
      </div>

      <form
        onSubmit={submit}
        className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 sm:p-6"
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="flex flex-col gap-2">
            <span className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Mot
            </span>
            <Input
              value={word}
              onChange={(e) => setWord(e.target.value)}
              placeholder="Un nom, un adjectif, une sensation…"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Type
            </span>
            <select
              value={pattern}
              onChange={(e) => {
                setPattern(e.target.value);
                setSubtypeId("");
              }}
              className="h-11 rounded-md border border-input bg-background px-3 text-sm"
            >
              {typeOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Sous-type
            </span>
            <select
              value={subtypeId}
              onChange={(e) => setSubtypeId(e.target.value)}
              className="h-11 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Aucun</option>
              {subtypesForPattern.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Plusieurs d'un coup
          </span>
          <textarea
            value={bulk}
            onChange={(e) => setBulk(e.target.value)}
            rows={4}
            placeholder="Un mot par ligne, même type et sous-type"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>
        <div className="flex justify-end">
          <Button type="submit">Ajouter au lexique</Button>
        </div>
      </form>

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            {visible.length}
            {visible.length !== customKeywords.length ? ` / ${customKeywords.length}` : ""} mot
            {customKeywords.length === 1 ? "" : "s"}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-xs text-muted-foreground">Filtrer par type</span>
              <select
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value);
                  setFilterSubtype("all");
                }}
                className="h-10 rounded-md border border-input bg-background px-2 text-sm"
              >
                <option value="all">Tous les types</option>
                {typeOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-xs text-muted-foreground">Filtrer par sous-type</span>
              <select
                value={filterSubtype}
                onChange={(e) => setFilterSubtype(e.target.value)}
                className="h-10 rounded-md border border-input bg-background px-2 text-sm"
              >
                <option value="all">Tous les sous-types</option>
                {filterSubtypes.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-xs text-muted-foreground">Trier</span>
              <select
                value={keywordSort}
                onChange={(e) => setKeywordSort(e.target.value as KeywordSort)}
                className="h-10 rounded-md border border-input bg-background px-2 text-sm"
              >
                {(Object.keys(SORT_LABELS) as KeywordSort[]).map((key) => (
                  <option key={key} value={key}>
                    {SORT_LABELS[key]}
                  </option>
                ))}
              </select>
            </label>
            {customKeywords.length > 0 ? (
              <Button variant="outline" size="sm" onClick={clearKeywords}>
                Tout retirer
              </Button>
            ) : null}
          </div>
        </div>

        {visible.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card px-5 py-16 text-center">
            <p className="font-display text-xl">Aucun mot ici</p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
              {customKeywords.length
                ? "Rien pour ce filtre. Changez le type ou le sous-type."
                : "Un mot inattendu suffit à tordre un tirage."}
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {visible.map((item) => (
              <KeywordRow
                key={item.id}
                item={item}
                editing={editingId === item.id}
                onEdit={() => setEditingId(item.id)}
                onCancel={() => setEditingId(null)}
                onSave={(patch) => {
                  const ok = updateKeyword(item.id, patch);
                  if (!ok) {
                    toast("Mot vide ou déjà pris");
                    return;
                  }
                  setEditingId(null);
                  toast("Mot mis à jour");
                }}
                onToggle={() => toggleKeyword(item.id)}
                onRemove={() => removeKeyword(item.id)}
              />
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function KeywordRow({
  item,
  editing,
  onEdit,
  onCancel,
  onSave,
  onToggle,
  onRemove,
}: {
  item: CustomKeyword;
  editing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (
    patch: Partial<Pick<CustomKeyword, "word" | "pattern" | "subtypeId">>,
  ) => void;
  onToggle: () => void;
  onRemove: () => void;
}) {
  const subtypes = useAleas((s) => s.subtypes);
  const customTypes = useAleas((s) => s.customTypes);
  const hiddenTypes = useAleas((s) => s.hiddenTypes);
  const [word, setWord] = useState(item.word);
  const [pattern, setPattern] = useState<PatternId>(item.pattern);
  const [subtypeId, setSubtypeId] = useState(item.subtypeId ?? "");
  const subtype = subtypes.find((s) => s.id === item.subtypeId);
  const available = subtypes.filter((s) => s.parent === pattern);
  const typeOptions = allPatternOptions(customTypes, hiddenTypes);
  if (item.pattern && !typeOptions.some((o) => o.id === item.pattern)) {
    typeOptions.unshift({
      id: item.pattern,
      name: patternLabel(item.pattern, customTypes),
    });
  }

  if (!editing) {
    return (
      <li className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm text-foreground">{item.word}</p>
          <div className="mt-1 flex flex-wrap gap-1">
            <Badge variant="muted">{patternLabel(item.pattern, customTypes)}</Badge>
            {subtype ? <Badge variant="outline">{subtype.name}</Badge> : null}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant={item.active ? "secondary" : "outline"}
            size="sm"
            onClick={onToggle}
          >
            {item.active ? "Actif" : "En pause"}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onEdit}>
            Modifier
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
            Retirer
          </Button>
        </div>
      </li>
    );
  }

  return (
    <li className="flex flex-col gap-3 rounded-xl border border-border bg-card px-4 py-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <Input value={word} onChange={(e) => setWord(e.target.value)} />
        <select
          value={pattern}
          onChange={(e) => {
            setPattern(e.target.value);
            setSubtypeId("");
          }}
          className="h-11 rounded-md border border-input bg-background px-3 text-sm"
        >
          {typeOptions.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.name}
            </option>
          ))}
        </select>
        <select
          value={subtypeId}
          onChange={(e) => setSubtypeId(e.target.value)}
          className="h-11 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">Aucun sous-type</option>
          {available.map((sub) => (
            <option key={sub.id} value={sub.id}>
              {sub.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Annuler
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={() =>
            onSave({
              word,
              pattern,
              subtypeId: subtypeId || null,
            })
          }
        >
          Enregistrer
        </Button>
      </div>
    </li>
  );
}
