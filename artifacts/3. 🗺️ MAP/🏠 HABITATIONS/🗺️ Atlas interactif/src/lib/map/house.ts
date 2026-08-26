import { centroid, rect } from "./geometry";
import { uid } from "./props";
import type {
  Character,
  FloorMeta,
  MapFixture,
  Point,
  PropPrimitive,
  PropValue,
  Room,
  StairStyle,
  TokenPos,
  ZoneFill,
} from "./types";
import {
  sanitizeHexColor,
  sanitizePhotos,
  sanitizeStairStyle,
  ZONE_FILLS,
} from "./types";

export const SANDBOX_VIEW: [number, number, number, number] = [0, 0, 1600, 1000];

/** Empty on purpose — pions are created by the user. */
export const CHARACTERS: Character[] = [];

export function factoryCharacters(): Character[] {
  return [];
}

export function factoryFloors(): FloorMeta[] {
  return [
    {
      id: "etage-1",
      name: "Étage 1",
      short: "1",
      order: 0,
      viewBox: [...SANDBOX_VIEW],
      blurb: "",
      material: "",
    },
  ];
}

export function factoryRooms(): Room[] {
  return [];
}

export function factoryFixtures(): MapFixture[] {
  return [];
}

export function emptyRoom(partial: Partial<Room> & { floorId: string }): Room {
  const n = partial.name ?? "Pièce";
  return {
    id: partial.id ?? uid("room"),
    floorId: partial.floorId,
    name: n,
    label: partial.label ?? n,
    poly: partial.poly ?? rect(200, 200, 360, 240),
    connections: partial.connections ?? [],
    description: partial.description ?? "",
    steps: partial.steps ?? [],
    props: partial.props ?? {},
    propExtras: partial.propExtras ?? {},
    travel: partial.travel,
    photos: partial.photos ?? [],
  };
}

export function roomsOnFloor(rooms: Room[], floorId: string) {
  return rooms.filter((room) => room.floorId === floorId);
}

export function floorById(floors: FloorMeta[], id: string) {
  return floors.find((floor) => floor.id === id);
}

export function roomById(rooms: Room[], id: string) {
  return rooms.find((room) => room.id === id);
}

export function linkFloors(floors: FloorMeta[]): FloorMeta[] {
  const sorted = [...floors].sort((a, b) => a.order - b.order);
  return sorted.map((floor, i) => ({
    ...floor,
    order: i,
    down: sorted[i - 1]?.id,
    up: sorted[i + 1]?.id,
  }));
}

function asPoint(raw: unknown): Point | null {
  if (!Array.isArray(raw) || raw.length < 2) return null;
  const x = Number(raw[0]);
  const y = Number(raw[1]);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  return [x, y];
}

export function sanitizePoly(raw: unknown): Point[] | null {
  if (!Array.isArray(raw) || raw.length < 3) return null;
  const out: Point[] = [];
  for (const item of raw) {
    const p = asPoint(item);
    if (!p) continue;
    out.push(p);
  }
  return out.length >= 3 ? out : null;
}

export function sanitizeFloor(raw: unknown): FloorMeta | null {
  if (!raw || typeof raw !== "object") return null;
  const t = raw as Record<string, unknown>;
  const id = typeof t.id === "string" ? t.id.trim() : "";
  if (!id) return null;
  const vb = Array.isArray(t.viewBox) ? t.viewBox.map(Number) : SANDBOX_VIEW;
  const viewBox: [number, number, number, number] =
    vb.length === 4 && vb.every((n) => Number.isFinite(n))
      ? [vb[0]!, vb[1]!, vb[2]!, vb[3]!]
      : [...SANDBOX_VIEW];
  const order = typeof t.order === "number" && Number.isFinite(t.order) ? t.order : 0;
  return {
    id,
    name: typeof t.name === "string" && t.name.trim() ? t.name.trim() : id,
    short: typeof t.short === "string" && t.short.trim() ? t.short.trim() : id.slice(0, 8),
    order,
    viewBox,
    blurb: typeof t.blurb === "string" ? t.blurb : "",
    material: typeof t.material === "string" ? t.material : "",
    up: typeof t.up === "string" ? t.up : undefined,
    down: typeof t.down === "string" ? t.down : undefined,
  };
}

