import { create } from "zustand";
import { type Theme } from "../theme";
import { sanitizeTheme, useThemeStore } from "../theme-store";
import { IDB_CATALOG, openAtlasDb } from "./idb";
import { uid } from "./props";
import {
  applyConfigPayload,
  captureConfigPayload,
  isPersistReady,
  useAtlas,
  type ConfigPayload,
} from "./store";

export const SAVE_FILE_KIND = "atlas-bellarosa-save";
export const SAVE_FILE_VERSION = 2;
const LS_KEY = "atlas-bellarosa-saves";
const MAX_NAMED = 24;
const MAX_AUTO = 12;
const AUTO_WAIT_MS = 900;

export type SaveRecord = {
  id: string;
  name: string;
  kind: "named" | "auto";
  savedAt: number;
  payload: ConfigPayload;
};

export type SaveFile = {
  kind: typeof SAVE_FILE_KIND;
  version: number;
  name: string;
  savedAt: number;
  payload: ConfigPayload;
};

type Catalog = { named: SaveRecord[]; autos: SaveRecord[] };

type SaveState = {
  named: SaveRecord[];
  autos: SaveRecord[];
  loaded: boolean;
  lastAutoAt: number | null;
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function asConfig(raw: unknown): ConfigPayload | null {
  if (!raw || typeof raw !== "object") return null;
  const t = raw as Record<string, unknown>;
  const source =
    t.payload && typeof t.payload === "object"
      ? (t.payload as Record<string, unknown>)
      : t;
  if (
    source.schema === undefined &&
    source.floors === undefined &&
    source.rooms === undefined &&
    source.appearance === undefined &&
    source.edits === undefined
  ) {
    return null;
  }
  return {
    schema: (source.schema as ConfigPayload["schema"]) ?? [],
    floors: (source.floors as ConfigPayload["floors"]) ?? [],
    rooms: (source.rooms as ConfigPayload["rooms"]) ?? [],
    fixtures: (source.fixtures as ConfigPayload["fixtures"]) ?? [],
    characters: (source.characters as ConfigPayload["characters"]) ?? [],
    tokens: (source.tokens as ConfigPayload["tokens"]) ?? {},
    appearance: source.appearance,
    copy: source.copy,
    chrome: source.chrome,
  };
}

function fingerprint(payload: ConfigPayload) {
  return JSON.stringify({
    schema: payload.schema,
    floors: payload.floors,
    rooms: payload.rooms,
    fixtures: payload.fixtures ?? [],
    characters: payload.characters ?? [],
    tokens: payload.tokens ?? {},
    appearance: payload.appearance,
    copy: payload.copy,
    chrome: payload.chrome,
  });
}

function mergeById(list: SaveRecord[]) {
  const map = new Map<string, SaveRecord>();
  for (const item of list) {
    const prev = map.get(item.id);
    if (!prev || item.savedAt >= prev.savedAt) map.set(item.id, item);
  }
  return [...map.values()].sort((a, b) => b.savedAt - a.savedAt);
}

function sanitizeRecord(raw: unknown): SaveRecord | null {
  if (!raw || typeof raw !== "object") return null;
  const t = raw as Record<string, unknown>;
  const id = typeof t.id === "string" && t.id ? t.id : "";
  const name = typeof t.name === "string" ? t.name.trim() : "";
  const savedAt = typeof t.savedAt === "number" ? t.savedAt : 0;
  const kind = t.kind === "auto" ? "auto" : "named";
  const payload = asConfig(t.payload ?? t);
  if (!id || !savedAt || !payload) return null;
  return {
    id,
    name: name || (kind === "auto" ? "Copie automatique" : "Réglages"),
    kind,
    savedAt,
    payload,
  };
}

function sanitizeCatalog(raw: unknown): Catalog {
  if (!raw || typeof raw !== "object") return { named: [], autos: [] };
  const t = raw as Record<string, unknown>;
  const named: SaveRecord[] = [];
  const autos: SaveRecord[] = [];
  if (Array.isArray(t.named)) {
    for (const item of t.named) {
      const rec = sanitizeRecord(item);
      if (rec) named.push({ ...rec, kind: "named" });
    }
  }
  if (Array.isArray(t.autos)) {
    for (const item of t.autos) {
      const rec = sanitizeRecord(item);
      if (rec) autos.push({ ...rec, kind: "auto" });
    }
  }
  return {
    named: mergeById(named).slice(0, MAX_NAMED),
    autos: mergeById(autos).slice(0, MAX_AUTO),
  };
}

function mergeCatalogs(a: Catalog, b: Catalog): Catalog {
  return {
    named: mergeById([...a.named, ...b.named]).slice(0, MAX_NAMED),
    autos: mergeById([...a.autos, ...b.autos]).slice(0, MAX_AUTO),
  };
}

function readLocal(): Catalog {
  if (typeof window === "undefined") return { named: [], autos: [] };
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { named: [], autos: [] };
    return sanitizeCatalog(JSON.parse(raw));
  } catch {
    return { named: [], autos: [] };
  }
}

