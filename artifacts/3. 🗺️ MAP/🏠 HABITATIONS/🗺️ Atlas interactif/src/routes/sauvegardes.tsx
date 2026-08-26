import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/atlas/app-header";
import { SaveManager } from "@/components/atlas/save-manager";

export const Route = createFileRoute("/sauvegardes")({
  component: SauvegardesPage,
});

function SauvegardesPage() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex h-12 w-full max-w-2xl items-center px-4 sm:px-6">
          <PageHeader title="Sauvegardes" />
        </div>
      </header>
      <main className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
        <SaveManager />
      </main>
    </div>
  );
}
