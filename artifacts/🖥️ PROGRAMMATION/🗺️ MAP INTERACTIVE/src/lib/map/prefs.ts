import { create } from "zustand";
import { DEFAULT_THEME } from "../theme";
import {
  persistTheme,
  sanitizeTheme,
  useThemeStore,
  loadPersisted,
} from "../theme-store";
import { IDB_PREFS, getCatalog, openAtlasDb } from "./idb";
import {
  factoryFloors,
  factoryRooms,
  isFactoryWorld,
  isLegacyFactoryWorld,
  sanitizeCharacters,
  sanitizeFixtures,
  sanitizeFloors,
  sanitizeRooms,
  sanitizeTokenMap,
  scrubLegacyWorld,
} from "./house";
import {
  cloneSchema,
  sanitizeSchema,
  schemasEqual,
  scrubLegacySchema,
} from "./props";
import { loadCloudPrefs, saveCloudPrefs } from "./cloud";
import { noteConfigSaved } from "./saves";
import {
  applyConfigPayload,
  applyDedicatedConfig,
  captureConfigPayload,
  flushLivePersist,
  persistSchema,
  persistWorld,
  useAtlas,
  type ConfigPayload,
} from "./store";
import { DEFAULT_CHROME, DEFAULT_COPY, hasLocalUi, hydrateUi, sanitizeChrome, sanitizeCopy, useUiStore } from "./ui";

const LS_KEY = "atlas-bellarosa-prefs";

export type PrefsRecord = {
  savedAt: number;
  payload: ConfigPayload;
};

type PrefsState = {
  lastSaved: ConfigPayload | null;
  lastSavedAt: number | null;
  saving: boolean;
  loaded: boolean;
};

export const usePrefs = create<PrefsState>(() => ({
  lastSaved: null,
  lastSavedAt: null,
  saving: false,
  loaded: false,
}));

function slimPhotos(raw: unknown) {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    if (!item || typeof item !== "object") return item;
    const t = item as Record<string, unknown>;
    return { id: t.id, name: t.name, src: typeof t.src === "string" ? t.src.length : 0 };
  });
}

function slimRooms(rooms: ConfigPayload["rooms"]) {
  return (rooms ?? []).map((room) => ({
    ...room,
    photos: slimPhotos(room.photos),
  }));
}

function slimFixtures(fixtures: ConfigPayload["fixtures"]) {
  return (fixtures ?? []).map((mark) => ({
    ...mark,
    photos: slimPhotos(mark.photos),
  }));
}

export function fingerprintConfig(payload: ConfigPayload) {
  return JSON.stringify({
    schema: payload.schema,
    floors: payload.floors,
    rooms: slimRooms(payload.rooms),
    fixtures: slimFixtures(payload.fixtures),
    characters: payload.characters ?? [],
    tokens: payload.tokens ?? {},
    appearance: payload.appearance,
    copy: payload.copy ?? DEFAULT_COPY,
    chrome: payload.chrome ?? DEFAULT_CHROME,
  });
}

function factoryPayload(): ConfigPayload {
  return {
    schema: cloneSchema(),
    floors: factoryFloors(),
    rooms: factoryRooms(),
    fixtures: [],
    characters: [],
    tokens: {},
    appearance: DEFAULT_THEME,
    copy: DEFAULT_COPY,
    chrome: DEFAULT_CHROME,
  };
}

export function isFactoryConfig(payload: ConfigPayload) {
  return fingerprintConfig(payload) === fingerprintConfig(factoryPayload());
}

