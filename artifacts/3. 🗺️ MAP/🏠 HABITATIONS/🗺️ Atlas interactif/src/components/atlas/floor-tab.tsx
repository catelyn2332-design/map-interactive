import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FloorMeta } from "@/lib/map/types";
import { useAtlas } from "@/lib/map/store";
import { cn } from "@/lib/utils";

export function FloorTab({ floor, active }: { floor: FloorMeta; active: boolean }) {
  const setFloor = useAtlas((s) => s.setFloor);
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
        aria-haspopup="menu"
        aria-expanded={Boolean(menu)}
        title={`${floor.name} — clic droit pour éditer`}
        onClick={() => {
          if (opened.current) {
            opened.current = false;
            return;
          }
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
          if (e.pointerType !== "mouse") {
            hold.current = window.setTimeout(() => {
              setFloor(floor.id);
              openAt(e.clientX, e.clientY);
            }, 480);
          }
        }}
        onPointerMove={(e) => {
          if (!hold.current) return;
          if (Math.hypot(e.clientX - start.current.x, e.clientY - start.current.y) > 12) {
            clearHold();
          }
        }}
        onPointerUp={clearHold}
        onPointerCancel={clearHold}
        className={cn(
          "h-11 shrink-0 rounded-full border px-3.5 text-sm transition-colors touch-manipulation",
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
  const moveFloor = useAtlas((s) => s.moveFloor);
  const deleteFloor = useAtlas((s) => s.deleteFloor);
  const index = floors.findIndex((f) => f.id === floor.id);
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
      <div className="mt-3 flex flex-col gap-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="justify-start"
          disabled={index <= 0}
          onClick={() => moveFloor(floor.id, -1)}
        >
          <ArrowUp className="size-4" />
          Monter
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="justify-start"
          disabled={index < 0 || index >= floors.length - 1}
          onClick={() => moveFloor(floor.id, 1)}
        >
          <ArrowDown className="size-4" />
          Descendre
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="justify-start"
          disabled={floors.length <= 1}
          onClick={() => {
            deleteFloor(floor.id);
            onClose();
          }}
        >
          <Trash2 className="size-4" />
          Supprimer
        </Button>
      </div>
    </div>
  );
}
