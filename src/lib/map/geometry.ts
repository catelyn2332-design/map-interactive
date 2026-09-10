import type { Point } from "./types";
import { PLAN_UNITS_PER_METER } from "./types";

export function centroid(poly: Point[]): Point {
  let x = 0;
  let y = 0;
  const n = poly.length;
  if (n === 0) return [0, 0];
  for (const [px, py] of poly) {
    x += px;
    y += py;
  }
  return [x / n, y / n];
}

export function bounds(poly: Point[]): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [x, y] of poly) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  return { minX, minY, maxX, maxY };
}

export type Bounds = ReturnType<typeof bounds>;

export function inflateBounds(box: Bounds, pad: number): Bounds {
  return {
    minX: box.minX - pad,
    minY: box.minY - pad,
    maxX: box.maxX + pad,
    maxY: box.maxY + pad,
  };
}

export function unionBounds(polys: Point[][]): Bounds | null {
  if (!polys.length) return null;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const poly of polys) {
    if (!poly.length) continue;
    const b = bounds(poly);
    if (b.minX < minX) minX = b.minX;
    if (b.minY < minY) minY = b.minY;
    if (b.maxX > maxX) maxX = b.maxX;
    if (b.maxY > maxY) maxY = b.maxY;
  }
  if (!Number.isFinite(minX)) return null;
  return { minX, minY, maxX, maxY };
}

export function area(poly: Point[]): number {
  let a = 0;
  const n = poly.length;
  for (let i = 0; i < n; i++) {
    const [x1, y1] = poly[i]!;
    const [x2, y2] = poly[(i + 1) % n]!;
    a += x1 * y2 - x2 * y1;
  }
  return Math.abs(a) / 2;
}

export function pointInPoly(poly: Point[], x: number, y: number): boolean {
  let inside = false;
  const n = poly.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const [xi, yi] = poly[i]!;
    const [xj, yj] = poly[j]!;
    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi + 0.00001) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function polyToPath(poly: Point[]): string {
  if (poly.length === 0) return "";
  const [x0, y0] = poly[0]!;
  let d = `M ${x0} ${y0}`;
  for (let i = 1; i < poly.length; i++) {
    const [x, y] = poly[i]!;
    d += ` L ${x} ${y}`;
  }
  return d + " Z";
}

export function rect(x: number, y: number, w: number, h: number): Point[] {
  return [
    [x, y],
    [x + w, y],
    [x + w, y + h],
    [x, y + h],
  ];
}

export function ellipsePoly(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  n = 28,
): Point[] {
  const out: Point[] = [];
  const nx = Math.max(12, n);
  for (let i = 0; i < nx; i++) {
    const a = (Math.PI * 2 * i) / nx;
    out.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
  }
  return out;
}

export function translatePoly(poly: Point[], dx: number, dy: number): Point[] {
  if (!dx && !dy) return poly;
  return poly.map(([x, y]) => [x + dx, y + dy]);
}

export function scalePoly(poly: Point[], from: Bounds, to: Bounds): Point[] {
  const w = from.maxX - from.minX || 1;
  const h = from.maxY - from.minY || 1;
  const nw = to.maxX - to.minX;
  const nh = to.maxY - to.minY;
  return poly.map(([x, y]) => [
    to.minX + ((x - from.minX) / w) * nw,
    to.minY + ((y - from.minY) / h) * nh,
  ]);
}

export function clampBox(
  box: Bounds,
  min = 48,
): Bounds {
  let { minX, minY, maxX, maxY } = box;
  if (maxX - minX < min) maxX = minX + min;
  if (maxY - minY < min) maxY = minY + min;
  return { minX, minY, maxX, maxY };
}

export type HandleId = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

export function applyHandle(
  box: Bounds,
  handle: HandleId,
  x: number,
  y: number,
  min = 48,
): Bounds {
  let { minX, minY, maxX, maxY } = box;
  if (handle.includes("n")) minY = Math.min(y, maxY - min);
  if (handle.includes("s")) maxY = Math.max(y, minY + min);
  if (handle.includes("w")) minX = Math.min(x, maxX - min);
  if (handle.includes("e")) maxX = Math.max(x, minX + min);
  return { minX, minY, maxX, maxY };
}

