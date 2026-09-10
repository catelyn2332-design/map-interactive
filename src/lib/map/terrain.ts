import { bounds, pointInPoly } from "./geometry";
import { GROUND_KINDS, type GroundKind, type MapFixture, type Point } from "./types";

/** Taille d’une cellule, en unités du plan. 8 ≈ 8 cm : assez fin, assez léger. */
export const TERRAIN_CELL = 8;
const MAX_SIDE = 640;
const RLE_CAP = 80_000;

export type PackedTerrain = {
  ox: number;
  oy: number;
  cols: number;
  rows: number;
  cell: number;
  rle: number[];
};

export type TerrainMap = Record<string, PackedTerrain>;

export type TerrainRun = {
  x: number;
  y: number;
  w: number;
  h: number;
  kind: GroundKind;
};

export function biomeIndex(kind?: GroundKind | string): number {
  const i = GROUND_KINDS.findIndex((g) => g.id === kind);
  return i >= 0 ? i + 1 : 1;
}

export function biomeFromIndex(index: number): GroundKind | null {
  if (index <= 0) return null;
  return GROUND_KINDS[index - 1]?.id ?? null;
}

export function emptyPacked(cell = TERRAIN_CELL): PackedTerrain {
  return { ox: 0, oy: 0, cols: 0, rows: 0, cell, rle: [] };
}

export function terrainBusy(map?: TerrainMap | null): boolean {
  if (!map) return false;
  for (const packed of Object.values(map)) {
    if (!packed?.rle) continue;
    for (let i = 1; i < packed.rle.length; i += 2) {
      if (packed.rle[i]) return true;
    }
  }
  return false;
}

function align(value: number, cell: number) {
  return Math.floor(value / cell) * cell;
}

function unpack(packed: PackedTerrain): Uint8Array {
  const n = Math.max(0, packed.cols * packed.rows);
  const data = new Uint8Array(n);
  if (!n) return data;
  let i = 0;
  const rle = packed.rle;
  for (let k = 0; k + 1 < rle.length && i < n; k += 2) {
    const count = Math.max(0, rle[k]! | 0);
    const val = rle[k + 1]! & 255;
    const end = Math.min(n, i + count);
    data.fill(val, i, end);
    i = end;
  }
  return data;
}

function packFrom(
  ox: number,
  oy: number,
  cols: number,
  rows: number,
  cell: number,
  data: Uint8Array,
): PackedTerrain {
  if (cols <= 0 || rows <= 0) return emptyPacked(cell);
  let minC = cols;
  let minR = rows;
  let maxC = -1;
  let maxR = -1;
  for (let r = 0; r < rows; r++) {
    const row = r * cols;
    for (let c = 0; c < cols; c++) {
      if (!data[row + c]) continue;
      if (c < minC) minC = c;
      if (c > maxC) maxC = c;
      if (r < minR) minR = r;
      if (r > maxR) maxR = r;
    }
  }
  if (maxC < 0) return emptyPacked(cell);
  const nextCols = maxC - minC + 1;
  const nextRows = maxR - minR + 1;
  const rle: number[] = [];
  let runVal = -1;
  let runCount = 0;
  const flush = () => {
    if (runCount <= 0) return;
    rle.push(runCount, runVal);
    runCount = 0;
  };
  for (let r = minR; r <= maxR; r++) {
    const row = r * cols;
    for (let c = minC; c <= maxC; c++) {
      const v = data[row + c] ?? 0;
      if (v === runVal) runCount += 1;
      else {
        flush();
        runVal = v;
        runCount = 1;
      }
    }
  }
  flush();
  if (rle.length > RLE_CAP) rle.length = RLE_CAP - (RLE_CAP % 2);
  return {
    ox: ox + minC * cell,
    oy: oy + minR * cell,
    cols: nextCols,
    rows: nextRows,
    cell,
    rle,
  };
}