function parseRecord(raw: unknown): PrefsRecord | null {
  if (!raw || typeof raw !== "object") return null;
  const t = raw as Record<string, unknown>;
  const savedAt = typeof t.savedAt === "number" ? t.savedAt : 0;
  const payload = t.payload;
  if (!savedAt || !payload || typeof payload !== "object") return null;
  const p = payload as Record<string, unknown>;
  const floorsRaw = Array.isArray(p.floors) ? sanitizeFloors(p.floors) : factoryFloors();
  const roomsRaw = Array.isArray(p.rooms) ? sanitizeRooms(p.rooms, floorsRaw) : [];
  const fixturesRaw = sanitizeFixtures(p.fixtures, floorsRaw);
  const charactersRaw = sanitizeCharacters(p.characters);
  const tokensRaw = sanitizeTokenMap(p.tokens, roomsRaw, floorsRaw, charactersRaw);
  const world = isLegacyFactoryWorld(floorsRaw, roomsRaw)
    ? scrubLegacyWorld(floorsRaw, roomsRaw, fixturesRaw, charactersRaw, tokensRaw)
    : {
        floors: floorsRaw,
        rooms: roomsRaw,
        fixtures: fixturesRaw,
        characters: charactersRaw,
        tokens: tokensRaw,
      };
  const schemaRaw = sanitizeSchema(p.schema);
  return {
    savedAt,
    payload: {
      schema: scrubLegacySchema(schemaRaw),
      floors: world.floors,
      rooms: world.rooms,
      fixtures: world.fixtures,
      characters: world.characters,
      tokens: world.tokens,
      appearance: p.appearance,
      copy: sanitizeCopy(p.copy),
      chrome: sanitizeChrome(p.chrome),
    },
  };
}

function readLocal(): PrefsRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    return parseRecord(JSON.parse(raw));
  } catch {
    return null;
  }
}

function writeLocal(record: PrefsRecord): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = JSON.stringify(record);
    localStorage.setItem(LS_KEY, raw);
    const check = localStorage.getItem(LS_KEY);
    if (check !== raw) {
      localStorage.setItem(LS_KEY, raw);
    }
    return localStorage.getItem(LS_KEY) === raw;
  } catch {
    return false;
  }
}

async function readIdb(): Promise<PrefsRecord | null> {
  const db = await openAtlasDb();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_PREFS, "readonly");
      const req = tx.objectStore(IDB_PREFS).get("committed");
      req.onsuccess = () => resolve(parseRecord(req.result));
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function writeIdb(record: PrefsRecord): Promise<boolean> {
  const db = await openAtlasDb();
  if (!db) return false;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_PREFS, "readwrite");
      tx.objectStore(IDB_PREFS).put(record, "committed");
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

function newest(records: Array<PrefsRecord | null>): PrefsRecord | null {
  const list = records.filter((r): r is PrefsRecord => Boolean(r));
  const rich = list.filter((r) => !isFactoryConfig(r.payload));
  const pool = rich.length ? rich : list;
  let best: PrefsRecord | null = null;
  for (const rec of pool) {
    if (!best || rec.savedAt >= best.savedAt) best = rec;
  }
  return best;
}

function rememberCommitted(record: PrefsRecord) {
  usePrefs.setState({
    lastSaved: record.payload,
    lastSavedAt: record.savedAt,
    loaded: true,
  });
}

function applyCommitted(
  record: PrefsRecord,
  opts: { appearance?: boolean; ui?: boolean } = {},
) {
  const keepLocalTheme = Boolean(loadPersisted());
  const applyAppearance =
    opts.appearance === true || (!keepLocalTheme && opts.appearance !== false);
  const keepLocalUi = hasLocalUi() && opts.ui !== true;
  applyConfigPayload(record.payload, {
    appearance: applyAppearance,
    ui: !keepLocalUi,
  });
  if (applyAppearance) {
    const theme = sanitizeTheme(record.payload.appearance);
    if (theme) persistTheme(theme);
  }
  if (!keepLocalUi) {
    hydrateUi({ copy: record.payload.copy, chrome: record.payload.chrome });
  }
  flushLivePersist();
  rememberCommitted(record);
  noteConfigSaved(record.payload);
}

let autoApplyAllowed = true;

function tryRecover(record: PrefsRecord): boolean {
  if (autoApplyAllowed) {
    const live = captureConfigPayload();
    if (isFactoryConfig(live) && !isFactoryConfig(record.payload)) {
      applyCommitted(record);
      persistSchema(record.payload.schema, true);
      persistWorld(record.payload.floors, record.payload.rooms, true, record.payload.fixtures, {
        characters: record.payload.characters,
        tokens: record.payload.tokens,
      });
      return true;
    }
  }
  return recoverMissingSlices(record);
}