export function handleCursor(handle: HandleId): string {
  if (handle === "n" || handle === "s") return "ns-resize";
  if (handle === "e" || handle === "w") return "ew-resize";
  if (handle === "ne" || handle === "sw") return "nesw-resize";
  return "nwse-resize";
}

function closestPoints(
  a: Point[],
  b: Point[],
): { ax: number; ay: number; bx: number; by: number; dist: number } {
  let best = { ax: 0, ay: 0, bx: 0, by: 0, dist: Infinity };
  const steps = 5;
  for (let i = 0; i < a.length; i++) {
    const a1 = a[i]!;
    const a2 = a[(i + 1) % a.length]!;
    for (let j = 0; j < b.length; j++) {
      const b1 = b[j]!;
      const b2 = b[(j + 1) % b.length]!;
      for (let t = 0; t <= steps; t++) {
        const ax = a1[0] + ((a2[0] - a1[0]) * t) / steps;
        const ay = a1[1] + ((a2[1] - a1[1]) * t) / steps;
        for (let u = 0; u <= steps; u++) {
          const bx = b1[0] + ((b2[0] - b1[0]) * u) / steps;
          const by = b1[1] + ((b2[1] - b1[1]) * u) / steps;
          const d = Math.hypot(ax - bx, ay - by);
          if (d < best.dist) best = { ax, ay, bx, by, dist: d };
        }
      }
    }
  }
  return best;
}

export function doorMark(
  a: Point[],
  b: Point[],
): { x: number; y: number; tx: number; ty: number } | null {
  const c = closestPoints(a, b);
  if (c.dist > 28) return null;
  const x = (c.ax + c.bx) / 2;
  const y = (c.ay + c.by) / 2;
  let tx = c.ay - c.by;
  let ty = c.bx - c.ax;
  const len = Math.hypot(tx, ty) || 1;
  tx /= len;
  ty /= len;
  return { x, y, tx, ty };
}

export function stairLines(poly: Point[], count = 8): Array<[Point, Point]> {
  const b = bounds(poly);
  const wide = b.maxX - b.minX >= b.maxY - b.minY;
  const lines: Array<[Point, Point]> = [];
  for (let i = 1; i <= count; i++) {
    const t = i / (count + 1);
    if (wide) {
      const y = b.minY + (b.maxY - b.minY) * t;
      lines.push([
        [b.minX + 18, y],
        [b.maxX - 18, y],
      ]);
    } else {
      const x = b.minX + (b.maxX - b.minX) * t;
      lines.push([
        [x, b.minY + 18],
        [x, b.maxY - 18],
      ]);
    }
  }
  return lines;
}

export function labelSize(text: string, fontSize: number) {
  return { w: Math.max(36, text.length * fontSize * 0.58 + 16), h: fontSize + 12 };
}

/** 100 unités du plan = 1 m. Virgule française. */
export function formatMeters(units: number): string {
  const m = units / PLAN_UNITS_PER_METER;
  const r = Math.round(m * 10) / 10;
  if (Math.abs(r - Math.round(r)) < 0.05) return `${Math.round(r)} m`;
  return `${r.toFixed(1).replace(".", ",")} m`;
}

export const DIM_MIN_EDGE = 40;

export interface EdgeDim {
  mid: Point;
  nx: number;
  ny: number;
  angle: number;
  length: number;
  label: string;
}

/** Côtés assez longs pour porter une cote. Normale orientée vers l’intérieur. */
export function edgeDims(poly: Point[], minLen = DIM_MIN_EDGE): EdgeDim[] {
  const n = poly.length;
  if (n < 3) return [];
  const [cx, cy] = centroid(poly);
  const out: EdgeDim[] = [];
  for (let i = 0; i < n; i++) {
    const a = poly[i]!;
    const b = poly[(i + 1) % n]!;
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (length < minLen) continue;
    const mx = (a[0] + b[0]) / 2;
    const my = (a[1] + b[1]) / 2;
    const rad = Math.atan2(b[1] - a[1], b[0] - a[0]);
    let nx = -Math.sin(rad);
    let ny = Math.cos(rad);
    if (nx * (cx - mx) + ny * (cy - my) < 0) {
      nx = -nx;
      ny = -ny;
    }
    let angle = (rad * 180) / Math.PI;
    if (angle > 90) angle -= 180;
    if (angle < -90) angle += 180;
    out.push({
      mid: [mx, my],
      nx,
      ny,
      angle,
      length,
      label: formatMeters(length),
    });
  }
  return out;
}

