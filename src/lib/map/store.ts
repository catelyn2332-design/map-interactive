import { create } from "zustand";
import {
  createJSONStorage,
  persist,
  type StateStorage,
} from "zustand/middleware";
import {
  applyPersistedTheme,
  loadPersisted,
  persistTheme,
  sanitizeTheme,
  useThemeStore,
} from "../theme-store";
import { resolveFloor } from "./edits";
import { catalogWorld } from "./catalog";
import { magnetPoly, translatePoly } from "./geometry";
import {
  liftGroundFixtures,
  sanitizeTerrainMap,
  stampStroke,
  type TerrainMap,
} from "./terrain";
import {
  emptyRoom,
  factoryCharacters,
  factoryFloors,
  factoryFixtures,
  factoryRooms,
  groupIdsOf,
  applyRoomGroups,
  isFactoryWorld,
  linkFloors,
  roomById,
  roomsOnFloor,
  sanitizeCharacters,
  sanitizeFixtures,
  sanitizeFloors,
  sanitizeGroups,
  sanitizeRooms,
  sanitizeScenes,
  sanitizeTokenMap,
  scrubLegacyWorld,
} from "./house";
import { putCatalog } from "./idb";
import {
  cloneSchema,
  ensureGroupsProp,
  GROUPS_PROP_ID,
  DIMS_PROP_ID,
  groupsFromOptions,
  isLegacyFactorySchema,
  readProp,
  sanitizeSchema,
  schemasEqual,
  scrubLegacySchema,
  tokenActors,
  uid,
} from "./props";
import { hydrateUi, sanitizeAssist, sanitizeChrome, sanitizeCopy, sanitizeVault, useUiStore } from "./ui";
import { queueRoomNoteSync } from "./vault-files";
import {
  applyCoffreToLocal,
  coffrePayload,
  syncLocalToCoffre,
} from "../progress/sync";
import type {
  Character,
  DrawShape,
  FloorMeta,
  GroundKind,
  MapFixture,
  MapScene,
  MapTool,
  Point,
  PropDef,
  PropPrimitive,
  PropValue,
  Room,
  RoomEdit,
  RoomGroup,
  StairStyle,
  TokenPos,
  ZoneFill,
} from "./types";
import { GROUP_COLORS, clampGroundBrush, DEFAULT_GROUND_BRUSH } from "./types";

const STORAGE_KEY = "atlas-bellarosa-v1";
const SCHEMA_KEY = "atlas-bellarosa-schema";
const WORLD_KEY = "atlas-bellarosa-world";

function defaultTokens(characters: Character[] = []): Record<string, TokenPos> {
  const floorId = factoryFloors()[0]?.id ?? "etage-1";
  const out: Record<string, TokenPos> = {};
  for (const c of characters) out[c.id] = { floorId, roomId: "" };
  return out;
}

let persistReady = false;
let allowFactoryWrite = false;
let manualHydrateDone = false;
let persistWriteTimer: ReturnType<typeof setTimeout> | undefined;
let persistWritePending: { name: string; value: string } | null = null;

const WRITE_WAIT_MS = 48;
let schemaWriteTimer: ReturnType<typeof setTimeout> | undefined;
let schemaWritePending: { schema: PropDef[]; force: boolean } | null = null;
let worldWriteTimer: ReturnType<typeof setTimeout> | undefined;
type WorldExtra = {
  characters?: Character[];
  tokens?: Record<string, TokenPos>;
  groups?: RoomGroup[];
  terrain?: TerrainMap;
  scenes?: MapScene[];
};

let worldWritePending: {
  floors: FloorMeta[];
  rooms: Room[];
  force: boolean;
  fixtures?: MapFixture[];
  extra?: WorldExtra;
} | null = null;

function asGroupIds(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((x): x is string => typeof x === "string" && Boolean(x.trim()));
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return [];
}

function bindRoomFile(id: string, file: string) {
  const s = useAtlas.getState();
  const room = s.rooms.find((r) => r.id === id);
  if (!room || room.file === file) return;
  const rooms = s.rooms.map((r) => (r.id === id ? { ...r, file } : r));
  persistWorld(s.floors, rooms, true);
  useAtlas.setState({ rooms });
}

function syncRoomFile(room: Room) {
  const vault = useUiStore.getState().vault;
  if (!vault.workspace) return;
  queueRoomNoteSync(room, vault.root, vault.syncNotes, vault.createOnRoom, bindRoomFile);
}
let persistPulse = 0;
const persistListeners = new Set<(pulse: number, pending: boolean) => void>();

function emitPersist(pending: boolean) {
  persistPulse += 1;
  const pulse = persistPulse;
  for (const fn of persistListeners) fn(pulse, pending);
}

export function subscribePersistPulse(
  fn: (pulse: number, pending: boolean) => void,
) {
  persistListeners.add(fn);
  return () => {
    persistListeners.delete(fn);
  };
}

function writeJson(key: string, value: unknown) {
  try {
    const raw = JSON.stringify(value);
    localStorage.setItem(key, raw);
    localStorage.setItem(`${key}-backup`, raw);
  } catch {
    /* quota */
  }
}

function readJson(key: string): unknown | null {
  for (const k of [key, `${key}-backup`]) {
    try {
      const raw = localStorage.getItem(k);
      if (!raw) continue;
      return JSON.parse(raw);
    } catch {
      /* try next */
    }
  }
  return null;
}

function commitSchema(schema: PropDef[], force = false) {
  if (typeof window === "undefined") return;
  const next = sanitizeSchema(schema);
  if (!force && schemasEqual(next, cloneSchema())) {
    const existing = loadPersistedSchema();
    if (existing && !schemasEqual(existing, cloneSchema())) return;
  }
  writeJson(SCHEMA_KEY, next);
  putCatalog("schema", next);
}

export function persistSchema(schema: PropDef[], force = false) {
  if (typeof window === "undefined") return;
  schemaWritePending = { schema, force: force || Boolean(schemaWritePending?.force) };
  emitPersist(true);
  if (schemaWriteTimer) clearTimeout(schemaWriteTimer);
  schemaWriteTimer = setTimeout(flushSchemaPersist, WRITE_WAIT_MS);
}

export function flushSchemaPersist() {
  if (schemaWriteTimer) {
    clearTimeout(schemaWriteTimer);
    schemaWriteTimer = undefined;
  }
  const job = schemaWritePending;
  schemaWritePending = null;
  if (!job) return;
  commitSchema(job.schema, job.force);
}

function commitWorld(
  floors: FloorMeta[],
  rooms: Room[],
  force = false,
  fixtures?: MapFixture[],
  extra?: WorldExtra,
) {
  if (typeof window === "undefined") return;
  const nextFloors = sanitizeFloors(floors);
  const nextRooms = sanitizeRooms(rooms, nextFloors);
  const nextFixtures = sanitizeFixtures(
    fixtures ?? liveFixtures(),
    nextFloors,
  );
  const nextCharacters = sanitizeCharacters(
    extra?.characters ?? liveCharacters(),
  );
  const nextTokens = sanitizeTokenMap(
    extra?.tokens ?? liveTokens(),
    nextRooms,
    nextFloors,
    nextCharacters,
  );
  if (
    !force &&
    isFactoryWorld(nextFloors, nextRooms, nextFixtures, nextCharacters)
  ) {
    const existing = loadPersistedWorld();
    if (
      existing &&
      !isFactoryWorld(
        existing.floors,
        existing.rooms,
        existing.fixtures,
        existing.characters,
      )
    )
      return;
  }
  const payload = {
    floors: nextFloors,
    rooms: nextRooms,
    fixtures: nextFixtures,
    characters: nextCharacters,
    tokens: nextTokens,
    groups: extra?.groups ?? liveGroups(),
    terrain: extra?.terrain ?? liveTerrain(),
    scenes: extra?.scenes ?? liveScenes(),
  };
  writeJson(WORLD_KEY, payload);
  putCatalog("world", payload);
}

