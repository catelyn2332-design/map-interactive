import { Bookmark, BookmarkCheck, Copy } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatIdea } from "@/lib/generate";
import { patternLabel, type Idea } from "@/lib/types";
import { useAleas } from "@/lib/store";

export function IdeaCard({ idea }: { idea: Idea }) {
  const archive = useAleas((s) => s.archive);
  const customTypes = useAleas((s) => s.customTypes);
  const save = useAleas((s) => s.save);
  const saved = archive.some((a) => a.id === idea.id);

  async function copy() {
    await navigator.clipboard.writeText(formatIdea(idea));
    toast("Idée copiée");
  }

  return (
    <article className="flex flex-col gap-5 rounded-xl border border-border bg-card p-5 sm:p-6">
      <header className="flex items-start justify-between gap-3">
        <h2 className="font-display text-2xl leading-tight tracking-tight text-foreground">
          {idea.title}
        </h2>
        <div className="flex shrink-0 gap-1">
          <Button variant="ghost" size="icon" onClick={copy} aria-label="Copier">
            <Copy />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              save(idea);
              toast("Idée archivée");
            }}
            aria-label="Archiver"
            disabled={saved}
          >
            {saved ? <BookmarkCheck /> : <Bookmark />}
          </Button>
        </div>
      </header>

      <ul className="flex flex-wrap gap-2">
        {idea.keywords.map((token) => (
          <li key={`${token.pattern}-${token.word}`}>
            <Badge
              variant={token.custom ? "default" : "muted"}
              title={
                token.custom
                  ? `${patternLabel(token.pattern, customTypes)}${token.subtype ? ` · ${token.subtype}` : ""} · perso`
                  : patternLabel(token.pattern, customTypes)
              }
            >
              {token.word}
              {token.subtype ? ` · ${token.subtype}` : ""}
            </Badge>
          </li>
        ))}
      </ul>

      <section className="flex flex-col gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Description brute
          </p>
          <p className="mt-2 text-sm leading-relaxed text-foreground">{idea.description}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Rapport
            {idea.anchor
              ? ` · ${idea.anchor.name}`
              : idea.element
                ? ` · ${idea.element}`
                : ""}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-foreground">{idea.rapport}</p>
          {idea.anchor ? (
            <p className="mt-2 text-xs text-muted-foreground">{idea.anchor.file}</p>
          ) : null}
        </div>
      </section>
    </article>
  );
}
