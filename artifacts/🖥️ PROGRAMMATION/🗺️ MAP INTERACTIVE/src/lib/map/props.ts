import type {
  Character,
  PropDef,
  PropIconId,
  PropOption,
  PropPrimitive,
  PropTone,
  PropType,
  PropValue,
  PropVar,
  PropVarKind,
  Room,
  RoomEdit,
  TokenPos,
} from "./types";
import { sanitizeHexColor } from "./types";

export const PROP_TYPES: Array<{
  id: PropType;
  label: string;
  hint: string;
  icon: PropIconId;
  filterable: boolean;
}> = [
  {
    id: "choice",
    label: "Choix unique",
    hint: "Une donnée prédéfinie parmi une liste nommée",
    icon: "choice",
    filterable: true,
  },
  {
    id: "tags",
    label: "Choix multiple",
    hint: "Plusieurs données prédéfinies à la fois",
    icon: "tags",
    filterable: true,
  },
  {
    id: "text",
    label: "Texte",
    hint: "Saisie libre courte",
    icon: "type",
    filterable: false,
  },
  {
    id: "longtext",
    label: "Texte long",
    hint: "Notes, paragraphe",
    icon: "align-left",
    filterable: false,
  },
  {
    id: "number",
    label: "Nombre",
    hint: "Valeur numérique",
    icon: "hash",
    filterable: false,
  },
  {
    id: "toggle",
    label: "Oui / Non",
    hint: "Interrupteur",
    icon: "toggle",
    filterable: true,
  },
  {
    id: "color",
    label: "Couleur",
    hint: "Teinte au choix",
    icon: "palette",
    filterable: false,
  },
  {
    id: "token",
    label: "Pions",
    hint: "Données posables sur le plan — recréez vos pions",
    icon: "users",
    filterable: true,
  },
];

export const PROP_ICONS: PropIconId[] = [
  "tags",
  "type",
  "align-left",
  "hash",
  "toggle",
  "choice",
  "palette",
  "users",
  "lock",
  "sun",
  "flame",
  "shield",
  "key",
  "star",
  "map-pin",
  "heart",
  "eye",
  "clock",
  "flag",
  "home",
  "book",
  "thermometer",
  "volume",
  "door",
];

export const VAR_KINDS: Array<{ id: PropVarKind; label: string; hint: string }> = [
  { id: "text", label: "Texte", hint: "Mot, initiale, rôle…" },
  { id: "number", label: "Nombre", hint: "Valeur chiffrée" },
  { id: "color", label: "Couleur", hint: "Teinte propre à l’entrée" },
  { id: "toggle", label: "Oui / Non", hint: "Interrupteur" },
];

export const TONE_OPTIONS: Array<{ id: PropTone; label: string }> = [
  { id: "default", label: "Neutre" },
  { id: "sage", label: "Sage" },
  { id: "stone", label: "Pierre" },
  { id: "clay", label: "Alerte" },
  { id: "ink", label: "Encre" },
];

export const TOKEN_SEED_VARS: PropVar[] = [
  { id: "short", name: "Abréviation", kind: "text" },
  { id: "color", name: "Couleur", kind: "color" },
  { id: "role", name: "Rôle", kind: "text" },
];

/** Empty on purpose: the atlas is a sandbox. Accès / Style are not built-in. */
export const DEFAULT_PROPS: PropDef[] = [];

const TONES: PropTone[] = ["default", "sage", "stone", "clay", "ink"];
const TYPES: PropType[] = PROP_TYPES.map((t) => t.id);
const VAR_KIND_IDS: PropVarKind[] = VAR_KINDS.map((v) => v.id);
const ICON_IDS: PropIconId[] = PROP_ICONS;

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

function asIcon(v: unknown): PropIconId | undefined {
  return typeof v === "string" && ICON_IDS.includes(v as PropIconId)
    ? (v as PropIconId)
    : undefined;
}

function asVarKind(v: unknown): PropVarKind | undefined {
  return typeof v === "string" && VAR_KIND_IDS.includes(v as PropVarKind)
    ? (v as PropVarKind)
    : undefined;
}

export function typeMeta(type: PropType) {
  return PROP_TYPES.find((t) => t.id === type) ?? PROP_TYPES[0]!;
}

export function usesOptions(type: PropType) {
  return type === "choice" || type === "tags" || type === "token";
}

export function usesItemVars(type: PropType) {
  return usesOptions(type);
}

export function defaultIcon(type: PropType): PropIconId {
  return typeMeta(type).icon;
}

export function seedVarsFor(type: PropType): PropVar[] {
  return type === "token" ? TOKEN_SEED_VARS.map((v) => ({ ...v })) : [];
}