export function persistWorld(
  floors: FloorMeta[],
  rooms: Room[],
  force = false,
  fixtures?: MapFixture[],
  extra?: WorldExtra,
) {
  if (typeof window === "undefined") return;
  worldWritePending = {
    floors,
    rooms,
    force: force || Boolean(worldWritePending?.force),
    fixtures,
    extra,
  };
  emitPersist(true);
  if (worldWriteTimer) clearTimeout(worldWriteTimer);
  worldWriteTimer = setTimeout(flushWorldPersist, WRITE_WAIT_MS);
}

export function flushWorldPersist() {
  if (worldWriteTimer) {
    clearTimeout(worldWriteTimer);
    worldWriteTimer = undefined;
  }
  const job = worldWritePending;
  worldWritePending = null;
  if (!job) {
    emitPersist(false);
    return;
  }
  commitWorld(job.floors, job.rooms, job.force, job.fixtures, job.extra);
  emitPersist(false);
  try {
    const s = useAtlas.getState();
    const ui = useUiStore.getState();
    syncLocalToCoffre({
      schema: s.schema,
      floors: s.floors,
      rooms: s.rooms,
      fixtures: s.fixtures,
      characters: s.characters,
      tokens: s.tokens,
      groups: s.groups,
      scenes: s.scenes,
      terrain: s.terrain,
      appearance: useThemeStore.getState().theme,
      copy: ui.copy,
      chrome: ui.chrome,
      assist: ui.assist,
      vault: ui.vault,
    });
  } catch {
    /* store pas encore prêt */
  }
}

function liveFixtures(): MapFixture[] {
  try {
    return useAtlas.getState().fixtures ?? [];
  } catch {
    return [];
  }
}

function liveCharacters(): Character[] {
  try {
    return useAtlas.getState().characters ?? [];
  } catch {
    return [];
  }
}

function liveGroups(): RoomGroup[] {
  try {
    return useAtlas.getState().groups ?? [];
  } catch {
    return [];
  }
}

function liveTerrain(): TerrainMap {
  try {
    return useAtlas.getState().terrain ?? {};
  } catch {
    return {};
  }
}

function liveScenes(): MapScene[] {
  try {
    return useAtlas.getState().scenes ?? [];
  } catch {
    return [];
  }
}

function liveTokens(): Record<string, TokenPos> {
  try {
    return useAtlas.getState().tokens ?? {};
  } catch {
    return {};
  }
}

export function loadPersistedSchema(): PropDef[] | null {
  if (typeof window === "undefined") return null;
  const raw = readJson(SCHEMA_KEY);
  if (!Array.isArray(raw)) return null;
  return sanitizeSchema(raw);
}

export function loadPersistedWorld(): {
  floors: FloorMeta[];
  rooms: Room[];
  fixtures: MapFixture[];
  characters: Character[];
  tokens: Record<string, TokenPos>;
  hasCharacters: boolean;
  hasTokens: boolean;
} | null {
  if (typeof window === "undefined") return null;
  const raw = readJson(WORLD_KEY);
  if (!raw || typeof raw !== "object") return null;
  const rec = raw as Record<string, unknown>;
  if (!Array.isArray(rec.floors) && !Array.isArray(rec.rooms)) return null;
  const floors = sanitizeFloors(rec.floors);
  const rooms = sanitizeRooms(rec.rooms, floors);
  const fixtures = sanitizeFixtures(rec.fixtures, floors);
  const hasCharacters = Array.isArray(rec.characters);
  const hasTokens = rec.tokens !== undefined;
  const characters = sanitizeCharacters(rec.characters);
  const tokens = sanitizeTokenMap(rec.tokens, rooms, floors, characters);
  return { floors, rooms, fixtures, characters, tokens, hasCharacters, hasTokens };
}

function isFactorySnapshot(st: Record<string, unknown>): boolean {
  const schema = st.schema;
  const factory = cloneSchema();
  const schemaMatch =
    Array.isArray(schema) && schemasEqual(schema as PropDef[], factory);
  const floors = Array.isArray(st.floors) ? (st.floors as FloorMeta[]) : factoryFloors();
  const rooms = Array.isArray(st.rooms) ? (st.rooms as Room[]) : [];
  const fixtures = Array.isArray(st.fixtures) ? (st.fixtures as MapFixture[]) : [];
  const characters = Array.isArray(st.characters)
    ? (st.characters as Character[])
    : [];
  const worldMatch = isFactoryWorld(floors, rooms, fixtures, characters);
  const notes = st.notes;
  const noNotes =
    !notes ||
    (typeof notes === "object" && Object.keys(notes as object).length === 0);
  return schemaMatch && worldMatch && noNotes;
}

function writePersistNow(name: string, value: string) {
  try {
    const existing = localStorage.getItem(name);
    if (existing) {
      const prev = JSON.parse(existing) as { state?: Record<string, unknown> };
      const incoming = JSON.parse(value) as { state?: Record<string, unknown> };
      const pst = (prev.state ?? prev) as Record<string, unknown>;
      const ist = (incoming.state ?? incoming) as Record<string, unknown>;
      if (!isFactorySnapshot(pst) && isFactorySnapshot(ist) && !allowFactoryWrite) {
        return;
      }
    }
    allowFactoryWrite = false;
    localStorage.setItem(name, value);
  } catch {
    /* quota / parse */
  }
}

function flushPersistWrite() {
  if (persistWriteTimer) {
    clearTimeout(persistWriteTimer);
    persistWriteTimer = undefined;
  }
  if (!persistWritePending) return;
  const { name, value } = persistWritePending;
  persistWritePending = null;
  writePersistNow(name, value);
}

function syncStorage(): StateStorage {
  return {
    getItem: (name) => {
      try {
        return localStorage.getItem(name);
      } catch {
        return null;
      }
    },
    setItem: (name, value) => {
      if (!persistReady) return;
      persistWritePending = { name, value };
      if (persistWriteTimer) clearTimeout(persistWriteTimer);
      persistWriteTimer = setTimeout(flushPersistWrite, 48);
    },
    removeItem: (name) => {
      try {
        localStorage.removeItem(name);
      } catch {
        /* ignore */
      }
    },
  };
}

function knownIds(rooms: Room[]) {
  return new Set(rooms.map((r) => r.id));
}

function sanitizeTokens(
  raw: unknown,
  rooms: Room[],
  floors: FloorMeta[],
  characters: Character[],
): Record<string, TokenPos> {
  return sanitizeTokenMap(raw, rooms, floors, characters);
}

function sanitizeNotes(raw: unknown, rooms: Room[]): Record<string, string> {
  if (!raw || typeof raw !== "object") return {};
  const ids = knownIds(rooms);
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!ids.has(key) || typeof value !== "string") continue;
    out[key] = value;
  }
  return out;
}

function sanitizeExplored(raw: unknown, rooms: Room[]): Record<string, boolean> {
  const ids = knownIds(rooms);
  const out: Record<string, boolean> = {};
  if (raw && typeof raw === "object") {
    for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
      if (!ids.has(key)) continue;
      if (value) out[key] = true;
    }
  }
  return out;
}

type PersistedSlice = {
  tokens: Record<string, TokenPos>;
  notes: Record<string, string>;
  sceneRoomId: string | null;
  explored: Record<string, boolean>;
  floorId: string;
  selectedId: string | null;
  schema: PropDef[];
  floors: FloorMeta[];
  rooms: Room[];
  fixtures: MapFixture[];
  characters: Character[];
  groups: RoomGroup[];
  scenes: MapScene[];
  terrain: TerrainMap;
};

export type LivePayload = PersistedSlice & { appearance?: unknown };

export type ConfigPayload = {
  schema: PropDef[];
  floors: FloorMeta[];
  rooms: Room[];
  fixtures: MapFixture[];
  appearance: unknown;
  copy?: unknown;
  chrome?: unknown;
  assist?: unknown;
  vault?: unknown;
  characters?: Character[];
  tokens?: Record<string, TokenPos>;
  groups?: RoomGroup[];
  scenes?: MapScene[];
  terrain?: TerrainMap;
};