/** Cotes d’une pièce : chaque côté, ou L × l si la forme est trop dense (ellipse). */
export function formatDims(poly: Point[]): string {
  const edges = edgeDims(poly);
  if (edges.length >= 2 && !(poly.length > 8 && edges.length < 3)) {
    return edges.map((e) => e.label).join(" · ");
  }
  const b = bounds(poly);
  return `${formatMeters(b.maxX - b.minX)} × ${formatMeters(b.maxY - b.minY)}`;
}

export function bboxDimLabels(poly: Point[]): EdgeDim[] {
  const b = bounds(poly);
  const [cx, cy] = centroid(poly);
  const w = b.maxX - b.minX;
  const h = b.maxY - b.minY;
  if (w < DIM_MIN_EDGE && h < DIM_MIN_EDGE) return [];
  const out: EdgeDim[] = [];
  if (w >= DIM_MIN_EDGE) {
    const mid: Point = [cx, b.minY];
    const ny = cy > b.minY ? 1 : -1;
    out.push({
      mid,
      nx: 0,
      ny,
      angle: 0,
      length: w,
      label: formatMeters(w),
    });
  }
  if (h >= DIM_MIN_EDGE) {
    const mid: Point = [b.maxX, cy];
    const nx = cx < b.maxX ? -1 : 1;
    out.push({
      mid,
      nx,
      ny: 0,
      angle: 90,
      length: h,
      label: formatMeters(h),
    });
  }
  return out;
}

export function boxesOverlap(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number },
  pad = 6,
) {
  return !(
    a.x + a.w + pad < b.x ||
    b.x + b.w + pad < a.x ||
    a.y + a.h + pad < b.y ||
    b.y + b.h + pad < a.y
  );
}

export function distToSegment(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
) {
  const abx = bx - ax;
  const aby = by - ay;
  const t =
    ((px - ax) * abx + (py - ay) * aby) / (abx * abx + aby * aby || 1);
  const u = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + abx * u), py - (ay + aby * u));
}

export const SNAP = 32;

export function nearPoint(a: Point, b: Point, thresh = SNAP) {
  return Math.hypot(a[0] - b[0], a[1] - b[1]) <= thresh;
}

export function axisAlign(prev: Point, next: Point, thresh = SNAP): Point {
  const dx = Math.abs(next[0] - prev[0]);
  const dy = Math.abs(next[1] - prev[1]);
  if (dx <= thresh && dx <= dy) return [prev[0], next[1]];
  if (dy <= thresh) return [next[0], prev[1]];
  return next;
}

/** Segmente un trait : libre, avec un léger cran à 0° / 45° / 90°. */
export function snapOctant(prev: Point, next: Point, deg = 14): Point {
  const dx = next[0] - prev[0];
  const dy = next[1] - prev[1];
  const len = Math.hypot(dx, dy);
  if (len < 2) return next;
  const ang = Math.atan2(dy, dx);
  const step = Math.PI / 4;
  const nearest = Math.round(ang / step) * step;
  let diff = Math.abs(ang - nearest);
  if (diff > Math.PI) diff = Math.abs(diff - Math.PI * 2);
  if (diff <= (deg * Math.PI) / 180) {
    return [prev[0] + Math.cos(nearest) * len, prev[1] + Math.sin(nearest) * len];
  }
  return next;
}

export function snapToPoints(p: Point, pts: Point[], thresh = SNAP): Point {
  let best = p;
  let d0 = thresh;
  for (const q of pts) {
    const d = Math.hypot(p[0] - q[0], p[1] - q[1]);
    if (d <= d0) {
      d0 = d;
      best = q;
    }
  }
  return best;
}

