import { centroid, distToSegment, fixtureWidth, markEnds, pointInPoly, quarterOuterCorner, STAIR_TREAD } from "./geometry";
import type { Point, StairStyle } from "./types";

export const WALL_SNAP = 40;

export interface WallSeg {
  a: Point;
  b: Point;
  roomId: string;
  length: number;
  angle: number;
  nx: number;
  ny: number;
  shared: boolean;
}

export interface SnapPose {
  x: number;
  y: number;
  rotation: number;
  length: number;
  width?: number;
  snapped: boolean;
  wall?: WallSeg;
  flip?: boolean;
}

function lerp(a: Point, b: Point, t: number): Point {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

export function projectOnSeg(
  p: Point,
  a: Point,
  b: Point,
): { x: number; y: number; t: number; dist: number } {
  const abx = b[0] - a[0];
  const aby = b[1] - a[1];
  const len2 = abx * abx + aby * aby || 1;
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * abx + (p[1] - a[1]) * aby) / len2));
  const x = a[0] + abx * t;
  const y = a[1] + aby * t;
  return { x, y, t, dist: Math.hypot(p[0] - x, p[1] - y) };
}

function nearlyParallel(a: WallSeg, b: WallSeg, deg = 10): boolean {
  let d = Math.abs(a.angle - b.angle) % 180;
  if (d > 90) d = 180 - d;
  return d <= deg;
}

function isSharedPair(a: WallSeg, b: WallSeg, thresh = 16): boolean {
  if (a.roomId === b.roomId) return false;
  if (!nearlyParallel(a, b)) return false;
  let hits = 0;
  for (let i = 1; i <= 4; i++) {
    const p = lerp(a.a, a.b, i / 5);
    const pr = projectOnSeg(p, b.a, b.b);
    if (pr.dist <= thresh && pr.t > 0.02 && pr.t < 0.98) hits += 1;
  }
  return hits >= 2;
}

export function collectWalls(
  rooms: Array<{ id: string; poly: Point[] }>,
): WallSeg[] {
  const walls: WallSeg[] = [];
  for (const room of rooms) {
    const poly = room.poly;
    const n = poly.length;
    if (n < 3) continue;
    const [cx, cy] = centroid(poly);
    for (let i = 0; i < n; i++) {
      const a = poly[i]!;
      const b = poly[(i + 1) % n]!;
      const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (length < 18) continue;
      const rad = Math.atan2(b[1] - a[1], b[0] - a[0]);
      let angle = (rad * 180) / Math.PI;
      let nx = -Math.sin(rad);
      let ny = Math.cos(rad);
      const mx = (a[0] + b[0]) / 2;
      const my = (a[1] + b[1]) / 2;
      if (nx * (cx - mx) + ny * (cy - my) < 0) {
        angle += 180;
        nx = -nx;
        ny = -ny;
      }
      walls.push({
        a,
        b,
        roomId: room.id,
        length,
        angle,
        nx,
        ny,
        shared: false,
      });
    }
  }
  for (let i = 0; i < walls.length; i++) {
    for (let j = i + 1; j < walls.length; j++) {
      if (isSharedPair(walls[i]!, walls[j]!)) {
        walls[i]!.shared = true;
        walls[j]!.shared = true;
      }
    }
  }
  return walls;
}

export function nearestWall(
  p: Point,
  walls: WallSeg[],
  opts?: { prefer?: "shared" | "exterior" | "any"; maxDist?: number },
): { wall: WallSeg; x: number; y: number; t: number; dist: number } | null {
  const maxDist = opts?.maxDist ?? WALL_SNAP;
  const prefer = opts?.prefer ?? "any";
  let best: { wall: WallSeg; x: number; y: number; t: number; dist: number } | null =
    null;
  let bestScore = Infinity;
  for (const wall of walls) {
    if (prefer === "shared" && !wall.shared) continue;
    if (prefer === "exterior" && wall.shared) continue;
    const hit = projectOnSeg(p, wall.a, wall.b);
    if (hit.dist > maxDist) continue;
    const score =
      prefer === "any" ? hit.dist - (wall.shared ? 6 : 0) : hit.dist;
    if (score < bestScore) {
      bestScore = score;
      best = { wall, x: hit.x, y: hit.y, t: hit.t, dist: hit.dist };
    }
  }
  if (best) return best;
  if (prefer !== "any") return nearestWall(p, walls, { prefer: "any", maxDist });
  return null;
}

