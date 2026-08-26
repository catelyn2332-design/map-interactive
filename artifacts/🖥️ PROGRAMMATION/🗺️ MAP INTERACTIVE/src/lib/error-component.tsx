import type { ErrorComponentProps } from "@tanstack/react-router";
import { TriangleAlert } from "lucide-react";

export function AppErrorComponent({ error }: ErrorComponentProps) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background px-6 text-center text-foreground">
      <span className="text-clay" aria-hidden="true">
        <TriangleAlert className="size-10" strokeWidth={2} />
      </span>
      <h1 className="font-display text-lg font-medium tracking-[-0.02em]">
        Un problème est survenu
      </h1>
      <p className="max-w-md text-sm break-words text-muted-foreground">
        {error.message || "Erreur inattendue. Rechargez la page."}
      </p>
      <button
        type="button"
        className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
        onClick={() => window.location.reload()}
      >
        Recharger
      </button>
    </main>
  );
}