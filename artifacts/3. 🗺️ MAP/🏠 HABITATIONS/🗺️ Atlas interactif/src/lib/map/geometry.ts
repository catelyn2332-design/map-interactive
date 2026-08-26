import type { Point } from "./types";

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
  if (area(poly) < 900) return null;
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