function clampSpan(t0: number, t1: number, wall: WallSeg, minLen: number) {
  const span = Math.abs(t1 - t0) * wall.length;
  if (span >= minLen) return { t0: Math.min(t0, t1), t1: Math.max(t0, t1) };
  const mid = (t0 + t1) / 2;
  const half = minLen / 2 / wall.length;
  let a = mid - half;
  let b = mid + half;
  if (a < 0.02) {
    b += 0.02 - a;
    a = 0.02;
  }
  if (b > 0.98) {
    a -= b - 0.98;
    b = 0.98;
  }
  return { t0: Math.max(0.02, a), t1: Math.min(0.98, b) };
}

function faceInside(
  pose: SnapPose,
  rooms: Array<{ id: string; poly: Point[] }>,
): SnapPose {
  const wall = pose.wall;
  if (!wall) return pose;
  const room = rooms.find((r) => r.id === wall.roomId);
  if (!room) return pose;
  const [cx, cy] = centroid(room.poly);
  const rad = (pose.rotation * Math.PI) / 180;
  const sx = -Math.sin(rad);
  const sy = Math.cos(rad);
  if (sx * (cx - pose.x) + sy * (cy - pose.y) >= 0) return pose;
  return { ...pose, rotation: pose.rotation + 180 };
}

export function poseOnWall(
  kind: "door" | "window" | "stair",
  wall: WallSeg,
  tA: number,
  tB: number,
  width?: number,
  style?: StairStyle,
): SnapPose {
  const minLen = kind === "stair" ? 48 : 28;
  const { t0, t1 } = clampSpan(tA, tB, wall, minLen);
  const p0 = lerp(wall.a, wall.b, t0);
  const p1 = lerp(wall.a, wall.b, t1);
  let x = (p0[0] + p1[0]) / 2;
  let y = (p0[1] + p1[1]) / 2;
  const length = Math.max(minLen, Math.hypot(p1[0] - p0[0], p1[1] - p0[1]));
  const w = width ?? (kind === "stair" ? 52 : undefined);
  if (kind === "stair") {
    const inward =
      style === "quarter" ? STAIR_TREAD / 2 : (w ?? 52) / 2;
    if (style === "spiral") {
      x += wall.nx * Math.max(inward, length * 0.35);
      y += wall.ny * Math.max(inward, length * 0.35);
    } else {
      x += wall.nx * inward;
      y += wall.ny * inward;
    }
  }
  return {
    x,
    y,
    rotation: wall.angle,
    length,
    width: w,
    snapped: true,
    wall,
  };
}

function nearestVertex(
  p: Point,
  rooms: Array<{ id: string; poly: Point[] }>,
  maxDist: number,
): { room: { id: string; poly: Point[] }; index: number; vertex: Point; dist: number } | null {
  let best: {
    room: { id: string; poly: Point[] };
    index: number;
    vertex: Point;
    dist: number;
  } | null = null;
  for (const room of rooms) {
    const poly = room.poly;
    for (let i = 0; i < poly.length; i++) {
      const v = poly[i]!;
      const d = Math.hypot(p[0] - v[0], p[1] - v[1]);
      if (d <= maxDist && (!best || d < best.dist)) {
        best = { room, index: i, vertex: v, dist: d };
      }
    }
  }
  return best;
}

/**
 * Quart tournant : le coude du L se pose sur le sommet.
 * Première volée le long du mur le plus proche, +X vers le coin,
 * deuxième volée le long de l’autre mur (flip si besoin).
 */
