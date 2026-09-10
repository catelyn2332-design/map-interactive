import { centroid, rect } from "./geometry";
import { GROUPS_PROP_ID, uid } from "./props";
import type {
  Character,
  FloorMeta,
  GroundKind,
  MapFixture,
  MapScene,
  Point,
  PropPrimitive,
  PropValue,
  Room,
  RoomGroup,
  StairStyle,
  TokenPos,
  ZoneFill,
} from "./types";
import {
  GROUP_COLORS,
  DEFAULT_WALL_WIDTH,
  GROUND_KINDS,
  sanitizeHexColor,
  sanitizePhotos,
  sanitizeStairStyle,
  sanitizeGroundKind,
  ZONE_FILLS,
  clampWallWidth,
} from "./types";

export const SANDBOX_VIEW: [number, number, number, number] = [0, 0, 1600, 1000];

const KNOWN_FLOORS: Record<string, { name: string; short: string; order: number }> = {
  parcelle: { name: "Parcelle", short: "P", order: 0 },
  cave: { name: "Cave", short: "C", order: 1 },
  rdc: { name: "Rez-de-chaussée", short: "0", order: 2 },
  etage: { name: "Étage", short: "1", order: 3 },
  combles: { name: "Combles", short: "2", order: 4 },
  toit: { name: "Toit", short: "T", order: 5 },
};

function floorFromId(id: string, order = 0): FloorMeta {
  const known = KNOWN_FLOORS[id];
  return {
    id,
    name: known?.name ?? id,
    short: known?.short ?? id.slice(0, 8),
    order: known?.order ?? order,
    viewBox: [...SANDBOX_VIEW],
    blurb: "",
    material: "",
  };
}

/** Grille de secours quand une pièce n’a pas de polygone (catalogue house.json). */
function fallbackPoly(index: number): Point[] {
  const cols = 4;
  const w = 220;
  const h = 160;
  const gap = 28;
  const col = index % cols;
  const row = Math.floor(index / cols);
  return rect(80 + col * (w + gap), 80 + row * (h + gap), w, h);
}

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
    groupIds: partial.groupIds ?? [],
    file: partial.file,
  };
}

export function livesOnFloor(
  item: { floorId: string; travel?: { toFloor: string }[] },
  floorId: string,
) {
  return item.floorId === floorId || Boolean(item.travel?.some((t) => t.toFloor === floorId));
}

export function roomsOnFloor(rooms: Room[], floorId: string) {
  return rooms.filter((room) => livesOnFloor(room, floorId));
}

export function groupIdsOf(room: Pick<Room, "groupIds" | "props">): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const add = (id: unknown) => {
    if (typeof id !== "string") return;
    const t = id.trim();
    if (!t || seen.has(t)) return;
    seen.add(t);
    out.push(t);
  };
  for (const id of room.groupIds ?? []) add(id);
  const raw = room.props?.[GROUPS_PROP_ID];
  if (Array.isArray(raw)) {
    for (const id of raw) add(id);
  } else {
    add(raw);
  }
  return out;
}

export function applyRoomGroups(room: Room, ids: string[]): Room {
  const unique: string[] = [];
  const seen = new Set<string>();
  for (const id of ids) {
    const t = typeof id === "string" ? id.trim() : "";
    if (!t || seen.has(t)) continue;
    seen.add(t);
    unique.push(t);
  }
  const props = { ...(room.props ?? {}) };
  if (unique.length) props[GROUPS_PROP_ID] = unique;
  else delete props[GROUPS_PROP_ID];
  return { ...room, groupIds: unique, props };
}

export function roomsInGroup(rooms: Room[], groupId: string) {
  return rooms.filter((room) => groupIdsOf(room).includes(groupId));
}

export function sanitizeGroup(raw: unknown, index = 0): RoomGroup | null {
  if (!raw || typeof raw !== "object") return null;
  const t = raw as Record<string, unknown>;
  const id = typeof t.id === "string" ? t.id.trim() : "";
  if (!id) return null;
  const name =
    typeof t.name === "string" && t.name.trim()
      ? t.name.trim().slice(0, 80)
      : "Groupe";
  const color =
    sanitizeHexColor(t.color) ?? GROUP_COLORS[index % GROUP_COLORS.length]!;
  const wallWidth =
    t.wallWidth !== undefined && t.wallWidth !== null
      ? clampWallWidth(t.wallWidth)
      : undefined;
  return wallWidth && wallWidth !== DEFAULT_WALL_WIDTH
    ? { id, name, color, wallWidth }
    : { id, name, color };
}