function recoverMissingSlices(record: PrefsRecord): boolean {
  const live = captureConfigPayload();
  const saved = record.payload;
  const patch: Partial<{
    schema: ConfigPayload["schema"];
    floors: ConfigPayload["floors"];
    rooms: ConfigPayload["rooms"];
    fixtures: ConfigPayload["fixtures"];
    characters: ConfigPayload["characters"];
    tokens: ConfigPayload["tokens"];
    filters: Record<string, string>;
  }> = {};
  const liveSchemaFactory = schemasEqual(live.schema ?? [], cloneSchema());
  const savedSchema = scrubLegacySchema(sanitizeSchema(saved.schema));
  if (liveSchemaFactory && !schemasEqual(savedSchema, cloneSchema())) {
    patch.schema = savedSchema;
    patch.filters = {};
  }
  const liveWorldFactory = isFactoryWorld(
    live.floors ?? [],
    live.rooms ?? [],
    live.fixtures ?? [],
    live.characters ?? [],
  );
  const savedFloors = saved.floors ?? factoryFloors();
  const savedRooms = saved.rooms ?? [];
  const savedFixtures = saved.fixtures ?? [];
  const savedCharacters = saved.characters ?? [];
  const savedTokens = saved.tokens ?? {};
  const savedWorld = scrubLegacyWorld(
    savedFloors,
    savedRooms,
    savedFixtures,
    savedCharacters,
    savedTokens,
  );
  if (
    liveWorldFactory &&
    !isFactoryWorld(
      savedWorld.floors,
      savedWorld.rooms,
      savedWorld.fixtures,
      savedWorld.characters,
    )
  ) {
    patch.floors = savedWorld.floors;
    patch.rooms = savedWorld.rooms;
    patch.fixtures = savedWorld.fixtures;
    patch.characters = savedWorld.characters;
    patch.tokens = savedWorld.tokens;
  }
  if (
    !patch.schema &&
    !patch.floors &&
    !patch.rooms &&
    !patch.fixtures &&
    !patch.characters
  )
    return false;
  useAtlas.setState(patch);
  if (patch.schema) persistSchema(patch.schema);
  if (patch.floors || patch.rooms || patch.fixtures || patch.characters) {
    const s = useAtlas.getState();
    persistWorld(s.floors, s.rooms, true, s.fixtures, {
      characters: s.characters,
      tokens: s.tokens,
    });
  }
  flushLivePersist();
  rememberCommitted(record);
  return true;
}

export function isConfigDirty() {
  const current = captureConfigPayload();
  const last = usePrefs.getState().lastSaved;
  const baseline = last ?? factoryPayload();
  return fingerprintConfig(current) !== fingerprintConfig(baseline);
}

export function useConfigDirty() {
  const lastSavedAt = usePrefs((s) => s.lastSavedAt);
  const loaded = usePrefs((s) => s.loaded);
  const schema = useAtlas((s) => s.schema);
  const floors = useAtlas((s) => s.floors);
  const rooms = useAtlas((s) => s.rooms);
  const fixtures = useAtlas((s) => s.fixtures);
  const characters = useAtlas((s) => s.characters);
  const tokens = useAtlas((s) => s.tokens);
  const appearance = useThemeStore((s) => s.theme);
  const copy = useUiStore((s) => s.copy);
  const chrome = useUiStore((s) => s.chrome);
  if (!loaded) return false;
  const last = usePrefs.getState().lastSaved;
  if (!last) {
    return !isFactoryConfig({
      schema,
      floors,
      rooms,
      fixtures,
      characters,
      tokens,
      appearance,
      copy,
      chrome,
    });
  }
  if (
    last.schema === schema &&
    last.floors === floors &&
    last.rooms === rooms &&
    last.fixtures === fixtures &&
    last.characters === characters &&
    last.tokens === tokens &&
    last.appearance === appearance &&
    last.copy === copy &&
    last.chrome === chrome
  ) {
    return false;
  }
  void lastSavedAt;
  const current: ConfigPayload = {
    schema,
    floors,
    rooms,
    fixtures,
    characters,
    tokens,
    appearance,
    copy,
    chrome,
  };
  return fingerprintConfig(current) !== fingerprintConfig(last);
}

function persistRecordLocal(record: PrefsRecord): boolean {
  const lsOk = writeLocal(record);
  void writeIdb(record);
  const theme = sanitizeTheme(record.payload.appearance);
  if (theme) persistTheme(theme);
  persistSchema(record.payload.schema, true);
  persistWorld(record.payload.floors, record.payload.rooms, true, record.payload.fixtures, {
    characters: record.payload.characters,
    tokens: record.payload.tokens,
  });
  hydrateUi({ copy: record.payload.copy, chrome: record.payload.chrome });
  flushLivePersist();
  return lsOk;
}

