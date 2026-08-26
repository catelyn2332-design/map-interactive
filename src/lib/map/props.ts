import type {
  PropDef,
  PropOption,
  PropTone,
  PropType,
  PropValue,
  Room,
  RoomEdit,
} from "./types";

export const PROP_TYPES: Array<{ id: PropType; label: string; hint: string }> = [
  { id: "choice", label: "Choix unique", hint: "Une valeur dans une liste" },
  { id: "tags", label: "Choix multiple", hint: "Plusieurs valeurs" },
  { id: "text", label: "Texte", hint: "Saisie libre" },
];

export const TONE_OPTIONS: Array<{ id: PropTone; label: string }> = [
  { id: "default", label: "Neutre" },
  { id: "sage", label: "Sage" },
  { id: "stone", label: "Pierre" },
  { id: "clay", label: "Alerte" },
  { id: "ink", label: "Encre" },
];

/** Empty on purpose: the atlas is a sandbox. Accès / Style are not built-in. */
export const DEFAULT_PROPS: PropDef[] = [];

const TONES: PropTone[] = ["default", "sage", "stone", "clay", "ink"];
const TYPES: PropType[] = ["text", "choice", "tags"];

export function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function slug(raw: string) {
  return raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32);
}

export function newProp(partial?: Partial<PropDef>): PropDef {
  return {
    id: uid("p"),
    name: "Nouvelle propriété",
    type: "choice",
    options: [],
    filterable: true,
    mapTint: false,
    ...partial,
  };
}

export function newOption(label: string, used: Set<string>): PropOption {
  const base = slug(label) || uid("o");
  let id = base;
  let n = 2;
  while (used.has(id)) {
    id = `${base}-${n}`;
    n += 1;
  }
  used.add(id);
  return { id, label: label.trim() || "Option" };
}

function asTone(v: unknown): PropTone | undefined {
  return typeof v === "string" && TONES.includes(v as PropTone)
    ? (v as PropTone)
    : undefined;
}

function asType(v: unknown): PropType | undefined {
  return typeof v === "string" && TYPES.includes(v as PropType)
    ? (v as PropType)
    : undefined;
}

export function sanitizeOption(raw: unknown): PropOption | null {
  if (!raw || typeof raw !== "object") return null;
  const t = raw as Record<string, unknown>;
  const label = typeof t.label === "string" ? t.label.trim() : "";
  const idRaw = typeof t.id === "string" ? t.id.trim() : "";
  const id = idRaw || slug(label);
  if (!id) return null;
  const option: PropOption = { id, label: label || id };
  const tone = asTone(t.tone);
  if (tone && tone !== "default") option.tone = tone;
  return option;
}

export function sanitizeProp(raw: unknown): PropDef | null {
  if (!raw || typeof raw !== "object") return null;
  const t = raw as Record<string, unknown>;
  const id = typeof t.id === "string" ? t.id.trim() : "";
  if (!id) return null;
  const name = typeof t.name === "string" ? t.name.trim() : "";
  const type = asType(t.type) ?? "text";
  const seen = new Set<string>();
  const options: PropOption[] = [];
  if (Array.isArray(t.options)) {
    for (const item of t.options) {
      const option = sanitizeOption(item);
      if (!option || seen.has(option.id)) continue;
      seen.add(option.id);
      options.push(option);
    }
  }
  return {
    id,
    name: name || id,
    type,
    options,
    filterable: t.filterable !== false,
    mapTint: t.mapTint === true,
  };
}

export function cloneSchema(schema: PropDef[] = DEFAULT_PROPS): PropDef[] {
  return schema.map((p) => ({ ...p, options: p.options.map((o) => ({ ...o })) }));
}

export function sanitizeSchema(raw: unknown): PropDef[] {
  if (!Array.isArray(raw)) return cloneSchema();
  const seen = new Set<string>();
  const out: PropDef[] = [];
  for (const item of raw) {
    const def = sanitizeProp(item);
    if (!def || seen.has(def.id)) continue;
    seen.add(def.id);
    out.push(def);
  }
  let tinted = false;
  return out.map((def) => {
    if (!def.mapTint) return def;
    if (tinted) return { ...def, mapTint: false };
    tinted = true;
    return def;
  });
}

