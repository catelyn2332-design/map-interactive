import { Check, Magnet, Minus, Plus, Scan, Trash2 } from "lucide-react";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { FillSwatches, PlanMenu, clampMenu, type PlanMenuTarget } from "@/components/atlas/plan-menu";
import { ColorWheel } from "@/components/atlas/color-wheel";
import { Button } from "@/components/ui/button";
import { floorById } from "@/lib/map/house";
import { resolveFloor } from "@/lib/map/edits";
import {
  applyHandle,
  area,
  bounds,
  boxesOverlap,
  canCloseZone,
  centroid,
  distToSegment,
  doorMark,
  ellipsePoly,
  fixtureWidth,
  handleCursor,
  labelSize,
  lassoReady,
  lineReady,
  markEnds,
  markFromEnds,
  markSides,
  pointInPoly,
  pointInRotatedRect,
  polyToPath,
  scalePoly,
  snapZonePoint,
  stairLines,
  translatePoly,
  widthFromPoint,
  type HandleId,
} from "@/lib/map/geometry";
import {
  collectWalls,
  snapExisting,
  snapMark,
  snapResizeEnds,
  type WallSeg,
} from "@/lib/map/snap";
import { roomMatches, useAtlas } from "@/lib/map/store";
import { handleSizePx, useUiStore } from "@/lib/map/ui";
import { tintOf, tokenActors } from "@/lib/map/props";
import { pressProps } from "@/lib/press";
import type { MapFixture, Point, PropTone, StairStyle, ZoneFill } from "@/lib/map/types";
import { zoneHex, zonePaint } from "@/lib/map/types";
import { cn } from "@/lib/utils";

const TOKEN_R = 16;
const TOKEN_COLORS = [
  "var(--color-token-stella)",
  "var(--color-token-antoine)",
  "var(--color-token-myriam)",
];
const MIN_K = 0.7;
const MAX_K = 6;
const TAP_PX = 28;
const HANDLES: HandleId[] = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];

function fillFor(tone: PropTone | undefined, active: boolean, dim: boolean): string {
  if (dim) return "color-mix(in oklab, var(--color-foreground) 3%, var(--color-paper))";
  if (active)
    return "color-mix(in oklab, var(--color-primary) 32%, var(--color-paper))";
  switch (tone) {
    case "clay":
      return "color-mix(in oklab, var(--color-clay) 16%, var(--color-paper))";
    case "stone":
      return "color-mix(in oklab, var(--color-stone) 28%, var(--color-paper))";
    case "ink":
      return "color-mix(in oklab, var(--color-primary) 18%, var(--color-paper))";
    case "sage":
      return "color-mix(in oklab, var(--color-primary) 8%, var(--color-paper))";
    default:
      return "color-mix(in oklab, var(--color-primary) 8%, var(--color-paper))";
  }
}

function clampK(k: number) {
  return Math.min(MAX_K, Math.max(MIN_K, k));
}

