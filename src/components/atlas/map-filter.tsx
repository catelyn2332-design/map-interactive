import { Link } from "@tanstack/react-router";
import { BookmarkPlus, ListFilter, Search, SlidersHorizontal, X } from "lucide-react";
import { Chip } from "@/components/atlas/chip";
import { PropIcon } from "@/components/atlas/prop-icon";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { collectUsedValues, optionLabel, usesDictionary, usesOpenChoices, usesOptions } from "@/lib/map/props";
import { useAtlas } from "@/lib/map/store";
import { pressProps } from "@/lib/press";
import { cn } from "@/lib/utils";

export function MapFilter() {
  const query = useAtlas((s) => s.query);
  const setQuery = useAtlas((s) => s.setQuery);
  const filters = useAtlas((s) => s.filters);
  const setFilter = useAtlas((s) => s.setFilter);
  const clearFilters = useAtlas((s) => s.clearFilters);
  const schema = useAtlas((s) => s.schema);
  const rooms = useAtlas((s) => s.rooms);
  const fixtures = useAtlas((s) => s.fixtures);

  const filterable = schema.filter(
    (def) =>
      def.filterable &&
      (usesOptions(def.type) || def.type === "toggle"),
  );
  const activeCount =
    filterable.filter((def) => {
      const v = filters[def.id];
      return v && v !== "tous";
    }).length + (query.trim() ? 1 : 0);

  return (
    <details className="relative">
      <summary
        className={cn(
          buttonVariants({
            variant: activeCount ? "default" : "outline",
            size: "sm",
          }),
        )}
        aria-label="Filtrer les pièces"
      >
        <ListFilter className="size-4" />
        Filtrer
        {activeCount ? (
          <span className="rounded-full bg-primary-foreground/20 px-1.5 text-xs tabular-nums">
            {activeCount}
          </span>
        ) : null}
      </summary>
      <div className="absolute left-0 z-40 mt-1 flex w-[min(20rem,calc(100vw-2rem))] max-h-[min(28rem,70vh)] flex-col gap-3 overflow-y-auto rounded-lg border border-border bg-card p-3 shadow-md">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Chercher une pièce…"
            className="h-9 pl-9"
            aria-label="Rechercher une pièce"
          />
        </div>

        {filterable.length ? (
          filterable.map((def) => {
            const current = filters[def.id] || "tous";
            const chips =
              def.type === "toggle"
                ? [
                    { id: "oui", label: "Oui" },
                    { id: "non", label: "Non" },
                  ]
                : usesDictionary(def.type)
                  ? [
                      ...def.options.map((opt) => ({
                        id: opt.label,
                        label: opt.label,
                      })),
                      ...collectUsedValues(def, rooms, fixtures)
                        .filter((v) => !def.options.some((o) => o.label === v || o.id === v))
                        .map((v) => ({ id: v, label: v })),
                    ]
                : usesOpenChoices(def.type)
                  ? collectUsedValues(def, rooms, fixtures).map((v) => ({
                      id: v,
                      label: v,
                    }))
                  : def.options.map((opt) => ({
                      id: opt.id,
                      label: optionLabel(def, opt.id),
                    }));
            return (
              <section key={def.id} className="flex flex-col gap-2">
                <h3 className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  <PropIcon id={def.icon} type={def.type} className="size-3.5" />
                  {def.name}
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  <Chip
                    size="sm"
                    active={current === "tous"}
                    onClick={() => setFilter(def.id, "tous")}
                  >
                    Tous
                  </Chip>
                  {chips.map((opt) => (
                    <Chip
                      key={opt.id}
                      size="sm"
                      active={current === opt.id}
                      onClick={() => setFilter(def.id, opt.id)}
                    >
                      {opt.label}
                    </Chip>
                  ))}
                </div>
              </section>
            );
          })
        ) : (
          <p className="text-xs text-muted-foreground">
            Aucune propriété filtrable. Créez-en depuis Propriétés.
          </p>
        )}

        <p className="text-xs text-muted-foreground">
          Les pièces hors filtre s’estompent sur le plan.
        </p>

        <div className="flex flex-wrap items-center gap-2">
          {activeCount ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="self-start"
              {...pressProps(clearFilters)}
            >
              <X className="size-4" />
              Effacer
            </Button>
          ) : null}
          <Button variant="ghost" size="sm" asChild className="self-start">
            <Link to="/proprietes">
              <SlidersHorizontal className="size-4" />
              Propriétés
            </Link>
          </Button>
        </div>
      </div>
    </details>
  );
}

export function SceneBar() {
  const scenes = useAtlas((s) => s.scenes) ?? [];
  const activeSceneId = useAtlas((s) => s.activeSceneId);
  const applyScene = useAtlas((s) => s.applyScene);
  const saveScene = useAtlas((s) => s.saveScene);
  const deleteScene = useAtlas((s) => s.deleteScene);
  const query = useAtlas((s) => s.query);
  const filters = useAtlas((s) => s.filters);
  const dirty =
    Boolean(query.trim()) ||
    Object.values(filters).some((v) => v && v !== "tous");
  const libre = !activeSceneId && !dirty;

  return (
    <div className="flex flex-wrap items-center gap-1.5" aria-label="Scènes">
      <Chip size="sm" active={libre} onClick={() => applyScene(null)}>
        Libre
      </Chip>
      {scenes.map((scene) => (
        <span key={scene.id} className="inline-flex items-center">
          <Chip
            size="sm"
            active={activeSceneId === scene.id}
            onClick={() => applyScene(scene.id)}
          >
            {scene.name}
          </Chip>
          {activeSceneId === scene.id ? (
            <button
              type="button"
              className="-ml-1 grid size-7 place-items-center rounded-full text-muted-foreground hover:text-foreground"
              aria-label={`Oublier ${scene.name}`}
              {...pressProps(() => deleteScene(scene.id))}
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </span>
      ))}
      {dirty ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9"
          aria-label="Mémoriser cette vue"
          {...pressProps(() => saveScene())}
        >
          <BookmarkPlus className="size-4" />
          <span className="hidden sm:inline">Mémoriser</span>
        </Button>
      ) : null}
    </div>
  );
}