function pruneFilters(
  filters: Record<string, string>,
  schema: PropDef[],
): Record<string, string> {
  const ids = new Set(schema.map((d) => d.id));
  const next: Record<string, string> = {};
  for (const [key, value] of Object.entries(filters)) {
    if (ids.has(key)) next[key] = value;
  }
  return next;
}

function normalizeSlice(
  s: Record<string, unknown>,
  fallbackRooms?: Room[],
  fallbackFloors?: FloorMeta[],
  fallbackCharacters?: Character[],
): Partial<PersistedSlice> {
  const out: Partial<PersistedSlice> = {};
  if (s.floors !== undefined) out.floors = sanitizeFloors(s.floors);
  const floors = out.floors ?? fallbackFloors ?? factoryFloors();
  if (s.rooms !== undefined) out.rooms = sanitizeRooms(s.rooms, floors);
  const rooms = out.rooms ?? fallbackRooms ?? [];
  if (s.characters !== undefined) out.characters = sanitizeCharacters(s.characters);
  const characters = out.characters ?? fallbackCharacters ?? [];
  if (s.tokens) out.tokens = sanitizeTokens(s.tokens, rooms, floors, characters);
  if (s.notes) out.notes = sanitizeNotes(s.notes, rooms);
  if (s.sceneRoomId === null) out.sceneRoomId = null;
  else if (typeof s.sceneRoomId === "string" && knownIds(rooms).has(s.sceneRoomId)) {
    out.sceneRoomId = s.sceneRoomId;
  }
  if (s.explored) out.explored = sanitizeExplored(s.explored, rooms);
  if (typeof s.floorId === "string" && floors.some((f) => f.id === s.floorId)) {
    out.floorId = s.floorId;
  }
  if (s.selectedId === null) out.selectedId = null;
  else if (typeof s.selectedId === "string" && knownIds(rooms).has(s.selectedId)) {
    out.selectedId = s.selectedId;
  }
  if (s.schema !== undefined) out.schema = sanitizeSchema(s.schema);
  if (s.fixtures !== undefined) out.fixtures = sanitizeFixtures(s.fixtures, floors);
  if (s.groups !== undefined) out.groups = sanitizeGroups(s.groups);
  if (s.scenes !== undefined) out.scenes = sanitizeScenes(s.scenes);
  if (s.terrain !== undefined) out.terrain = sanitizeTerrainMap(s.terrain);
  return out;
}

function readPersistedRaw(): Record<string, unknown> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state?: Record<string, unknown> };
    return (parsed.state ?? parsed) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function firstRoomOn(rooms: Room[], floorId: string) {
  const here = roomsOnFloor(rooms, floorId);
  const named = here.find((room) => !/^pi[eè]ce(?:\s+\d+)?$/i.test(room.name.trim()));
  return named?.id ?? here[0]?.id ?? null;
}

type WorldSnap = {
  floors: FloorMeta[];
  rooms: Room[];
  fixtures: MapFixture[];
  floorId: string;
  selectedId: string | null;
  selectedMarkId: string | null;
  selectedGroupId: string | null;
  groups: RoomGroup[];
  terrain: TerrainMap;
};

function cloneSnap(s: WorldSnap): WorldSnap {
  return JSON.parse(
    JSON.stringify({
      floors: s.floors,
      rooms: s.rooms,
      fixtures: s.fixtures,
      floorId: s.floorId,
      selectedId: s.selectedId,
      selectedMarkId: s.selectedMarkId,
      selectedGroupId: s.selectedGroupId,
      groups: s.groups,
      terrain: s.terrain,
    }),
  ) as WorldSnap;
}

let histKind = "";
let histAt = 0;

function takeHistory(
  s: AtlasState,
  kind: string,
): Pick<AtlasState, "history" | "future"> | Record<string, never> {
  const now = Date.now();
  if (kind !== "world" && kind === histKind && now - histAt < 900) {
    histAt = now;
    return {};
  }
  histKind = kind;
  histAt = now;
  return {
    history: [...(s.history ?? []), cloneSnap(s)].slice(-60),
    future: [],
  };
}

function roomPatchKind(patch: RoomEdit): string {
  if (patch.poly || patch.connections || patch.travel) return "world";
  return "room-text";
}

function floorPatchKind(patch: Partial<FloorMeta>): string {
  if (patch.viewBox || patch.order !== undefined || patch.up || patch.down) return "world";
  return "floor-text";
}

function markPatchKind(patch: Partial<MapFixture>): string {
  if (
    patch.x !== undefined ||
    patch.y !== undefined ||
    patch.rotation !== undefined ||
    patch.length !== undefined ||
    patch.poly ||
    patch.kind ||
    patch.width !== undefined ||
    patch.style ||
    patch.flip !== undefined ||
    patch.hinge
  )
    return "world";
  return "mark-text";
}

export interface AtlasState {
  floorId: string;
  selectedId: string | null;
  selectedMarkId: string | null;
  query: string;
  filters: Record<string, string>;
  tokens: Record<string, TokenPos>;
  notes: Record<string, string>;
  sceneRoomId: string | null;
  explored: Record<string, boolean>;
  schema: PropDef[];
  floors: FloorMeta[];
  rooms: Room[];
  fixtures: MapFixture[];
  characters: Character[];
  groups: RoomGroup[];
  selectedGroupId: string | null;
  scenes: MapScene[];
  activeSceneId: string | null;
  terrain: TerrainMap;
  groundKind: GroundKind;
  groundBrush: number;
  placingTokenId: string | null;
  tool: MapTool;
  drawShape: DrawShape;
  stairStyle: StairStyle;
  zoneFill: ZoneFill;
  history: WorldSnap[];
  future: WorldSnap[];
  setFloor: (id: string) => void;
  select: (id: string | null, opts?: { isolate?: boolean }) => void;
  selectMark: (id: string | null) => void;
  setQuery: (q: string) => void;
  setFilter: (propId: string, value: string) => void;
  clearFilters: () => void;
  moveToken: (who: string, pos: TokenPos) => void;
  setNote: (roomId: string, text: string) => void;
  setScene: (roomId: string | null) => void;
  markExplored: (roomId: string) => void;
  patchRoom: (id: string, patch: RoomEdit) => void;
  translateRooms: (ids: string[], dx: number, dy: number) => void;
  setRoomProp: (id: string, propId: string, value: PropValue) => void;
  resetRoom: (id: string) => void;
  addRoom: (poly: Point[]) => string | null;
  deleteRoom: (id: string) => void;
  addFloor: () => string;
  deleteFloor: (id: string) => void;
  patchFloor: (id: string, patch: Partial<FloorMeta>) => void;
  moveFloor: (id: string, dir: -1 | 1) => void;
  reorderFloors: (id: string, beforeId: string) => void;
  reorderFloorsAt: (id: string, index: number) => void;
  addFixture: (partial: Omit<MapFixture, "id"> & { id?: string }) => string;
  patchFixture: (id: string, patch: Partial<MapFixture>) => void;
  deleteFixture: (id: string) => void;
  addCharacter: (name?: string) => string;
  patchCharacter: (id: string, patch: Partial<Character>) => void;
  deleteCharacter: (id: string) => void;
  setPlacingToken: (id: string | null) => void;
  setTool: (tool: MapTool) => void;
  setDrawShape: (shape: DrawShape) => void;
  setStairStyle: (style: StairStyle) => void;
  setZoneFill: (id: ZoneFill) => void;
  addGroup: () => string;
  patchGroup: (id: string, patch: Partial<RoomGroup>) => void;
  deleteGroup: (id: string) => void;
  selectGroup: (id: string | null) => void;
  toggleRoomGroup: (roomId: string, groupId: string) => void;
  paintGround: (stroke: Point[], mode?: "paint" | "erase") => void;
  setGroundKind: (kind: GroundKind) => void;
  setGroundBrush: (n: number) => void;
  applyScene: (id: string | null) => void;
  saveScene: () => string;
  deleteScene: (id: string) => void;
  undo: () => void;
  redo: () => void;
  setSchema: (schema: PropDef[]) => void;
  resetSchema: () => void;
  resetWorld: () => void;
  loadCatalogHouse: () => void;
  wander: () => string | null;
  resetSession: () => void;
  setRoomExtra: (
    roomId: string,
    propId: string,
    varId: string,
    value: PropPrimitive,
  ) => void;
}

