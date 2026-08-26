import { coerceValue, DEFAULT_PROPS, readProp, seedProps } from "./props";
import type { PropDef, PropValue, Room, RoomEdit, RoomStep } from "./types";

function asStringMap(raw: unknown): Record<string, PropValue> | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const out: Record<string, PropValue> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!key.trim()) continue;
    if (typeof value === "string") out[key] = value;
    else if (Array.isArray(value)) {
      out[key] = value.filter((x): x is string => typeof x === "string");
    }
  }
  return out;
}

function sanitizeSteps(raw: unknown): RoomStep[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const out: RoomStep[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const t = item as Record<string, unknown>;
    const label = typeof t.label === "string" ? t.label : "";
    const idRaw = typeof t.id === "string" ? t.id.trim() : "";
    const id = idRaw || `step-${out.length + 1}`;
    if (seen.has(id)) continue;
    seen.add(id);
    out.push({ id, label, done: t.done === true });
  }
  return out;
}

export function sanitizeEdit(raw: unknown): RoomEdit | null {
  if (!raw || typeof raw !== "object") return null;
  const t = raw as Record<string, unknown>;
  const edit: RoomEdit = {};
  if (typeof t.name === "string" && t.name.trim()) edit.name = t.name.trim();
  if (typeof t.label === "string" && t.label.trim()) edit.label = t.label.trim();
  if (typeof t.description === "string") edit.description = t.description;
  const props = asStringMap(t.props);
  if (props && Object.keys(props).length) edit.props = props;
  const steps = sanitizeSteps(t.steps);
  if (steps) edit.steps = steps;
  if (Object.keys(edit).length === 0) return null;
  return edit;
}

export function sanitizeEdits(raw: unknown): Record<string, RoomEdit> {
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, RoomEdit> = {};
  for (const [id, value] of Object.entries(raw as Record<string, unknown>)) {
    const edit = sanitizeEdit(value);
    if (edit) out[id] = edit;
  }
  return out;
}

export function mergeRoom(
  room: Room,
  edit?: RoomEdit,
  schema: PropDef[] = DEFAULT_PROPS,
): Room {
  const seed = seedProps(room, schema);
  const overlay = edit?.props ?? {};
  const merged: Record<string, PropValue> = { ...seed, ...overlay };
  const props: Record<string, PropValue> = {};
  for (const def of schema) {
    props[def.id] = readProp(merged, def);
  }
  for (const [key, value] of Object.entries(overlay)) {
    if (props[key] === undefined) props[key] = value;
  }
  return {
    ...room,
    name: edit?.name ?? room.name,
    label: edit?.label ?? room.label,
    description: edit?.description ?? room.description,
    props,
    steps: edit?.steps ?? room.steps ?? [],
  };
}

export function resolveRoom(
  id: string,
  rooms: Room[],
  schema: PropDef[] = DEFAULT_PROPS,
  edit?: RoomEdit,
): Room | undefined {
  const base = rooms.find((r) => r.id === id);
  if (!base) return undefined;
  return mergeRoom(base, edit, schema);
}

export function resolveFloor(
  floorId: string,
  rooms: Room[],
  schema: PropDef[] = DEFAULT_PROPS,
): Room[] {
  return rooms
    .filter((room) => room.floorId === floorId)
    .map((room) => mergeRoom(room, undefined, schema));
}

export function coerceRoomProps(
  props: Record<string, PropValue>,
  schema: PropDef[],
): Record<string, PropValue> {
  const out: Record<string, PropValue> = { ...props };
  for (const def of schema) {
    out[def.id] = coerceValue(def, readProp(props, def));
  }
  return out;
}
