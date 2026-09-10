import { Plus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ColorWheel } from "@/components/atlas/color-wheel";
import { EditableTitle } from "@/components/atlas/editable-title";
import { Panel } from "@/components/atlas/panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FloorMeta, RoomGroup } from "@/lib/map/types";
import { useAtlas } from "@/lib/map/store";
import { usePrefs } from "@/lib/map/prefs";
import { formatSavedAt } from "@/lib/map/saves";
import { useUiStore } from "@/lib/map/ui";
import { OWNER } from "@/lib/progress/owner";
import { pressProps } from "@/lib/press";
import { cn } from "@/lib/utils";

export function FloorTabList() {
  const floors = useAtlas((s) => s.floors);
  const floorId = useAtlas((s) => s.floorId);
  const addFloor = useAtlas((s) => s.addFloor);
  const reorderFloorsAt = useAtlas((s) => s.reorderFloorsAt);
  const floorWord = useUiStore((s) => s.copy.floorWord);
  const workspaceName = useUiStore((s) => s.copy.workspaceName);
  const setCopy = useUiStore((s) => s.setCopy);
  const listRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{
    id: string;
    x: number;
    y: number;
    moved: boolean;
    insert: number;
    w: number;
    h: number;
    label: string;
    active: boolean;
  } | null>(null);
  const [ghost, setGhost] = useState<{
    id: string;
    x: number;
    y: number;
    w: number;
    h: number;
    label: string;
    active: boolean;
  } | null>(null);

  useEffect(() => {
    function onMove(e: PointerEvent) {
      const d = drag.current;
      if (!d) return;
      if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 6) d.moved = true;
      if (!d.moved) return;
      setGhost({
        id: d.id,
        x: e.clientX,
        y: e.clientY,
        w: d.w,
        h: d.h,
        label: d.label,
        active: d.active,
      });
      const list = listRef.current;
      if (!list) return;
      const tabs = [...list.querySelectorAll<HTMLElement>("[data-atlas-floor]")];
      let insert = 0;
      for (const tab of tabs) {
        const id = tab.getAttribute("data-atlas-floor");
        if (!id || id === d.id) continue;
        const r = tab.getBoundingClientRect();
        const beforeRow = e.clientY < r.top;
        const sameRow = Math.abs(e.clientY - (r.top + r.height / 2)) <= r.height;
        if (beforeRow) break;
        if (sameRow && e.clientX < r.left + r.width / 2) break;
        insert += 1;
      }
      reorderFloorsAt(d.id, insert);
      d.insert = insert;
    }
    function onUp() {
      const d = drag.current;
      if (d?.moved) reorderFloorsAt(d.id, d.insert);
      drag.current = null;
      setGhost(null);
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [reorderFloorsAt]);

  return (
    <div className="flex flex-col gap-2">
      <EditableTitle
        as="h1"
        value={workspaceName}
        onChange={(workspaceName) => setCopy({ workspaceName })}
        className="font-display text-xl font-medium tracking-[-0.03em] text-balance sm:text-2xl"
        placeholder="Nom du lieu"
      />
      <SaveLine />
      <Panel titleId="floors" fallback="Étages" bodyClassName="flex-col items-stretch gap-1.5">
        <div ref={listRef} className="flex flex-wrap items-center gap-1.5">
      {floors.map((f) => (
        <FloorTab
          key={f.id}
          floor={f}
          active={floorId === f.id}
          dragging={ghost?.id === f.id}
          onDragBegin={(id, x, y, box) => {
            drag.current = {
              id,
              x,
              y,
              moved: false,
              insert: floors.findIndex((f) => f.id === id),
              w: box.w,
              h: box.h,
              label: box.label,
              active: box.active,
            };
          }}
          skipClick={() => Boolean(drag.current?.moved)}
        />
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-11 rounded-full"
        aria-label={`Ajouter un ${floorWord}`}
        onClick={() => addFloor()}
      >
        <Plus className="size-4" />
        <EditableTitle
          as="span"
          value={floorWord}
          onChange={(floorWord) => setCopy({ floorWord: floorWord || "Étage" })}
        />
      </Button>
      {ghost
        ? createPortal(
            <div
              className={cn(
                "pointer-events-none fixed z-[80] inline-flex h-11 items-center justify-center rounded-full border px-3.5 text-sm shadow-md",
                ghost.active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground",
              )}
              style={{
                left: ghost.x,
                top: ghost.y,
                width: ghost.w,
                minWidth: ghost.w,
                height: ghost.h,
                transform: "translate(-50%, -50%)",
              }}
            >
              {ghost.label}
            </div>,
            document.body,
          )
        : null}
    </div>
    <GroupChipList />
      </Panel>
    </div>
  );
}

export function FloorTab({
  floor,
  active,
  dragging,
  onDragBegin,
  skipClick,
}: {
  floor: FloorMeta;
  active: boolean;
  dragging?: boolean;
  onDragBegin?: (
    id: string,
    x: number,
    y: number,
    box: { w: number; h: number; label: string; active: boolean },
  ) => void;
  skipClick?: () => boolean;
}) {
  const setFloor = useAtlas((s) => s.setFloor);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const hold = useRef<number>(0);
  const opened = useRef(false);
  const start = useRef({ x: 0, y: 0 });
  const btn = useRef<HTMLButtonElement>(null);

  function openAt(x: number, y: number) {
    opened.current = true;
    const pad = 8;
    const w = 260;
    const h = 220;
    setMenu({
      x: Math.min(Math.max(pad, x), window.innerWidth - w - pad),
      y: Math.min(Math.max(pad, y), window.innerHeight - h - pad),
    });
  }

  function clearHold() {
    if (hold.current) {
      window.clearTimeout(hold.current);
      hold.current = 0;
    }
  }

  return (
    <>
      <button
        ref={btn}
        type="button"
        data-atlas-floor={floor.id}
        data-href={`/?e=${encodeURIComponent(floor.id)}`}
        aria-haspopup="menu"
        aria-expanded={Boolean(menu)}
        aria-pressed={active}
        onClick={() => {
          if (opened.current) {
            opened.current = false;
            return;
          }
          if (skipClick?.()) return;
          setFloor(floor.id);
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setFloor(floor.id);
          openAt(e.clientX, e.clientY);
        }}
        onPointerDown={(e) => {
          if (e.button === 2) return;
          start.current = { x: e.clientX, y: e.clientY };
          opened.current = false;
          const r = btn.current?.getBoundingClientRect();
          onDragBegin?.(floor.id, e.clientX, e.clientY, {
            w: r?.width ?? 44,
            h: r?.height ?? 44,
            label: floor.short,
            active,
          });
          if (e.pointerType !== "mouse") {
            hold.current = window.setTimeout(() => {
              setFloor(floor.id);
              openAt(e.clientX, e.clientY);
            }, 520);
          }
        }}
        onPointerMove={(e) => {
          if (!hold.current) return;
          if (Math.hypot(e.clientX - start.current.x, e.clientY - start.current.y) > 10) {
            clearHold();
          }
        }}
        onPointerUp={clearHold}
        onPointerCancel={clearHold}
        aria-label={floor.name}
        className={cn(
          "inline-flex h-11 shrink-0 cursor-grab items-center justify-center rounded-full border px-3.5 text-sm outline-none transition-colors touch-none select-none active:cursor-grabbing",
          "focus-visible:ring-2 focus-visible:ring-ring",
          dragging && "opacity-30",
          active
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border bg-card text-foreground hover:bg-accent",
        )}
      >
        {floor.short}
      </button>
      {menu
        ? createPortal(
            <FloorEditMenu
              floor={floor}
              x={menu.x}
              y={menu.y}
              onClose={() => {
                opened.current = false;
                setMenu(null);
              }}
            />,
            document.body,
          )
        : null}
    </>
  );
}

function FloorEditMenu({
  floor,
  x,
  y,
  onClose,
}: {
  floor: FloorMeta;
  x: number;
  y: number;
  onClose: () => void;
}) {
  const floors = useAtlas((s) => s.floors);
  const patchFloor = useAtlas((s) => s.patchFloor);
  const deleteFloor = useAtlas((s) => s.deleteFloor);
  const panel = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    nameRef.current?.focus();
    nameRef.current?.select();
  }, []);

  useEffect(() => {
    function onDoc(e: PointerEvent) {
      if (panel.current?.contains(e.target as Node)) return;
      onCloseRef.current();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCloseRef.current();
    }
    window.addEventListener("pointerdown", onDoc, true);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onDoc, true);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div
      ref={panel}
      role="menu"
      aria-label={`Éditer ${floor.name}`}
      style={{ left: x, top: y }}
      className="fixed z-50 w-[16.5rem] rounded-lg border border-border bg-card p-3 shadow-md"
    >
      <p className="mb-3 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
        Éditer l’étage
      </p>
      <p className="mb-2 text-xs text-muted-foreground">
        Glissez l’onglet : il suit le curseur pour changer l’ordre des couches.
      </p>
      <div className="flex flex-col gap-2">
        <Label htmlFor={`floor-name-${floor.id}`}>Nom</Label>
        <Input
          ref={nameRef}
          id={`floor-name-${floor.id}`}
          value={floor.name}
          onChange={(e) => {
            const name = e.target.value;
            patchFloor(floor.id, {
              name,
              short: name.trim().slice(0, 10) || floor.short,
            });
          }}
        />
        <Label htmlFor={`floor-short-${floor.id}`}>Abrégé (onglet)</Label>
        <Input
          id={`floor-short-${floor.id}`}
          value={floor.short}
          maxLength={12}
          onChange={(e) => patchFloor(floor.id, { short: e.target.value || floor.short })}
        />
      </div>
      <div className="mt-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full justify-start"
          disabled={floors.length <= 1}
          {...pressProps(() => {
            deleteFloor(floor.id);
            onClose();
          })}
        >
          <Trash2 className="size-4" />
          Supprimer
        </Button>
      </div>
    </div>
  );
}

function SaveLine() {
  const saving = usePrefs((s) => s.saving);
  const lastSavedAt = usePrefs((s) => s.lastSavedAt);
  const cloud = usePrefs((s) => s.cloud);
  return (
    <p className="text-[11px] text-muted-foreground" aria-live="polite">
      {saving || cloud === "syncing"
        ? `Sauvegarde ${OWNER.displayName}…`
        : lastSavedAt
          ? `Sauvegarde ${OWNER.displayName} · ${formatSavedAt(lastSavedAt)}`
          : `Sauvegarde ${OWNER.displayName} — à chaque modification`}
    </p>
  );
}

function GroupChipList() {
  const groups = useAtlas((s) => s.groups ?? []);
  const selectedGroupId = useAtlas((s) => s.selectedGroupId ?? null);
  const addGroup = useAtlas((s) => s.addGroup);
  const play = useUiStore((s) => s.stance) === "partie";
  if (play && groups.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5" aria-label="Groupes">
      {groups.map((g) => (
        <GroupChip key={g.id} group={g} active={selectedGroupId === g.id} />
      ))}
      {play ? null : (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-11 rounded-full"
        aria-label="Créer un groupe"
        title="Créer un groupe"
        {...pressProps(() => addGroup())}
      >
        <Plus className="size-4" />
        Groupe
      </Button>
      )}
    </div>
  );
}

function GroupChip({ group, active }: { group: RoomGroup; active: boolean }) {
  const selectGroup = useAtlas((s) => s.selectGroup);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const hold = useRef<number>(0);
  const opened = useRef(false);
  const start = useRef({ x: 0, y: 0 });

  function openAt(x: number, y: number) {
    opened.current = true;
    const pad = 8;
    const w = 260;
    const h = 280;
    setMenu({
      x: Math.min(Math.max(pad, x), window.innerWidth - w - pad),
      y: Math.min(Math.max(pad, y), window.innerHeight - h - pad),
    });
  }

  function clearHold() {
    if (hold.current) {
      window.clearTimeout(hold.current);
      hold.current = 0;
    }
  }

  return (
    <>
      <button
        type="button"
        aria-pressed={active}
        aria-haspopup="menu"
        aria-expanded={Boolean(menu)}
        title={`${group.name} — clic pour sélectionner · clic droit pour éditer`}
        aria-label={group.name}
        onClick={() => {
          if (opened.current) {
            opened.current = false;
            return;
          }
          selectGroup(active ? null : group.id);
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          openAt(e.clientX, e.clientY);
        }}
        onPointerDown={(e) => {
          if (e.button === 2) return;
          start.current = { x: e.clientX, y: e.clientY };
          opened.current = false;
          if (e.pointerType !== "mouse") {
            hold.current = window.setTimeout(() => {
              openAt(e.clientX, e.clientY);
            }, 520);
          }
        }}
        onPointerMove={(e) => {
          if (!hold.current) return;
          if (Math.hypot(e.clientX - start.current.x, e.clientY - start.current.y) > 10) {
            clearHold();
          }
        }}
        onPointerUp={clearHold}
        onPointerCancel={clearHold}
        className={cn(
          "inline-flex h-11 shrink-0 items-center gap-2 rounded-full border px-3 text-sm outline-none transition-colors touch-none select-none",
          "focus-visible:ring-2 focus-visible:ring-ring",
          active
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border bg-card text-foreground hover:bg-accent",
        )}
      >
        <span
          className="size-2.5 shrink-0 rounded-full border border-black/15"
          style={{ background: group.color }}
          aria-hidden
        />
        {group.name}
      </button>
      {menu
        ? createPortal(
            <GroupEditMenu
              group={group}
              x={menu.x}
              y={menu.y}
              onClose={() => {
                opened.current = false;
                setMenu(null);
              }}
            />,
            document.body,
          )
        : null}
    </>
  );
}

function GroupEditMenu({
  group,
  x,
  y,
  onClose,
}: {
  group: RoomGroup;
  x: number;
  y: number;
  onClose: () => void;
}) {
  const patchGroup = useAtlas((s) => s.patchGroup);
  const deleteGroup = useAtlas((s) => s.deleteGroup);
  const live = useAtlas((s) => s.groups.find((g) => g.id === group.id) ?? group);
  const panel = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    nameRef.current?.focus();
    nameRef.current?.select();
  }, []);

  useEffect(() => {
    function onDoc(e: PointerEvent) {
      if (panel.current?.contains(e.target as Node)) return;
      onCloseRef.current();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCloseRef.current();
    }
    window.addEventListener("pointerdown", onDoc, true);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onDoc, true);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div
      ref={panel}
      role="menu"
      aria-label={`Éditer ${live.name}`}
      style={{ left: x, top: y }}
      className="fixed z-50 w-[16.5rem] rounded-lg border border-border bg-card p-3 shadow-md"
    >
      <p className="mb-3 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
        Éditer le groupe
      </p>
      <div className="flex flex-col gap-2">
        <Label htmlFor={`group-name-${live.id}`}>Nom</Label>
        <Input
          ref={nameRef}
          id={`group-name-${live.id}`}
          value={live.name}
          onChange={(e) => patchGroup(live.id, { name: e.target.value })}
        />
        <ColorWheel
          id={`group-color-${live.id}`}
          value={live.color}
          onChange={(color) => patchGroup(live.id, { color })}
        />
      </div>
      <div className="mt-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full justify-start"
          {...pressProps(() => {
            deleteGroup(live.id);
            onClose();
          })}
        >
          <Trash2 className="size-4" />
          Supprimer
        </Button>
      </div>
    </div>
  );
}
