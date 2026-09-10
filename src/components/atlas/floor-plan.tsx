import { ArrowLeft, Check, Eraser, FlipHorizontal2, Magnet, Maximize2, Minus, Pencil, Plus, Trash2 } from "lucide-react";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { FillSwatches, PlanMenu, clampMenu, type PlanMenuTarget } from "@/components/atlas/plan-menu";
import { TerrainDefs } from "@/components/atlas/terrain-defs";
import { ColorWheel } from "@/components/atlas/color-wheel";
import { EditableTitle } from "@/components/atlas/editable-title";
import { Tip } from "@/components/atlas/tip";
import { Button } from "@/components/ui/button";
import { floorById, groupIdsOf } from "@/lib/map/house";
import { resolveFloor } from "@/lib/map/edits";
import {
  applyHandle,
  area,
  bboxDimLabels,
  booleanPoly,
  bounds,
  boxesOverlap,
  canCloseZone,
  centroid,
  distToSegment,
  doorHandles,
  doorMark,
  doorSwing,
  edgeDims,
  ellipsePoly,
  fixtureWidth,
  handleCursor,
  inflateBounds,
  labelSize,
  lassoReady,
  lineReady,
  localOnMark,
  flushPoly,
  markEnds,
  markFromEnds,
  markSides,
  pointInPoly,
  pointInRotatedRect,
  polyToPath,
  quarterFlightEnd,
  scalePoly,
  snapOctant,
  STAIR_TREAD,
  stairLines,
  translatePoly,
  unionBounds,
  widthFromPoint,
  worldFromLocal,
  type Bounds,
  type HandleId,
} from "@/lib/map/geometry";
import {
  collectWalls,
  slideToken,
  snapExisting,
  snapMark,
  snapResizeEnds,
  type WallSeg,
} from "@/lib/map/snap";
import { roomMatches, useAtlas } from "@/lib/map/store";
import { terrainKinds, terrainRuns } from "@/lib/map/terrain";
import { handleSizePx, useUiStore } from "@/lib/map/ui";
import { formatProp, placeHasAction, readProp, tintOf, tokenActors } from "@/lib/map/props";
import { pressProps } from "@/lib/press";
import type { MapFixture, Point, PropTone, StairStyle, ZoneFill } from "@/lib/map/types";
import {
  sanitizeHexColor,
  zoneHex,
  zonePaint,
  DEFAULT_WALL_WIDTH,
  clampWallWidth,
  groundFill,
  groundInk,
  groundMeta,
  groundPatternId,
  isPolyKind,
  MIN_GROUND_BRUSH,
  MAX_GROUND_BRUSH,
} from "@/lib/map/types";
import { cn } from "@/lib/utils";

const TOKEN_COLORS = ["#c45c4a", "#3f5344", "#4a6fa5", "#b5812f", "#6b4c7a"];
const MIN_K = 0.7;
const MAX_K = 6;
const TAP_PX = 28;
const HANDLES: HandleId[] = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];