export function sanitizeGroups(raw: unknown): RoomGroup[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: RoomGroup[] = [];
  for (const item of raw) {
    const group = sanitizeGroup(item, out.length);
    if (!group || seen.has(group.id)) continue;
    seen.add(group.id);
    out.push(group);
  }
  return out;
}

export function floorById(floors: FloorMeta[], id: string) {
  return floors.find((floor) => floor.id === id);
}

export function roomById(rooms: Room[], id: string) {
  return rooms.find((room) => room.id === id);
}

export function linkFloors(floors: FloorMeta[]): FloorMeta[] {
  return floors.map((floor, i) => ({
    ...floor,
    order: i,
    down: floors[i - 1]?.id,
    up: floors[i + 1]?.id,
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
  if (typeof raw === "string") {
    const id = raw.trim();
    return id ? floorFromId(id) : null;
  }
  if (!raw || typeof raw !== "object") return null;
  const t = raw as Record<string, unknown>;
  const id = typeof t.id === "string" ? t.id.trim() : "";
  if (!id) return null;
  const known = KNOWN_FLOORS[id];
  const vb = Array.isArray(t.viewBox) ? t.viewBox.map(Number) : SANDBOX_VIEW;
  const viewBox: [number, number, number, number] =
    vb.length === 4 && vb.every((n) => Number.isFinite(n))
      ? [vb[0]!, vb[1]!, vb[2]!, vb[3]!]
      : [...SANDBOX_VIEW];
  const order =
    typeof t.order === "number" && Number.isFinite(t.order)
      ? t.order
      : (known?.order ?? 0);
  return {
    id,
    name:
      typeof t.name === "string" && t.name.trim()
        ? t.name.trim()
        : (known?.name ?? id),
    short:
      typeof t.short === "string" && t.short.trim()
        ? t.short.trim()
        : (known?.short ?? id.slice(0, 8)),
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

function sanitizeRoomFile(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  const t = raw.trim().replace(/\\/g, "/").replace(/^\/+/, "");
  if (!t || t.includes("..") || t.length > 220) return undefined;
  return t;
}

function sanitizeTravel(raw: unknown): Room["travel"] {
  if (!Array.isArray(raw)) return undefined;
  const out: NonNullable<Room["travel"]> = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const t = item as Record<string, unknown>;
    const toFloor = typeof t.toFloor === "string" ? t.toFloor.trim() : "";
    if (!toFloor) continue;
    const label = typeof t.label === "string" && t.label.trim() ? t.label.trim() : toFloor;
    out.push({
      toFloor,
      label,
      toRoom: typeof t.toRoom === "string" ? t.toRoom : undefined,
    });
  }
  return out.length ? out : undefined;
}

export function sanitizeRoom(raw: unknown, fallbackIndex = 0): Room | null {
  if (!raw || typeof raw !== "object") return null;
  const t = raw as Record<string, unknown>;
  const id = typeof t.id === "string" ? t.id.trim() : "";
  const floorId = typeof t.floorId === "string" ? t.floorId.trim() : "";
  if (!id || !floorId) return null;
  const poly = sanitizePoly(t.poly) ?? fallbackPoly(fallbackIndex);
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
  const groupIds = Array.isArray(t.groupIds)
    ? t.groupIds.filter((c): c is string => typeof c === "string" && c.trim().length > 0)
    : [];
  return applyRoomGroups(
    {
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
      groupIds,
      file: sanitizeRoomFile(t.file),
    },
    groupIdsOf({ groupIds, props }),
  );
}

export function sanitizeRooms(raw: unknown, floors: FloorMeta[]): Room[] {
  if (!Array.isArray(raw)) return [];
  const floorIds = new Set(floors.map((f) => f.id));
  const seen = new Set<string>();
  const out: Room[] = [];
  const perFloor = new Map<string, number>();
  for (const item of raw) {
    const floorHint =
      item && typeof item === "object" && typeof (item as { floorId?: unknown }).floorId === "string"
        ? (item as { floorId: string }).floorId.trim()
        : "";
    const index = perFloor.get(floorHint) ?? 0;
    if (floorHint) perFloor.set(floorHint, index + 1);
    const room = sanitizeRoom(item, index);
    if (!room || seen.has(room.id) || !floorIds.has(room.floorId)) continue;
    seen.add(room.id);
    out.push(room);
  }
  return out.map((room) => ({
    ...room,
    connections: room.connections.filter((id) => seen.has(id) && id !== room.id),
  }));
}

const FIXTURE_KINDS = new Set(["door", "window", "stair", "zone", "ground"]);
const FILL_IDS = new Set(ZONE_FILLS.map((z) => z.id));
const GROUND_IDS = new Set(GROUND_KINDS.map((g) => g.id));

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
  if (kind === "zone" || kind === "ground") {
    const poly = sanitizePoly(t.poly);
    if (!poly) return null;
    const [cx, cy] = centroid(poly);
    const x = Number(t.x);
    const y = Number(t.y);
    if (kind === "ground") {
      return {
        id,
        floorId,
        kind: "ground",
        x: Number.isFinite(x) ? x : cx,
        y: Number.isFinite(y) ? y : cy,
        rotation: 0,
        length: 48,
        poly,
        ground: sanitizeGroundKind(t.ground),
      };
    }
    const ground = GROUND_IDS.has(t.ground as GroundKind)
      ? (t.ground as GroundKind)
      : undefined;
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
      ground,
      photos: photos.length ? photos : undefined,
      props: (() => {
        const bag = sanitizePropMap(t.props);
        return Object.keys(bag).length ? bag : undefined;
      })(),
      travel: sanitizeTravel(t.travel),
    };
  }
  const x = Number(t.x);
  const y = Number(t.y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  const rotation = Number(t.rotation);
  const length = Number(t.length);
  const widthRaw = Number(t.width);
  const kindMark = kind as Exclude<MapFixture["kind"], "zone" | "ground">;
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
      (kindMark === "stair" || kindMark === "door") && Number.isFinite(widthRaw)
        ? Math.max(16, widthRaw)
        : undefined,
    style,
    label,
    description,
    toFloor: typeof t.toFloor === "string" && t.toFloor ? t.toFloor : undefined,
    photos: photos.length ? photos : undefined,
    flip: t.flip === true,
    hinge: t.hinge === "right" ? "right" : t.hinge === "left" ? "left" : undefined,
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

export function sanitizeScenes(raw: unknown): MapScene[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: MapScene[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const t = item as Record<string, unknown>;
    const id = typeof t.id === "string" ? t.id.trim() : "";
    if (!id || seen.has(id)) continue;
    const name =
      typeof t.name === "string" && t.name.trim()
        ? t.name.trim().slice(0, 60)
        : "Scène";
    const filters: Record<string, string> = {};
    if (t.filters && typeof t.filters === "object" && !Array.isArray(t.filters)) {
      for (const [k, v] of Object.entries(t.filters as Record<string, unknown>)) {
        if (!k.trim() || typeof v !== "string") continue;
        filters[k] = v;
      }
    }
    const query = typeof t.query === "string" ? t.query.slice(0, 120) : "";
    seen.add(id);
    out.push({ id, name, filters, query });
    if (out.length >= 16) break;
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
  groups: RoomGroup[];
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
    groups: [],
  };
}

export function isFactoryWorld(
  floors: FloorMeta[],
  rooms: Room[],
  fixtures: MapFixture[] = [],
  characters: Character[] = [],
  groups: RoomGroup[] = [],
) {
  return (
    characters.length === 0 &&
    groups.length === 0 &&
    worldsEqual(
      {
        floors,
        rooms,
        fixtures,
        characters: [],
        tokens: {},
        groups: [],
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

/**
 * Ancienne maison Bellarosa « usine » (IDs rdc / salon / chambre-stella…).
 * Ne jamais la juger « vide » : ces IDs sont aussi ceux d’une carte joueur.
 * Une carte avec des pièces (même sans texte) n’est plus considérée intacte.
 */
export function isUntouchedLegacyFactory(floors: FloorMeta[], rooms: Room[]) {
  if (!isLegacyFactoryWorld(floors, rooms)) return false;
  if (rooms.length > 0) return false;
  const extraFloors = floors.some((f) => !LEGACY_FLOOR_IDS.has(f.id));
  return !extraFloors;
}

export function scrubLegacyWorld(
  floors: FloorMeta[],
  rooms: Room[],
  fixtures: MapFixture[] = [],
  characters: Character[] = [],
  tokens: Record<string, TokenPos> = {},
  groups: RoomGroup[] = [],
): WorldState {
  // Ne plus remplacer une carte (même aux IDs historiques) par l’usine vide.
  // L’ancienne heuristique `isLegacyFactoryWorld` détruisait le travail joueur
  // à chaque hydratation dès que 2 étages / 3 pièces gardaient les IDs Bellarosa.
  return { floors, rooms, fixtures, characters, tokens, groups };
}