export function coerceValue(def: PropDef, raw: unknown): PropValue {
  if (def.type === "tags") {
    const arr = Array.isArray(raw)
      ? raw.filter((x): x is string => typeof x === "string")
      : typeof raw === "string" && raw
        ? [raw]
        : [];
    if (!def.options.length) return arr;
    const allowed = new Set(def.options.map((o) => o.id));
    return arr.filter((id) => allowed.has(id));
  }
  const str = Array.isArray(raw)
    ? typeof raw[0] === "string"
      ? raw[0]
      : ""
    : typeof raw === "string"
      ? raw
      : "";
  if (def.type === "choice" && def.options.length) {
    return def.options.some((o) => o.id === str) ? str : "";
  }
  return str;
}

export function seedProps(
  room: Room,
  schema?: PropDef[],
): Record<string, PropValue> {
  const out: Record<string, PropValue> = { ...(room.props ?? {}) };
  if (!schema) return out;
  const wanted = new Set(schema.map((d) => d.id));
  for (const key of Object.keys(out)) {
    if (!wanted.has(key)) delete out[key];
  }
  return out;
}

export function readProp(
  props: Record<string, PropValue>,
  def: PropDef,
): PropValue {
  if (props[def.id] !== undefined) return coerceValue(def, props[def.id]);
  const name = def.name.trim().toLowerCase();
  for (const [key, value] of Object.entries(props)) {
    if (key.toLowerCase() === name) return coerceValue(def, value);
  }
  return coerceValue(def, undefined);
}

export function optionLabel(def: PropDef, id: string) {
  return def.options.find((o) => o.id === id)?.label ?? id;
}

export function formatProp(def: PropDef, value: PropValue): string[] {
  if (def.type === "tags") {
    const ids = Array.isArray(value) ? value : [];
    return ids.map((id) => optionLabel(def, id));
  }
  const str = typeof value === "string" ? value : "";
  if (!str) return [];
  if (def.type === "choice") return [optionLabel(def, str)];
  return [str];
}

export function tintOf(
  props: Record<string, PropValue>,
  schema: PropDef[],
): PropTone | undefined {
  const def = schema.find((p) => p.mapTint);
  if (!def) return undefined;
  const value = readProp(props, def);
  const id = Array.isArray(value) ? value[0] : value;
  if (!id) return undefined;
  return def.options.find((o) => o.id === id)?.tone;
}

export function schemasEqual(a: PropDef[], b: PropDef[]) {
  return JSON.stringify(a) === JSON.stringify(b);
}

const LEGACY_FACTORY_PROP_IDS = new Set(["access", "style"]);

/** Old built-in Accès / Style — not user-created, never locked. */
export function isLegacyFactorySchema(schema: PropDef[]) {
  return (
    schema.length > 0 &&
    schema.every((def) => LEGACY_FACTORY_PROP_IDS.has(def.id))
  );
}

export function scrubLegacySchema(schema: PropDef[]): PropDef[] {
  return isLegacyFactorySchema(schema) ? [] : schema;
}

export function collectUnknownKeys(
  schema: PropDef[],
  edits: Record<string, RoomEdit>,
  rooms: Room[],
): string[] {
  const known = new Set<string>();
  for (const def of schema) {
    known.add(def.id);
    known.add(def.name.trim().toLowerCase());
  }
  const extra = new Set<string>();
  const consider = (key: string) => {
    const k = key.trim();
    if (!k) return;
    if (known.has(k) || known.has(k.toLowerCase())) return;
    extra.add(k);
  };
  for (const room of rooms) {
    for (const key of Object.keys(room.props ?? {})) consider(key);
  }
  for (const edit of Object.values(edits)) {
    for (const key of Object.keys(edit.props ?? {})) consider(key);
  }
  return [...extra];
}