export function newProp(partial?: Partial<PropDef>): PropDef {
  const type = partial?.type ?? "choice";
  const next: PropDef = {
    id: uid("p"),
    name: "Nouvelle propriété",
    type,
    icon: defaultIcon(type),
    options: [],
    vars: seedVarsFor(type),
    filterable: typeMeta(type).filterable,
    mapTint: false,
    ...partial,
  };
  next.type = type;
  if (!partial?.icon) next.icon = defaultIcon(type);
  if (!partial?.vars) next.vars = seedVarsFor(type);
  return next;
}

export function newOption(label: string, used: Set<string>, vars?: PropVar[]): PropOption {
  const trimmed = label.trim() || "Option";
  const base = slug(trimmed) || uid("o");
  let id = base;
  let n = 2;
  while (used.has(id)) {
    id = `${base}-${n}`;
    n += 1;
  }
  used.add(id);
  const option: PropOption = { id, label: trimmed };
  if (vars?.length) {
    const bag: Record<string, PropPrimitive> = {};
    for (const v of vars) {
      if (v.id === "short") bag[v.id] = trimmed.slice(0, 1).toUpperCase();
      else if (v.kind === "toggle") bag[v.id] = false;
      else if (v.kind === "number") bag[v.id] = 0;
      else if (v.kind === "color") bag[v.id] = "#6a7a58";
      else bag[v.id] = "";
    }
    option.vars = bag;
  }
  return option;
}

export function newVar(partial?: Partial<PropVar>): PropVar {
  return {
    id: uid("v"),
    name: "Variable",
    kind: "text",
    ...partial,
  };
}

function asPrimitive(raw: unknown, kind?: PropVarKind): PropPrimitive | undefined {
  if (kind === "number") {
    if (typeof raw === "number" && Number.isFinite(raw)) return raw;
    if (typeof raw === "string" && raw.trim() && Number.isFinite(Number(raw))) {
      return Number(raw);
    }
    return undefined;
  }
  if (kind === "toggle") {
    if (typeof raw === "boolean") return raw;
    if (raw === "true" || raw === "oui" || raw === 1) return true;
    if (raw === "false" || raw === "non" || raw === 0) return false;
    return undefined;
  }
  if (kind === "color") {
    const hex = sanitizeHexColor(typeof raw === "string" ? raw : undefined);
    return hex;
  }
  if (typeof raw === "string") return raw;
  if (typeof raw === "number" && Number.isFinite(raw)) return String(raw);
  if (typeof raw === "boolean") return raw ? "oui" : "non";
  return undefined;
}

export function sanitizeOption(raw: unknown, vars?: PropVar[]): PropOption | null {
  if (!raw || typeof raw !== "object") return null;
  const t = raw as Record<string, unknown>;
  const label = typeof t.label === "string" ? t.label.trim() : "";
  const idRaw = typeof t.id === "string" ? t.id.trim() : "";
  const id = idRaw || slug(label);
  if (!id) return null;
  const option: PropOption = { id, label: label || id };
  const tone = asTone(t.tone);
  if (tone && tone !== "default") option.tone = tone;
  if (t.vars && typeof t.vars === "object" && !Array.isArray(t.vars)) {
    const bag: Record<string, PropPrimitive> = {};
    const rec = t.vars as Record<string, unknown>;
    const known = vars ?? [];
    if (known.length) {
      for (const v of known) {
        const val = asPrimitive(rec[v.id], v.kind);
        if (val !== undefined) bag[v.id] = val;
      }
    } else {
      for (const [key, value] of Object.entries(rec)) {
        const val = asPrimitive(value);
        if (val !== undefined) bag[key] = val;
      }
    }
    if (Object.keys(bag).length) option.vars = bag;
  }
  return option;
}

export function sanitizeVar(raw: unknown): PropVar | null {
  if (!raw || typeof raw !== "object") return null;
  const t = raw as Record<string, unknown>;
  const id = typeof t.id === "string" ? t.id.trim() : "";
  if (!id) return null;
  const name = typeof t.name === "string" ? t.name.trim() : "";
  const kind = asVarKind(t.kind) ?? "text";
  return { id, name: name || id, kind };
}

export function sanitizeProp(raw: unknown): PropDef | null {
  if (!raw || typeof raw !== "object") return null;
  const t = raw as Record<string, unknown>;
  const id = typeof t.id === "string" ? t.id.trim() : "";
  if (!id) return null;
  const name = typeof t.name === "string" ? t.name.trim() : "";
  const type = asType(t.type) ?? "text";
  const vars: PropVar[] = [];
  const seenVar = new Set<string>();
  if (Array.isArray(t.vars)) {
    for (const item of t.vars) {
      const v = sanitizeVar(item);
      if (!v || seenVar.has(v.id)) continue;
      seenVar.add(v.id);
      vars.push(v);
    }
  }
  const seen = new Set<string>();
  const options: PropOption[] = [];
  if (Array.isArray(t.options)) {
    for (const item of t.options) {
      const option = sanitizeOption(item, vars);
      if (!option || seen.has(option.id)) continue;
      seen.add(option.id);
      options.push(option);
    }
  }
  const icon = asIcon(t.icon) ?? defaultIcon(type);
  return {
    id,
    name: name || id,
    type,
    icon,
    options,
    vars,
    filterable: t.filterable !== false,
    mapTint: t.mapTint === true,
  };
}