export function sanitizeFloors(raw: unknown): FloorMeta[] {
  if (!Array.isArray(raw)) return factoryFloors();
  const seen = new Set<string>();
  const out: FloorMeta[] = [];
  for (const item of raw) {
    const floor = sanitizeFloor(item);
    if (!floor || seen.has(floor.id)) continue;
    seen.add(floor.id);
    out.push(floor);
  }
  if (out.length === 0) return factoryFloors();
  return linkFloors(out);
}

function asPropValue(raw: unknown): PropValue | undefined {
  if (typeof raw === "string") return raw;
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw === "boolean") return raw;
  if (Array.isArray(raw)) {
    return raw.filter((x): x is string => typeof x === "string");
  }
  return undefined;
}

function asPrimitive(raw: unknown): PropPrimitive | undefined {
  if (typeof raw === "string") return raw;
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw === "boolean") return raw;
  return undefined;
}

export function sanitizePropMap(raw: unknown): Record<string, PropValue> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: Record<string, PropValue> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!key.trim()) continue;
    const v = asPropValue(value);
    if (v !== undefined) out[key] = v;
  }
  return out;
}

export function sanitizePropExtras(
  raw: unknown,
): Record<string, Record<string, PropPrimitive>> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: Record<string, Record<string, PropPrimitive>> = {};
  for (const [propId, bag] of Object.entries(raw as Record<string, unknown>)) {
    if (!propId.trim() || !bag || typeof bag !== "object" || Array.isArray(bag)) {
      continue;
    }
    const inner: Record<string, PropPrimitive> = {};
    for (const [varId, value] of Object.entries(bag as Record<string, unknown>)) {
      const v = asPrimitive(value);
      if (v !== undefined) inner[varId] = v;
    }
    if (Object.keys(inner).length) out[propId] = inner;
  }
  return out;
}

function sanitizeTravel(raw: unknown): Room["travel"] {
  if (!Array.isArray(raw)) return undefined;
  const out: NonNullable<Room["travel"]> = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const t = item as Record<string, unknown>;
    const toFloor = typeof t.toFloor === "string" ? t.toFloor : "";
    const label = typeof t.label === "string" ? t.label : "";
    if (!toFloor || !label) continue;
    out.push({
      toFloor,
      label,
      toRoom: typeof t.toRoom === "string" ? t.toRoom : undefined,
    });
  }
  return out.length ? out : undefined;
}

export function sanitizeRoom(raw: unknown): Room | null {
  if (!raw || typeof raw !== "object") return null;
  const t = raw as Record<string, unknown>;
  const id = typeof t.id === "string" ? t.id.trim() : "";
  const floorId = typeof t.floorId === "string" ? t.floorId.trim() : "";
  const poly = sanitizePoly(t.poly);
  if (!id || !floorId || !poly) return null;
  const name = typeof t.name === "string" && t.name.trim() ? t.name.trim() : "Pièce";
  const connections = Array.isArray(t.connections)
    ? t.connections.filter((c): c is string => typeof c === "string" && c.trim().length > 0)
    : [];
  const props = sanitizePropMap(t.props);
  const propExtras = sanitizePropExtras(t.propExtras);
  const steps = Array.isArray(t.steps)
    ? t.steps
        .map((item, i) => {
          if (!item || typeof item !== "object") return null;
          const s = item as Record<string, unknown>;
          const label = typeof s.label === "string" ? s.label : "";
          const sid = typeof s.id === "string" && s.id.trim() ? s.id.trim() : `step-${i + 1}`;
          return { id: sid, label, done: s.done === true };
        })
        .filter((s): s is NonNullable<typeof s> => Boolean(s))
    : [];
  const photos = sanitizePhotos(t.photos);
  return {
    id,
    floorId,
    name,
    label: typeof t.label === "string" && t.label.trim() ? t.label.trim() : name,
    poly,
    connections,
    description: typeof t.description === "string" ? t.description : "",
    steps,
    props,
    propExtras: Object.keys(propExtras).length ? propExtras : undefined,
    travel: sanitizeTravel(t.travel),
    photos: photos.length ? photos : undefined,
  };
}

