import type { Room } from "./types";

const API = "/api/atlas/files";

export function slugName(name: string): string {
  const s = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return s || "piece";
}

export function leafName(path: string): string {
  return path.split("/").filter(Boolean).pop() ?? path;
}

export function pathUnder(parent: string, child: string): boolean {
  if (!parent) return false;
  return child === parent || child.startsWith(`${parent}/`);
}

/** Chemin tel qu’il apparaît dans le vault, sans le préfixe du workspace. */
export function displayPath(workspace: string, path: string): string {
  if (!path) return "";
  const cleaned = path.replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");
  if (!cleaned) return "";
  if (workspace && cleaned === workspace) return "";
  if (workspace && cleaned.startsWith(`${workspace}/`)) {
    return cleaned.slice(workspace.length + 1);
  }
  return cleaned.replace(/^(artifacts|attachments|public)\//, "") || cleaned;
}

export function noteFileName(name: string): string {
  const t = name.replace(/[\n\r]/g, " ").trim() || "Pièce";
  const safe = t.replace(/[\\/:*?"<>|]/g, "-").replace(/\s+/g, " ").slice(0, 80).trim();
  return `${safe || "Pièce"}.md`;
}

export function namesMatch(filePath: string, roomName: string): boolean {
  const base = leafName(filePath).replace(/\.md$/i, "");
  const want = roomName.replace(/[\n\r]/g, " ").trim();
  if (!base || !want) return false;
  if (base === want) return true;
  if (base.toLowerCase() === want.toLowerCase()) return true;
  if (slugName(base) === slugName(want)) return true;
  return leafName(filePath) === noteFileName(want);
}

export function findMatchingRoomFile(files: string[], root: string, roomName: string): string | undefined {
  const inRoot = files.filter((file) => pathUnder(root, file) && file !== root);
  const direct = inRoot.filter((file) => !file.slice(root.length + 1).includes("/"));
  return direct.find((file) => namesMatch(file, roomName))
    ?? inRoot.find((file) => namesMatch(file, roomName));
}

export type VaultPathItem = {
  path: string;
  label: string;
  kind: "file" | "dir";
};

export function parentDir(path: string): string {
  const parts = path.replace(/\\/g, "/").split("/").filter(Boolean);
  parts.pop();
  return parts.join("/");
}

export function isDirectChild(folder: string, path: string): boolean {
  if (!path || path === folder) return false;
  if (!folder) return !path.includes("/");
  if (!path.startsWith(`${folder}/`)) return false;
  return !path.slice(folder.length + 1).includes("/");
}

export function vaultCrumbs(root: string, here: string): { path: string; label: string }[] {
  const crumbs: { path: string; label: string }[] = [{ path: root, label: "Racine" }];
  if (!here || !root || here === root) return crumbs;
  const rel = here.startsWith(`${root}/`) ? here.slice(root.length + 1) : displayPath(root, here);
  if (!rel) return crumbs;
  let acc = root;
  for (const seg of rel.split("/").filter(Boolean)) {
    acc = `${acc}/${seg}`;
    crumbs.push({ path: acc, label: seg });
  }
  return crumbs;
}

export function vaultPathItems(
  bag: { files: string[]; dirs: string[] },
  workspace: string,
  mode: "all" | "dirs" | "files" = "all",
): VaultPathItem[] {
  const out: VaultPathItem[] = [];
  const seen = new Set<string>();
  if (mode !== "files") {
    for (const dir of bag.dirs) {
      if (!dir || dir === workspace || seen.has(dir)) continue;
      const label = displayPath(workspace, dir);
      if (!label) continue;
      seen.add(dir);
      out.push({ path: dir, label: label.endsWith("/") ? label : `${label}/`, kind: "dir" });
    }
  }
  if (mode !== "dirs") {
    for (const file of bag.files) {
      if (!file || file === workspace || seen.has(file)) continue;
      const label = displayPath(workspace, file);
      if (!label) continue;
      seen.add(file);
      out.push({ path: file, label, kind: "file" });
    }
  }
  out.sort((a, b) => a.label.localeCompare(b.label, "fr"));
  return out;
}

export function noteContent(name: string, description: string, previous = ""): string {
  const title = name.replace(/\n/g, " ").trim() || "Pièce";
  const desc = description.trim();
  const extraIdx = previous.search(/\n---\s*\n/);
  const extra = extraIdx >= 0 ? previous.slice(extraIdx) : "";
  const head = `# ${title}\n\n${desc}\n`;
  return extra ? `${head}${extra.startsWith("\n") ? extra.slice(1) : extra}` : head;
}

type FilesBody = {
  ok?: boolean;
  path?: string;
  error?: string;
  files?: string[];
  dirs?: string[];
  workspaces?: Array<{
    name: string;
    path: string;
    hint?: string;
    available?: boolean;
  }>;
  content?: string;
};

async function post(body: Record<string, unknown>): Promise<FilesBody | null> {
  try {
    const res = await fetch(API, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return (await res.json()) as FilesBody;
  } catch {
    return null;
  }
}

export async function listWorkspaces(): Promise<
  Array<{ name: string; path: string; hint?: string; available?: boolean }>
> {
  try {
    const res = await fetch(`${API}?kind=workspaces`, { credentials: "include" });
    const body = (await res.json()) as FilesBody;
    return Array.isArray(body.workspaces) ? body.workspaces : [];
  } catch {
    return [];
  }
}

export async function listVault(root?: string): Promise<{ files: string[]; dirs: string[] }> {
  if (root?.startsWith("grok:")) return { files: [], dirs: [] };
  try {
    const q = root ? `?root=${encodeURIComponent(root)}` : "";
    const res = await fetch(`${API}${q}`, { credentials: "include" });
    const body = (await res.json()) as FilesBody;
    return {
      files: Array.isArray(body.files) ? body.files : [],
      dirs: Array.isArray(body.dirs) ? body.dirs : [],
    };
  } catch {
    return { files: [], dirs: [] };
  }
}

export async function ensureVaultDir(root: string): Promise<string | null> {
  const body = await post({ action: "mkdir", path: root });
  return body?.ok && body.path ? body.path : null;
}

export async function writeRoomNote(opts: {
  root: string;
  file?: string;
  name: string;
  description: string;
  previous?: string;
}): Promise<string | null> {
  if (!opts.root && !opts.file) return null;
  const dir = (opts.root || opts.file?.split("/").slice(0, -1).join("/") || "").replace(/\/+$/, "");
  if (!dir) return null;
  const dedicated = `${dir}/${noteFileName(opts.name)}`;
  const bound = opts.file?.trim() ?? "";
  const target = bound || dedicated;
  let previous = opts.previous ?? "";
  if (target && !previous) {
    const got = await post({ action: "read", path: target });
    if (typeof got?.content === "string") previous = got.content;
  }
  const written = await post({
    action: "write",
    path: target,
    content: noteContent(opts.name, opts.description, previous),
  });
  return written?.ok && written.path ? written.path : target;
}

const syncTimers = new Map<string, ReturnType<typeof setTimeout>>();

export function queueRoomNoteSync(
  room: Pick<Room, "id" | "name" | "description" | "file">,
  root: string,
  syncNotes: boolean,
  createIfMissing: boolean,
  onBound: (id: string, file: string) => void,
) {
  const prev = syncTimers.get(room.id);
  if (prev) clearTimeout(prev);
  syncTimers.set(
    room.id,
    setTimeout(() => {
      syncTimers.delete(room.id);
      void (async () => {
        if (room.file && !syncNotes) return;
        if (!room.file && !root) return;
        if (!room.file) {
          const bag = await listVault(root);
          const match = findMatchingRoomFile(bag.files, root, room.name);
          if (match) {
            onBound(room.id, match);
            if (!syncNotes) return;
            const file = await writeRoomNote({
              root,
              file: match,
              name: room.name,
              description: room.description,
            });
            if (file && file !== match) onBound(room.id, file);
            return;
          }
          if (!createIfMissing) return;
        }
        const file = await writeRoomNote({
          root,
          file: room.file,
          name: room.name,
          description: room.description,
        });
        if (file && file !== room.file) onBound(room.id, file);
      })();
    }, 420),
  );
}

export function parseNote(content: string): { name: string; description: string } {
  const text = content.replace(/\r\n/g, "\n");
  const extraIdx = text.search(/\n---\s*\n/);
  const head = (extraIdx >= 0 ? text.slice(0, extraIdx) : text).trim();
  const lines = head.split("\n");
  const first = lines[0] ?? "";
  if (first.startsWith("# ")) {
    const name = first.slice(2).trim();
    let i = 1;
    while (i < lines.length && !lines[i]?.trim()) i += 1;
    return { name, description: lines.slice(i).join("\n").trim() };
  }
  return { name: "", description: head };
}

export async function readRoomNote(
  file: string,
): Promise<{ name: string; description: string; content: string } | null> {
  const body = await post({ action: "read", path: file });
  if (!body?.ok || typeof body.content !== "string") return null;
  return { ...parseNote(body.content), content: body.content };
}

export async function createRoomNote(
  room: Pick<Room, "id" | "name" | "description">,
  root: string,
): Promise<string | null> {
  if (!root) return null;
  return writeRoomNote({
    root,
    name: room.name,
    description: room.description,
  });
}