const accountBoot = readBootWorld();
const starterFloors = accountBoot.floors;
const starterRooms = accountBoot.rooms;
const starterFixtures = accountBoot.fixtures;
const bootFloor =
  starterFloors.find((f) => f.id === "etage-1") ?? starterFloors[0]!;

function readBootWorld(): {
  floors: FloorMeta[];
  rooms: Room[];
  fixtures: MapFixture[];
  characters: Character[];
  tokens: Record<string, TokenPos>;
} {
  const empty = {
    floors: factoryFloors(),
    rooms: factoryRooms(),
    fixtures: factoryFixtures(),
    characters: factoryCharacters(),
    tokens: {} as Record<string, TokenPos>,
  };
  try {
    const p = coffrePayload();
    if (Array.isArray(p.floors) && p.floors.length) {
      return {
        floors: p.floors,
        rooms: p.rooms ?? [],
        fixtures: p.fixtures ?? [],
        characters: p.characters ?? [],
        tokens: p.tokens ?? {},
      };
    }
  } catch {
    /* snapshot absent */
  }
  return empty;
}

export const useAtlas = create<AtlasState>()(
  persist(
    (set, get) => ({
      floorId: bootFloor.id,
      selectedId: firstRoomOn(starterRooms, bootFloor.id),
      query: "",
      filters: {},
      tokens: defaultTokens(),
      notes: {},
      sceneRoomId: null,
      explored: {},
      schema: cloneSchema(),
      floors: starterFloors,
      rooms: starterRooms,
      fixtures: starterFixtures,
      characters: factoryCharacters(),
      groups: [],
      selectedGroupId: null,
      scenes: [],
      activeSceneId: null,
      terrain: {},
      groundKind: "meadow",
      groundBrush: DEFAULT_GROUND_BRUSH,
      placingTokenId: null,
      tool: "select",
      drawShape: "rect",
      stairStyle: "straight",
      selectedMarkId: null,
      zoneFill: "sage",
      history: [],
      future: [],
      setFloor: (id) =>
        set((s) => {
          if (s.floorId === id) return s;
          if (!s.floors.some((f) => f.id === id)) return s;
          return {
            floorId: id,
            selectedId: firstRoomOn(s.rooms, id),
            selectedGroupId: null,
            selectedMarkId: null,
            tool: "select",
          };
        }),
      select: (id, _opts) => {
        if (!id) {
          set({ selectedId: null, selectedMarkId: null, selectedGroupId: null });
          return;
        }
        const room = roomById(get().rooms, id);
        if (!room) return;
        set((s) => ({
          selectedId: id,
          selectedMarkId: null,
          selectedGroupId: null,
          floorId: room.floorId,
          explored: { ...s.explored, [id]: true },
        }));
      },
      selectMark: (id) => {
        if (!id) {
          set({ selectedMarkId: null });
          return;
        }
        const mark = get().fixtures.find((f) => f.id === id);
        if (!mark) return;
        set({ selectedMarkId: id, selectedId: null, selectedGroupId: null, floorId: mark.floorId });
      },
      setQuery: (query) => set({ query }),
      setFilter: (propId, value) =>
        set((s) => ({
          filters: { ...s.filters, [propId]: value },
          activeSceneId: null,
        })),
      clearFilters: () => set({ filters: {}, query: "", activeSceneId: null }),
      moveToken: (who, pos) =>
        set((s) => {
          const tokens = { ...s.tokens, [who]: pos };
          persistWorld(s.floors, s.rooms, true, s.fixtures, {
            characters: s.characters,
            tokens,
          });
          return {
            tokens,
            explored: pos.roomId ? { ...s.explored, [pos.roomId]: true } : s.explored,
          };
        }),
      setNote: (roomId, text) =>
        set((s) => ({ notes: { ...s.notes, [roomId]: text } })),
      setScene: (sceneRoomId) => set({ sceneRoomId }),
      markExplored: (roomId) =>
        set((s) => ({ explored: { ...s.explored, [roomId]: true } })),
      patchRoom: (id, patch) =>
        set((s) => {
          if (!roomById(s.rooms, id)) return s;
          const nextPatch = { ...patch };
          if (nextPatch.poly) {
            const others = roomsOnFloor(s.rooms, s.floorId)
              .filter((r) => r.id !== id)
              .map((r) => r.poly);
            nextPatch.poly = magnetPoly(nextPatch.poly, others);
          }
          const rooms = s.rooms.map((room) => {
            if (room.id !== id) return room;
            const merged: Room = { ...room, ...nextPatch };
            if (nextPatch.file === "") delete merged.file;
            if (nextPatch.groupIds) return applyRoomGroups(merged, nextPatch.groupIds);
            if (nextPatch.props && GROUPS_PROP_ID in nextPatch.props) {
              return applyRoomGroups(merged, asGroupIds(nextPatch.props[GROUPS_PROP_ID]));
            }
            if (nextPatch.props) return applyRoomGroups(merged, groupIdsOf(room));
            return merged;
          });
          persistWorld(s.floors, rooms, true);
          if (nextPatch.name !== undefined || nextPatch.description !== undefined) {
            const merged = rooms.find((r) => r.id === id);
            if (merged) syncRoomFile(merged);
          }
          return { ...takeHistory(s, roomPatchKind(nextPatch)), rooms };
        }),
      translateRooms: (ids, dx, dy) =>
        set((s) => {
          if (!dx && !dy) return s;
          const moving = new Set(ids.filter((id) => roomById(s.rooms, id)));
          if (!moving.size) return s;
          const others = roomsOnFloor(s.rooms, s.floorId)
            .filter((r) => !moving.has(r.id))
            .map((r) => r.poly);
          const rooms = s.rooms.map((room) => {
            if (!moving.has(room.id)) return room;
            return { ...room, poly: magnetPoly(translatePoly(room.poly, dx, dy), others, 32) };
          });
          persistWorld(s.floors, rooms, true);
          return { ...takeHistory(s, "world"), rooms };
        }),
      setRoomProp: (id, propId, value) =>
        set((s) => {
          if (propId === DIMS_PROP_ID) return s;
          const room = roomById(s.rooms, id);
          if (!room) return s;
          const rooms = s.rooms.map((r) => {
            if (r.id !== id) return r;
            if (propId === GROUPS_PROP_ID) return applyRoomGroups(r, asGroupIds(value));
            return { ...r, props: { ...(r.props ?? {}), [propId]: value } };
          });
          persistWorld(s.floors, rooms, true);
          return { ...takeHistory(s, "room-text"), rooms };
        }),
      setRoomExtra: (roomId, propId, varId, value) =>
        set((s) => {
          const room = roomById(s.rooms, roomId);
          if (!room) return s;
          const rooms = s.rooms.map((r) => {
            if (r.id !== roomId) return r;
            const bag = { ...(r.propExtras ?? {}) };
            bag[propId] = { ...(bag[propId] ?? {}), [varId]: value };
            return { ...r, propExtras: bag };
          });
          persistWorld(s.floors, rooms, true);
          return { ...takeHistory(s, "room-text"), rooms };
        }),
      resetRoom: (id) =>
        set((s) => {
          const room = roomById(s.rooms, id);
          if (!room) return s;
          const word = useUiStore.getState().copy.roomWord;
          const rooms = s.rooms.map((r) =>
            r.id === id
              ? {
                  ...r,
                  name: word,
                  label: word,
                  description: "",
                  steps: [],
                  props: {},
                }
              : r,
          );
          persistWorld(s.floors, rooms, true);
          return { ...takeHistory(s, "world"), rooms };
        }),
      addRoom: (poly) => {
        const s = get();
        const others = roomsOnFloor(s.rooms, s.floorId).map((r) => r.poly);
        const snapped = magnetPoly(poly, others);
        const count = others.length + 1;
        const word = useUiStore.getState().copy.roomWord;
        const room = emptyRoom({
          floorId: s.floorId,
          name: `${word} ${count}`,
          label: String(count),
          poly: snapped,
        });
        const rooms = [...s.rooms, room];
        set({
          ...takeHistory(s, "world"),
          rooms,
          selectedId: room.id,
          tool: "select",
          explored: { ...s.explored, [room.id]: true },
        });
        persistWorld(s.floors, rooms, true);
        return room.id;
      },
      deleteRoom: (id) =>
        set((s) => {
          if (!roomById(s.rooms, id)) return s;
          const rooms = s.rooms
            .filter((r) => r.id !== id)
            .map((r) => ({
              ...r,
              connections: r.connections.filter((c) => c !== id),
            }));
          allowFactoryWrite = true;
          persistWorld(s.floors, rooms, true);
          const tokens = { ...s.tokens };
          for (const who of Object.keys(tokens)) {
            if (tokens[who]?.roomId === id) {
              const prev = tokens[who]!;
              tokens[who] = {
                floorId: prev.floorId || s.floorId,
                roomId: "",
                x: prev.x,
                y: prev.y,
              };
            }
          }
          return {
            ...takeHistory(s, "world"),
            rooms,
            tokens,
            selectedId: s.selectedId === id ? firstRoomOn(rooms, s.floorId) : s.selectedId,
            sceneRoomId: s.sceneRoomId === id ? null : s.sceneRoomId,
          };
        }),
      addFloor: () => {
        const s = get();
        const n = s.floors.length + 1;
        const word = useUiStore.getState().copy.floorWord;
        const floor: FloorMeta = {
          id: uid("fl"),
          name: `${word} ${n}`,
          short: String(n),
          order: n,
          viewBox: [...factoryFloors()[0]!.viewBox],
          blurb: "",
          material: "",
        };
        const floors = linkFloors([...s.floors, floor]);
        persistWorld(floors, s.rooms, true, s.fixtures);
        set({
          ...takeHistory(s, "world"),
          floors,
          floorId: floor.id,
          selectedId: null,
          selectedMarkId: null,
          tool: "select",
        });
        return floor.id;
      },
      deleteFloor: (id) =>
        set((s) => {
          if (s.floors.length <= 1) return s;
          if (!s.floors.some((f) => f.id === id)) return s;
          const floors = linkFloors(s.floors.filter((f) => f.id !== id));
          const rooms = s.rooms.filter((r) => r.floorId !== id);
          const fixtures = s.fixtures.filter((f) => f.floorId !== id);
          allowFactoryWrite = true;
          persistWorld(floors, rooms, true, fixtures);
          const nextId = s.floorId === id ? floors[0]!.id : s.floorId;
          return {
            ...takeHistory(s, "world"),
            floors,
            rooms,
            fixtures,
            floorId: nextId,
            selectedId: firstRoomOn(rooms, nextId),
            selectedMarkId: null,
          };
        }),
      patchFloor: (id, patch) =>
        set((s) => {
          if (!s.floors.some((f) => f.id === id)) return s;
          const floors = linkFloors(
            s.floors.map((f) => (f.id === id ? { ...f, ...patch, id: f.id } : f)),
          );
          persistWorld(floors, s.rooms, true, s.fixtures);
          return { ...takeHistory(s, floorPatchKind(patch)), floors };
        }),
      moveFloor: (id, dir) =>
        set((s) => {
          const i = s.floors.findIndex((f) => f.id === id);
          const j = i + dir;
          if (i < 0 || j < 0 || j >= s.floors.length) return s;
          const next = [...s.floors];
          const a = next[i]!;
          next[i] = next[j]!;
          next[j] = a;
          const floors = linkFloors(next);
          persistWorld(floors, s.rooms, true, s.fixtures);
          return { ...takeHistory(s, "world"), floors };
        }),
      reorderFloors: (id, beforeId) =>
        set((s) => {
          if (id === beforeId) return s;
          const from = s.floors.findIndex((f) => f.id === id);
          const to = s.floors.findIndex((f) => f.id === beforeId);
          if (from < 0 || to < 0) return s;
          const next = [...s.floors];
          const [item] = next.splice(from, 1);
          if (!item) return s;
          const insert = next.findIndex((f) => f.id === beforeId);
          next.splice(insert < 0 ? next.length : insert, 0, item);
          const floors = linkFloors(next);
          persistWorld(floors, s.rooms, true, s.fixtures);
          return { ...takeHistory(s, "world"), floors };
        }),
      reorderFloorsAt: (id, index) =>
        set((s) => {
          const from = s.floors.findIndex((f) => f.id === id);
          if (from < 0) return s;
          const to = Math.max(0, Math.min(index, s.floors.length - 1));
          if (from === to) return s;
          const next = [...s.floors];
          const [item] = next.splice(from, 1);
          if (!item) return s;
          next.splice(to, 0, item);
          const floors = linkFloors(next);
          persistWorld(floors, s.rooms, true, s.fixtures);
          return { ...takeHistory(s, "world"), floors };
        }),
      addFixture: (partial) => {
        const s = get();
        const mark: MapFixture = {
          id: partial.id ?? uid("mk"),
          floorId: partial.floorId,
          kind: partial.kind,
          x: partial.x,
          y: partial.y,
          rotation: partial.rotation ?? 0,
          length: Math.max(24, partial.length ?? 72),
          width: partial.width,
          style: partial.style,
          label:
            partial.label ??
            (partial.kind === "zone"
              ? `Zone ${s.fixtures.filter((f) => f.kind === "zone").length + 1}`
              : undefined),
          description: partial.description,
          toFloor: partial.toFloor,
          poly: partial.poly,
          fill: partial.fill,
          color: partial.color,
          photos: partial.photos,
        };
        const fixtures = [...s.fixtures, mark];
        persistWorld(s.floors, s.rooms, true, fixtures);
        set({
          ...takeHistory(s, "world"),
          fixtures,
          selectedMarkId: mark.id,
          selectedId: null,
          tool: "select",
        });
        return mark.id;
      },
      patchFixture: (id, patch) =>
        set((s) => {
          if (!s.fixtures.some((f) => f.id === id)) return s;
          const fixtures = s.fixtures.map((f) =>
            f.id === id ? { ...f, ...patch, id: f.id } : f,
          );
          persistWorld(s.floors, s.rooms, true, fixtures);
          return { ...takeHistory(s, markPatchKind(patch)), fixtures };
        }),
      deleteFixture: (id) =>
        set((s) => {
          if (!s.fixtures.some((f) => f.id === id)) return s;
          const fixtures = s.fixtures.filter((f) => f.id !== id);
          allowFactoryWrite = true;
          persistWorld(s.floors, s.rooms, true, fixtures);
          return {
            ...takeHistory(s, "world"),
            fixtures,
            selectedMarkId: s.selectedMarkId === id ? null : s.selectedMarkId,
          };
        }),
      addCharacter: (name) => {
        const s = get();
        const n = s.characters.length + 1;
        const full = (name ?? "").trim() || `Pion ${n}`;
        const palette = ["#c45c4a", "#3f5344", "#4a6fa5", "#b5812f", "#6b4c7a", "#2f6f6a"];
        const character: Character = {
          id: uid("pion"),
          name: full.slice(0, 80),
          short: full.slice(0, 1).toUpperCase(),
          role: "",
          color: palette[(n - 1) % palette.length],
        };
        const characters = [...s.characters, character];
        const vb = s.floors.find((f) => f.id === s.floorId)?.viewBox ?? [0, 0, 1600, 1000];
        const tokens = {
          ...s.tokens,
          [character.id]: {
            floorId: s.floorId,
            roomId: "" as const,
            x: vb[0] + vb[2] / 2,
            y: vb[1] + vb[3] / 2,
          },
        };
        persistWorld(s.floors, s.rooms, true, s.fixtures, { characters, tokens });
        set({
          characters,
          tokens,
          placingTokenId: character.id,
          tool: "token",
        });
        return character.id;
      },
      patchCharacter: (id, patch) =>
        set((s) => {
          if (!s.characters.some((c) => c.id === id)) return s;
          const characters = s.characters.map((c) => {
            if (c.id !== id) return c;
            const name =
              typeof patch.name === "string" && patch.name.trim()
                ? patch.name.trim().slice(0, 80)
                : c.name;
            const short =
              typeof patch.short === "string" && patch.short.trim()
                ? patch.short.trim().slice(0, 3)
                : name.slice(0, 1).toUpperCase();
            return {
              ...c,
              ...patch,
              id: c.id,
              name,
              short,
            };
          });
          persistWorld(s.floors, s.rooms, true, s.fixtures, {
            characters,
            tokens: s.tokens,
          });
          return { characters };
        }),
      deleteCharacter: (id) =>
        set((s) => {
          if (!s.characters.some((c) => c.id === id)) return s;
          const characters = s.characters.filter((c) => c.id !== id);
          const tokens = { ...s.tokens };
          delete tokens[id];
          persistWorld(s.floors, s.rooms, true, s.fixtures, { characters, tokens });
          return {
            characters,
            tokens,
            placingTokenId: s.placingTokenId === id ? null : s.placingTokenId,
            tool: s.placingTokenId === id && s.tool === "token" ? "select" : s.tool,
          };
        }),
      setPlacingToken: (id) =>
        set({
          placingTokenId: id,
          tool: id ? "token" : "select",
        }),
      setTool: (tool) => set({ tool, selectedMarkId: tool === "select" ? get().selectedMarkId : null }),
      setDrawShape: (drawShape) => set({ drawShape, tool: "draw" }),
      setStairStyle: (stairStyle) => set({ stairStyle, tool: "stair" }),
      setZoneFill: (zoneFill) => set({ zoneFill, tool: "zone" }),
      undo: () =>
        set((s) => {
          const past = s.history ?? [];
          if (!past.length) return s;
          const prev = past[past.length - 1]!;
          const current = cloneSnap(s);
          histKind = "";
          histAt = 0;
          allowFactoryWrite = true;
          persistWorld(prev.floors, prev.rooms, true, prev.fixtures);
          return {
            floors: prev.floors,
            rooms: prev.rooms,
            fixtures: prev.fixtures,
            floorId: prev.floorId,
            selectedId: prev.selectedId,
            selectedMarkId: prev.selectedMarkId,
            history: past.slice(0, -1),
            future: [...(s.future ?? []), current].slice(-60),
            tool: "select",
          };
        }),
      redo: () =>
        set((s) => {
          const nextStack = s.future ?? [];
          if (!nextStack.length) return s;
          const next = nextStack[nextStack.length - 1]!;
          const current = cloneSnap(s);
          histKind = "";
          histAt = 0;
          allowFactoryWrite = true;
          persistWorld(next.floors, next.rooms, true, next.fixtures);
          return {
            floors: next.floors,
            rooms: next.rooms,
            fixtures: next.fixtures,
            floorId: next.floorId,
            selectedId: next.selectedId,
            selectedMarkId: next.selectedMarkId,
            history: [...(s.history ?? []), current].slice(-60),
            future: nextStack.slice(0, -1),
            tool: "select",
          };
        }),
      setSchema: (schema) =>
        set((s) => {
          const next = sanitizeSchema(schema);
          allowFactoryWrite = true;
          persistSchema(next, true);
          const actors = tokenActors(next, s.characters);
          const tokens = { ...s.tokens };
          for (const a of actors) {
            if (!tokens[a.id]) {
              tokens[a.id] = { floorId: s.floorId, roomId: "" };
            }
          }
          persistWorld(s.floors, s.rooms, true, s.fixtures, {
            characters: s.characters,
            tokens,
          });
          return { schema: next, filters: pruneFilters(s.filters, next), tokens };
        }),
      resetSchema: () => {
        allowFactoryWrite = true;
        const next = cloneSchema();
        persistSchema(next, true);
        set({ schema: next, filters: {} });
      },
      resetWorld: () => {
        const s = get();
        allowFactoryWrite = true;
        const floors = factoryFloors();
        const rooms = factoryRooms();
        const fixtures = factoryFixtures();
        const characters = factoryCharacters();
        persistWorld(floors, rooms, true, fixtures, { characters, tokens: {} });
        persistSchema(cloneSchema(), true);
        set({
          ...takeHistory(s, "world"),
          floors,
          rooms,
          fixtures,
          characters,
          placingTokenId: null,
          schema: cloneSchema(),
          floorId: floors[0]!.id,
          selectedId: null,
          selectedMarkId: null,
          filters: {},
          notes: {},
          sceneRoomId: null,
          explored: {},
          tokens: {},
          tool: "select",
          drawShape: "rect",
          stairStyle: "straight",
          future: [],
        });
      },
      loadCatalogHouse: () => {
        const s = get();
        const world = catalogWorld();
        allowFactoryWrite = true;
        persistWorld(world.floors, world.rooms, true, world.fixtures, {
          characters: world.characters,
          tokens: world.tokens,
        });
        set({
          ...takeHistory(s, "world"),
          floors: world.floors,
          rooms: world.rooms,
          fixtures: world.fixtures,
          characters: world.characters,
          tokens: world.tokens,
          floorId: "rdc",
          selectedId: "salon",
          placingTokenId: null,
          selectedMarkId: null,
          filters: {},
          notes: {},
          sceneRoomId: null,
          explored: {},
          tool: "select",
        });
      },
      wander: () => {
        const { floorId, query, filters, rooms, schema, tokens } = get();
        const pool = resolveFloor(floorId, rooms, schema).filter((r) =>
          roomMatches(r, schema, filters, query, tokens),
        );
        if (pool.length === 0) return null;
        const pick = pool[Math.floor(Math.random() * pool.length)]!;
        get().select(pick.id);
        return pick.id;
      },

      addGroup: () => {
        const s = get();
        const id = uid("grp");
        const color = GROUP_COLORS[s.groups.length % GROUP_COLORS.length]!;
        const group: RoomGroup = { id, name: `Groupe ${s.groups.length + 1}`, color };
        const groups = [...s.groups, group];
        persistWorld(s.floors, s.rooms, true, s.fixtures, { groups });
        set({
          ...takeHistory(s, "world"),
          groups,
          selectedGroupId: id,
          selectedId: null,
          selectedMarkId: null,
          schema: ensureGroupsProp(s.schema, groups),
        });
        return id;
      },
      patchGroup: (id, patch) =>
        set((s) => {
          if (!s.groups.some((g) => g.id === id)) return s;
          const groups = s.groups.map((g) => (g.id === id ? { ...g, ...patch, id: g.id } : g));
          persistWorld(s.floors, s.rooms, true, s.fixtures, { groups });
          return { ...takeHistory(s, "world"), groups, schema: ensureGroupsProp(s.schema, groups) };
        }),
      deleteGroup: (id) =>
        set((s) => {
          if (!s.groups.some((g) => g.id === id)) return s;
          const groups = s.groups.filter((g) => g.id !== id);
          const rooms = s.rooms.map((r) =>
            groupIdsOf(r).includes(id)
              ? applyRoomGroups(r, groupIdsOf(r).filter((g) => g !== id))
              : r,
          );
          persistWorld(s.floors, rooms, true, s.fixtures, { groups });
          return {
            ...takeHistory(s, "world"),
            groups,
            rooms,
            selectedGroupId: s.selectedGroupId === id ? null : s.selectedGroupId,
            schema: ensureGroupsProp(s.schema, groups),
          };
        }),
      selectGroup: (id) =>
        set({
          selectedGroupId: id,
          selectedId: id ? null : get().selectedId,
          selectedMarkId: id ? null : get().selectedMarkId,
        }),
      toggleRoomGroup: (roomId, groupId) =>
        set((s) => {
          const room = roomById(s.rooms, roomId);
          if (!room || !s.groups.some((g) => g.id === groupId)) return s;
          const ids = groupIdsOf(room);
          const next = ids.includes(groupId) ? ids.filter((g) => g !== groupId) : [...ids, groupId];
          const rooms = s.rooms.map((r) => (r.id === roomId ? applyRoomGroups(r, next) : r));
          persistWorld(s.floors, rooms, true);
          return { ...takeHistory(s, "world"), rooms };
        }),
      paintGround: (stroke, mode = "paint") =>
        set((s) => {
          if (!stroke.length) return s;
          const packed = stampStroke(
            s.terrain[s.floorId],
            stroke,
            s.groundBrush,
            s.groundKind,
            mode,
          );
          const terrain = { ...s.terrain };
          if (packed.cols === 0) delete terrain[s.floorId];
          else terrain[s.floorId] = packed;
          persistWorld(s.floors, s.rooms, true, s.fixtures, { terrain });
          return { ...takeHistory(s, "world"), terrain };
        }),
      setGroundKind: (groundKind) => set({ groundKind }),
      setGroundBrush: (n) => set({ groundBrush: clampGroundBrush(n) }),
      applyScene: (id) =>
        set((s) => {
          if (!id) return { activeSceneId: null };
          const scene = s.scenes.find((sc) => sc.id === id);
          if (!scene) return s;
          return { activeSceneId: id, query: scene.query, filters: { ...scene.filters } };
        }),
      saveScene: () => {
        const s = get();
        const id = uid("scene");
        const scene: MapScene = {
          id,
          name: `Vue ${s.scenes.length + 1}`,
          filters: { ...s.filters },
          query: s.query,
        };
        const scenes = [...s.scenes, scene].slice(-16);
        persistWorld(s.floors, s.rooms, true, s.fixtures, { scenes });
        set({ scenes, activeSceneId: id });
        return id;
      },
      deleteScene: (id) =>
        set((s) => {
          const scenes = s.scenes.filter((sc) => sc.id !== id);
          persistWorld(s.floors, s.rooms, true, s.fixtures, { scenes });
          return {
            scenes,
            activeSceneId: s.activeSceneId === id ? null : s.activeSceneId,
          };
        }),
      resetSession: () =>
        set((s) => ({
          tokens: defaultTokens(s.characters),
          notes: {},
          sceneRoomId: null,
          explored: {},
          selectedId: firstRoomOn(s.rooms, s.floorId),
          selectedGroupId: null,
          placingTokenId: null,
        })),
    }),
    {
      name: STORAGE_KEY,
      version: 6,
      skipHydration: true,
      storage: createJSONStorage(syncStorage),
      partialize: (s) => ({
        tokens: s.tokens,
        notes: s.notes,
        sceneRoomId: s.sceneRoomId,
        explored: s.explored,
        floorId: s.floorId,
        selectedId: s.selectedId,
        schema: s.schema,
        floors: s.floors,
        rooms: s.rooms,
        fixtures: s.fixtures,
        characters: s.characters,
        groups: s.groups,
        scenes: s.scenes,
        terrain: s.terrain,
        appearance: useThemeStore.getState().theme,
      }),
      merge: (persisted, current) => {
        if (manualHydrateDone) return current;
        const p = normalizeSlice((persisted ?? {}) as Record<string, unknown>);
        return {
          ...current,
          ...p,
          schema: p.schema ?? current.schema,
          floors: p.floors ?? current.floors,
          rooms: p.rooms ?? current.rooms,
          fixtures: p.fixtures ?? current.fixtures,
          characters: p.characters ?? current.characters,
          groups: p.groups ?? current.groups,
          scenes: p.scenes ?? current.scenes,
          terrain: p.terrain ?? current.terrain,
          filters: {},
          tool: "select" as MapTool,
          drawShape: "rect" as DrawShape,
          stairStyle: "straight" as StairStyle,
          selectedMarkId: null,
          history: [],
          future: [],
        };
      },
      migrate: (persisted, version) => {
        const rec = (persisted ?? {}) as Record<string, unknown>;
        if (version < 5) {
          delete rec.edits;
          if (rec.schema !== undefined) {
            rec.schema = scrubLegacySchema(sanitizeSchema(rec.schema));
          }
          if (rec.floors !== undefined || rec.rooms !== undefined) {
            const floors = sanitizeFloors(rec.floors);
            const rooms = sanitizeRooms(rec.rooms, floors);
            const world = scrubLegacyWorld(floors, rooms);
            rec.floors = world.floors;
            rec.rooms = world.rooms;
          }
        }
        if (version < 6 && rec.characters === undefined) {
          rec.characters = [];
        }
        return rec as unknown as PersistedSlice;
      },
    },
  ),
);

