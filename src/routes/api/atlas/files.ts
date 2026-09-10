import { access, mkdir, readFile, readdir, rename, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { createFileRoute } from "@tanstack/react-router";
import { isGrokRef, listGrokWorkspaces } from "@/lib/map/grok-workspaces";

const ROOTS = ["public", "attachments", "artifacts"];
const WRITE_ROOTS = new Set(["public", "attachments", "artifacts"]);
const SKIP = new Set([
  "node_modules",
  ".git",
  ".grok",
  "dist",
  ".cache",
  "__grok",
  "src",
  "components",
  "lib",
  "routes",
  "server",
  "scripts",
  "ui",
]);
const SKIP_EXT = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".css",
  ".map",
]);
const MAX = 2000;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

function cleanRel(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const t = raw.trim().replace(/\\/g, "/").replace(/^\/+/, "").replace(/\/+$/, "");
  if (!t || t.includes("..") || t.includes("\0")) return null;
  const top = t.split("/")[0] ?? "";
  if (!WRITE_ROOTS.has(top)) return null;
  if (t === "public/__grok" || t.startsWith("public/__grok/")) return null;
  return t;
}

function absOf(rel: string) {
  return path.resolve(process.cwd(), rel);
}

function underCwd(abs: string) {
  const root = process.cwd();
  return abs === root || abs.startsWith(root + path.sep);
}

function keepFile(name: string) {
  const ext = path.extname(name).toLowerCase();
  if (SKIP_EXT.has(ext)) return false;
  if (name.endsWith(".d.ts")) return false;
  return true;
}

async function walk(abs: string, rel: string, files: string[], dirs: string[]) {
  if (files.length >= MAX && dirs.length >= MAX) return;
  let entries: string[] = [];
  try {
    entries = await readdir(abs);
  } catch {
    return;
  }
  for (const name of entries) {
    if (files.length >= MAX && dirs.length >= MAX) return;
    if (name.startsWith(".") || SKIP.has(name)) continue;
    const childAbs = path.join(abs, name);
    const childRel = rel ? `${rel}/${name}` : name;
    let info;
    try {
      info = await stat(childAbs);
    } catch {
      continue;
    }
    if (info.isDirectory()) {
      if (dirs.length < MAX) dirs.push(childRel);
      await walk(childAbs, childRel, files, dirs);
    } else if (info.isFile() && files.length < MAX && keepFile(name)) {
      files.push(childRel);
    }
  }
}

async function uniqueAbs(abs: string): Promise<string> {
  const ext = path.extname(abs);
  const dir = path.dirname(abs);
  const stem = path.basename(abs, ext);
  let i = 0;
  let cur = abs;
  while (true) {
    try {
      await access(cur);
      i += 1;
      cur = path.join(dir, `${stem}-${i}${ext}`);
    } catch {
      return cur;
    }
  }
}

function toRel(abs: string) {
  return path.relative(process.cwd(), abs).replace(/\\/g, "/");
}

async function listWorkspaces() {
  return listGrokWorkspaces();
}

export const Route = createFileRoute("/api/atlas/files")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get("kind") === "workspaces") {
          return json({ ok: true, workspaces: await listWorkspaces() });
        }
        const rawRoot = url.searchParams.get("root") ?? "";
        if (isGrokRef(rawRoot)) {
          return json({ ok: true, files: [], dirs: [] });
        }
        const rootFilter = cleanRel(rawRoot);
        const files: string[] = [];
        const dirs: string[] = [];
        const root = process.cwd();
        if (rootFilter) {
          const abs = absOf(rootFilter);
          if (underCwd(abs)) {
            dirs.push(rootFilter);
            await walk(abs, rootFilter, files, dirs);
          }
        } else {
          for (const dir of ROOTS) {
            await walk(path.join(root, dir), dir, files, dirs);
          }
        }
        files.sort((a, b) => a.localeCompare(b, "fr"));
        dirs.sort((a, b) => a.localeCompare(b, "fr"));
        return json({ ok: true, files, dirs });
      },
      POST: async ({ request }) => {
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return json({ ok: false, error: "json" }, 400);
        }
        const rec = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
        const action = typeof rec.action === "string" ? rec.action : "";
        if (action === "read") {
          const rel = cleanRel(rec.path);
          if (!rel) return json({ ok: false, error: "chemin" }, 400);
          try {
            const content = await readFile(absOf(rel), "utf8");
            return json({ ok: true, path: rel, content });
          } catch {
            return json({ ok: false, error: "lecture" }, 404);
          }
        }
        if (action === "mkdir") {
          const rel = cleanRel(rec.path);
          if (!rel) return json({ ok: false, error: "chemin" }, 400);
          try {
            await mkdir(absOf(rel), { recursive: true });
            return json({ ok: true, path: rel });
          } catch {
            return json({ ok: false, error: "dossier" }, 500);
          }
        }
        if (action === "rename") {
          const from = cleanRel(rec.from);
          const toRaw = cleanRel(rec.to);
          if (!from || !toRaw) return json({ ok: false, error: "chemin" }, 400);
          try {
            await mkdir(path.dirname(absOf(toRaw)), { recursive: true });
            let dest = absOf(toRaw);
            if (rec.unique === true) dest = await uniqueAbs(dest);
            await rename(absOf(from), dest);
            return json({ ok: true, path: toRel(dest) });
          } catch {
            return json({ ok: false, error: "renommer" }, 500);
          }
        }
        if (action === "write") {
          const rel = cleanRel(rec.path);
          if (!rel) return json({ ok: false, error: "chemin" }, 400);
          const content = typeof rec.content === "string" ? rec.content : "";
          if (content.length > 80_000) return json({ ok: false, error: "taille" }, 400);
          try {
            let dest = absOf(rel);
            await mkdir(path.dirname(dest), { recursive: true });
            if (rec.unique === true) dest = await uniqueAbs(dest);
            await writeFile(dest, content, "utf8");
            return json({ ok: true, path: toRel(dest) });
          } catch {
            return json({ ok: false, error: "écriture" }, 500);
          }
        }
        return json({ ok: false, error: "action" }, 400);
      },
    },
  },
});
