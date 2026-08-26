import {
  AppWindow,
  ChevronDown,
  Circle,
  CornerRightDown,
  DoorOpen,
  Hexagon,
  IterationCw,
  MapPin,
  PaintBucket,
  PenLine,
  Plus,
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
import { FloorPlan } from "@/components/atlas/floor-plan";
import { FloorTab } from "@/components/atlas/floor-tab";
import { GuardBoundary } from "@/components/atlas/guard-boundary";
import { MapFilter } from "@/components/atlas/map-filter";
import { RoomDossier } from "@/components/atlas/room-dossier";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TooltipProvider } from "@/components/ui/tooltip";
import { floorById, roomById } from "@/lib/map/house";
import { newOption, tokenActors } from "@/lib/map/props";
import { sessionMarkdown } from "@/lib/map/session";
import { subscribePersistPulse, useAtlas } from "@/lib/map/store";
import { useUiStore } from "@/lib/map/ui";
import type { DrawShape, FixtureKind, MapTool, StairStyle } from "@/lib/map/types";
import { STAIR_STYLES } from "@/lib/map/types";
import { pressProps } from "@/lib/press";
import { cn } from "@/lib/utils";

const SHAPES: Array<{ id: DrawShape; label: string; hint: string; Icon: typeof Square }> = [
  { id: "rect", label: "Rectangle", hint: "Glissez un rectangle", Icon: Square },
  { id: "ellipse", label: "Ellipse", hint: "Glissez une ellipse", Icon: Circle },
  { id: "polygon", label: "Polygone", hint: "Sommets un à un", Icon: Hexagon },
  { id: "line", label: "Tracer une ligne", hint: "Le trait rejoint le départ", Icon: PenLine },
];

const MARKS: Array<{ id: Exclude<FixtureKind, "stair" | "zone">; label: string; Icon: typeof DoorOpen }> = [
  { id: "door", label: "Porte", Icon: DoorOpen },
  { id: "window", label: "Fenêtre", Icon: AppWindow },
];

const STAIR_ICONS: Record<StairStyle, typeof ChevronsUp> = {
  straight: ChevronsUp,
  spiral: RotateCw,
  quarter: CornerRightDown,
  switchback: IterationCw,
};

