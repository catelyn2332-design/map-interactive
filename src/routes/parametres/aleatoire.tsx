import { createFileRoute } from "@tanstack/react-router";
import { NamedTitle } from "@/components/atlas/editable-title";
import { SettingsShell } from "@/components/atlas/settings-shell";
import { Chip } from "@/components/atlas/chip";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  DEFAULT_ASSIST,
  MOOD_OPTIONS,
  useUiStore,
  type AssistFill,
  type AssistIntensity,
  type AssistLength,
  type AssistOverwrite,
  type AssistPerimeter,
  type AssistVoice,
  type MoodId,
} from "@/lib/map/ui";
import { pressProps } from "@/lib/press";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/parametres/aleatoire")({
  component: AleatoirePage,
});

function ChoiceRow<T extends string>({
  label,
  hint,
  value,
  options,
  onChange,
}: {
  label: string;
  hint: string;
  value: T;
  options: Array<{ id: T; label: string }>;
  onChange: (id: T) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <Chip key={opt.id} active={value === opt.id} size="sm" onClick={() => onChange(opt.id)}>
            {opt.label}
          </Chip>
        ))}
      </div>
    </div>
  );
}

function AleatoirePage() {
  const assist = useUiStore((s) => s.assist);
  const setAssist = useUiStore((s) => s.setAssist);

  function toggleMood(id: MoodId) {
    const on = assist.moods.includes(id);
    const next = on ? assist.moods.filter((m) => m !== id) : [...assist.moods, id];
    setAssist({ moods: next.length ? next : [id] });
  }

  return (
    <SettingsShell title="Aléatoire et intelligence" titleId="assist">
      <p className="text-sm leading-relaxed text-muted-foreground">
        Le dé de la fiche pièce appelle Grok avec ces réglages et votre prompt.
        Rien n’est écrit sur le plan tant que vous n’appliquez pas — sauf si
        vous activez l’application directe.
      </p>

      <section className="flex flex-col gap-4">
        <div>
          <NamedTitle
            id="diceEngine"
            fallback="Moteur de tirage"
            as="h2"
            className="font-display text-lg font-medium tracking-[-0.02em]"
          />
          <p className="mt-1 text-sm text-muted-foreground">
            Ce que fait le bouton dé.
          </p>
        </div>
        <ChoiceRow<AssistIntensity>
          label="Intensité"
          hint="Sobre, vivant ou baroque."
          value={assist.intensity}
          onChange={(intensity) => setAssist({ intensity })}
          options={[
            { id: "sober", label: "Sobre" },
            { id: "lively", label: "Vivant" },
            { id: "baroque", label: "Baroque" },
          ]}
        />
        <ChoiceRow<AssistLength>
          label="Longueur"
          hint="Une phrase, deux ou trois, ou un paragraphe."
          value={assist.length}
          onChange={(length) => setAssist({ length })}
          options={[
            { id: "short", label: "1 phrase" },
            { id: "medium", label: "2–3 phrases" },
            { id: "long", label: "Paragraphe" },
          ]}
        />
        <button
          type="button"
          aria-pressed={assist.nameAnchor}
          {...pressProps(() => setAssist({ nameAnchor: !assist.nameAnchor }))}
          className={cn(
            "flex items-center justify-between gap-3 rounded-lg border p-4 text-left",
            assist.nameAnchor ? "border-primary bg-accent" : "border-border bg-card",
          )}
        >
          <span>
            <span className="block text-sm font-medium">Ancrage au nom</span>
            <span className="block text-xs text-muted-foreground">
              Cave → ombre, salon → grandeur, etc.
            </span>
          </span>
          <span className="text-xs text-muted-foreground">
            {assist.nameAnchor ? "Oui" : "Libre"}
          </span>
        </button>
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Humeurs autorisées</p>
          <p className="text-xs text-muted-foreground">
            Décochez pour les retirer du tirage.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {MOOD_OPTIONS.map((m) => (
              <Chip
                key={m.id}
                active={assist.moods.includes(m.id)}
                size="sm"
                onClick={() => toggleMood(m.id)}
              >
                {m.label}
              </Chip>
            ))}
          </div>
        </div>
      </section>

      <Separator />

      <section className="flex flex-col gap-4">
        <div>
          <NamedTitle
            id="assistVoice"
            fallback="Voix des descriptions"
            as="h2"
            className="font-display text-lg font-medium tracking-[-0.02em]"
          />
          <p className="mt-1 text-sm text-muted-foreground">
            Comment le lieu s’écrit.
          </p>
        </div>
        <ChoiceRow<AssistVoice>
          label="Voix"
          hint="Sensorielle, fiche froide, ou les deux."
          value={assist.voice}
          onChange={(voice) => setAssist({ voice })}
          options={[
            { id: "sensory", label: "Sensorielle" },
            { id: "sheet", label: "Fiche" },
            { id: "mix", label: "Mixte" },
          ]}
        />
      </section>

      <Separator />

      <section className="flex flex-col gap-4">
        <div>
          <NamedTitle
            id="assistScope"
            fallback="Portée"
            as="h2"
            className="font-display text-lg font-medium tracking-[-0.02em]"
          />
          <p className="mt-1 text-sm text-muted-foreground">
            Ce que le dé a le droit de toucher.
          </p>
        </div>
        <ChoiceRow<AssistFill>
          label="Remplir"
          hint="Texte seul, propriétés déjà posées, ou en ajouter."
          value={assist.fill}
          onChange={(fill) => setAssist({ fill })}
          options={[
            { id: "description", label: "Description" },
            { id: "assigned", label: "Propriétés posées" },
            { id: "add", label: "En ajouter" },
          ]}
        />
        {assist.fill === "add" ? (
          <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4">
            <Label htmlFor="add-max" className="flex items-center justify-between">
              <span>Propriétés à ajouter au plus</span>
              <span className="font-mono text-xs text-muted-foreground">{assist.addMax}</span>
            </Label>
            <input
              id="add-max"
              type="range"
              min={1}
              max={8}
              step={1}
              value={assist.addMax}
              onChange={(e) => setAssist({ addMax: Number(e.target.value) })}
              className="w-full accent-primary"
            />
          </div>
        ) : null}
        <ChoiceRow<AssistOverwrite>
          label="Si le lieu a déjà un texte"
          hint="Ne pas toucher, compléter ce qui est déjà écrit, ou remplacer."
          value={assist.overwrite}
          onChange={(overwrite) => setAssist({ overwrite })}
          options={[
            { id: "skip", label: "Ignorer" },
            { id: "draft", label: "Compléter" },
            { id: "replace", label: "Écraser" },
          ]}
        />
      </section>

      <Separator />

      <section className="flex flex-col gap-4">
        <div>
          <NamedTitle
            id="assistHelp"
            fallback="Assistance"
            as="h2"
            className="font-display text-lg font-medium tracking-[-0.02em]"
          />
          <p className="mt-1 text-sm text-muted-foreground">
            Consigne permanente envoyée à Grok à chaque lancer du dé.
            Elle oriente le texte : elle n’est jamais recopiée telle quelle.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="assist-prompt">Prompt</Label>
          <Textarea
            id="assist-prompt"
            rows={5}
            value={assist.prompt}
            placeholder="Ex. Maison d’une famille de l’Homme Volant, fin XIXe, luxe usé, jamais de comédie. Décrire ce qu’on sent au seuil."
            onChange={(e) => setAssist({ prompt: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            Ce texte est une instruction, pas un paragraphe à coller. Un lancer = un appel.
          </p>
        </div>
        <ChoiceRow<AssistPerimeter>
          label="Périmètre"
          hint="Le dé de la fiche agit sur le lieu. L’étage et le plan sont réservés."
          value={assist.perimeter}
          onChange={(perimeter) => setAssist({ perimeter })}
          options={[
            { id: "place", label: "Lieu" },
            { id: "floor", label: "Étage" },
            { id: "plan", label: "Plan" },
          ]}
        />
        <button
          type="button"
          aria-pressed={assist.autoApply}
          {...pressProps(() => setAssist({ autoApply: !assist.autoApply }))}
          className={cn(
            "flex items-center justify-between gap-3 rounded-lg border p-4 text-left",
            assist.autoApply ? "border-primary bg-accent" : "border-border bg-card",
          )}
        >
          <span>
            <span className="block text-sm font-medium">Application directe</span>
            <span className="block text-xs text-muted-foreground">
              Écrit tout de suite, sans brouillon. Désactivée par défaut.
            </span>
          </span>
          <span className="text-xs text-muted-foreground">
            {assist.autoApply ? "On" : "Off"}
          </span>
        </button>
      </section>

      <Button type="button" variant="outline" {...pressProps(() => setAssist(DEFAULT_ASSIST))}>
        Réinitialiser ces réglages
      </Button>
    </SettingsShell>
  );
}