function restoreAppearance(raw: unknown) {
  if (loadPersisted()) return;
  const theme = sanitizeTheme(raw);
  if (!theme) return;
  applyPersistedTheme(theme);
  persistTheme(theme);
}

function pinCoffreAsLocal() {
  const live = useAtlas.getState();
  if (live.rooms.length > 0 || live.fixtures.length > 0) {
    return;
  }
  applyCoffreToLocal((patch) => {
    useAtlas.setState({
      ...patch,
      filters: {},
      tool: "select",
    });
  });
}

export function ensureRoomSelected() {
  const s = useAtlas.getState();
  if (s.selectedMarkId || s.selectedGroupId) return;
  if (s.selectedId && roomById(s.rooms, s.selectedId)) return;
  const id = firstRoomOn(s.rooms, s.floorId) ?? s.rooms[0]?.id ?? null;
  if (!id) return;
  const room = roomById(s.rooms, id);
  useAtlas.setState({
    selectedId: id,
    floorId: room?.floorId ?? s.floorId,
  });
}

export function hydrateAtlas() {
  if (typeof window === "undefined") return;
  if (manualHydrateDone && document.documentElement.dataset.atlasHydrated === "1") {
    persistReady = true;
    return;
  }
  pinCoffreAsLocal();
  const raw = readPersistedRaw();
  if (raw) {
    const slice = normalizeSlice(raw);
    let scrubbed = false;
    if (slice.schema && isLegacyFactorySchema(slice.schema)) {
      slice.schema = [];
      scrubbed = true;
    }
    const incomingEmpty =
      !(slice.rooms && slice.rooms.length) &&
      !(slice.fixtures && slice.fixtures.length);
    const live = useAtlas.getState();
    const incomingW =
      (slice.rooms?.length ?? 0) * 100 +
      (slice.floors?.length ?? 0) * 10 +
      (slice.fixtures?.length ?? 0);
    const liveW = live.rooms.length * 100 + live.floors.length * 10 + live.fixtures.length;
    // Une copie locale vide / plus légère (session sans compte) ne remplace pas le coffre.
    if (!incomingEmpty && incomingW >= liveW) {
      useAtlas.setState({
        ...slice,
        filters: {},
        tool: "select",
        history: [],
        future: [],
      });
    }
    if (scrubbed) {
      allowFactoryWrite = true;
      const s = useAtlas.getState();
      persistSchema(s.schema, true);
      persistWorld(s.floors, s.rooms, true, s.fixtures);
    }
    restoreAppearance(raw.appearance);
  }
  applyDedicatedConfig();
  pinCoffreAsLocal();
  manualHydrateDone = true;
  persistReady = true;
  if (!raw) void useAtlas.persist.rehydrate();
  document.documentElement.dataset.atlasHydrated = "1";
  ensureRoomSelected();
}

