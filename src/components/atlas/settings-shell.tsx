import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { NamedTitle } from "@/components/atlas/editable-title";
import { Button } from "@/components/ui/button";
import { PrefsSaveBar } from "@/components/atlas/prefs-save-bar";
import { GuardBoundary } from "@/components/atlas/guard-boundary";
import { useUiStore } from "@/lib/map/ui";

export function SettingsShell({
  title,
  titleId = "settings",
  children,
  backTo = "/parametres",
  backLabel = "Paramètres",
}: {
  title: string;
  titleId?: string;
  children: React.ReactNode;
  backTo?: "/parametres" | "/";
  backLabel?: string;
}) {
  const appName = useUiStore((s) => s.copy.appName);
  const back = backTo === "/" ? appName || "Atlas" : backLabel;
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex h-12 w-full max-w-2xl items-center justify-between gap-3 px-4 sm:px-6">
          <NamedTitle
            id={titleId}
            fallback={title}
            as="h1"
            className="min-w-0 truncate font-display text-lg font-medium tracking-[-0.03em] sm:text-xl"
          />
          <Button variant="outline" size="sm" asChild aria-label={back}>
            <Link to={backTo}>
              <ArrowLeft className="size-4" />
              {back}
            </Link>
          </Button>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-6 sm:px-6 sm:py-8">
        <GuardBoundary label={title}>{children}</GuardBoundary>
        <PrefsSaveBar />
      </main>
    </div>
  );
}
