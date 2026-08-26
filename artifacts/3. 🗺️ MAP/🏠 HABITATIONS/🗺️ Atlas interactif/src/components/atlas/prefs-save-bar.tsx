import { Save } from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  savePreferences,
  useConfigDirty,
  usePrefs,
} from "@/lib/map/prefs";
import { formatSavedAt } from "@/lib/map/saves";
import { pressProps } from "@/lib/press";
import { cn } from "@/lib/utils";

export function PrefsSaveBar({
  sticky = true,
  className,
}: {
  sticky?: boolean;
  className?: string;
}) {
  const dirty = useConfigDirty();
  const saving = usePrefs((s) => s.saving);
  const lastSavedAt = usePrefs((s) => s.lastSavedAt);
  const loaded = usePrefs((s) => s.loaded);
  const lock = useRef(false);

  async function onSave() {
    if (lock.current || saving || !dirty || !loaded) return;
    lock.current = true;
    try {
      const ok = await savePreferences();
      if (ok) toast.success("Préférences enregistrées");
      else toast.error("Enregistrement impossible — réessayez");
    } catch {
      toast.error("Enregistrement impossible — réessayez");
    } finally {
      lock.current = false;
    }
  }

  const status = !loaded
    ? "Chargement des préférences…"
    : saving
      ? "Enregistrement…"
      : dirty
        ? "Modifications non enregistrées"
        : lastSavedAt
          ? `Enregistré le ${formatSavedAt(lastSavedAt)}`
          : "Aucune modification";

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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p
          className={cn(
            "text-xs",
            dirty ? "text-foreground" : "text-muted-foreground",
          )}
          aria-live="polite"
        >
          {status}
        </p>
        <Button
          type="button"
          disabled={!dirty || saving || !loaded}
          aria-busy={saving}
          {...pressProps(() => void onSave())}
        >
          <Save className="size-4" />
          Sauvegarder les préférences
        </Button>
      </div>
    </div>
  );
}