export function applyDedicatedConfig() {
  const schemaRaw = loadPersistedSchema();
  const worldRaw = loadPersistedWorld();
  const live = useAtlas.getState();
  const patch: Partial<AtlasState> = { filters: {} };
  if (schemaRaw) {
    const schema = scrubLegacySchema(schemaRaw);
    patch.schema = schema;
    if (isLegacyFactorySchema(schemaRaw)) {
      allowFactoryWrite = true;
      persistSchema(schema, true);
    }
  }
  if (worldRaw) {
    const incomingEmpty =
      worldRaw.rooms.length === 0 && worldRaw.fixtures.length === 0;
    const liveHas = live.rooms.length > 0 || live.fixtures.length > 0;
    if (incomingEmpty && liveHas) {
      /* le coffre / la session live gagnent sur un local vide */
    } else {
    const world = scrubLegacyWorld(
      worldRaw.floors,
      worldRaw.rooms,
      worldRaw.fixtures,
      worldRaw.characters,
      worldRaw.tokens,
    );
    const liveRich = !isFactoryWorld(
      live.floors,
      live.rooms,
      live.fixtures,
      live.characters,
    );
    const incomingFactory = isFactoryWorld(
      world.floors,
      world.rooms,
      world.fixtures,
      world.characters,
    );
    if (!(liveRich && incomingFactory)) {
      patch.floors = world.floors;
      patch.rooms = world.rooms;
      patch.fixtures = world.fixtures;
      if (worldRaw.hasCharacters) patch.characters = world.characters;
      if (worldRaw.hasTokens) patch.tokens = world.tokens;
      if (!world.floors.some((f) => f.id === live.floorId)) {
        patch.floorId = world.floors[0]?.id ?? live.floorId;
        patch.selectedId = firstRoomOn(
          world.rooms,
          patch.floorId ?? world.floors[0]?.id ?? "",
        );
      }
    }
    }
  }
  if (
    patch.schema ||
    patch.floors ||
    patch.rooms ||
    patch.fixtures ||
    patch.characters ||
    patch.tokens
  ) {
    useAtlas.setState({
      ...patch,
      filters: patch.schema
        ? pruneFilters(live.filters, patch.schema)
        : live.filters,
    });
  }
}

