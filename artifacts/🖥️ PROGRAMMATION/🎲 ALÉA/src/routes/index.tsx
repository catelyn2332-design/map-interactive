import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { toast } from "sonner";
import { DiceButton } from "@/components/dice-button";
import { FilterPanel } from "@/components/filter-panel";
import { IdeaCard } from "@/components/idea-card";
import { useAleas } from "@/lib/store";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const patterns = useAleas((s) => s.patterns);
  const subtypeFilters = useAleas((s) => s.subtypeFilters);
  const subtypes = useAleas((s) => s.subtypes);
  const customTypes = useAleas((s) => s.customTypes);
  const hiddenTypes = useAleas((s) => s.hiddenTypes);
  const count = useAleas((s) => s.count);
  const batch = useAleas((s) => s.batch);
  const element = useAleas((s) => s.element);
  const useCustom = useAleas((s) => s.useCustom);
  const exclusiveCustom = useAleas((s) => s.exclusiveCustom);
  const customCount = useAleas((s) => s.customKeywords.filter((k) => k.active).length);
  const rolling = useAleas((s) => s.rolling);
  const ideas = useAleas((s) => s.ideas);
  const togglePattern = useAleas((s) => s.togglePattern);
  const toggleSubtypeFilter = useAleas((s) => s.toggleSubtypeFilter);
  const setCount = useAleas((s) => s.setCount);
  const setBatch = useAleas((s) => s.setBatch);
  const setElement = useAleas((s) => s.setElement);
  const setUseCustom = useAleas((s) => s.setUseCustom);
  const setExclusiveCustom = useAleas((s) => s.setExclusiveCustom);
  const roll = useAleas((s) => s.roll);

  function launch() {
    if (useAleas.getState().rolling) return;
    const result = roll();
    if (!result.ok) toast(result.reason);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.code !== "Space") return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      e.preventDefault();
      launch();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
      <div className="max-w-2xl">
        <h1 className="font-display text-4xl leading-tight tracking-tight sm:text-5xl">
          Un dé. Des mots que l'histoire n'a pas encore.
        </h1>
        <p className="mt-4 max-w-prose text-base leading-relaxed text-muted-foreground">
          Pas de recyclage du déjà-écrit. Le tirage sort des noms, des adjectifs,
          des thèmes et des styles étrangers. Vous les plaquez ensuite sur
          n'importe quel élément — personnage, lieu, objet.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-start">
        <div className="flex flex-col gap-6">
          <DiceButton rolling={rolling} onRoll={launch} />
          <FilterPanel
            patterns={patterns}
            subtypeFilters={subtypeFilters}
            subtypes={subtypes}
            customTypes={customTypes}
            hiddenTypes={hiddenTypes}
            count={count}
            batch={batch}
            element={element}
            useCustom={useCustom}
            exclusiveCustom={exclusiveCustom}
            customCount={customCount}
            onToggle={togglePattern}
            onToggleSubtype={toggleSubtypeFilter}
            onCount={setCount}
            onBatch={setBatch}
            onElement={setElement}
            onUseCustom={setUseCustom}
            onExclusiveCustom={setExclusiveCustom}
          />
        </div>

        <div className="flex flex-col gap-4">
          {ideas.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card px-5 py-16 text-center">
              <p className="font-display text-xl text-foreground">Rien encore</p>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                Lancez le dé. Espace fonctionne aussi, hors des champs de saisie.
              </p>
            </div>
          ) : (
            ideas.map((idea) => <IdeaCard key={idea.id} idea={idea} />)
          )}
        </div>
      </div>
    </main>
  );
}