export function snapZonePoint(pts: Point[], raw: Point): Point {
  let p = raw;
  if (pts.length) p = axisAlign(pts[pts.length - 1]!, p);
  if (pts.length) p = snapToPoints(p, pts);
  return p;
}

export function canCloseZone(pts: Point[], p: Point) {
  return pts.length >= 3 && nearPoint(p, pts[0]!);
}

export function closedPoly(pts: Point[]): Point[] | null {
  if (pts.length < 3) return null;
  const first = pts[0]!;
  const last = pts[pts.length - 1]!;
  const out = nearPoint(last, first) ? pts.slice(0, -1) : pts.slice();
  return out.length >= 3 ? out : null;
}

export function segmentAligned(a: Point, b: Point, thresh = SNAP) {
  return Math.abs(a[0] - b[0]) <= thresh || Math.abs(a[1] - b[1]) <= thresh;
}

export function simplifyStroke(pts: Point[], minDist = 8): Point[] {
  if (pts.length < 2) return pts.slice();
  const out: Point[] = [pts[0]!];
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i]!;
    const q = out[out.length - 1]!;
    if (Math.hypot(p[0] - q[0], p[1] - q[1]) >= minDist) out.push(p);
  }
  const last = pts[pts.length - 1]!;
  const tail = out[out.length - 1]!;
  if (last[0] !== tail[0] || last[1] !== tail[1]) out.push(last);
  return out;
}

export function lineReady(pts: Point[]): Point[] | null {
  if (pts.length < 3) return null;
  const closed = closedPoly(pts);
  const poly = closed ?? pts;
  if (poly.length < 3) return null;
  if (area(poly) < 400) return null;
  return poly;
}

/** IbisPaint-style lasso: freehand loop, auto-closed, no axis constraint. */
export function lassoReady(pts: Point[]): Point[] | null {
  const simple = simplifyStroke(pts, 6);
  if (simple.length < 6) return null;
  const poly = closedPoly(simple);
  if (!poly || poly.length < 6) return null;
  if (area(poly) < 900) return null;
  return poly;
}

/** @deprecated zones are lassos now; kept for callers that still import the name. */
export function zoneReady(pts: Point[]): Point[] | null {
  return lassoReady(pts);
}

export function worldFromLocal(
  f: { x: number; y: number; rotation: number },
  lx: number,
  ly: number,
): Point {
  const rad = (f.rotation * Math.PI) / 180;
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  return [f.x + lx * c - ly * s, f.y + lx * s + ly * c];
}

export function localOnMark(
  f: { x: number; y: number; rotation: number },
  wx: number,
  wy: number,
): Point {
  const rad = (f.rotation * Math.PI) / 180;
  const dx = wx - f.x;
  const dy = wy - f.y;
  return [
    dx * Math.cos(rad) + dy * Math.sin(rad),
    -dx * Math.sin(rad) + dy * Math.cos(rad),
  ];
}

export function doorSwing(f: { length: number; width?: number }) {
  return Math.max(24, typeof f.width === "number" && Number.isFinite(f.width) ? f.width : f.length);
}

export function doorHandles(f: {
  x: number;
  y: number;
  rotation: number;
  length: number;
  width?: number;
  flip?: boolean;
  hinge?: "left" | "right";
}): { hinge: Point; span: Point; swing: Point } {
  const L = f.length;
  const S = doorSwing(f);
  const hs = f.hinge === "right" ? L / 2 : -L / 2;
  const dir = f.hinge === "right" ? -1 : 1;
  const fy = f.flip ? -1 : 1;
  return {
    hinge: worldFromLocal(f, hs, 0),
    span: worldFromLocal(f, -hs, 0),
    swing: worldFromLocal(
      f,
      hs + dir * S * Math.SQRT1_2,
      fy * S * Math.SQRT1_2,
    ),
  };
}

export const STAIR_TREAD = 36;

