import {
  AppWindow,
  ChevronDown,
  Circle,
  CornerRightDown,
  DoorOpen,
  Hexagon,
  IterationCw,
  MapPin,
  PenLine,
  Plus,
  Redo2,
  RotateCw,
  Square,
  ChevronsUp,
  Trash2,
  Undo2,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppHeader } from "@/components/atlas/app-header";
import { EditableTitle } from "@/components/atlas/editable-title";
import { FloorPlan } from "@/components/atlas/floor-plan";
import { FloorTabList } from "@/components/atlas/floor-tab";
import { GuardBoundary } from "@/components/atlas/guard-boundary";
import { MapFilter, SceneBar } from "@/components/atlas/map-filter";
import { Panel } from "@/components/atlas/panel";
import { RoomDossier } from "@/components/atlas/room-dossier";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TooltipProvider } from "@/components/ui/tooltip";
import { floorById, roomById, roomsOnFloor } from "@/lib/map/house";
import { tokenActors } from "@/lib/map/props";
import { sessionMarkdown } from "@/lib/map/session";
import { hydratePrefs } from "@/lib/map/prefs";
import { ensureRoomSelected, useAtlas } from "@/lib/map/store";
import { applyCoffreToLocal } from "@/lib/progress/sync";
import { useUiStore } from "@/lib/map/ui";
import type { DrawShape, FixtureKind, GroundKind, MapTool, StairStyle } from "@/lib/map/types";
import {
  GROUND_KINDS,
  groundFill,
  groundMeta,
  sanitizeHexColor,
  STAIR_STYLES,
} from "@/lib/map/types";
import { pressProps } from "@/lib/press";
import { cn } from "@/lib/utils";

const SHAPES: Array<{ id: DrawShape; label: string; hint: string; Icon: typeof Square }> = [
  { id: "rect", label: "Rectangle", hint: "Glissez un rectangle", Icon: Square },
  { id: "ellipse", label: "Ellipse", hint: "Glissez une ellipse", Icon: Circle },
  { id: "polygon", label: "Polygone", hint: "Sommets un à un", Icon: Hexagon },
  { id: "line", label: "Tracer une ligne", hint: "Glissez, relâchez, fermez au départ", Icon: PenLine },
];

const MARKS: Array<{ id: Exclude<FixtureKind, "stair" | "zone" | "ground">; label: string; Icon: typeof DoorOpen }> = [
  { id: "door", label: "Porte", Icon: DoorOpen },
  { id: "window", label: "Fenêtre", Icon: AppWindow },
];

const STAIR_ICONS: Record<StairStyle, typeof ChevronsUp> = {
  straight: ChevronsUp,
  spiral: RotateCw,
  quarter: CornerRightDown,
  switchback: IterationCw,
};

