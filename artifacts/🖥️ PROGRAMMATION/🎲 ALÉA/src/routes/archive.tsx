import { createFileRoute } from "@tanstack/react-router";
import { IdeaCard } from "@/components/idea-card";
import { Button } from "@/components/ui/button";
import { useAleas } from "@/lib/store";

export const Route = createFileRoute("/archive")({ component: ArchivePage });

function ArchivePage() {
  const archive = useAleas((s) => s.archive);
  const remove = useAleas((s) => s.remove);
  const clearArchive = useAleas((s) => s.clearArchive);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl tracking-tight">Archives</h1>
          <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted-foreground">
            Idées gardées sur cet appareil. Rien n'est envoyé nulle part.
          </p>
        </div>
        {archive.length > 0 ? (
          <Button variant="outline" onClick={clearArchive}>
            Vider
          </Button>
        ) : null}
      </div>

      {archive.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card px-5 py-16 text-center">
          <p className="font-display text-xl">Aucune idée archivée</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            Sur une carte, utilisez le signet pour la retenir.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {archive.map((idea) => (
            <div key={idea.id} className="flex flex-col gap-2">
              <IdeaCard idea={idea} />
              <Button variant="ghost" size="sm" onClick={() => remove(idea.id)}>
                Retirer
              </Button>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
