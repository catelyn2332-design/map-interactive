import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { CollapsePicker } from "@/components/atlas/collapse-picker";
import { NamedTitle } from "@/components/atlas/editable-title";
import { SettingsShell } from "@/components/atlas/settings-shell";
import { Separator } from "@/components/ui/separator";
import {
  displayPath,
  ensureVaultDir,
  leafName,
  listVault,
  listWorkspaces,
  pathUnder,
  vaultPathItems,
} from "@/lib/map/vault-files";
import { isGrokRef } from "@/lib/map/grok-workspaces";
import { useUiStore } from "@/lib/map/ui";
import { pressProps } from "@/lib/press";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/parametres/coffre")({
  component: CoffrePage,
});

function CoffrePage() {
  return (
    <SettingsShell title="Coffre et fichiers" titleId="vault">
      <p className="text-sm leading-relaxed text-muted-foreground">
        D’abord un projet Grok du compte, ensuite le dossier des pièces — sans
        le premier, aucun chemin n’apparaît.
      </p>
      <WorkspacePanel />
      <Separator />
      <FilesPanel />
    </SettingsShell>
  );
}

function WorkspacePanel() {
  const workspaceName = useUiStore((s) => s.copy.workspaceName);
  const vault = useUiStore((s) => s.vault);
  const setCopy = useUiStore((s) => s.setCopy);
  const setVault = useUiStore((s) => s.setVault);
  const [items, setItems] = useState<
    Array<{ name: string; path: string; hint?: string; available?: boolean }>
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    void listWorkspaces().then((list) => {
      if (!live) return;
      setItems(list);
      setLoading(false);
    });
    return () => {
      live = false;
    };
  }, []);

  function pick(path: string) {
    const found = items.find((item) => item.path === path);
    const name = found?.name ?? leafName(path);
    const root =
      path && !isGrokRef(path) && vault.root && pathUnder(path, vault.root)
        ? vault.root
        : "";
    setCopy({ workspaceName: name });
    setVault({ workspace: path, root });
    toast.message(`Workspace : ${name}`);
  }

  function clear() {
    setCopy({ workspaceName: "" });
    setVault({ workspace: "", root: "" });
    toast.message("Workspace détaché");
  }

  return (
    <section className="flex flex-col gap-3">
      <NamedTitle
        id="workspace"
        fallback="Workspace"
        as="h2"
        className="font-display text-lg font-medium tracking-[-0.02em]"
      />
      <p className="text-sm leading-relaxed text-muted-foreground">
        Projets Grok du compte — L’Homme Volant, L’Enchanteresse, Espace de
        travail, et les autres. Le nom s’affiche au-dessus des étages.
      </p>
      <CollapsePicker
        label="Workspace"
        value={vault.workspace}
        placeholder="Choisir un projet Grok…"
        loading={loading}
        items={items.map((item) => ({
          id: item.path,
          label: item.name,
          hint: item.hint,
        }))}
        emptyHint="Aucun projet Grok trouvé sur le compte."
        onChange={pick}
        onClear={vault.workspace ? clear : undefined}
      />
      {workspaceName && vault.workspace ? (
        <p className="text-xs text-muted-foreground">
          Lié à <span className="font-medium text-foreground">{workspaceName}</span>
        </p>
      ) : null}
    </section>
  );
}

function FilesPanel() {
  const vault = useUiStore((s) => s.vault);
  const setVault = useUiStore((s) => s.setVault);
  const [dirs, setDirs] = useState<string[]>([]);
  const [files, setFiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  function reload() {
    if (!vault.workspace) {
      setDirs([]);
      setFiles([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    void listVault(vault.workspace).then((bag) => {
      setDirs(bag.dirs);
      setFiles(bag.files);
      setLoading(false);
    });
  }

  useEffect(() => {
    reload();
  }, [vault.workspace]);

  const paths = useMemo(
    () => vaultPathItems({ files, dirs }, vault.workspace, "all"),
    [files, dirs, vault.workspace],
  );

  async function pick(path: string) {
    const asFile = files.includes(path) && !dirs.includes(path);
    const dir = asFile ? path.split("/").slice(0, -1).join("/") : path;
    const made = await ensureVaultDir(dir);
    const root = made ?? dir;
    setVault({ root });
    toast.message(`Dossier des pièces : ${displayPath(vault.workspace, root)}`);
  }

  const locked = !vault.workspace;
  const remote = Boolean(vault.workspace && isGrokRef(vault.workspace));

  return (
    <section className="flex flex-col gap-3">
      <NamedTitle
        id="vaultFiles"
        fallback="Fichiers des pièces"
        as="h2"
        className="font-display text-lg font-medium tracking-[-0.02em]"
      />
      <p className="text-sm leading-relaxed text-muted-foreground">
        Tous les dossiers du vault — Personnages, Factions, Map, Timelines… Entrez
        dans un dossier, puis choisissez-le. Un fichier dédié y est créé s’il
        n’existe pas déjà un fichier au nom de la pièce.
      </p>
      <CollapsePicker
        label="Fichiers des pièces"
        value={vault.root}
        pathMode
        root={remote ? "" : vault.workspace}
        pickFolderLabel="Choisir ce dossier"
        placeholder={
          locked
            ? "D’abord un workspace"
            : remote
              ? "Fichiers absents de cet Atlas"
              : "Choisir un chemin…"
        }
        loading={loading}
        locked={locked}
        lockedHint="Choisissez d’abord un projet Grok — sans lui, aucun chemin n’apparaît."
        emptyHint={
          remote
            ? "Les fichiers de ce projet ne sont pas ouverts dans Atlas — seul L’Homme Volant l’est."
            : "Ce projet n’a pas encore de dossier."
        }
        items={paths.map((item) => ({
          id: item.path,
          label: item.label,
          kind: item.kind,
        }))}
        onChange={(id) => void pick(id)}
        onOpen={reload}
        onClear={
          vault.root
            ? () => {
                setVault({ root: "" });
                toast.message("Dossier des pièces détaché");
              }
            : undefined
        }
      />
      <ToggleRow
        label="Créer un fichier si la pièce n’en a pas"
        hint="S’il n’existe pas déjà un fichier au nom de la pièce dans le chemin choisi, un fichier dédié y est créé."
        on={vault.createOnRoom}
        onToggle={() => setVault({ createOnRoom: !vault.createOnRoom })}
      />
      <ToggleRow
        label="Mettre à jour le titre et la description"
        hint="Les changements du dossier s’écrivent dans le fichier lié."
        on={vault.syncNotes}
        onToggle={() => setVault({ syncNotes: !vault.syncNotes })}
      />
    </section>
  );
}

function ToggleRow({
  label,
  hint,
  on,
  onToggle,
}: {
  label: string;
  hint: string;
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      {...pressProps(onToggle)}
      className={cn(
        "flex appearance-none items-center justify-between gap-3 rounded-lg border p-4 text-left transition-colors",
        on ? "border-primary bg-accent" : "border-border bg-background hover:bg-accent",
      )}
    >
      <span>
        <span className="block text-sm font-medium">{label}</span>
        <span className="block text-xs text-muted-foreground">{hint}</span>
      </span>
      <span className="text-xs font-medium text-muted-foreground">{on ? "Oui" : "Non"}</span>
    </button>
  );
}