function materialize(
  packed: PackedTerrain | undefined,
  minX: number,
  minY: number,
  maxX: number,
  maxY: number,
): { ox: number; oy: number; cols: number; rows: number; cell: number; data: Uint8Array } {
  const cell = packed?.cell && packed.cell > 0 ? packed.cell : TERRAIN_CELL;
  const has = packed && packed.cols > 0 && packed.rows > 0;
  const oldOx = has ? packed.ox : align(minX, cell);
  const oldOy = has ? packed.oy : align(minY, cell);
  const oldCols = has ? packed.cols : 0;
  const oldRows = has ? packed.rows : 0;
  let ox = Math.min(oldOx, align(minX, cell));
  let oy = Math.min(oldOy, align(minY, cell));
  let right = Math.max(oldOx + oldCols * cell, align(maxX, cell) + cell);
  let bottom = Math.max(oldOy + oldRows * cell, align(maxY, cell) + cell);
  let cols = Math.ceil((right - ox) / cell);
  let rows = Math.ceil((bottom - oy) / cell);
  if (cols > MAX_SIDE) {
    cols = MAX_SIDE;
    ox = Math.min(ox, align(minX, cell));
  }
  if (rows > MAX_SIDE) {
    rows = MAX_SIDE;
    oy = Math.min(oy, align(minY, cell));
  }
  cols = Math.max(1, cols);
  rows = Math.max(1, rows);
  const data = new Uint8Array(cols * rows);
  if (has) {
    const src = unpack(packed);
    const dx = Math.round((packed.ox - ox) / cell);
    const dy = Math.round((packed.oy - oy) / cell);
    for (let r = 0; r < packed.rows; r++) {
      const nr = r + dy;
      if (nr < 0 || nr >= rows) continue;
      for (let c = 0; c < packed.cols; c++) {
        const nc = c + dx;
        if (nc < 0 || nc >= cols) continue;
        data[nr * cols + nc] = src[r * packed.cols + c] ?? 0;
      }
    }
  }
  return { ox, oy, cols, rows, cell, data };
}

function stampDisk(
  grid: { ox: number; oy: number; cols: number; rows: number; cell: number; data: Uint8Array },
  wx: number,
  wy: number,
  radius: number,
  value: number,
) {
  const { ox, oy, cols, rows, cell, data } = grid;
  const r = Math.max(cell, radius);
  const r2 = r * r;
  const minC = Math.max(0, Math.floor((wx - r - ox) / cell));
  const maxC = Math.min(cols - 1, Math.floor((wx + r - ox) / cell));
  const minR = Math.max(0, Math.floor((wy - r - oy) / cell));
  const maxR = Math.min(rows - 1, Math.floor((wy + r - oy) / cell));
  for (let row = minR; row <= maxR; row++) {
    const cy = oy + (row + 0.5) * cell;
    const dy = cy - wy;
    const rowOff = row * cols;
    for (let col = minC; col <= maxC; col++) {
      const cx = ox + (col + 0.5) * cell;
      const dx = cx - wx;
      if (dx * dx + dy * dy <= r2) data[rowOff + col] = value;
    }
  }
}

function walkStroke(stroke: Point[], step: number, visit: (x: number, y: number) => void) {
  if (!stroke.length) return;
  visit(stroke[0]![0], stroke[0]![1]);
  for (let i = 1; i < stroke.length; i++) {
    const a = stroke[i - 1]!;
    const b = stroke[i]!;
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const dist = Math.hypot(dx, dy);
    if (dist < 0.5) continue;
    const n = Math.max(1, Math.ceil(dist / step));
    for (let k = 1; k <= n; k++) {
      const t = k / n;
      visit(a[0] + dx * t, a[1] + dy * t);
    }
  }
}

/** Peindre / gommer le long d’un trait : chaque cellule reçoit une valeur, sans union de polygones. */
export function stampStroke(
  packed: PackedTerrain | undefined,
  stroke: Point[],
  radius: number,
  kind: GroundKind | 0,
  mode: "paint" | "erase" = "paint",
): PackedTerrain {
  if (!stroke.length) return packed ?? emptyPacked();
  const r = Math.max(4, radius);
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [x, y] of stroke) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  const grid = materialize(packed, minX - r, minY - r, maxX + r, maxY + r);
  const value = mode === "erase" ? 0 : biomeIndex(kind === 0 ? "meadow" : kind);
  const step = Math.max(grid.cell * 0.45, r * 0.35);
  walkStroke(stroke, step, (x, y) => stampDisk(grid, x, y, r, value));
  return packFrom(grid.ox, grid.oy, grid.cols, grid.rows, grid.cell, grid.data);
}