function fillFor(
  tone: PropTone | undefined,
  active: boolean,
  dim: boolean,
  groupColor?: string,
): string {
  if (dim) return "color-mix(in oklab, var(--color-foreground) 3%, var(--color-paper))";
  if (active && groupColor)
    return `color-mix(in oklab, ${groupColor} 40%, var(--color-paper))`;
  if (active)
    return "color-mix(in oklab, var(--color-primary) 32%, var(--color-paper))";
  if (groupColor)
    return `color-mix(in oklab, ${groupColor} 16%, var(--color-paper))`;
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
  const selectedGroupId = useAtlas((s) => s.selectedGroupId ?? null);
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
  const groups = useAtlas((s) => s.groups ?? []);
  const allRooms = useAtlas((s) => s.rooms);
  const floors = useAtlas((s) => s.floors);
  const fixtures = useAtlas((s) => s.fixtures);
  const tool = useAtlas((s) => s.tool);
  const drawShape = useAtlas((s) => s.drawShape);
  const addRoom = useAtlas((s) => s.addRoom);
  const patchRoom = useAtlas((s) => s.patchRoom);
  const patchGroup = useAtlas((s) => s.patchGroup);
  const translateRooms = useAtlas((s) => s.translateRooms);
  const addFixture = useAtlas((s) => s.addFixture);
  const patchFixture = useAtlas((s) => s.patchFixture);
  const deleteFixture = useAtlas((s) => s.deleteFixture);
  const deleteRoom = useAtlas((s) => s.deleteRoom);
  const zoneFill = useAtlas((s) => s.zoneFill);
  const setZoneFill = useAtlas((s) => s.setZoneFill);
  const groundKind = useAtlas((s) => s.groundKind ?? "meadow");
  const groundBrush = useAtlas((s) => s.groundBrush ?? 42);
  const setGroundBrush = useAtlas((s) => s.setGroundBrush);
  const paintGround = useAtlas((s) => s.paintGround);
  const terrain = useAtlas((s) => s.terrain ?? {});
  const stairStyle = useAtlas((s) => s.stairStyle);
  const chrome = useUiStore((s) => s.chrome);
  const palette = chrome.groundPalette;
  const emptyPlan = useUiStore((s) => s.copy.emptyPlan);
  const stance = useUiStore((s) => s.stance);
  const play = stance === "partie";

  const floor = floorById(floors, floorId);
  const rooms = useMemo(
    () => resolveFloor(floorId, allRooms, schema),
    [floorId, allRooms, schema],
  );
  const marks = useMemo(
    () =>
      fixtures.filter(
        (f) =>
          f.floorId === floorId ||
          (isPolyKind(f.kind) && f.travel?.some((t) => t.toFloor === floorId)),
      ),
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
    kind: "maybe" | "pan" | "token" | "pinch" | "draw" | "resize" | "move-room" | "place" | "lasso" | "brush" | "resize-mark" | "line" | "move-mark" | "resize-group" | "move-group";
    id?: string;
    roomId?: string;
    groupId?: string;
    handle?: HandleId;
    end?: "a" | "b" | "w" | "hinge" | "span" | "swing" | "q";
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
    origPolys?: Array<{ id: string; poly: Point[] }>;
    origBox?: ReturnType<typeof bounds>;
    origInner?: ReturnType<typeof bounds>;
    origWallWidth?: number;
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
  const [liveWallWidth, setLiveWallWidth] = useState<number | null>(null);
  const [liveGroupShift, setLiveGroupShift] = useState<{ dx: number; dy: number } | null>(
    null,
  );
  const [liveGroupBox, setLiveGroupBox] = useState<Bounds | null>(null);
  const [placeDraft, setPlaceDraft] = useState<MapFixture | null>(null);
  const [ghostMark, setGhostMark] = useState<MapFixture | null>(null);
  const [snapWall, setSnapWall] = useState<WallSeg | null>(null);
  const [zoneEdit, setZoneEdit] = useState<null | "expand" | "erase">(null);
  const zoneEditRef = useRef(zoneEdit);
  zoneEditRef.current = zoneEdit;
  const [groundErase, setGroundErase] = useState(false);
  const groundEraseRef = useRef(groundErase);
  groundEraseRef.current = groundErase;
  const [roomEdit, setRoomEdit] = useState<null | "expand" | "erase">(null);
  const roomEditRef = useRef(roomEdit);
  roomEditRef.current = roomEdit;
  const mapFullscreen = useUiStore((s) => s.mapFullscreen);
  const setFullscreen = useUiStore((s) => s.setFullscreen);
  const ignoreUntil = useRef(Date.now() + 700);
  const lastTap = useRef<{ id: string; at: number } | null>(null);
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
    const useMark = mark && (!isPolyKind(mark.kind) || !room);
    if (!useMark && !room) return;
    holdOpened.current = true;
    if (useMark && mark) selectMark(mark.id);
    else if (room) select(room.id, { isolate: true });
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
    if (stance !== "partie") return;
    const t = useAtlas.getState().tool;
    if (t !== "select" && t !== "token") useAtlas.getState().setTool("select");
    setRoomEdit(null);
    setZoneEdit(null);
    setPolyDraft([]);
  }, [stance]);

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

  useEffect(() => {
    const zone = marks.find((f) => f.id === selectedMarkId && f.kind === "zone");
    if (!zone) setZoneEdit(null);
  }, [selectedMarkId, marks]);

  useEffect(() => {
    if (!selectedId) setRoomEdit(null);
  }, [selectedId]);

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

  function fitScale() {
    const el = wrapRef.current;
    if (!el) return 1;
    const r = el.getBoundingClientRect();
    return Math.min(r.width / vb[2], r.height / vb[3]) || 1;
  }

  function worldToLocal(wx: number, wy: number) {
    const el = wrapRef.current;
    const c = cam;
    if (!el) return { left: 0, top: 0 };
    const r = el.getBoundingClientRect();
    const s = Math.min(r.width / vb[2], r.height / vb[3]) || 1;
    const ox = (r.width - vb[2] * s) / 2;
    const oy = (r.height - vb[3] * s) / 2;
    return {
      left: ox + (wx * c.k + c.x) * s,
      top: oy + (wy * c.k + c.y) * s,
    };
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
    const edit = roomEditRef.current;
    const room = roomsRef.current.find((r) => r.id === selectedId);
    if (edit && room?.poly) {
      const next = booleanPoly(room.poly, poly, edit === "erase" ? "erase" : "add");
      if (next) patchRoom(room.id, { poly: next });
      polyDraftRef.current = [];
      setPolyDraft([]);
      setHover(null);
      return true;
    }
    addRoom(poly);
    polyDraftRef.current = [];
    setPolyDraft([]);
    setHover(null);
    return true;
  }

  function snapDrawnPoly(poly: Point[]): Point[] {
    return poly;
  }

  function closeLasso(extra?: Point) {
    const pts = extra
      ? [...polyDraftRef.current, extra]
      : polyDraftRef.current;
    const raw = lassoReady(pts);
    if (!raw) return false;
    const poly = snapDrawnPoly(raw);
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

  function commitBrush() {
    const pts = polyDraftRef.current;
    polyDraftRef.current = [];
    setPolyDraft([]);
    setHover(null);
    if (!pts.length) return false;
    paintGround(pts, groundEraseRef.current ? "erase" : "paint");
    return true;
  }

  function closeZone(extra?: Point) {
    return closeLasso(extra);
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
    const releaseAll = () => {
      const el = wrapRef.current;
      for (const id of [...pointers.current.keys()]) {
        try {
          el?.releasePointerCapture(id);
        } catch {
          /* already released */
        }
      }
      pointers.current.clear();
      drag.current = null;
      clearHold();
      setDraft(null);
      setPlaceDraft(null);
      setGhostMark(null);
      setSnapWall(null);
      setLivePoly(null);
      setLiveMark(null);
    };
    const onBlur = () => releaseAll();
    const onVis = () => {
      if (document.visibilityState !== "visible") releaseAll();
    };
    window.addEventListener("blur", onBlur);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

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
        closeLasso();
      } else if (e.key === "Enter" && tool === "ground") {
        e.preventDefault();
        commitBrush();
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
      if (f.kind === "zone" || f.kind === "ground") continue;
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
    return undefined;
  }

  function hitZone(wx: number, wy: number) {
    const list = marksRef.current;
    for (let i = list.length - 1; i >= 0; i--) {
      const f = list[i]!;
      if (f.kind !== "zone" || !f.poly) continue;
      const poly = liveMark && liveMark.id === f.id && liveMark.poly ? liveMark.poly : f.poly;
      if (pointInPoly(poly, wx, wy)) return f;
    }
    return undefined;
  }

  function hitGround(wx: number, wy: number) {
    if (play) return undefined;
    const list = marksRef.current;
    for (let i = list.length - 1; i >= 0; i--) {
      const f = list[i]!;
      if (f.kind !== "ground" || !f.poly) continue;
      const poly = liveMark && liveMark.id === f.id && liveMark.poly ? liveMark.poly : f.poly;
      if (pointInPoly(poly, wx, wy)) return f;
    }
    return undefined;
  }

  function hitHandleAt(wx: number, wy: number, box: Bounds, hs: number) {
    const pts = handlePoints(box);
    for (const id of HANDLES) {
      const [x, y] = pts[id];
      if (Math.abs(wx - x) <= hs && Math.abs(wy - y) <= hs) return id;
    }
    return undefined;
  }

  function groupMembersHere() {
    if (!selectedGroupId) return [];
    return roomsRef.current.filter((r) => groupIdsOf(r).includes(selectedGroupId));
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
    const hs = handlePx / Math.max(0.12, fitScale() * camRef.current.k);

    if (tool === "select" && e.pointerType !== "mouse") {
      hold.current = window.setTimeout(() => {
        const room = hitRoom(e.clientX, e.clientY);
        const mark = hitMark(wx, wy) ?? (!room ? hitZone(wx, wy) : undefined);
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

    if ((tool === "draw" && drawShape === "line") || (tool === "select" && roomEditRef.current)) {
      const pts = polyDraftRef.current;
      const raw: Point = [wx, wy];
      const p = pts.length ? snapOctant(pts[pts.length - 1]!, raw) : raw;
      if (pts.length >= 3 && (canCloseZone(pts, p) || Math.hypot(p[0] - pts[0]![0], p[1] - pts[0]![1]) < 48)) {
        closeLine(p);
        drag.current = null;
        return;
      }
      if (pts.length === 0) {
        polyDraftRef.current = [raw];
        setPolyDraft([raw]);
        setHover(raw);
      }
      drag.current = {
        kind: "line",
        lx: e.clientX,
        ly: e.clientY,
        wx,
        wy,
        moved: false,
      };
      return;
    }

    if (tool === "select" && zoneEditRef.current) {
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

    if (tool === "zone") {
      if (play) return;
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

    if (tool === "ground") {
      if (play) return;
      drag.current = {
        kind: "brush",
        lx: e.clientX,
        ly: e.clientY,
        wx,
        wy,
        moved: false,
      };
      polyDraftRef.current = [[wx, wy]];
      setPolyDraft([[wx, wy]]);
      setHover([wx, wy]);
      return;
    }

    if (tool === "token") {
      const live = useAtlas.getState();
      let who = placingTokenId ?? live.placingTokenId;
      if (!who) {
        who =
          live.characters[live.characters.length - 1]?.id ??
          live.addCharacter();
        live.setPlacingToken(who);
      }
      const roomHit = hitRoom(e.clientX, e.clientY);
      moveToken(who, {
        floorId: roomHit?.floorId ?? floorId,
        roomId: roomHit?.id ?? "",
        x: wx,
        y: wy,
      });
      drag.current = {
        kind: "token",
        id: who,
        lx: e.clientX,
        ly: e.clientY,
        wx,
        wy,
        moved: false,
      };
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
        flip: pose.flip,
      });
      setSnapWall(pose.wall ?? null);
      setGhostMark(null);
      return;
    }

    const selected = roomsRef.current.find((r) => r.id === selectedId);
    if (tool === "select" && selectedGroupId && !selectedId && !play) {
      const members = groupMembersHere();
      const inner = unionBounds(members.map((r) => r.poly));
      const group = groups.find((g) => g.id === selectedGroupId);
      const ww = group?.wallWidth ?? DEFAULT_WALL_WIDTH;
      if (inner) {
        const outer = inflateBounds(inner, ww / 2);
        const handle = hitHandleAt(wx, wy, outer, hs);
        if (handle) {
          drag.current = {
            kind: "resize-group",
            handle,
            groupId: selectedGroupId,
            origBox: outer,
            origInner: inner,
            origWallWidth: ww,
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
    if (tool === "select") {
      const markSel = marksRef.current.find((f) => f.id === selectedMarkId);
      if (markSel && !isPolyKind(markSel.kind) && !play) {
        const grips: Array<{ end: "a" | "b" | "w" | "hinge" | "span" | "swing" | "q"; p: Point }> =
          [];
        if (markSel.kind === "door") {
          const dh = doorHandles(markSel);
          grips.push(
            { end: "hinge", p: dh.hinge },
            { end: "span", p: dh.span },
            { end: "swing", p: dh.swing },
          );
        } else {
          const ends = markEnds(markSel);
          grips.push({ end: "a", p: ends.a }, { end: "b", p: ends.b });
          if (markSel.kind === "stair") {
            const sides = markSides(markSel);
            if (markSel.style === "quarter") {
              grips.push({ end: "q", p: quarterFlightEnd(markSel) });
            } else {
              grips.push({ end: "w", p: sides.n }, { end: "w", p: sides.s });
            }
          }
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
        const onGrip = Boolean(best && bestD <= hs && bestD <= toCenter + hs);
        if (onGrip && best) {
          const ends = markEnds(markSel);
          drag.current = {
            kind: "resize-mark",
            markId: markSel.id,
            end: best.end,
            fixed:
              best.end === "a" ? ends.b : best.end === "b" ? ends.a : undefined,
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
    if (selected && tool === "select" && !play) {
      const handle = hitHandleAt(wx, wy, bounds(livePoly ?? selected.poly), hs);
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
      setZoneEdit(null);
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
    if (hit) {
      if (
        selectedGroupId &&
        !selectedId &&
        groupIdsOf(hit).includes(selectedGroupId)
      ) {
        const members = groupMembersHere();
        drag.current = {
          kind: "maybe",
          groupId: selectedGroupId,
          origPolys: members.map((r) => ({ id: r.id, poly: r.poly })),
          lx: e.clientX,
          ly: e.clientY,
          wx,
          wy,
          moved: false,
        };
        return;
      }
      if (hit.id === selectedId) {
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
        roomId: hit.id,
        lx: e.clientX,
        ly: e.clientY,
        moved: false,
      };
      return;
    }

    const zone = hitZone(wx, wy);
    if (zone) {
      selectMark(zone.id);
      drag.current = {
        kind: "maybe",
        id: zone.id,
        markId: zone.id,
        origX: zone.x,
        origY: zone.y,
        origPoly: zone.poly,
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
    if (
      (tool === "draw" && drawShape === "line") ||
      (tool === "select" && roomEditRef.current)
    ) {
      const pts = polyDraftRef.current;
      setHover(pts.length ? snapOctant(pts[pts.length - 1]!, [wx, wy]) : [wx, wy]);
    }
    if (tool === "zone" && polyDraft.length) {
      setHover([wx, wy]);
    }
    if (tool === "ground") {
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
        flip: pose.flip,
      });
      setSnapWall(pose.wall ?? null);
    }
    const d = drag.current;
    if (!d) return;

    const travelNow = Math.hypot(e.clientX - d.lx, e.clientY - d.ly);
    if (travelNow > 12) clearHold();

    if (
      d.kind === "maybe" &&
      tool === "draw" &&
      (drawShape === "line" || drawShape === "polygon")
    ) {
      if (travelNow > 8) d.moved = true;
      return;
    }

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
        flip: pose.flip,
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

    if (d.kind === "brush") {
      const pts = polyDraftRef.current;
      const last = pts[pts.length - 1];
      if (!last || Math.hypot(wx - last[0], wy - last[1]) >= 4) {
        polyDraftRef.current = [...pts, [wx, wy]];
        setPolyDraft(polyDraftRef.current);
      }
      setHover([wx, wy]);
      d.moved = true;
      return;
    }

    if (d.kind === "line") {
      const pts = polyDraftRef.current;
      const p = pts.length ? snapOctant(pts[pts.length - 1]!, [wx, wy]) : ([wx, wy] as Point);
      setHover(p);
      d.moved = Math.hypot(e.clientX - d.lx, e.clientY - d.ly) > 6;
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
            flip: pose.flip ?? orig.flip,
          });
          setSnapWall(pose.wall ?? null);
        } else {
          const dxw = wx - (d.wx ?? wx);
          const dyw = wy - (d.wy ?? wy);
          const base = d.origPoly ?? orig.poly;
          setLiveMark({
            ...orig,
            x: (d.origX ?? orig.x) + dxw,
            y: (d.origY ?? orig.y) + dyw,
            poly: base ? translatePoly(base, dxw, dyw) : orig.poly,
          });
        }
      }
      d.moved = true;
      return;
    }

    if (d.kind === "resize-mark" && d.markId) {
      const orig = marksRef.current.find((f) => f.id === d.markId);
      if (orig) {
        if (orig.kind === "door" && (d.end === "hinge" || d.end === "span" || d.end === "swing")) {
          const [lx, ly] = localOnMark(orig, wx, wy);
          if (d.end === "hinge") {
            setLiveMark({
              ...orig,
              hinge: lx >= 0 ? "right" : "left",
              flip: ly < 0,
            });
          } else if (d.end === "span") {
            const hs = orig.hinge === "right" ? orig.length / 2 : -orig.length / 2;
            const dir = orig.hinge === "right" ? -1 : 1;
            const nextLen = Math.max(28, (lx - hs) * dir);
            const mid = hs + dir * (nextLen / 2);
            const [nx, ny] = worldFromLocal(orig, mid, 0);
            setLiveMark({
              ...orig,
              length: nextLen,
              x: nx,
              y: ny,
            });
          } else {
            const hs = orig.hinge === "right" ? orig.length / 2 : -orig.length / 2;
            setLiveMark({
              ...orig,
              width: Math.max(24, Math.hypot(lx - hs, ly)),
            });
          }
        } else if (d.end === "q" && orig.kind === "stair") {
          const [, ly] = localOnMark(orig, wx, wy);
          setLiveMark({ ...orig, width: Math.max(32, Math.abs(ly) * 2) });
        } else if (d.end === "w") {
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
      const scaled = scalePoly(d.origPoly, d.origBox, next);
      const others = roomsRef.current
        .filter((r) => r.id !== d.roomId)
        .map((r) => r.poly);
      setLivePoly(flushPoly(scaled, others, 32));
      d.moved = true;
      return;
    }

    if (d.kind === "resize-group" && d.handle && d.origBox && d.origInner) {
      const next = applyHandle(d.origBox, d.handle, wx, wy, 24);
      const inner = d.origInner;
      const gaps: number[] = [];
      if (d.handle.includes("w")) gaps.push(inner.minX - next.minX);
      if (d.handle.includes("e")) gaps.push(next.maxX - inner.maxX);
      if (d.handle.includes("n")) gaps.push(inner.minY - next.minY);
      if (d.handle.includes("s")) gaps.push(next.maxY - inner.maxY);
      const gap =
        gaps.length > 0 ? gaps.reduce((a, b) => a + b, 0) / gaps.length : DEFAULT_WALL_WIDTH / 2;
      const ww = clampWallWidth(gap * 2);
      setLiveWallWidth(ww);
      setLiveGroupBox(inflateBounds(inner, ww / 2));
      d.moved = true;
      return;
    }

    if (d.kind === "move-group" && d.origPolys && d.wx !== undefined && d.wy !== undefined) {
      setLiveGroupShift({ dx: wx - d.wx, dy: wy - d.wy });
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
      if (!play && d.origPoly && d.roomId === selectedId) {
        d.kind = "move-room";
        d.moved = true;
      } else if (!play && d.groupId && d.origPolys) {
        d.kind = "move-group";
        d.moved = true;
        if (d.wx !== undefined && d.wy !== undefined) {
          setLiveGroupShift({ dx: wx - d.wx, dy: wy - d.wy });
        }
      } else if (
        !play &&
        d.id &&
        marksRef.current.find((f) => f.id === d.id)
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
      const candidate = translatePoly(
        d.origPoly,
        wx - (d.wx ?? wx),
        wy - (d.wy ?? wy),
      );
      const others = roomsRef.current
        .filter((r) => r.id !== d.roomId)
        .map((r) => r.poly);
      setLivePoly(flushPoly(candidate, others, 36));
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
            flip: pose.flip ?? orig.flip,
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
      const from: Point = [d.wx ?? wx, d.wy ?? wy];
      const doors = marksRef.current
        .filter((f) => f.kind === "door")
        .map((f) => ({ x: f.x, y: f.y, length: f.length }));
      const slid = slideToken(from, [wx, wy], walls, doors, roomsRef.current);
      d.wx = slid.x;
      d.wy = slid.y;
      moveToken(d.id, {
        floorId,
        roomId: slid.roomId,
        x: slid.x,
        y: slid.y,
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
          flip: mark.flip,
          toFloor:
            mark.kind === "stair"
              ? floors.find((f) => f.id !== floorId)?.id
              : undefined,
        });
        return;
      }
      if (d?.kind === "lasso") {
        const poly = lassoReady(polyDraftRef.current);
        const edit = zoneEditRef.current;
        const polyMark = marksRef.current.find(
          (f) => f.id === selectedMarkId && f.kind === "zone",
        );
        drag.current = null;
        setPolyDraft([]);
        setHover(null);
        if (edit && polyMark?.poly && poly) {
          const next = booleanPoly(polyMark.poly, poly, edit === "erase" ? "erase" : "add");
          if (next) {
            const [x, y] = centroid(next);
            patchFixture(polyMark.id, { poly: next, x, y });
          }
        } else if (!edit && poly) {
          const snapped = snapDrawnPoly(poly);
          const [x, y] = centroid(snapped);
          addFixture({
            floorId,
            kind: "zone",
            x,
            y,
            rotation: 0,
            length: 48,
            poly: snapped,
            fill: useAtlas.getState().zoneFill,
            color: zoneColor,
          });
        }
        return;
      }
      if (d?.kind === "brush") {
        drag.current = null;
        commitBrush();
        return;
      }
      if (d?.kind === "line") {
        const pts = polyDraftRef.current;
        const p = snapOctant(pts[pts.length - 1] ?? [wx, wy], [wx, wy]);
        drag.current = null;
        if (pts.length >= 3 && canCloseZone(pts, p)) {
          closeLine(p);
          return;
        }
        const last = pts[pts.length - 1];
        if (!last || Math.hypot(p[0] - last[0], p[1] - last[1]) >= 10) {
          polyDraftRef.current = [...pts, p];
          setPolyDraft(polyDraftRef.current);
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
          flip: liveMark.flip,
          poly: liveMark.poly,
        });
        setLiveMark(null);
        setSnapWall(null);
        drag.current = null;
        return;
      }
      if (d?.kind === "resize-mark" && d.markId && d.end === "hinge" && !d.moved) {
        const orig = marksRef.current.find((f) => f.id === d.markId);
        if (orig?.kind === "door") {
          const seq: Array<{ hinge: "left" | "right"; flip: boolean }> = [
            { hinge: "left", flip: false },
            { hinge: "left", flip: true },
            { hinge: "right", flip: false },
            { hinge: "right", flip: true },
          ];
          const i = seq.findIndex(
            (s) => s.hinge === (orig.hinge ?? "left") && s.flip === Boolean(orig.flip),
          );
          const next = seq[(i + 1) % 4]!;
          patchFixture(orig.id, next);
        }
        setLiveMark(null);
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
          flip: liveMark.flip,
          hinge: liveMark.hinge,
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
      if (d?.kind === "resize-group" && d.groupId && liveWallWidth !== null) {
        patchGroup(d.groupId, { wallWidth: liveWallWidth });
        setLiveWallWidth(null);
        setLiveGroupBox(null);
        drag.current = null;
        return;
      }
      if (d?.kind === "move-group" && liveGroupShift && d.origPolys?.length) {
        translateRooms(
          d.origPolys.map((p) => p.id),
          liveGroupShift.dx,
          liveGroupShift.dy,
        );
        setLiveGroupShift(null);
        drag.current = null;
        return;
      }
      if (d?.kind === "maybe" && tool === "draw" && drawShape === "polygon") {
        drag.current = null;
        clearHold();
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
      const wasTap = d && d.kind === "maybe" && !d.moved;
      if (d?.kind === "token") {
        drag.current = null;
        clearHold();
        if (tool === "token") {
          useAtlas.getState().setPlacingToken(null);
          useAtlas.getState().setTool("select");
        }
        return;
      }
      drag.current = null;
      clearHold();
      if (holdOpened.current) {
        holdOpened.current = false;
        return;
      }
      if (wasTap) {
        if (tool === "select" && Date.now() < ignoreUntil.current) return;
        const mark = hitMark(wx, wy);
        if (mark) {
          selectMark(mark.id);
          setZoneEdit(null);
          return;
        }
        const hit = hitRoom(e.clientX, e.clientY);
        if (hit) {
          const now = Date.now();
          const prev = lastTap.current;
          const dbl = Boolean(prev && prev.id === hit.id && now - prev.at < 420);
          lastTap.current = { id: hit.id, at: now };
          select(hit.id, dbl ? { isolate: true } : undefined);
          setZoneEdit(null);
          return;
        }
        const zone = hitZone(wx, wy);
        if (zone) {
          selectMark(zone.id);
          return;
        }
        select(null);
        selectMark(null);
        setZoneEdit(null);
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
      const keepLine = drag.current?.kind === "line";
      drag.current = null;
      setDraft(null);
      setPlaceDraft(null);
      setGhostMark(null);
      setSnapWall(null);
      setLivePoly(null);
      setLiveMark(null);
      setLiveWallWidth(null);
      setLiveGroupShift(null);
      setLiveGroupBox(null);
      if (!keepLine) setPolyDraft([]);
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
    if (pos?.floorId && pos.floorId !== floorId) return null;
    let x = pos?.x;
    let y = pos?.y;
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      const room = rooms.find((r) => r.id === pos?.roomId);
      if (room) {
        const cxy = centroid(room.poly);
        x = cxy[0];
        y = cxy[1];
      } else {
        x = vb[0] + vb[2] / 2;
        y = vb[1] + vb[3] / 2;
      }
    }
    return { char: c, x: x as number, y: y as number, roomId: pos?.roomId ?? "", i };
  }).filter((t) => t !== null);

  const zoomPct = Math.round(cam.k * 100);
  const fit = fitScale();
  const screenK = Math.max(0.12, fit * cam.k);
  const handlePx = handleSizePx(chrome.handleSize);
  const hs = handlePx / screenK;
  const labelFs = (chrome.labelSize ?? 16) / screenK;
  const tokenPx = 36;
  const belowFloors = floors.slice(
    0,
    Math.max(0, floors.findIndex((f) => f.id === floorId)),
  );
  const selectedRoom = rooms.find((r) => r.id === selectedId);
  const selectedPoly = selectedRoom
    ? (livePoly ?? selectedRoom.poly)
    : undefined;
  const groupHere = selectedGroupId
    ? rooms.filter((r) => groupIdsOf(r).includes(selectedGroupId))
    : [];
  const groupInner = unionBounds(
    groupHere.map((r) =>
      liveGroupShift ? translatePoly(r.poly, liveGroupShift.dx, liveGroupShift.dy) : r.poly,
    ),
  );
  const activeGroup = groups.find((g) => g.id === selectedGroupId);
  const groupWall =
    liveWallWidth ?? activeGroup?.wallWidth ?? DEFAULT_WALL_WIDTH;
  const selectedBox = selectedPoly
    ? bounds(selectedPoly)
    : liveGroupBox
      ? liveGroupBox
      : groupInner && selectedGroupId && !selectedId
        ? inflateBounds(groupInner, groupWall / 2)
        : null;
  const selectedMark = marks.find((m) => m.id === selectedMarkId);
  const shownMark = liveMark && liveMark.id === selectedMarkId ? liveMark : selectedMark;
  const zones = useMemo(
    () => marks.filter((f) => f.kind === "zone" && f.poly && f.poly.length >= 3),
    [marks],
  );
  const packedTerrain = terrain[floorId];
  const groundRuns = useMemo(() => terrainRuns(packedTerrain), [packedTerrain]);
  const paintedKinds = useMemo(() => terrainKinds(packedTerrain), [packedTerrain]);
  const glyphs = useMemo(
    () => marks.filter((f) => !isPolyKind(f.kind)),
    [marks],
  );
  const arrivals = useMemo(
    () =>
      fixtures.filter(
        (f) => f.kind === "stair" && f.toFloor === floorId && f.floorId !== floorId,
      ),
    [fixtures, floorId],
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
      const ia = selectedId === a.id || (selectedGroupId && groupIdsOf(a).includes(selectedGroupId)) ? 1 : 0;
      const ib = selectedId === b.id || (selectedGroupId && groupIdsOf(b).includes(selectedGroupId)) ? 1 : 0;
      if (ia !== ib) return ib - ia;
      return area(b.poly) - area(a.poly);
    });
    for (const room of sorted) {
      const match = roomMatches(room, schema, filters, query, tokens);
      if (!match) continue;
      const important =
        selectedId === room.id ||
        Boolean(selectedGroupId && groupIdsOf(room).includes(selectedGroupId));
      const a = area(room.poly);
      if (!important && a < 28000) continue;
      const poly0 = room.id === selectedId && livePoly ? livePoly : room.poly;
      const poly =
        liveGroupShift && selectedGroupId && groupIdsOf(room).includes(selectedGroupId)
          ? translatePoly(poly0, liveGroupShift.dx, liveGroupShift.dy)
          : poly0;
      const [cx, cy] = centroid(poly);
      const fs = important ? labelFs * 1.15 : labelFs;
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
  }, [rooms, selectedId, selectedGroupId, query, filters, schema, livePoly, liveGroupShift, tokens, labelFs]);

  const cursor = tool !== "select" && tool !== "ground" ? "crosshair" : "pointer";

  return (
    <div
      ref={wrapRef}
      suppressHydrationWarning
      className="relative h-full w-full touch-none overflow-hidden bg-paper"
      style={{ cursor }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onPointerLeave={() => {
        if (tool === "ground" && !drag.current) setHover(null);
      }}
      onLostPointerCapture={(e) => {
        releasePtr(e.currentTarget, e.pointerId);
        pointers.current.delete(e.pointerId);
      }}
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
        style={{ cursor: tool === "ground" ? "none" : undefined }}
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
          <TerrainDefs palette={palette} />
        </defs>
        <rect
          x={vb[0]}
          y={vb[1]}
          width={vb[2]}
          height={vb[3]}
          fill={chrome.showGrid ? "url(#plan-grid)" : "var(--color-paper)"}
        />
        <g transform={`translate(${cam.x} ${cam.y}) scale(${cam.k})`}>
          {belowFloors.map((f, i) => {
            const opacity = 0.06 + (0.1 * (i + 1)) / belowFloors.length;
            const underRooms = allRooms.filter(
              (r) => r.floorId === f.id || r.travel?.some((t) => t.toFloor === f.id),
            );
            const underGrounds = terrainRuns(terrain[f.id]);
            const underZones = fixtures.filter(
              (m) => m.floorId === f.id && m.kind === "zone" && m.poly && m.poly.length >= 3,
            );
            return (
              <g key={f.id} opacity={opacity} className="pointer-events-none">
                {underGrounds.map((run, i) => (
                  <rect
                    key={`${f.id}-g-${i}`}
                    x={run.x}
                    y={run.y}
                    width={run.w}
                    height={run.h}
                    fill={`url(#${groundPatternId(run.kind)})`}
                  />
                ))}
                {underRooms.map((r) => (
                  <path
                    key={r.id}
                    d={polyToPath(r.poly)}
                    fill="var(--color-ink)"
                    fillOpacity="0.18"
                    stroke="var(--color-ink)"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                ))}
                {underZones.map((z) => (
                  <path
                    key={z.id}
                    d={polyToPath(z.poly!)}
                    fill={zonePaint(z)}
                    fillOpacity="0.35"
                    stroke={zonePaint(z)}
                    strokeWidth="2"
                  />
                ))}
              </g>
            );
          })}
          {groundRuns.map((run, i) => (
            <rect
              key={`g-${i}`}
              x={run.x}
              y={run.y}
              width={run.w}
              height={run.h}
              fill={`url(#${groundPatternId(run.kind)})`}
              className="pointer-events-none"
            />
          ))}
          {zones.map((z) => {
            const active = z.id === selectedMarkId;
            const fill = zonePaint(z);
            const poly =
              liveMark && liveMark.id === z.id && liveMark.poly ? liveMark.poly : z.poly!;
            return (
              <g key={z.id} className="pointer-events-none">
                <path
                  d={polyToPath(poly)}
                  fill={`color-mix(in oklab, ${fill} 14%, transparent)`}
                  stroke={fill}
                  strokeOpacity={active ? 0.9 : 0.55}
                  strokeWidth={active ? 2.6 : 1.6}
                  strokeDasharray="9 7"
                  strokeLinejoin="round"
                />
              </g>
            );
          })}
          {rooms.map((room) => {
            const match = roomMatches(room, schema, filters, query, tokens);
            const memberIds = groupIdsOf(room);
            const inSelectedGroup = Boolean(
              selectedGroupId && memberIds.includes(selectedGroupId),
            );
            const focused = selectedId === room.id;
            const active = focused || inSelectedGroup;
            const group =
              (selectedGroupId && inSelectedGroup
                ? groups.find((g) => g.id === selectedGroupId)
                : undefined) ?? groups.find((g) => g.id === memberIds[0]);
            const groupColor = group?.color;
            const tone = tintOf(room.props ?? {}, schema);
            const guest = room.floorId !== floorId;
            const dash =
              tone === "clay" ? "10 7" : tone === "ink" ? "3 6" : guest ? "9 7" : undefined;
            let poly = focused && livePoly ? livePoly : room.poly;
            if (liveGroupShift && inSelectedGroup) {
              poly = translatePoly(poly, liveGroupShift.dx, liveGroupShift.dy);
            }
            const dimmed = placeHasAction(schema, room.props, "dim");
            const hidden = placeHasAction(schema, room.props, "hide");
            const outline = placeHasAction(schema, room.props, "outline");
            const hatched = placeHasAction(schema, room.props, "hatch");
            const glow = placeHasAction(schema, room.props, "glow");
            const locked = placeHasAction(schema, room.props, "lock");
            let memberWall = 0;
            for (const id of memberIds) {
              const g = groups.find((x) => x.id === id);
              const ww =
                g?.id === selectedGroupId && liveWallWidth !== null
                  ? liveWallWidth
                  : g?.wallWidth;
              if (typeof ww === "number" && ww > memberWall) memberWall = ww;
            }
            const sw = outline
              ? Math.max(memberWall || DEFAULT_WALL_WIDTH, focused ? 7 : 5)
              : focused
                ? Math.max(memberWall || DEFAULT_WALL_WIDTH, 5)
                : memberWall || DEFAULT_WALL_WIDTH;
            if (hidden && !active) return null;
            return (
              <g key={room.id} opacity={dimmed && !active ? 0.42 : 1}>
                {glow && match ? (
                  <path
                    d={polyToPath(poly)}
                    fill="none"
                    stroke="var(--color-primary)"
                    strokeOpacity="0.35"
                    strokeWidth="14"
                    strokeLinejoin="miter"
                    className="pointer-events-none"
                  />
                ) : null}
                <path
                  d={polyToPath(poly)}
                  fill={fillFor(tone, active, !match, groupColor)}
                  stroke={active && groupColor ? groupColor : "var(--color-ink)"}
                  strokeOpacity={match ? (active ? 0.92 : 0.62) : 0.16}
                  strokeWidth={sw}
                  strokeLinejoin="miter"
                  strokeDasharray={
                    outline ? "6 5" : dash
                  }
                  className={cn(!match && "pointer-events-none")}
                />
                {(tone === "clay" || hatched) && match ? (
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
                {schema
                  .filter((def) => placeHasAction([def], room.props, "badge"))
                  .map((def) => {
                    const value = readProp(room.props ?? {}, def);
                    const labels = formatProp(def, value);
                    if (!labels.length) return null;
                    const [cx, cy] = centroid(poly);
                    return (
                      <text
                        key={def.id}
                        x={cx}
                        y={cy + 26}
                        textAnchor="middle"
                        fill="var(--color-ink)"
                        fontSize="11"
                        fontFamily="var(--font-sans)"
                        className="pointer-events-none"
                      >
                        {labels.join(" · ")}
                      </text>
                    );
                  })}
                {locked && match ? (
                  <text
                    x={centroid(poly)[0]}
                    y={centroid(poly)[1] - 22}
                    textAnchor="middle"
                    fill="var(--color-ink)"
                    fontSize="12"
                    className="pointer-events-none"
                  >
                    ⌁
                  </text>
                ) : null}
                {match && !play
                  ? (() => {
                      const long = edgeDims(poly);
                      const dims =
                        long.length >= 2 && !(poly.length > 8 && long.length < 3)
                          ? long
                          : bboxDimLabels(poly);
                      const dimFs = labelFs * 0.72;
                      const pad = Math.max(10, dimFs * 0.75);
                      return dims.map((edge, i) => {
                        const tw = labelSize(edge.label, dimFs).w;
                        if (tw > edge.length * 0.92) return null;
                        const x = edge.mid[0] + edge.nx * pad;
                        const y = edge.mid[1] + edge.ny * pad;
                        return (
                          <text
                            key={`dim-${room.id}-${i}`}
                            x={x}
                            y={y}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fill="var(--color-ink)"
                            fillOpacity="0.72"
                            fontSize={dimFs}
                            fontFamily="var(--font-sans)"
                            fontWeight={500}
                            transform={`rotate(${edge.angle} ${x} ${y})`}
                            className="pointer-events-none"
                          >
                            {edge.label}
                          </text>
                        );
                      });
                    })()
                  : null}
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
              {tool === "ground" ? (
                <polyline
                  points={polyDraft.map((p) => p.join(",")).join(" ")}
                  fill="none"
                  stroke={
                    groundErase
                      ? "color-mix(in oklab, var(--color-clay) 70%, transparent)"
                      : groundFill(groundKind, palette)
                  }
                  strokeWidth={groundBrush * 2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={groundErase ? 0.45 : 0.72}
                />
              ) : tool === "zone" || zoneEdit || roomEdit ? (
                <path
                  d={polyToPath(
                    hoverSnap ? [...polyDraft, hoverSnap] : polyDraft,
                  )}
                  fill={
                    zoneEdit === "erase"
                      ? "color-mix(in oklab, var(--color-clay) 22%, transparent)"
                      : zoneCanCommit
                        ? `color-mix(in oklab, ${zonePaint({ fill: zoneFill, color: zoneColor })} 18%, transparent)`
                        : "none"
                  }
                  stroke={
                    zoneEdit === "erase"
                      ? "var(--color-clay)"
                      : zonePaint({ fill: zoneFill, color: zoneColor })
                  }
                  strokeWidth="3"
                  strokeDasharray={tool === "zone" || zoneEdit ? "9 7" : undefined}
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
          {tool === "ground" && hover && !play ? (
            <circle
              cx={hover[0]}
              cy={hover[1]}
              r={groundBrush}
              fill={
                groundErase
                  ? "color-mix(in oklab, var(--color-clay) 22%, transparent)"
                  : `color-mix(in oklab, ${groundFill(groundKind, palette)} 28%, transparent)`
              }
              stroke={groundErase ? "var(--color-clay)" : groundInk(groundKind, palette)}
              strokeWidth="1.5"
              className="pointer-events-none"
            />
          ) : null}
          {selectedBox && !play && (selectedPoly || (selectedGroupId && !selectedId)) ? (
            <g>
              <rect
                x={selectedBox.minX}
                y={selectedBox.minY}
                width={selectedBox.maxX - selectedBox.minX}
                height={selectedBox.maxY - selectedBox.minY}
                fill="none"
                stroke={
                  selectedGroupId && !selectedId && activeGroup?.color
                    ? activeGroup.color
                    : "var(--color-primary)"
                }
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
          {zones.map((z) => {
            const shown = liveMark && liveMark.id === z.id ? liveMark : z;
            const poly = shown.poly && shown.poly.length >= 3 ? shown.poly : z.poly!;
            const [cx, cy] = centroid(poly);
            const fill = zonePaint(shown);
            const active = z.id === selectedMarkId;
            return (
              <g key={`pin-${z.id}`} className="pointer-events-none">
                <path
                  d={`M${cx} ${cy - 22} c6.4 0 11.5 5 11.5 11.2 0 8.4 -11.5 16.8 -11.5 16.8 S${cx - 11.5} ${cy - 2.8} ${cx - 11.5} ${cy - 10.8} C${cx - 11.5} ${cy - 17} ${cx - 6.4} ${cy - 22} ${cx} ${cy - 22}z`}
                  fill={fill}
                  stroke="var(--color-paper)"
                  strokeWidth="1.6"
                />
                <circle cx={cx} cy={cy - 11} r="3.4" fill="var(--color-paper)" />
                {shown.label ? (
                  <text
                    x={cx}
                    y={cy + 18}
                    textAnchor="middle"
                    fill="var(--color-ink)"
                    fontSize="13"
                    fontFamily="var(--font-display)"
                    fontWeight={500}
                    paintOrder="stroke"
                    stroke="var(--color-paper)"
                    strokeWidth="3"
                  >
                    {shown.label}
                  </text>
                ) : null}
                {active ? (
                  <circle
                    cx={cx}
                    cy={cy - 11}
                    r="14"
                    fill="none"
                    stroke={fill}
                    strokeOpacity="0.45"
                    strokeWidth="1.6"
                  />
                ) : null}
              </g>
            );
          })}
          {arrivals.map((f) => (
            <g key={`arr-${f.id}`} opacity="0.42" className="pointer-events-none">
              <FixtureGlyph fixture={f} />
            </g>
          ))}
          {shownMark && !isPolyKind(shownMark.kind) && !play ? (
            <g>
              {shownMark.kind === "door"
                ? (
                    [
                      ["hinge", doorHandles(shownMark).hinge],
                      ["span", doorHandles(shownMark).span],
                      ["swing", doorHandles(shownMark).swing],
                    ] as const
                  ).map(([id, pt]) => (
                    <rect
                      key={id}
                      x={pt[0] - hs}
                      y={pt[1] - hs}
                      width={hs * 2}
                      height={hs * 2}
                      fill="var(--color-paper)"
                      stroke="var(--color-primary)"
                      strokeWidth="2"
                      style={{
                        cursor:
                          id === "hinge"
                            ? "move"
                            : id === "span"
                              ? "ew-resize"
                              : "ns-resize",
                      }}
                    />
                  ))
                : (
                    <>
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
                      {shownMark.kind === "stair" && shownMark.style === "quarter" ? (
                        <rect
                          x={quarterFlightEnd(shownMark)[0] - hs}
                          y={quarterFlightEnd(shownMark)[1] - hs}
                          width={hs * 2}
                          height={hs * 2}
                          fill="var(--color-paper)"
                          stroke="var(--color-primary)"
                          strokeWidth="2"
                          style={{ cursor: "ns-resize" }}
                        />
                      ) : shownMark.kind === "stair" ? (
                        (["n", "s"] as const).map((side) => {
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
                      ) : null}
                    </>
                  )}
            </g>
          ) : null}
          {ghostMark && !placeDraft ? (
            <g opacity="0.45" className="pointer-events-none">
              <FixtureGlyph fixture={ghostMark} active />
            </g>
          ) : null}
          {placeDraft ? <FixtureGlyph fixture={placeDraft} active /> : null}
        </g>
      </svg>

      {labels.map((lab) => {
        const pos = worldToLocal(lab.x + lab.w / 2, lab.y + lab.h / 2);
        return (
          <span
            key={lab.id}
            className="pointer-events-none absolute z-[8] rounded-md bg-background/85 px-1.5 py-0.5 font-display font-medium text-foreground shadow-sm"
            style={{
              left: pos.left,
              top: pos.top,
              transform: "translate(-50%, -50%)",
              fontSize: chrome.labelSize ?? 16,
            }}
          >
            {lab.text}
          </span>
        );
      })}

      {(chrome.showTokens !== false || tool === "token") &&
        tokensHere.map((t) => {
          const pos = worldToLocal(t.x, t.y);
          const fill =
            sanitizeHexColor(t.char.color) ||
            TOKEN_COLORS[t.i % TOKEN_COLORS.length];
          return (
            <button
              key={t.char.id}
              type="button"
              aria-label={t.char.name}
              className="absolute z-[12] flex items-center justify-center rounded-full border-2 border-foreground/80 font-sans font-semibold text-white shadow-md touch-none"
              style={{
                left: pos.left,
                top: pos.top,
                width: tokenPx,
                height: tokenPx,
                background: fill,
                transform: "translate(-50%, -50%)",
                fontSize: Math.round(tokenPx * 0.42),
              }}
              onPointerDown={(ev) => {
                ev.stopPropagation();
                ev.preventDefault();
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
                  wx: t.x,
                  wy: t.y,
                  moved: false,
                };
              }}
            >
              {t.char.short}
            </button>
          );
        })}

      <div
        className="absolute right-3 top-3 z-10 flex flex-col gap-1"
        onPointerDown={(e) => e.stopPropagation()}
        onPointerMove={(e) => e.stopPropagation()}
      >
        <Tip label="Zoom avant" side="left">
          <Button
            variant="outline"
            size="icon"
            className="bg-card"
            aria-label="Zoom avant"
            style={{ width: chrome.toolBtnSize, height: chrome.toolBtnSize }}
            {...pressProps(() => zoomAround(1.25))}
          >
            <Plus className="size-4" />
          </Button>
        </Tip>
        <Tip label="Zoom arrière" side="left">
          <Button
            variant="outline"
            size="icon"
            className="bg-card"
            aria-label="Zoom arrière"
            style={{ width: chrome.toolBtnSize, height: chrome.toolBtnSize }}
            {...pressProps(() => zoomAround(0.8))}
          >
            <Minus className="size-4" />
          </Button>
        </Tip>
        {mapFullscreen ? (
          <Tip label="Retour" side="left">
            <Button
              variant="outline"
              size="icon"
              className="bg-card"
              aria-label="Retour"
              style={{ width: chrome.toolBtnSize, height: chrome.toolBtnSize }}
              {...pressProps(() => setFullscreen(false))}
            >
              <ArrowLeft className="size-4" />
            </Button>
          </Tip>
        ) : (
          <Tip label="Plein écran" side="left">
            <Button
              variant="outline"
              size="icon"
              className="bg-card"
              aria-label="Plein écran"
              style={{ width: chrome.toolBtnSize, height: chrome.toolBtnSize }}
              {...pressProps(() => setFullscreen(true))}
            >
              <Maximize2 className="size-4" />
            </Button>
          </Tip>
        )}
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
          className="absolute bottom-3 right-3 z-10 flex gap-1.5"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <Tip label="Annuler le tracé">
            <Button
              size="sm"
              variant="outline"
              className="bg-card"
              {...pressProps(() => {
                polyDraftRef.current = [];
                setPolyDraft([]);
                setHover(null);
              })}
            >
              Retour
            </Button>
          </Tip>
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

      {roomEdit && polyDraft.length > 0 ? (
        <div
          className="absolute bottom-3 right-3 z-10 flex gap-1.5"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <Tip label="Annuler le tracé">
            <Button
              size="sm"
              variant="outline"
              className="bg-card"
              {...pressProps(() => {
                polyDraftRef.current = [];
                setPolyDraft([]);
                setHover(null);
                setRoomEdit(null);
              })}
            >
              Retour
            </Button>
          </Tip>
          <Button
            size="sm"
            disabled={!lineCanCommit}
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

      {tool === "zone" && !play ? (
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

      {tool === "ground" && !play ? (
        <div
          className="absolute bottom-3 left-3 z-10 flex max-w-[min(100%,22rem)] flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-2"
          style={{ cursor: "auto" }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <Tip label={groundErase ? "Peindre" : "Gommer"}>
            <Button
              size="icon"
              variant={groundErase ? "default" : "outline"}
              className="bg-card"
              aria-label={groundErase ? "Gommer le sol" : "Gommer"}
              aria-pressed={groundErase}
              style={{ width: chrome.toolBtnSize, height: chrome.toolBtnSize }}
              {...pressProps(() => setGroundErase((v) => !v))}
            >
              <Eraser className="size-4" />
            </Button>
          </Tip>
          <div className="flex min-w-32 flex-1 flex-col gap-1 px-1">
            <label htmlFor="ground-brush" className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Pinceau
            </label>
            <input
              id="ground-brush"
              type="range"
              min={MIN_GROUND_BRUSH}
              max={MAX_GROUND_BRUSH}
              step={2}
              value={groundBrush}
              aria-label="Taille du pinceau"
              onChange={(e) => setGroundBrush(Number(e.target.value))}
              className="h-11 w-full accent-primary"
            />
          </div>
        </div>
      ) : null}

      {selectedId && !selectedMark && tool !== "zone" && tool !== "ground" && !play ? (
        <div
          className="absolute bottom-3 left-3 z-10 flex flex-wrap items-center gap-1.5"
          onPointerDown={(e) => e.stopPropagation()}
        >
          {roomEdit ? (
            <>
              <Tip label="Agrandir par tracé de lignes">
                <Button
                  size="icon"
                  variant={roomEdit === "expand" ? "default" : "outline"}
                  className="bg-card"
                  aria-label="Agrandir"
                  style={{ width: chrome.toolBtnSize, height: chrome.toolBtnSize }}
                  {...pressProps(() => setRoomEdit("expand"))}
                >
                  <Pencil className="size-4" />
                </Button>
              </Tip>
              <Tip label="Retrancher une zone">
                <Button
                  size="icon"
                  variant={roomEdit === "erase" ? "default" : "outline"}
                  className="bg-card"
                  aria-label="Gommer"
                  style={{ width: chrome.toolBtnSize, height: chrome.toolBtnSize }}
                  {...pressProps(() => setRoomEdit("erase"))}
                >
                  <Eraser className="size-4" />
                </Button>
              </Tip>
              <Tip label="Retour">
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Retour"
                  style={{ width: chrome.toolBtnSize, height: chrome.toolBtnSize }}
                  {...pressProps(() => {
                    setRoomEdit(null);
                    setPolyDraft([]);
                  })}
                >
                  <ArrowLeft className="size-4" />
                </Button>
              </Tip>
            </>
          ) : (
            <>
              <Tip label="Modifier la pièce">
                <Button
                  size="icon"
                  variant="outline"
                  className="bg-card"
                  aria-label="Modifier la pièce"
                  style={{ width: chrome.toolBtnSize, height: chrome.toolBtnSize }}
                  {...pressProps(() => setRoomEdit("expand"))}
                >
                  <Pencil className="size-4" />
                </Button>
              </Tip>
              <Tip label="Supprimer la pièce">
                <Button
                  size="icon"
                  variant="outline"
                  className="bg-card"
                  aria-label="Supprimer la pièce"
                  style={{ width: chrome.toolBtnSize, height: chrome.toolBtnSize }}
                  {...pressProps(() => deleteRoom(selectedId))}
                >
                  <Trash2 className="size-4" />
                </Button>
              </Tip>
            </>
          )}
        </div>
      ) : null}

      {selectedMark && selectedMark.kind !== "ground" && tool !== "zone" && tool !== "ground" && !play ? (
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
            zoneEdit ? (
              <>
                <Tip label="Agrandir">
                <Button
                  size="icon"
                  variant={zoneEdit === "expand" ? "default" : "outline"}
                  className="bg-card"
                  aria-label="Agrandir"
                  style={{ width: chrome.toolBtnSize, height: chrome.toolBtnSize }}
                  {...pressProps(() => setZoneEdit("expand"))}
                >
                  <Pencil className="size-4" />
                </Button>
                </Tip>
                <Tip label="Gommer">
                <Button
                  size="icon"
                  variant={zoneEdit === "erase" ? "default" : "outline"}
                  className="bg-card"
                  aria-label="Gommer"
                  style={{ width: chrome.toolBtnSize, height: chrome.toolBtnSize }}
                  {...pressProps(() => setZoneEdit("erase"))}
                >
                  <Eraser className="size-4" />
                </Button>
                </Tip>
                <Tip label="Retour">
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Retour"
                  style={{ width: chrome.toolBtnSize, height: chrome.toolBtnSize }}
                  {...pressProps(() => {
                    setZoneEdit(null);
                    setPolyDraft([]);
                  })}
                >
                  <ArrowLeft className="size-4" />
                </Button>
                </Tip>
              </>
            ) : (
              <Tip label="Modifier le repère">
              <Button
                size="icon"
                variant="outline"
                className="bg-card"
                aria-label="Modifier le repère"
                style={{ width: chrome.toolBtnSize, height: chrome.toolBtnSize }}
                {...pressProps(() => setZoneEdit("expand"))}
              >
                <Pencil className="size-4" />
              </Button>
              </Tip>
            )
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
          {selectedMark.kind === "door" ? (
            <Tip label="Inverser le sens">
              <Button
                size="sm"
                variant="outline"
                className="bg-card"
                aria-label="Inverser le sens de la porte"
                {...pressProps(() =>
                  patchFixture(selectedMark.id, { flip: !selectedMark.flip }),
                )}
              >
                <FlipHorizontal2 className="size-4" />
                Inverser
              </Button>
            </Tip>
          ) : null}
          <Tip label="Supprimer l’élément">
          <Button
            size="icon"
            variant="outline"
            className="bg-card"
            aria-label="Supprimer l’élément"
            style={{ width: chrome.toolBtnSize, height: chrome.toolBtnSize }}
            {...pressProps(() => deleteFixture(selectedMark.id))}
          >
            <Trash2 className="size-4" />
          </Button>
          </Tip>
        </div>
      ) : null}

      <div className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-2 text-xs text-muted-foreground">
        {chrome.showCompass && !selectedMark && !selectedId && tool !== "zone" && tool !== "ground" ? (
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

      {paintedKinds.length && !play ? (
        <div
          className="pointer-events-none absolute bottom-3 right-3 z-10 flex max-w-[12rem] flex-col gap-1 rounded-lg border border-border bg-card/90 px-2 py-1.5 text-[11px] text-muted-foreground"
          aria-hidden
        >
          {paintedKinds.map((id) => {
            const meta = groundMeta(id);
            return (
              <span key={id} className="flex items-center gap-1.5">
                <span
                  className="size-2.5 shrink-0 rounded-full border border-border"
                  style={{ background: groundFill(id, palette) }}
                />
                {meta.label}
              </span>
            );
          })}
          {zones.length ? (
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 shrink-0 rounded-full border border-dashed border-primary" />
              Repère
            </span>
          ) : null}
        </div>
      ) : null}

      {rooms.length === 0 && zones.length === 0 && groundRuns.length === 0 && tool === "select" ? (
        <p className="pointer-events-auto absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-muted-foreground">
          <EditableTitle
            as="span"
            value={emptyPlan}
            onChange={(next) => useUiStore.getState().setCopy({ emptyPlan: next })}
            className="max-w-sm"
            placeholder="Plan vide."
            maxLength={160}
          />
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
        <g transform={`scale(1 ${fixture.flip ? -1 : 1})`}>
          {(() => {
            const S = doorSwing(fixture);
            const hs = fixture.hinge === "right" ? L / 2 : -L / 2;
            const dir = fixture.hinge === "right" ? -1 : 1;
            return (
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
                  d={`M ${hs + dir * S} 0 A ${S} ${S} 0 0 1 ${hs} ${S}`}
                  fill="color-mix(in oklab, var(--color-primary) 12%, transparent)"
                  stroke={stroke}
                  strokeWidth="2"
                />
                <line
                  x1={hs}
                  y1={0}
                  x2={hs}
                  y2={S}
                  stroke={stroke}
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <circle cx={hs} cy={0} r="4" fill={stroke} />
              </>
            );
          })()}
        </g>
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
    const T = STAIR_TREAD;
    const treads = 4;
    const body = (
      <>
        <rect
          x={-L / 2}
          y={-T / 2}
          width={L}
          height={T}
          fill={fill}
          stroke={stroke}
          strokeWidth="2.5"
        />
        <rect
          x={L / 2 - T}
          y={-T / 2}
          width={T}
          height={W / 2 + T / 2}
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
              y1={-T / 2 + 3}
              x2={x}
              y2={T / 2 - 3}
              stroke={stroke}
              strokeWidth="1.5"
              strokeOpacity="0.7"
            />
          );
        })}
        {Array.from({ length: treads }, (_, i) => {
          const y = T / 2 + ((i + 1) * (W / 2 - T / 2)) / (treads + 1);
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
          points={`${-L / 2 + 8},${-6} ${-L / 2 + 8},${6} ${-L / 2 + 20},0`}
          fill={stroke}
        />
      </>
    );
    return fixture.flip ? <g transform="scale(1 -1)">{body}</g> : body;
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