export function quarterFlightEnd(f: {
  x: number;
  y: number;
  rotation: number;
  length: number;
  width?: number;
  flip?: boolean;
}): Point {
  const T = STAIR_TREAD;
  const W = fixtureWidth(f);
  const fy = f.flip ? -1 : 1;
  return worldFromLocal(f, f.length / 2 - T / 2, fy * (W / 2));
}

/** Coin extérieur du L — collé au sommet de la pièce. */
export function quarterOuterCorner(f: {
  x: number;
  y: number;
  rotation: number;
  length: number;
  flip?: boolean;
}): Point {
  const fy = f.flip ? 1 : -1;
  return worldFromLocal(f, f.length / 2, fy * (STAIR_TREAD / 2));
}

export function markEnds(f: {
  x: number;
  y: number;
  rotation: number;
  length: number;
}): { a: Point; b: Point } {
  const rad = (f.rotation * Math.PI) / 180;
  const dx = Math.cos(rad) * (f.length / 2);
  const dy = Math.sin(rad) * (f.length / 2);
  return { a: [f.x - dx, f.y - dy], b: [f.x + dx, f.y + dy] };
}

export function markFromEnds(a: Point, b: Point): {
  x: number;
  y: number;
  rotation: number;
  length: number;
} {
  return {
    x: (a[0] + b[0]) / 2,
    y: (a[1] + b[1]) / 2,
    length: Math.max(24, Math.hypot(b[0] - a[0], b[1] - a[1])),
    rotation: (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI,
  };
}

export function fixtureWidth(f: {
  kind?: string;
  length: number;
  width?: number;
}): number {
  if (typeof f.width === "number" && Number.isFinite(f.width)) {
    return Math.max(16, f.width);
  }
  if (f.kind === "stair") return Math.max(32, f.length * 0.45);
  return 16;
}

export function markSides(f: {
  x: number;
  y: number;
  rotation: number;
  length: number;
  width?: number;
  kind?: string;
}): { n: Point; s: Point } {
  const w = fixtureWidth(f) / 2;
  const rad = (f.rotation * Math.PI) / 180;
  const nx = -Math.sin(rad);
  const ny = Math.cos(rad);
  return {
    n: [f.x + nx * w, f.y + ny * w],
    s: [f.x - nx * w, f.y - ny * w],
  };
}

export function widthFromPoint(
  f: { x: number; y: number; rotation: number },
  wx: number,
  wy: number,
): number {
  const rad = (f.rotation * Math.PI) / 180;
  const nx = -Math.sin(rad);
  const ny = Math.cos(rad);
  return Math.max(16, Math.abs((wx - f.x) * nx + (wy - f.y) * ny) * 2);
}

export function pointInRotatedRect(
  f: {
    x: number;
    y: number;
    rotation: number;
    length: number;
    width?: number;
    kind?: string;
  },
  wx: number,
  wy: number,
  pad = 8,
): boolean {
  const w = fixtureWidth(f);
  const rad = (f.rotation * Math.PI) / 180;
  const dx = wx - f.x;
  const dy = wy - f.y;
  const lx = dx * Math.cos(rad) + dy * Math.sin(rad);
  const ly = -dx * Math.sin(rad) + dy * Math.cos(rad);
  return Math.abs(lx) <= f.length / 2 + pad && Math.abs(ly) <= w / 2 + pad;
}

export function convexHull(pts: Point[]): Point[] {
  const unique = pts.filter((p, i, all) =>
    i === all.findIndex((q) => q[0] === p[0] && q[1] === p[1]),
  );
  if (unique.length <= 2) return unique.slice();
  const sorted = unique.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: Point, a: Point, b: Point) =>
    (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower: Point[] = [];
  for (const p of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2]!, lower[lower.length - 1]!, p) <= 0)
      lower.pop();
    lower.push(p);
  }
  const upper: Point[] = [];
  for (let i = sorted.length - 1; i >= 0; i--) {
    const p = sorted[i]!;
    while (upper.length >= 2 && cross(upper[upper.length - 2]!, upper[upper.length - 1]!, p) <= 0)
      upper.pop();
    upper.push(p);
  }
  lower.pop();
  upper.pop();
  return lower.concat(upper);
}