function dist(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function handlePoints(box: ReturnType<typeof bounds>) {
  const cx = (box.minX + box.maxX) / 2;
  const cy = (box.minY + box.maxY) / 2;
  return {
    nw: [box.minX, box.minY] as Point,
    n: [cx, box.minY] as Point,
    ne: [box.maxX, box.minY] as Point,
    e: [box.maxX, cy] as Point,
    se: [box.maxX, box.maxY] as Point,
    s: [cx, box.maxY] as Point,
    sw: [box.minX, box.maxY] as Point,
    w: [box.minX, cy] as Point,
  };
}

function polyFromBox(
  shape: "rect" | "ellipse",
  x: number,
  y: number,
  w: number,
  h: number,
): Point[] {
  if (shape === "ellipse") return ellipsePoly(x + w / 2, y + h / 2, w / 2, h / 2);
  return [
    [x, y],
    [x + w, y],
    [x + w, y + h],
    [x, y + h],
  ];
}

export const FloorPlan = memo(function FloorPlan() {
  const floorId = useAtlas((s) => s.floorId);
  const selectedId = useAtlas((s) => s.selectedId);
  const selectedMarkId = useAtlas((s) => s.selectedMarkId);
  const select = useAtlas((s) => s.select);
  const selectMark = useAtlas((s) => s.selectMark);
  const tokens = useAtlas((s) => s.tokens);
  const characters = useAtlas((s) => s.characters);
  const placingTokenId = useAtlas((s) => s.placingTokenId);
  const moveToken = useAtlas((s) => s.moveToken);
  const query = useAtlas((s) => s.query);
  const filters = useAtlas((s) => s.filters);
  const sceneRoomId = useAtlas((s) => s.sceneRoomId);
  const schema = useAtlas((s) => s.schema);
  const allRooms = useAtlas((s) => s.rooms);
  const floors = useAtlas((s) => s.floors);
  const fixtures = useAtlas((s) => s.fixtures);
  const tool = useAtlas((s) => s.tool);
  const drawShape = useAtlas((s) => s.drawShape);
  const addRoom = useAtlas((s) => s.addRoom);
  const patchRoom = useAtlas((s) => s.patchRoom);
  const addFixture = useAtlas((s) => s.addFixture);
  const patchFixture = useAtlas((s) => s.patchFixture);
  const deleteFixture = useAtlas((s) => s.deleteFixture);
  const deleteRoom = useAtlas((s) => s.deleteRoom);
  const zoneFill = useAtlas((s) => s.zoneFill);
  const setZoneFill = useAtlas((s) => s.setZoneFill);
  const stairStyle = useAtlas((s) => s.stairStyle);
  const chrome = useUiStore((s) => s.chrome);
  const emptyPlan = useUiStore((s) => s.copy.emptyPlan);

  const floor = floorById(floors, floorId);
  const rooms = useMemo(
    () => resolveFloor(floorId, allRooms, schema),
    [floorId, allRooms, schema],
  );
  const marks = useMemo(
    () => fixtures.filter((f) => f.floorId === floorId),
    [fixtures, floorId],
  );
  const walls = useMemo(() => collectWalls(rooms), [rooms]);
  const actors = useMemo(
    () => tokenActors(schema, characters),
    [schema, characters],
  );
  const vb = floor?.viewBox ?? [0, 0, 1600, 1000];

  const wrapRef = useRef<HTMLDivElement>(null);
  const camRef = useRef({ x: 0, y: 0, k: 1 });
  const [cam, setCam] = useState({ x: 0, y: 0, k: 1 });
  const roomsRef = useRef(rooms);
  roomsRef.current = rooms;
  const marksRef = useRef(marks);
  marksRef.current = marks;
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const drag = useRef<{
    kind: "maybe" | "pan" | "token" | "pinch" | "draw" | "resize" | "move-room" | "place" | "lasso" | "resize-mark" | "line" | "move-mark";
    id?: string;
    roomId?: string;
    handle?: HandleId;
    end?: "a" | "b" | "w";
    markId?: string;
    fixed?: Point;
    lx: number;
    ly: number;
    wx?: number;
    wy?: number;
    dist?: number;
    k?: number;
    moved?: boolean;
    origPoly?: Point[];
    origBox?: ReturnType<typeof bounds>;
    origX?: number;
    origY?: number;
    wall?: WallSeg;
  } | null>(null);
  const [draft, setDraft] = useState<{ x: number; y: number; w: number; h: number } | null>(
    null,
  );
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const [polyDraft, setPolyDraft] = useState<Point[]>([]);
  const polyDraftRef = useRef(polyDraft);
  polyDraftRef.current = polyDraft;
  const [hover, setHover] = useState<Point | null>(null);
  const [livePoly, setLivePoly] = useState<Point[] | null>(null);
  const [liveMark, setLiveMark] = useState<MapFixture | null>(null);
  const [placeDraft, setPlaceDraft] = useState<MapFixture | null>(null);
  const [ghostMark, setGhostMark] = useState<MapFixture | null>(null);
  const [snapWall, setSnapWall] = useState<WallSeg | null>(null);
  const ignoreUntil = useRef(Date.now() + 700);
  const [menu, setMenu] = useState<{ x: number; y: number; target: PlanMenuTarget } | null>(
    null,
  );
  const [zoneColor, setZoneColor] = useState(() => zoneHex(useAtlas.getState().zoneFill));
  const hold = useRef(0);
  const holdOpened = useRef(false);

  function clearHold() {
    if (hold.current) {
      window.clearTimeout(hold.current);
      hold.current = 0;
    }
  }

  function openMenuAt(clientX: number, clientY: number, roomId?: string, markId?: string) {
    const mark = markId ? marksRef.current.find((f) => f.id === markId) : undefined;
    const room = roomId ? roomsRef.current.find((r) => r.id === roomId) : undefined;
    const useMark = mark && (mark.kind !== "zone" || !room);
    if (!useMark && !room) return;
    holdOpened.current = true;
    if (useMark && mark) selectMark(mark.id);
    else if (room) select(room.id);
    setMenu({
      ...clampMenu(clientX, clientY),
      target:
        useMark && mark ? { kind: "mark", mark } : { kind: "room", room: room! },
    });
  }

  function applyCam(next: { x: number; y: number; k: number }) {
    camRef.current = next;
    setCam(next);
  }

  useEffect(() => {
    ignoreUntil.current = Date.now() + 700;
  }, []);

  useEffect(() => {
    applyCam({ x: 0, y: 0, k: 1 });
    ignoreUntil.current = Date.now() + 280;
    setPolyDraft([]);
    setDraft(null);
    setPlaceDraft(null);
    setGhostMark(null);
    setSnapWall(null);
    setLivePoly(null);
  }, [floorId]);

  useEffect(() => {
    setPolyDraft([]);
    setDraft(null);
    setPlaceDraft(null);
    setGhostMark(null);
    setSnapWall(null);
  }, [tool, drawShape]);

  function clientToWorld(cx: number, cy: number): Point {
    const el = wrapRef.current;
    const c = camRef.current;
    if (!el) return [0, 0];
    const r = el.getBoundingClientRect();
    const s = Math.min(r.width / vb[2], r.height / vb[3]);
    const ox = (r.width - vb[2] * s) / 2;
    const oy = (r.height - vb[3] * s) / 2;
    const x = (cx - r.left - ox) / s;
    const y = (cy - r.top - oy) / s;
    return [(x - c.x) / c.k, (y - c.y) / c.k];
  }

  function screenScale() {
    const el = wrapRef.current;
    if (!el) return 1;
    const r = el.getBoundingClientRect();
    return Math.min(r.width / vb[2], r.height / vb[3]) * camRef.current.k;
  }

  function zoomAround(factor: number, clientX?: number, clientY?: number) {
    const el = wrapRef.current;
    const c = camRef.current;
    let sx = clientX;
    let sy = clientY;
    if (sx == null || sy == null) {
      if (!el) return;
      const r = el.getBoundingClientRect();
      sx = r.left + r.width / 2;
      sy = r.top + r.height / 2;
    }
    const [wx, wy] = clientToWorld(sx, sy);
    const nk = clampK(c.k * factor);
    applyCam({ x: c.x + wx * (c.k - nk), y: c.y + wy * (c.k - nk), k: nk });
  }

  function fitView() {
    applyCam({ x: 0, y: 0, k: 1 });
  }

  function closePolygon() {
    const pts = polyDraftRef.current;
    if (pts.length < 3) {
      setPolyDraft([]);
      return;
    }
    addRoom(pts);
    setPolyDraft([]);
    setHover(null);
  }

  function closeLine(extra?: Point) {
    const pts = extra
      ? [...polyDraftRef.current, extra]
      : polyDraftRef.current;
    const poly = lineReady(pts);
    if (!poly) return false;
    addRoom(poly);
    setPolyDraft([]);
    setHover(null);
    return true;
  }

  function closeZone(extra?: Point) {
    const pts = extra
      ? [...polyDraftRef.current, extra]
      : polyDraftRef.current;
    const poly = lassoReady(pts);
    if (!poly) return false;
    const [x, y] = centroid(poly);
    addFixture({
      floorId,
      kind: "zone",
      x,
      y,
      rotation: 0,
      length: 48,
      poly,
      fill: useAtlas.getState().zoneFill,
      color: zoneColor,
    });
    setPolyDraft([]);
    setHover(null);
    return true;
  }

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const onWheelNative = (e: WheelEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      const factor = e.deltaY > 0 ? 0.9 : 1.12;
      zoomAround(factor, e.clientX, e.clientY);
    };
    el.addEventListener("wheel", onWheelNative, { passive: false });
    return () => el.removeEventListener("wheel", onWheelNative);
  }, [vb]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        zoomAround(1.18);
      } else if (e.key === "-" || e.key === "_") {
        e.preventDefault();
        zoomAround(0.85);
      } else if (e.key === "0") {
        fitView();
      } else if (e.key === "Enter" && tool === "draw" && drawShape === "polygon") {
        e.preventDefault();
        closePolygon();
      } else if (e.key === "Enter" && tool === "draw" && drawShape === "line") {
        e.preventDefault();
        closeLine();
      } else if (e.key === "Enter" && tool === "zone") {
        e.preventDefault();
        closeZone();
      } else if (e.key === "Escape") {
        setPolyDraft([]);
        setDraft(null);
        setPlaceDraft(null);
        setMenu(null);
        if (tool !== "select") useAtlas.getState().setTool("select");
      } else if ((e.key === "Backspace" || e.key === "Delete") && selectedMarkId) {
        e.preventDefault();
        deleteFixture(selectedMarkId);
      } else if ((e.key === "Backspace" || e.key === "Delete") && selectedId) {
        e.preventDefault();
        deleteRoom(selectedId);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [vb, tool, drawShape, selectedMarkId, selectedId, deleteFixture, deleteRoom]);

  function releasePtr(target: EventTarget | null, pointerId: number) {
    try {
      (target as HTMLElement | null)?.releasePointerCapture?.(pointerId);
    } catch {
      /* already released */
    }
  }

  function hitRoom(clientX: number, clientY: number) {
    const [wx, wy] = clientToWorld(clientX, clientY);
    const list = roomsRef.current;
    for (let i = list.length - 1; i >= 0; i--) {
      const room = list[i]!;
      const poly = livePoly && room.id === selectedId ? livePoly : room.poly;
      if (pointInPoly(poly, wx, wy)) return room;
    }
    return undefined;
  }

  function hitMark(wx: number, wy: number) {
    const list = marksRef.current;
    for (let i = list.length - 1; i >= 0; i--) {
      const f = list[i]!;
      if (f.kind === "zone") continue;
      if (f.kind === "stair") {
        const shown = liveMark && liveMark.id === f.id ? liveMark : f;
        if (shown.style === "spiral") {
          if (Math.hypot(wx - shown.x, wy - shown.y) <= shown.length / 2 + 10) return f;
        } else if (pointInRotatedRect(shown, wx, wy, 10)) {
          return f;
        }
      } else {
        const rad = (f.rotation * Math.PI) / 180;
        const dx = Math.cos(rad) * (f.length / 2);
        const dy = Math.sin(rad) * (f.length / 2);
        if (distToSegment(wx, wy, f.x - dx, f.y - dy, f.x + dx, f.y + dy) < 16) return f;
      }
    }
    for (let i = list.length - 1; i >= 0; i--) {
      const f = list[i]!;
      if (f.kind !== "zone" || !f.poly) continue;
      if (pointInPoly(f.poly, wx, wy)) return f;
    }
    return undefined;
  }

  function hitHandleAt(wx: number, wy: number, poly: Point[], hs: number) {
    const pts = handlePoints(bounds(poly));
    for (const id of HANDLES) {
      const [x, y] = pts[id];
      if (Math.abs(wx - x) <= hs && Math.abs(wy - y) <= hs) return id;
    }
    return undefined;
  }

  function onPointerDown(e: React.PointerEvent) {
    if (Date.now() < ignoreUntil.current && tool === "select") return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    holdOpened.current = false;
    clearHold();
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      /* svg / lost */
    }

    if (pointers.current.size >= 2) {
      const pts = [...pointers.current.values()];
      drag.current = {
        kind: "pinch",
        dist: dist(pts[0]!, pts[1]!),
        k: camRef.current.k,
        lx: (pts[0]!.x + pts[1]!.x) / 2,
        ly: (pts[0]!.y + pts[1]!.y) / 2,
      };
      return;
    }

    const [wx, wy] = clientToWorld(e.clientX, e.clientY);
    const handlePx = handleSizePx(chrome.handleSize);
    const hs = handlePx / Math.max(0.12, screenScale());

    if (tool === "select" && e.pointerType !== "mouse") {
      hold.current = window.setTimeout(() => {
        const mark = hitMark(wx, wy);
        const room = hitRoom(e.clientX, e.clientY);
        openMenuAt(e.clientX, e.clientY, room?.id, mark?.id);
      }, 480);
    }

    if (tool === "draw" && (drawShape === "rect" || drawShape === "ellipse")) {
      drag.current = {
        kind: "draw",
        lx: e.clientX,
        ly: e.clientY,
        wx,
        wy,
        moved: false,
      };
      setDraft({ x: wx, y: wy, w: 0, h: 0 });
      return;
    }

    if (tool === "draw" && drawShape === "polygon") {
      drag.current = { kind: "maybe", lx: e.clientX, ly: e.clientY, wx, wy, moved: false };
      return;
    }

    if (tool === "draw" && drawShape === "line") {
      const pts = polyDraftRef.current;
      const p = snapZonePoint(pts, [wx, wy]);
      drag.current = {
        kind: "line",
        lx: e.clientX,
        ly: e.clientY,
        wx,
        wy,
        moved: false,
      };
      if (pts.length === 0) setPolyDraft([p]);
      else if (canCloseZone(pts, p)) {
        closeLine(p);
        drag.current = null;
      }
      setHover(p);
      return;
    }

    if (tool === "zone") {
      drag.current = {
        kind: "lasso",
        lx: e.clientX,
        ly: e.clientY,
        wx,
        wy,
        moved: false,
      };
      setPolyDraft([[wx, wy]]);
      return;
    }

    if (tool === "token") {
      drag.current = { kind: "maybe", lx: e.clientX, ly: e.clientY, wx, wy, moved: false };
      return;
    }

    if (tool === "door" || tool === "window" || tool === "stair") {
      const pose = snapMark(tool, [wx, wy], roomsRef.current, {
        style: stairStyle,
        walls,
        width: tool === "stair" ? 52 : undefined,
      });
      drag.current = {
        kind: "place",
        lx: e.clientX,
        ly: e.clientY,
        wx,
        wy,
        moved: false,
        wall: pose.wall,
      };
      setPlaceDraft({
        id: "draft",
        floorId,
        kind: tool,
        x: pose.x,
        y: pose.y,
        rotation: pose.rotation,
        length: pose.length,
        width: pose.width,
        style: tool === "stair" ? stairStyle : undefined,
      });
      setSnapWall(pose.wall ?? null);
      setGhostMark(null);
      return;
    }

    const selected = roomsRef.current.find((r) => r.id === selectedId);
    if (tool === "select") {
      const markSel = marksRef.current.find((f) => f.id === selectedMarkId);
      if (markSel && markSel.kind !== "zone") {
        const ends = markEnds(markSel);
        const grips: Array<{ end: "a" | "b" | "w"; p: Point }> = [
          { end: "a", p: ends.a },
          { end: "b", p: ends.b },
        ];
        if (markSel.kind === "stair") {
          const sides = markSides(markSel);
          grips.push({ end: "w", p: sides.n }, { end: "w", p: sides.s });
        }
        let best: (typeof grips)[number] | null = null;
        let bestD = Infinity;
        for (const g of grips) {
          const d = Math.hypot(wx - g.p[0], wy - g.p[1]);
          if (d < bestD) {
            bestD = d;
            best = g;
          }
        }
        const toCenter = Math.hypot(wx - markSel.x, wy - markSel.y);
        const onGrip = Boolean(best && bestD <= hs && bestD <= toCenter);
        if (onGrip && best) {
          drag.current = {
            kind: "resize-mark",
            markId: markSel.id,
            end: best.end,
            fixed: best.end === "a" ? ends.b : best.end === "b" ? ends.a : undefined,
            lx: e.clientX,
            ly: e.clientY,
            wx,
            wy,
            moved: false,
          };
          return;
        }
        const onBody =
          markSel.kind === "stair" && markSel.style === "spiral"
            ? Math.hypot(wx - markSel.x, wy - markSel.y) <= markSel.length / 2 + 10
            : pointInRotatedRect(markSel, wx, wy, 10);
        if (onBody) {
          selectMark(markSel.id);
          drag.current = {
            kind: "maybe",
            id: markSel.id,
            markId: markSel.id,
            origX: markSel.x,
            origY: markSel.y,
            lx: e.clientX,
            ly: e.clientY,
            wx,
            wy,
            moved: false,
          };
          return;
        }
      }
    }
    if (selected && tool === "select") {
      const handle = hitHandleAt(wx, wy, livePoly ?? selected.poly, hs);
      if (handle) {
        const poly = livePoly ?? selected.poly;
        drag.current = {
          kind: "resize",
          handle,
          roomId: selected.id,
          origPoly: poly,
          origBox: bounds(poly),
          lx: e.clientX,
          ly: e.clientY,
          wx,
          wy,
          moved: false,
        };
        return;
      }
    }

    const mark = hitMark(wx, wy);
    if (mark) {
      selectMark(mark.id);
      drag.current = {
        kind: "maybe",
        id: mark.id,
        markId: mark.id,
        origX: mark.x,
        origY: mark.y,
        lx: e.clientX,
        ly: e.clientY,
        wx,
        wy,
        moved: false,
      };
      return;
    }

    const hit = hitRoom(e.clientX, e.clientY);
    if (hit && hit.id === selectedId) {
      drag.current = {
        kind: "maybe",
        roomId: hit.id,
        origPoly: hit.poly,
        lx: e.clientX,
        ly: e.clientY,
        wx,
        wy,
        moved: false,
      };
      return;
    }
    drag.current = {
      kind: "maybe",
      roomId: hit?.id,
      lx: e.clientX,
      ly: e.clientY,
      moved: false,
    };
  }

  function onPointerMove(e: React.PointerEvent) {
    if (pointers.current.has(e.pointerId)) {
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }
    const [wx, wy] = clientToWorld(e.clientX, e.clientY);
    if (tool === "draw" && drawShape === "polygon" && polyDraft.length) {
      setHover([wx, wy]);
    }
    if (tool === "draw" && drawShape === "line") {
      const pts = polyDraftRef.current;
      setHover(pts.length ? snapZonePoint(pts, [wx, wy]) : [wx, wy]);
    }
    if (tool === "zone" && polyDraft.length) {
      setHover([wx, wy]);
    }
    if (
      !drag.current &&
      (tool === "door" || tool === "window" || tool === "stair")
    ) {
      const pose = snapMark(tool, [wx, wy], roomsRef.current, {
        style: stairStyle,
        walls,
        width: tool === "stair" ? 52 : undefined,
      });
      setGhostMark({
        id: "ghost",
        floorId,
        kind: tool,
        x: pose.x,
        y: pose.y,
        rotation: pose.rotation,
        length: pose.length,
        width: pose.width,
        style: tool === "stair" ? stairStyle : undefined,
      });
      setSnapWall(pose.wall ?? null);
    }
    const d = drag.current;
    if (!d) return;

    const travelNow = Math.hypot(e.clientX - d.lx, e.clientY - d.ly);
    if (travelNow > 12) clearHold();

    if (d.kind === "draw") {
      const x0 = d.wx ?? wx;
      const y0 = d.wy ?? wy;
      setDraft({
        x: Math.min(x0, wx),
        y: Math.min(y0, wy),
        w: Math.abs(wx - x0),
        h: Math.abs(wy - y0),
      });
      d.moved = true;
      return;
    }

    if (d.kind === "place") {
      const markKind =
        tool === "door" || tool === "window" || tool === "stair" ? tool : "door";
      const from: Point = [d.wx ?? wx, d.wy ?? wy];
      const pose = snapMark(markKind, [wx, wy], roomsRef.current, {
        from,
        lock: d.wall,
        style: stairStyle,
        walls,
        width: markKind === "stair" ? 52 : undefined,
      });
      if (pose.wall && !d.wall) d.wall = pose.wall;
      setPlaceDraft({
        id: "draft",
        floorId,
        kind: markKind,
        x: pose.x,
        y: pose.y,
        rotation: pose.rotation,
        length: pose.length,
        width: pose.width,
        style: markKind === "stair" ? stairStyle : undefined,
      });
      setSnapWall(pose.wall ?? null);
      d.moved = Math.hypot(e.clientX - d.lx, e.clientY - d.ly) > 8;
      return;
    }

    if (d.kind === "lasso") {
      const pts = polyDraftRef.current;
      const last = pts[pts.length - 1];
      if (!last || Math.hypot(wx - last[0], wy - last[1]) >= 6) {
        setPolyDraft([...pts, [wx, wy]]);
      }
      d.moved = true;
      return;
    }

    if (d.kind === "line") {
      const pts = polyDraftRef.current;
      const p = snapZonePoint(pts, [wx, wy]);
      setHover(p);
      const travelLine = Math.hypot(e.clientX - d.lx, e.clientY - d.ly);
      if (travelLine > 8) d.moved = true;
      if (d.moved) {
        const last = pts[pts.length - 1];
        if (pts.length >= 3 && canCloseZone(pts, p)) {
          setHover(pts[0]!);
          return;
        }
        if (!last || Math.hypot(p[0] - last[0], p[1] - last[1]) >= 14) {
          setPolyDraft([...pts, p]);
        }
      }
      return;
    }

    if (d.kind === "move-mark" && d.markId) {
      const orig = marksRef.current.find((f) => f.id === d.markId);
      if (orig) {
        if (orig.kind === "door" || orig.kind === "window" || orig.kind === "stair") {
          const pose = snapMark(orig.kind, [wx, wy], roomsRef.current, {
            length: orig.length,
            width: orig.width,
            style: orig.style,
            walls,
          });
          setLiveMark({
            ...orig,
            x: pose.x,
            y: pose.y,
            rotation: pose.snapped ? pose.rotation : orig.rotation,
            length: pose.snapped ? pose.length : orig.length,
          });
          setSnapWall(pose.wall ?? null);
        } else {
          const dxw = wx - (d.wx ?? wx);
          const dyw = wy - (d.wy ?? wy);
          setLiveMark({
            ...orig,
            x: (d.origX ?? orig.x) + dxw,
            y: (d.origY ?? orig.y) + dyw,
          });
        }
      }
      d.moved = true;
      return;
    }

    if (d.kind === "resize-mark" && d.markId) {
      const orig = marksRef.current.find((f) => f.id === d.markId);
      if (orig) {
        if (d.end === "w") {
          setLiveMark({ ...orig, width: widthFromPoint(orig, wx, wy) });
        } else if (
          orig.kind === "door" ||
          orig.kind === "window" ||
          orig.kind === "stair"
        ) {
          const pose = snapResizeEnds(
            orig.kind,
            orig,
            d.end === "a" ? "a" : "b",
            wx,
            wy,
            roomsRef.current,
            walls,
          );
          setLiveMark({
            ...orig,
            x: pose.x,
            y: pose.y,
            rotation: pose.rotation,
            length: pose.length,
            width: pose.width ?? orig.width,
          });
          setSnapWall(pose.wall ?? null);
        } else if (d.fixed) {
          const next = markFromEnds(
            d.end === "a" ? [wx, wy] : d.fixed,
            d.end === "a" ? d.fixed : [wx, wy],
          );
          setLiveMark({ ...orig, ...next });
        }
      }
      d.moved = true;
      return;
    }

    if (d.kind === "resize" && d.origPoly && d.origBox && d.handle) {
      const next = applyHandle(d.origBox, d.handle, wx, wy, 48);
      setLivePoly(scalePoly(d.origPoly, d.origBox, next));
      d.moved = true;
      return;
    }

    if (d.kind === "pinch" && pointers.current.size >= 2) {
      const pts = [...pointers.current.values()];
      const now = dist(pts[0]!, pts[1]!);
      const midX = (pts[0]!.x + pts[1]!.x) / 2;
      const midY = (pts[0]!.y + pts[1]!.y) / 2;
      const startDist = Math.max(24, d.dist || now);
      zoomAround(now / startDist, midX, midY);
      d.dist = now;
      d.lx = midX;
      d.ly = midY;
      return;
    }

    const travel = Math.hypot(e.clientX - d.lx, e.clientY - d.ly);
    if (d.kind === "maybe") {
      if (travel < TAP_PX) return;
      if (d.origPoly && d.roomId === selectedId) {
        d.kind = "move-room";
        d.moved = true;
      } else if (
        d.id &&
        marksRef.current.find((f) => f.id === d.id && f.kind !== "zone")
      ) {
        d.kind = "move-mark";
        d.markId = d.id;
        d.moved = true;
      } else {
        d.kind = "pan";
        d.moved = true;
      }
    }

    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const s = Math.min(r.width / vb[2], r.height / vb[3]);
    const dx = (e.clientX - d.lx) / s;
    const dy = (e.clientY - d.ly) / s;
    d.lx = e.clientX;
    d.ly = e.clientY;
    if (d.kind === "pan") {
      const c = camRef.current;
      applyCam({ ...c, x: c.x + dx, y: c.y + dy });
    } else if (d.kind === "move-room" && d.origPoly) {
      const worldDx = dx / camRef.current.k;
      const worldDy = dy / camRef.current.k;
      d.origPoly = translatePoly(d.origPoly, worldDx, worldDy);
      setLivePoly(d.origPoly);
    } else if (d.kind === "move-mark" && d.markId) {
      const orig = marksRef.current.find((f) => f.id === d.markId);
      if (orig) {
        if (orig.kind === "door" || orig.kind === "window" || orig.kind === "stair") {
          const pose = snapMark(orig.kind, [wx, wy], roomsRef.current, {
            length: orig.length,
            width: orig.width,
            style: orig.style,
            walls,
          });
          setLiveMark({
            ...orig,
            x: pose.x,
            y: pose.y,
            rotation: pose.snapped ? pose.rotation : orig.rotation,
            length: pose.snapped ? pose.length : orig.length,
          });
          setSnapWall(pose.wall ?? null);
        } else {
          setLiveMark({
            ...orig,
            x: (d.origX ?? orig.x) + (wx - (d.wx ?? wx)),
            y: (d.origY ?? orig.y) + (wy - (d.wy ?? wy)),
          });
        }
      }
    } else if (d.kind === "token" && d.id) {
      const hit = hitRoom(e.clientX, e.clientY);
      moveToken(d.id, {
        floorId: hit?.floorId ?? floorId,
        roomId: hit?.id ?? "",
        x: wx,
        y: wy,
      });
    }
  }

  function onPointerUp(e: React.PointerEvent) {
    releasePtr(e.currentTarget, e.pointerId);
    pointers.current.delete(e.pointerId);
    const d = drag.current;
    const [wx, wy] = clientToWorld(e.clientX, e.clientY);
    if (pointers.current.size === 0) {
      if (d?.kind === "draw") {
        const box = draftRef.current;
        drag.current = null;
        setDraft(null);
        if (box && box.w >= 48 && box.h >= 48) {
          addRoom(polyFromBox(drawShape === "ellipse" ? "ellipse" : "rect", box.x, box.y, box.w, box.h));
        }
        return;
      }
      if (d?.kind === "place" && placeDraft) {
        const mark = placeDraft;
        setPlaceDraft(null);
        setSnapWall(null);
        drag.current = null;
        addFixture({
          floorId,
          kind: mark.kind,
          x: mark.x,
          y: mark.y,
          rotation: mark.rotation,
          length: mark.length,
          width: mark.width,
          style: mark.style,
          toFloor:
            mark.kind === "stair"
              ? floors.find((f) => f.id !== floorId)?.id
              : undefined,
        });
        return;
      }
      if (d?.kind === "lasso") {
        const poly = lassoReady(polyDraftRef.current);
        drag.current = null;
        setPolyDraft([]);
        setHover(null);
        if (poly) {
          const [x, y] = centroid(poly);
          addFixture({
            floorId,
            kind: "zone",
            x,
            y,
            rotation: 0,
            length: 48,
            poly,
            fill: useAtlas.getState().zoneFill,
            color: zoneColor,
          });
        }
        return;
      }
      if (d?.kind === "line") {
        const pts = polyDraftRef.current;
        const p = snapZonePoint(pts, [wx, wy]);
        drag.current = null;
        if (pts.length >= 3 && (canCloseZone(pts, p) || lineReady([...pts, p]))) {
          closeLine(p);
          return;
        }
        if (!d.moved) {
          const last = pts[pts.length - 1];
          if (!last || Math.hypot(p[0] - last[0], p[1] - last[1]) >= 8) {
            setPolyDraft([...pts, p]);
          }
        }
        setHover(p);
        return;
      }
      if (d?.kind === "move-mark" && d.markId && liveMark) {
        patchFixture(d.markId, {
          x: liveMark.x,
          y: liveMark.y,
          rotation: liveMark.rotation,
          length: liveMark.length,
        });
        setLiveMark(null);
        setSnapWall(null);
        drag.current = null;
        return;
      }
      if (d?.kind === "resize-mark" && d.markId && liveMark) {
        patchFixture(d.markId, {
          x: liveMark.x,
          y: liveMark.y,
          rotation: liveMark.rotation,
          length: liveMark.length,
          width: liveMark.width,
        });
        setLiveMark(null);
        setSnapWall(null);
        drag.current = null;
        return;
      }
      if (d?.kind === "resize" && d.roomId && livePoly) {
        patchRoom(d.roomId, { poly: livePoly });
        setLivePoly(null);
        drag.current = null;
        return;
      }
      if (d?.kind === "move-room" && d.roomId && livePoly) {
        patchRoom(d.roomId, { poly: livePoly });
        setLivePoly(null);
        drag.current = null;
        return;
      }
      const wasTap = d && d.kind === "maybe" && !d.moved;
      drag.current = null;
      clearHold();
      if (holdOpened.current) {
        holdOpened.current = false;
        return;
      }
      if (wasTap) {
        if (tool === "select" && Date.now() < ignoreUntil.current) return;
        if (tool === "draw" && drawShape === "polygon") {
          const pts = polyDraftRef.current;
          if (pts.length >= 3) {
            const first = pts[0]!;
            if (Math.hypot(wx - first[0], wy - first[1]) < 28) {
              closePolygon();
              return;
            }
          }
          setPolyDraft([...pts, [wx, wy]]);
          return;
        }
        if (tool === "token") {
          const who = placingTokenId ?? useAtlas.getState().placingTokenId;
          if (who) {
            const hit = hitRoom(e.clientX, e.clientY);
            moveToken(who, {
              floorId: hit?.floorId ?? floorId,
              roomId: hit?.id ?? "",
              x: wx,
              y: wy,
            });
            useAtlas.getState().setTool("select");
            useAtlas.getState().setPlacingToken(null);
          }
          return;
        }
        const mark = hitMark(wx, wy);
        if (mark) {
          selectMark(mark.id);
          return;
        }
        const hit = hitRoom(e.clientX, e.clientY);
        if (hit && hit.id === d.roomId) select(hit.id);
        else if (!hit) {
          select(null);
          selectMark(null);
        }
      }
    } else if (pointers.current.size === 1) {
      const leftover = [...pointers.current.values()][0]!;
      drag.current = { kind: "pan", lx: leftover.x, ly: leftover.y, moved: true };
    }
  }

  function onPointerCancel(e: React.PointerEvent) {
    releasePtr(e.currentTarget, e.pointerId);
    pointers.current.delete(e.pointerId);
    clearHold();
    if (pointers.current.size === 0) {
      drag.current = null;
      setDraft(null);
      setPlaceDraft(null);
      setGhostMark(null);
      setSnapWall(null);
      setLivePoly(null);
      setLiveMark(null);
      setPolyDraft([]);
    }
  }

  const doors = useMemo(() => {
    const list: Array<{ key: string; x: number; y: number; tx: number; ty: number }> =
      [];
    const seen = new Set<string>();
    for (const room of rooms) {
      for (const cid of room.connections) {
        const other = rooms.find((r) => r.id === cid);
        if (!other) continue;
        const key = [room.id, other.id].sort().join("|");
        if (seen.has(key)) continue;
        seen.add(key);
        const mark = doorMark(room.poly, other.poly);
        if (mark) list.push({ key, ...mark });
      }
    }
    return list;
  }, [rooms]);

  const tokensHere = actors.map((c, i) => {
    const pos = tokens[c.id];
    if (!pos || pos.floorId !== floorId) return null;
    if (Number.isFinite(pos.x) && Number.isFinite(pos.y)) {
      return { char: c, x: pos.x as number, y: pos.y as number, roomId: pos.roomId, i };
    }
    const room = rooms.find((r) => r.id === pos.roomId);
    if (!room) return null;
    const [x, y] = centroid(room.poly);
    return { char: c, x, y, roomId: room.id, i };
  }).filter((t) => t !== null);

  const zoomPct = Math.round(cam.k * 100);
  const handlePx = handleSizePx(chrome.handleSize);
  const hs = handlePx / Math.max(0.12, screenScale());
  const selectedRoom = rooms.find((r) => r.id === selectedId);
  const selectedPoly = selectedRoom
    ? (livePoly ?? selectedRoom.poly)
    : undefined;
  const selectedBox = selectedPoly ? bounds(selectedPoly) : null;
  const selectedMark = marks.find((m) => m.id === selectedMarkId);
  const shownMark = liveMark && liveMark.id === selectedMarkId ? liveMark : selectedMark;
  const zones = useMemo(
    () => marks.filter((f) => f.kind === "zone" && f.poly && f.poly.length >= 3),
    [marks],
  );
  const glyphs = useMemo(
    () => marks.filter((f) => f.kind !== "zone"),
    [marks],
  );
  const hoverSnap = hover;
  const zoneCanCommit = Boolean(lassoReady(polyDraft));
  const lineCanCommit = Boolean(
    lineReady(hoverSnap ? [...polyDraft, hoverSnap] : polyDraft),
  );

  const labels = useMemo(() => {
    type Box = {
      id: string;
      x: number;
      y: number;
      w: number;
      h: number;
      text: string;
      fs: number;
      important: boolean;
    };
    const placed: Box[] = [];
    const sorted = [...rooms].sort((a, b) => {
      const ia = selectedId === a.id ? 1 : 0;
      const ib = selectedId === b.id ? 1 : 0;
      if (ia !== ib) return ib - ia;
      return area(b.poly) - area(a.poly);
    });
    for (const room of sorted) {
      const match = roomMatches(room, schema, filters, query, tokens);
      if (!match) continue;
      const important = selectedId === room.id;
      const a = area(room.poly);
      if (!important && a < 28000) continue;
      const poly = room.id === selectedId && livePoly ? livePoly : room.poly;
      const [cx, cy] = centroid(poly);
      const fs = important ? 18 : a > 60000 ? 16 : 14;
      const { w, h } = labelSize(room.label, fs);
      const box: Box = {
        id: room.id,
        x: cx - w / 2,
        y: cy - h / 2,
        w,
        h,
        text: room.label,
        fs,
        important,
      };
      if (important) {
        for (let i = placed.length - 1; i >= 0; i--) {
          if (!placed[i]!.important && boxesOverlap(box, placed[i]!, 10)) {
            placed.splice(i, 1);
          }
        }
      } else if (placed.some((p) => boxesOverlap(box, p, 10))) {
        continue;
      }
      placed.push(box);
    }
    return placed;
  }, [rooms, selectedId, query, filters, schema, livePoly, tokens]);

  const cursor =
    tool !== "select"
      ? "crosshair"
      : "pointer";

  return (
    <div
      ref={wrapRef}
      className="relative h-full w-full touch-none overflow-hidden bg-paper"
      style={{ cursor }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onLostPointerCapture={onPointerCancel}
      onContextMenu={(e) => {
        e.preventDefault();
        if (tool !== "select") return;
        const [wx, wy] = clientToWorld(e.clientX, e.clientY);
        const mark = hitMark(wx, wy);
        const room = hitRoom(e.clientX, e.clientY);
        openMenuAt(e.clientX, e.clientY, room?.id, mark?.id);
      }}
      onDoubleClick={() => {
        if (tool === "draw" && drawShape === "polygon") closePolygon();
        if (tool === "draw" && drawShape === "line") closeLine();
      }}
    >
      <svg
        viewBox={`${vb[0]} ${vb[1]} ${vb[2]} ${vb[3]}`}
        className="h-full w-full select-none"
        role="img"
        aria-label={`Plan — ${floor?.name ?? "étage"}`}
      >
        <defs>
          <pattern
            id="plan-grid"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="var(--color-ink)"
              strokeOpacity="0.05"
              strokeWidth="1"
            />
          </pattern>
          <pattern
            id="hatch-interdit"
            width="12"
            height="12"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(38)"
          >
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="12"
              stroke="var(--color-clay)"
              strokeOpacity="0.4"
              strokeWidth="2"
            />
          </pattern>
        </defs>
        <rect
          x={vb[0]}
          y={vb[1]}
          width={vb[2]}
          height={vb[3]}
          fill={chrome.showGrid ? "url(#plan-grid)" : "var(--color-paper)"}
        />
        <g transform={`translate(${cam.x} ${cam.y}) scale(${cam.k})`}>
          {zones.map((z) => {
            const active = z.id === selectedMarkId;
            const fill = zonePaint(z);
            return (
              <g key={z.id} className="pointer-events-none">
                <path
                  d={polyToPath(z.poly!)}
                  fill={`color-mix(in oklab, ${fill} 32%, var(--color-paper))`}
                  stroke={fill}
                  strokeOpacity={active ? 0.95 : 0.7}
                  strokeWidth={active ? 5 : 3}
                  strokeLinejoin="round"
                />
                {z.label ? (
                  <text
                    x={z.x}
                    y={z.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="var(--color-ink)"
                    fontSize="14"
                    fontFamily="var(--font-display)"
                    fontWeight={500}
                  >
                    {z.label}
                  </text>
                ) : null}
              </g>
            );
          })}
          {rooms.map((room) => {
            const match = roomMatches(room, schema, filters, query, tokens);
            const active = selectedId === room.id;
            const tone = tintOf(room.props ?? {}, schema);
            const dash =
              tone === "clay" ? "10 7" : tone === "ink" ? "3 6" : undefined;
            const poly = active && livePoly ? livePoly : room.poly;
            return (
              <g key={room.id}>
                <path
                  d={polyToPath(poly)}
                  fill={fillFor(tone, active, !match)}
                  stroke="var(--color-ink)"
                  strokeOpacity={match ? (active ? 0.92 : 0.62) : 0.16}
                  strokeWidth={active ? 5 : 3.2}
                  strokeLinejoin="miter"
                  strokeDasharray={dash}
                  className={cn(!match && "pointer-events-none")}
                />
                {tone === "clay" && match ? (
                  <path
                    d={polyToPath(poly)}
                    fill="url(#hatch-interdit)"
                    className="pointer-events-none"
                  />
                ) : null}
                {room.travel?.length && match
                  ? stairLines(poly).map((line, i) => (
                      <line
                        key={i}
                        x1={line[0][0]}
                        y1={line[0][1]}
                        x2={line[1][0]}
                        y2={line[1][1]}
                        stroke="var(--color-ink)"
                        strokeOpacity="0.28"
                        strokeWidth="2"
                        className="pointer-events-none"
                      />
                    ))
                  : null}
                {sceneRoomId === room.id ? (
                  <circle
                    cx={centroid(poly)[0]}
                    cy={centroid(poly)[1] - 28}
                    r="6"
                    fill="var(--color-clay)"
                    className="pointer-events-none"
                  />
                ) : null}
              </g>
            );
          })}
          {draft && draft.w > 0 && draft.h > 0 ? (
            drawShape === "ellipse" ? (
              <ellipse
                cx={draft.x + draft.w / 2}
                cy={draft.y + draft.h / 2}
                rx={draft.w / 2}
                ry={draft.h / 2}
                fill="color-mix(in oklab, var(--color-primary) 18%, transparent)"
                stroke="var(--color-primary)"
                strokeWidth="3"
                strokeDasharray="8 6"
                className="pointer-events-none"
              />
            ) : (
              <rect
                x={draft.x}
                y={draft.y}
                width={draft.w}
                height={draft.h}
                fill="color-mix(in oklab, var(--color-primary) 18%, transparent)"
                stroke="var(--color-primary)"
                strokeWidth="3"
                strokeDasharray="8 6"
                className="pointer-events-none"
              />
            )
          ) : null}
          {polyDraft.length ? (
            <g className="pointer-events-none">
              {tool === "zone" ? (
                <path
                  d={polyToPath(
                    hoverSnap ? [...polyDraft, hoverSnap] : polyDraft,
                  )}
                  fill={
                    zoneCanCommit
                      ? `color-mix(in oklab, ${zonePaint({ fill: zoneFill, color: zoneColor })} 28%, transparent)`
                      : "none"
                  }
                  stroke={zonePaint({ fill: zoneFill, color: zoneColor })}
                  strokeWidth="3"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              ) : (
                <>
                  {tool === "draw" && drawShape === "line" && lineCanCommit && hoverSnap ? (
                    <path
                      d={polyToPath([...polyDraft, hoverSnap])}
                      fill="color-mix(in oklab, var(--color-primary) 18%, transparent)"
                      stroke="var(--color-primary)"
                      strokeWidth="3"
                    />
                  ) : (
                    <polyline
                      points={[...polyDraft, ...(hoverSnap ? [hoverSnap] : [])]
                        .map((p) => p.join(","))
                        .join(" ")}
                      fill="none"
                      stroke="var(--color-primary)"
                      strokeWidth="3"
                      strokeDasharray="8 6"
                    />
                  )}
                  {polyDraft.map((p, i) => (
                    <circle
                      key={i}
                      cx={p[0]}
                      cy={p[1]}
                      r={i === 0 && drawShape === "line" && canCloseZone(polyDraft, hoverSnap ?? [0, 0]) ? 11 : 7}
                      fill={i === 0 ? "var(--color-primary)" : "var(--color-paper)"}
                      stroke="var(--color-primary)"
                      strokeWidth="2"
                    />
                  ))}
                </>
              )}
            </g>
          ) : null}
          {selectedBox && selectedPoly ? (
            <g>
              <rect
                x={selectedBox.minX}
                y={selectedBox.minY}
                width={selectedBox.maxX - selectedBox.minX}
                height={selectedBox.maxY - selectedBox.minY}
                fill="none"
                stroke="var(--color-primary)"
                strokeOpacity="0.45"
                strokeWidth="1.5"
                strokeDasharray="5 4"
                className="pointer-events-none"
              />
              {HANDLES.map((id) => {
                const [x, y] = handlePoints(selectedBox)[id];
                return (
                  <rect
                    key={id}
                    x={x - hs}
                    y={y - hs}
                    width={hs * 2}
                    height={hs * 2}
                    fill="var(--color-paper)"
                    stroke="var(--color-primary)"
                    strokeWidth="2"
                    style={{ cursor: handleCursor(id) }}
                  />
                );
              })}
            </g>
          ) : null}
          {doors.map((d) => (
            <g key={d.key} className="pointer-events-none">
              <line
                x1={d.x - d.tx * 14}
                y1={d.y - d.ty * 14}
                x2={d.x + d.tx * 14}
                y2={d.y + d.ty * 14}
                stroke="var(--color-paper)"
                strokeWidth="10"
                strokeLinecap="butt"
              />
              <line
                x1={d.x - d.tx * 12}
                y1={d.y - d.ty * 12}
                x2={d.x + d.tx * 12}
                y2={d.y + d.ty * 12}
                stroke="var(--color-ink)"
                strokeOpacity="0.35"
                strokeWidth="1.5"
              />
            </g>
          ))}
          {snapWall ? (
            <line
              x1={snapWall.a[0]}
              y1={snapWall.a[1]}
              x2={snapWall.b[0]}
              y2={snapWall.b[1]}
              stroke="var(--color-primary)"
              strokeWidth="6"
              strokeLinecap="round"
              opacity="0.4"
              className="pointer-events-none"
            />
          ) : null}
          {glyphs.map((f) => (
            <FixtureGlyph
              key={f.id}
              fixture={liveMark && liveMark.id === f.id ? liveMark : f}
              active={f.id === selectedMarkId}
            />
          ))}
          {shownMark && shownMark.kind !== "zone" ? (
            <g>
              {(["a", "b"] as const).map((end) => {
                const pt = markEnds(shownMark)[end];
                return (
                  <rect
                    key={end}
                    x={pt[0] - hs}
                    y={pt[1] - hs}
                    width={hs * 2}
                    height={hs * 2}
                    fill="var(--color-paper)"
                    stroke="var(--color-primary)"
                    strokeWidth="2"
                    style={{ cursor: "ew-resize" }}
                  />
                );
              })}
              {shownMark.kind === "stair"
                ? (["n", "s"] as const).map((side) => {
                    const pt = markSides(shownMark)[side];
                    return (
                      <rect
                        key={side}
                        x={pt[0] - hs}
                        y={pt[1] - hs}
                        width={hs * 2}
                        height={hs * 2}
                        fill="var(--color-paper)"
                        stroke="var(--color-primary)"
                        strokeWidth="2"
                        style={{ cursor: "ns-resize" }}
                      />
                    );
                  })
                : null}
            </g>
          ) : null}
          {ghostMark && !placeDraft ? (
            <g opacity="0.45" className="pointer-events-none">
              <FixtureGlyph fixture={ghostMark} active />
            </g>
          ) : null}
          {placeDraft ? <FixtureGlyph fixture={placeDraft} active /> : null}
          {labels.map((lab) => (
            <g key={lab.id} className="pointer-events-none">
              <rect
                x={lab.x}
                y={lab.y}
                width={lab.w}
                height={lab.h}
                rx="5"
                fill="var(--color-paper)"
                fillOpacity={lab.important ? 0.92 : 0.72}
              />
              <text
                x={lab.x + lab.w / 2}
                y={lab.y + lab.h / 2 + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="var(--color-ink)"
                fontSize={lab.fs}
                fontFamily="var(--font-display)"
                fontWeight={500}
              >
                {lab.text}
              </text>
            </g>
          ))}
          {chrome.showTokens
            ? tokensHere.map((t) => (
            <g
              key={t.char.id}
              transform={`translate(${t.x} ${t.y})`}
              className="cursor-grab"
              onPointerDown={(ev) => {
                ev.stopPropagation();
                if (Date.now() < ignoreUntil.current) return;
                pointers.current.set(ev.pointerId, {
                  x: ev.clientX,
                  y: ev.clientY,
                });
                try {
                  wrapRef.current?.setPointerCapture(ev.pointerId);
                } catch {
                  /* ignore */
                }
                drag.current = {
                  kind: "token",
                  id: t.char.id,
                  lx: ev.clientX,
                  ly: ev.clientY,
                  moved: false,
                };
              }}
            >
              <circle
                r={TOKEN_R}
                fill={t.char.color || TOKEN_COLORS[t.i % TOKEN_COLORS.length]}
                stroke="var(--color-ink)"
                strokeWidth="2"
              />
              <text
                textAnchor="middle"
                dominantBaseline="middle"
                fill="var(--color-paper)"
                fontSize="13"
                fontFamily="var(--font-sans)"
                fontWeight={600}
                className="pointer-events-none"
              >
                {t.char.short}
              </text>
            </g>
          ))
            : null}
        </g>
      </svg>

      <div
        className="absolute right-3 top-3 z-10 flex flex-col gap-1"
        onPointerDown={(e) => e.stopPropagation()}
        onPointerMove={(e) => e.stopPropagation()}
      >
        <Button
          variant="outline"
          size="icon"
          className="bg-card"
          aria-label="Zoom avant"
          {...pressProps(() => zoomAround(1.25))}
        >
          <Plus className="size-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="bg-card"
          aria-label="Zoom arrière"
          {...pressProps(() => zoomAround(0.8))}
        >
          <Minus className="size-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="bg-card"
          aria-label="Recadrer le plan"
          {...pressProps(fitView)}
        >
          <Scan className="size-4" />
        </Button>
        <p className="pt-1 text-center text-xs font-medium tabular-nums text-muted-foreground">
          {zoomPct}%
        </p>
      </div>

      {tool === "draw" && drawShape === "polygon" && polyDraft.length >= 3 ? (
        <div
          className="absolute bottom-3 right-3 z-10"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <Button size="sm" {...pressProps(closePolygon)}>
            <Check className="size-4" />
            Fermer
          </Button>
        </div>
      ) : null}

      {tool === "draw" && drawShape === "line" && polyDraft.length >= 3 ? (
        <div
          className="absolute bottom-3 right-3 z-10"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <Button
            size="sm"
            disabled={!lineCanCommit}
            title={
              lineCanCommit
                ? "Fermer la pièce"
                : "Posez encore quelques sommets, ou rejoignez le départ"
            }
            {...pressProps(() => {
              if (hoverSnap) closeLine(hoverSnap);
              else closeLine();
            })}
          >
            <Check className="size-4" />
            Fermer
          </Button>
        </div>
      ) : null}

      {tool === "zone" ? (
        <div
          className="absolute bottom-3 left-3 z-10 flex max-w-[min(100%,24rem)] flex-wrap items-end gap-2 rounded-lg border border-border bg-card/95 p-2"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <ColorWheel
            value={zoneColor}
            label=""
            id="zone-draw-color"
            onChange={setZoneColor}
          />
          <FillSwatches
            value={zoneFill}
            onChange={(fill: ZoneFill) => {
              setZoneFill(fill);
              setZoneColor(zoneHex(fill));
            }}
          />
        </div>
      ) : null}

      {selectedMark && tool !== "zone" ? (
        <div
          className="absolute bottom-3 left-3 z-10 flex flex-wrap items-center gap-1.5"
          onPointerDown={(e) => e.stopPropagation()}
        >
          {selectedMark.kind === "stair"
            ? floors
                .filter((f) => f.id !== floorId)
                .map((f) => (
                  <Button
                    key={f.id}
                    size="sm"
                    variant={selectedMark.toFloor === f.id ? "default" : "outline"}
                    className="bg-card"
                    {...pressProps(() =>
                      patchFixture(selectedMark.id, { toFloor: f.id }),
                    )}
                  >
                    Vers {f.short}
                  </Button>
                ))
            : null}
          {selectedMark.kind === "zone" ? (
            <FillSwatches
              value={selectedMark.fill ?? "sage"}
              onChange={(fill) =>
                patchFixture(selectedMark.id, { fill, color: zoneHex(fill) })
              }
            />
          ) : null}
          {selectedMark.kind === "door" ||
          selectedMark.kind === "window" ||
          selectedMark.kind === "stair" ? (
            <Button
              size="sm"
              variant="outline"
              className="bg-card"
              {...pressProps(() => {
                const pose = snapExisting(
                  selectedMark.kind as "door" | "window" | "stair",
                  selectedMark,
                  rooms,
                  walls,
                );
                if (!pose) return;
                patchFixture(selectedMark.id, {
                  x: pose.x,
                  y: pose.y,
                  rotation: pose.rotation,
                  length: pose.length,
                  width: pose.width ?? selectedMark.width,
                });
              })}
            >
              <Magnet className="size-4" />
              Coller au mur
            </Button>
          ) : null}
          <Button
            size="sm"
            variant="outline"
            className="bg-card"
            aria-label="Supprimer l’élément"
            {...pressProps(() => deleteFixture(selectedMark.id))}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ) : null}

      <div className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-2 text-xs text-muted-foreground">
        {chrome.showCompass && !selectedMark && tool !== "zone" ? (
          <>
            <svg width="18" height="28" viewBox="0 0 18 28" aria-hidden>
              <polygon points="9,2 13,12 9,10 5,12" fill="var(--color-ink)" />
              <line
                x1="9"
                y1="10"
                x2="9"
                y2="24"
                stroke="var(--color-ink)"
                strokeWidth="1.4"
              />
            </svg>
            <span>N</span>
          </>
        ) : null}
      </div>

      {rooms.length === 0 && zones.length === 0 && tool === "select" ? (
        <p className="pointer-events-none absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-muted-foreground">
          {emptyPlan}
        </p>
      ) : null}

      {menu ? (
        <PlanMenu
          target={menu.target}
          x={menu.x}
          y={menu.y}
          onClose={() => {
            holdOpened.current = false;
            setMenu(null);
          }}
        />
      ) : null}
    </div>
  );
});

function FixtureGlyph({
  fixture,
  active,
}: {
  fixture: MapFixture;
  active?: boolean;
}) {
  const stroke = active ? "var(--color-primary)" : "var(--color-ink)";
  const L = fixture.length;
  return (
    <g
      transform={`translate(${fixture.x} ${fixture.y}) rotate(${fixture.rotation})`}
      className="pointer-events-none"
    >
      {fixture.kind === "door" ? (
        <>
          <line
            x1={-L / 2}
            y1={0}
            x2={L / 2}
            y2={0}
            stroke="var(--color-paper)"
            strokeWidth="10"
          />
          <path
            d={`M ${L / 2} 0 A ${L} ${L} 0 0 1 ${-L / 2} ${L}`}
            fill="color-mix(in oklab, var(--color-primary) 12%, transparent)"
            stroke={stroke}
            strokeWidth="2"
          />
          <line
            x1={-L / 2}
            y1={0}
            x2={-L / 2}
            y2={L * 0.92}
            stroke={stroke}
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx={-L / 2} cy={0} r="4" fill={stroke} />
        </>
      ) : null}
      {fixture.kind === "window" ? (
        <>
          <line
            x1={-L / 2}
            y1={0}
            x2={L / 2}
            y2={0}
            stroke="var(--color-paper)"
            strokeWidth="12"
          />
          <line
            x1={-L / 2}
            y1={-7}
            x2={L / 2}
            y2={-7}
            stroke={stroke}
            strokeWidth="2"
          />
          <line
            x1={-L / 2}
            y1={7}
            x2={L / 2}
            y2={7}
            stroke={stroke}
            strokeWidth="2"
          />
          <line x1={0} y1={-7} x2={0} y2={7} stroke={stroke} strokeWidth="2" />
          <line
            x1={-L / 2}
            y1={-11}
            x2={-L / 2}
            y2={11}
            stroke={stroke}
            strokeWidth="2.5"
          />
          <line
            x1={L / 2}
            y1={-11}
            x2={L / 2}
            y2={11}
            stroke={stroke}
            strokeWidth="2.5"
          />
        </>
      ) : null}
      {fixture.kind === "stair" ? (
        <StairGlyph fixture={fixture} stroke={stroke} />
      ) : null}
      {active ? (
        <circle r="5" cy={-18} fill="var(--color-primary)" />
      ) : null}
    </g>
  );
}

function StairGlyph({
  fixture,
  stroke,
}: {
  fixture: MapFixture;
  stroke: string;
}) {
  const L = fixture.length;
  const W = fixtureWidth(fixture);
  const fill = "color-mix(in oklab, var(--color-primary) 10%, var(--color-paper))";
  const style: StairStyle = fixture.style ?? "straight";

  if (style === "spiral") {
    const outer = Math.max(18, L / 2);
    const inner = Math.max(6, outer - W);
    const turns = 3;
    const pts: string[] = [];
    const steps = 36;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const a = t * Math.PI * 2 * turns;
      const r = inner + (outer - inner) * t;
      pts.push(`${Math.cos(a) * r},${Math.sin(a) * r}`);
    }
    return (
      <>
        <circle r={outer} fill={fill} stroke={stroke} strokeWidth="2.5" />
        <circle r={inner} fill="var(--color-paper)" stroke={stroke} strokeWidth="1.6" />
        <polyline
          points={pts.join(" ")}
          fill="none"
          stroke={stroke}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        {Array.from({ length: 8 }, (_, i) => {
          const a = (Math.PI * 2 * i) / 8;
          return (
            <line
              key={i}
              x1={Math.cos(a) * inner}
              y1={Math.sin(a) * inner}
              x2={Math.cos(a) * outer}
              y2={Math.sin(a) * outer}
              stroke={stroke}
              strokeWidth="1.4"
              strokeOpacity="0.7"
            />
          );
        })}
      </>
    );
  }

  if (style === "quarter") {
    const T = Math.max(18, Math.min(W, L) * 0.42);
    const treads = 4;
    return (
      <>
        <rect
          x={-L / 2}
          y={-W / 2}
          width={L}
          height={T}
          fill={fill}
          stroke={stroke}
          strokeWidth="2.5"
        />
        <rect
          x={L / 2 - T}
          y={-W / 2}
          width={T}
          height={W}
          fill={fill}
          stroke={stroke}
          strokeWidth="2.5"
        />
        {Array.from({ length: treads }, (_, i) => {
          const x = -L / 2 + ((i + 1) * (L - T)) / (treads + 1);
          return (
            <line
              key={`h${i}`}
              x1={x}
              y1={-W / 2 + 3}
              x2={x}
              y2={-W / 2 + T - 3}
              stroke={stroke}
              strokeWidth="1.5"
              strokeOpacity="0.7"
            />
          );
        })}
        {Array.from({ length: treads }, (_, i) => {
          const y = -W / 2 + T + ((i + 1) * (W - T)) / (treads + 1);
          return (
            <line
              key={`v${i}`}
              x1={L / 2 - T + 3}
              y1={y}
              x2={L / 2 - 3}
              y2={y}
              stroke={stroke}
              strokeWidth="1.5"
              strokeOpacity="0.7"
            />
          );
        })}
        <polygon
          points={`${-L / 2 + 8},${-W / 2 + T / 2 - 6} ${-L / 2 + 8},${-W / 2 + T / 2 + 6} ${-L / 2 + 20},${-W / 2 + T / 2}`}
          fill={stroke}
        />
      </>
    );
  }

  if (style === "switchback") {
    const T = Math.max(16, W / 2 - 4);
    const gap = Math.max(4, W - T * 2);
    return (
      <>
        <rect
          x={-L / 2}
          y={-W / 2}
          width={L}
          height={T}
          fill={fill}
          stroke={stroke}
          strokeWidth="2.5"
        />
        <rect
          x={-L / 2}
          y={W / 2 - T}
          width={L}
          height={T}
          fill={fill}
          stroke={stroke}
          strokeWidth="2.5"
        />
        <rect
          x={L / 2 - T}
          y={-W / 2}
          width={T}
          height={W}
          fill={fill}
          stroke={stroke}
          strokeWidth="2.5"
        />
        {Array.from({ length: 5 }, (_, i) => {
          const x = -L / 2 + ((i + 1) * (L - T)) / 6;
          return (
            <g key={i}>
              <line
                x1={x}
                y1={-W / 2 + 3}
                x2={x}
                y2={-W / 2 + T - 3}
                stroke={stroke}
                strokeWidth="1.5"
                strokeOpacity="0.7"
              />
              <line
                x1={x}
                y1={W / 2 - T + 3}
                x2={x}
                y2={W / 2 - 3}
                stroke={stroke}
                strokeWidth="1.5"
                strokeOpacity="0.7"
              />
            </g>
          );
        })}
        <polygon
          points={`${-L / 2 + 8},${-W / 2 + T / 2 - 6} ${-L / 2 + 8},${-W / 2 + T / 2 + 6} ${-L / 2 + 20},${-W / 2 + T / 2}`}
          fill={stroke}
        />
        {gap > 0 ? null : null}
      </>
    );
  }

  const treads = Math.max(4, Math.round(L / 18));
  return (
    <>
      <rect
        x={-L / 2}
        y={-W / 2}
        width={L}
        height={W}
        fill={fill}
        stroke={stroke}
        strokeWidth="2.5"
      />
      {Array.from({ length: treads }, (_, i) => {
        const x = -L / 2 + ((i + 1) * L) / (treads + 1);
        return (
          <line
            key={i}
            x1={x}
            y1={-W / 2 + 4}
            x2={x}
            y2={W / 2 - 4}
            stroke={stroke}
            strokeWidth="1.6"
            strokeOpacity="0.7"
          />
        );
      })}
      <polygon
        points={`${L / 2 - 18},0 ${L / 2 - 6},-8 ${L / 2 - 6},8`}
        fill={stroke}
      />
    </>
  );
}
