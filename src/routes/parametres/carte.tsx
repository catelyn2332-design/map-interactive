import { createFileRoute } from "@tanstack/react-router";
import { NamedTitle } from "@/components/atlas/editable-title";
import { SettingsShell } from "@/components/atlas/settings-shell";
import { ColorWheel } from "@/components/atlas/color-wheel";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  CHROME_TOGGLES,
  HANDLE_MAX,
  HANDLE_MIN,
  LABEL_MAX,
  LABEL_MIN,
  TOOL_BTN_MAX,
  TOOL_BTN_MIN,
  handleSizePx,
  useUiStore,
} from "@/lib/map/ui";
import {
  GROUND_KINDS,
  defaultGroundPalette,
  type GroundKind,
} from "@/lib/map/types";
import { pressProps } from "@/lib/press";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/parametres/carte")({
  component: CartePage,
});

function CartePage() {
  const chrome = useUiStore((s) => s.chrome);
  const setChrome = useUiStore((s) => s.setChrome);
  const handleSize = handleSizePx(chrome.handleSize);
  const labelSize = chrome.labelSize;
  const toolBtnSize = chrome.toolBtnSize;
  const palette = chrome.groundPalette ?? defaultGroundPalette();

  function setGroundColor(id: GroundKind, hex: string) {
    setChrome({
      groundPalette: { ...palette, [id]: hex },
    });
  }

  return (
    <SettingsShell title="Carte" titleId="carte">
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
          <NamedTitle
            id="handles"
            fallback="Poignées de redimension"
            as="h2"
            className="font-display text-lg font-medium tracking-[-0.02em]"
          />
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Taille de base des carrés aux coins des pièces. Ils s’agrandissent
            et se rétrécissent avec le zoom.
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

      <section className="flex flex-col gap-3">
        <div>
          <NamedTitle
            id="roomLabels"
            fallback="Noms des pièces"
            as="h2"
            className="font-display text-lg font-medium tracking-[-0.02em]"
          />
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Taille de base des libellés. Ils grandissent et rétrécissent avec le
            zoom, comme les poignées.
          </p>
        </div>
        <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-4">
          <span
            className="shrink-0 font-display text-foreground"
            style={{ fontSize: labelSize }}
            aria-hidden
          >
            Aa
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Label htmlFor="label-size" className="flex items-center justify-between">
              <span>Taille</span>
              <span className="font-mono text-xs text-muted-foreground">
                {labelSize} px
              </span>
            </Label>
            <input
              id="label-size"
              type="range"
              min={LABEL_MIN}
              max={LABEL_MAX}
              step={1}
              value={labelSize}
              aria-valuemin={LABEL_MIN}
              aria-valuemax={LABEL_MAX}
              aria-valuenow={labelSize}
              aria-label="Taille des noms de pièces"
              onChange={(e) =>
                setChrome({ labelSize: Number(e.target.value) })
              }
              className="w-full accent-primary"
            />
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div>
          <NamedTitle
            id="planButtons"
            fallback="Boutons du plan"
            as="h2"
            className="font-display text-lg font-medium tracking-[-0.02em]"
          />
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Taille des boutons zoom, plein écran, modifier et supprimer sur le
            plan.
          </p>
        </div>
        <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-4">
          <span
            className="shrink-0 rounded-md border border-border bg-card"
            style={{ width: toolBtnSize, height: toolBtnSize }}
            aria-hidden
          />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Label htmlFor="tool-btn-size" className="flex items-center justify-between">
              <span>Taille</span>
              <span className="font-mono text-xs text-muted-foreground">
                {toolBtnSize} px
              </span>
            </Label>
            <input
              id="tool-btn-size"
              type="range"
              min={TOOL_BTN_MIN}
              max={TOOL_BTN_MAX}
              step={1}
              value={toolBtnSize}
              aria-valuemin={TOOL_BTN_MIN}
              aria-valuemax={TOOL_BTN_MAX}
              aria-valuenow={toolBtnSize}
              aria-label="Taille des boutons du plan"
              onChange={(e) =>
                setChrome({ toolBtnSize: Number(e.target.value) })
              }
              className="w-full accent-primary"
            />
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div>
          <NamedTitle
            id="groundColors"
            fallback="Couleurs du sol"
            as="h2"
            className="font-display text-lg font-medium tracking-[-0.02em]"
          />
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Teintes des biomes peints sur le plan : prairie, mer, sable, neige…
            Chaque texture reprend la couleur choisie.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          {GROUND_KINDS.map((g) => (
            <div
              key={g.id}
              className="flex items-start gap-3 rounded-lg border border-border bg-card p-3"
            >
              <span
                className="mt-1 size-11 shrink-0 rounded-md border border-border"
                style={{ background: palette[g.id] }}
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <ColorWheel
                  id={`ground-color-${g.id}`}
                  label={g.label}
                  value={palette[g.id]}
                  onChange={(hex) => setGroundColor(g.id, hex)}
                />
              </div>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          {...pressProps(() => setChrome({ groundPalette: defaultGroundPalette() }))}
        >
          Teintes d’origine
        </Button>
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
            labelSize,
            toolBtnSize,
          }),
        )}
      >
        Tout afficher
      </Button>
    </SettingsShell>
  );
}
