import { centroid, distToSegment, fixtureWidth, markEnds } from "./geometry";
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
    const inward = (w ?? 52) / 2;
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
