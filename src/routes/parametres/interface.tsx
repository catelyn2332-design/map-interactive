import { createFileRoute } from "@tanstack/react-router";
import { Settings, Undo2 } from "lucide-react";
import { NamedTitle } from "@/components/atlas/editable-title";
import { Panel } from "@/components/atlas/panel";
import { SettingsShell } from "@/components/atlas/settings-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  DEFAULT_THEME,
  FONT_OPTIONS,
  isHex,
  themesEqual,
  type Theme,
} from "@/lib/theme";
import { useThemeStore } from "@/lib/theme-store";
import { pressProps } from "@/lib/press";

export const Route = createFileRoute("/parametres/interface")({
  component: InterfacePage,
});

const COLOR_FIELDS: Array<{ key: keyof Theme; label: string; hint: string }> = [
  { key: "background", label: "Fond d’écran", hint: "Page entière" },
  { key: "paper", label: "Fond de la carte", hint: "Plan et zones" },
  { key: "card", label: "Panneaux", hint: "Conteneurs titrés" },
  { key: "field", label: "Champs", hint: "Là où l’on écrit" },
  { key: "primary", label: "Boutons", hint: "S’assombrissent au survol" },
  { key: "icon", label: "Boutons d’icônes", hint: "Carrés, action compacte" },
  { key: "iconStroke", label: "Tracés des icônes", hint: "Dessin des pictogrammes" },
  { key: "foreground", label: "Texte", hint: "Titres et corps" },
  { key: "mutedForeground", label: "Texte secondaire", hint: "Légendes" },
  { key: "border", label: "Bordures", hint: "Lignes, cadres" },
  { key: "clay", label: "Alerte", hint: "Erreur, danger" },
];

function ColorField({
  id,
  label,
  hint,
  value,
  onChange,
}: {
  id: string;
  label: string;
  hint: string;
  value: string;
  onChange: (hex: string) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <label className="relative size-11 shrink-0 overflow-hidden rounded-md border border-border">
        <span className="sr-only">{label}</span>
        <input
          type="color"
          value={isHex(value) ? value : "#888888"}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 size-[150%] -translate-x-1/4 -translate-y-1/4 cursor-pointer border-0 p-0"
        />
      </label>
      <div className="min-w-0 flex-1">
        <Label htmlFor={id}>{label}</Label>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <Input
        id={id}
        value={value}
        onChange={(e) => {
          const next = e.target.value.trim();
          if (isHex(next)) onChange(next);
        }}
        aria-label={label}
        className="h-11 w-[7.5rem] font-mono text-sm uppercase"
        maxLength={7}
      />
    </div>
  );
}

function InterfacePage() {
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const resetTheme = useThemeStore((s) => s.resetTheme);
  const displayFonts = FONT_OPTIONS.filter((f) => f.kind === "display");
  const sansFonts = FONT_OPTIONS.filter((f) => f.kind === "sans");

  return (
    <SettingsShell title="Interface" titleId="interface">
      <section className="flex flex-col gap-3">
        <NamedTitle
          id="preview"
          fallback="Aperçu"
          as="h2"
          className="font-display text-lg font-medium tracking-[-0.02em]"
        />
        <p className="text-sm text-muted-foreground">
          Clic droit sur un titre — panneau ou vrai titre — pour le renommer.
        </p>
        <Panel titleId="map" fallback="Map">
          <Button size="sm" aria-label="Atelier">
            Atelier
          </Button>
          <Button size="icon" variant="icon" aria-label="Annuler">
            <Undo2 className="size-4" />
          </Button>
          <Button size="icon" variant="icon" aria-label="Réglages">
            <Settings className="size-4" />
          </Button>
          <Input className="h-9 w-36" placeholder="Un champ…" defaultValue="" />
        </Panel>
      </section>

      <section className="flex flex-col gap-4">
        <NamedTitle
          id="colors"
          fallback="Couleurs"
          as="h2"
          className="font-display text-lg font-medium tracking-[-0.02em]"
        />
        <p className="text-sm text-muted-foreground">
          Panneaux, boutons, champs, boutons d’icônes et tracés. Chaque bouton
          s’assombrit un peu au survol, une bulle apparaît.
        </p>
        <Panel titleId="palette" fallback="Palette" bodyClassName="flex-col items-stretch gap-4">
          {COLOR_FIELDS.map((field) => (
            <ColorField
              key={field.key}
              id={`color-${field.key}`}
              label={field.label}
              hint={field.hint}
              value={String(theme[field.key] ?? "")}
              onChange={(hex) =>
                setTheme({ [field.key]: hex } as Partial<Theme>)
              }
            />
          ))}
        </Panel>
      </section>

      <section className="flex flex-col gap-4">
        <NamedTitle
          id="type"
          fallback="Typographie"
          as="h2"
          className="font-display text-lg font-medium tracking-[-0.02em]"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="display-font">Titres</Label>
            <select
              id="display-font"
              value={theme.displayFont}
              onChange={(e) => setTheme({ displayFont: e.target.value })}
              className="h-11 rounded-md border border-input bg-field px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {displayFonts.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.id}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="sans-font">Texte</Label>
            <select
              id="sans-font"
              value={theme.sansFont}
              onChange={(e) => setTheme({ sansFont: e.target.value })}
              className="h-11 rounded-md border border-input bg-field px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {sansFonts.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.id}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <NamedTitle
          id="corners"
          fallback="Coins des boutons"
          as="h2"
          className="font-display text-lg font-medium tracking-[-0.02em]"
        />
        <div className="flex flex-wrap gap-2">
          {[
            { n: 8, label: "Nets" },
            { n: 12, label: "Souples" },
            { n: 16, label: "Ronds" },
          ].map((opt) => (
            <Button
              key={opt.n}
              type="button"
              variant={theme.radius === opt.n ? "default" : "outline"}
              aria-label={opt.label}
              {...pressProps(() => setTheme({ radius: opt.n }))}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </section>

      <Separator />

      <div className="flex flex-wrap justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={themesEqual(theme, DEFAULT_THEME)}
          aria-label="Rétablir l’apparence"
          {...pressProps(resetTheme)}
        >
          Rétablir l’apparence
        </Button>
      </div>
    </SettingsShell>
  );
}