function boxesFrom(poly: Point[]) {
  return bounds(poly);
}

function spanOverlap(a0: number, a1: number, b0: number, b1: number) {
  return Math.max(0, Math.min(a1, b1) - Math.max(a0, b0));
}

function aabbOverlapArea(a: Bounds, b: Bounds) {
  const w = spanOverlap(a.minX, a.maxX, b.minX, b.maxX);
  const h = spanOverlap(a.minY, a.maxY, b.minY, b.maxY);
  return w * h;
}

function totalOverlap(box: Bounds, others: Bounds[]) {
  let s = 0;
  for (const o of others) s += aabbOverlapArea(box, o);
  return s;
}

/** Pousse hors des superpositions : le plus de chevauchement enlevé par pixel, jamais d’attraction. */
function resolveOverlap(poly: Point[], others: Point[][], passes = 8): Point[] {
  if (!poly.length || !others.length) return poly;
  const boxes = others.filter((o) => o.length).map(boxesFrom);
  let dx = 0;
  let dy = 0;
  for (let pass = 0; pass < passes; pass++) {
    const a = boxesFrom(translatePoly(poly, dx, dy));
    const before = totalOverlap(a, boxes);
    if (before <= 0.5) break;
    let best: { x: number; y: number; mag: number; eff: number } | null = null;
    for (const b of boxes) {
      const ox = spanOverlap(a.minX, a.maxX, b.minX, b.maxX);
      const oy = spanOverlap(a.minY, a.maxY, b.minY, b.maxY);
      if (ox <= 0.5 || oy <= 0.5) continue;
      const cands = [
        { x: -(a.maxX - b.minX), y: 0 },
        { x: b.maxX - a.minX, y: 0 },
        { x: 0, y: -(a.maxY - b.minY) },
        { x: 0, y: b.maxY - a.minY },
      ];
      for (const c of cands) {
        const moved: Bounds = {
          minX: a.minX + c.x,
          maxX: a.maxX + c.x,
          minY: a.minY + c.y,
          maxY: a.maxY + c.y,
        };
        const ov = totalOverlap(moved, boxes);
        const gain = before - ov;
        if (gain <= 0.5) continue;
        const mag = Math.abs(c.x) + Math.abs(c.y);
        const eff = gain / Math.max(1, mag);
        if (
          !best ||
          eff > best.eff + 0.05 ||
          (Math.abs(eff - best.eff) <= 0.05 && mag < best.mag)
        ) {
          best = { x: c.x, y: c.y, mag, eff };
        }
      }
    }
    if (!best) break;
    dx += best.x;
    dy += best.y;
  }
  return translatePoly(poly, dx, dy);
}

type FlushCand = { delta: number; shared: number; dist: number };

function pickFlush(a: Bounds, others: Bounds[], axis: "x" | "y", snap: number): number {
  const minShare = 12;
  const cands: FlushCand[] = [];
  const before = totalOverlap(a, others);
  for (const b of others) {
    if (axis === "x") {
      const shared = spanOverlap(a.minY, a.maxY, b.minY, b.maxY);
      if (shared < minShare) continue;
      const ox = spanOverlap(a.minX, a.maxX, b.minX, b.maxX);
      if (ox > 1) continue;
      for (const delta of [b.minX - a.maxX, b.maxX - a.minX]) {
        const dist = Math.abs(delta);
        if (dist < 0.02 || dist > snap) continue;
        const moved: Bounds = { ...a, minX: a.minX + delta, maxX: a.maxX + delta };
        if (totalOverlap(moved, others) > before + 0.5) continue;
        cands.push({ delta, shared, dist });
      }
    } else {
      const shared = spanOverlap(a.minX, a.maxX, b.minX, b.maxX);
      if (shared < minShare) continue;
      const oy = spanOverlap(a.minY, a.maxY, b.minY, b.maxY);
      if (oy > 1) continue;
      for (const delta of [b.minY - a.maxY, b.maxY - a.minY]) {
        const dist = Math.abs(delta);
        if (dist < 0.02 || dist > snap) continue;
        const moved: Bounds = { ...a, minY: a.minY + delta, maxY: a.maxY + delta };
        if (totalOverlap(moved, others) > before + 0.5) continue;
        cands.push({ delta, shared, dist });
      }
    }
  }
  if (!cands.length) return 0;
  cands.sort((p, q) => {
    if (Math.abs(p.dist - q.dist) <= 6 && Math.abs(p.shared - q.shared) > 8) {
      return q.shared - p.shared;
    }
    if (p.dist !== q.dist) return p.dist - q.dist;
    return q.shared - p.shared;
  });
  return cands[0]!.delta;
}

