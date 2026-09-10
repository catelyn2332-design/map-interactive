import { createFileRoute, Link } from "@tanstack/react-router";
import { Archive, Dices, Map, Palette, Tags, UserRound } from "lucide-react";
import { NamedTitle } from "@/components/atlas/editable-title";
import { SettingsShell } from "@/components/atlas/settings-shell";

export const Route = createFileRoute("/parametres/")({
  component: ParametresHub,
});

const SECTIONS = [
  {
    to: "/parametres/interface" as const,
    titleId: "hubInterface",
    title: "Personnalisation de l’interface",
    hint: "Panneaux, boutons, champs, icônes et polices.",
    Icon: Palette,
  },
  {
    to: "/parametres/proprietes" as const,
    titleId: "hubProperties",
    title: "Les propriétés",
    hint: "Types, icônes, données prédéfinies, variables.",
    Icon: Tags,
  },
  {
    to: "/parametres/carte" as const,
    titleId: "hubMap",
    title: "Paramétrages de la map",
    hint: "Grille, boussole, couleurs du sol.",
    Icon: Map,
  },
  {
    to: "/parametres/aleatoire" as const,
    titleId: "hubAssist",
    title: "Aléatoire et intelligence",
    hint: "Dé, voix, prompt, ce que l’assistant a le droit d’écrire.",
    Icon: Dices,
  },
  {
    to: "/parametres/coffre" as const,
    titleId: "hubVault",
    title: "Coffre et fichiers",
    hint: "Workspace, dossier des pièces, création et mise à jour des fichiers.",
    Icon: Archive,
  },
  {
    to: "/parametres/compte" as const,
    titleId: "hubAccount",
    title: "Gestion du compte et données",
    hint: "Connexion, copie sur le compte, plan local.",
    Icon: UserRound,
  },
];

function ParametresHub() {
  return (
    <SettingsShell title="Paramètres" titleId="settings" backTo="/" backLabel="Atlas">
      <p className="text-sm leading-relaxed text-muted-foreground">
        Six sections, une seule sauvegarde. Clic droit sur un titre pour le
        renommer.
      </p>
      <div className="flex flex-col gap-2">
        {SECTIONS.map((section) => (
          <Link
            key={section.to}
            to={section.to}
            aria-label={section.title}
            className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 text-left transition-colors hover:brightness-[0.96]"
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-md bg-icon text-icon-stroke">
              <section.Icon className="size-5" />
            </span>
            <span className="min-w-0">
              <NamedTitle
                id={section.titleId}
                fallback={section.title}
                as="span"
                className="block text-sm font-medium"
              />
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
