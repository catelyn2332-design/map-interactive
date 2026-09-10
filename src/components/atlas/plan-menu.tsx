import { Check, ChevronDown, Plus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import { ColorWheel } from "@/components/atlas/color-wheel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAtlas } from "@/lib/map/store";
import { groupIdsOf } from "@/lib/map/house";
import type { GroundKind, MapFixture, Room, ZoneFill } from "@/lib/map/types";
import { zoneHex, ZONE_FILLS, zoneCss, sanitizeHexColor, GROUND_KINDS, groundFill } from "@/lib/map/types";
import { useUiStore } from "@/lib/map/ui";
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
      const node = e.target as Node | null;
      if (panel.current?.contains(node)) return;
      if ((e.target as HTMLElement | null)?.closest?.('[role="menu"]')) return;
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
  const groups = useAtlas((s) => s.groups ?? []);
  const toggleRoomGroup = useAtlas((s) => s.toggleRoomGroup);
  const live = useAtlas((s) => s.rooms.find((r) => r.id === room.id) ?? room);
  const panel = useRef<HTMLDivElement>(null);
  const nameRef = useMenuChrome(onClose, panel);
  const [assignOpen, setAssignOpen] = useState(false);
  const memberOf = groupIdsOf(live);

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
      <button
        type="button"
        aria-expanded={assignOpen}
        className="mt-3 flex h-11 w-full items-center gap-2 rounded-md border border-border bg-card px-3 text-left text-sm hover:bg-accent"
        {...pressProps(() => setAssignOpen((v) => !v))}
      >
        <Plus className="size-4 shrink-0" />
        <span className="min-w-0 flex-1 truncate">Ajouter à un groupe</span>
        <ChevronDown
          className={cn("size-4 shrink-0 text-muted-foreground transition-transform", assignOpen && "rotate-180")}
        />
      </button>
      {assignOpen ? (
        <ul className="mt-1.5 flex flex-col gap-0.5 rounded-md border border-border p-1">
          {groups.length === 0 ? (
            <li className="px-2 py-2 text-xs text-muted-foreground">
              Aucun groupe. Créez-en un avec le + sous les étages.
            </li>
          ) : (
            groups.map((g) => {
              const on = memberOf.includes(g.id);
              return (
                <li key={g.id}>
                  <button
                    type="button"
                    role="menuitemcheckbox"
                    aria-checked={on}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-accent",
                      on && "bg-accent",
                    )}
                    {...pressProps(() => toggleRoomGroup(live.id, g.id))}
                  >
                    <span
                      className="size-2.5 shrink-0 rounded-full border border-black/15"
                      style={{ background: g.color }}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1 truncate">{g.name}</span>
                    {on ? <Check className="size-3.5 shrink-0" /> : null}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      ) : null}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-3 w-full justify-start"
        {...pressProps(() => {
          deleteRoom(live.id);
          onClose();
        })}
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
      ? "Éditer le repère"
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
        {...pressProps(() => {
          deleteFixture(live.id);
          onClose();
        })}
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

export function GroundSwatches({
  value,
  onChange,
}: {
  value: GroundKind;
  onChange: (kind: GroundKind) => void;
}) {
  const palette = useUiStore((s) => s.chrome.groundPalette);
  return (
    <div className="flex flex-wrap gap-1.5" role="listbox" aria-label="Type de sol">
      {GROUND_KINDS.map((g) => {
        const on = value === g.id;
        const fill = groundFill(g.id, palette);
        return (
          <button
            key={g.id}
            type="button"
            role="option"
            aria-selected={on}
            aria-label={g.label}
            title={g.label}
            {...pressProps(() => onChange(g.id))}
            className={cn(
              "flex size-11 flex-col items-center justify-center rounded-md border-2 text-[9px] font-medium leading-none",
              on ? "border-foreground scale-105" : "border-transparent hover:scale-105",
            )}
            style={{ background: fill, color: g.ink }}
          >
            {g.label.slice(0, 4)}
          </button>
        );
      })}
    </div>
  );
}

export function clampMenu(x: number, y: number, w = 264, h = 360) {
  const pad = 8;
  return {
    x: Math.min(Math.max(pad, x), window.innerWidth - w - pad),
    y: Math.min(Math.max(pad, y), window.innerHeight - h - pad),
  };
}
