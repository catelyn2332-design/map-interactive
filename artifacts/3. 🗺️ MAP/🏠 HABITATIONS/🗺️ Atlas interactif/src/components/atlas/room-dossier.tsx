import {
  ArrowDown,
  ArrowUp,
  MapPin,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Chip } from "@/components/atlas/chip";
import { ColorWheel } from "@/components/atlas/color-wheel";
import { GuardBoundary } from "@/components/atlas/guard-boundary";
import { PhotoField } from "@/components/atlas/photo-field";
import { PrefsSaveBar } from "@/components/atlas/prefs-save-bar";
import { PropIcon } from "@/components/atlas/prop-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { floorById, roomById } from "@/lib/map/house";
import {
  formatProp,
  readExtra,
  readProp,
  tokenActors,
  tokensInRoom,
  uid,
  usesOptions,
} from "@/lib/map/props";
import { resolveRoom } from "@/lib/map/edits";
import { useAtlas } from "@/lib/map/store";
import { useUiStore } from "@/lib/map/ui";
import { pressProps } from "@/lib/press";
import { cn } from "@/lib/utils";
import type {
  MapFixture,
  MapPhoto,
  PropDef,
  PropPrimitive,
  PropValue,
  PropVar,
  Room,
  RoomStep,
} from "@/lib/map/types";
import { sanitizeHexColor, zoneHex } from "@/lib/map/types";

function badgeVariant(def: PropDef, optionId: string) {
  const tone = def.options.find((o) => o.id === optionId)?.tone;
  if (tone === "clay") return "clay" as const;
  if (tone === "sage") return "sage" as const;
  if (tone === "stone") return "muted" as const;
  return "outline" as const;
}

