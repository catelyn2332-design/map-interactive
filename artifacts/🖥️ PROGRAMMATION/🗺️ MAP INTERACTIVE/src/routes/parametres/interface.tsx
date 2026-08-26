import { createFileRoute } from "@tanstack/react-router";
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
import { useUiStore, type CopyLabels } from "@/lib/map/ui";
import { pressProps } from "@/lib/press";

export const Route = createFileRoute("/parametres/interface")({
  component: InterfacePage,
});

const COLOR_FIELDS: Array<{ key: keyof Theme; label: string; hint: string }> = [
  { key: "background", label: "Fond d’écran", hint: "Page entière" },
  { key: "paper", label: "Fond de la carte", hint: "Plan et zones" },
  { key: "card", label: "Panneaux", hint: "Dossier, en-tête" },
  { key: "foreground", label: "Texte", hint: "Titres et corps" },
  { key: "mutedForeground", label: "Texte secondaire", hint: "Légendes" },
  { key: "primary", label: "Boutons", hint: "Actions, sélection" },
  { key: "secondary", label: "Boutons discrets", hint: "Secondaires" },
  { key: "border", label: "Bordures", hint: "Lignes, cadres" },
  { key: "clay", label: "Alerte", hint: "Erreur, danger" },
];

const COPY_FIELDS: Array<{ key: keyof CopyLabels; label: string; hint: string }> = [
  { key: "appName", label: "Nom de l’application", hint: "Titre de l’en-tête" },
  { key: "floorWord", label: "Mot « étage »", hint: "Onglets et nouveau niveau" },
  { key: "roomWord", label: "Mot « pièce »", hint: "Nom par défaut d’une pièce" },
  { key: "emptyPlan", label: "Message du plan vide", hint: "Affiché tant qu’il n’y a rien" },
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
          value={value}
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
  const copy = useUiStore((s) => s.copy);
  const setCopy = useUiStore((s) => s.setCopy);
  const displayFonts = FONT_OPTIONS.filter((f) => f.kind === "display");
  const sansFonts = FONT_OPTIONS.filter((f) => f.kind === "sans");

  return (
    <SettingsShell title="Interface">
      <section className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-medium tracking-[-0.02em]">
          Aperçu
        </h2>
        <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4 sm:p-5">
          <p className="font-display text-xl font-medium tracking-[-0.03em]">
            {copy.appName}
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Un plan vide, des pièces que vous tracez, une histoire que vous
            écrivez.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button>Ouvrir</Button>
            <Button variant="secondary">Notes</Button>
            <Button variant="outline">Annuler</Button>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-lg font-medium tracking-[-0.02em]">
          Couleurs
        </h2>
        <p className="text-sm text-muted-foreground">
          Votre palette reste en place. Rien ne la remplace par un thème tout
          fait.
        </p>
        <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4 sm:p-5">
          {COLOR_FIELDS.map((field) => (
            <ColorField
              key={field.key}
              id={`color-${field.key}`}
              label={field.label}
              hint={field.hint}
              value={String(theme[field.key])}
              onChange={(hex) =>
                setTheme({ [field.key]: hex } as Partial<Theme>)
              }
            />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-lg font-medium tracking-[-0.02em]">
          Mots de l’interface
        </h2>
        <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4 sm:p-5">
          {COPY_FIELDS.map((field) => (
            <div key={field.key} className="flex flex-col gap-2">
              <Label htmlFor={`copy-${field.key}`}>{field.label}</Label>
              <Input
                id={`copy-${field.key}`}
                value={copy[field.key]}
                onChange={(e) => setCopy({ [field.key]: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">{field.hint}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-lg font-medium tracking-[-0.02em]">
          Typographie
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="display-font">Titres</Label>
            <select
              id="display-font"
              value={theme.displayFont}
              onChange={(e) => setTheme({ displayFont: e.target.value })}
              className="h-11 rounded-md border border-input bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
              className="h-11 rounded-md border border-input bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
        <h2 className="font-display text-lg font-medium tracking-[-0.02em]">
          Coins des boutons
        </h2>
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
          {...pressProps(resetTheme)}
        >
          Rétablir l’apparence
        </Button>
      </div>
    </SettingsShell>
  );
}
