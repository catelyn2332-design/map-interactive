import { ImagePlus, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  collectPlanPhotos,
  mergePhotos,
  readImageFile,
  WORKSPACE_PHOTOS,
} from "@/lib/map/photos";
import { useAtlas } from "@/lib/map/store";
import type { MapPhoto } from "@/lib/map/types";
import { pressProps } from "@/lib/press";
import { cn } from "@/lib/utils";

export function PhotoField({
  photos,
  onChange,
}: {
  photos: MapPhoto[];
  onChange: (photos: MapPhoto[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const rooms = useAtlas((s) => s.rooms);
  const fixtures = useAtlas((s) => s.fixtures);
  const [busy, setBusy] = useState(false);
  const [openLib, setOpenLib] = useState(false);
  const used = collectPlanPhotos(rooms, fixtures);
  const library = [
    ...WORKSPACE_PHOTOS,
    ...used.filter((p) => !WORKSPACE_PHOTOS.some((w) => w.src === p.src)),
  ];
  const taken = new Set(photos.map((p) => p.src));

  async function onFiles(list: FileList | null) {
    if (!list?.length) return;
    setBusy(true);
    try {
      const extra: MapPhoto[] = [];
      for (const file of [...list]) {
        try {
          extra.push(await readImageFile(file));
        } catch {
          /* skip */
        }
      }
      if (extra.length) onChange(mergePhotos(photos, extra));
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <section className="flex flex-col gap-3">
      <Label>Photos</Label>
      {photos.length ? (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {photos.map((photo) => (
            <li
              key={photo.id}
              className="group relative overflow-hidden rounded-md border border-border bg-muted"
            >
              <img
                src={photo.src}
                alt={photo.name || "Photo"}
                className="aspect-[4/3] w-full object-cover"
              />
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="absolute right-1.5 top-1.5 size-8 bg-card/90"
                aria-label={`Retirer ${photo.name || "la photo"}`}
                {...pressProps(() =>
                  onChange(photos.filter((p) => p.id !== photo.id)),
                )}
              >
                <Trash2 className="size-4" />
              </Button>
              {photo.name ? (
                <p className="truncate px-2 py-1 text-xs text-muted-foreground">
                  {photo.name}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          Aucune photo. Importez-en une, ou choisissez-en une déjà dans le
          workspace.
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          aria-label="Importer des photos"
          onChange={(e) => void onFiles(e.target.files)}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy || photos.length >= 12}
          {...pressProps(() => inputRef.current?.click())}
        >
          <ImagePlus className="size-4" />
          {busy ? "Import…" : "Importer"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-expanded={openLib}
          {...pressProps(() => setOpenLib((v) => !v))}
        >
          Bibliothèque
        </Button>
      </div>
      {openLib ? (
        <div className="grid grid-cols-3 gap-2 rounded-lg border border-border bg-card p-2 sm:grid-cols-4">
          {library.map((photo) => {
            const on = taken.has(photo.src);
            return (
              <button
                key={photo.id}
                type="button"
                disabled={on || photos.length >= 12}
                title={photo.name}
                onClick={() => {
                  if (on) return;
                  onChange(mergePhotos(photos, [photo]));
                }}
                className={cn(
                  "overflow-hidden rounded-md border text-left",
                  on
                    ? "border-primary opacity-60"
                    : "border-border hover:border-primary",
                )}
              >
                <img
                  src={photo.src}
                  alt={photo.name || "Photo"}
                  className="aspect-[4/3] w-full object-cover"
                />
                <span className="block truncate px-1.5 py-1 text-[11px] text-muted-foreground">
                  {photo.name || "Photo"}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
