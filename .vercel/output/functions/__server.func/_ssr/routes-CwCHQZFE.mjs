import { o as __toESM } from "../_runtime.mjs";
import { l as require_react_dom, u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { _ as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { B as ArrowUp, D as ImagePlus, E as IterationCw, H as ArrowDown, I as Circle, L as ChevronsUp, M as DoorOpen, O as Hexagon, P as CornerRightDown, R as ChevronDown, S as Minus, T as ListFilter, U as AppWindow, _ as Plus, a as Undo2, f as Search, h as RotateCw, l as Square, n as Users, p as Scan, s as Trash2, t as X, u as SlidersHorizontal, v as Pencil, w as MapPin, x as PaintBucket, y as PenLine, z as Check } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { $ as doorMark, A as sanitizeHexColor, C as useUiStore, D as roomById, E as floorById, G as uid, H as readProp, J as bounds, K as applyHandle, M as zoneCss, N as zoneHex, O as STAIR_STYLES, P as zonePaint, Q as distToSegment, R as formatProp, S as handleSizePx, T as resolveRoom, V as optionLabel, W as tintOf, X as canCloseZone, Y as boxesOverlap, Z as centroid, at as lineReady, b as useAtlas, ct as markSides, dt as polyToPath, et as ellipsePoly, ft as scalePoly, gt as widthFromPoint, ht as translatePoly, it as lassoReady, j as sanitizePhotos, k as ZONE_FILLS, lt as pointInPoly, mt as stairLines, nt as handleCursor, ot as markEnds, pt as snapZonePoint, q as area, rt as labelSize, st as markFromEnds, tt as fixtureWidth, ut as pointInRotatedRect, w as resolveFloor, y as roomMatches } from "./router-0jzItr0j.mjs";
import { t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { n as cn, r as pressProps, t as Button } from "./press-UBLDE-un.mjs";
import { t as Label } from "./label-Dn6Iajez.mjs";
import { n as PrefsSaveBar, t as GuardBoundary } from "./prefs-save-bar-Dju-onwJ.mjs";
import { t as Separator } from "./separator-D4L1gUfN.mjs";
import { t as Input } from "./input-Cu1eRQUe.mjs";
import { t as AppHeader } from "./app-header-D4WBOYKd.mjs";
import { i as Trigger, n as Portal, r as Root2, t as Content2 } from "../_libs/radix-ui__react-popover.mjs";
import { n as Portal$1, r as Provider, t as Content2$1 } from "../_libs/@radix-ui/react-tooltip+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-CwCHQZFE.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var import_react_dom = /* @__PURE__ */ __toESM(require_react_dom());
function ColorWheel({ value, onChange, label = "Couleur", id = "zone-color", className }) {
	const hex = sanitizeHexColor(value) ?? "#6a7a58";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("flex flex-col gap-2", className),
		children: [label ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
			htmlFor: id,
			children: label
		}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				id,
				type: "color",
				value: hex,
				"aria-label": label || "Roue des couleurs",
				onChange: (e) => onChange(e.target.value),
				className: "h-11 w-14 cursor-pointer appearance-none rounded-md border border-border bg-card p-1"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
				value: hex,
				"aria-label": "Code couleur",
				className: "font-mono uppercase",
				onChange: (e) => {
					const next = e.target.value;
					if (next === "" || next === "#") {
						onChange("#");
						return;
					}
					const clean = sanitizeHexColor(next);
					if (clean) onChange(clean);
					else if (/^#[0-9a-fA-F]{1,6}$/.test(next)) onChange(next);
				},
				onBlur: () => {
					const clean = sanitizeHexColor(hex);
					if (clean) onChange(clean);
				}
			})]
		})]
	});
}
function PlanMenu({ target, x, y, onClose }) {
	return (0, import_react_dom.createPortal)(target.kind === "room" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RoomMenu, {
		room: target.room,
		x,
		y,
		onClose
	}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MarkMenu, {
		mark: target.mark,
		x,
		y,
		onClose
	}), document.body);
}
function useMenuChrome(onClose, panel) {
	const nameRef = (0, import_react.useRef)(null);
	const onCloseRef = (0, import_react.useRef)(onClose);
	onCloseRef.current = onClose;
	(0, import_react.useEffect)(() => {
		nameRef.current?.focus();
		nameRef.current?.select();
	}, []);
	(0, import_react.useEffect)(() => {
		function onDoc(e) {
			if (panel.current?.contains(e.target)) return;
			onCloseRef.current();
		}
		function onKey(e) {
			if (e.key === "Escape") onCloseRef.current();
		}
		window.addEventListener("pointerdown", onDoc, true);
		window.addEventListener("keydown", onKey);
		return () => {
			window.removeEventListener("pointerdown", onDoc, true);
			window.removeEventListener("keydown", onKey);
		};
	}, [panel]);
	return nameRef;
}
function RoomMenu({ room, x, y, onClose }) {
	const patchRoom = useAtlas((s) => s.patchRoom);
	const deleteRoom = useAtlas((s) => s.deleteRoom);
	const live = useAtlas((s) => s.rooms.find((r) => r.id === room.id) ?? room);
	const panel = (0, import_react.useRef)(null);
	const nameRef = useMenuChrome(onClose, panel);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		ref: panel,
		role: "menu",
		"aria-label": `Éditer ${live.name}`,
		style: {
			left: x,
			top: y
		},
		className: "fixed z-50 w-[16.5rem] rounded-lg border border-border bg-card p-3 shadow-md",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mb-3 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground",
				children: "Éditer la pièce"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						htmlFor: `room-rename-${live.id}`,
						children: "Nom"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						ref: nameRef,
						id: `room-rename-${live.id}`,
						value: live.name,
						onChange: (e) => {
							const name = e.target.value;
							patchRoom(live.id, {
								name,
								label: name.trim().slice(0, 14) || live.label
							});
						}
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						htmlFor: `room-label-${live.id}`,
						children: "Abrégé (plan)"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						id: `room-label-${live.id}`,
						value: live.label,
						maxLength: 16,
						onChange: (e) => patchRoom(live.id, { label: e.target.value || live.label })
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				type: "button",
				variant: "outline",
				size: "sm",
				className: "mt-3 w-full justify-start",
				onClick: () => {
					deleteRoom(live.id);
					onClose();
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-4" }), "Supprimer"]
			})
		]
	});
}
function MarkMenu({ mark, x, y, onClose }) {
	const patchFixture = useAtlas((s) => s.patchFixture);
	const deleteFixture = useAtlas((s) => s.deleteFixture);
	const live = useAtlas((s) => s.fixtures.find((f) => f.id === mark.id) ?? mark);
	const panel = (0, import_react.useRef)(null);
	const nameRef = useMenuChrome(onClose, panel);
	const title = live.kind === "zone" ? "Éditer la zone" : live.kind === "door" ? "Éditer la porte" : live.kind === "window" ? "Éditer la fenêtre" : "Éditer l’escalier";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		ref: panel,
		role: "menu",
		"aria-label": title,
		style: {
			left: x,
			top: y
		},
		className: "fixed z-50 w-[16.5rem] rounded-lg border border-border bg-card p-3 shadow-md",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mb-3 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground",
				children: title
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
					htmlFor: `mark-name-${live.id}`,
					children: "Nom"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					ref: nameRef,
					id: `mark-name-${live.id}`,
					value: live.label ?? "",
					placeholder: title.replace("Éditer ", ""),
					onChange: (e) => patchFixture(live.id, { label: e.target.value || void 0 })
				})]
			}),
			live.kind === "zone" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 flex flex-col gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ColorWheel, {
						id: `mark-color-${live.id}`,
						value: sanitizeHexColor(live.color) ?? zoneHex(live.fill),
						onChange: (color) => patchFixture(live.id, { color })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted-foreground",
						children: "Teintes rapides"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FillSwatches, {
						value: live.fill ?? "sage",
						onChange: (fill) => patchFixture(live.id, {
							fill,
							color: zoneHex(fill)
						})
					})
				]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				type: "button",
				variant: "outline",
				size: "sm",
				className: "mt-3 w-full justify-start",
				onClick: () => {
					deleteFixture(live.id);
					onClose();
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-4" }), "Supprimer"]
			})
		]
	});
}
function FillSwatches({ value, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex flex-wrap gap-1.5",
		role: "listbox",
		"aria-label": "Couleur de zone",
		children: ZONE_FILLS.map((z) => {
			const on = value === z.id;
			return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				role: "option",
				"aria-selected": on,
				"aria-label": z.label,
				title: z.label,
				...pressProps(() => onChange(z.id)),
				className: cn("size-11 rounded-full border-2 transition-transform", on ? "border-foreground scale-110" : "border-transparent hover:scale-105"),
				style: { background: zoneCss(z.id) }
			}, z.id);
		})
	});
}
function clampMenu(x, y, w = 264, h = 280) {
	const pad = 8;
	return {
		x: Math.min(Math.max(pad, x), window.innerWidth - w - pad),
		y: Math.min(Math.max(pad, y), window.innerHeight - h - pad)
	};
}
var TOKEN_R = 16;
var TOKEN_COLORS = [
	"var(--color-token-stella)",
	"var(--color-token-antoine)",
	"var(--color-token-myriam)"
];
var MIN_K = .7;
var MAX_K = 6;
var TAP_PX = 28;
var HANDLES = [
	"nw",
	"n",
	"ne",
	"e",
	"se",
	"s",
	"sw",
	"w"
];
function fillFor(tone, active, dim) {
	if (dim) return "color-mix(in oklab, var(--color-foreground) 3%, var(--color-paper))";
	if (active) return "color-mix(in oklab, var(--color-primary) 32%, var(--color-paper))";
	switch (tone) {
		case "clay": return "color-mix(in oklab, var(--color-clay) 16%, var(--color-paper))";
		case "stone": return "color-mix(in oklab, var(--color-stone) 28%, var(--color-paper))";
		case "ink": return "color-mix(in oklab, var(--color-primary) 18%, var(--color-paper))";
		case "sage": return "color-mix(in oklab, var(--color-primary) 8%, var(--color-paper))";
		default: return "color-mix(in oklab, var(--color-primary) 8%, var(--color-paper))";
	}
}
function clampK(k) {
	return Math.min(MAX_K, Math.max(MIN_K, k));
}
function dist(a, b) {
	return Math.hypot(a.x - b.x, a.y - b.y);
}
function handlePoints(box) {
	const cx = (box.minX + box.maxX) / 2;
	const cy = (box.minY + box.maxY) / 2;
	return {
		nw: [box.minX, box.minY],
		n: [cx, box.minY],
		ne: [box.maxX, box.minY],
		e: [box.maxX, cy],
		se: [box.maxX, box.maxY],
		s: [cx, box.maxY],
		sw: [box.minX, box.maxY],
		w: [box.minX, cy]
	};
}
function polyFromBox(shape, x, y, w, h) {
	if (shape === "ellipse") return ellipsePoly(x + w / 2, y + h / 2, w / 2, h / 2);
	return [
		[x, y],
		[x + w, y],
		[x + w, y + h],
		[x, y + h]
	];
}
var FloorPlan = (0, import_react.memo)(function FloorPlan() {
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
	const rooms = (0, import_react.useMemo)(() => resolveFloor(floorId, allRooms, schema), [
		floorId,
		allRooms,
		schema
	]);
	const marks = (0, import_react.useMemo)(() => fixtures.filter((f) => f.floorId === floorId), [fixtures, floorId]);
	const vb = floor?.viewBox ?? [
		0,
		0,
		1600,
		1e3
	];
	const wrapRef = (0, import_react.useRef)(null);
	const camRef = (0, import_react.useRef)({
		x: 0,
		y: 0,
		k: 1
	});
	const [cam, setCam] = (0, import_react.useState)({
		x: 0,
		y: 0,
		k: 1
	});
	const roomsRef = (0, import_react.useRef)(rooms);
	roomsRef.current = rooms;
	const marksRef = (0, import_react.useRef)(marks);
	marksRef.current = marks;
	const pointers = (0, import_react.useRef)(/* @__PURE__ */ new Map());
	const drag = (0, import_react.useRef)(null);
	const [draft, setDraft] = (0, import_react.useState)(null);
	const draftRef = (0, import_react.useRef)(draft);
	draftRef.current = draft;
	const [polyDraft, setPolyDraft] = (0, import_react.useState)([]);
	const polyDraftRef = (0, import_react.useRef)(polyDraft);
	polyDraftRef.current = polyDraft;
	const [hover, setHover] = (0, import_react.useState)(null);
	const [livePoly, setLivePoly] = (0, import_react.useState)(null);
	const [liveMark, setLiveMark] = (0, import_react.useState)(null);
	const [placeDraft, setPlaceDraft] = (0, import_react.useState)(null);
	const ignoreUntil = (0, import_react.useRef)(Date.now() + 700);
	const [menu, setMenu] = (0, import_react.useState)(null);
	const [zoneColor, setZoneColor] = (0, import_react.useState)(() => zoneHex(useAtlas.getState().zoneFill));
	const hold = (0, import_react.useRef)(0);
	const holdOpened = (0, import_react.useRef)(false);
	function clearHold() {
		if (hold.current) {
			window.clearTimeout(hold.current);
			hold.current = 0;
		}
	}
	function openMenuAt(clientX, clientY, roomId, markId) {
		const mark = markId ? marksRef.current.find((f) => f.id === markId) : void 0;
		const room = roomId ? roomsRef.current.find((r) => r.id === roomId) : void 0;
		const useMark = mark && (mark.kind !== "zone" || !room);
		if (!useMark && !room) return;
		holdOpened.current = true;
		if (useMark && mark) selectMark(mark.id);
		else if (room) select(room.id);
		setMenu({
			...clampMenu(clientX, clientY),
			target: useMark && mark ? {
				kind: "mark",
				mark
			} : {
				kind: "room",
				room
			}
		});
	}
	function applyCam(next) {
		camRef.current = next;
		setCam(next);
	}
	(0, import_react.useEffect)(() => {
		ignoreUntil.current = Date.now() + 700;
	}, []);
	(0, import_react.useEffect)(() => {
		applyCam({
			x: 0,
			y: 0,
			k: 1
		});
		ignoreUntil.current = Date.now() + 280;
		setPolyDraft([]);
		setDraft(null);
		setPlaceDraft(null);
		setLivePoly(null);
	}, [floorId]);
	(0, import_react.useEffect)(() => {
		setPolyDraft([]);
		setDraft(null);
		setPlaceDraft(null);
	}, [tool, drawShape]);
	function clientToWorld(cx, cy) {
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
	function zoomAround(factor, clientX, clientY) {
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
		applyCam({
			x: c.x + wx * (c.k - nk),
			y: c.y + wy * (c.k - nk),
			k: nk
		});
	}
	function fitView() {
		applyCam({
			x: 0,
			y: 0,
			k: 1
		});
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
	function closeLine(extra) {
		const pts = extra ? [...polyDraftRef.current, extra] : polyDraftRef.current;
		const poly = lineReady(pts);
		if (!poly) return false;
		addRoom(poly);
		setPolyDraft([]);
		setHover(null);
		return true;
	}
	function closeZone(extra) {
		const pts = extra ? [...polyDraftRef.current, extra] : polyDraftRef.current;
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
			color: zoneColor
		});
		setPolyDraft([]);
		setHover(null);
		return true;
	}
	(0, import_react.useEffect)(() => {
		const el = wrapRef.current;
		if (!el) return;
		const onWheelNative = (e) => {
			if (!(e.ctrlKey || e.metaKey)) return;
			e.preventDefault();
			zoomAround(e.deltaY > 0 ? .9 : 1.12, e.clientX, e.clientY);
		};
		el.addEventListener("wheel", onWheelNative, { passive: false });
		return () => el.removeEventListener("wheel", onWheelNative);
	}, [vb]);
	(0, import_react.useEffect)(() => {
		const onKey = (e) => {
			const tag = e.target?.tagName;
			if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
			if (e.key === "+" || e.key === "=") {
				e.preventDefault();
				zoomAround(1.18);
			} else if (e.key === "-" || e.key === "_") {
				e.preventDefault();
				zoomAround(.85);
			} else if (e.key === "0") fitView();
			else if (e.key === "Enter" && tool === "draw" && drawShape === "polygon") {
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
	}, [
		vb,
		tool,
		drawShape,
		selectedMarkId,
		selectedId,
		deleteFixture,
		deleteRoom
	]);
	function releasePtr(target, pointerId) {
		try {
			target?.releasePointerCapture?.(pointerId);
		} catch {}
	}
	function hitRoom(clientX, clientY) {
		const [wx, wy] = clientToWorld(clientX, clientY);
		const list = roomsRef.current;
		for (let i = list.length - 1; i >= 0; i--) {
			const room = list[i];
			const poly = livePoly && room.id === selectedId ? livePoly : room.poly;
			if (pointInPoly(poly, wx, wy)) return room;
		}
	}
	function hitMark(wx, wy) {
		const list = marksRef.current;
		for (let i = list.length - 1; i >= 0; i--) {
			const f = list[i];
			if (f.kind === "zone") continue;
			if (f.kind === "stair") {
				const shown = liveMark && liveMark.id === f.id ? liveMark : f;
				if (shown.style === "spiral") {
					if (Math.hypot(wx - shown.x, wy - shown.y) <= shown.length / 2 + 10) return f;
				} else if (pointInRotatedRect(shown, wx, wy, 10)) return f;
			} else {
				const rad = f.rotation * Math.PI / 180;
				const dx = Math.cos(rad) * (f.length / 2);
				const dy = Math.sin(rad) * (f.length / 2);
				if (distToSegment(wx, wy, f.x - dx, f.y - dy, f.x + dx, f.y + dy) < 16) return f;
			}
		}
		for (let i = list.length - 1; i >= 0; i--) {
			const f = list[i];
			if (f.kind !== "zone" || !f.poly) continue;
			if (pointInPoly(f.poly, wx, wy)) return f;
		}
	}
	function hitHandleAt(wx, wy, poly, hs) {
		const pts = handlePoints(bounds(poly));
		for (const id of HANDLES) {
			const [x, y] = pts[id];
			if (Math.abs(wx - x) <= hs && Math.abs(wy - y) <= hs) return id;
		}
	}
	function onPointerDown(e) {
		if (Date.now() < ignoreUntil.current && tool === "select") return;
		if (e.pointerType === "mouse" && e.button !== 0) return;
		holdOpened.current = false;
		clearHold();
		pointers.current.set(e.pointerId, {
			x: e.clientX,
			y: e.clientY
		});
		try {
			e.currentTarget.setPointerCapture(e.pointerId);
		} catch {}
		if (pointers.current.size >= 2) {
			const pts = [...pointers.current.values()];
			drag.current = {
				kind: "pinch",
				dist: dist(pts[0], pts[1]),
				k: camRef.current.k,
				lx: (pts[0].x + pts[1].x) / 2,
				ly: (pts[0].y + pts[1].y) / 2
			};
			return;
		}
		const [wx, wy] = clientToWorld(e.clientX, e.clientY);
		const hs = handleSizePx(chrome.handleSize) / Math.max(.12, screenScale());
		if (tool === "select" && e.pointerType !== "mouse") hold.current = window.setTimeout(() => {
			const mark = hitMark(wx, wy);
			const room = hitRoom(e.clientX, e.clientY);
			openMenuAt(e.clientX, e.clientY, room?.id, mark?.id);
		}, 480);
		if (tool === "draw" && (drawShape === "rect" || drawShape === "ellipse")) {
			drag.current = {
				kind: "draw",
				lx: e.clientX,
				ly: e.clientY,
				wx,
				wy,
				moved: false
			};
			setDraft({
				x: wx,
				y: wy,
				w: 0,
				h: 0
			});
			return;
		}
		if (tool === "draw" && drawShape === "polygon") {
			drag.current = {
				kind: "maybe",
				lx: e.clientX,
				ly: e.clientY,
				wx,
				wy,
				moved: false
			};
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
				moved: false
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
				moved: false
			};
			setPolyDraft([[wx, wy]]);
			return;
		}
		if (tool === "token") {
			drag.current = {
				kind: "maybe",
				lx: e.clientX,
				ly: e.clientY,
				wx,
				wy,
				moved: false
			};
			return;
		}
		if (tool === "door" || tool === "window" || tool === "stair") {
			drag.current = {
				kind: "place",
				lx: e.clientX,
				ly: e.clientY,
				wx,
				wy,
				moved: false
			};
			setPlaceDraft({
				id: "draft",
				floorId,
				kind: tool,
				x: wx,
				y: wy,
				rotation: 0,
				length: 72,
				width: tool === "stair" ? 52 : void 0,
				style: tool === "stair" ? stairStyle : void 0
			});
			return;
		}
		const selected = roomsRef.current.find((r) => r.id === selectedId);
		if (tool === "select") {
			const markSel = marksRef.current.find((f) => f.id === selectedMarkId);
			if (markSel && markSel.kind !== "zone") {
				const ends = markEnds(markSel);
				const grips = [{
					end: "a",
					p: ends.a
				}, {
					end: "b",
					p: ends.b
				}];
				if (markSel.kind === "stair") {
					const sides = markSides(markSel);
					grips.push({
						end: "w",
						p: sides.n
					}, {
						end: "w",
						p: sides.s
					});
				}
				let best = null;
				let bestD = Infinity;
				for (const g of grips) {
					const d = Math.hypot(wx - g.p[0], wy - g.p[1]);
					if (d < bestD) {
						bestD = d;
						best = g;
					}
				}
				const toCenter = Math.hypot(wx - markSel.x, wy - markSel.y);
				if (Boolean(best && bestD <= hs && bestD <= toCenter) && best) {
					drag.current = {
						kind: "resize-mark",
						markId: markSel.id,
						end: best.end,
						fixed: best.end === "a" ? ends.b : best.end === "b" ? ends.a : void 0,
						lx: e.clientX,
						ly: e.clientY,
						wx,
						wy,
						moved: false
					};
					return;
				}
				if (markSel.kind === "stair" && markSel.style === "spiral" ? Math.hypot(wx - markSel.x, wy - markSel.y) <= markSel.length / 2 + 10 : pointInRotatedRect(markSel, wx, wy, 10)) {
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
						moved: false
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
					moved: false
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
				moved: false
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
				moved: false
			};
			return;
		}
		drag.current = {
			kind: "maybe",
			roomId: hit?.id,
			lx: e.clientX,
			ly: e.clientY,
			moved: false
		};
	}
	function onPointerMove(e) {
		if (pointers.current.has(e.pointerId)) pointers.current.set(e.pointerId, {
			x: e.clientX,
			y: e.clientY
		});
		const [wx, wy] = clientToWorld(e.clientX, e.clientY);
		if (tool === "draw" && drawShape === "polygon" && polyDraft.length) setHover([wx, wy]);
		if (tool === "draw" && drawShape === "line") {
			const pts = polyDraftRef.current;
			setHover(pts.length ? snapZonePoint(pts, [wx, wy]) : [wx, wy]);
		}
		if (tool === "zone" && polyDraft.length) setHover([wx, wy]);
		const d = drag.current;
		if (!d) return;
		if (Math.hypot(e.clientX - d.lx, e.clientY - d.ly) > 12) clearHold();
		if (d.kind === "draw") {
			const x0 = d.wx ?? wx;
			const y0 = d.wy ?? wy;
			setDraft({
				x: Math.min(x0, wx),
				y: Math.min(y0, wy),
				w: Math.abs(wx - x0),
				h: Math.abs(wy - y0)
			});
			d.moved = true;
			return;
		}
		if (d.kind === "place") {
			const x0 = d.wx ?? wx;
			const y0 = d.wy ?? wy;
			const length = Math.max(24, Math.hypot(wx - x0, wy - y0));
			const rotation = Math.atan2(wy - y0, wx - x0) * 180 / Math.PI;
			setPlaceDraft({
				id: "draft",
				floorId,
				kind: tool === "door" || tool === "window" || tool === "stair" ? tool : "door",
				x: (x0 + wx) / 2,
				y: (y0 + wy) / 2,
				rotation,
				length,
				width: tool === "stair" ? 52 : void 0,
				style: tool === "stair" ? stairStyle : void 0
			});
			d.moved = length > 8;
			return;
		}
		if (d.kind === "lasso") {
			const pts = polyDraftRef.current;
			const last = pts[pts.length - 1];
			if (!last || Math.hypot(wx - last[0], wy - last[1]) >= 6) setPolyDraft([...pts, [wx, wy]]);
			d.moved = true;
			return;
		}
		if (d.kind === "line") {
			const pts = polyDraftRef.current;
			const p = snapZonePoint(pts, [wx, wy]);
			setHover(p);
			if (Math.hypot(e.clientX - d.lx, e.clientY - d.ly) > 8) d.moved = true;
			if (d.moved) {
				const last = pts[pts.length - 1];
				if (pts.length >= 3 && canCloseZone(pts, p)) {
					setHover(pts[0]);
					return;
				}
				if (!last || Math.hypot(p[0] - last[0], p[1] - last[1]) >= 14) setPolyDraft([...pts, p]);
			}
			return;
		}
		if (d.kind === "move-mark" && d.markId) {
			const orig = marksRef.current.find((f) => f.id === d.markId);
			if (orig) {
				const dxw = wx - (d.wx ?? wx);
				const dyw = wy - (d.wy ?? wy);
				setLiveMark({
					...orig,
					x: (d.origX ?? orig.x) + dxw,
					y: (d.origY ?? orig.y) + dyw
				});
			}
			d.moved = true;
			return;
		}
		if (d.kind === "resize-mark" && d.markId) {
			const orig = marksRef.current.find((f) => f.id === d.markId);
			if (orig) {
				if (d.end === "w") setLiveMark({
					...orig,
					width: widthFromPoint(orig, wx, wy)
				});
				else if (d.fixed) {
					const next = markFromEnds(d.end === "a" ? [wx, wy] : d.fixed, d.end === "a" ? d.fixed : [wx, wy]);
					setLiveMark({
						...orig,
						...next
					});
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
			const now = dist(pts[0], pts[1]);
			const midX = (pts[0].x + pts[1].x) / 2;
			const midY = (pts[0].y + pts[1].y) / 2;
			zoomAround(now / Math.max(24, d.dist || now), midX, midY);
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
			} else if (d.id && marksRef.current.find((f) => f.id === d.id && f.kind !== "zone")) {
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
			applyCam({
				...c,
				x: c.x + dx,
				y: c.y + dy
			});
		} else if (d.kind === "move-room" && d.origPoly) {
			const worldDx = dx / camRef.current.k;
			const worldDy = dy / camRef.current.k;
			d.origPoly = translatePoly(d.origPoly, worldDx, worldDy);
			setLivePoly(d.origPoly);
		} else if (d.kind === "move-mark" && d.markId) {
			const orig = marksRef.current.find((f) => f.id === d.markId);
			if (orig) setLiveMark({
				...orig,
				x: (d.origX ?? orig.x) + (wx - (d.wx ?? wx)),
				y: (d.origY ?? orig.y) + (wy - (d.wy ?? wy))
			});
		} else if (d.kind === "token" && d.id) {
			const hit = hitRoom(e.clientX, e.clientY);
			moveToken(d.id, {
				floorId: hit?.floorId ?? floorId,
				roomId: hit?.id ?? "",
				x: wx,
				y: wy
			});
		}
	}
	function onPointerUp(e) {
		releasePtr(e.currentTarget, e.pointerId);
		pointers.current.delete(e.pointerId);
		const d = drag.current;
		const [wx, wy] = clientToWorld(e.clientX, e.clientY);
		if (pointers.current.size === 0) {
			if (d?.kind === "draw") {
				const box = draftRef.current;
				drag.current = null;
				setDraft(null);
				if (box && box.w >= 48 && box.h >= 48) addRoom(polyFromBox(drawShape === "ellipse" ? "ellipse" : "rect", box.x, box.y, box.w, box.h));
				return;
			}
			if (d?.kind === "place" && placeDraft) {
				const mark = placeDraft;
				setPlaceDraft(null);
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
					toFloor: mark.kind === "stair" ? floors.find((f) => f.id !== floorId)?.id : void 0
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
						color: zoneColor
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
					if (!last || Math.hypot(p[0] - last[0], p[1] - last[1]) >= 8) setPolyDraft([...pts, p]);
				}
				setHover(p);
				return;
			}
			if (d?.kind === "move-mark" && d.markId && liveMark) {
				patchFixture(d.markId, {
					x: liveMark.x,
					y: liveMark.y
				});
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
					width: liveMark.width
				});
				setLiveMark(null);
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
						const first = pts[0];
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
							y: wy
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
			const leftover = [...pointers.current.values()][0];
			drag.current = {
				kind: "pan",
				lx: leftover.x,
				ly: leftover.y,
				moved: true
			};
		}
	}
	function onPointerCancel(e) {
		releasePtr(e.currentTarget, e.pointerId);
		pointers.current.delete(e.pointerId);
		clearHold();
		if (pointers.current.size === 0) {
			drag.current = null;
			setDraft(null);
			setPlaceDraft(null);
			setLivePoly(null);
			setLiveMark(null);
			setPolyDraft([]);
		}
	}
	const doors = (0, import_react.useMemo)(() => {
		const list = [];
		const seen = /* @__PURE__ */ new Set();
		for (const room of rooms) for (const cid of room.connections) {
			const other = rooms.find((r) => r.id === cid);
			if (!other) continue;
			const key = [room.id, other.id].sort().join("|");
			if (seen.has(key)) continue;
			seen.add(key);
			const mark = doorMark(room.poly, other.poly);
			if (mark) list.push({
				key,
				...mark
			});
		}
		return list;
	}, [rooms]);
	const tokensHere = characters.map((c, i) => {
		const pos = tokens[c.id];
		if (!pos || pos.floorId !== floorId) return null;
		if (Number.isFinite(pos.x) && Number.isFinite(pos.y)) return {
			char: c,
			x: pos.x,
			y: pos.y,
			roomId: pos.roomId,
			i
		};
		const room = rooms.find((r) => r.id === pos.roomId);
		if (!room) return null;
		const [x, y] = centroid(room.poly);
		return {
			char: c,
			x,
			y,
			roomId: room.id,
			i
		};
	}).filter((t) => t !== null);
	const zoomPct = Math.round(cam.k * 100);
	const hs = handleSizePx(chrome.handleSize) / Math.max(.12, screenScale());
	const selectedRoom = rooms.find((r) => r.id === selectedId);
	const selectedPoly = selectedRoom ? livePoly ?? selectedRoom.poly : void 0;
	const selectedBox = selectedPoly ? bounds(selectedPoly) : null;
	const selectedMark = marks.find((m) => m.id === selectedMarkId);
	const shownMark = liveMark && liveMark.id === selectedMarkId ? liveMark : selectedMark;
	const zones = (0, import_react.useMemo)(() => marks.filter((f) => f.kind === "zone" && f.poly && f.poly.length >= 3), [marks]);
	const glyphs = (0, import_react.useMemo)(() => marks.filter((f) => f.kind !== "zone"), [marks]);
	const hoverSnap = hover;
	const zoneCanCommit = Boolean(lassoReady(polyDraft));
	const lineCanCommit = Boolean(lineReady(hoverSnap ? [...polyDraft, hoverSnap] : polyDraft));
	const labels = (0, import_react.useMemo)(() => {
		const placed = [];
		const sorted = [...rooms].sort((a, b) => {
			const ia = selectedId === a.id ? 1 : 0;
			const ib = selectedId === b.id ? 1 : 0;
			if (ia !== ib) return ib - ia;
			return area(b.poly) - area(a.poly);
		});
		for (const room of sorted) {
			if (!roomMatches(room, schema, filters, query)) continue;
			const important = selectedId === room.id;
			const a = area(room.poly);
			if (!important && a < 28e3) continue;
			const poly = room.id === selectedId && livePoly ? livePoly : room.poly;
			const [cx, cy] = centroid(poly);
			const fs = important ? 18 : a > 6e4 ? 16 : 14;
			const { w, h } = labelSize(room.label, fs);
			const box = {
				id: room.id,
				x: cx - w / 2,
				y: cy - h / 2,
				w,
				h,
				text: room.label,
				fs,
				important
			};
			if (important) {
				for (let i = placed.length - 1; i >= 0; i--) if (!placed[i].important && boxesOverlap(box, placed[i], 10)) placed.splice(i, 1);
			} else if (placed.some((p) => boxesOverlap(box, p, 10))) continue;
			placed.push(box);
		}
		return placed;
	}, [
		rooms,
		selectedId,
		query,
		filters,
		schema,
		livePoly
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		ref: wrapRef,
		className: "relative h-full w-full touch-none overflow-hidden bg-paper",
		style: { cursor: tool !== "select" ? "crosshair" : "pointer" },
		onPointerDown,
		onPointerMove,
		onPointerUp,
		onPointerCancel,
		onLostPointerCapture: onPointerCancel,
		onContextMenu: (e) => {
			e.preventDefault();
			if (tool !== "select") return;
			const [wx, wy] = clientToWorld(e.clientX, e.clientY);
			const mark = hitMark(wx, wy);
			const room = hitRoom(e.clientX, e.clientY);
			openMenuAt(e.clientX, e.clientY, room?.id, mark?.id);
		},
		onDoubleClick: () => {
			if (tool === "draw" && drawShape === "polygon") closePolygon();
			if (tool === "draw" && drawShape === "line") closeLine();
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
				viewBox: `${vb[0]} ${vb[1]} ${vb[2]} ${vb[3]}`,
				className: "h-full w-full select-none",
				role: "img",
				"aria-label": `Plan — ${floor?.name ?? "étage"}`,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("defs", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("pattern", {
						id: "plan-grid",
						width: "40",
						height: "40",
						patternUnits: "userSpaceOnUse",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
							d: "M 40 0 L 0 0 0 40",
							fill: "none",
							stroke: "var(--color-ink)",
							strokeOpacity: "0.05",
							strokeWidth: "1"
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pattern", {
						id: "hatch-interdit",
						width: "12",
						height: "12",
						patternUnits: "userSpaceOnUse",
						patternTransform: "rotate(38)",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
							x1: "0",
							y1: "0",
							x2: "0",
							y2: "12",
							stroke: "var(--color-clay)",
							strokeOpacity: "0.4",
							strokeWidth: "2"
						})
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
						x: vb[0],
						y: vb[1],
						width: vb[2],
						height: vb[3],
						fill: chrome.showGrid ? "url(#plan-grid)" : "var(--color-paper)"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
						transform: `translate(${cam.x} ${cam.y}) scale(${cam.k})`,
						children: [
							zones.map((z) => {
								const active = z.id === selectedMarkId;
								const fill = zonePaint(z);
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
									className: "pointer-events-none",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
										d: polyToPath(z.poly),
										fill: `color-mix(in oklab, ${fill} 32%, var(--color-paper))`,
										stroke: fill,
										strokeOpacity: active ? .95 : .7,
										strokeWidth: active ? 5 : 3,
										strokeLinejoin: "round"
									}), z.label ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
										x: z.x,
										y: z.y,
										textAnchor: "middle",
										dominantBaseline: "middle",
										fill: "var(--color-ink)",
										fontSize: "14",
										fontFamily: "var(--font-display)",
										fontWeight: 500,
										children: z.label
									}) : null]
								}, z.id);
							}),
							rooms.map((room) => {
								const match = roomMatches(room, schema, filters, query);
								const active = selectedId === room.id;
								const tone = tintOf(room.props ?? {}, schema);
								const dash = tone === "clay" ? "10 7" : tone === "ink" ? "3 6" : void 0;
								const poly = active && livePoly ? livePoly : room.poly;
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
										d: polyToPath(poly),
										fill: fillFor(tone, active, !match),
										stroke: "var(--color-ink)",
										strokeOpacity: match ? active ? .92 : .62 : .16,
										strokeWidth: active ? 5 : 3.2,
										strokeLinejoin: "miter",
										strokeDasharray: dash,
										className: cn(!match && "pointer-events-none")
									}),
									tone === "clay" && match ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
										d: polyToPath(poly),
										fill: "url(#hatch-interdit)",
										className: "pointer-events-none"
									}) : null,
									room.travel?.length && match ? stairLines(poly).map((line, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
										x1: line[0][0],
										y1: line[0][1],
										x2: line[1][0],
										y2: line[1][1],
										stroke: "var(--color-ink)",
										strokeOpacity: "0.28",
										strokeWidth: "2",
										className: "pointer-events-none"
									}, i)) : null,
									sceneRoomId === room.id ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
										cx: centroid(poly)[0],
										cy: centroid(poly)[1] - 28,
										r: "6",
										fill: "var(--color-clay)",
										className: "pointer-events-none"
									}) : null
								] }, room.id);
							}),
							draft && draft.w > 0 && draft.h > 0 ? drawShape === "ellipse" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ellipse", {
								cx: draft.x + draft.w / 2,
								cy: draft.y + draft.h / 2,
								rx: draft.w / 2,
								ry: draft.h / 2,
								fill: "color-mix(in oklab, var(--color-primary) 18%, transparent)",
								stroke: "var(--color-primary)",
								strokeWidth: "3",
								strokeDasharray: "8 6",
								className: "pointer-events-none"
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
								x: draft.x,
								y: draft.y,
								width: draft.w,
								height: draft.h,
								fill: "color-mix(in oklab, var(--color-primary) 18%, transparent)",
								stroke: "var(--color-primary)",
								strokeWidth: "3",
								strokeDasharray: "8 6",
								className: "pointer-events-none"
							}) : null,
							polyDraft.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("g", {
								className: "pointer-events-none",
								children: tool === "zone" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
									d: polyToPath(hoverSnap ? [...polyDraft, hoverSnap] : polyDraft),
									fill: zoneCanCommit ? `color-mix(in oklab, ${zonePaint({
										fill: zoneFill,
										color: zoneColor
									})} 28%, transparent)` : "none",
									stroke: zonePaint({
										fill: zoneFill,
										color: zoneColor
									}),
									strokeWidth: "3",
									strokeLinejoin: "round",
									strokeLinecap: "round"
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [tool === "draw" && drawShape === "line" && lineCanCommit && hoverSnap ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
									d: polyToPath([...polyDraft, hoverSnap]),
									fill: "color-mix(in oklab, var(--color-primary) 18%, transparent)",
									stroke: "var(--color-primary)",
									strokeWidth: "3"
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("polyline", {
									points: [...polyDraft, ...hoverSnap ? [hoverSnap] : []].map((p) => p.join(",")).join(" "),
									fill: "none",
									stroke: "var(--color-primary)",
									strokeWidth: "3",
									strokeDasharray: "8 6"
								}), polyDraft.map((p, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
									cx: p[0],
									cy: p[1],
									r: i === 0 && drawShape === "line" && canCloseZone(polyDraft, hoverSnap ?? [0, 0]) ? 11 : 7,
									fill: i === 0 ? "var(--color-primary)" : "var(--color-paper)",
									stroke: "var(--color-primary)",
									strokeWidth: "2"
								}, i))] })
							}) : null,
							selectedBox && selectedPoly ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
								x: selectedBox.minX,
								y: selectedBox.minY,
								width: selectedBox.maxX - selectedBox.minX,
								height: selectedBox.maxY - selectedBox.minY,
								fill: "none",
								stroke: "var(--color-primary)",
								strokeOpacity: "0.45",
								strokeWidth: "1.5",
								strokeDasharray: "5 4",
								className: "pointer-events-none"
							}), HANDLES.map((id) => {
								const [x, y] = handlePoints(selectedBox)[id];
								return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
									x: x - hs,
									y: y - hs,
									width: hs * 2,
									height: hs * 2,
									fill: "var(--color-paper)",
									stroke: "var(--color-primary)",
									strokeWidth: "2",
									style: { cursor: handleCursor(id) }
								}, id);
							})] }) : null,
							doors.map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
								className: "pointer-events-none",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
									x1: d.x - d.tx * 14,
									y1: d.y - d.ty * 14,
									x2: d.x + d.tx * 14,
									y2: d.y + d.ty * 14,
									stroke: "var(--color-paper)",
									strokeWidth: "10",
									strokeLinecap: "butt"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
									x1: d.x - d.tx * 12,
									y1: d.y - d.ty * 12,
									x2: d.x + d.tx * 12,
									y2: d.y + d.ty * 12,
									stroke: "var(--color-ink)",
									strokeOpacity: "0.35",
									strokeWidth: "1.5"
								})]
							}, d.key)),
							glyphs.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FixtureGlyph, {
								fixture: liveMark && liveMark.id === f.id ? liveMark : f,
								active: f.id === selectedMarkId
							}, f.id)),
							shownMark && shownMark.kind !== "zone" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", { children: [["a", "b"].map((end) => {
								const pt = markEnds(shownMark)[end];
								return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
									x: pt[0] - hs,
									y: pt[1] - hs,
									width: hs * 2,
									height: hs * 2,
									fill: "var(--color-paper)",
									stroke: "var(--color-primary)",
									strokeWidth: "2",
									style: { cursor: "ew-resize" }
								}, end);
							}), shownMark.kind === "stair" ? ["n", "s"].map((side) => {
								const pt = markSides(shownMark)[side];
								return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
									x: pt[0] - hs,
									y: pt[1] - hs,
									width: hs * 2,
									height: hs * 2,
									fill: "var(--color-paper)",
									stroke: "var(--color-primary)",
									strokeWidth: "2",
									style: { cursor: "ns-resize" }
								}, side);
							}) : null] }) : null,
							placeDraft ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FixtureGlyph, {
								fixture: placeDraft,
								active: true
							}) : null,
							labels.map((lab) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
								className: "pointer-events-none",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
									x: lab.x,
									y: lab.y,
									width: lab.w,
									height: lab.h,
									rx: "5",
									fill: "var(--color-paper)",
									fillOpacity: lab.important ? .92 : .72
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
									x: lab.x + lab.w / 2,
									y: lab.y + lab.h / 2 + 1,
									textAnchor: "middle",
									dominantBaseline: "middle",
									fill: "var(--color-ink)",
									fontSize: lab.fs,
									fontFamily: "var(--font-display)",
									fontWeight: 500,
									children: lab.text
								})]
							}, lab.id)),
							chrome.showTokens ? tokensHere.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
								transform: `translate(${t.x} ${t.y})`,
								className: "cursor-grab",
								onPointerDown: (ev) => {
									ev.stopPropagation();
									if (Date.now() < ignoreUntil.current) return;
									pointers.current.set(ev.pointerId, {
										x: ev.clientX,
										y: ev.clientY
									});
									try {
										wrapRef.current?.setPointerCapture(ev.pointerId);
									} catch {}
									drag.current = {
										kind: "token",
										id: t.char.id,
										lx: ev.clientX,
										ly: ev.clientY,
										moved: false
									};
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
									r: TOKEN_R,
									fill: TOKEN_COLORS[t.i % TOKEN_COLORS.length],
									stroke: "var(--color-ink)",
									strokeWidth: "2"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
									textAnchor: "middle",
									dominantBaseline: "middle",
									fill: "var(--color-paper)",
									fontSize: "13",
									fontFamily: "var(--font-sans)",
									fontWeight: 600,
									className: "pointer-events-none",
									children: t.char.short
								})]
							}, t.char.id)) : null
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "absolute right-3 top-3 z-10 flex flex-col gap-1",
				onPointerDown: (e) => e.stopPropagation(),
				onPointerMove: (e) => e.stopPropagation(),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "outline",
						size: "icon",
						className: "bg-card",
						"aria-label": "Zoom avant",
						...pressProps(() => zoomAround(1.25)),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "outline",
						size: "icon",
						className: "bg-card",
						"aria-label": "Zoom arrière",
						...pressProps(() => zoomAround(.8)),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Minus, { className: "size-4" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "outline",
						size: "icon",
						className: "bg-card",
						"aria-label": "Recadrer le plan",
						...pressProps(fitView),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scan, { className: "size-4" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "pt-1 text-center text-xs font-medium tabular-nums text-muted-foreground",
						children: [zoomPct, "%"]
					})
				]
			}),
			tool === "draw" && drawShape === "polygon" && polyDraft.length >= 3 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute bottom-3 right-3 z-10",
				onPointerDown: (e) => e.stopPropagation(),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					size: "sm",
					...pressProps(closePolygon),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-4" }), "Fermer"]
				})
			}) : null,
			tool === "draw" && drawShape === "line" && polyDraft.length >= 3 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute bottom-3 right-3 z-10",
				onPointerDown: (e) => e.stopPropagation(),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					size: "sm",
					disabled: !lineCanCommit,
					title: lineCanCommit ? "Fermer la pièce" : "Posez encore quelques sommets, ou rejoignez le départ",
					...pressProps(() => {
						if (hoverSnap) closeLine(hoverSnap);
						else closeLine();
					}),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-4" }), "Fermer"]
				})
			}) : null,
			tool === "zone" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "absolute bottom-3 left-3 z-10 flex max-w-[min(100%,24rem)] flex-wrap items-end gap-2 rounded-lg border border-border bg-card/95 p-2",
				onPointerDown: (e) => e.stopPropagation(),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ColorWheel, {
					value: zoneColor,
					label: "",
					id: "zone-draw-color",
					onChange: setZoneColor
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FillSwatches, {
					value: zoneFill,
					onChange: (fill) => {
						setZoneFill(fill);
						setZoneColor(zoneHex(fill));
					}
				})]
			}) : null,
			selectedMark && tool !== "zone" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "absolute bottom-3 left-3 z-10 flex flex-wrap items-center gap-1.5",
				onPointerDown: (e) => e.stopPropagation(),
				children: [
					selectedMark.kind === "stair" ? floors.filter((f) => f.id !== floorId).map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						size: "sm",
						variant: selectedMark.toFloor === f.id ? "default" : "outline",
						className: "bg-card",
						...pressProps(() => patchFixture(selectedMark.id, { toFloor: f.id })),
						children: ["Vers ", f.short]
					}, f.id)) : null,
					selectedMark.kind === "zone" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FillSwatches, {
						value: selectedMark.fill ?? "sage",
						onChange: (fill) => patchFixture(selectedMark.id, {
							fill,
							color: zoneHex(fill)
						})
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						variant: "outline",
						className: "bg-card",
						"aria-label": "Supprimer l’élément",
						...pressProps(() => deleteFixture(selectedMark.id)),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-4" })
					})
				]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "pointer-events-none absolute bottom-3 left-3 flex items-center gap-2 text-xs text-muted-foreground",
				children: chrome.showCompass && !selectedMark && tool !== "zone" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
					width: "18",
					height: "28",
					viewBox: "0 0 18 28",
					"aria-hidden": true,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("polygon", {
						points: "9,2 13,12 9,10 5,12",
						fill: "var(--color-ink)"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
						x1: "9",
						y1: "10",
						x2: "9",
						y2: "24",
						stroke: "var(--color-ink)",
						strokeWidth: "1.4"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "N" })] }) : null
			}),
			rooms.length === 0 && zones.length === 0 && tool === "select" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "pointer-events-none absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-muted-foreground",
				children: emptyPlan
			}) : null,
			menu ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlanMenu, {
				target: menu.target,
				x: menu.x,
				y: menu.y,
				onClose: () => {
					holdOpened.current = false;
					setMenu(null);
				}
			}) : null
		]
	});
});
function FixtureGlyph({ fixture, active }) {
	const stroke = active ? "var(--color-primary)" : "var(--color-ink)";
	const L = fixture.length;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
		transform: `translate(${fixture.x} ${fixture.y}) rotate(${fixture.rotation})`,
		className: "pointer-events-none",
		children: [
			fixture.kind === "door" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
					x1: -L / 2,
					y1: 0,
					x2: L / 2,
					y2: 0,
					stroke: "var(--color-paper)",
					strokeWidth: "10"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
					d: `M ${L / 2} 0 A ${L} ${L} 0 0 1 ${-L / 2} ${L}`,
					fill: "color-mix(in oklab, var(--color-primary) 12%, transparent)",
					stroke,
					strokeWidth: "2"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
					x1: -L / 2,
					y1: 0,
					x2: -L / 2,
					y2: L * .92,
					stroke,
					strokeWidth: "3",
					strokeLinecap: "round"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
					cx: -L / 2,
					cy: 0,
					r: "4",
					fill: stroke
				})
			] }) : null,
			fixture.kind === "window" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
					x1: -L / 2,
					y1: 0,
					x2: L / 2,
					y2: 0,
					stroke: "var(--color-paper)",
					strokeWidth: "12"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
					x1: -L / 2,
					y1: -7,
					x2: L / 2,
					y2: -7,
					stroke,
					strokeWidth: "2"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
					x1: -L / 2,
					y1: 7,
					x2: L / 2,
					y2: 7,
					stroke,
					strokeWidth: "2"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
					x1: 0,
					y1: -7,
					x2: 0,
					y2: 7,
					stroke,
					strokeWidth: "2"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
					x1: -L / 2,
					y1: -11,
					x2: -L / 2,
					y2: 11,
					stroke,
					strokeWidth: "2.5"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
					x1: L / 2,
					y1: -11,
					x2: L / 2,
					y2: 11,
					stroke,
					strokeWidth: "2.5"
				})
			] }) : null,
			fixture.kind === "stair" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StairGlyph, {
				fixture,
				stroke
			}) : null,
			active ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				r: "5",
				cy: -18,
				fill: "var(--color-primary)"
			}) : null
		]
	});
}
function StairGlyph({ fixture, stroke }) {
	const L = fixture.length;
	const W = fixtureWidth(fixture);
	const fill = "color-mix(in oklab, var(--color-primary) 10%, var(--color-paper))";
	const style = fixture.style ?? "straight";
	if (style === "spiral") {
		const outer = Math.max(18, L / 2);
		const inner = Math.max(6, outer - W);
		const turns = 3;
		const pts = [];
		const steps = 36;
		for (let i = 0; i <= steps; i++) {
			const t = i / steps;
			const a = t * Math.PI * 2 * turns;
			const r = inner + (outer - inner) * t;
			pts.push(`${Math.cos(a) * r},${Math.sin(a) * r}`);
		}
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				r: outer,
				fill,
				stroke,
				strokeWidth: "2.5"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				r: inner,
				fill: "var(--color-paper)",
				stroke,
				strokeWidth: "1.6"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("polyline", {
				points: pts.join(" "),
				fill: "none",
				stroke,
				strokeWidth: "1.8",
				strokeLinecap: "round"
			}),
			Array.from({ length: 8 }, (_, i) => {
				const a = Math.PI * 2 * i / 8;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
					x1: Math.cos(a) * inner,
					y1: Math.sin(a) * inner,
					x2: Math.cos(a) * outer,
					y2: Math.sin(a) * outer,
					stroke,
					strokeWidth: "1.4",
					strokeOpacity: "0.7"
				}, i);
			})
		] });
	}
	if (style === "quarter") {
		const T = Math.max(18, Math.min(W, L) * .42);
		const treads = 4;
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
				x: -L / 2,
				y: -W / 2,
				width: L,
				height: T,
				fill,
				stroke,
				strokeWidth: "2.5"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
				x: L / 2 - T,
				y: -W / 2,
				width: T,
				height: W,
				fill,
				stroke,
				strokeWidth: "2.5"
			}),
			Array.from({ length: treads }, (_, i) => {
				const x = -L / 2 + (i + 1) * (L - T) / 5;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
					x1: x,
					y1: -W / 2 + 3,
					x2: x,
					y2: -W / 2 + T - 3,
					stroke,
					strokeWidth: "1.5",
					strokeOpacity: "0.7"
				}, `h${i}`);
			}),
			Array.from({ length: treads }, (_, i) => {
				const y = -W / 2 + T + (i + 1) * (W - T) / 5;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
					x1: L / 2 - T + 3,
					y1: y,
					x2: L / 2 - 3,
					y2: y,
					stroke,
					strokeWidth: "1.5",
					strokeOpacity: "0.7"
				}, `v${i}`);
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("polygon", {
				points: `${-L / 2 + 8},${-W / 2 + T / 2 - 6} ${-L / 2 + 8},${-W / 2 + T / 2 + 6} ${-L / 2 + 20},${-W / 2 + T / 2}`,
				fill: stroke
			})
		] });
	}
	if (style === "switchback") {
		const T = Math.max(16, W / 2 - 4);
		const gap = Math.max(4, W - T * 2);
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
				x: -L / 2,
				y: -W / 2,
				width: L,
				height: T,
				fill,
				stroke,
				strokeWidth: "2.5"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
				x: -L / 2,
				y: W / 2 - T,
				width: L,
				height: T,
				fill,
				stroke,
				strokeWidth: "2.5"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
				x: L / 2 - T,
				y: -W / 2,
				width: T,
				height: W,
				fill,
				stroke,
				strokeWidth: "2.5"
			}),
			Array.from({ length: 5 }, (_, i) => {
				const x = -L / 2 + (i + 1) * (L - T) / 6;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
					x1: x,
					y1: -W / 2 + 3,
					x2: x,
					y2: -W / 2 + T - 3,
					stroke,
					strokeWidth: "1.5",
					strokeOpacity: "0.7"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
					x1: x,
					y1: W / 2 - T + 3,
					x2: x,
					y2: W / 2 - 3,
					stroke,
					strokeWidth: "1.5",
					strokeOpacity: "0.7"
				})] }, i);
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("polygon", {
				points: `${-L / 2 + 8},${-W / 2 + T / 2 - 6} ${-L / 2 + 8},${-W / 2 + T / 2 + 6} ${-L / 2 + 20},${-W / 2 + T / 2}`,
				fill: stroke
			}),
			gap > 0 ? null : null
		] });
	}
	const treads = Math.max(4, Math.round(L / 18));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
			x: -L / 2,
			y: -W / 2,
			width: L,
			height: W,
			fill,
			stroke,
			strokeWidth: "2.5"
		}),
		Array.from({ length: treads }, (_, i) => {
			const x = -L / 2 + (i + 1) * L / (treads + 1);
			return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
				x1: x,
				y1: -W / 2 + 4,
				x2: x,
				y2: W / 2 - 4,
				stroke,
				strokeWidth: "1.6",
				strokeOpacity: "0.7"
			}, i);
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("polygon", {
			points: `${L / 2 - 18},0 ${L / 2 - 6},-8 ${L / 2 - 6},8`,
			fill: stroke
		})
	] });
}
function FloorTab({ floor, active }) {
	const setFloor = useAtlas((s) => s.setFloor);
	const [menu, setMenu] = (0, import_react.useState)(null);
	const hold = (0, import_react.useRef)(0);
	const opened = (0, import_react.useRef)(false);
	const start = (0, import_react.useRef)({
		x: 0,
		y: 0
	});
	function openAt(x, y) {
		opened.current = true;
		const pad = 8;
		setMenu({
			x: Math.min(Math.max(pad, x), window.innerWidth - 260 - pad),
			y: Math.min(Math.max(pad, y), window.innerHeight - 280 - pad)
		});
	}
	function clearHold() {
		if (hold.current) {
			window.clearTimeout(hold.current);
			hold.current = 0;
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		"aria-haspopup": "menu",
		"aria-expanded": Boolean(menu),
		title: `${floor.name} — clic droit pour éditer`,
		onClick: () => {
			if (opened.current) {
				opened.current = false;
				return;
			}
			setFloor(floor.id);
		},
		onContextMenu: (e) => {
			e.preventDefault();
			e.stopPropagation();
			setFloor(floor.id);
			openAt(e.clientX, e.clientY);
		},
		onPointerDown: (e) => {
			if (e.button === 2) return;
			start.current = {
				x: e.clientX,
				y: e.clientY
			};
			opened.current = false;
			if (e.pointerType !== "mouse") hold.current = window.setTimeout(() => {
				setFloor(floor.id);
				openAt(e.clientX, e.clientY);
			}, 480);
		},
		onPointerMove: (e) => {
			if (!hold.current) return;
			if (Math.hypot(e.clientX - start.current.x, e.clientY - start.current.y) > 12) clearHold();
		},
		onPointerUp: clearHold,
		onPointerCancel: clearHold,
		className: cn("h-11 shrink-0 rounded-full border px-3.5 text-sm transition-colors touch-manipulation", active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground hover:bg-accent"),
		children: floor.short
	}), menu ? (0, import_react_dom.createPortal)(/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FloorEditMenu, {
		floor,
		x: menu.x,
		y: menu.y,
		onClose: () => {
			opened.current = false;
			setMenu(null);
		}
	}), document.body) : null] });
}
function FloorEditMenu({ floor, x, y, onClose }) {
	const floors = useAtlas((s) => s.floors);
	const patchFloor = useAtlas((s) => s.patchFloor);
	const moveFloor = useAtlas((s) => s.moveFloor);
	const deleteFloor = useAtlas((s) => s.deleteFloor);
	const index = floors.findIndex((f) => f.id === floor.id);
	const panel = (0, import_react.useRef)(null);
	const nameRef = (0, import_react.useRef)(null);
	const onCloseRef = (0, import_react.useRef)(onClose);
	onCloseRef.current = onClose;
	(0, import_react.useEffect)(() => {
		nameRef.current?.focus();
		nameRef.current?.select();
	}, []);
	(0, import_react.useEffect)(() => {
		function onDoc(e) {
			if (panel.current?.contains(e.target)) return;
			onCloseRef.current();
		}
		function onKey(e) {
			if (e.key === "Escape") onCloseRef.current();
		}
		window.addEventListener("pointerdown", onDoc, true);
		window.addEventListener("keydown", onKey);
		return () => {
			window.removeEventListener("pointerdown", onDoc, true);
			window.removeEventListener("keydown", onKey);
		};
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		ref: panel,
		role: "menu",
		"aria-label": `Éditer ${floor.name}`,
		style: {
			left: x,
			top: y
		},
		className: "fixed z-50 w-[16.5rem] rounded-lg border border-border bg-card p-3 shadow-md",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mb-3 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground",
				children: "Éditer l’étage"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						htmlFor: `floor-name-${floor.id}`,
						children: "Nom"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						ref: nameRef,
						id: `floor-name-${floor.id}`,
						value: floor.name,
						onChange: (e) => {
							const name = e.target.value;
							patchFloor(floor.id, {
								name,
								short: name.trim().slice(0, 10) || floor.short
							});
						}
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						htmlFor: `floor-short-${floor.id}`,
						children: "Abrégé (onglet)"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						id: `floor-short-${floor.id}`,
						value: floor.short,
						maxLength: 12,
						onChange: (e) => patchFloor(floor.id, { short: e.target.value || floor.short })
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 flex flex-col gap-1",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						type: "button",
						variant: "outline",
						size: "sm",
						className: "justify-start",
						disabled: index <= 0,
						onClick: () => moveFloor(floor.id, -1),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUp, { className: "size-4" }), "Monter"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						type: "button",
						variant: "outline",
						size: "sm",
						className: "justify-start",
						disabled: index < 0 || index >= floors.length - 1,
						onClick: () => moveFloor(floor.id, 1),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowDown, { className: "size-4" }), "Descendre"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						type: "button",
						variant: "outline",
						size: "sm",
						className: "justify-start",
						disabled: floors.length <= 1,
						onClick: () => {
							deleteFloor(floor.id);
							onClose();
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-4" }), "Supprimer"]
					})
				]
			})
		]
	});
}
function Chip({ active, onClick, children, size = "md" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		...pressProps(onClick),
		"aria-pressed": active,
		className: cn("shrink-0 touch-manipulation rounded-full border text-xs transition-colors", size === "sm" ? "h-9 px-2.5" : "h-11 px-3", active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground"),
		children
	});
}
var Popover = Root2;
var PopoverTrigger = Trigger;
var PopoverContent = import_react.forwardRef(({ className, align = "start", sideOffset = 8, collisionPadding = 12, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Portal, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Content2, {
	ref,
	align,
	sideOffset,
	collisionPadding,
	className: cn("z-50 w-[min(20rem,calc(100vw-1.5rem))] origin-[--radix-popover-content-transform-origin] rounded-lg border border-border bg-card p-3 text-card-foreground shadow-sm outline-none", className),
	...props
}) }));
PopoverContent.displayName = Content2.displayName;
function MapFilter() {
	const query = useAtlas((s) => s.query);
	const setQuery = useAtlas((s) => s.setQuery);
	const filters = useAtlas((s) => s.filters);
	const setFilter = useAtlas((s) => s.setFilter);
	const clearFilters = useAtlas((s) => s.clearFilters);
	const filterable = useAtlas((s) => s.schema).filter((def) => def.filterable && def.type !== "text");
	const activeCount = filterable.filter((def) => {
		const v = filters[def.id];
		return v && v !== "tous";
	}).length + (query.trim() ? 1 : 0);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Popover, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PopoverTrigger, {
		asChild: true,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
			variant: activeCount ? "default" : "outline",
			size: "sm",
			"aria-label": "Filtrer les pièces",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ListFilter, { className: "size-4" }),
				"Filtrer",
				activeCount ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "rounded-full bg-primary-foreground/20 px-1.5 text-xs tabular-nums",
					children: activeCount
				}) : null
			]
		})
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(PopoverContent, {
		align: "start",
		className: "flex max-h-[min(28rem,70vh)] flex-col gap-3 overflow-y-auto",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					value: query,
					onChange: (e) => setQuery(e.target.value),
					placeholder: "Chercher une pièce…",
					className: "h-9 pl-9",
					"aria-label": "Rechercher une pièce"
				})]
			}),
			filterable.length ? filterable.map((def) => {
				const current = filters[def.id] || "tous";
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "flex flex-col gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground",
						children: def.name
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap gap-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
							size: "sm",
							active: current === "tous",
							onClick: () => setFilter(def.id, "tous"),
							children: "Tous"
						}), def.options.map((opt) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
							size: "sm",
							active: current === opt.id,
							onClick: () => setFilter(def.id, opt.id),
							children: optionLabel(def, opt.id)
						}, opt.id))]
					})]
				}, def.id);
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-muted-foreground",
				children: "Aucune propriété filtrable. Créez-en depuis Propriétés."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-muted-foreground",
				children: "Les pièces hors filtre s’estompent sur le plan."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-center gap-2",
				children: [activeCount ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					type: "button",
					variant: "ghost",
					size: "sm",
					className: "self-start",
					...pressProps(clearFilters),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" }), "Effacer"]
				}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "ghost",
					size: "sm",
					asChild: true,
					className: "self-start",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/proprietes",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SlidersHorizontal, { className: "size-4" }), "Propriétés"]
					})
				})]
			})
		]
	})] });
}
var WORKSPACE_PHOTOS = [
	{
		id: "ws-facade",
		src: "/maps/facade.jpg",
		name: "Façade"
	},
	{
		id: "ws-parcelle",
		src: "/maps/parcelle.jpg",
		name: "Parcelle"
	},
	{
		id: "ws-veranda",
		src: "/maps/veranda.jpg",
		name: "Véranda"
	},
	{
		id: "ws-toit",
		src: "/maps/toit.jpg",
		name: "Toit"
	},
	{
		id: "ws-salon",
		src: "/maps/rooms/salon.jpg",
		name: "Salon"
	},
	{
		id: "ws-cuisine",
		src: "/maps/rooms/cuisine.jpg",
		name: "Cuisine"
	},
	{
		id: "ws-bibliotheque",
		src: "/maps/rooms/bibliotheque.jpg",
		name: "Bibliothèque"
	},
	{
		id: "ws-chambre-stella",
		src: "/maps/rooms/chambre-stella.jpg",
		name: "Chambre Stella"
	},
	{
		id: "ws-chambre-antoine",
		src: "/maps/rooms/chambre-antoine.jpg",
		name: "Chambre Antoine"
	},
	{
		id: "ws-chambre-scellee",
		src: "/maps/rooms/chambre-scellee.jpg",
		name: "Chambre scellée"
	},
	{
		id: "ws-grenier",
		src: "/maps/rooms/grenier.jpg",
		name: "Grenier"
	}
];
function collectPlanPhotos(rooms, fixtures) {
	const seen = /* @__PURE__ */ new Set();
	const out = [];
	function add(list) {
		for (const photo of list ?? []) {
			const key = photo.src;
			if (!key || seen.has(key)) continue;
			seen.add(key);
			out.push(photo);
		}
	}
	for (const room of rooms) add(room.photos);
	for (const mark of fixtures) add(mark.photos);
	return out;
}
function readImageFile(file) {
	return new Promise((resolve, reject) => {
		if (!file.type.startsWith("image/")) {
			reject(/* @__PURE__ */ new Error("not-image"));
			return;
		}
		const reader = new FileReader();
		reader.onload = () => {
			const img = new Image();
			img.onload = () => {
				const scale = Math.min(1, 960 / Math.max(img.width, img.height));
				const w = Math.max(1, Math.round(img.width * scale));
				const h = Math.max(1, Math.round(img.height * scale));
				const canvas = document.createElement("canvas");
				canvas.width = w;
				canvas.height = h;
				const ctx = canvas.getContext("2d");
				if (!ctx) {
					reject(/* @__PURE__ */ new Error("canvas"));
					return;
				}
				ctx.drawImage(img, 0, 0, w, h);
				const src = canvas.toDataURL("image/jpeg", .72);
				resolve({
					id: uid("ph"),
					src,
					name: file.name.replace(/\.[^.]+$/, "").slice(0, 80) || "Photo"
				});
			};
			img.onerror = () => reject(/* @__PURE__ */ new Error("image"));
			img.src = String(reader.result);
		};
		reader.onerror = () => reject(/* @__PURE__ */ new Error("file"));
		reader.readAsDataURL(file);
	});
}
function mergePhotos(current, extra) {
	return sanitizePhotos([...current ?? [], ...extra]).slice(0, 12);
}
function PhotoField({ photos, onChange }) {
	const inputRef = (0, import_react.useRef)(null);
	const rooms = useAtlas((s) => s.rooms);
	const fixtures = useAtlas((s) => s.fixtures);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [openLib, setOpenLib] = (0, import_react.useState)(false);
	const used = collectPlanPhotos(rooms, fixtures);
	const library = [...WORKSPACE_PHOTOS, ...used.filter((p) => !WORKSPACE_PHOTOS.some((w) => w.src === p.src))];
	const taken = new Set(photos.map((p) => p.src));
	async function onFiles(list) {
		if (!list?.length) return;
		setBusy(true);
		try {
			const extra = [];
			for (const file of [...list]) try {
				extra.push(await readImageFile(file));
			} catch {}
			if (extra.length) onChange(mergePhotos(photos, extra));
		} finally {
			setBusy(false);
			if (inputRef.current) inputRef.current.value = "";
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "flex flex-col gap-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Photos" }),
			photos.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "grid grid-cols-2 gap-2 sm:grid-cols-3",
				children: photos.map((photo) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "group relative overflow-hidden rounded-md border border-border bg-muted",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: photo.src,
							alt: photo.name || "Photo",
							className: "aspect-[4/3] w-full object-cover"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							size: "icon",
							variant: "outline",
							className: "absolute right-1.5 top-1.5 size-8 bg-card/90",
							"aria-label": `Retirer ${photo.name || "la photo"}`,
							...pressProps(() => onChange(photos.filter((p) => p.id !== photo.id))),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-4" })
						}),
						photo.name ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "truncate px-2 py-1 text-xs text-muted-foreground",
							children: photo.name
						}) : null
					]
				}, photo.id))
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted-foreground",
				children: "Aucune photo. Importez-en une, ou choisissez-en une déjà dans le workspace."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						ref: inputRef,
						type: "file",
						accept: "image/*",
						multiple: true,
						className: "sr-only",
						"aria-label": "Importer des photos",
						onChange: (e) => void onFiles(e.target.files)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						type: "button",
						variant: "outline",
						size: "sm",
						disabled: busy || photos.length >= 12,
						...pressProps(() => inputRef.current?.click()),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImagePlus, { className: "size-4" }), busy ? "Import…" : "Importer"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						variant: "outline",
						size: "sm",
						"aria-expanded": openLib,
						...pressProps(() => setOpenLib((v) => !v)),
						children: "Bibliothèque"
					})
				]
			}),
			openLib ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid grid-cols-3 gap-2 rounded-lg border border-border bg-card p-2 sm:grid-cols-4",
				children: library.map((photo) => {
					const on = taken.has(photo.src);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						disabled: on || photos.length >= 12,
						title: photo.name,
						onClick: () => {
							if (on) return;
							onChange(mergePhotos(photos, [photo]));
						},
						className: cn("overflow-hidden rounded-md border text-left", on ? "border-primary opacity-60" : "border-border hover:border-primary"),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: photo.src,
							alt: photo.name || "Photo",
							className: "aspect-[4/3] w-full object-cover"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "block truncate px-1.5 py-1 text-[11px] text-muted-foreground",
							children: photo.name || "Photo"
						})]
					}, photo.id);
				})
			}) : null
		]
	});
}
var badgeVariants = cva("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", {
	variants: { variant: {
		default: "border-transparent bg-primary text-primary-foreground",
		outline: "border-border text-foreground",
		muted: "border-transparent bg-muted text-muted-foreground",
		clay: "border-transparent bg-clay/15 text-clay",
		sage: "border-transparent bg-primary/15 text-primary"
	} },
	defaultVariants: { variant: "outline" }
});
function Badge({ className, variant, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn(badgeVariants({ variant }), className),
		...props
	});
}
var Textarea = import_react.forwardRef(({ className, ...props }, ref) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
		className: cn("flex min-h-24 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50", className),
		ref,
		...props
	});
});
Textarea.displayName = "Textarea";
function badgeVariant(def, optionId) {
	const tone = def.options.find((o) => o.id === optionId)?.tone;
	if (tone === "clay") return "clay";
	if (tone === "sage") return "sage";
	if (tone === "stone") return "muted";
	return "outline";
}
function PhotoStrip({ photos }) {
	if (!photos?.length) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
		className: "grid grid-cols-2 gap-2 sm:grid-cols-3",
		children: photos.map((photo) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
			className: "overflow-hidden rounded-md border border-border",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: photo.src,
				alt: photo.name || "Photo",
				className: "aspect-[4/3] w-full object-cover"
			}), photo.name ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "truncate px-2 py-1 text-xs text-muted-foreground",
				children: photo.name
			}) : null]
		}, photo.id))
	});
}
function PropField({ def, value, onChange }) {
	if (def.type === "text") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
		value: typeof value === "string" ? value : "",
		onChange: (e) => onChange(e.target.value),
		placeholder: def.name
	});
	if (def.type === "choice") {
		const current = typeof value === "string" ? value : "";
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-wrap gap-1.5",
			children: [def.options.map((opt) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
				active: current === opt.id,
				onClick: () => onChange(opt.id),
				children: opt.label
			}, opt.id)), def.options.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-muted-foreground",
				children: "Ajoutez des options dans Propriétés."
			}) : null]
		});
	}
	const ids = Array.isArray(value) ? value : [];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex flex-wrap gap-1.5",
		children: def.options.map((opt) => {
			const on = ids.includes(opt.id);
			return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
				active: on,
				onClick: () => onChange(on ? ids.filter((x) => x !== opt.id) : [...ids, opt.id]),
				children: opt.label
			}, opt.id);
		})
	});
}
function RoomEditor({ room }) {
	const patchRoom = useAtlas((s) => s.patchRoom);
	const setRoomProp = useAtlas((s) => s.setRoomProp);
	const resetRoom = useAtlas((s) => s.resetRoom);
	const deleteRoom = useAtlas((s) => s.deleteRoom);
	const schema = useAtlas((s) => s.schema);
	const floors = useAtlas((s) => s.floors);
	const rooms = useAtlas((s) => s.rooms);
	const steps = room.steps ?? [];
	const props = room.props ?? {};
	const photos = room.photos ?? [];
	const dirty = room.name !== "Pièce" || Boolean(room.description.trim()) || steps.length > 0 || Object.keys(props).length > 0 || photos.length > 0;
	function setSteps(next) {
		patchRoom(room.id, { steps: next });
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
					htmlFor: "room-name",
					children: "Titre"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					id: "room-name",
					value: room.name,
					onChange: (e) => {
						const name = e.target.value;
						patchRoom(room.id, {
							name,
							label: name
						});
					}
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
					htmlFor: "room-desc",
					children: "Description"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
					id: "room-desc",
					value: room.description,
					rows: 6,
					onChange: (e) => patchRoom(room.id, { description: e.target.value })
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PhotoField, {
				photos,
				onChange: (next) => patchRoom(room.id, { photos: next })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "flex flex-col gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Étapes" }),
					steps.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted-foreground",
						children: "Aucune étape. Ajoutez-en si la pièce a une liste à cocher."
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "flex flex-col gap-2",
						children: steps.map((step) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex items-center gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "checkbox",
									checked: step.done,
									onChange: () => setSteps(steps.map((s) => s.id === step.id ? {
										...s,
										done: !s.done
									} : s)),
									className: "size-4 shrink-0 accent-primary",
									"aria-label": step.label || "Étape"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: step.label,
									onChange: (e) => setSteps(steps.map((s) => s.id === step.id ? {
										...s,
										label: e.target.value
									} : s)),
									placeholder: "Intitulé de l’étape",
									className: "min-w-0 flex-1"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									type: "button",
									variant: "outline",
									size: "icon",
									"aria-label": "Retirer l’étape",
									...pressProps(() => setSteps(steps.filter((s) => s.id !== step.id))),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-4" })
								})
							]
						}, step.id))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						type: "button",
						variant: "outline",
						size: "sm",
						className: "self-start",
						...pressProps(() => setSteps([...steps, {
							id: uid("step"),
							label: "",
							done: false
						}])),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" }), "Ajouter une étape"]
					})
				]
			}),
			schema.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "flex flex-col gap-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Propriétés" }), schema.map((def) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted-foreground",
						children: def.name
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PropField, {
						def,
						value: readProp(props, def),
						onChange: (value) => setRoomProp(room.id, def.id, value)
					})]
				}, def.id))]
			}) : null,
			floors.length > 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "flex flex-col gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Liaison d’étage" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex flex-wrap gap-1.5",
					children: floors.filter((f) => f.id !== room.floorId).map((f) => {
						const on = room.travel?.some((t) => t.toFloor === f.id);
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
							active: Boolean(on),
							onClick: () => {
								const travel = on ? (room.travel ?? []).filter((t) => t.toFloor !== f.id) : [...room.travel ?? [], {
									toFloor: f.id,
									label: `Vers ${f.name}`,
									toRoom: rooms.find((r) => r.floorId === f.id)?.id
								}];
								patchRoom(room.id, { travel });
							},
							children: f.name
						}, f.id);
					})
				})]
			}) : null,
			dirty ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				type: "button",
				variant: "outline",
				...pressProps(() => resetRoom(room.id)),
				children: "Vider les textes"
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				type: "button",
				variant: "outline",
				...pressProps(() => deleteRoom(room.id)),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-4" }), "Supprimer la pièce"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PrefsSaveBar, { sticky: false })
		]
	});
}
function ZoneEditor({ zone }) {
	const patchFixture = useAtlas((s) => s.patchFixture);
	const deleteFixture = useAtlas((s) => s.deleteFixture);
	const title = zone.label ?? "Zone";
	const color = sanitizeHexColor(zone.color) ?? zoneHex(zone.fill);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
					htmlFor: "zone-name",
					children: "Titre"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					id: "zone-name",
					value: title,
					onChange: (e) => {
						const name = e.target.value;
						patchFixture(zone.id, { label: name || "Zone" });
					}
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
					htmlFor: "zone-desc",
					children: "Description"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
					id: "zone-desc",
					value: zone.description ?? "",
					rows: 6,
					onChange: (e) => patchFixture(zone.id, { description: e.target.value })
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ColorWheel, {
				id: `zone-color-${zone.id}`,
				value: color,
				onChange: (next) => patchFixture(zone.id, { color: next })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PhotoField, {
				photos: zone.photos ?? [],
				onChange: (photos) => patchFixture(zone.id, { photos })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				type: "button",
				variant: "outline",
				...pressProps(() => deleteFixture(zone.id)),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-4" }), "Supprimer la zone"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PrefsSaveBar, { sticky: false })
		]
	});
}
function ZoneDossier({ zone, className }) {
	const floors = useAtlas((s) => s.floors);
	const [editing, setEditing] = (0, import_react.useState)(false);
	const prevId = (0, import_react.useRef)(zone.id);
	(0, import_react.useEffect)(() => {
		if (prevId.current !== zone.id) {
			prevId.current = zone.id;
			setEditing(false);
		}
	}, [zone.id]);
	const floor = floorById(floors, zone.floorId);
	const title = zone.label ?? "Zone";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("article", {
		className: cn("flex flex-col gap-5", className),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GuardBoundary, {
			label: "Dossier de zone",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex flex-col gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground",
						children: [floor?.name, " · Zone"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						type: "button",
						variant: editing ? "default" : "outline",
						size: "sm",
						...pressProps(() => setEditing((v) => !v)),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { className: "size-4" }), editing ? "Lecture" : "Modifier"]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-2xl font-medium leading-tight tracking-[-0.03em] text-balance sm:text-3xl",
					children: title
				})]
			}), editing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ZoneEditor, { zone }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PhotoStrip, { photos: zone.photos }),
				zone.description?.trim() ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-base leading-relaxed text-pretty",
					children: zone.description
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted-foreground",
					children: "Pas encore de description. Touchez Modifier."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PrefsSaveBar, { sticky: false })
			] })]
		})
	});
}
function RoomDossier({ className }) {
	const selectedId = useAtlas((s) => s.selectedId);
	const selectedMarkId = useAtlas((s) => s.selectedMarkId);
	const select = useAtlas((s) => s.select);
	const rooms = useAtlas((s) => s.rooms);
	const floors = useAtlas((s) => s.floors);
	const schema = useAtlas((s) => s.schema);
	const fixtures = useAtlas((s) => s.fixtures);
	const setDrawShape = useAtlas((s) => s.setDrawShape);
	const [editing, setEditing] = (0, import_react.useState)(false);
	const prevId = (0, import_react.useRef)(selectedId);
	(0, import_react.useEffect)(() => {
		if (prevId.current !== selectedId) {
			prevId.current = selectedId;
			setEditing(false);
		}
	}, [selectedId]);
	const zone = selectedMarkId ? fixtures.find((f) => f.id === selectedMarkId && f.kind === "zone") : void 0;
	if (zone) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ZoneDossier, {
		zone,
		className
	});
	const room = selectedId ? resolveRoom(selectedId, rooms, schema) : void 0;
	if (!room) {
		const emptyPlan = useUiStore.getState().copy.emptyPlan;
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: cn("py-12", className),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "max-w-sm text-sm text-muted-foreground text-pretty",
				children: emptyPlan
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				type: "button",
				variant: "outline",
				className: "mt-4",
				...pressProps(() => setDrawShape("rect")),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" }), "Tracer une pièce"]
			})]
		});
	}
	const floor = floorById(floors, room.floorId);
	const props = room.props ?? {};
	const steps = room.steps ?? [];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("article", {
		className: cn("flex flex-col gap-5", className),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GuardBoundary, {
			label: "Dossier de pièce",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
					className: "flex flex-col gap-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-start justify-between gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground",
								children: floor?.name
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								type: "button",
								variant: editing ? "default" : "outline",
								size: "sm",
								...pressProps(() => setEditing((v) => !v)),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { className: "size-4" }), editing ? "Lecture" : "Modifier"]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display text-2xl font-medium leading-tight tracking-[-0.03em] text-balance sm:text-3xl",
							children: room.name
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex flex-wrap gap-1.5",
							children: schema.flatMap((def) => {
								const value = readProp(props, def);
								if (def.type === "choice" && typeof value === "string" && value) return [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									variant: badgeVariant(def, value),
									children: formatProp(def, value)[0]
								}, def.id)];
								if (def.type === "tags" && Array.isArray(value)) return value.map((id) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									variant: "outline",
									children: def.options.find((o) => o.id === id)?.label ?? id
								}, `${def.id}-${id}`));
								if (def.type === "text" && typeof value === "string" && value.trim()) return [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
									variant: "muted",
									children: [
										def.name,
										" · ",
										value
									]
								}, def.id)];
								return [];
							})
						})
					]
				}),
				editing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RoomEditor, { room }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PhotoStrip, { photos: room.photos }),
					room.description ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-base leading-relaxed text-pretty",
						children: room.description
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted-foreground",
						children: "Pas encore de description. Touchez Modifier."
					}),
					steps.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "flex flex-col gap-2",
						children: steps.map((step) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex items-start gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "checkbox",
								checked: step.done,
								onChange: () => {
									const next = steps.map((s) => s.id === step.id ? {
										...s,
										done: !s.done
									} : s);
									useAtlas.getState().patchRoom(room.id, { steps: next });
								},
								className: "mt-1 size-4 shrink-0 accent-primary"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: cn("text-base leading-relaxed", step.done && "text-muted-foreground line-through"),
								children: step.label || "Étape"
							})]
						}, step.id))
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PrefsSaveBar, { sticky: false })
				] }),
				room.travel?.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex flex-col gap-2",
					children: room.travel.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "secondary",
						className: "justify-between",
						...pressProps(() => select(t.toRoom ?? room.id)),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t.label }), (floorById(floors, t.toFloor)?.order ?? 0) > (floorById(floors, room.floorId)?.order ?? 0) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUp, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowDown, { className: "size-4" })]
					}, t.label))
				}) : null,
				room.connections.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "flex flex-col gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Separator, {}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground",
							children: "Voisines"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex flex-wrap gap-1.5",
							children: room.connections.map((id) => {
								const other = roomById(rooms, id);
								if (!other) return null;
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									...pressProps(() => select(id)),
									className: "inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs hover:bg-accent",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { className: "size-3" }), other.name]
								}, id);
							})
						})
					]
				}) : null
			]
		})
	});
}
var TooltipProvider = Provider;
var TooltipContent = import_react.forwardRef(({ className, sideOffset = 6, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Portal$1, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Content2$1, {
	ref,
	sideOffset,
	className: cn("z-50 overflow-hidden rounded-md border border-border bg-card px-3 py-1.5 text-xs text-foreground shadow-sm", className),
	...props
}) }));
TooltipContent.displayName = Content2$1.displayName;
function sessionMarkdown(input) {
	const nameOf = (id) => {
		if (!id) return null;
		return resolveRoom(id, input.rooms)?.name ?? id;
	};
	const lines = [
		"## Session — Atlas",
		"",
		`**Étage :** ${input.floors.find((f) => f.id === input.floorId)?.name ?? input.floorId}`,
		input.sceneRoomId ? `**Scène :** ${nameOf(input.sceneRoomId)}` : "**Scène :** —",
		input.selectedId ? `**Focus :** ${nameOf(input.selectedId)}` : "",
		"",
		"### Positions"
	];
	if (!input.characters.length) lines.push("- Aucun pion");
	for (const who of input.characters) {
		const pos = input.tokens[who.id];
		if (!pos) continue;
		const fl = input.floors.find((f) => f.id === pos.floorId);
		lines.push(`- **${who.name}** — ${nameOf(pos.roomId) ?? "sur le plan"} (${fl?.short ?? pos.floorId})`);
	}
	const noted = Object.entries(input.notes).filter(([, t]) => t.trim());
	if (noted.length) {
		lines.push("", "### Notes");
		for (const [id, text] of noted) lines.push(`- **${nameOf(id)}** : ${text.trim()}`);
	}
	return lines.filter((l) => l !== "").join("\n") + "\n";
}
var SHAPES = [
	{
		id: "rect",
		label: "Rectangle",
		hint: "Glissez un rectangle",
		Icon: Square
	},
	{
		id: "ellipse",
		label: "Ellipse",
		hint: "Glissez une ellipse",
		Icon: Circle
	},
	{
		id: "polygon",
		label: "Polygone",
		hint: "Sommets un à un",
		Icon: Hexagon
	},
	{
		id: "line",
		label: "Tracer une ligne",
		hint: "Le trait rejoint le départ",
		Icon: PenLine
	}
];
var MARKS = [{
	id: "door",
	label: "Porte",
	Icon: DoorOpen
}, {
	id: "window",
	label: "Fenêtre",
	Icon: AppWindow
}];
var STAIR_ICONS = {
	straight: ChevronsUp,
	spiral: RotateCw,
	quarter: CornerRightDown,
	switchback: IterationCw
};
function AtlasApp() {
	const floorId = useAtlas((s) => s.floorId);
	const floors = useAtlas((s) => s.floors);
	const rooms = useAtlas((s) => s.rooms);
	const wander = useAtlas((s) => s.wander);
	const resetSession = useAtlas((s) => s.resetSession);
	const selectedId = useAtlas((s) => s.selectedId);
	const addFloor = useAtlas((s) => s.addFloor);
	const tool = useAtlas((s) => s.tool);
	const setTool = useAtlas((s) => s.setTool);
	const drawShape = useAtlas((s) => s.drawShape);
	const setDrawShape = useAtlas((s) => s.setDrawShape);
	const stairStyle = useAtlas((s) => s.stairStyle);
	const setStairStyle = useAtlas((s) => s.setStairStyle);
	const undo = useAtlas((s) => s.undo);
	const canUndo = useAtlas((s) => s.history.length > 0);
	const [copied, setCopied] = (0, import_react.useState)(false);
	const [shapeOpen, setShapeOpen] = (0, import_react.useState)(false);
	const [stairOpen, setStairOpen] = (0, import_react.useState)(false);
	const showHints = useUiStore((s) => s.chrome.showHints);
	const floorWord = useUiStore((s) => s.copy.floorWord);
	const roomWord = useUiStore((s) => s.copy.roomWord);
	(0, import_react.useEffect)(() => {
		function onKey(e) {
			const tag = e.target?.tagName;
			if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
			const z = e.key === "z" || e.key === "Z";
			const y = e.key === "y" || e.key === "Y";
			if ((e.metaKey || e.ctrlKey) && z && e.shiftKey) {
				e.preventDefault();
				useAtlas.getState().redo();
			} else if ((e.metaKey || e.ctrlKey) && (z || y)) {
				e.preventDefault();
				if (y) useAtlas.getState().redo();
				else useAtlas.getState().undo();
			}
		}
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, []);
	const floor = floorById(floors, floorId);
	const roomsHere = rooms.filter((r) => r.floorId === floorId);
	const activeShape = SHAPES.find((s) => s.id === drawShape) ?? SHAPES[0];
	const drawing = tool === "draw";
	const StairIcon = STAIR_ICONS[stairStyle] ?? ChevronsUp;
	const stairing = tool === "stair";
	async function copySession() {
		const { tokens, notes, sceneRoomId, floors: fl, rooms: rm, characters } = useAtlas.getState();
		const md = sessionMarkdown({
			floorId,
			sceneRoomId,
			tokens,
			notes,
			selectedId,
			rooms: rm,
			floors: fl,
			characters
		});
		try {
			await navigator.clipboard.writeText(md);
			setCopied(true);
			toast.success("Session copiée");
			window.setTimeout(() => setCopied(false), 1600);
		} catch {
			toast.error("Impossible de copier");
		}
	}
	function toggleDraw() {
		if (tool === "draw") setTool("select");
		else setDrawShape(drawShape);
	}
	function pickShape(shape) {
		setDrawShape(shape);
		setShapeOpen(false);
	}
	function toggleMark(kind) {
		setTool(tool === kind ? "select" : kind);
	}
	function toggleZone() {
		setTool(tool === "zone" ? "select" : "zone");
	}
	const hint = toolHint(tool, drawShape, roomsHere.length);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TooltipProvider, {
		delayDuration: 200,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "min-h-dvh bg-background text-foreground",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
				className: "border-b border-border",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mx-auto flex h-12 w-full max-w-4xl items-center px-4 sm:px-6",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppHeader, {
						copied,
						onWander: () => {
							const id = wander();
							if (id) {
								const room = roomById(useAtlas.getState().rooms, id);
								toast.message(room?.name ?? "Pièce inconnue");
							} else toast.message("Aucune pièce sur cet étage");
						},
						onCopy: () => void copySession(),
						onReset: () => {
							resetSession();
							toast.message("Session réinitialisée");
						}
					})
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "mx-auto w-full max-w-3xl px-4 pb-24 pt-4 sm:max-w-4xl sm:px-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-center gap-1.5",
						children: [floors.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FloorTab, {
							floor: f,
							active: floorId === f.id
						}, f.id)), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							type: "button",
							variant: "outline",
							size: "sm",
							className: "h-11 rounded-full",
							"aria-label": "Ajouter un étage",
							...pressProps(() => addFloor()),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" }), floorWord]
						})]
					}),
					showHints ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 hidden text-xs text-muted-foreground sm:block",
						children: "Clic droit sur un onglet, une pièce ou un élément pour l’éditer."
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-xs text-muted-foreground sm:hidden",
						children: "Appui long pour éditer un onglet, une pièce ou un élément."
					})] }) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-2 flex flex-wrap items-center gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapFilter, {}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "hidden h-5 w-px bg-border sm:block" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								type: "button",
								variant: "outline",
								size: "sm",
								"aria-label": "Annuler",
								disabled: !canUndo,
								title: "Annuler (Ctrl+Z)",
								...pressProps(() => undo()),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Undo2, { className: "size-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "hidden sm:inline",
									children: "Annuler"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "inline-flex",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									type: "button",
									variant: drawing ? "default" : "outline",
									size: "sm",
									className: "rounded-r-none",
									"aria-label": "Tracer une pièce",
									"aria-pressed": drawing,
									...pressProps(toggleDraw),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(activeShape.Icon, { className: "size-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "hidden sm:inline",
										children: roomWord
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Popover, {
									open: shapeOpen,
									onOpenChange: setShapeOpen,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PopoverTrigger, {
										asChild: true,
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											type: "button",
											variant: drawing ? "default" : "outline",
											size: "sm",
											className: "rounded-l-none border-l-0 px-2",
											"aria-label": "Forme de pièce",
											"aria-expanded": shapeOpen,
											"aria-haspopup": "menu",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "size-4" })
										})
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PopoverContent, {
										className: "w-52 p-1",
										align: "start",
										children: SHAPES.map((shape) => {
											const on = drawing && drawShape === shape.id;
											return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
												type: "button",
												role: "menuitem",
												className: cn("flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-accent", on && "bg-accent"),
												...pressProps(() => pickShape(shape.id)),
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(shape.Icon, { className: "size-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "flex-1",
													children: shape.label
												})]
											}, shape.id);
										})
									})]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "hidden h-5 w-px bg-border sm:block" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								type: "button",
								variant: tool === "zone" ? "default" : "outline",
								size: "sm",
								"aria-label": "Tracer une zone",
								"aria-pressed": tool === "zone",
								...pressProps(toggleZone),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaintBucket, { className: "size-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "hidden sm:inline",
									children: "Zone"
								})]
							}),
							MARKS.map((mark) => {
								const on = tool === mark.id;
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									type: "button",
									variant: on ? "default" : "outline",
									size: "sm",
									"aria-label": mark.label,
									"aria-pressed": on,
									...pressProps(() => toggleMark(mark.id)),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(mark.Icon, { className: "size-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "hidden sm:inline",
										children: mark.label
									})]
								}, mark.id);
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "inline-flex",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									type: "button",
									variant: stairing ? "default" : "outline",
									size: "sm",
									className: "rounded-r-none",
									"aria-label": "Escalier",
									"aria-pressed": stairing,
									...pressProps(() => setTool(stairing ? "select" : "stair")),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StairIcon, { className: "size-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "hidden sm:inline",
										children: "Escalier"
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Popover, {
									open: stairOpen,
									onOpenChange: setStairOpen,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PopoverTrigger, {
										asChild: true,
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											type: "button",
											variant: stairing ? "default" : "outline",
											size: "sm",
											className: "rounded-l-none border-l-0 px-2",
											"aria-label": "Type d’escalier",
											"aria-expanded": stairOpen,
											"aria-haspopup": "menu",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "size-4" })
										})
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PopoverContent, {
										className: "w-60 p-1",
										align: "start",
										children: STAIR_STYLES.map((item) => {
											const Icon = STAIR_ICONS[item.id];
											const on = stairing && stairStyle === item.id;
											return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
												type: "button",
												role: "menuitem",
												className: cn("flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-accent", on && "bg-accent"),
												...pressProps(() => {
													setStairStyle(item.id);
													setStairOpen(false);
												}),
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "flex-1",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "block",
														children: item.label
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "block text-xs text-muted-foreground",
														children: item.hint
													})]
												})]
											}, item.id);
										})
									})]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PionsButton, {})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("figure", {
						className: "mt-2 overflow-hidden rounded-lg border border-border bg-paper",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "relative h-72 sm:h-80 lg:h-96",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GuardBoundary, {
								label: "Le plan",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FloorPlan, {})
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("figcaption", {
							className: "flex flex-wrap items-center justify-between gap-2 border-t border-border px-3 py-2 text-xs text-muted-foreground",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FloorCaption, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: hint })]
						})]
					}),
					floor?.blurb ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground text-pretty",
						children: floor.blurb
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						id: "dossier",
						className: "mt-8",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RoomDossier, {})
					})
				]
			})]
		})
	});
}
function PionsButton() {
	const characters = useAtlas((s) => s.characters);
	const tool = useAtlas((s) => s.tool);
	const placingTokenId = useAtlas((s) => s.placingTokenId);
	const addCharacter = useAtlas((s) => s.addCharacter);
	const patchCharacter = useAtlas((s) => s.patchCharacter);
	const deleteCharacter = useAtlas((s) => s.deleteCharacter);
	const setPlacingToken = useAtlas((s) => s.setPlacingToken);
	const [open, setOpen] = (0, import_react.useState)(false);
	const [draft, setDraft] = (0, import_react.useState)("");
	function addNamed() {
		const id = addCharacter(draft);
		setDraft("");
		setOpen(false);
		if (id) toast.message("Touchez le plan pour poser le pion");
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Popover, {
		open,
		onOpenChange: setOpen,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PopoverTrigger, {
			asChild: true,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				type: "button",
				variant: tool === "token" ? "default" : "outline",
				size: "sm",
				"aria-label": "Pions",
				"aria-pressed": tool === "token",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { className: "size-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "hidden sm:inline",
					children: "Pions"
				})]
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(PopoverContent, {
			className: "w-72 p-3",
			align: "start",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground",
					children: "Pions"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-2 flex flex-col gap-2",
					children: characters.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted-foreground",
						children: "Aucun pion. Nommez-en un, puis posez-le sur le plan."
					}) : characters.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-1.5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: c.name,
								"aria-label": `Nom du pion ${c.short}`,
								className: "h-9",
								onChange: (e) => patchCharacter(c.id, { name: e.target.value })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								size: "sm",
								variant: placingTokenId === c.id && tool === "token" ? "default" : "outline",
								"aria-label": `Poser ${c.name}`,
								...pressProps(() => {
									setPlacingToken(c.id);
									setOpen(false);
									toast.message("Touchez le plan pour poser le pion");
								}),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { className: "size-4" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								size: "sm",
								variant: "outline",
								"aria-label": `Supprimer ${c.name}`,
								...pressProps(() => deleteCharacter(c.id)),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-4" })
							})
						]
					}, c.id))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					className: "mt-3 flex gap-1.5",
					onSubmit: (e) => {
						e.preventDefault();
						addNamed();
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: draft,
						onChange: (e) => setDraft(e.target.value),
						placeholder: "Nom du pion",
						"aria-label": "Nom du pion",
						className: "h-9"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "submit",
						size: "sm",
						"aria-label": "Ajouter un pion",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" })
					})]
				})
			]
		})]
	});
}
function toolHint(tool, shape, roomCount) {
	if (tool === "draw") {
		if (shape === "polygon") return "Touchez pour poser un sommet · Entrée pour fermer";
		if (shape === "line") return "Glissez un trait, ou posez des sommets · rejoignez le départ";
		if (shape === "ellipse") return "Glissez une ellipse";
		return "Glissez un rectangle sur le plan";
	}
	if (tool === "zone") return "Glissez un lasso, relâchez pour fermer";
	if (tool === "door") return "Glissez une porte — l’orientation suit le geste";
	if (tool === "window") return "Glissez une fenêtre le long d’un mur";
	if (tool === "stair") return "Glissez un escalier — tirez les poignées pour largeur et longueur";
	if (tool === "token") return "Touchez le plan pour poser le pion";
	if (roomCount) return "Touchez une pièce · clic droit pour renommer";
	return "Aucune pièce — tracez-en une";
}
function FloorCaption() {
	const floorId = useAtlas((s) => s.floorId);
	const floors = useAtlas((s) => s.floors);
	const floor = floorById(floors, floorId);
	if (!floor) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Plan" });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "font-medium text-foreground",
		children: floor.name
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AtlasApp, {});
}
//#endregion
export { Home as component };
