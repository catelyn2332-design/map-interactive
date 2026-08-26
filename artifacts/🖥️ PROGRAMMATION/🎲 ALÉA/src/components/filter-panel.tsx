import { Input } from "@/components/ui/input";
import type { CustomSubtype, CustomType, PatternId } from "@/lib/types";
import { PATTERN_HINTS, allPatternOptions, isBuiltIn, patternLabel } from "@/lib/types";
import { cn } from "@/lib/utils";

export function FilterPanel({
  patterns,
  subtypeFilters,
  subtypes,
  customTypes,
  hiddenTypes,
  count,
  batch,
  element,
  useCustom,
  exclusiveCustom,
  customCount,
  onToggle,
  onToggleSubtype,
  onCount,
  onBatch,
  onElement,
  onUseCustom,
  onExclusiveCustom,
}: {
  patterns: PatternId[];
  subtypeFilters: string[];
  subtypes: CustomSubtype[];
  customTypes: CustomType[];
  hiddenTypes: string[];
  count: number;
  batch: 1 | 3;
  element: string;
  onToggle: (id: PatternId) => void;
  onToggleSubtype: (id: string) => void;
  onCount: (n: number) => void;
  onBatch: (n: 1 | 3) => void;
  onElement: (v: string) => void;
  useCustom: boolean;
  exclusiveCustom: boolean;
  customCount: number;
  onUseCustom: (v: boolean) => void;
  onExclusiveCustom: (v: boolean) => void;
}) {
  const typeOptions = allPatternOptions(customTypes, hiddenTypes);
  const visibleSubs = subtypes.filter((s) => !hiddenTypes.includes(s.parent));
  return (
    <section className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Filtres de motif
        </p>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted-foreground">
          Ils n'imposent pas le lore. Ils orientent la forme des mots :
          sujets, styles, noms, sensations. Rien de coché = tout le lexique.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {typeOptions.map((type) => {
            const on = patterns.includes(type.id);
            return (
              <button
                key={type.id}
                type="button"
                title={isBuiltIn(type.id) ? PATTERN_HINTS[type.id] : type.name}
                onClick={() => onToggle(type.id)}
                className={cn(
                  "h-10 rounded-full border px-3 text-sm transition-opacity duration-150",
                  on
                    ? "border-transparent bg-primary text-primary-foreground"
                    : "border-border bg-transparent text-foreground hover:bg-accent",
                )}
              >
                {type.name}
              </button>
            );
          })}
        </div>
        {visibleSubs.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {visibleSubs.map((sub) => {
              const on = subtypeFilters.includes(sub.id);
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => onToggleSubtype(sub.id)}
                  className={cn(
                    "h-10 rounded-full border px-3 text-sm",
                    on
                      ? "border-transparent bg-primary text-primary-foreground"
                      : "border-border bg-transparent text-foreground hover:bg-accent",
                  )}
                >
                  {patternLabel(sub.parent, customTypes)} · {sub.name}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Nombre de mots
          </span>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={1}
              max={7}
              value={count}
              onChange={(e) => onCount(Number(e.target.value))}
              className="w-full accent-primary"
              aria-label="Nombre de mots-clés"
              suppressHydrationWarning
            />
            <span className="w-6 text-right font-display text-lg tabular-nums">
              {count}
            </span>
          </div>
        </label>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Tirage
          </legend>
          <div className="flex gap-2">
            {([1, 3] as const).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => onBatch(n)}
                className={cn(
                  "h-10 flex-1 rounded-md border text-sm",
                  batch === n
                    ? "border-transparent bg-primary text-primary-foreground"
                    : "border-border text-foreground hover:bg-accent",
                )}
              >
                {n === 1 ? "Une idée" : "Trois idées"}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <label className="flex flex-col gap-2">
        <span className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Élément d'ancrage
        </span>
        <Input
          value={element}
          onChange={(e) => onElement(e.target.value)}
          placeholder="Stella, le toit, Côtebelle, Myriam…"
        />
        <span className="text-sm leading-relaxed text-muted-foreground">
          Le dé tire des mots étrangers. Le rapport se colle ensuite à une fiche
          du projet (personnage, lieu, secret…).
        </span>
      </label>

      <div className="flex flex-col gap-2 rounded-xl border border-border bg-card px-4 py-3">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={useCustom}
            onChange={(e) => onUseCustom(e.target.checked)}
            className="mt-1 size-4 accent-primary"
          />
          <span>
            <span className="block text-sm text-foreground">Inclure le lexique perso</span>
            <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">
              {customCount > 0
                ? `${customCount} mot${customCount > 1 ? "s" : ""} perso ${useCustom ? "dans" : "hors"} le tirage.`
                : "Ajoutez des mots dans Lexique — ils seront favorisés au lancer."}
            </span>
          </span>
        </label>
        <label className="flex items-start gap-3 border-t border-border pt-3">
          <input
            type="checkbox"
            checked={exclusiveCustom}
            onChange={(e) => onExclusiveCustom(e.target.checked)}
            className="mt-1 size-4 accent-primary"
          />
          <span>
            <span className="block text-sm text-foreground">
              Uniquement les mots que j'ai inventés
            </span>
            <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">
              Le dé ignore le lexique de base. Seuls vos mots actifs (et les
              filtres) comptent.
            </span>
          </span>
        </label>
      </div>
    </section>
  );
}