export function cloneSchema(schema: PropDef[] = DEFAULT_PROPS): PropDef[] {
  return schema.map((p) => ({
    ...p,
    options: p.options.map((o) => ({
      ...o,
      vars: o.vars ? { ...o.vars } : undefined,
    })),
    vars: (p.vars ?? []).map((v) => ({ ...v })),
  }));
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
  if (def.type === "number") {
    if (typeof raw === "number" && Number.isFinite(raw)) return raw;
    if (typeof raw === "string" && raw.trim() && Number.isFinite(Number(raw))) {
      return Number(raw);
    }
    return "";
  }
  if (def.type === "toggle") {
    if (raw === true || raw === "true" || raw === "oui") return true;
    if (raw === false || raw === "false" || raw === "non") return false;
    return false;
  }
  if (def.type === "color") {
    return sanitizeHexColor(typeof raw === "string" ? raw : "") ?? "";
  }
  const str = Array.isArray(raw)
    ? typeof raw[0] === "string"
      ? raw[0]
      : ""
    : typeof raw === "string"
      ? raw
      : typeof raw === "number"
        ? String(raw)
        : "";
  if ((def.type === "choice" || def.type === "token") && def.options.length) {
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
  if (def.type === "toggle") {
    return value === true ? ["Oui"] : value === false ? ["Non"] : [];
  }
  if (def.type === "number") {
    if (typeof value === "number") return [String(value)];
    if (typeof value === "string" && value.trim()) return [value];
    return [];
  }
  const str = typeof value === "string" ? value : "";
  if (!str) return [];
  if (def.type === "choice" || def.type === "token") return [optionLabel(def, str)];
  return [str];
}

export function tintOf(
  props: Record<string, PropValue>,
  schema: PropDef[],
): PropTone | undefined {
  const def = schema.find((p) => p.mapTint);
  if (!def) return undefined;
  const value = readProp(props, def);
  const id = Array.isArray(value) ? value[0] : typeof value === "string" ? value : "";
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

export function optionVar(
  opt: PropOption | undefined,
  varId: string,
): PropPrimitive | undefined {
  return opt?.vars?.[varId];
}

export interface TokenActor {
  id: string;
  name: string;
  short: string;
  role: string;
  color?: string;
  propId?: string;
  optionId?: string;
}

export function tokenActors(
  schema: PropDef[],
  characters: Character[],
): TokenActor[] {
  const out: TokenActor[] = [];
  const seen = new Set<string>();
  for (const def of schema) {
    if (def.type !== "token") continue;
    for (const opt of def.options) {
      const shortRaw = optionVar(opt, "short");
      const colorRaw = optionVar(opt, "color");
      const roleRaw = optionVar(opt, "role");
      const color =
        typeof colorRaw === "string" ? sanitizeHexColor(colorRaw) : undefined;
      const short =
        typeof shortRaw === "string" && shortRaw.trim()
          ? shortRaw.trim().slice(0, 3)
          : opt.label.slice(0, 1).toUpperCase();
      const role =
        typeof roleRaw === "string"
          ? roleRaw
          : def.name;
      out.push({
        id: opt.id,
        name: opt.label,
        short,
        role,
        color,
        propId: def.id,
        optionId: opt.id,
      });
      seen.add(opt.id);
    }
  }
  for (const c of characters) {
    if (seen.has(c.id)) continue;
    out.push({
      id: c.id,
      name: c.name,
      short: c.short,
      role: c.role,
      color: sanitizeHexColor(c.color),
    });
  }
  return out;
}

export function tokenIdsOf(schema: PropDef[], characters: Character[]): string[] {
  return tokenActors(schema, characters).map((a) => a.id);
}

export function tokensInRoom(
  roomId: string,
  tokens: Record<string, TokenPos>,
  actors: TokenActor[],
): TokenActor[] {
  return actors.filter((a) => tokens[a.id]?.roomId === roomId);
}

export function extrasOf(
  room: Room,
  propId: string,
): Record<string, PropPrimitive> {
  return room.propExtras?.[propId] ?? {};
}

export function readExtra(
  room: Room,
  propId: string,
  varId: string,
  kind: PropVarKind,
): PropPrimitive {
  const raw = room.propExtras?.[propId]?.[varId];
  const val = asPrimitive(raw, kind);
  if (val !== undefined) return val;
  if (kind === "toggle") return false;
  if (kind === "number") return 0;
  if (kind === "color") return "#6a7a58";
  return "";
}

export function parseNameList(raw: string): string[] {
  const parts = raw
    .split(/[\n,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of parts) {
    const key = p.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(p);
  }
  return out;
}