export function AtlasApp() {
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
  const [copied, setCopied] = useState(false);
  const [persistPending, setPersistPending] = useState(false);
  const [persistOkAt, setPersistOkAt] = useState<number | null>(null);

  useEffect(() => {
    return subscribePersistPulse((_pulse, pending) => {
      setPersistPending(pending);
      if (!pending) setPersistOkAt(Date.now());
    });
  }, []);
  const [shapeOpen, setShapeOpen] = useState(false);
  const [stairOpen, setStairOpen] = useState(false);
  const showHints = useUiStore((s) => s.chrome.showHints);
  const floorWord = useUiStore((s) => s.copy.floorWord);
  const roomWord = useUiStore((s) => s.copy.roomWord);

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
  const roomsHere = rooms.filter((r) => r.floorId === floorId);
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

  const hint = toolHint(tool, drawShape, roomsHere.length);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-dvh bg-background text-foreground">
        <header className="border-b border-border">
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

        <main className="mx-auto w-full max-w-3xl px-4 pb-24 pt-4 sm:max-w-4xl sm:px-6">
          <div className="flex flex-wrap items-center gap-1.5">
            {floors.map((f) => (
              <FloorTab key={f.id} floor={f} active={floorId === f.id} />
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-11 rounded-full"
              aria-label="Ajouter un étage"
              {...pressProps(() => addFloor())}
            >
              <Plus className="size-4" />
              {floorWord}
            </Button>
          </div>
          {showHints ? (
            <>
              <p className="mt-1 hidden text-xs text-muted-foreground sm:block">
                Clic droit sur un onglet, une pièce ou un élément pour l’éditer.
              </p>
              <p className="mt-1 text-xs text-muted-foreground sm:hidden">
                Appui long pour éditer un onglet, une pièce ou un élément.
              </p>
            </>
          ) : null}
          <p className="mt-1 text-[11px] text-muted-foreground" aria-live="polite">
            {persistPending
              ? "Enregistrement local…"
              : persistOkAt
                ? "Plan enregistré sur cet appareil"
                : "Les pièces apparaissent tout de suite — la sauvegarde suit en arrière-plan"}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <MapFilter />
            <span className="hidden h-5 w-px bg-border sm:block" />
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-label="Annuler"
              disabled={!canUndo}
              title="Annuler (Ctrl+Z)"
              {...pressProps(() => undo())}
            >
              <Undo2 className="size-4" />
              <span className="hidden sm:inline">Annuler</span>
            </Button>

            <div className="inline-flex">
              <Button
                type="button"
                variant={drawing ? "default" : "outline"}
                size="sm"
                className="rounded-r-none"
                aria-label="Tracer une pièce"
                aria-pressed={drawing}
                {...pressProps(toggleDraw)}
              >
                <activeShape.Icon className="size-4" />
                <span className="hidden sm:inline">{roomWord}</span>
              </Button>
              <Popover open={shapeOpen} onOpenChange={setShapeOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant={drawing ? "default" : "outline"}
                    size="sm"
                    className="rounded-l-none border-l-0 px-2"
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

            <span className="hidden h-5 w-px bg-border sm:block" />
            <Button
              type="button"
              variant={tool === "zone" ? "default" : "outline"}
              size="sm"
              aria-label="Tracer une zone"
              aria-pressed={tool === "zone"}
              {...pressProps(toggleZone)}
            >
              <PaintBucket className="size-4" />
              <span className="hidden sm:inline">Zone</span>
            </Button>
            {MARKS.map((mark) => {
              const on = tool === mark.id;
              return (
                <Button
                  key={mark.id}
                  type="button"
                  variant={on ? "default" : "outline"}
                  size="sm"
                  aria-label={mark.label}
                  aria-pressed={on}
                  {...pressProps(() => toggleMark(mark.id))}
                >
                  <mark.Icon className="size-4" />
                  <span className="hidden sm:inline">{mark.label}</span>
                </Button>
              );
            })}
            <div className="inline-flex">
              <Button
                type="button"
                variant={stairing ? "default" : "outline"}
                size="sm"
                className="rounded-r-none"
                aria-label="Escalier"
                aria-pressed={stairing}
                {...pressProps(() => setTool(stairing ? "select" : "stair"))}
              >
                <StairIcon className="size-4" />
                <span className="hidden sm:inline">Escalier</span>
              </Button>
              <Popover open={stairOpen} onOpenChange={setStairOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant={stairing ? "default" : "outline"}
                    size="sm"
                    className="rounded-l-none border-l-0 px-2"
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
            <PionsButton />
          </div>

          <figure className="mt-2 overflow-hidden rounded-lg border border-border bg-paper">
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

          {floor?.blurb ? (
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground text-pretty">
              {floor.blurb}
            </p>
          ) : null}

          <div id="dossier" className="mt-8">
            <RoomDossier />
          </div>
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
    const name = draft.trim();
    if (tokenDef) {
      const used = new Set(tokenDef.options.map((o) => o.id));
      const opt = newOption(name || `Pion ${tokenDef.options.length + 1}`, used, tokenDef.vars);
      setSchema(
        schema.map((d) =>
          d.id === tokenDef.id ? { ...d, options: [...d.options, opt] } : d,
        ),
      );
      setPlacingToken(opt.id);
      setDraft("");
      setOpen(false);
      toast.message("Touchez le plan pour poser le pion");
      return;
    }
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
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant={tool === "token" ? "default" : "outline"}
          size="sm"
          aria-label="Pions"
          aria-pressed={tool === "token"}
        >
          <Users className="size-4" />
          <span className="hidden sm:inline">Pions</span>
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
                <span
                  className="size-3 shrink-0 rounded-full border border-border"
                  style={{ background: c.color || "var(--color-primary)" }}
                  aria-hidden
                />
                <Input
                  value={c.name}
                  aria-label={`Nom du pion ${c.short}`}
                  className="h-9"
                  onChange={(e) => renameActor(c.id, e.target.value)}
                />
                <Button
                  type="button"
                  size="sm"
                  variant={placingTokenId === c.id && tool === "token" ? "default" : "outline"}
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
                  size="sm"
                  variant="outline"
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
          <Button type="submit" size="sm" aria-label="Ajouter un pion">
            <Plus className="size-4" />
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  );
}

function toolHint(tool: MapTool, shape: DrawShape, roomCount: number) {
  if (tool === "draw") {
    if (shape === "polygon") return "Touchez pour poser un sommet · Entrée pour fermer";
    if (shape === "line") return "Glissez un trait, ou posez des sommets · rejoignez le départ";
    if (shape === "ellipse") return "Glissez une ellipse";
    return "Glissez un rectangle sur le plan";
  }
  if (tool === "zone") return "Glissez un lasso, relâchez pour fermer";
  if (tool === "door") return "Approchez un mur — la porte s’aligne et s’y colle";
  if (tool === "window") return "Glissez le long d’un mur — la fenêtre s’y cale";
  if (tool === "stair") return "Collez l’escalier au mur d’une pièce, puis reliez l’étage";
  if (tool === "token") return "Touchez le plan pour poser le pion";
  if (roomCount) return "Touchez une pièce · clic droit pour renommer";
  return "Aucune pièce — tracez-en une";
}

function FloorCaption() {
  const floorId = useAtlas((s) => s.floorId);
  const floors = useAtlas((s) => s.floors);
  const floor = floorById(floors, floorId);
  if (!floor) return <span>Plan</span>;
  return <span className="font-medium text-foreground">{floor.name}</span>;
}
