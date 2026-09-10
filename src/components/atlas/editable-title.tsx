import { useEffect, useRef, useState } from "react";
import { useUiStore } from "@/lib/map/ui";
import { cn } from "@/lib/utils";

type TitleTag = "h1" | "h2" | "h3" | "p" | "span";

export function EditableTitle({
  value,
  onChange,
  as: Tag = "h2",
  className,
  inputClassName,
  placeholder = "Sans nom",
  maxLength = 80,
  clickToEdit = false,
}: {
  value: string;
  onChange: (next: string) => void;
  as?: TitleTag;
  className?: string;
  inputClassName?: string;
  placeholder?: string;
  maxLength?: number;
  /** Dossiers : le clic gauche ouvre aussi le champ. Partout ailleurs, clic droit / appui long. */
  clickToEdit?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLInputElement>(null);
  const hold = useRef(0);
  const start = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  useEffect(() => {
    if (!editing) return;
    const el = ref.current;
    if (!el) return;
    el.focus();
    el.select();
  }, [editing]);

  function open(e?: { preventDefault(): void; stopPropagation(): void }) {
    e?.preventDefault();
    e?.stopPropagation();
    clearHold();
    setDraft(value);
    setEditing(true);
  }

  function clearHold() {
    if (hold.current) {
      window.clearTimeout(hold.current);
      hold.current = 0;
    }
  }

  function commit() {
    const next = draft.trim().slice(0, maxLength);
    onChange(next);
    setEditing(false);
  }

  if (editing) {
    return (
      <input
        ref={ref}
        value={draft}
        maxLength={maxLength}
        aria-label="Renommer"
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          } else if (e.key === "Escape") {
            e.preventDefault();
            setEditing(false);
          }
        }}
        className={cn(
          "min-w-0 rounded-md border border-input bg-field px-1.5 py-0.5 text-inherit tracking-inherit outline-none focus-visible:ring-2 focus-visible:ring-ring",
          inputClassName ?? className,
        )}
      />
    );
  }

  return (
    <Tag
      className={cn("min-w-0 cursor-context-menu select-none", className)}
      title="Clic droit pour renommer"
      onContextMenu={open}
      onClick={
        clickToEdit
          ? (e) => {
              e.stopPropagation();
              open();
            }
          : undefined
      }
      onPointerDown={(e) => {
        if (e.button === 2 || e.pointerType === "mouse") return;
        start.current = { x: e.clientX, y: e.clientY };
        hold.current = window.setTimeout(() => open(), 520);
      }}
      onPointerMove={(e) => {
        if (!hold.current) return;
        if (Math.hypot(e.clientX - start.current.x, e.clientY - start.current.y) > 10) {
          clearHold();
        }
      }}
      onPointerUp={clearHold}
      onPointerCancel={clearHold}
    >
      {value.trim() ? (
        value
      ) : (
        <span className="text-muted-foreground">{placeholder}</span>
      )}
    </Tag>
  );
}

/** Titre persisté (panneau ou vrai titre) — clic droit pour renommer. */
export function NamedTitle({
  id,
  fallback,
  as = "h2",
  className,
  inputClassName,
  clickToEdit = false,
}: {
  id: string;
  fallback: string;
  as?: TitleTag;
  className?: string;
  inputClassName?: string;
  clickToEdit?: boolean;
}) {
  const stored = useUiStore((s) => s.copy.titles[id]);
  const setCopy = useUiStore((s) => s.setCopy);
  const value = (stored ?? "").trim() || fallback;
  return (
    <EditableTitle
      as={as}
      value={value}
      placeholder={fallback}
      clickToEdit={clickToEdit}
      className={className}
      inputClassName={inputClassName}
      onChange={(next) => {
        const titles = { ...useUiStore.getState().copy.titles };
        const trimmed = next.trim();
        if (!trimmed || trimmed === fallback) delete titles[id];
        else titles[id] = trimmed;
        setCopy({ titles });
      }}
    />
  );
}
