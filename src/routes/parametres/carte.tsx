import { createFileRoute } from "@tanstack/react-router";
import { SettingsShell } from "@/components/atlas/settings-shell";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  CHROME_TOGGLES,
  HANDLE_MAX,
  HANDLE_MIN,
  handleSizePx,
  useUiStore,
} from "@/lib/map/ui";
import { pressProps } from "@/lib/press";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/parametres/carte")({
  component: CartePage,
});

function CartePage() {
  const chrome = useUiStore((s) => s.chrome);
  const setChrome = useUiStore((s) => s.setChrome);
  const handleSize = handleSizePx(chrome.handleSize);

  return (
    <SettingsShell title="Carte">
      <p className="text-sm leading-relaxed text-muted-foreground">
        Affichez seulement ce dont vous avez besoin sur le plan. Ces choix
        restent sur cet appareil, et se copient sur le compte si vous êtes
        connecté.
      </p>
      <div className="flex flex-col gap-2">
        {CHROME_TOGGLES.map((item) => {
          const on = chrome[item.key] !== false;
          return (
            <button
              key={item.key}
              type="button"
              aria-pressed={on}
              {...pressProps(() => setChrome({ [item.key]: !on }))}
              className={cn(
                "flex appearance-none items-center justify-between gap-3 rounded-lg border p-4 text-left transition-colors",
                on ? "border-primary bg-accent" : "border-border bg-card hover:bg-accent",
              )}
            >
              <span>
                <span className="block text-sm font-medium">{item.label}</span>
                <span className="block text-xs text-muted-foreground">
                  {item.hint}
                </span>
              </span>
              <span className="text-xs font-medium text-muted-foreground">
                {on ? "Affiché" : "Masqué"}
              </span>
            </button>
          );
        })}
      </div>

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="font-display text-lg font-medium tracking-[-0.02em]">
            Poignées de redimension
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Taille des carrés aux coins des pièces, ainsi qu’aux extrémités des
            fenêtres, portes et escaliers.
          </p>
        </div>
        <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-4">
          <span
            className="shrink-0 rounded-sm border-2 border-primary bg-card"
            style={{ width: handleSize, height: handleSize }}
            aria-hidden
          />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Label htmlFor="handle-size" className="flex items-center justify-between">
              <span>Taille</span>
              <span className="font-mono text-xs text-muted-foreground">
                {handleSize} px
              </span>
            </Label>
            <input
              id="handle-size"
              type="range"
              min={HANDLE_MIN}
              max={HANDLE_MAX}
              step={1}
              value={handleSize}
              aria-valuemin={HANDLE_MIN}
              aria-valuemax={HANDLE_MAX}
              aria-valuenow={handleSize}
              aria-label="Taille des poignées de redimension"
              onChange={(e) =>
                setChrome({ handleSize: Number(e.target.value) })
              }
              className="w-full accent-primary"
            />
          </div>
        </div>
      </section>

      <Button
        type="button"
        variant="outline"
        {...pressProps(() =>
          setChrome({
            showGrid: true,
            showCompass: true,
            showTokens: true,
            showHints: true,
            handleSize,
          }),
        )}
      >
        Tout afficher
      </Button>
    </SettingsShell>
  );
}
