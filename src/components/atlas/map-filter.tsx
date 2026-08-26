import { Link } from "@tanstack/react-router";
import { ListFilter, Search, SlidersHorizontal, X } from "lucide-react";
import { Chip } from "@/components/atlas/chip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { optionLabel } from "@/lib/map/props";
import { useAtlas } from "@/lib/map/store";
import { pressProps } from "@/lib/press";

export function MapFilter() {
  const query = useAtlas((s) => s.query);
  const setQuery = useAtlas((s) => s.setQuery);
  const filters = useAtlas((s) => s.filters);
  const setFilter = useAtlas((s) => s.setFilter);
  const clearFilters = useAtlas((s) => s.clearFilters);
  const schema = useAtlas((s) => s.schema);

  const filterable = schema.filter(
    (def) => def.filterable && def.type !== "text",
  );
  const activeCount =
    filterable.filter((def) => {
      const v = filters[def.id];
      return v && v !== "tous";
    }).length + (query.trim() ? 1 : 0);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={activeCount ? "default" : "outline"}
          size="sm"
          aria-label="Filtrer les pièces"
        >
          <ListFilter className="size-4" />
          Filtrer
          {activeCount ? (
            <span className="rounded-full bg-primary-foreground/20 px-1.5 text-xs tabular-nums">
              {activeCount}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="flex max-h-[min(28rem,70vh)] flex-col gap-3 overflow-y-auto"
      >
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
            return (
              <section key={def.id} className="flex flex-col gap-2">
                <h3 className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
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
                  {def.options.map((opt) => (
                    <Chip
                      key={opt.id}
                      size="sm"
                      active={current === opt.id}
                      onClick={() => setFilter(def.id, opt.id)}
                    >
                      {optionLabel(def, opt.id)}
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
      </PopoverContent>
    </Popover>
  );
}