/**
 * Un seul mur par axe : le plus proche (à égalité, le plus long).
 * Pas d’aimant multi-côtés — un couloir peut tenir dans un vide.
 */
export function flushPoly(poly: Point[], others: Point[][], snap = 28): Point[] {
  if (!poly.length || !others.length) return poly;
  const boxes = others.filter((o) => o.length).map(boxesFrom);
  if (!boxes.length) return poly;
  const a0 = boxesFrom(poly);
  const dx = pickFlush(a0, boxes, "x", snap);
  const shifted: Bounds = dx
    ? { ...a0, minX: a0.minX + dx, maxX: a0.maxX + dx }
    : a0;
  const dy = pickFlush(shifted, boxes, "y", snap);
  if (!dx && !dy) return poly;
  return translatePoly(poly, dx, dy);
}

/** Colle deux pièces : plus de superposition, un bord qui s’aimante. */
export function unoverlapPoly(poly: Point[], others: Point[][], snap = 16): Point[] {
  if (!poly.length || !others.length) return poly;
  return flushPoly(resolveOverlap(poly, others), others, snap);
}

/** Collage intelligent : sortir des chevauchements, puis un mur par axe. */
export function magnetPoly(poly: Point[], others: Point[][], snap = 28): Point[] {
  return unoverlapPoly(poly, others, snap);
}

function stitchLoop(segs: Array<[Point, Point]>): Point[] | null {
  if (!segs.length) return null;
  const used = new Set<number>();
  const eq = (a: Point, b: Point) => Math.hypot(a[0] - b[0], a[1] - b[1]) < 0.8;
  const loop: Point[] = [segs[0]![0], segs[0]![1]];
  used.add(0);
  while (used.size < segs.length) {
    const tail = loop[loop.length - 1]!;
    let found = -1;
    let rev = false;
    for (let i = 0; i < segs.length; i++) {
      if (used.has(i)) continue;
      const [a, b] = segs[i]!;
      if (eq(a, tail)) {
        found = i;
        break;
      }
      if (eq(b, tail)) {
        found = i;
        rev = true;
        break;
      }
    }
    if (found < 0) break;
    used.add(found);
    const [a, b] = segs[found]!;
    loop.push(rev ? a : b);
  }
  if (loop.length < 4) return null;
  if (eq(loop[0]!, loop[loop.length - 1]!)) loop.pop();
  return loop.length >= 3 ? loop : null;
}

function maskToLoop(
  at: (i: number, j: number) => boolean,
  minX: number,
  minY: number,
  cols: number,
  rows: number,
  cell: number,
): Point[] | null {
  const segs: Array<[Point, Point]> = [];
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const tl = at(i, j) ? 1 : 0;
      const tr = at(i + 1, j) ? 1 : 0;
      const br = at(i + 1, j + 1) ? 1 : 0;
      const bl = at(i, j + 1) ? 1 : 0;
      const code = (tl << 3) | (tr << 2) | (br << 1) | bl;
      if (code === 0 || code === 15) continue;
      const x = minX + i * cell;
      const y = minY + j * cell;
      const n: Point = [x + cell / 2, y];
      const e: Point = [x + cell, y + cell / 2];
      const s: Point = [x + cell / 2, y + cell];
      const w: Point = [x, y + cell / 2];
      const pairs: Array<[Point, Point]> = [];
      if (code === 1 || code === 14) pairs.push([w, s]);
      else if (code === 2 || code === 13) pairs.push([s, e]);
      else if (code === 3 || code === 12) pairs.push([w, e]);
      else if (code === 4 || code === 11) pairs.push([n, e]);
      else if (code === 5) pairs.push([w, n], [s, e]);
      else if (code === 6 || code === 9) pairs.push([n, s]);
      else if (code === 7 || code === 8) pairs.push([w, n]);
      else if (code === 10) pairs.push([n, e], [w, s]);
      segs.push(...pairs);
    }
  }
  return stitchLoop(segs);
}

