import { Download, Save, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  buildProgressFile,
  downloadProgressFile,
  parseProgressFile,
} from "@/lib/progress";
import { snapshotOf, useAleas } from "@/lib/store";
import { loadPersistedTheme, useThemeStore } from "@/lib/theme-store";

export function ProgressPanel() {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const words = useAleas((s) => s.customKeywords.length);
  const types = useAleas((s) => s.customTypes.length);
  const hidden = useAleas((s) => s.hiddenTypes.length);
  const archive = useAleas((s) => s.archive.length);
  const applyProgress = useAleas((s) => s.applyProgress);

  function exportFile() {
    const progress = snapshotOf(useAleas.getState());
    const theme = loadPersistedTheme() ?? {
      theme: useThemeStore.getState().theme,
      palettes: useThemeStore.getState().palettes,
    };
    downloadProgressFile(buildProgressFile(progress, theme));
    toast("Fichier de progression téléchargé");
  }

  function importFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const parsed = parseProgressFile(String(reader.result ?? ""));
      if (!parsed) {
        toast("Fichier illisible");
        return;
      }
      applyProgress(parsed.progress);
      if (parsed.theme?.theme) {
        if (parsed.theme.palettes) {
          useThemeStore.setState({ palettes: parsed.theme.palettes });
        }
        useThemeStore.getState().replaceTheme(parsed.theme.theme);
      }
      toast("Progression restaurée");
      setOpen(false);
    };
    reader.readAsText(file);
  }

  return (
    <>
      <Button type="button" variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label="Progression">
        <Save />
      </Button>
      {open ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            className="absolute inset-0 bg-background/70"
            aria-label="Fermer la progression"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-border bg-card shadow-xl">
            <header className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <p className="font-display text-xl tracking-tight">Progression</p>
                <p className="text-sm text-muted-foreground">
                  Sauvegardée ici, dans ce navigateur
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Fermer">
                <X />
              </Button>
            </header>
            <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-5 py-5">
              <ul className="flex flex-col gap-2 text-sm">
                <li className="flex justify-between rounded-md border border-border px-3 py-2">
                  <span className="text-muted-foreground">Mots</span>
                  <span>{words}</span>
                </li>
                <li className="flex justify-between rounded-md border border-border px-3 py-2">
                  <span className="text-muted-foreground">Types perso</span>
                  <span>{types}</span>
                </li>
                <li className="flex justify-between rounded-md border border-border px-3 py-2">
                  <span className="text-muted-foreground">Types retirés</span>
                  <span>{hidden}</span>
                </li>
                <li className="flex justify-between rounded-md border border-border px-3 py-2">
                  <span className="text-muted-foreground">Archives</span>
                  <span>{archive}</span>
                </li>
              </ul>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Lexique, types, archives, tirages et couleurs se gravent tout
                seuls. Exportez un fichier si vous changez d'appareil.
              </p>
              <div className="flex flex-col gap-2">
                <Button type="button" onClick={exportFile}>
                  <Download />
                  Exporter un fichier
                </Button>
                <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>
                  <Upload />
                  Importer un fichier
                </Button>
                <input
                  ref={inputRef}
                  type="file"
                  accept="application/json,.json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) importFile(file);
                    e.target.value = "";
                  }}
                />
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