export function rasterizePoly(
  packed: PackedTerrain | undefined,
  poly: Point[],
  kind: GroundKind,
): PackedTerrain {
  if (poly.length < 3) return packed ?? emptyPacked();
  const box = bounds(poly);
  const grid = materialize(packed, box.minX, box.minY, box.maxX, box.maxY);
  const value = biomeIndex(kind);
  const { ox, oy, cols, rows, cell, data } = grid;
  const minC = Math.max(0, Math.floor((box.minX - ox) / cell));
  const maxC = Math.min(cols - 1, Math.floor((box.maxX - ox) / cell));
  const minR = Math.max(0, Math.floor((box.minY - oy) / cell));
  const maxR = Math.min(rows - 1, Math.floor((box.maxY - oy) / cell));
  for (let row = minR; row <= maxR; row++) {
    const cy = oy + (row + 0.5) * cell;
    const rowOff = row * cols;
    for (let col = minC; col <= maxC; col++) {
      const cx = ox + (col + 0.5) * cell;
      if (pointInPoly(poly, cx, cy)) data[rowOff + col] = value;
    }
  }
  return packFrom(ox, oy, cols, rows, cell, data);
}

export function liftGroundFixtures(
  fixtures: MapFixture[],
  terrain: TerrainMap = {},
): { fixtures: MapFixture[]; terrain: TerrainMap } {
  const grounds = fixtures.filter((f) => f.kind === "ground" && f.poly && f.poly.length >= 3);
  if (!grounds.length) return { fixtures, terrain };
  const next: TerrainMap = { ...terrain };
  for (const g of grounds) {
    next[g.floorId] = rasterizePoly(next[g.floorId], g.poly!, g.ground ?? "meadow");
  }
  return {
    fixtures: fixtures.filter((f) => f.kind !== "ground"),
    terrain: next,
  };
}

export function terrainRuns(packed?: PackedTerrain | null): TerrainRun[] {
  if (!packed || packed.cols <= 0 || packed.rows <= 0) return [];
  const data = unpack(packed);
  const { ox, oy, cols, rows, cell } = packed;
  const runs: TerrainRun[] = [];
  for (let r = 0; r < rows; r++) {
    const row = r * cols;
    let c = 0;
    while (c < cols) {
      const v = data[row + c] ?? 0;
      if (!v) {
        c += 1;
        continue;
      }
      let end = c + 1;
      while (end < cols && data[row + end] === v) end += 1;
      const kind = biomeFromIndex(v);
      if (kind) {
        runs.push({
          x: ox + c * cell,
          y: oy + r * cell,
          w: (end - c) * cell,
          h: cell,
          kind,
        });
      }
      c = end;
    }
  }
  return runs;
}

export function terrainKinds(packed?: PackedTerrain | null): GroundKind[] {
  if (!packed?.rle?.length) return [];
  const seen = new Set<GroundKind>();
  for (let i = 1; i < packed.rle.length; i += 2) {
    const kind = biomeFromIndex(packed.rle[i]!);
    if (kind) seen.add(kind);
  }
  return GROUND_KINDS.map((g) => g.id).filter((id) => seen.has(id));
}

export function sanitizePackedTerrain(raw: unknown): PackedTerrain | null {
  if (!raw || typeof raw !== "object") return null;
  const t = raw as Record<string, unknown>;
  const cell = Number(t.cell);
  const cols = Number(t.cols);
  const rows = Number(t.rows);
  const ox = Number(t.ox);
  const oy = Number(t.oy);
  if (!Number.isFinite(ox) || !Number.isFinite(oy)) return null;
  if (!Number.isFinite(cols) || !Number.isFinite(rows)) return null;
  if (cols < 0 || rows < 0 || cols > MAX_SIDE || rows > MAX_SIDE) return null;
  const size = Number.isFinite(cell) && cell >= 4 && cell <= 32 ? Math.round(cell) : TERRAIN_CELL;
  const rle: number[] = [];
  if (Array.isArray(t.rle)) {
    for (const n of t.rle) {
      const v = Number(n);
      if (!Number.isFinite(v)) continue;
      rle.push(Math.max(0, Math.min(0xffff, Math.round(v))));
      if (rle.length >= RLE_CAP) break;
    }
  }
  if (rle.length % 2 === 1) rle.pop();
  if (cols === 0 || rows === 0) return emptyPacked(size);
  return { ox, oy, cols: Math.round(cols), rows: Math.round(rows), cell: size, rle };
}

export function sanitizeTerrainMap(raw: unknown): TerrainMap {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: TerrainMap = {};
  for (const [id, value] of Object.entries(raw as Record<string, unknown>)) {
    const key = id.trim();
    if (!key) continue;
    const packed = sanitizePackedTerrain(value);
    if (!packed || packed.cols === 0) continue;
    out[key] = packed;
    if (Object.keys(out).length >= 24) break;
  }
  return out;
}