function PhotoStrip({ photos }: { photos?: MapPhoto[] }) {
  if (!photos?.length) return null;
  return (
    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {photos.map((photo) => (
        <li key={photo.id} className="overflow-hidden rounded-md border border-border">
          <img
            src={photo.src}
            alt={photo.name || "Photo"}
            className="aspect-[4/3] w-full object-cover"
          />
          {photo.name ? (
            <p className="truncate px-2 py-1 text-xs text-muted-foreground">{photo.name}</p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function PropField({
  def,
  value,
  onChange,
}: {
  def: PropDef;
  value: PropValue;
  onChange: (value: PropValue) => void;
}) {
  if (def.type === "longtext") {
    return (
      <Textarea
        value={typeof value === "string" ? value : ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={def.name}
        rows={4}
      />
    );
  }
  if (def.type === "text") {
    return (
      <Input
        value={typeof value === "string" ? value : ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={def.name}
      />
    );
  }
  if (def.type === "number") {
    return (
      <Input
        type="number"
        value={typeof value === "number" ? value : value === "" ? "" : Number(value) || ""}
        onChange={(e) => {
          const n = e.target.value;
          onChange(n === "" ? "" : Number(n));
        }}
        placeholder={def.name}
      />
    );
  }
  if (def.type === "toggle") {
    const on = value === true;
    return (
      <div className="flex flex-wrap gap-1.5">
        <Chip active={on} onClick={() => onChange(true)}>
          Oui
        </Chip>
        <Chip active={!on} onClick={() => onChange(false)}>
          Non
        </Chip>
      </div>
    );
  }
  if (def.type === "color") {
    const hex = typeof value === "string" ? value || "#6a7a58" : "#6a7a58";
    return (
      <ColorWheel
        id={`prop-color-${def.id}`}
        label=""
        value={hex}
        onChange={onChange}
      />
    );
  }
  if (def.type === "choice" || def.type === "token") {
    const current = typeof value === "string" ? value : "";
    return (
      <div className="flex flex-wrap gap-1.5">
        {def.options.map((opt) => (
          <Chip
            key={opt.id}
            active={current === opt.id}
            onClick={() => onChange(opt.id)}
          >
            {opt.label}
          </Chip>
        ))}
        {def.options.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Ajoutez des noms dans Propriétés.
          </p>
        ) : null}
      </div>
    );
  }
  const ids = Array.isArray(value) ? value : [];
  return (
    <div className="flex flex-wrap gap-1.5">
      {def.options.map((opt) => {
        const on = ids.includes(opt.id);
        return (
          <Chip
            key={opt.id}
            active={on}
            onClick={() =>
              onChange(on ? ids.filter((x) => x !== opt.id) : [...ids, opt.id])
            }
          >
            {opt.label}
          </Chip>
        );
      })}
    </div>
  );
}

function ExtraFields({
  def,
  room,
}: {
  def: PropDef;
  room: Room;
}) {
  const setRoomExtra = useAtlas((s) => s.setRoomExtra);
  if (!def.vars.length || usesOptions(def.type)) return null;
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {def.vars.map((v) => (
        <RoomVarInput
          key={v.id}
          variable={v}
          value={readExtra(room, def.id, v.id, v.kind)}
          onChange={(value) => setRoomExtra(room.id, def.id, v.id, value)}
        />
      ))}
    </div>
  );
}

function RoomVarInput({
  variable,
  value,
  onChange,
}: {
  variable: PropVar;
  value: PropPrimitive;
  onChange: (value: PropPrimitive) => void;
}) {
  if (variable.kind === "toggle") {
    const on = value === true;
    return (
      <div className="flex flex-col gap-1.5">
        <p className="text-xs text-muted-foreground">{variable.name}</p>
        <Chip active={on} onClick={() => onChange(!on)}>
          {on ? "Oui" : "Non"}
        </Chip>
      </div>
    );
  }
  if (variable.kind === "color") {
    return (
      <ColorWheel
        id={`extra-${variable.id}`}
        label={variable.name}
        value={typeof value === "string" ? value : "#6a7a58"}
        onChange={onChange}
      />
    );
  }
  if (variable.kind === "number") {
    return (
      <div className="flex flex-col gap-1.5">
        <Label>{variable.name}</Label>
        <Input
          type="number"
          value={typeof value === "number" ? value : Number(value) || 0}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{variable.name}</Label>
      <Input
        value={typeof value === "string" ? value : String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function RoomEditor({ room }: { room: Room }) {
  const patchRoom = useAtlas((s) => s.patchRoom);
  const setRoomProp = useAtlas((s) => s.setRoomProp);
  const resetRoom = useAtlas((s) => s.resetRoom);
  const deleteRoom = useAtlas((s) => s.deleteRoom);
  const schema = useAtlas((s) => s.schema);
  const floors = useAtlas((s) => s.floors);
  const rooms = useAtlas((s) => s.rooms);
  const tokens = useAtlas((s) => s.tokens);
  const characters = useAtlas((s) => s.characters);
  const setPlacingToken = useAtlas((s) => s.setPlacingToken);
  const steps = room.steps ?? [];
  const props = room.props ?? {};
  const photos = room.photos ?? [];
  const dirty =
    room.name !== "Pièce" ||
    Boolean(room.description.trim()) ||
    steps.length > 0 ||
    Object.keys(props).length > 0 ||
    photos.length > 0;

  function setSteps(next: RoomStep[]) {
    patchRoom(room.id, { steps: next });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="room-name">Titre</Label>
        <Input
          id="room-name"
          value={room.name}
          onChange={(e) => {
            const name = e.target.value;
            patchRoom(room.id, { name, label: name });
          }}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="room-desc">Description</Label>
        <Textarea
          id="room-desc"
          value={room.description}
          rows={6}
          onChange={(e) => patchRoom(room.id, { description: e.target.value })}
        />
      </div>

      <PhotoField
        photos={photos}
        onChange={(next) => patchRoom(room.id, { photos: next })}
      />

      <section className="flex flex-col gap-3">
        <Label>Étapes</Label>
        {steps.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucune étape. Ajoutez-en si la pièce a une liste à cocher.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {steps.map((step) => (
              <li key={step.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={step.done}
                  onChange={() =>
                    setSteps(
                      steps.map((s) =>
                        s.id === step.id ? { ...s, done: !s.done } : s,
                      ),
                    )
                  }
                  className="size-4 shrink-0 accent-primary"
                  aria-label={step.label || "Étape"}
                />
                <Input
                  value={step.label}
                  onChange={(e) =>
                    setSteps(
                      steps.map((s) =>
                        s.id === step.id ? { ...s, label: e.target.value } : s,
                      ),
                    )
                  }
                  placeholder="Intitulé de l’étape"
                  className="min-w-0 flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Retirer l’étape"
                  {...pressProps(() =>
                    setSteps(steps.filter((s) => s.id !== step.id)),
                  )}
                >
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="self-start"
          {...pressProps(() =>
            setSteps([...steps, { id: uid("step"), label: "", done: false }]),
          )}
        >
          <Plus className="size-4" />
          Ajouter une étape
        </Button>
      </section>

      {schema.length ? (
        <section className="flex flex-col gap-4">
          <Label>Propriétés</Label>
          {schema.map((def) => {
            if (def.type === "token") {
              const here = tokensInRoom(
                room.id,
                tokens,
                tokenActors(schema, characters),
              ).filter((a) => a.propId === def.id);
              return (
                <div key={def.id} className="flex flex-col gap-2">
                  <p className="flex items-center gap-2 text-xs text-muted-foreground">
                    <PropIcon id={def.icon} type={def.type} />
                    {def.name}
                  </p>
                  {here.length ? (
                    <div className="flex flex-wrap gap-1.5">
                      {here.map((a) => (
                        <Chip
                          key={a.id}
                          active
                          onClick={() => setPlacingToken(a.id)}
                        >
                          {a.name}
                        </Chip>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Aucun pion ici. Posez-les depuis Pions, sur le plan.
                    </p>
                  )}
                </div>
              );
            }
            return (
              <div key={def.id} className="flex flex-col gap-2">
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  <PropIcon id={def.icon} type={def.type} />
                  {def.name}
                </p>
                <PropField
                  def={def}
                  value={readProp(props, def)}
                  onChange={(value) => setRoomProp(room.id, def.id, value)}
                />
                <ExtraFields def={def} room={room} />
              </div>
            );
          })}
        </section>
      ) : null}

      {floors.length > 1 ? (
        <section className="flex flex-col gap-2">
          <Label>Liaison d’étage</Label>
          <div className="flex flex-wrap gap-1.5">
            {floors
              .filter((f) => f.id !== room.floorId)
              .map((f) => {
                const on = room.travel?.some((t) => t.toFloor === f.id);
                return (
                  <Chip
                    key={f.id}
                    active={Boolean(on)}
                    onClick={() => {
                      const travel = on
                        ? (room.travel ?? []).filter((t) => t.toFloor !== f.id)
                        : [
                            ...(room.travel ?? []),
                            {
                              toFloor: f.id,
                              label: `Vers ${f.name}`,
                              toRoom: rooms.find((r) => r.floorId === f.id)?.id,
                            },
                          ];
                      patchRoom(room.id, { travel });
                    }}
                  >
                    {f.name}
                  </Chip>
                );
              })}
          </div>
        </section>
      ) : null}

      {dirty ? (
        <Button
          type="button"
          variant="outline"
          {...pressProps(() => resetRoom(room.id))}
        >
          Vider les textes
        </Button>
      ) : null}

      <Button
        type="button"
        variant="outline"
        {...pressProps(() => deleteRoom(room.id))}
      >
        <Trash2 className="size-4" />
        Supprimer la pièce
      </Button>

      <PrefsSaveBar sticky={false} />
    </div>
  );
}

function ZoneEditor({ zone }: { zone: MapFixture }) {
  const patchFixture = useAtlas((s) => s.patchFixture);
  const deleteFixture = useAtlas((s) => s.deleteFixture);
  const title = zone.label ?? "Zone";
  const color = sanitizeHexColor(zone.color) ?? zoneHex(zone.fill);
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="zone-name">Titre</Label>
        <Input
          id="zone-name"
          value={title}
          onChange={(e) => {
            const name = e.target.value;
            patchFixture(zone.id, { label: name || "Zone" });
          }}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="zone-desc">Description</Label>
        <Textarea
          id="zone-desc"
          value={zone.description ?? ""}
          rows={6}
          onChange={(e) =>
            patchFixture(zone.id, { description: e.target.value })
          }
        />
      </div>
      <ColorWheel
        id={`zone-color-${zone.id}`}
        value={color}
        onChange={(next) => patchFixture(zone.id, { color: next })}
      />
      <PhotoField
        photos={zone.photos ?? []}
        onChange={(photos) => patchFixture(zone.id, { photos })}
      />
      <Button
        type="button"
        variant="outline"
        {...pressProps(() => deleteFixture(zone.id))}
      >
        <Trash2 className="size-4" />
        Supprimer la zone
      </Button>
      <PrefsSaveBar sticky={false} />
    </div>
  );
}

function ZoneDossier({ zone, className }: { zone: MapFixture; className?: string }) {
  const floors = useAtlas((s) => s.floors);
  const [editing, setEditing] = useState(false);
  const prevId = useRef(zone.id);
  useEffect(() => {
    if (prevId.current !== zone.id) {
      prevId.current = zone.id;
      setEditing(false);
    }
  }, [zone.id]);
  const floor = floorById(floors, zone.floorId);
  const title = zone.label ?? "Zone";
  return (
    <article className={cn("flex flex-col gap-5", className)}>
      <GuardBoundary label="Dossier de zone">
        <header className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              {floor?.name} · Zone
            </p>
            <Button
              type="button"
              variant={editing ? "default" : "outline"}
              size="sm"
              {...pressProps(() => setEditing((v) => !v))}
            >
              <Pencil className="size-4" />
              {editing ? "Lecture" : "Modifier"}
            </Button>
          </div>
          <h2 className="font-display text-2xl font-medium leading-tight tracking-[-0.03em] text-balance sm:text-3xl">
            {title}
          </h2>
        </header>
        {editing ? (
          <ZoneEditor zone={zone} />
        ) : (
          <>
            <PhotoStrip photos={zone.photos} />
            {zone.description?.trim() ? (
              <p className="text-base leading-relaxed text-pretty">
                {zone.description}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Pas encore de description. Touchez Modifier.
              </p>
            )}
            <PrefsSaveBar sticky={false} />
          </>
        )}
      </GuardBoundary>
    </article>
  );
}

export function RoomDossier({ className }: { className?: string }) {
  const selectedId = useAtlas((s) => s.selectedId);
  const selectedMarkId = useAtlas((s) => s.selectedMarkId);
  const select = useAtlas((s) => s.select);
  const rooms = useAtlas((s) => s.rooms);
  const floors = useAtlas((s) => s.floors);
  const schema = useAtlas((s) => s.schema);
  const fixtures = useAtlas((s) => s.fixtures);
  const setDrawShape = useAtlas((s) => s.setDrawShape);
  const [editing, setEditing] = useState(false);
  const prevId = useRef(selectedId);

  useEffect(() => {
    if (prevId.current !== selectedId) {
      prevId.current = selectedId;
      setEditing(false);
    }
  }, [selectedId]);

  const zone =
    selectedMarkId
      ? fixtures.find((f) => f.id === selectedMarkId && f.kind === "zone")
      : undefined;
  if (zone) {
    return <ZoneDossier zone={zone} className={className} />;
  }

  const room = selectedId
    ? resolveRoom(selectedId, rooms, schema)
    : undefined;
  if (!room) {
    const emptyPlan = useUiStore.getState().copy.emptyPlan;
    return (
      <div className={cn("py-12", className)}>
        <p className="max-w-sm text-sm text-muted-foreground text-pretty">
          {emptyPlan}
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-4"
          {...pressProps(() => setDrawShape("rect"))}
        >
          <Plus className="size-4" />
          Tracer une pièce
        </Button>
      </div>
    );
  }

  const floor = floorById(floors, room.floorId);
  const props = room.props ?? {};
  const steps = room.steps ?? [];

  return (
    <article className={cn("flex flex-col gap-5", className)}>
      <GuardBoundary label="Dossier de pièce">
      <header className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            {floor?.name}
          </p>
          <Button
            type="button"
            variant={editing ? "default" : "outline"}
            size="sm"
            {...pressProps(() => setEditing((v) => !v))}
          >
            <Pencil className="size-4" />
            {editing ? "Lecture" : "Modifier"}
          </Button>
        </div>
        <h2 className="font-display text-2xl font-medium leading-tight tracking-[-0.03em] text-balance sm:text-3xl">
          {room.name}
        </h2>
        <div className="flex flex-wrap gap-1.5">
          {schema.flatMap((def) => {
            const value = readProp(props, def);
            if (def.type === "choice" && typeof value === "string" && value) {
              return [
                <Badge key={def.id} variant={badgeVariant(def, value)}>
                  <span className="inline-flex items-center gap-1">
                    <PropIcon id={def.icon} type={def.type} className="size-3" />
                    {formatProp(def, value)[0]}
                  </span>
                </Badge>,
              ];
            }
            if (def.type === "tags" && Array.isArray(value)) {
              return value.map((id) => (
                <Badge key={`${def.id}-${id}`} variant="outline">
                  {def.options.find((o) => o.id === id)?.label ?? id}
                </Badge>
              ));
            }
            if (def.type === "toggle") {
              if (value !== true) return [];
              return [
                <Badge key={def.id} variant="sage">
                  {def.name}
                </Badge>,
              ];
            }
            if (def.type === "number" && (typeof value === "number" || (typeof value === "string" && value))) {
              return [
                <Badge key={def.id} variant="muted">
                  {def.name} · {value}
                </Badge>,
              ];
            }
            if (
              (def.type === "text" || def.type === "longtext" || def.type === "color") &&
              typeof value === "string" &&
              value.trim()
            ) {
              return [
                <Badge key={def.id} variant="muted">
                  {def.name} · {value}
                </Badge>,
              ];
            }
            return [];
          })}
        </div>
      </header>

      {editing ? (
        <RoomEditor room={room} />
      ) : (
        <>
          <PhotoStrip photos={room.photos} />
          {room.description ? (
            <p className="text-base leading-relaxed text-pretty">
              {room.description}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Pas encore de description. Touchez Modifier.
            </p>
          )}
          {steps.length ? (
            <ul className="flex flex-col gap-2">
              {steps.map((step) => (
                <li key={step.id} className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={step.done}
                    onChange={() => {
                      const next = steps.map((s) =>
                        s.id === step.id ? { ...s, done: !s.done } : s,
                      );
                      useAtlas.getState().patchRoom(room.id, { steps: next });
                    }}
                    className="mt-1 size-4 shrink-0 accent-primary"
                  />
                  <span
                    className={cn(
                      "text-base leading-relaxed",
                      step.done && "text-muted-foreground line-through",
                    )}
                  >
                    {step.label || "Étape"}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
          <PrefsSaveBar sticky={false} />
        </>
      )}

      {room.travel?.length ? (
        <div className="flex flex-col gap-2">
          {room.travel.map((t) => (
            <Button
              key={t.label}
              variant="secondary"
              className="justify-between"
              {...pressProps(() => select(t.toRoom ?? room.id))}
            >
              <span>{t.label}</span>
              {(floorById(floors, t.toFloor)?.order ?? 0) >
              (floorById(floors, room.floorId)?.order ?? 0) ? (
                <ArrowUp className="size-4" />
              ) : (
                <ArrowDown className="size-4" />
              )}
            </Button>
          ))}
        </div>
      ) : null}

      {room.connections.length ? (
        <section className="flex flex-col gap-2">
          <Separator />
          <h3 className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Voisines
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {room.connections.map((id) => {
              const other = roomById(rooms, id);
              if (!other) return null;
              return (
                <button
                  key={id}
                  type="button"
                  {...pressProps(() => select(id))}
                  className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs hover:bg-accent"
                >
                  <MapPin className="size-3" />
                  {other.name}
                </button>
              );
            })}
          </div>
        </section>
      ) : null}
      </GuardBoundary>
    </article>
  );
}