function writeLocal(catalog: Catalog) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS_KEY, JSON.stringify(catalog));
}

function openDb(): Promise<IDBDatabase | null> {
  return openAtlasDb();
}

async function readIdb(): Promise<Catalog> {
  const db = await openDb();
  if (!db) return { named: [], autos: [] };
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_CATALOG, "readonly");
      const req = tx.objectStore(IDB_CATALOG).get("main");
      req.onsuccess = () => resolve(sanitizeCatalog(req.result));
      req.onerror = () => resolve({ named: [], autos: [] });
    } catch {
      resolve({ named: [], autos: [] });
    }
  });
}

async function writeIdb(catalog: Catalog) {
  const db = await openDb();
  if (!db) return;
  try {
    const tx = db.transaction(IDB_CATALOG, "readwrite");
    tx.objectStore(IDB_CATALOG).put(catalog, "main");
  } catch {
    /* ignore */
  }
}

function persistCatalog(catalog: Catalog) {
  try {
    writeLocal(catalog);
  } catch {
    /* quota */
  }
  void writeIdb(catalog);
}

export const useSaveCatalog = create<SaveState>(() => ({
  named: [],
  autos: [],
  loaded: false,
  lastAutoAt: null,
}));

function setCatalog(catalog: Catalog) {
  useSaveCatalog.setState({
    named: catalog.named,
    autos: catalog.autos,
    loaded: true,
    lastAutoAt: catalog.autos[0]?.savedAt ?? useSaveCatalog.getState().lastAutoAt,
  });
  persistCatalog(catalog);
}

export async function hydrateSaves() {
  if (typeof window === "undefined") return;
  const local = readLocal();
  const remote = await readIdb();
  const merged = mergeCatalogs(local, remote);
  useSaveCatalog.setState({
    named: merged.named,
    autos: merged.autos,
    loaded: true,
    lastAutoAt: merged.autos[0]?.savedAt ?? null,
  });
  persistCatalog(merged);
}

export function appearanceOf(payload: ConfigPayload): Theme | null {
  return sanitizeTheme(payload.appearance);
}

export function saveBlurb(payload: ConfigPayload) {
  const nProps = payload.schema?.length ?? 0;
  const nRooms = payload.rooms?.length ?? 0;
  const nFloors = payload.floors?.length ?? 0;
  const parts: string[] = [];
  parts.push("Apparence personnalisée");
  parts.push(
    nProps === 0
      ? "Sans propriétés"
      : `${nProps} propriété${nProps > 1 ? "s" : ""}`,
  );
  parts.push(
    `${nFloors} étage${nFloors > 1 ? "s" : ""} · ${nRooms} pièce${nRooms > 1 ? "s" : ""}`,
  );
  return parts.join(" · ");
}