if (typeof window !== "undefined") {
  if (!document.documentElement.dataset.atlasPersistFlush) {
    document.documentElement.dataset.atlasPersistFlush = "1";
    window.addEventListener("pagehide", flushLivePersist);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") flushLivePersist();
    });
  }
}

export function isPersistReady() {
  return persistReady;
}

export function flushLivePersist() {
  if (typeof window === "undefined") return;
  persistReady = true;
  flushPersistWrite();
  try {
    const s = useAtlas.getState();
    const snapshot = {
      state: {
        tokens: s.tokens,
        notes: s.notes,
        sceneRoomId: s.sceneRoomId,
        explored: s.explored,
        floorId: s.floorId,
        selectedId: s.selectedId,
        schema: s.schema,
        floors: s.floors,
        rooms: s.rooms,
        fixtures: s.fixtures,
        characters: s.characters,
        appearance: useThemeStore.getState().theme,
      },
      version: 6,
    };
    writePersistNow(STORAGE_KEY, JSON.stringify(snapshot));
    if (schemaWritePending) flushSchemaPersist();
    else commitSchema(s.schema);
    if (worldWritePending) flushWorldPersist();
    else {
      commitWorld(s.floors, s.rooms, false, s.fixtures, {
        characters: s.characters,
        tokens: s.tokens,
        groups: s.groups,
        terrain: s.terrain,
        scenes: s.scenes,
      });
      emitPersist(false);
    }
  } catch {
    /* quota */
  }
}

