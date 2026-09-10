export type Point = [number, number];

export type PropType =
  | "text"
  | "longtext"
  | "number"
  | "toggle"
  | "choice"
  | "preset"
  | "tags"
  | "keyword"
  | "path"
  | "color"
  | "token";

export type PropActionId =
  | "tint"
  | "filter"
  | "dim"
  | "badge"
  | "hide"
  | "outline"
  | "hatch"
  | "glow"
  | "lock"
  | "block"
  | "reveal"
  | "open-path"
  | "bind-file"
  | "sync-in"
  | "sync-out";

export type PropRuleOp =
  | "set"
  | "empty"
  | "eq"
  | "neq"
  | "contains"
  | "truthy"
  | "falsy";

export interface PropRule {
  id: string;
  op: PropRuleOp;
  value?: string;
  action: PropActionId;
}

export type PropVarKind = "text" | "number" | "color" | "toggle";

export type PropIconId =
  | "tags"
  | "type"
  | "align-left"
  | "hash"
  | "toggle"
  | "choice"
  | "palette"
  | "users"
  | "lock"
  | "sun"
  | "flame"
  | "shield"
  | "key"
  | "star"
  | "map-pin"
  | "heart"
  | "eye"
  | "clock"
  | "flag"
  | "home"
  | "book"
  | "thermometer"
  | "volume"
  | "door"
  | "folder"
  | "link";

export type PropTone = "default" | "sage" | "stone" | "clay" | "ink";

export type PropPrimitive = string | number | boolean;

export type PropValue = PropPrimitive | string[];

export interface PropVar {
  id: string;
  name: string;
  kind: PropVarKind;
}

export interface PropOption {
  id: string;
  label: string;
  tone?: PropTone;
  vars?: Record<string, PropPrimitive>;
}

