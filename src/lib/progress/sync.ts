/**
 * Une seule session : le coffre EST la session locale.
 *
 * Boot  : coffre → mémoire + localStorage
 * Suite : chaque modification locale → localStorage + coffre (POST /api/atlas/cloud)
 */
import { applyPersistedTheme, persistTheme, sanitizeTheme } from "../theme-store";
import { sanitizeAssist, sanitizeVault, useUiStore } from "../map/ui";
import type { Character, FloorMeta, MapFixture, Room, RoomGroup, TokenPos } from "../map/types";
import type { TerrainMap } from "../map/terrain";
import snap from "./home-plan.json";
import { ACCOUNT_EMAIL, OWNER } from "./owner";

export { ACCOUNT_EMAIL, OWNER } from "./owner";

export const COFFRE_BOOT_SCRIPT = `(function(){try{
  if(localStorage.getItem("atlas-bellarosa-prefs")||localStorage.getItem("atlas-bellarosa-world")||localStorage.getItem("atlas-bellarosa-v1"))return;
}catch(e){}})();`;

export const COFFRE_KEY = "atlas-bellarosa-world";
export const PREFS_KEY = "atlas-bellarosa-prefs";
const CLOUD_URL = "/api/atlas/cloud";

export type AccountPayload = {
  schema?: unknown[];
  floors: FloorMeta[];
  rooms: Room[];
  fixtures: MapFixture[];
  characters?: Character[];
  tokens?: Record<string, TokenPos>;
  groups?: RoomGroup[];
  terrain?: TerrainMap;
  appearance?: unknown;
  copy?: unknown;
  chrome?: unknown;
  assist?: unknown;
  vault?: unknown;
  scenes?: unknown;
};

export function coffrePayload(): AccountPayload {
  return snap.payload as unknown as AccountPayload;
}

export function worldWeight(p: {
  rooms?: unknown;
  floors?: unknown;
  fixtures?: unknown;
} | null | undefined) {
  if (!p) return 0;
  const rooms = Array.isArray(p.rooms) ? p.rooms.length : 0;
  const floors = Array.isArray(p.floors) ? p.floors.length : 0;
  const fixtures = Array.isArray(p.fixtures) ? p.fixtures.length : 0;
  return rooms * 100 + floors * 10 + fixtures;
}

function writeLocal(payload: AccountPayload, savedAt = Date.now()) {
  if (typeof window === "undefined") return;
  const world = {
    floors: payload.floors,
    rooms: payload.rooms,
    fixtures: payload.fixtures ?? [],
    characters: payload.characters ?? [],
    tokens: payload.tokens ?? {},
    groups: payload.groups ?? [],
    terrain: payload.terrain ?? {},
  };
  const prefs = {
    savedAt,
    payload,
  };
  try {
    localStorage.setItem(COFFRE_KEY, JSON.stringify(world));
    localStorage.setItem(`${COFFRE_KEY}-backup`, JSON.stringify(world));
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    /* quota */
  }
}

async function writeCoffreRemote(payload: AccountPayload) {
  if (typeof window === "undefined") return;
  try {
    await fetch(CLOUD_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        savedAt: Date.now(),
        email: ACCOUNT_EMAIL,
        displayName: OWNER.displayName,
        grokHandle: OWNER.grokHandle,
        userId: OWNER.id,
        payloadJson: JSON.stringify(payload),
      }),
    });
  } catch {
    /* hors ligne : le local reste la source jusqu’au prochain envoi */
  }
}

export async function pullCoffre(): Promise<{ savedAt: number; payload: AccountPayload } | null> {
  if (typeof window === "undefined") return null;
  try {
    const res = await fetch(CLOUD_URL, { credentials: "include" });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      savedAt?: number;
      payload?: AccountPayload;
      payloadJson?: string;
    };
    const payload =
      data.payload ??
      (typeof data.payloadJson === "string"
        ? (JSON.parse(data.payloadJson) as AccountPayload)
        : null);
    if (!payload?.floors) return null;
    return { savedAt: data.savedAt ?? Date.now(), payload };
  } catch {
    return null;
  }
}

let syncTimer: ReturnType<typeof setTimeout> | undefined;
let lastFp = "";
let bootOpen = false;

export function fingerprint(payload: AccountPayload) {
  return JSON.stringify({
    schema: payload.schema,
    floors: payload.floors,
    rooms: payload.rooms,
    fixtures: payload.fixtures,
    groups: payload.groups,
    terrain: payload.terrain,
    appearance: payload.appearance,
    copy: payload.copy,
    chrome: payload.chrome,
    assist: payload.assist,
    vault: payload.vault,
  });
}

export function coffreBootReady() {
  return bootOpen;
}

export function openCoffreBoot() {
  bootOpen = true;
}

/** Écrit la session locale ET le coffre (debounced). Pas pendant le boot. */
export function syncLocalToCoffre(payload: AccountPayload) {
  if (!bootOpen) {
    writeLocal(payload);
    lastFp = fingerprint(payload);
    return;
  }
  if (worldWeight(payload) < worldWeight(coffrePayload()) && payload.rooms.length === 0) {
    return;
  }
  const fp = fingerprint(payload);
  if (fp === lastFp) return;
  lastFp = fp;
  writeLocal(payload);
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    void writeCoffreRemote(payload);
  }, 400);
}

export type ApplyStores = {
  setWorld: (patch: {
    floors: FloorMeta[];
    rooms: Room[];
    fixtures: MapFixture[];
    characters?: Character[];
    tokens?: Record<string, TokenPos>;
    groups?: RoomGroup[];
    floorId: string;
    selectedId: string | null;
  }) => void;
};

function localWorldWeight() {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem(COFFRE_KEY);
    if (!raw) return 0;
    return worldWeight(JSON.parse(raw) as AccountPayload);
  } catch {
    return 0;
  }
}

/** Coffre figé → stores seulement si le local est vide. Ne réécrit pas le coffre. */
export function applyCoffreToLocal(setWorld: ApplyStores["setWorld"]) {
  if (localWorldWeight() > 0) return;
  const p = coffrePayload();
  if (!p.floors?.length) return;
  const rooms = p.rooms ?? [];
  const floorId =
    p.floors.find((floor) => floor.id === "etage-1")?.id ?? p.floors[0]!.id;
  const selectedId =
    rooms.find((room) => room.floorId === floorId)?.id ?? rooms[0]?.id ?? null;
  setWorld({
    floors: p.floors,
    rooms,
    fixtures: p.fixtures ?? [],
    characters: p.characters,
    tokens: p.tokens,
    groups: p.groups,
    floorId,
    selectedId,
  });
  const theme = sanitizeTheme(p.appearance);
  if (theme) {
    applyPersistedTheme(theme);
    persistTheme(theme);
  }
  if (p.copy || p.chrome || p.assist || p.vault) {
    useUiStore.setState((s) => ({
      copy: { ...s.copy, ...(p.copy ?? {}) },
      chrome: { ...s.chrome, ...(p.chrome ?? {}) },
      assist: { ...s.assist, ...sanitizeAssist(p.assist ?? s.assist) },
      vault: { ...s.vault, ...sanitizeVault(p.vault ?? s.vault) },
    }));
  }
  lastFp = fingerprint(p);
}