export function AtlasApp({ urlFloor }: { urlFloor?: string } = {}) {
  if (urlFloor) {
    const st = useAtlas.getState();
    if (st.floorId !== urlFloor && st.floors.some((f) => f.id === urlFloor)) {
      useAtlas.setState({ floorId: urlFloor });
    }
  }
  const floorId = useAtlas((s) => s.floorId);
  const floors = useAtlas((s) => s.floors);
  const rooms = useAtlas((s) => s.rooms);
  const wander = useAtlas((s) => s.wander);
  const resetSession = useAtlas((s) => s.resetSession);
  const selectedId = useAtlas((s) => s.selectedId);
  const tool = useAtlas((s) => s.tool);
  const setTool = useAtlas((s) => s.setTool);
  const drawShape = useAtlas((s) => s.drawShape);
  const setDrawShape = useAtlas((s) => s.setDrawShape);
  const stairStyle = useAtlas((s) => s.stairStyle);
  const setStairStyle = useAtlas((s) => s.setStairStyle);
  const undo = useAtlas((s) => s.undo);
  const redo = useAtlas((s) => s.redo);
  const canUndo = useAtlas((s) => s.history.length > 0);
  const canRedo = useAtlas((s) => s.future.length > 0);
  const [copied, setCopied] = useState(false);
  const addGroup = useAtlas((s) => s.addGroup);

  useEffect(() => {
    (window as Window & { __ATLAS_LIVE?: boolean }).__ATLAS_LIVE = true;
    const live = useAtlas.getState();
    if (live.rooms.length === 0 && live.fixtures.length === 0) {
      applyCoffreToLocal((patch) => {
        useAtlas.setState({ ...patch, filters: {}, tool: "select" });
      });
    }
    const wanted = new URLSearchParams(window.location.search).get("e");
    if (wanted) {
      const next = useAtlas.getState();
      if (next.floors.some((f) => f.id === wanted)) next.setFloor(wanted);
    }
    void hydratePrefs().then(() => {
      ensureRoomSelected();
    });
  }, []);
  const [shapeOpen, setShapeOpen] = useState(false);
  const [stairOpen, setStairOpen] = useState(false);
  const [groundOpen, setGroundOpen] = useState(false);
  const roomWord = useUiStore((s) => s.copy.roomWord);
  const copy = useUiStore((s) => s.copy);
  const setCopy = useUiStore((s) => s.setCopy);
  const mapFullscreen = useUiStore((s) => s.mapFullscreen);
  const stance = useUiStore((s) => s.stance);
  const setStance = useUiStore((s) => s.setStance);
  const play = stance === "partie";
  const groundKind = useAtlas((s) => s.groundKind ?? "meadow");
  const setGroundKind = useAtlas((s) => s.setGroundKind);
  const palette = useUiStore((s) => s.chrome.groundPalette);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement | null)?.tagName;
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
  const roomsHere = roomsOnFloor(rooms, floorId);
  const activeShape = SHAPES.find((s) => s.id === drawShape) ?? SHAPES[0]!;
  const drawing = tool === "draw";
  const StairIcon = STAIR_ICONS[stairStyle] ?? ChevronsUp;
  const stairing = tool === "stair";

  async function copySession() {
    const {
      tokens,
      notes,
      sceneRoomId,
      floors: fl,
      rooms: rm,
      characters,
    } = useAtlas.getState();
    const md = sessionMarkdown({
      floorId,
      sceneRoomId,
      tokens,
      notes,
      selectedId,
      rooms: rm,
      floors: fl,
      characters,
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

  function pickShape(shape: DrawShape) {
    setDrawShape(shape);
    setShapeOpen(false);
  }

  function toggleMark(kind: FixtureKind) {
    setTool(tool === kind ? "select" : kind);
  }

  function toggleZone() {
    setTool(tool === "zone" ? "select" : "zone");
  }

  function toggleGround() {
    setTool(tool === "ground" ? "select" : "ground");
  }

  function pickGround(kind: GroundKind) {
    setGroundKind(kind);
    setGroundOpen(false);
  }

  function pickStance(next: "atelier" | "partie") {
    setStance(next);
    if (next === "partie") {
      const t = useAtlas.getState().tool;
      if (t !== "select" && t !== "token") useAtlas.getState().setTool("select");
    }
  }

  const hint = toolHint(tool, drawShape, roomsHere.length, play);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-dvh bg-background text-foreground">
        {mapFullscreen ? (
          <div className="fixed inset-0 z-50 bg-paper">
            <GuardBoundary label="Le plan">
              <FloorPlan />
            </GuardBoundary>
          </div>
        ) : null}
        <header className={cn("border-b border-border", mapFullscreen && "hidden")}>
          <div className="mx-auto flex h-12 w-full max-w-4xl items-center px-4 sm:px-6">
            <AppHeader
              copied={copied}
              onWander={() => {
                const id = wander();
                if (id) {
                  const room = roomById(useAtlas.getState().rooms, id);
                  toast.message(room?.name ?? "Pièce inconnue");
                } else {
                  toast.message("Aucune pièce sur cet étage");
                }
              }}
              onCopy={() => void copySession()}
              onReset={() => {
                resetSession();
                toast.message("Session réinitialisée");
              }}
            />
          </div>
        </header>

        <main className={cn("mx-auto w-full max-w-3xl px-4 pb-24 pt-4 sm:max-w-4xl sm:px-6", mapFullscreen && "hidden")}>
          <FloorTabList />

          <Panel
            titleId="map"
            fallback="Map"
            className="mt-2"
            bodyClassName="flex-col items-stretch gap-2"
          >
            <div className="flex flex-wrap items-center gap-1.5">
              <div
                className="inline-flex rounded-md border border-border p-0.5"
                role="radiogroup"
                aria-label="Mode"
              >
                <Button
                  type="button"
                  size="sm"
                  variant={play ? "ghost" : "default"}
                  className="h-9 rounded-sm px-3"
                  aria-pressed={!play}
                  aria-label={copy.modeAtelier}
                  {...pressProps(() => pickStance("atelier"))}
                >
                  <EditableTitle
                    as="span"
                    value={copy.modeAtelier}
                    onChange={(modeAtelier) => setCopy({ modeAtelier })}
                  />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={play ? "default" : "ghost"}
                  className="h-9 rounded-sm px-3"
                  aria-pressed={play}
                  aria-label={copy.modePartie}
                  {...pressProps(() => pickStance("partie"))}
                >
                  <EditableTitle
                    as="span"
                    value={copy.modePartie}
                    onChange={(modePartie) => setCopy({ modePartie })}
                  />
                </Button>
              </div>
              <MapFilter />
              <SceneBar />
              <Button
                type="button"
                variant="icon"
                size="icon"
                className="size-9"
                aria-label="Annuler"
                disabled={!canUndo}
                {...pressProps(() => undo())}
              >
                <Undo2 className="size-4" />
              </Button>
              <Button
                type="button"
                variant="icon"
                size="icon"
                className="size-9"
                aria-label="Rétablir"
                disabled={!canRedo}
                {...pressProps(() => redo())}
              >
                <Redo2 className="size-4" />
              </Button>

              {!play ? (
                <>
                  <div className="inline-flex">
                    <Button
                      type="button"
                      variant={drawing ? "default" : "icon"}
                      size="icon"
                      className="size-9 rounded-r-none"
                      aria-label={`${roomWord} — ${activeShape.hint}`}
                      aria-pressed={drawing}
                      {...pressProps(toggleDraw)}
                    >
                      <activeShape.Icon className="size-4" />
                    </Button>
                    <Popover open={shapeOpen} onOpenChange={setShapeOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant={drawing ? "default" : "icon"}
                          size="icon"
                          className="h-9 w-8 rounded-l-none"
                          aria-label="Forme de pièce"
                          aria-expanded={shapeOpen}
                          aria-haspopup="menu"
                        >
                          <ChevronDown className="size-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-52 p-1" align="start">
                        {SHAPES.map((shape) => {
                          const on = drawing && drawShape === shape.id;
                          return (
                            <button
                              key={shape.id}
                              type="button"
                              role="menuitem"
                              className={cn(
                                "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-accent",
                                on && "bg-accent",
                              )}
                              aria-label={shape.label}
                              {...pressProps(() => pickShape(shape.id))}
                            >
                              <shape.Icon className="size-4" />
                              <span className="flex-1">{shape.label}</span>
                            </button>
                          );
                        })}
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="inline-flex">
                    <Button
                      type="button"
                      variant={tool === "ground" ? "default" : "icon"}
                      size="icon"
                      className="size-9 rounded-r-none"
                      aria-label={`Peindre le sol — ${groundMeta(groundKind).label}`}
                      aria-pressed={tool === "ground"}
                      {...pressProps(toggleGround)}
                    >
                      <span
                        className="size-3.5 shrink-0 rounded-full border border-border"
                        style={{ background: groundFill(groundKind, palette) }}
                        aria-hidden
                      />
                    </Button>
                    <Popover open={groundOpen} onOpenChange={setGroundOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant={tool === "ground" ? "default" : "icon"}
                          size="icon"
                          className="h-9 w-8 rounded-l-none"
                          aria-label="Type de sol"
                          aria-expanded={groundOpen}
                          aria-haspopup="menu"
                        >
                          <ChevronDown className="size-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-52 p-1" align="start">
                        {GROUND_KINDS.map((g) => {
                          const on = tool === "ground" && groundKind === g.id;
                          return (
                            <button
                              key={g.id}
                              type="button"
                              role="menuitem"
                              className={cn(
                                "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-accent",
                                on && "bg-accent",
                              )}
                              aria-label={g.label}
                              {...pressProps(() => pickGround(g.id))}
                            >
                              <span
                                className="size-3.5 shrink-0 rounded-full border border-border"
                                style={{ background: groundFill(g.id, palette) }}
                                aria-hidden
                              />
                              <span className="flex-1">{g.label}</span>
                            </button>
                          );
                        })}
                      </PopoverContent>
                    </Popover>
                  </div>

                  <Button
                    type="button"
                    variant={tool === "zone" ? "default" : "icon"}
                    size="icon"
                    className="size-9"
                    aria-label="Repère — un lieu autour de la maison"
                    aria-pressed={tool === "zone"}
                    {...pressProps(toggleZone)}
                  >
                    <MapPin className="size-4" />
                  </Button>
                  {MARKS.map((mark) => {
                    const on = tool === mark.id;
                    return (
                      <Button
                        key={mark.id}
                        type="button"
                        variant={on ? "default" : "icon"}
                        size="icon"
                        className="size-9"
                        aria-label={mark.label}
                        aria-pressed={on}
                        {...pressProps(() => toggleMark(mark.id))}
                      >
                        <mark.Icon className="size-4" />
                      </Button>
                    );
                  })}
                  <div className="inline-flex">
                    <Button
                      type="button"
                      variant={stairing ? "default" : "icon"}
                      size="icon"
                      className="size-9 rounded-r-none"
                      aria-label="Escalier"
                      aria-pressed={stairing}
                      {...pressProps(() => setTool(stairing ? "select" : "stair"))}
                    >
                      <StairIcon className="size-4" />
                    </Button>
                    <Popover open={stairOpen} onOpenChange={setStairOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant={stairing ? "default" : "icon"}
                          size="icon"
                          className="h-9 w-8 rounded-l-none"
                          aria-label="Type d’escalier"
                          aria-expanded={stairOpen}
                          aria-haspopup="menu"
                        >
                          <ChevronDown className="size-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-60 p-1" align="start">
                        {STAIR_STYLES.map((item) => {
                          const Icon = STAIR_ICONS[item.id];
                          const on = stairing && stairStyle === item.id;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              role="menuitem"
                              className={cn(
                                "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-accent",
                                on && "bg-accent",
                              )}
                              aria-label={item.label}
                              {...pressProps(() => {
                                setStairStyle(item.id);
                                setStairOpen(false);
                              })}
                            >
                              <Icon className="size-4" />
                              <span className="flex-1">
                                <span className="block">{item.label}</span>
                                <span className="block text-xs text-muted-foreground">
                                  {item.hint}
                                </span>
                              </span>
                            </button>
                          );
                        })}
                      </PopoverContent>
                    </Popover>
                  </div>
                </>
              ) : null}

              <PionsButton />
            </div>

            <figure className="overflow-hidden rounded-md border border-border bg-paper">
              <div className="relative h-72 sm:h-80 lg:h-96">
                <GuardBoundary label="Le plan">
                  <FloorPlan />
                </GuardBoundary>
              </div>
              <figcaption className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-3 py-2 text-xs text-muted-foreground">
                <FloorCaption />
                <span>{hint}</span>
              </figcaption>
            </figure>
          </Panel>

          {floor?.blurb ? (
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground text-pretty">
              {floor.blurb}
            </p>
          ) : null}

          <Panel
            titleId="dossier"
            fallback="Dossier"
            className="mt-6"
            bodyClassName="flex-col items-stretch"
          >
            <div id="dossier">
              <RoomDossier />
            </div>
          </Panel>
        </main>
      </div>
    </TooltipProvider>
  );
}

function PionsButton() {
  const characters = useAtlas((s) => s.characters);
  const schema = useAtlas((s) => s.schema);
  const setSchema = useAtlas((s) => s.setSchema);
  const tool = useAtlas((s) => s.tool);
  const placingTokenId = useAtlas((s) => s.placingTokenId);
  const addCharacter = useAtlas((s) => s.addCharacter);
  const patchCharacter = useAtlas((s) => s.patchCharacter);
  const deleteCharacter = useAtlas((s) => s.deleteCharacter);
  const setPlacingToken = useAtlas((s) => s.setPlacingToken);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const actors = tokenActors(schema, characters);
  const tokenDef = schema.find((d) => d.type === "token");

  function addNamed() {
    const id = addCharacter(draft);
    setDraft("");
    setOpen(false);
    if (id) toast.message("Touchez le plan pour poser le pion");
  }

  function renameActor(id: string, name: string) {
    const actor = actors.find((a) => a.id === id);
    if (actor?.propId) {
      setSchema(
        schema.map((d) =>
          d.id !== actor.propId
            ? d
            : {
                ...d,
                options: d.options.map((o) =>
                  o.id === id ? { ...o, label: name } : o,
                ),
              },
        ),
      );
      return;
    }
    patchCharacter(id, { name });
  }

  function removeActor(id: string) {
    const actor = actors.find((a) => a.id === id);
    if (actor?.propId) {
      setSchema(
        schema.map((d) =>
          d.id !== actor.propId
            ? d
            : { ...d, options: d.options.filter((o) => o.id !== id) },
        ),
      );
      return;
    }
    deleteCharacter(id);
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          const live = useAtlas.getState();
          const who = live.placingTokenId ?? live.characters[live.characters.length - 1]?.id;
          if (who) live.setPlacingToken(who);
          else live.setTool("token");
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant={tool === "token" ? "default" : "icon"}
          size="icon"
          className="size-9"
          aria-label="Pions"
          aria-pressed={tool === "token"}
        >
          <Users className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="start">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Pions
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {tokenDef
            ? `Propriété « ${tokenDef.name} » — variables dans Paramètres.`
            : "Astuce : une propriété de type Pions dans Paramètres permet d’ajouter couleur, initiale, rôle…"}
        </p>
        <div className="mt-2 flex flex-col gap-2">
          {actors.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucun pion. Nommez-en un, puis posez-le sur le plan.
            </p>
          ) : (
            actors.map((c) => (
              <div key={c.id} className="flex items-center gap-1.5">
                <input
                  type="color"
                  value={sanitizeHexColor(c.color) ?? "#3f5344"}
                  aria-label={`Couleur de ${c.name}`}
                  className="h-9 w-9 shrink-0 cursor-pointer appearance-none rounded-md border border-border bg-card p-0.5"
                  onChange={(e) => {
                    const hex = e.target.value;
                    if (c.propId && tokenDef) {
                      setSchema(
                        schema.map((d) =>
                          d.id !== tokenDef.id
                            ? d
                            : {
                                ...d,
                                options: d.options.map((o) =>
                                  o.id !== c.id
                                    ? o
                                    : { ...o, vars: { ...(o.vars ?? {}), color: hex } },
                                ),
                              },
                        ),
                      );
                    } else {
                      patchCharacter(c.id, { color: hex });
                    }
                  }}
                />
                <Input
                  value={c.name}
                  aria-label={`Nom du pion ${c.short}`}
                  className="h-9"
                  onChange={(e) => renameActor(c.id, e.target.value)}
                />
                <Button
                  type="button"
                  size="icon"
                  variant={placingTokenId === c.id && tool === "token" ? "default" : "icon"}
                  className="size-9"
                  aria-label={`Poser ${c.name}`}
                  {...pressProps(() => {
                    setPlacingToken(c.id);
                    setOpen(false);
                    toast.message("Touchez le plan pour poser le pion");
                  })}
                >
                  <MapPin className="size-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="icon"
                  className="size-9"
                  aria-label={`Supprimer ${c.name}`}
                  {...pressProps(() => removeActor(c.id))}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))
          )}
        </div>
        <form
          className="mt-3 flex gap-1.5"
          onSubmit={(e) => {
            e.preventDefault();
            addNamed();
          }}
        >
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Nom du pion"
            aria-label="Nom du pion"
            className="h-9"
          />
          <Button type="submit" size="icon" variant="icon" className="size-9" aria-label="Ajouter un pion">
            <Plus className="size-4" />
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  );
}

function toolHint(tool: MapTool, shape: DrawShape, roomCount: number, play: boolean) {
  if (tool === "draw") {
    if (shape === "polygon") return "Touchez pour poser un sommet · Entrée pour fermer";
    if (shape === "line") return "Glissez un segment droit, relâchez pour le poser · touchez le départ pour fermer";
    if (shape === "ellipse") return "Glissez une ellipse";
    return "Glissez un rectangle sur le plan";
  }
  if (tool === "zone") return "Lasso autour de la maison — un repère transparent";
  if (tool === "ground") return "Pinceau sur le fond — recouvre ou gomme, comme un tableau";
  if (tool === "door") return "Approchez un mur — la porte s’aligne et s’y colle";
  if (tool === "window") return "Glissez le long d’un mur — la fenêtre s’y cale";
  if (tool === "stair") return "Collez l’escalier au mur d’une pièce, puis reliez l’étage";
  if (tool === "token") return "Touchez le plan pour poser le pion";
  if (play) return "Touchez une pièce ou un repère · les pions se déplacent";
  if (roomCount) return "Touchez une pièce · clic droit pour renommer";
  return "Peignez le sol, puis tracez la maison et ses repères";
}

function FloorCaption() {
  const floorId = useAtlas((s) => s.floorId);
  const floors = useAtlas((s) => s.floors);
  const patchFloor = useAtlas((s) => s.patchFloor);
  const floor = floorById(floors, floorId);
  if (!floor) return <span>Plan</span>;
  return (
    <EditableTitle
      as="span"
      value={floor.name}
      onChange={(name) =>
        patchFloor(floor.id, {
          name,
          short: name.trim().slice(0, 10) || floor.short,
        })
      }
      className="font-medium text-foreground"
      placeholder="Étage"
    />
  );
}