function persistRecordCloud(record: PrefsRecord) {
  void saveCloudPrefs({
    data: {
      savedAt: record.savedAt,
      payloadJson: JSON.stringify(record.payload),
    },
  }).catch(() => undefined);
}

async function persistRecord(record: PrefsRecord): Promise<boolean> {
  const lsOk = persistRecordLocal(record);
  persistRecordCloud(record);
  return lsOk;
}

export async function adoptPreferences(payload: ConfigPayload): Promise<boolean> {
  const record: PrefsRecord = { savedAt: Date.now(), payload };
  usePrefs.setState({
    lastSaved: payload,
    lastSavedAt: record.savedAt,
  });
  noteConfigSaved(payload);
  return persistRecord(record);
}

let hydratePromise: Promise<void> | null = null;

export function hydratePrefs(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (!hydratePromise) {
    applyLocalPrefs();
    hydratePromise = doHydratePrefs();
  }
  return hydratePromise;
}

function applyLocalPrefs() {
  const local = readLocal();
  if (local) {
    rememberCommitted(local);
    tryRecover(local);
    return local;
  }
  usePrefs.setState({ loaded: true });
  return null;
}

async function doHydratePrefs() {
  startPrefsGuards();
  try {
    applyLocalPrefs();

    let server: PrefsRecord | null = null;
    let idb: PrefsRecord | null = null;
    let catalogSchema: unknown = null;
    let catalogWorld: unknown = null;
    try {
      const [cloud, remote, catSchema, catWorld] = await Promise.all([
        Promise.race([
          loadCloudPrefs().catch(() => null),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 700)),
        ]),
        readIdb(),
        getCatalog("schema"),
        getCatalog("world"),
      ]);
      try {
        server = cloud
          ? parseRecord({
              savedAt: cloud.savedAt,
              payload: JSON.parse(cloud.payloadJson),
            })
          : null;
      } catch {
        server = null;
      }
      idb = remote;
      catalogSchema = catSchema;
      catalogWorld = catWorld;
    } catch {
      /* keep local */
    }

    const best = newest([server, local, idb]);
    if (best) {
      rememberCommitted(best);
      tryRecover(best);
      try {
        writeLocal(best);
        void writeIdb(best);
      } catch {
        /* ignore */
      }
    } else {
      usePrefs.setState({ loaded: true });
    }

    const liveAfter = captureConfigPayload();
    if (Array.isArray(catalogSchema)) {
      const schema = scrubLegacySchema(sanitizeSchema(catalogSchema));
      if (
        schemasEqual(liveAfter.schema, cloneSchema()) &&
        !schemasEqual(schema, cloneSchema())
      ) {
        useAtlas.setState({ schema, filters: {} });
        persistSchema(schema, true);
      }
    }
    if (catalogWorld && typeof catalogWorld === "object") {
      const rec = catalogWorld as Record<string, unknown>;
      const floors = sanitizeFloors(rec.floors);
      const rooms = sanitizeRooms(rec.rooms, floors);
      const fixtures = sanitizeFixtures(rec.fixtures, floors);
      const characters = sanitizeCharacters(rec.characters);
      const tokens = sanitizeTokenMap(rec.tokens, rooms, floors, characters);
      const world = scrubLegacyWorld(floors, rooms, fixtures, characters, tokens);
      const live = useAtlas.getState();
      if (
        isFactoryWorld(live.floors, live.rooms, live.fixtures, live.characters) &&
        !isFactoryWorld(world.floors, world.rooms, world.fixtures, world.characters)
      ) {
        useAtlas.setState({
          floors: world.floors,
          rooms: world.rooms,
          fixtures: world.fixtures,
          characters: world.characters,
          tokens: world.tokens,
        });
        persistWorld(world.floors, world.rooms, true, world.fixtures, {
          characters: world.characters,
          tokens: world.tokens,
        });
      }
    }
  } catch {
    usePrefs.setState({ loaded: true });
  } finally {
    try {
      applyDedicatedConfig();
    } catch {
      /* keep going */
    }
    autoApplyAllowed = false;
    if (typeof document !== "undefined") {
      document.documentElement.dataset.prefsHydrated = "1";
    }
  }
}