export function captureConfigPayload(): ConfigPayload {
  const s = useAtlas.getState();
  const ui = useUiStore.getState();
  return JSON.parse(
    JSON.stringify({
      schema: s.schema,
      floors: s.floors,
      rooms: s.rooms,
      fixtures: s.fixtures,
      characters: s.characters,
      tokens: s.tokens,
      groups: s.groups,
      scenes: s.scenes,
      terrain: s.terrain,
      appearance: useThemeStore.getState().theme,
      copy: ui.copy,
      chrome: ui.chrome,
      assist: ui.assist,
      vault: ui.vault,
    }),
  ) as ConfigPayload;
}

export function applyConfigPayload(
  raw: unknown,
  opts: { appearance?: boolean; ui?: boolean } = {},
): boolean {
  if (!raw || typeof raw !== "object") return false;
  const rec = raw as Record<string, unknown>;
  const slice = normalizeSlice(rec);
  const theme = sanitizeTheme(rec.appearance);
  const applyAppearance = opts.appearance !== false;
  const applyUi = opts.ui !== false;
  if (
    slice.schema === undefined &&
    slice.floors === undefined &&
    slice.rooms === undefined &&
    slice.fixtures === undefined &&
    slice.characters === undefined &&
    !theme &&
    rec.copy === undefined &&
    rec.chrome === undefined &&
    rec.assist === undefined &&
    rec.vault === undefined
  ) {
    return false;
  }
  allowFactoryWrite = true;
  persistReady = true;
  const patch: Partial<AtlasState> = { filters: {}, tool: "select", history: [], future: [] };
  if (slice.schema !== undefined) patch.schema = slice.schema;
  if (slice.floors !== undefined) patch.floors = slice.floors;
  if (slice.rooms !== undefined) patch.rooms = slice.rooms;
  if (slice.fixtures !== undefined) patch.fixtures = slice.fixtures;
  if (slice.characters !== undefined) patch.characters = slice.characters;
  if (slice.tokens !== undefined) patch.tokens = slice.tokens;
  if (slice.groups !== undefined) patch.groups = slice.groups;
  if (slice.scenes !== undefined) patch.scenes = slice.scenes;
  if (slice.terrain !== undefined) patch.terrain = slice.terrain;
  if (slice.floorId) patch.floorId = slice.floorId;
  if (slice.selectedId !== undefined) patch.selectedId = slice.selectedId;
  useAtlas.setState(patch);
  if (theme && applyAppearance) {
    applyPersistedTheme(theme);
    persistTheme(theme);
  }
  if (applyUi && (rec.copy !== undefined || rec.chrome !== undefined || rec.assist !== undefined || rec.vault !== undefined)) {
    hydrateUi({
      copy: rec.copy !== undefined ? sanitizeCopy(rec.copy) : undefined,
      chrome: rec.chrome !== undefined ? sanitizeChrome(rec.chrome) : undefined,
      assist: rec.assist !== undefined ? sanitizeAssist(rec.assist) : undefined,
      vault: rec.vault !== undefined ? sanitizeVault(rec.vault) : undefined,
    });
  }
  const s = useAtlas.getState();
  persistSchema(s.schema, true);
  persistWorld(s.floors, s.rooms, true, s.fixtures, {
    characters: s.characters,
    tokens: s.tokens,
  });
  ensureRoomSelected();
  return true;
}

export function roomMatches(
  room: Room,
  schema: PropDef[],
  filters: Record<string, string>,
  query: string,
  tokens?: Record<string, TokenPos>,
): boolean {
  const props = room.props ?? {};
  for (const def of schema) {
    if (!def.filterable) continue;
    const filter = filters[def.id];
    if (!filter || filter === "tous") continue;
    const value = readProp(props, def);
    if (def.type === "tags") {
      const ids = Array.isArray(value) ? value : [];
      if (!ids.includes(filter)) return false;
    } else if (def.type === "choice" || def.type === "preset") {
      if (value !== filter) return false;
    } else if (def.type === "toggle") {
      const on = value === true;
      if (filter === "oui" && !on) return false;
      if (filter === "non" && on) return false;
    } else if (def.type === "token") {
      if (!tokens || tokens[filter]?.roomId !== room.id) return false;
    } else if (
      !String(value ?? "")
        .toLowerCase()
        .includes(filter.toLowerCase())
    ) {
      return false;
    }
  }
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const hay = `${room.name} ${room.label} ${room.description}`.toLowerCase();
  return hay.includes(q);
}