export function sanitizeRooms(raw: unknown, floors: FloorMeta[]): Room[] {
  if (!Array.isArray(raw)) return [];
  const floorIds = new Set(floors.map((f) => f.id));
  const seen = new Set<string>();
  const out: Room[] = [];
  for (const item of raw) {
    const room = sanitizeRoom(item);
    if (!room || seen.has(room.id) || !floorIds.has(room.floorId)) continue;
    seen.add(room.id);
    out.push(room);
  }
  return out.map((room) => ({
    ...room,
    connections: room.connections.filter((id) => seen.has(id) && id !== room.id),
  }));
}

const FIXTURE_KINDS = new Set(["door", "window", "stair", "zone"]);
const FILL_IDS = new Set(ZONE_FILLS.map((z) => z.id));

function sanitizeFill(raw: unknown): ZoneFill {
  return typeof raw === "string" && FILL_IDS.has(raw as ZoneFill)
    ? (raw as ZoneFill)
    : "sage";
}

export function sanitizeFixture(raw: unknown): MapFixture | null {
  if (!raw || typeof raw !== "object") return null;
  const t = raw as Record<string, unknown>;
  const id = typeof t.id === "string" ? t.id.trim() : "";
  const floorId = typeof t.floorId === "string" ? t.floorId.trim() : "";
  const kind = typeof t.kind === "string" ? t.kind : "";
  if (!id || !floorId || !FIXTURE_KINDS.has(kind)) return null;
  const label = typeof t.label === "string" && t.label.trim() ? t.label.trim() : undefined;
  const description =
    typeof t.description === "string" ? t.description : undefined;
  const photos = sanitizePhotos(t.photos);
  const color = sanitizeHexColor(t.color);
  if (kind === "zone") {
    const poly = sanitizePoly(t.poly);
    if (!poly) return null;
    const [cx, cy] = centroid(poly);
    const x = Number(t.x);
    const y = Number(t.y);
    return {
      id,
      floorId,
      kind: "zone",
      x: Number.isFinite(x) ? x : cx,
      y: Number.isFinite(y) ? y : cy,
      rotation: 0,
      length: 48,
      label,
      description,
      poly,
      fill: sanitizeFill(t.fill),
      color,
      photos: photos.length ? photos : undefined,
    };
  }
  const x = Number(t.x);
  const y = Number(t.y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  const rotation = Number(t.rotation);
  const length = Number(t.length);
  const widthRaw = Number(t.width);
  const kindMark = kind as Exclude<MapFixture["kind"], "zone">;
  const style: StairStyle | undefined =
    kindMark === "stair" ? sanitizeStairStyle(t.style) : undefined;
  return {
    id,
    floorId,
    kind: kindMark,
    x,
    y,
    rotation: Number.isFinite(rotation) ? rotation : 0,
    length: Number.isFinite(length) ? Math.max(24, length) : 72,
    width:
      kindMark === "stair" && Number.isFinite(widthRaw)
        ? Math.max(16, widthRaw)
        : undefined,
    style,
    label,
    description,
    toFloor: typeof t.toFloor === "string" && t.toFloor ? t.toFloor : undefined,
    photos: photos.length ? photos : undefined,
  };
}

export function sanitizeFixtures(raw: unknown, floors: FloorMeta[]): MapFixture[] {
  if (!Array.isArray(raw)) return [];
  const floorIds = new Set(floors.map((f) => f.id));
  const seen = new Set<string>();
  const out: MapFixture[] = [];
  for (const item of raw) {
    const mark = sanitizeFixture(item);
    if (!mark || seen.has(mark.id) || !floorIds.has(mark.floorId)) continue;
    if (mark.toFloor && !floorIds.has(mark.toFloor)) mark.toFloor = undefined;
    seen.add(mark.id);
    out.push(mark);
  }
  return out;
}

export function sanitizeCharacter(raw: unknown): Character | null {
  if (!raw || typeof raw !== "object") return null;
  const t = raw as Record<string, unknown>;
  const id = typeof t.id === "string" ? t.id.trim() : "";
  if (!id) return null;
  const name =
    typeof t.name === "string" && t.name.trim() ? t.name.trim().slice(0, 80) : "Pion";
  const short =
    typeof t.short === "string" && t.short.trim()
      ? t.short.trim().slice(0, 3)
      : name.slice(0, 1).toUpperCase();
  const color = sanitizeHexColor(t.color);
  return {
    id,
    name,
    short,
    role: typeof t.role === "string" ? t.role.slice(0, 80) : "",
    color,
  };
}

export function sanitizeCharacters(raw: unknown): Character[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: Character[] = [];
  for (const item of raw) {
    const c = sanitizeCharacter(item);
    if (!c || seen.has(c.id)) continue;
    seen.add(c.id);
    out.push(c);
  }
  return out;
}

function sanitizeOneToken(
  raw: unknown,
  roomIds: Set<string>,
  floorIds: Set<string>,
  fallbackFloor: string,
): TokenPos {
  const p = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const roomId = typeof p.roomId === "string" && roomIds.has(p.roomId) ? p.roomId : "";
  const floorId =
    typeof p.floorId === "string" && floorIds.has(p.floorId) ? p.floorId : fallbackFloor;
  const x = Number(p.x);
  const y = Number(p.y);
  const next: TokenPos = { floorId, roomId };
  if (Number.isFinite(x) && Number.isFinite(y)) {
    next.x = x;
    next.y = y;
  }
  return next;
}

export function sanitizeTokenMap(
  raw: unknown,
  rooms: Room[],
  floors: FloorMeta[],
  characters: Character[],
  extraIds: string[] = [],
): Record<string, TokenPos> {
  const roomIds = new Set(rooms.map((r) => r.id));
  const floorIds = new Set(floors.map((f) => f.id));
  const fallbackFloor = floors[0]?.id ?? "etage-1";
  const out: Record<string, TokenPos> = {};
  const rec = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const ids = new Set<string>();
  for (const who of characters) ids.add(who.id);
  for (const id of extraIds) if (id) ids.add(id);
  for (const key of Object.keys(rec)) ids.add(key);
  for (const who of ids) {
    out[who] = sanitizeOneToken(rec[who], roomIds, floorIds, fallbackFloor);
  }
  return out;
}

export type WorldState = {
  floors: FloorMeta[];
  rooms: Room[];
  fixtures: MapFixture[];
  characters: Character[];
  tokens: Record<string, TokenPos>;
};

export function worldsEqual(a: WorldState, b: WorldState) {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function factoryWorld(): WorldState {
  return {
    floors: factoryFloors(),
    rooms: factoryRooms(),
    fixtures: factoryFixtures(),
    characters: factoryCharacters(),
    tokens: {},
  };
}

export function isFactoryWorld(
  floors: FloorMeta[],
  rooms: Room[],
  fixtures: MapFixture[] = [],
  characters: Character[] = [],
) {
  return (
    characters.length === 0 &&
    worldsEqual(
      {
        floors,
        rooms,
        fixtures,
        characters: [],
        tokens: {},
      },
      factoryWorld(),
    )
  );
}

const LEGACY_FLOOR_IDS = new Set([
  "parcelle",
  "cave",
  "rdc",
  "etage",
  "combles",
  "toit",
]);

const LEGACY_ROOM_IDS = new Set([
  "salon",
  "cuisine",
  "chambre-stella",
  "chambre-antoine",
  "vue-mer",
  "porche",
  "veranda",
  "bibliotheque",
  "grenier",
]);

export function isLegacyFactoryWorld(floors: FloorMeta[], rooms: Room[]) {
  const ids = new Set(floors.map((f) => f.id));
  const floorHits = [...LEGACY_FLOOR_IDS].filter((id) => ids.has(id)).length;
  const roomHits = rooms.filter((r) => LEGACY_ROOM_IDS.has(r.id)).length;
  return floorHits >= 2 || roomHits >= 3;
}

export function scrubLegacyWorld(
  floors: FloorMeta[],
  rooms: Room[],
  fixtures: MapFixture[] = [],
  characters: Character[] = [],
  tokens: Record<string, TokenPos> = {},
): WorldState {
  if (isLegacyFactoryWorld(floors, rooms)) return factoryWorld();
  return { floors, rooms, fixtures, characters, tokens };
}