export interface PropDef {
  id: string;
  name: string;
  type: PropType;
  icon?: PropIconId;
  options: PropOption[];
  vars: PropVar[];
  filterable: boolean;
  mapTint: boolean;
  multi?: boolean;
  actions?: PropActionId[];
  rules?: PropRule[];
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

export interface RoomGroup {
  id: string;
  name: string;
  color: string;
  /** Stroke width of member rooms. Resizing a selected group changes this, not the polygons. */
  wallWidth?: number;
}

export const GROUP_COLORS = [
  "#6a7a58",
  "#c45c4a",
  "#4a6fa5",
  "#b5812f",
  "#6b4c7a",
  "#2f6f6a",
  "#8a8476",
  "#b45a45",
] as const;

/** 100 unités du plan = 1 mètre. */
export const PLAN_UNITS_PER_METER = 100;

export const DEFAULT_WALL_WIDTH = 3.2;
export const MIN_WALL_WIDTH = 3.2;
export const MAX_WALL_WIDTH = 28;

export function clampWallWidth(raw: unknown, fallback = DEFAULT_WALL_WIDTH): number {
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(MAX_WALL_WIDTH, Math.max(MIN_WALL_WIDTH, n));
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
  propExtras?: Record<string, Record<string, PropPrimitive>>;
  steps?: RoomStep[];
  photos?: MapPhoto[];
  groupIds?: string[];
  /** Chemin du fichier lié dans le workspace (notes de la pièce). */
  file?: string;
}

export type RoomEdit = Partial<{
  name: string;
  label: string;
  description: string;
  props: Record<string, PropValue>;
  propExtras: Record<string, Record<string, PropPrimitive>>;
  steps: RoomStep[];
  connections: string[];
  travel: Travel[];
  poly: Point[];
  photos: MapPhoto[];
  groupIds: string[];
  file: string;
}>;

export interface Character {
  id: string;
  name: string;
  short: string;
  role: string;
  color?: string;
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

export type GroundKind =
  | "meadow"
  | "forest"
  | "sea"
  | "sand"
  | "snow"
  | "rock"
  | "marsh"
  | "path"
  | "garden";

export type FixtureKind = "door" | "window" | "stair" | "zone" | "ground";

export type MapTool =
  | "select"
  | "draw"
  | "zone"
  | "ground"
  | "door"
  | "window"
  | "stair"
  | "token";

export interface MapScene {
  id: string;
  name: string;
  filters: Record<string, string>;
  query: string;
}

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
  ground?: GroundKind;
  photos?: MapPhoto[];
  flip?: boolean;
  hinge?: "left" | "right";
  props?: Record<string, PropValue>;
  travel?: Travel[];
}

export const ZONE_FILLS: Array<{ id: ZoneFill; label: string; css: string; hex: string }> = [
  { id: "sage", label: "Sauge", css: "var(--color-primary)", hex: "#6a7a58" },
  { id: "stone", label: "Pierre", css: "var(--color-stone)", hex: "#8a8476" },
  { id: "clay", label: "Terre", css: "var(--color-clay)", hex: "#b45a45" },
  { id: "ink", label: "Encre", css: "var(--color-ink)", hex: "#2c2a26" },
  { id: "sky", label: "Ciel", css: "var(--color-token-antoine)", hex: "#5b7fa6" },
  { id: "sand", label: "Sable", css: "var(--color-token-stella)", hex: "#c4a36a" },
];

export const GROUND_KINDS: Array<{
  id: GroundKind;
  label: string;
  hex: string;
  ink: string;
}> = [
  { id: "meadow", label: "Prairie", hex: "#8eab6c", ink: "#3f5344" },
  { id: "forest", label: "Forêt", hex: "#3f5d3a", ink: "#1f2a1c" },
  { id: "sea", label: "Mer", hex: "#5b7fa6", ink: "#2a4058" },
  { id: "sand", label: "Sable", hex: "#c4a36a", ink: "#6b5340" },
  { id: "snow", label: "Neige", hex: "#e8e4dc", ink: "#6b6458" },
  { id: "rock", label: "Roche", hex: "#8a8476", ink: "#3a3832" },
  { id: "marsh", label: "Marais", hex: "#5a7a6a", ink: "#243830" },
  { id: "path", label: "Chemin", hex: "#a07a4a", ink: "#4a3420" },
  { id: "garden", label: "Jardin", hex: "#6a7a58", ink: "#2c3a28" },
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

export function sanitizeGroundKind(raw: unknown): GroundKind {
  return GROUND_KINDS.some((g) => g.id === raw) ? (raw as GroundKind) : "meadow";
}

export function groundMeta(kind?: GroundKind | string) {
  return GROUND_KINDS.find((g) => g.id === kind) ?? GROUND_KINDS[0]!;
}

export function groundPatternId(kind?: GroundKind | string): string {
  return `atlas-ground-${groundMeta(kind).id}`;
}

export type GroundPalette = Record<GroundKind, string>;

export const MIN_GROUND_BRUSH = 16;
export const MAX_GROUND_BRUSH = 96;
export const DEFAULT_GROUND_BRUSH = 42;

export function clampGroundBrush(raw: unknown, fallback = DEFAULT_GROUND_BRUSH): number {
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(MAX_GROUND_BRUSH, Math.max(MIN_GROUND_BRUSH, Math.round(n)));
}

export function defaultGroundPalette(): GroundPalette {
  const out = {} as GroundPalette;
  for (const g of GROUND_KINDS) out[g.id] = g.hex;
  return out;
}

export function sanitizeGroundPalette(raw: unknown): GroundPalette {
  const base = defaultGroundPalette();
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return base;
  const t = raw as Record<string, unknown>;
  for (const g of GROUND_KINDS) {
    const hex = sanitizeHexColor(t[g.id]);
    if (hex) base[g.id] = hex;
  }
  return base;
}

function parseRgb(hex: string): [number, number, number] | null {
  const v = sanitizeHexColor(hex);
  if (!v) return null;
  return [parseInt(v.slice(1, 3), 16), parseInt(v.slice(3, 5), 16), parseInt(v.slice(5, 7), 16)];
}

export function mixHex(a: string, b: string, t: number): string {
  const pa = parseRgb(a);
  const pb = parseRgb(b);
  if (!pa) return sanitizeHexColor(b) ?? "#6a7a58";
  if (!pb) return sanitizeHexColor(a) ?? "#6a7a58";
  const k = Math.max(0, Math.min(1, t));
  const ch = (x: number, y: number) => Math.round(x + (y - x) * k);
  return `#${[ch(pa[0], pb[0]), ch(pa[1], pb[1]), ch(pa[2], pb[2])]
    .map((n) => n.toString(16).padStart(2, "0"))
    .join("")}`;
}

export function groundFill(kind?: GroundKind | string, palette?: GroundPalette): string {
  const id = sanitizeGroundKind(kind);
  return palette?.[id] ?? GROUND_KINDS.find((g) => g.id === id)?.hex ?? "#8eab6c";
}

export function groundInk(kind?: GroundKind | string, palette?: GroundPalette): string {
  return mixHex(groundFill(kind, palette), "#1f1c17", 0.42);
}

export function isPolyKind(kind: FixtureKind): kind is "zone" | "ground" {
  return kind === "zone" || kind === "ground";
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
