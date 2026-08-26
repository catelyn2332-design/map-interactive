import { Trash2 } from "lucide-react";
import { useEffect, useRef, type RefObject } from "react";
import { createPortal } from "react-dom";
import { ColorWheel } from "@/components/atlas/color-wheel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAtlas } from "@/lib/map/store";
import type { MapFixture, Room, ZoneFill } from "@/lib/map/types";
import { zoneHex, ZONE_FILLS, zoneCss, sanitizeHexColor } from "@/lib/map/types";
import { pressProps } from "@/lib/press";
import { cn } from "@/lib/utils";

export type PlanMenuTarget =
  | { kind: "room"; room: Room }
  | { kind: "mark"; mark: MapFixture };

export function PlanMenu({
  target,
  x,
  y,
  onClose,
}: {
  target: PlanMenuTarget;
  x: number;
  y: number;
  onClose: () => void;
}) {
  return createPortal(
    target.kind === "room" ? (
      <RoomMenu room={target.room} x={x} y={y} onClose={onClose} />
    ) : (
      <MarkMenu mark={target.mark} x={x} y={y} onClose={onClose} />
    ),
    document.body,
  );
}

function useMenuChrome(onClose: () => void, panel: RefObject<HTMLDivElement | null>) {
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
  }, [panel]);
  return nameRef;
}

function RoomMenu({
  room,
  x,
  y,
  onClose,
}: {
  room: Room;
  x: number;
  y: number;
  onClose: () => void;
}) {
  const patchRoom = useAtlas((s) => s.patchRoom);
  const deleteRoom = useAtlas((s) => s.deleteRoom);
  const live = useAtlas((s) => s.rooms.find((r) => r.id === room.id) ?? room);
  const panel = useRef<HTMLDivElement>(null);
  const nameRef = useMenuChrome(onClose, panel);

  return (
    <div
      ref={panel}
      role="menu"
      aria-label={`Éditer ${live.name}`}
      style={{ left: x, top: y }}
      className="fixed z-50 w-[16.5rem] rounded-lg border border-border bg-card p-3 shadow-md"
    >
      <p className="mb-3 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
        Éditer la pièce
      </p>
      <div className="flex flex-col gap-2">
        <Label htmlFor={`room-rename-${live.id}`}>Nom</Label>
        <Input
          ref={nameRef}
          id={`room-rename-${live.id}`}
          value={live.name}
          onChange={(e) => {
            const name = e.target.value;
            patchRoom(live.id, {
              name,
              label: name.trim().slice(0, 14) || live.label,
            });
          }}
        />
        <Label htmlFor={`room-label-${live.id}`}>Abrégé (plan)</Label>
        <Input
          id={`room-label-${live.id}`}
          value={live.label}
          maxLength={16}
          onChange={(e) =>
            patchRoom(live.id, { label: e.target.value || live.label })
          }
        />
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-3 w-full justify-start"
        onClick={() => {
          deleteRoom(live.id);
          onClose();
        }}
      >
        <Trash2 className="size-4" />
        Supprimer
      </Button>
    </div>
  );
}

function MarkMenu({
  mark,
  x,
  y,
  onClose,
}: {
  mark: MapFixture;
  x: number;
  y: number;
  onClose: () => void;
}) {
  const patchFixture = useAtlas((s) => s.patchFixture);
  const deleteFixture = useAtlas((s) => s.deleteFixture);
  const live = useAtlas((s) => s.fixtures.find((f) => f.id === mark.id) ?? mark);
  const panel = useRef<HTMLDivElement>(null);
  const nameRef = useMenuChrome(onClose, panel);
  const title =
    live.kind === "zone"
      ? "Éditer la zone"
      : live.kind === "door"
        ? "Éditer la porte"
        : live.kind === "window"
          ? "Éditer la fenêtre"
          : "Éditer l’escalier";

  return (
    <div
      ref={panel}
      role="menu"
      aria-label={title}
      style={{ left: x, top: y }}
      className="fixed z-50 w-[16.5rem] rounded-lg border border-border bg-card p-3 shadow-md"
    >
      <p className="mb-3 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
        {title}
      </p>
      <div className="flex flex-col gap-2">
        <Label htmlFor={`mark-name-${live.id}`}>Nom</Label>
        <Input
          ref={nameRef}
          id={`mark-name-${live.id}`}
          value={live.label ?? ""}
          placeholder={title.replace("Éditer ", "")}
          onChange={(e) =>
            patchFixture(live.id, { label: e.target.value || undefined })
          }
        />
      </div>
      {live.kind === "zone" ? (
        <div className="mt-3 flex flex-col gap-2">
          <ColorWheel
            id={`mark-color-${live.id}`}
            value={sanitizeHexColor(live.color) ?? zoneHex(live.fill)}
            onChange={(color) => patchFixture(live.id, { color })}
          />
          <p className="text-xs text-muted-foreground">Teintes rapides</p>
          <FillSwatches
            value={live.fill ?? "sage"}
            onChange={(fill) =>
              patchFixture(live.id, { fill, color: zoneHex(fill) })
            }
          />
        </div>
      ) : null}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-3 w-full justify-start"
        onClick={() => {
          deleteFixture(live.id);
          onClose();
        }}
      >
        <Trash2 className="size-4" />
        Supprimer
      </Button>
    </div>
  );
}

export function FillSwatches({
  value,
  onChange,
}: {
  value: ZoneFill;
  onChange: (fill: ZoneFill) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5" role="listbox" aria-label="Couleur de zone">
      {ZONE_FILLS.map((z) => {
        const on = value === z.id;
        return (
          <button
            key={z.id}
            type="button"
            role="option"
            aria-selected={on}
            aria-label={z.label}
            title={z.label}
            {...pressProps(() => onChange(z.id))}
            className={cn(
              "size-11 rounded-full border-2 transition-transform",
              on ? "border-foreground scale-110" : "border-transparent hover:scale-105",
            )}
            style={{ background: zoneCss(z.id) }}
          />
        );
      })}
    </div>
  );
}

export function clampMenu(x: number, y: number, w = 264, h = 280) {
  const pad = 8;
  return {
    x: Math.min(Math.max(pad, x), window.innerWidth - w - pad),
    y: Math.min(Math.max(pad, y), window.innerHeight - h - pad),
  };
}
