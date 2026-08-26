import { createFileRoute, Link } from "@tanstack/react-router";
import { Map, Palette, Tags, UserRound } from "lucide-react";
import { SettingsShell } from "@/components/atlas/settings-shell";

export const Route = createFileRoute("/parametres/")({
  component: ParametresHub,
});

const SECTIONS = [
  {
    to: "/parametres/interface" as const,
    title: "Personnalisation de l’interface",
    hint: "Couleurs, polices, titres et coins.",
    Icon: Palette,
  },
  {
    to: "/parametres/proprietes" as const,
    title: "Les propriétés",
    hint: "Types, icônes, données prédéfinies, variables.",
    Icon: Tags,
  },
  {
    to: "/parametres/carte" as const,
    title: "Paramétrages de la map",
    hint: "Grille, boussole, pions, légendes.",
    Icon: Map,
  },
  {
    to: "/parametres/compte" as const,
    title: "Gestion du compte et données",
    hint: "Connexion, copie sur le compte, plan local.",
    Icon: UserRound,
  },
];

function ParametresHub() {
  return (
    <SettingsShell title="Paramètres" backTo="/" backLabel="Atlas">
      <p className="text-sm leading-relaxed text-muted-foreground">
        Quatre sections, une seule sauvegarde. Votre apparence n’est plus
        écrasée par un thème imposé.
      </p>
      <div className="flex flex-col gap-2">
        {SECTIONS.map((section) => (
          <Link
            key={section.to}
            to={section.to}
            className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 text-left transition-colors hover:bg-accent"
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-md border border-border bg-background">
              <section.Icon className="size-5" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-medium">{section.title}</span>
              <span className="block text-xs text-muted-foreground">
                {section.hint}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </SettingsShell>
  );
}
