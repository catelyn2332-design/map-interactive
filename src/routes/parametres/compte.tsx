import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { NamedTitle } from "@/components/atlas/editable-title";
import { SettingsShell } from "@/components/atlas/settings-shell";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { usePrefs } from "@/lib/map/prefs";
import { formatSavedAt } from "@/lib/map/saves";
import { useAtlas } from "@/lib/map/store";
import { pressProps } from "@/lib/press";
import { OWNER } from "@/lib/progress/owner";

export const Route = createFileRoute("/parametres/compte")({
  component: ComptePage,
});

function ComptePage() {
  return (
    <SettingsShell title="Compte et données" titleId="account">
      <OwnerPanel />
      <Separator />
      <LocalDataPanel />
    </SettingsShell>
  );
}

function OwnerPanel() {
  const saving = usePrefs((s) => s.saving);
  const lastSavedAt = usePrefs((s) => s.lastSavedAt);
  const cloud = usePrefs((s) => s.cloud);
  const loaded = usePrefs((s) => s.loaded);

  const stamp = !loaded
    ? "Chargement…"
    : saving || cloud === "syncing"
      ? "Enregistrement automatique en cours…"
      : lastSavedAt
        ? `Dernière mise à jour le ${formatSavedAt(lastSavedAt)}`
        : "Pas encore de modification enregistrée";

  return (
    <section className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
      <NamedTitle
        id="grokAccount"
        fallback="Compte Grok"
        as="h2"
        className="font-display text-lg font-medium tracking-[-0.02em]"
      />
      <p className="text-sm font-medium">{OWNER.displayName}</p>
      <p className="text-xs text-muted-foreground">{OWNER.primaryEmail}</p>
      <p className="text-sm leading-relaxed text-muted-foreground">
        Ce bac à sable appartient à ce compte. Le plan, les pièces, les étages,
        les propriétés et l’apparence s’enregistrent tout seuls à chaque
        modification — sans connexion.
      </p>
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {stamp}
      </p>
    </section>
  );
}

function LocalDataPanel() {
  const resetWorld = useAtlas((s) => s.resetWorld);
  return (
    <section className="flex flex-col gap-3">
      <NamedTitle
        id="localData"
        fallback="Données locales"
        as="h2"
        className="font-display text-lg font-medium tracking-[-0.02em]"
      />
      <p className="text-sm leading-relaxed text-muted-foreground">
        Un plan vide n’efface pas la copie déjà posée sur le coffre du compte.
        Les fichiers du workspace se règlent dans la section Coffre.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          {...pressProps(() => {
            resetWorld();
            toast.message("Plan vide");
          })}
        >
          Nouveau plan vide
        </Button>
        <Button variant="outline" asChild>
          <Link to="/sauvegardes">Sauvegardes nommées</Link>
        </Button>
      </div>
    </section>
  );
}