export function snapQuarterStair(
  p: Point,
  rooms: Array<{ id: string; poly: Point[] }>,
  opts?: {
    length?: number;
    width?: number;
    from?: Point;
    maxDist?: number;
  },
): SnapPose | null {
  const maxDist = opts?.maxDist ?? WALL_SNAP * 1.8;
  const probe = opts?.from ?? p;
  const hit = nearestVertex(probe, rooms, maxDist);
  if (!hit) return null;
  const poly = hit.room.poly;
  const n = poly.length;
  if (n < 3) return null;
  const vertex = hit.vertex;
  const prev = poly[(hit.index - 1 + n) % n]!;
  const next = poly[(hit.index + 1) % n]!;
  const dPrev = distToSegment(probe[0], probe[1], prev[0], prev[1], vertex[0], vertex[1]);
  const dNext = distToSegment(probe[0], probe[1], vertex[0], vertex[1], next[0], next[1]);
  const along = dPrev <= dNext ? prev : next;
  const wallLen = Math.hypot(vertex[0] - along[0], vertex[1] - along[1]) || 1;
  const proj = projectOnSeg(p, along, vertex);
  const dragged = Boolean(opts?.from);
  const defaultLen = opts?.length ?? 110;
  const rawLen = dragged ? Math.abs(1 - proj.t) * wallLen : defaultLen;
  const L = Math.max(48, Math.min(rawLen, Math.max(48, wallLen - 4)));
  return poseQuarterAtCorner(vertex, along, poly, L, opts?.width);
}

function poseQuarterAtCorner(
  vertex: Point,
  along: Point,
  roomPoly: Point[],
  length: number,
  width?: number,
): SnapPose {
  const L = Math.max(48, length);
  const T = STAIR_TREAD;
  const wallLen = Math.hypot(vertex[0] - along[0], vertex[1] - along[1]) || 1;
  const dirx = (vertex[0] - along[0]) / wallLen;
  const diry = (vertex[1] - along[1]) / wallLen;
  const rotation = (Math.atan2(diry, dirx) * 180) / Math.PI;
  const rad = (rotation * Math.PI) / 180;
  const yx = -Math.sin(rad);
  const yy = Math.cos(rad);
  const [cx, cy] = centroid(roomPoly);
  const probeX = vertex[0] - dirx * (L / 2);
  const probeY = vertex[1] - diry * (L / 2);
  const inward = yx * (cx - probeX) + yy * (cy - probeY) >= 0;
  const flip = !inward;
  const ly = flip ? T / 2 : -T / 2;
  return {
    x: vertex[0] - (L / 2) * dirx - ly * yx,
    y: vertex[1] - (L / 2) * diry - ly * yy,
    rotation,
    length: L,
    width: width ?? 52,
    snapped: true,
    flip,
  };
}

function nearestCorner(
  p: Point,
  walls: WallSeg[],
  maxDist: number,
): { wall: WallSeg; t: number; dist: number } | null {
  let best: { wall: WallSeg; t: number; dist: number } | null = null;
  for (const wall of walls) {
    const da = Math.hypot(p[0] - wall.a[0], p[1] - wall.a[1]);
    const db = Math.hypot(p[0] - wall.b[0], p[1] - wall.b[1]);
    const inset = Math.min(0.18, 36 / wall.length);
    if (da <= maxDist && (!best || da < best.dist)) {
      best = { wall, t: inset, dist: da };
    }
    if (db <= maxDist && (!best || db < best.dist)) {
      best = { wall, t: 1 - inset, dist: db };
    }
  }
  return best;
}

