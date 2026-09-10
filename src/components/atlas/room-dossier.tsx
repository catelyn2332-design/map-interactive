import {
  ArrowDown,
  ArrowUp,
  Dices,
  Eraser,
  Loader2,
  MapPin,
  Plus,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Chip } from "@/components/atlas/chip";
import { CollapsePicker } from "@/components/atlas/collapse-picker";
import { ColorWheel } from "@/components/atlas/color-wheel";
import { EditableTitle } from "@/components/atlas/editable-title";
import { GuardBoundary } from "@/components/atlas/guard-boundary";
import { PhotoField } from "@/components/atlas/photo-field";
import { PrefsSaveBar } from "@/components/atlas/prefs-save-bar";
import { FillSwatches } from "@/components/atlas/plan-menu";
import { PropIcon } from "@/components/atlas/prop-icon";
import { Tip } from "@/components/atlas/tip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { floorById, roomById } from "@/lib/map/house";
import {
  collectUsedValues,
  DIMS_PROP_ID,
  isBuiltinProp,
  newOption,
  readExtra,
  readProp,
  tokenActors,
  tokensInRoom,
  uid,
  usesDictionary,
  usesOpenChoices,
  usesOptions,
} from "@/lib/map/props";
import { resolveRoom } from "@/lib/map/edits";
import { formatDims } from "@/lib/map/geometry";
import { type ImproviseResult } from "@/lib/map/improvise";
import { requestImprovise } from "@/lib/map/improvise-ai";
import { useAtlas } from "@/lib/map/store";
import { useUiStore } from "@/lib/map/ui";
import {
  createRoomNote,
  displayPath,
  findMatchingRoomFile,
  listVault,
  readRoomNote,
  vaultPathItems,
} from "@/lib/map/vault-files";
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
  RoomEdit,
  RoomStep,
} from "@/lib/map/types";
import { sanitizeHexColor, zoneHex } from "@/lib/map/types";