export async function restoreCloudPreferences(): Promise<boolean> {
  try {
    const cloud = await loadCloudPrefs();
    const record = cloud
      ? parseRecord({
          savedAt: cloud.savedAt,
          payload: JSON.parse(cloud.payloadJson),
        })
      : null;
    if (!record) return false;
    applyCommitted(record, { appearance: true, ui: true });
    writeLocal(record);
    void writeIdb(record);
    return true;
  } catch {
    return false;
  }
}

export async function savePreferences(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const payload = captureConfigPayload();
  const record: PrefsRecord = { savedAt: Date.now(), payload };
  usePrefs.setState({ saving: true });
  try {
    const ok = await persistRecord(record);
    if (!ok) writeLocal(record);
    const verified = readLocal();
    const match =
      verified &&
      fingerprintConfig(verified.payload) === fingerprintConfig(payload);
    if (!ok && !match) {
      usePrefs.setState({ saving: false });
      return false;
    }
    usePrefs.setState({
      lastSaved: payload,
      lastSavedAt: record.savedAt,
      saving: false,
    });
    noteConfigSaved(payload);
    lastCloudFp = fingerprintConfig(payload);
    return true;
  } catch {
    usePrefs.setState({ saving: false });
    return false;
  }
}

export function recoverPrefsIfWiped() {
  if (!autoApplyAllowed) return;
  const saved = usePrefs.getState().lastSaved ?? readLocal()?.payload;
  if (!saved) return;
  const current = captureConfigPayload();
  if (isFactoryConfig(current) && !isFactoryConfig(saved)) {
    applyCommitted({
      savedAt: usePrefs.getState().lastSavedAt ?? Date.now(),
      payload: saved,
    });
  }
}

let guardsStarted = false;

function startPrefsGuards() {
  if (typeof window === "undefined" || guardsStarted) return;
  guardsStarted = true;
  window.addEventListener("beforeunload", (event) => {
    if (!isConfigDirty()) return;
    event.preventDefault();
    event.returnValue = "";
  });
  window.addEventListener("storage", (event) => {
    if (event.key !== LS_KEY || !event.newValue) return;
    try {
      const rec = parseRecord(JSON.parse(event.newValue));
      if (!rec) return;
      rememberCommitted(rec);
      tryRecover(rec);
    } catch {
      /* ignore */
    }
  });
}

let cloudTimer: ReturnType<typeof setTimeout> | undefined;
let cloudAutosaveStarted = false;
let lastCloudFp = "";
let cloudBusy = false;

async function flushCloudAutosave() {
  if (cloudTimer) {
    clearTimeout(cloudTimer);
    cloudTimer = undefined;
  }
  if (cloudBusy) return;
  const payload = captureConfigPayload();
  const last = usePrefs.getState().lastSaved;
  if (isFactoryConfig(payload) && last && !isFactoryConfig(last)) {
    return;
  }
  const fp = fingerprintConfig(payload);
  if (fp === lastCloudFp) return;
  cloudBusy = true;
  try {
    const record: PrefsRecord = { savedAt: Date.now(), payload };
    writeLocal(record);
    void writeIdb(record);
    persistRecordCloud(record);
    lastCloudFp = fp;
    rememberCommitted(record);
    noteConfigSaved(payload);
  } catch {
    /* signed out or network — silent */
  } finally {
    cloudBusy = false;
  }
}

function scheduleCloudSave() {
  if (cloudTimer) clearTimeout(cloudTimer);
  cloudTimer = setTimeout(() => {
    void flushCloudAutosave();
  }, 1400);
}

/** Debounced cloud copy of the live plan when a session is connected. */
export function startCloudAutosave() {
  if (typeof window === "undefined" || cloudAutosaveStarted) return;
  cloudAutosaveStarted = true;
  lastCloudFp = fingerprintConfig(captureConfigPayload());
  useAtlas.subscribe((s, prev) => {
    if (
      s.schema === prev.schema &&
      s.floors === prev.floors &&
      s.rooms === prev.rooms &&
      s.fixtures === prev.fixtures &&
      s.characters === prev.characters &&
      s.tokens === prev.tokens
    )
      return;
    scheduleCloudSave();
  });
  useUiStore.subscribe(() => scheduleCloudSave());
  window.addEventListener("pagehide", () => {
    void flushCloudAutosave();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") void flushCloudAutosave();
  });
}

