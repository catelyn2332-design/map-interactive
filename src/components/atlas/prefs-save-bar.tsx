import { usePrefs } from "@/lib/map/prefs";
import { formatSavedAt } from "@/lib/map/saves";
import { OWNER } from "@/lib/progress/owner";
import { cn } from "@/lib/utils";

export function PrefsSaveBar({
  sticky = true,
  className,
}: {
  sticky?: boolean;
  className?: string;
}) {
  const saving = usePrefs((s) => s.saving);
  const lastSavedAt = usePrefs((s) => s.lastSavedAt);
  const loaded = usePrefs((s) => s.loaded);
  const cloud = usePrefs((s) => s.cloud);

  const status = !loaded
    ? "Chargement du bac à sable…"
    : saving || cloud === "syncing"
      ? "Enregistrement automatique…"
      : lastSavedAt
        ? `Mis à jour le ${formatSavedAt(lastSavedAt)} · ${OWNER.displayName}`
        : "Enregistrement automatique à chaque modification";

  return (
    <div
      className={cn(
        "border-t border-border bg-background/95 py-3",
        sticky &&
          "sticky bottom-0 z-20 -mx-4 px-4 backdrop-blur sm:-mx-6 sm:px-6",
        !sticky && "pt-4",
        className,
      )}
    >
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {status}
      </p>
    </div>
  );
}
