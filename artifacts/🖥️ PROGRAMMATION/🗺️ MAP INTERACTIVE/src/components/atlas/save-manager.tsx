import { Download, FolderOpen, Save, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  appearanceOf,
  createNamedSave,
  defaultSaveName,
  deleteSave,
  downloadCurrent,
  downloadSave,
  formatSavedAt,
  importSaveFile,
  overwriteSave,
  restoreSave,
  saveBlurb,
  useSaveCatalog,
  type SaveRecord,
} from "@/lib/map/saves";
import { adoptPreferences } from "@/lib/map/prefs";
import { pressProps } from "@/lib/press";

export function SaveManager() {
  const named = useSaveCatalog((s) => s.named);
  const autos = useSaveCatalog((s) => s.autos);
  const lastAutoAt = useSaveCatalog((s) => s.lastAutoAt);
  const [draft, setDraft] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function saveNow() {
    const rec = createNamedSave(draft || defaultSaveName());
    setDraft("");
    toast.success(`« ${rec.name} » enregistrée`);
  }

  function restore(rec: SaveRecord) {
    if (!restoreSave(rec.id)) {
      toast.error("Impossible de restaurer ces réglages");
      return;
    }
    void adoptPreferences(rec.payload);
    toast.success(`Réglages restaurés : ${rec.name}`);
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    try {
      const text = await file.text();
      const rec = importSaveFile(JSON.parse(text), true);
      if (!rec) {
        toast.error("Fichier illisible");
        return;
      }
      toast.success(`Importés : ${rec.name}`);
      void adoptPreferences(rec.payload);
    } catch {
      toast.error("Fichier illisible");
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground text-pretty">
        Couleurs, polices, propriétés, étages, pièces et leurs textes. Les pions
        et les notes de partie restent à part — ceci n’enregistre que le plan et
        l’interface.
      </p>

      <section className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:p-5">
        <Label htmlFor="save-name">Nouveau jeu de réglages</Label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            id="save-name"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={defaultSaveName()}
            className="min-w-0 flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                saveNow();
              }
            }}
          />
          <Button type="button" {...pressProps(saveNow)}>
            <Save className="size-4" />
            Enregistrer
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            {...pressProps(() => downloadCurrent(draft || defaultSaveName()))}
          >
            <Download className="size-4" />
            Télécharger
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            {...pressProps(() => fileRef.current?.click())}
          >
            <Upload className="size-4" />
            Importer un fichier
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            aria-label="Importer des réglages"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              void onFile(file);
            }}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          {lastAutoAt
            ? `Dernière copie automatique : ${formatSavedAt(lastAutoAt)}`
            : "Une copie se fait toute seule dès que vous changez l’apparence, une propriété ou un texte."}
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-medium tracking-[-0.02em]">
          Mes réglages
        </h2>
        {named.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border bg-card px-4 py-6 text-sm text-muted-foreground">
            Aucun jeu enregistré. Changez les couleurs ou les pièces, puis
            donnez un nom à cette configuration.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {named.map((rec) => (
              <SaveCard
                key={rec.id}
                record={rec}
                onRestore={() => restore(rec)}
                onDownload={() => downloadSave(rec)}
                onOverwrite={() => {
                  overwriteSave(rec.id);
                  toast.success(`« ${rec.name} » mise à jour`);
                }}
                onDelete={() => {
                  deleteSave(rec.id);
                  toast.message("Réglages retirés");
                }}
              />
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3 pb-8">
        <h2 className="font-display text-lg font-medium tracking-[-0.02em]">
          Historique automatique
        </h2>
        {autos.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Rien encore. Modifiez l’apparence, une propriété ou une description.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {autos.map((rec) => (
              <SaveCard
                key={rec.id}
                record={rec}
                auto
                onRestore={() => restore(rec)}
                onDownload={() => downloadSave(rec)}
                onDelete={() => {
                  deleteSave(rec.id);
                  toast.message("Copie retirée");
                }}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function SaveCard({
  record,
  auto,
  onRestore,
  onDownload,
  onOverwrite,
  onDelete,
}: {
  record: SaveRecord;
  auto?: boolean;
  onRestore: () => void;
  onDownload: () => void;
  onOverwrite?: () => void;
  onDelete: () => void;
}) {
  const theme = appearanceOf(record.payload);
  return (
    <li className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
      <div className="flex min-w-0 items-start gap-3">
        {theme ? (
          <span className="flex shrink-0 gap-1 pt-0.5" aria-hidden>
            <span
              className="size-4 rounded-sm border border-border"
              style={{ background: theme.background }}
            />
            <span
              className="size-4 rounded-sm border border-border"
              style={{ background: theme.primary }}
            />
          </span>
        ) : null}
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{record.name}</p>
          <p className="text-xs text-muted-foreground">
            {formatSavedAt(record.savedAt)}
            {saveBlurb(record.payload) ? ` · ${saveBlurb(record.payload)}` : ""}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" {...pressProps(onRestore)}>
          <FolderOpen className="size-4" />
          Restaurer
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          {...pressProps(onDownload)}
        >
          <Download className="size-4" />
          Fichier
        </Button>
        {onOverwrite && !auto ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            {...pressProps(onOverwrite)}
          >
            <Save className="size-4" />
            Écraser
          </Button>
        ) : null}
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label={`Supprimer ${record.name}`}
          {...pressProps(onDelete)}
        >
          <Trash2 className="size-4" />
          Supprimer
        </Button>
      </div>
    </li>
  );
}