function gridFor(bb: ReturnType<typeof bounds>, pad: number, cellHint = 12) {
  let cell = cellHint;
  const spanX = bb.maxX - bb.minX + pad * 2;
  const spanY = bb.maxY - bb.minY + pad * 2;
  if ((spanX / cell) * (spanY / cell) > 16000) {
    cell = Math.ceil(Math.sqrt((spanX * spanY) / 16000));
  }
  return {
    minX: bb.minX - pad,
    minY: bb.minY - pad,
    cols: Math.ceil(spanX / cell),
    rows: Math.ceil(spanY / cell),
    cell,
  };
}

/** Lasso : agrandir (union) ou gommer (soustraction) une zone. */
export function booleanPoly(
  base: Point[],
  brush: Point[],
  mode: "add" | "erase",
  minArea = 900,
): Point[] | null {
  if (!base.length || !brush.length) return base.length ? base : null;
  const all = [...base, ...brush];
  const bb = bounds(all);
  const grid = gridFor(bb, 12, 12);
  const loop = maskToLoop(
    (i, j) => {
      const x = grid.minX + i * grid.cell;
      const y = grid.minY + j * grid.cell;
      const inB = pointInPoly(base, x, y);
      const inR = pointInPoly(brush, x, y);
      return mode === "add" ? inB || inR : inB && !inR;
    },
    grid.minX,
    grid.minY,
    grid.cols,
    grid.rows,
    grid.cell,
  );
  if (loop && area(loop) >= minArea) return loop;
  if (mode === "add") {
    const hull = convexHull(all);
    return hull.length >= 3 && area(hull) >= minArea ? hull : base;
  }
  return area(base) >= minArea ? base : null;
}

function distToStroke(x: number, y: number, pts: Point[]): number {
  if (!pts.length) return Infinity;
  if (pts.length === 1) return Math.hypot(x - pts[0]![0], y - pts[0]![1]);
  let best = Infinity;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1]!;
    const b = pts[i]!;
    const d = distToSegment(x, y, a[0], a[1], b[0], b[1]);
    if (d < best) best = d;
  }
  return best;
}

/** Coup de pinceau : capsule arrondie le long du trait. */
export function brushStrokePoly(pts: Point[], radius: number): Point[] | null {
  if (!pts.length || radius <= 0) return null;
  const cleaned: Point[] = [];
  const minStep = Math.max(2.5, radius * 0.22);
  for (const p of pts) {
    const last = cleaned[cleaned.length - 1];
    if (!last || Math.hypot(p[0] - last[0], p[1] - last[1]) >= minStep) cleaned.push(p);
  }
  if (!cleaned.length) return null;
  const bb = bounds(cleaned);
  const pad = radius + 10;
  const cellHint = Math.max(5, Math.min(12, radius / 3.2));
  const grid = gridFor(bb, pad, cellHint);
  const loop = maskToLoop(
    (i, j) => {
      const x = grid.minX + i * grid.cell;
      const y = grid.minY + j * grid.cell;
      return distToStroke(x, y, cleaned) <= radius;
    },
    grid.minX,
    grid.minY,
    grid.cols,
    grid.rows,
    grid.cell,
  );
  const minArea = Math.max(280, radius * radius * 0.6);
  if (loop && area(loop) >= minArea) return loop;
  if (cleaned.length === 1) {
    const [cx, cy] = cleaned[0]!;
    const n = 14;
    const ring: Point[] = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      ring.push([cx + Math.cos(a) * radius, cy + Math.sin(a) * radius]);
    }
    return ring;
  }
  return null;
}

