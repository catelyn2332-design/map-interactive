import { uid } from "./props";
import type { MapFixture, MapPhoto, Room } from "./types";
import { sanitizePhotos } from "./types";

export const WORKSPACE_PHOTOS: MapPhoto[] = [
  { id: "ws-facade", src: "/maps/facade.jpg", name: "Façade" },
  { id: "ws-parcelle", src: "/maps/parcelle.jpg", name: "Parcelle" },
  { id: "ws-veranda", src: "/maps/veranda.jpg", name: "Véranda" },
  { id: "ws-toit", src: "/maps/toit.jpg", name: "Toit" },
  { id: "ws-salon", src: "/maps/rooms/salon.jpg", name: "Salon" },
  { id: "ws-cuisine", src: "/maps/rooms/cuisine.jpg", name: "Cuisine" },
  { id: "ws-bibliotheque", src: "/maps/rooms/bibliotheque.jpg", name: "Bibliothèque" },
  { id: "ws-chambre-stella", src: "/maps/rooms/chambre-stella.jpg", name: "Chambre Stella" },
  { id: "ws-chambre-antoine", src: "/maps/rooms/chambre-antoine.jpg", name: "Chambre Antoine" },
  { id: "ws-chambre-scellee", src: "/maps/rooms/chambre-scellee.jpg", name: "Chambre scellée" },
  { id: "ws-grenier", src: "/maps/rooms/grenier.jpg", name: "Grenier" },
];

export function collectPlanPhotos(rooms: Room[], fixtures: MapFixture[]): MapPhoto[] {
  const seen = new Set<string>();
  const out: MapPhoto[] = [];
  function add(list?: MapPhoto[]) {
    for (const photo of list ?? []) {
      const key = photo.src;
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(photo);
    }
  }
  for (const room of rooms) add(room.photos);
  for (const mark of fixtures) add(mark.photos);
  return out;
}

export function readImageFile(file: File): Promise<MapPhoto> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("not-image"));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 960;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("canvas"));
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        const src = canvas.toDataURL("image/jpeg", 0.72);
        resolve({
          id: uid("ph"),
          src,
          name: file.name.replace(/\.[^.]+$/, "").slice(0, 80) || "Photo",
        });
      };
      img.onerror = () => reject(new Error("image"));
      img.src = String(reader.result);
    };
    reader.onerror = () => reject(new Error("file"));
    reader.readAsDataURL(file);
  });
}

export function mergePhotos(current: MapPhoto[] | undefined, extra: MapPhoto[]): MapPhoto[] {
  return sanitizePhotos([...(current ?? []), ...extra]).slice(0, 12);
}
