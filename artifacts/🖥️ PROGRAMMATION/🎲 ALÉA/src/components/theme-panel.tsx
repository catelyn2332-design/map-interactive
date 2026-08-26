import { Palette, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FONT_OPTIONS, PRESETS, isHex } from "@/lib/theme";
import { useThemeStore } from "@/lib/theme-store";
import { cn } from "@/lib/utils";

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (hex: string) => void;
}) {
  const hex = isHex(value) ? value : "#000000";
  return (
    <label className="flex items-center justify-between gap-3">
      <span className="text-sm text-foreground">{label}</span>
      <span className="flex items-center gap-2">
        <input
          type="color"
          value={hex}
          onChange={(e) => {
            const next = e.target.value;
            if (isHex(next)) onChange(next);
          }}
          className="h-11 w-11 cursor-pointer rounded-md border border-border bg-transparent p-1"
          aria-label={label}
        />
        <Input
          value={hex}
          onChange={(e) => {
            const next = e.target.value.startsWith("#") ? e.target.value : `#${e.target.value}`;
            if (isHex(next)) onChange(next);
          }}
          className="h-11 w-[7.5rem] font-mono text-xs uppercase"
        />
      </span>
    </label>
  );
}

export function ThemePanel() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const theme = useThemeStore((s) => s.theme);
  const palettes = useThemeStore((s) => s.palettes);
  const setTheme = useThemeStore((s) => s.setTheme);
  const replaceTheme = useThemeStore((s) => s.replaceTheme);
  const savePalette = useThemeStore((s) => s.savePalette);
  const applyPalette = useThemeStore((s) => s.applyPalette);
  const removePalette = useThemeStore((s) => s.removePalette);

  const displayFonts = FONT_OPTIONS.filter((f) => f.kind === "display");
  const sansFonts = FONT_OPTIONS.filter((f) => f.kind === "sans");

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Apparence"
        onClick={() => setOpen(true)}
      >
        <Palette />
      </Button>

      {open ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            className="absolute inset-0 bg-background/70"
            aria-label="Fermer l'apparence"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-border bg-card shadow-xl">
            <header className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <p className="font-display text-xl tracking-tight">Apparence</p>
                <p className="text-sm text-muted-foreground">Enregistrée sur cet appareil</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Fermer">
                <X />
              </Button>
            </header>

            <div className="flex flex-1 flex-col gap-7 overflow-y-auto px-5 py-5">
              <section className="flex flex-col gap-3">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Presets
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      data-preset={preset.id}
                      onClick={() => replaceTheme(preset.theme)}
                      className="flex h-11 items-center gap-2 rounded-md border border-border px-3 text-left text-sm hover:bg-accent"
                    >
                      <span
                        className="size-5 shrink-0 rounded-full border border-border"
                        style={{ background: preset.theme.primary, boxShadow: `inset 8px 0 0 ${preset.theme.background}` }}
                      />
                      {preset.name}
                    </button>
                  ))}
                </div>
              </section>

              <section className="flex flex-col gap-3">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Couleurs
                </p>
                <ColorField
                  label="Fond"
                  value={theme.background}
                  onChange={(background) => isHex(background) && setTheme({ background })}
                />
                <ColorField
                  label="Texte"
                  value={theme.foreground}
                  onChange={(foreground) => isHex(foreground) && setTheme({ foreground })}
                />
                <ColorField
                  label="Surfaces"
                  value={theme.card}
                  onChange={(card) => isHex(card) && setTheme({ card })}
                />
                <ColorField
                  label="Boutons"
                  value={theme.primary}
                  onChange={(primary) => isHex(primary) && setTheme({ primary })}
                />
                <ColorField
                  label="Texte secondaire"
                  value={theme.mutedForeground}
                  onChange={(mutedForeground) =>
                    isHex(mutedForeground) && setTheme({ mutedForeground })
                  }
                />
              </section>

              <section className="flex flex-col gap-3">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Polices
                </p>
                <label className="flex flex-col gap-2">
                  <span className="text-sm">Titres</span>
                  <select
                    value={theme.displayFont}
                    onChange={(e) => setTheme({ displayFont: e.target.value })}
                    className="h-11 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    {displayFonts.map((font) => (
                      <option key={font.id} value={font.id}>
                        {font.id}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-sm">Corps</span>
                  <select
                    value={theme.sansFont}
                    onChange={(e) => setTheme({ sansFont: e.target.value })}
                    className="h-11 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    {sansFonts.map((font) => (
                      <option key={font.id} value={font.id}>
                        {font.id}
                      </option>
                    ))}
                  </select>
                </label>
              </section>

              <section className="flex flex-col gap-3">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Palettes enregistrées
                </p>
                <div className="flex gap-2">
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nom de la palette"
                  />
                  <Button
                    onClick={() => {
                      savePalette(name);
                      setName("");
                      toast("Palette enregistrée");
                    }}
                  >
                    Sauver
                  </Button>
                </div>
                {palettes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Aucune palette perso pour l'instant.
                  </p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {palettes.map((palette) => (
                      <li
                        key={palette.id}
                        className={cn(
                          "flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2",
                        )}
                      >
                        <button
                          type="button"
                          className="min-w-0 flex-1 truncate text-left text-sm"
                          onClick={() => applyPalette(palette.id)}
                        >
                          {palette.name}
                        </button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removePalette(palette.id)}
                        >
                          Retirer
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