export function formatSavedAt(ts: number) {
  return new Date(ts).toLocaleString("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export function defaultSaveName() {
  const now = new Date();
  return `Réglages ${now.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}`;
}

export function createNamedSave(name: string): SaveRecord {
  const trimmed = name.trim() || defaultSaveName();
  const record: SaveRecord = {
    id: uid("save"),
    name: trimmed.slice(0, 64),
    kind: "named",
    savedAt: Date.now(),
    payload: captureConfigPayload(),
  };
  const state = useSaveCatalog.getState();
  setCatalog({
    named: mergeById([record, ...state.named]).slice(0, MAX_NAMED),
    autos: state.autos,
  });
  lastFingerprint = fingerprint(record.payload);
  return record;
}

export function overwriteSave(id: string): SaveRecord | null {
  const state = useSaveCatalog.getState();
  const prev = state.named.find((s) => s.id === id);
  if (!prev) return null;
  const next: SaveRecord = {
    ...prev,
    savedAt: Date.now(),
    payload: captureConfigPayload(),
  };
  setCatalog({
    named: mergeById([next, ...state.named]).slice(0, MAX_NAMED),
    autos: state.autos,
  });
  lastFingerprint = fingerprint(next.payload);
  return next;
}

export function deleteSave(id: string) {
  const state = useSaveCatalog.getState();
  setCatalog({
    named: state.named.filter((s) => s.id !== id),
    autos: state.autos.filter((s) => s.id !== id),
  });
}

export function restoreSave(id: string): boolean {
  const state = useSaveCatalog.getState();
  const rec =
    state.named.find((s) => s.id === id) ??
    state.autos.find((s) => s.id === id);
  if (!rec) return false;
  const ok = applyConfigPayload(clone(rec.payload));
  if (ok) lastFingerprint = fingerprint(rec.payload);
  return ok;
}

export function toSaveFile(
  record: Pick<SaveRecord, "name" | "savedAt" | "payload">,
): SaveFile {
  return {
    kind: SAVE_FILE_KIND,
    version: SAVE_FILE_VERSION,
    name: record.name,
    savedAt: record.savedAt,
    payload: record.payload,
  };
}

export function parseSaveFile(raw: unknown): SaveFile | null {
  const payload = asConfig(raw);
  if (!payload) return null;
  const t = raw as Record<string, unknown>;
  return {
    kind: SAVE_FILE_KIND,
    version: typeof t.version === "number" ? t.version : SAVE_FILE_VERSION,
    name:
      typeof t.name === "string" && t.name.trim()
        ? t.name.trim()
        : "Réglages importés",
    savedAt: typeof t.savedAt === "number" ? t.savedAt : Date.now(),
    payload,
  };
}

export function importSaveFile(raw: unknown, restore = true): SaveRecord | null {
  const file = parseSaveFile(raw);
  if (!file) return null;
  const record: SaveRecord = {
    id: uid("save"),
    name: file.name.slice(0, 64),
    kind: "named",
    savedAt: Date.now(),
    payload: file.payload,
  };
  const state = useSaveCatalog.getState();
  setCatalog({
    named: mergeById([record, ...state.named]).slice(0, MAX_NAMED),
    autos: state.autos,
  });
  if (restore) {
    applyConfigPayload(clone(file.payload));
    lastFingerprint = fingerprint(file.payload);
  }
  return record;
}

export function downloadSave(
  record: Pick<SaveRecord, "name" | "savedAt" | "payload">,
) {
  const file = toSaveFile(record);
  const blob = new Blob([JSON.stringify(file, null, 2)], {
    type: "application/json",
  });
  const slug =
    file.name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 32) || "reglages";
  const day = new Date(file.savedAt).toISOString().slice(0, 10);
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `bellarosa-reglages-${day}-${slug}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export function downloadCurrent(name?: string) {
  downloadSave({
    name: name?.trim() || defaultSaveName(),
    savedAt: Date.now(),
    payload: captureConfigPayload(),
  });
}

export function noteConfigSaved(payload: ConfigPayload) {
  lastFingerprint = fingerprint(payload);
}

function journalAutosave() {
  if (!isPersistReady()) return;
  const payload = captureConfigPayload();
  const fp = fingerprint(payload);
  if (fp === lastFingerprint) return;
  lastFingerprint = fp;
  const record: SaveRecord = {
    id: uid("auto"),
    name: "Copie automatique",
    kind: "auto",
    savedAt: Date.now(),
    payload,
  };
  const state = useSaveCatalog.getState();
  setCatalog({
    named: state.named,
    autos: mergeById([record, ...state.autos]).slice(0, MAX_AUTO),
  });
}

let lastFingerprint = "";
let autoTimer: ReturnType<typeof setTimeout> | undefined;
let autosaveStarted = false;

function scheduleAutosave() {
  if (!isPersistReady()) return;
  if (autoTimer) clearTimeout(autoTimer);
  autoTimer = setTimeout(journalAutosave, AUTO_WAIT_MS);
}

export function startAutosave() {
  if (typeof window === "undefined" || autosaveStarted) return;
  autosaveStarted = true;
  lastFingerprint = fingerprint(captureConfigPayload());
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
    scheduleAutosave();
  });
  useThemeStore.subscribe(() => scheduleAutosave());
  window.addEventListener("pagehide", () => {
    if (autoTimer) {
      clearTimeout(autoTimer);
      autoTimer = undefined;
    }
    journalAutosave();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") journalAutosave();
  });
}
