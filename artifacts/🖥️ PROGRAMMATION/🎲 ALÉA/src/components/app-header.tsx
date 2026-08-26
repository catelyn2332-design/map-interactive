import { Link } from "@tanstack/react-router";
import { ProgressPanel } from "@/components/progress-panel";
import { ThemePanel } from "@/components/theme-panel";
import { useAleas } from "@/lib/store";

export function AppHeader() {
  const count = useAleas((s) => s.archive.length);
  const lexCount = useAleas((s) => s.customKeywords.length);

  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <Link to="/" className="flex items-baseline gap-3">
          <span className="font-display text-2xl tracking-tight">Aléa</span>
          <span className="hidden text-sm text-muted-foreground sm:inline">
            Sauter dans l'inconnu
          </span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link
            to="/"
            className="rounded-md px-3 py-2 text-muted-foreground hover:bg-accent hover:text-foreground"
            activeProps={{ className: "text-foreground" }}
          >
            Générateur
          </Link>
          <Link
            to="/mots"
            className="rounded-md px-3 py-2 text-muted-foreground hover:bg-accent hover:text-foreground"
            activeProps={{ className: "text-foreground" }}
          >
            Lexique
            <span suppressHydrationWarning>
              {lexCount > 0 ? ` (${lexCount})` : ""}
            </span>
          </Link>
          <Link
            to="/archive"
            className="rounded-md px-3 py-2 text-muted-foreground hover:bg-accent hover:text-foreground"
            activeProps={{ className: "text-foreground" }}
          >
            Archives
            <span suppressHydrationWarning>
              {count > 0 ? ` (${count})` : ""}
            </span>
          </Link>
          <ProgressPanel />
          <ThemePanel />
        </nav>
      </div>
    </header>
  );
}