function ImproviseButton({
  name,
  kind,
  bag,
  description,
  steps,
  floorName,
  onApply,
}: {
  name: string;
  kind: "room" | "zone";
  bag: Record<string, PropValue>;
  description?: string;
  steps?: RoomStep[];
  floorName?: string;
  onApply: (next: ImproviseResult) => void;
}) {
  const schema = useAtlas((s) => s.schema);
  const assist = useUiStore((s) => s.assist);
  const workspaceName = useUiStore((s) => s.copy.workspaceName);
  const [draft, setDraft] = useState<ImproviseResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function roll() {
    if (busy) return;
    setBusy(true);
    setError(null);
    setDraft(null);
    const usable = schema.filter((d) => d.type !== "token" && !isBuiltinProp(d.id));
    const assigned = usable.filter((d) => d.id in bag);
    const extra =
      assist.fill === "add"
        ? usable.filter((d) => !(d.id in bag)).slice(0, assist.addMax)
        : assist.fill === "assigned"
          ? assigned
          : usable;
    const targets = assist.fill === "description" ? [] : extra;
    const hints = targets.map((d) => ({
      id: d.id,
      name: d.name,
      type: d.type,
      options: d.options.slice(0, 12).map((o) => ({ id: o.id, label: o.label })),
    }));
    const ai = await requestImprovise({
      name,
      kind,
      workspace: workspaceName,
      floor: floorName,
      existing: description,
      prompt: assist.prompt,
      voice: assist.voice,
      length: assist.length,
      intensity: assist.intensity,
      fill: assist.fill,
      overwrite: assist.overwrite,
      props: hints,
      current: bag,
      steps,
    });
    setBusy(false);
    if (!ai.ok) {
      setError(ai.error);
      return;
    }
    setDraft(ai.result);
    if (assist.autoApply) onApply(ai.result);
  }

  return (
    <div className="flex flex-col gap-2">
      <Tip label="Improviser une description">
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Improviser"
          disabled={busy}
          {...pressProps(() => void roll())}
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Dices className="size-4" />}
        </Button>
      </Tip>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      {draft && !assist.autoApply ? (
        <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3">
          <p className="text-sm leading-relaxed">{draft.description}</p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" {...pressProps(() => onApply(draft))}>
              Appliquer
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              {...pressProps(() => setDraft(null))}
            >
              Ignorer
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function OpenTags({
  value,
  suggestions,
  onChange,
  placeholder,
  compact = false,
}: {
  value: string[];
  suggestions: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
  compact?: boolean;
}) {
  const [draft, setDraft] = useState("");
  function add(raw: string) {
    const word = raw.trim();
    if (!word) return;
    if (!value.includes(word)) onChange([...value, word]);
    setDraft("");
  }
  return (
    <div className="flex flex-col gap-2">
      {value.length ? (
        <div className="flex flex-wrap gap-1.5">
          {value.map((word) => (
            <Chip
              key={word}
              active
              onClick={() => onChange(value.filter((x) => x !== word))}
            >
              {word}
            </Chip>
          ))}
        </div>
      ) : null}
      <div className="flex items-center gap-2">
        <Input
          value={draft}
          list={`tags-${placeholder}`}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={placeholder}
          className={cn(compact && "h-9")}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add(draft);
            }
          }}
        />
        {compact ? null : (
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Ajouter"
            {...pressProps(() => add(draft))}
          >
            <Plus className="size-4" />
          </Button>
        )}
      </div>
      <datalist id={`tags-${placeholder}`}>
        {suggestions.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
    </div>
  );
}

function PresetMulti({
  options,
  value,
  onChange,
  compact = false,
}: {
  options: { id: string; label: string }[];
  value: string[];
  onChange: (value: string[]) => void;
  compact?: boolean;
}) {
  function toggle(id: string) {
    onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
  }
  return (
    <div className={cn("flex w-full flex-wrap items-center gap-1", compact && "min-w-0")}>
      {options.map((opt) => (
        <Chip key={opt.id} active={value.includes(opt.id)} onClick={() => toggle(opt.id)}>
          {opt.label}
        </Chip>
      ))}
    </div>
  );
}

function PropField({
  def,
  value,
  onChange,
  onCreate,
  suggestions = [],
  compact = false,
  empty = "",
}: {
  def: PropDef;
  value: PropValue;
  onChange: (value: PropValue) => void;
  onCreate?: (label: string) => void;
  suggestions?: string[];
  compact?: boolean;
  empty?: string;
}) {
  if (def.id === DIMS_PROP_ID) {
    return <p className="text-sm text-muted-foreground">{empty || "—"}</p>;
  }
  if (def.type === "longtext") {
    return (
      <Textarea
        value={typeof value === "string" ? value : ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={def.name}
        rows={compact ? 3 : 4}
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
    return <ColorWheel id={`prop-color-${def.id}`} label="" value={hex} onChange={onChange} />;
  }
  if (def.type === "path") {
    return (
      <PathField
        value={typeof value === "string" ? value : ""}
        onChange={onChange}
        compact={compact}
      />
    );
  }
  if (usesDictionary(def.type)) {
    const ids = Array.isArray(value) ? value.map(String) : [];
    return (
      <OpenTags
        value={ids}
        suggestions={[
          ...def.options.map((o) => o.label),
          ...suggestions.filter((s) => !def.options.some((o) => o.label === s)),
        ]}
        onChange={(next) => {
          if (onCreate) {
            for (const word of next) {
              if (!ids.includes(word)) onCreate(word);
            }
          }
          onChange(next);
        }}
        placeholder={empty}
        compact={compact}
      />
    );
  }
  if (def.type === "preset" && def.multi) {
    const ids = Array.isArray(value) ? value.map(String) : [];
    return (
      <PresetMulti
        options={def.options}
        value={ids}
        onChange={onChange}
        compact={compact}
      />
    );
  }
  if (def.type === "choice" || def.type === "preset" || def.type === "token") {
    const current = typeof value === "string" ? value : "";
    return (
      <div className="flex flex-wrap gap-1.5">
        {def.options.map((opt) => (
          <Chip key={opt.id} active={current === opt.id} onClick={() => onChange(opt.id)}>
            {opt.label}
          </Chip>
        ))}
        {usesOpenChoices(def.type) && onCreate ? (
          <ChoiceCreate onCreate={onCreate} />
        ) : null}
        {def.options.length === 0 ? (
          <p className="text-xs text-muted-foreground">Ajoutez des noms dans Propriétés.</p>
        ) : null}
      </div>
    );
  }
  const ids = Array.isArray(value) ? value.map(String) : [];
  return (
    <div className="flex flex-wrap gap-1.5">
      {def.options.map((opt) => {
        const on = ids.includes(opt.id);
        return (
          <Chip
            key={opt.id}
            active={on}
            onClick={() => onChange(on ? ids.filter((x) => x !== opt.id) : [...ids, opt.id])}
          >
            {opt.label}
          </Chip>
        );
      })}
      {usesOpenChoices(def.type) && onCreate ? (
        <ChoiceCreate onCreate={onCreate} />
      ) : null}
    </div>
  );
}

function ChoiceCreate({ onCreate }: { onCreate: (label: string) => void }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  if (!open) {
    return (
      <Chip active={false} onClick={() => setOpen(true)}>
        +
      </Chip>
    );
  }
  return (
    <Input
      autoFocus
      value={draft}
      className="h-9 w-32"
      placeholder="Nouveau"
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        if (draft.trim()) onCreate(draft.trim());
        setDraft("");
        setOpen(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          if (draft.trim()) onCreate(draft.trim());
          setDraft("");
          setOpen(false);
        }
      }}
    />
  );
}

function ExtraFields({ def, room }: { def: PropDef; room: Room }) {
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

function isGenericRoomName(name: string): boolean {
  const t = name.trim();
  if (!t) return true;
  const word = useUiStore.getState().copy.roomWord.trim() || "Pièce";
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^${escaped}(?:\\s+\\d+)?$`, "i").test(t);
}

function RoomFilePicker({ room }: { room: Room }) {
  const vault = useUiStore((s) => s.vault);
  const patchRoom = useAtlas((s) => s.patchRoom);
  const [files, setFiles] = useState<string[]>([]);
  const [dirs, setDirs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  function reload() {
    if (!vault.workspace) {
      setFiles([]);
      setDirs([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    void listVault(vault.workspace).then((bag) => {
      setFiles(bag.files);
      setDirs(bag.dirs);
      setLoading(false);
    });
  }

  useEffect(() => {
    reload();
  }, [vault.workspace, room.file]);

  const paths = useMemo(
    () => vaultPathItems({ files, dirs }, vault.workspace, "all"),
    [files, dirs, vault.workspace],
  );

  async function bindFile(path: string) {
    const note = await readRoomNote(path);
    const patch: RoomEdit = { file: path };
    if (note) {
      if (isGenericRoomName(room.name) && note.name) {
        patch.name = note.name;
        patch.label = note.name;
      }
      if (!room.description.trim() && note.description) {
        patch.description = note.description;
      }
    }
    if (room.description.trim() && patch.description === undefined) {
      patch.description = room.description;
    }
    patchRoom(room.id, patch);
  }

  async function connect(path: string) {
    const asFile = files.includes(path) && !dirs.includes(path);
    if (!asFile) {
      const match = findMatchingRoomFile(files, path, room.name);
      if (match) {
        await bindFile(match);
        return;
      }
      if (vault.createOnRoom) {
        const created = await createRoomNote(room, path);
        if (created) {
          patchRoom(room.id, { file: created });
          toast.message(`Fichier créé : ${displayPath(vault.workspace, created)}`);
        }
        return;
      }
      toast.message("Aucun fichier à ce nom dans ce dossier.");
      return;
    }
    await bindFile(path);
  }

  const locked = !vault.workspace;
  const hint = locked
    ? "Choisissez d’abord un workspace dans Coffre — sans lui, aucun fichier n’apparaît."
    : room.file
      ? displayPath(vault.workspace, room.file)
      : vault.root && vault.createOnRoom
        ? `Sans fichier au nom de la pièce dans ${displayPath(vault.workspace, vault.root)}, un fichier dédié y sera créé.`
        : vault.root
          ? "Connectez un fichier existant, ou activez la création automatique dans Coffre."
          : "Connectez un fichier existant, ou choisissez le dossier des pièces dans Coffre.";

  return (
    <div className="flex flex-col gap-2">
      <CollapsePicker
        label="Fichier de la pièce"
        value={room.file ?? ""}
        pathMode
        root={vault.workspace.startsWith("grok:") ? "" : vault.workspace}
        pickFolderLabel="Choisir ce dossier"
        placeholder={locked ? "D’abord un workspace" : "Connecter un fichier…"}
        loading={loading}
        locked={locked}
        lockedHint="Choisissez d’abord un workspace dans Coffre — sans lui, aucun fichier n’apparaît."
        emptyHint={
          vault.workspace.startsWith("grok:")
            ? "Les fichiers de ce projet ne sont pas ouverts dans Atlas."
            : "Aucun fichier dans ce workspace."
        }
        items={paths.map((item) => ({
          id: item.path,
          label: item.label,
          kind: item.kind,
        }))}
        onChange={(id) => {
          void connect(id);
        }}
        onOpen={reload}
        onClear={
          room.file
            ? () => {
                patchRoom(room.id, { file: "" });
              }
            : undefined
        }
      />
      <p className="text-xs leading-relaxed text-muted-foreground">{hint}</p>
    </div>
  );
}

function PathField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
  compact?: boolean;
}) {
  const vault = useUiStore((s) => s.vault);
  const [files, setFiles] = useState<string[]>([]);
  const [dirs, setDirs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  function reload() {
    if (!vault.workspace) {
      setFiles([]);
      setDirs([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    void listVault(vault.workspace).then((bag) => {
      setFiles(bag.files);
      setDirs(bag.dirs);
      setLoading(false);
    });
  }

  useEffect(() => {
    reload();
  }, [vault.workspace]);

  const paths = useMemo(
    () => vaultPathItems({ files, dirs }, vault.workspace, "all"),
    [files, dirs, vault.workspace],
  );

  const locked = !vault.workspace;

  return (
    <CollapsePicker
      label="Chemin"
      value={value}
      pathMode
      root={vault.workspace.startsWith("grok:") ? "" : vault.workspace}
      pickFolderLabel="Choisir ce dossier"
      placeholder={locked ? "D’abord un workspace" : "Choisir un chemin…"}
      loading={loading}
      locked={locked}
      lockedHint="Choisissez d’abord un workspace dans Coffre — sans lui, aucun chemin n’apparaît."
      emptyHint={
        vault.workspace.startsWith("grok:")
          ? "Les fichiers de ce projet ne sont pas ouverts dans Atlas."
          : "Aucun fichier dans ce workspace."
      }
      items={paths.map((item) => ({
        id: item.path,
        label: item.label,
        kind: item.kind,
      }))}
      onChange={onChange}
      onOpen={reload}
      onClear={value ? () => onChange("") : undefined}
    />
  );
}

function RoomEditor({ room }: { room: Room }) {
  const patchRoom = useAtlas((s) => s.patchRoom);
  const setRoomProp = useAtlas((s) => s.setRoomProp);
  const setSchema = useAtlas((s) => s.setSchema);
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
  const floor = floorById(floors, room.floorId);
  const dirty =
    !isGenericRoomName(room.name) ||
    Boolean(room.description.trim()) ||
    steps.length > 0 ||
    Object.keys(props).length > 0 ||
    photos.length > 0;

  function setSteps(next: RoomStep[]) {
    patchRoom(room.id, { steps: next });
  }

  function applyImprovise(next: ImproviseResult) {
    const patch: RoomEdit = {};
    if (next.description) patch.description = next.description;
    if (next.steps) patch.steps = next.steps;
    if (Object.keys(next.props).length) {
      patch.props = { ...(room.props ?? {}), ...next.props };
    }
    patchRoom(room.id, patch);
  }

  return (
    <div className="flex flex-col gap-5">
      <EditableTitle
        value={room.name}
        clickToEdit
        as="h2"
        className="font-display text-2xl font-medium leading-tight tracking-[-0.03em] sm:text-3xl"
        onChange={(name) => patchRoom(room.id, { name, label: name })}
      />

      <RoomFilePicker room={room} />

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="room-desc">Description</Label>
          <div className="flex items-center gap-1">
            <ImproviseButton
              name={room.name}
              kind="room"
              bag={props}
              description={room.description}
              steps={steps}
              floorName={floor?.name}
              onApply={applyImprovise}
            />
            {room.description.trim() ? (
              <Tip label="Effacer la description">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Effacer la description"
                  {...pressProps(() => patchRoom(room.id, { description: "" }))}
                >
                  <Eraser className="size-4" />
                </Button>
              </Tip>
            ) : null}
          </div>
        </div>
        <Textarea
          id="room-desc"
          value={room.description}
          rows={6}
          onChange={(e) => patchRoom(room.id, { description: e.target.value })}
        />
      </div>

      <PhotoField photos={photos} onChange={(next) => patchRoom(room.id, { photos: next })} />

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
                    setSteps(steps.map((s) => (s.id === step.id ? { ...s, done: !s.done } : s)))
                  }
                  className="size-4 shrink-0 accent-primary"
                  aria-label={step.label || "Étape"}
                />
                <Input
                  value={step.label}
                  onChange={(e) =>
                    setSteps(steps.map((s) => (s.id === step.id ? { ...s, label: e.target.value } : s)))
                  }
                  placeholder="Intitulé de l’étape"
                  className="min-w-0 flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Retirer l’étape"
                  {...pressProps(() => setSteps(steps.filter((s) => s.id !== step.id)))}
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
          {...pressProps(() => setSteps([...steps, { id: uid("step"), label: "", done: false }]))}
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
              const here = tokensInRoom(room.id, tokens, tokenActors(schema, characters)).filter(
                (a) => a.propId === def.id,
              );
              return (
                <div key={def.id} className="flex flex-col gap-2">
                  <p className="flex items-center gap-2 text-xs text-muted-foreground">
                    <PropIcon id={def.icon} type={def.type} />
                    {def.name}
                  </p>
                  {here.length ? (
                    <div className="flex flex-wrap gap-1.5">
                      {here.map((a) => (
                        <Chip key={a.id} active onClick={() => setPlacingToken(a.id)}>
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
            const used = collectUsedValues(def, rooms);
            return (
              <div key={def.id} className="flex flex-col gap-2">
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  <PropIcon id={def.icon} type={def.type} />
                  {def.name}
                </p>
                <PropField
                  def={def}
                  value={def.id === DIMS_PROP_ID ? formatDims(room.poly) : readProp(props, def)}
                  empty={def.id === DIMS_PROP_ID ? formatDims(room.poly) : ""}
                  suggestions={used}
                  onChange={(value) => setRoomProp(room.id, def.id, value)}
                  onCreate={
                    usesOpenChoices(def.type) || usesDictionary(def.type)
                      ? (label) => {
                          const usedIds = new Set(def.options.map((o) => o.id));
                          const opt = newOption(label, usedIds);
                          setSchema(
                            schema.map((d) =>
                              d.id === def.id ? { ...d, options: [...d.options, opt] } : d,
                            ),
                          );
                          const cur = readProp(props, def);
                          if (def.type === "tags" || def.type === "keyword" || def.multi) {
                            const ids = Array.isArray(cur) ? cur.map(String) : [];
                            setRoomProp(room.id, def.id, [...ids, opt.id]);
                          } else {
                            setRoomProp(room.id, def.id, opt.id);
                          }
                        }
                      : undefined
                  }
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
        <Button type="button" variant="outline" {...pressProps(() => resetRoom(room.id))}>
          Vider les textes
        </Button>
      ) : null}

      <Button type="button" variant="outline" {...pressProps(() => deleteRoom(room.id))}>
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
  const floors = useAtlas((s) => s.floors);
  const title = zone.label ?? "Zone";
  const color = sanitizeHexColor(zone.color) ?? zoneHex(zone.fill);
  const floor = floorById(floors, zone.floorId);

  function applyImprovise(next: ImproviseResult) {
    if (next.description) patchFixture(zone.id, { description: next.description });
  }

  return (
    <div className="flex flex-col gap-5">
      <EditableTitle
        value={title}
        clickToEdit
        as="h2"
        className="font-display text-2xl font-medium leading-tight tracking-[-0.03em] sm:text-3xl"
        onChange={(name) => patchFixture(zone.id, { label: name || "Zone" })}
      />
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="zone-desc">Description</Label>
          <ImproviseButton
            name={title}
            kind="zone"
            bag={{}}
            description={zone.description}
            floorName={floor?.name}
            onApply={applyImprovise}
          />
        </div>
        <Textarea
          id="zone-desc"
          value={zone.description ?? ""}
          rows={6}
          onChange={(e) => patchFixture(zone.id, { description: e.target.value })}
        />
      </div>
      <ColorWheel
        id={`zone-color-${zone.id}`}
        value={color}
        onChange={(next) => patchFixture(zone.id, { color: next })}
      />
      <FillSwatches
        value={zone.fill ?? "sage"}
        onChange={(fill) => patchFixture(zone.id, { fill })}
      />
      <PhotoField
        photos={zone.photos ?? []}
        onChange={(photos) => patchFixture(zone.id, { photos })}
      />
      <Button type="button" variant="outline" {...pressProps(() => deleteFixture(zone.id))}>
        <Trash2 className="size-4" />
        Supprimer la zone
      </Button>
      <PrefsSaveBar sticky={false} />
    </div>
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

  const zone = selectedMarkId
    ? fixtures.find((f) => f.id === selectedMarkId && f.kind === "zone")
    : undefined;
  if (zone) {
    const floor = floorById(floors, zone.floorId);
    return (
      <article className={cn("flex flex-col gap-5", className)}>
        <GuardBoundary label="Dossier de zone">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            {floor?.name} · Zone
          </p>
          <ZoneEditor zone={zone} />
        </GuardBoundary>
      </article>
    );
  }

  const room = selectedId ? resolveRoom(selectedId, rooms, schema) : undefined;
  if (!room) {
    const emptyPlan = useUiStore.getState().copy.emptyPlan;
    const hasRooms = rooms.length > 0;
    return (
      <div className={cn("py-12", className)}>
        <p className="max-w-sm text-sm text-muted-foreground text-pretty">
          {hasRooms
            ? "Cliquez une pièce sur le plan pour ouvrir son dossier."
            : emptyPlan}
        </p>
        {hasRooms ? null : (
          <Button
            type="button"
            variant="outline"
            className="mt-4"
            {...pressProps(() => setDrawShape("rect"))}
          >
            <Plus className="size-4" />
            Tracer une pièce
          </Button>
        )}
      </div>
    );
  }

  const floor = floorById(floors, room.floorId);

  return (
    <article className={cn("flex flex-col gap-5", className)}>
      <GuardBoundary label="Dossier de pièce">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
          {floor?.name}
        </p>
        <RoomEditor room={room} />
        {room.travel?.length ? (
          <div className="flex flex-col gap-2">
            {room.travel.map((t) => (
              <Button
                key={`${t.toFloor}-${t.label}`}
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
