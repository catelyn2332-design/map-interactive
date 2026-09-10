import { Check, ChevronDown, ChevronRight, FileText, Folder } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { pressProps } from "@/lib/press";
import { cn } from "@/lib/utils";
import { isDirectChild, parentDir, vaultCrumbs } from "@/lib/map/vault-files";

export type CollapseItem = {
  id: string;
  label: string;
  hint?: string;
  kind?: "file" | "dir";
};

function itemLeaf(item: CollapseItem): string {
  const raw = item.id.split("/").filter(Boolean).pop() ?? item.label;
  return raw.replace(/\/$/, "");
}

function rankItem(item: CollapseItem, q: string): number {
  const label = item.label.toLowerCase();
  const id = item.id.toLowerCase();
  const hint = (item.hint ?? "").toLowerCase();
  if (label === q || id === q) return 0;
  if (label.startsWith(q) || id.endsWith(`/${q}`)) return 1;
  if (label.includes(q)) return 2;
  if (id.includes(q) || hint.includes(q)) return 3;
  return 9;
}

function shownValue(value: string, items: CollapseItem[]): string {
  const current = items.find((item) => item.id === value);
  if (current?.label) return current.label.replace(/\/$/, "");
  if (!value) return "";
  return value.replace(/^(artifacts|attachments|public)\//, "").replace(/^\/+|\/+$/g, "");
}

export function CollapsePicker({
  label,
  value,
  placeholder = "Choisir…",
  items,
  loading = false,
  locked = false,
  lockedHint,
  emptyHint = "Rien à afficher.",
  onChange,
  onClear,
  clearLabel = "Détacher",
  pathMode = false,
  root = "",
  pickFolderLabel = "Choisir ce dossier",
  onOpen,
}: {
  label: string;
  value: string;
  placeholder?: string;
  items: CollapseItem[];
  loading?: boolean;
  locked?: boolean;
  lockedHint?: string;
  emptyHint?: string;
  onChange: (id: string) => void;
  onClear?: () => void;
  clearLabel?: string;
  /** Chemins du vault : navigation dossier par dossier. */
  pathMode?: boolean;
  /** Racine du workspace (point de départ de la navigation). */
  root?: string;
  pickFolderLabel?: string;
  /** Relire le vault au moment d’ouvrir le sélecteur. */
  onOpen?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [here, setHere] = useState(root);
  const filterRef = useRef<HTMLInputElement>(null);
  const shown = shownValue(value, items);
  const q = query.trim().toLowerCase();
  const dirIds = useMemo(
    () => new Set(items.filter((item) => item.kind === "dir").map((item) => item.id)),
    [items],
  );

  useEffect(() => {
    if (!open) return;
    const start = value
      ? dirIds.has(value)
        ? value
        : parentDir(value) || root
      : root;
    setHere(start || root);
    setQuery("");
  }, [open, root, value, dirIds]);

  useEffect(() => {
    if (open && pathMode) filterRef.current?.focus();
  }, [open, pathMode]);

  const crumbs = useMemo(() => vaultCrumbs(root, here || root), [root, here]);
  const browsing = pathMode && !q;
  const visible = useMemo(() => {
    if (!pathMode) {
      const list = q ? items.filter((item) => rankItem(item, q) < 9) : items;
      if (!q) return list;
      return [...list].sort((a, b) => rankItem(a, q) - rankItem(b, q) || a.label.localeCompare(b.label, "fr"));
    }
    if (q) {
      return [...items]
        .filter((item) => rankItem(item, q) < 9)
        .sort((a, b) => rankItem(a, q) - rankItem(b, q) || a.label.localeCompare(b.label, "fr"));
    }
    const folder = here || root;
    const children = items.filter((item) => isDirectChild(folder, item.id));
    children.sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === "dir" ? -1 : 1;
      return itemLeaf(a).localeCompare(itemLeaf(b), "fr");
    });
    return children;
  }, [items, q, pathMode, here, root]);

  const showFilter = pathMode || items.length > 6;
  const atRoot = !here || here === root;

  function enterOrPick(item: CollapseItem) {
    if (item.kind === "dir" && !q) {
      setHere(item.id);
      return;
    }
    if (item.kind === "dir" && q) {
      setHere(item.id);
      setQuery("");
      return;
    }
    onChange(item.id);
    setOpen(false);
    setQuery("");
  }

  function pickFolder() {
    const folder = here || root;
    if (!folder) return;
    onChange(folder);
    setOpen(false);
    setQuery("");
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <button
        type="button"
        aria-expanded={open}
        aria-label={label}
        {...pressProps(() => {
          setOpen((v) => {
            if (!v) onOpen?.();
            return !v;
          });
        })}
        className={cn(
          "flex w-full appearance-none items-center justify-between gap-3 px-3 py-3 text-left transition-colors",
          "hover:brightness-[0.96]",
          locked && !value && "opacity-70",
        )}
      >
        <span className="min-w-0">
          <span className="block text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            {label}
          </span>
          <span
            className={cn(
              "mt-0.5 block text-sm",
              shown ? "font-medium" : "text-muted-foreground",
              pathMode ? "whitespace-normal break-words leading-snug" : "truncate",
            )}
            title={shown || undefined}
          >
            {shown || placeholder}
          </span>
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open ? (
        <div className={cn("border-t border-border", pathMode ? "bg-accent" : "bg-field")}>
          {locked && !value ? (
            <p className="px-3 py-4 text-sm leading-relaxed text-muted-foreground">
              {lockedHint}
            </p>
          ) : loading ? (
            <p className="px-3 py-4 text-sm text-muted-foreground">Chargement…</p>
          ) : items.length === 0 && !value ? (
            <p className="px-3 py-4 text-sm leading-relaxed text-muted-foreground">
              {emptyHint}
            </p>
          ) : pathMode ? (
            <div className="flex flex-col">
              <nav
                aria-label="Chemin du vault"
                className="flex flex-wrap items-center gap-x-1 gap-y-1 border-b border-border px-3 py-2"
              >
                {crumbs.map((crumb, i) => {
                  const last = i === crumbs.length - 1;
                  return (
                    <span key={crumb.path} className="flex min-w-0 items-center gap-1">
                      {i > 0 ? (
                        <span className="text-muted-foreground" aria-hidden>
                          /
                        </span>
                      ) : null}
                      <button
                        type="button"
                        {...pressProps(() => {
                          setHere(crumb.path);
                          setQuery("");
                        })}
                        className={cn(
                          "max-w-[12rem] truncate text-left text-xs",
                          last ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {crumb.label}
                      </button>
                    </span>
                  );
                })}
              </nav>
              <button
                type="button"
                {...pressProps(pickFolder)}
                className="flex min-h-11 w-full items-center border-b border-border px-3 text-left text-sm font-medium hover:bg-card/80"
              >
                {pickFolderLabel}
              </button>
              <input
                ref={filterRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={browsing ? "Filtrer ce dossier…" : "Filtrer un chemin…"}
                autoComplete="off"
                spellCheck={false}
                aria-label={`Filtrer ${label}`}
                className="h-11 w-full border-0 border-b border-border bg-transparent px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-0"
              />
              <ScrollArea className="h-72">
                <ul className="flex flex-col py-1">
                  {onClear && value ? (
                    <li>
                      <button
                        type="button"
                        {...pressProps(() => {
                          onClear();
                          setOpen(false);
                        })}
                        className="flex min-h-11 w-full items-center px-3 py-2 text-left text-sm text-muted-foreground hover:bg-card/80 hover:text-foreground"
                      >
                        {clearLabel}
                      </button>
                    </li>
                  ) : null}
                  {browsing && !atRoot ? (
                    <li>
                      <button
                        type="button"
                        {...pressProps(() => setHere(parentDir(here) || root))}
                        className="flex min-h-11 w-full items-center gap-2 px-3 text-left text-sm text-muted-foreground hover:bg-card/80 hover:text-foreground"
                      >
                        <Folder className="size-4 shrink-0" />
                        <span>Dossier parent</span>
                      </button>
                    </li>
                  ) : null}
                  {visible.length === 0 ? (
                    <li className="px-3 py-3 text-sm text-muted-foreground">
                      {browsing ? "Dossier vide." : "Aucun résultat."}
                    </li>
                  ) : (
                    visible.map((item) => {
                      const on = item.id === value;
                      const name = browsing ? itemLeaf(item) : item.label.replace(/\/$/, "");
                      const isDir = item.kind === "dir";
                      return (
                        <li key={item.id}>
                          <button
                            type="button"
                            aria-label={name}
                            title={item.label}
                            {...pressProps(() => enterOrPick(item))}
                            className={cn(
                              "flex min-h-11 w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-card/80",
                              on && "bg-card font-medium",
                            )}
                          >
                            {isDir ? (
                              <Folder className="size-4 shrink-0 text-icon-stroke" />
                            ) : (
                              <FileText className="size-4 shrink-0 text-muted-foreground" />
                            )}
                            <span className="min-w-0 flex-1 whitespace-normal break-words leading-snug">
                              {name}
                            </span>
                            {isDir ? (
                              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                            ) : null}
                          </button>
                        </li>
                      );
                    })
                  )}
                </ul>
              </ScrollArea>
            </div>
          ) : (
            <div className="flex flex-col gap-2 p-2">
              {showFilter ? (
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Filtrer…"
                  className="h-9"
                  aria-label={`Filtrer ${label}`}
                />
              ) : null}
              <ScrollArea className="h-64">
                <ul className="flex flex-col">
                  {onClear && value ? (
                    <li>
                      <button
                        type="button"
                        {...pressProps(() => {
                          onClear();
                          setOpen(false);
                        })}
                        className="flex min-h-11 w-full items-center rounded-md px-2 py-2 text-left text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
                      >
                        {clearLabel}
                      </button>
                    </li>
                  ) : null}
                  {visible.length === 0 ? (
                    <li className="px-2 py-3 text-sm text-muted-foreground">Aucun résultat.</li>
                  ) : (
                    visible.map((item) => {
                      const on = item.id === value;
                      return (
                        <li key={item.id}>
                          <button
                            type="button"
                            aria-label={item.label}
                            title={item.label}
                            {...pressProps(() => {
                              onChange(item.id);
                              setOpen(false);
                            })}
                            className={cn(
                              "flex min-h-11 w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-accent",
                              on && "bg-accent font-medium",
                            )}
                          >
                            <span className="min-w-0 flex-1">
                              <span className="block truncate">{item.label}</span>
                              {item.hint ? (
                                <span className="block truncate text-xs font-normal text-muted-foreground">
                                  {item.hint}
                                </span>
                              ) : null}
                            </span>
                            {on ? (
                              <Check className="size-4 shrink-0 text-icon-stroke" />
                            ) : null}
                          </button>
                        </li>
                      );
                    })
                  )}
                </ul>
              </ScrollArea>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