export function snapMark(
  kind: "door" | "window" | "stair",
  p: Point,
  rooms: Array<{ id: string; poly: Point[] }>,
  opts?: {
    length?: number;
    width?: number;
    style?: StairStyle;
    from?: Point;
    walls?: WallSeg[];
    lock?: WallSeg;
  },
): SnapPose {
  const walls = opts?.walls ?? collectWalls(rooms);
  const prefer =
    kind === "door" ? "shared" : kind === "window" ? "exterior" : "any";
  const defaultLen = opts?.length ?? (kind === "window" ? 80 : kind === "stair" ? 110 : 64);
  const width = opts?.width ?? (kind === "stair" ? 52 : undefined);

  const locked = opts?.lock;
  if (locked) {
    const from = opts?.from ?? p;
    const a = projectOnSeg(from, locked.a, locked.b);
    const b = projectOnSeg(p, locked.a, locked.b);
    return faceInside(
      poseOnWall(kind, locked, a.t, b.t, width, opts?.style),
      rooms,
    );
  }

  const from = opts?.from;
  const probe = from ?? p;

  if (kind === "stair" && opts?.style === "quarter") {
    const quarter = snapQuarterStair(p, rooms, {
      length: defaultLen,
      width,
      from,
      maxDist: WALL_SNAP * 1.8,
    });
    if (quarter) return quarter;
  }

  if (kind === "stair" && !from && opts?.style !== "quarter") {
    const corner = nearestCorner(probe, walls, WALL_SNAP * 1.5);
    if (corner) {
      const half = defaultLen / 2 / corner.wall.length;
      const t0 = corner.t < 0.5 ? corner.t : corner.t - 2 * half;
      const t1 = corner.t < 0.5 ? corner.t + 2 * half : corner.t;
      return faceInside(
        poseOnWall(kind, corner.wall, t0, t1, width, opts?.style),
        rooms,
      );
    }
  }

  const hit = nearestWall(probe, walls, { prefer, maxDist: WALL_SNAP });
  if (!hit) {
    if (from) {
      const length = Math.max(24, Math.hypot(p[0] - from[0], p[1] - from[1]));
      return {
        x: (from[0] + p[0]) / 2,
        y: (from[1] + p[1]) / 2,
        rotation: (Math.atan2(p[1] - from[1], p[0] - from[0]) * 180) / Math.PI,
        length,
        width,
        snapped: false,
      };
    }
    return {
      x: p[0],
      y: p[1],
      rotation: 0,
      length: defaultLen,
      width,
      snapped: false,
    };
  }

  const half = defaultLen / 2 / hit.wall.length;
  if (!from) {
    return faceInside(
      poseOnWall(
        kind,
        hit.wall,
        hit.t - half,
        hit.t + half,
        width,
        opts?.style,
      ),
      rooms,
    );
  }
  const a = projectOnSeg(from, hit.wall.a, hit.wall.b);
  const b = projectOnSeg(p, hit.wall.a, hit.wall.b);
  return faceInside(
    poseOnWall(kind, hit.wall, a.t, b.t, width, opts?.style),
    rooms,
  );
}

export function snapExisting(
  kind: "door" | "window" | "stair",
  f: { x: number; y: number; rotation: number; length: number; width?: number; style?: StairStyle },
  rooms: Array<{ id: string; poly: Point[] }>,
  walls?: WallSeg[],
): SnapPose | null {
  const list = walls ?? collectWalls(rooms);
  if (kind === "stair" && f.style === "quarter") {
    const probe = quarterOuterCorner(f);
    const quarter = snapQuarterStair(probe, rooms, {
      length: f.length,
      width: f.width,
      maxDist: WALL_SNAP * 2.4,
    });
    if (quarter) return quarter;
  }
  const prefer =
    kind === "door" ? "shared" : kind === "window" ? "exterior" : "any";
  const hit = nearestWall([f.x, f.y], list, { prefer, maxDist: WALL_SNAP * 1.8 });
  if (!hit) return null;
  const half = f.length / 2 / hit.wall.length;
  return faceInside(
    poseOnWall(kind, hit.wall, hit.t - half, hit.t + half, f.width, f.style),
    rooms,
  );
}

