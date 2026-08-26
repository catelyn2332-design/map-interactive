export type Point = [number, number];

export type PropType = "text" | "choice" | "tags";

export type PropTone = "default" | "sage" | "stone" | "clay" | "ink";

export type PropValue = string | string[];

export interface PropOption {
  id: string;
  label: string;
  tone?: PropTone;
}

export interface PropDef {
  id: string;
  name: string;
  type: PropType;
  options: PropOption[];
  filterable: boolean;
  mapTint: boolean;
}

export interface FloorMeta {
  id: string;
  name: string;
  short: string;
  order: number;
  viewBox: [number, number, number, number];
  blurb: string;
  material: string;
  up?: string;
  down?: string;
}

export interface Travel {
  toFloor: string;
  toRoom?: string;
  label: string;
}

export interface RoomStep {
  id: string;
  label: string;
  done: boolean;
}

export interface MapPhoto {
  id: string;
  src: string;
  name?: string;
}

export interface Room {
  id: string;
  floorId: string;
  name: string;
  label: string;
  poly: Point[];
  connections: string[];
  description: string;
  travel?: Travel[];
  props?: Record<string, PropValue>;
  steps?: RoomStep[];
  photos?: MapPhoto[];
}

export type RoomEdit = Partial<{
  name: string;
  label: string;
  description: string;
  props: Record<string, PropValue>;
  steps: RoomStep[];
  connections: string[];
  travel: Travel[];
  poly: Point[];
  photos: MapPhoto[];
}>;

export interface Character {
  id: string;
  name: string;
  short: string;
  role: string;
}

export interface TokenPos {
  floorId: string;
  roomId: string;
  x?: number;
  y?: number;
}

export type DrawShape = "rect" | "ellipse" | "polygon" | "line";

export type ZoneFill = "sage" | "stone" | "clay" | "ink" | "sky" | "sand";

export type StairStyle = "straight" | "spiral" | "quarter" | "switchback";

export type FixtureKind = "door" | "window" | "stair" | "zone";

export type MapTool = "select" | "draw" | "zone" | "door" | "window" | "stair" | "token";

export interface MapFixture {
  id: string;
  floorId: string;
  kind: FixtureKind;
  x: number;
  y: number;
  rotation: number;
  length: number;
  width?: number;
  style?: StairStyle;
  label?: string;
  description?: string;
  toFloor?: string;
  poly?: Point[];
  fill?: ZoneFill;
  color?: string;
  photos?: MapPhoto[];
}

export const ZONE_FILLS: Array<{ id: ZoneFill; label: string; css: string; hex: string }> = [
  { id: "sage", label: "Sauge", css: "var(--color-primary)", hex: "#6a7a58" },
  { id: "stone", label: "Pierre", css: "var(--color-stone)", hex: "#8a8476" },
  { id: "clay", label: "Terre", css: "var(--color-clay)", hex: "#b45a45" },
  { id: "ink", label: "Encre", css: "var(--color-ink)", hex: "#2c2a26" },
  { id: "sky", label: "Ciel", css: "var(--color-token-antoine)", hex: "#5b7fa6" },
  { id: "sand", label: "Sable", css: "var(--color-token-stella)", hex: "#c4a36a" },
];

export const STAIR_STYLES: Array<{
  id: StairStyle;
  label: string;
  hint: string;
}> = [
  { id: "straight", label: "Droit", hint: "Volée simple" },
  { id: "spiral", label: "Colimaçon", hint: "Escalier hélicoïdal" },
  { id: "quarter", label: "Quartier tournant", hint: "Deux volées en L" },
  { id: "switchback", label: "Demi-tour", hint: "Deux volées en U" },
];

export function sanitizeHexColor(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  const v = raw.trim();
  if (/^#([0-9a-f]{3})$/i.test(v)) {
    return `#${v[1]}${v[1]}${v[2]}${v[2]}${v[3]}${v[3]}`.toLowerCase();
  }
  if (/^#([0-9a-f]{6})$/i.test(v)) return v.toLowerCase();
  return undefined;
}

export function zoneCss(fill?: ZoneFill | string): string {
  return ZONE_FILLS.find((z) => z.id === fill)?.css ?? "var(--color-primary)";
}

export function zoneHex(fill?: ZoneFill | string): string {
  return ZONE_FILLS.find((z) => z.id === fill)?.hex ?? "#6a7a58";
}

export function zonePaint(f: { fill?: ZoneFill | string; color?: string }): string {
  return sanitizeHexColor(f.color) ?? zoneCss(f.fill);
}

export function sanitizeStairStyle(raw: unknown): StairStyle {
  return raw === "spiral" || raw === "quarter" || raw === "switchback" || raw === "straight"
    ? raw
    : "straight";
}

export function sanitizePhotos(raw: unknown): MapPhoto[] {
  if (!Array.isArray(raw)) return [];
  const out: MapPhoto[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const t = item as Record<string, unknown>;
    const src = typeof t.src === "string" ? t.src.trim() : "";
    if (!src) continue;
    const ok =
      src.startsWith("data:image/") ||
      src.startsWith("/") ||
      src.startsWith("http://") ||
      src.startsWith("https://");
    if (!ok) continue;
    if (src.startsWith("data:") && src.length > 1_200_000) continue;
    const id = typeof t.id === "string" && t.id.trim() ? t.id.trim() : `ph-${out.length + 1}`;
    const name =
      typeof t.name === "string" && t.name.trim() ? t.name.trim().slice(0, 80) : undefined;
    out.push({ id, src, name });
    if (out.length >= 12) break;
  }
  return out;
}