export function snapResizeEnds(
  kind: "door" | "window" | "stair",
  orig: { x: number; y: number; rotation: number; length: number; width?: number; style?: StairStyle },
  moving: "a" | "b",
  wx: number,
  wy: number,
  rooms: Array<{ id: string; poly: Point[] }>,
  walls?: WallSeg[],
): SnapPose {
  const list = walls ?? collectWalls(rooms);
  const ends = markEnds(orig);
  const fixed = moving === "a" ? ends.b : ends.a;
  const prefer =
    kind === "door" ? "shared" : kind === "window" ? "exterior" : "any";
  const hit = nearestWall([orig.x, orig.y], list, { prefer, maxDist: WALL_SNAP * 2 });
  if (!hit) {
    const other: Point = [wx, wy];
    const a = moving === "a" ? other : fixed;
    const b = moving === "a" ? fixed : other;
    return {
      x: (a[0] + b[0]) / 2,
      y: (a[1] + b[1]) / 2,
      rotation: (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI,
      length: Math.max(24, Math.hypot(b[0] - a[0], b[1] - a[1])),
      width: orig.width,
      snapped: false,
    };
  }
  const tFixed = projectOnSeg(fixed, hit.wall.a, hit.wall.b).t;
  const tMove = projectOnSeg([wx, wy], hit.wall.a, hit.wall.b).t;
  return faceInside(
    poseOnWall(kind, hit.wall, tFixed, tMove, orig.width, orig.style),
    rooms,
  );
}

export function distToWall(p: Point, wall: WallSeg) {
  return distToSegment(p[0], p[1], wall.a[0], wall.a[1], wall.b[0], wall.b[1]);
}

export function defaultMarkWidth(kind: "door" | "window" | "stair") {
  return kind === "stair" ? 52 : undefined;
}

export function stairWidthOf(f: { length: number; width?: number }) {
  return fixtureWidth({ kind: "stair", length: f.length, width: f.width });
}

function orient(a: Point, b: Point, c: Point) {
  return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
}

export function segsCross(a: Point, b: Point, c: Point, d: Point) {
  const o1 = orient(a, b, c);
  const o2 = orient(a, b, d);
  const o3 = orient(c, d, a);
  const o4 = orient(c, d, b);
  return o1 * o2 < 0 && o3 * o4 < 0;
}

function doorOnWall(
  wall: WallSeg,
  doors: Array<{ x: number; y: number; length: number }>,
) {
  const mid: Point = [(wall.a[0] + wall.b[0]) / 2, (wall.a[1] + wall.b[1]) / 2];
  return doors.some((d) => {
    const reach = Math.max(26, d.length * 0.55);
    return (
      distToSegment(d.x, d.y, wall.a[0], wall.a[1], wall.b[0], wall.b[1]) <= 22 &&
      Math.hypot(d.x - mid[0], d.y - mid[1]) <= reach + wall.length / 2
    );
  });
}

export function pathHitsWall(
  from: Point,
  to: Point,
  walls: WallSeg[],
  doors: Array<{ x: number; y: number; length: number }>,
) {
  for (const wall of walls) {
    if (!segsCross(from, to, wall.a, wall.b)) continue;
    if (!doorOnWall(wall, doors)) return true;
  }
  return false;
}

/** Glisse un pion : les murs bloquent, une porte laisse passer. */
export function slideToken(
  from: Point,
  to: Point,
  walls: WallSeg[],
  doors: Array<{ x: number; y: number; length: number }>,
  rooms: Array<{ id: string; poly: Point[] }>,
): { x: number; y: number; roomId: string } {
  let x = to[0];
  let y = to[1];
  if (pathHitsWall(from, to, walls, doors)) {
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 14; i++) {
      const m = (lo + hi) / 2;
      const p: Point = [from[0] + (to[0] - from[0]) * m, from[1] + (to[1] - from[1]) * m];
      if (pathHitsWall(from, p, walls, doors)) hi = m;
      else lo = m;
    }
    x = from[0] + (to[0] - from[0]) * lo;
    y = from[1] + (to[1] - from[1]) * lo;
  }
  const host = rooms.find((r) => pointInPoly(r.poly, x, y));
  return { x, y, roomId: host?.id ?? "" };
}
