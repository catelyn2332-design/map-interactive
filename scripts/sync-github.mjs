#!/usr/bin/env node
/**
 * Pousse vers GitHub le code d’Atlas (pas le lore du vault, pas les builds).
 * --once  : un commit + push puis sortie
 * (défaut) : surveille les fichiers et synchronise après chaque pause d’écriture
 */
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";

const ROOT = "/workspace";
const LOG = "/tmp/github-sync.log";
const DEBOUNCE_MS = 8000;
const REMOTE = "origin";
const BRANCH = "main";

/** Chemins du bac à sable qui suivent GitHub. Hors artifacts (lore). */
const PATHS = [
  "src",
  "atlas-cloud",
  "public",
  "attachments",
  "scripts/sync-github.mjs",
  "package.json",
  "package-lock.json",
  "vite.config.ts",
  "tsconfig.json",
  "startup.sh",
  "eslint.config.mjs",
  ".prettierrc",
  ".gitignore",
  "AGENTS.project.md",
];

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  try {
    writeFileSync(LOG, line, { flag: "a" });
  } catch {
    /* ignore */
  }
  process.stderr.write(line);
}

function git(args, opts = {}) {
  const res = spawnSync("git", args, {
    cwd: ROOT,
    encoding: "utf8",
    env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
    ...opts,
  });
  return res;
}

function ensureIdentity() {
  const name = git(["config", "user.name"]);
  if (!name.stdout?.trim()) {
    git(["config", "user.name", "Lamina 1311"]);
  }
  const email = git(["config", "user.email"]);
  if (!email.stdout?.trim()) {
    git(["config", "user.email", "catelyn2332@gmail.com"]);
  }
}

function existingPaths() {
  return PATHS.filter((p) => existsSync(`${ROOT}/${p}`));
}

function porcelain() {
  const res = git(["status", "--porcelain", "--", ...existingPaths()]);
  return (res.stdout ?? "").trim();
}

function syncOnce(reason) {
  ensureIdentity();
  const paths = existingPaths();
  if (!paths.length) return { ok: false, skipped: "no-paths" };
  const add = git(["add", "-A", "--", ...paths]);
  if (add.status !== 0) {
    log(`git add failed: ${add.stderr || add.stdout}`);
    return { ok: false, error: "add" };
  }
  const dirty = porcelain();
  if (!dirty) return { ok: true, skipped: "clean" };

  const files = dirty
    .split("\n")
    .map((l) => l.slice(3).trim())
    .filter(Boolean)
    .slice(0, 6);
  const n = dirty.split("\n").filter(Boolean).length;
  const extra = n > files.length ? ` (+${n - files.length})` : "";
  const message = `Atlas: ${reason}${files.length ? ` — ${files.join(", ")}${extra}` : ""}`.slice(
    0,
    180,
  );
  const commit = git(["commit", "-m", message]);
  if (commit.status !== 0) {
    const err = `${commit.stderr || ""} ${commit.stdout || ""}`;
    if (/nothing to commit/.test(err)) return { ok: true, skipped: "clean" };
    log(`git commit failed: ${err}`);
    return { ok: false, error: "commit" };
  }

  let push = git(["push", REMOTE, `HEAD:${BRANCH}`]);
  if (push.status !== 0) {
    log(`push rejected, pull --rebase then retry: ${push.stderr || push.stdout}`);
    const pull = git(["pull", "--rebase", REMOTE, BRANCH]);
    if (pull.status !== 0) {
      log(`git pull --rebase failed: ${pull.stderr || pull.stdout}`);
      return { ok: false, error: "pull" };
    }
    push = git(["push", REMOTE, `HEAD:${BRANCH}`]);
    if (push.status !== 0) {
      log(`git push failed: ${push.stderr || push.stdout}`);
      return { ok: false, error: "push" };
    }
  }
  const sha = git(["rev-parse", "--short", "HEAD"]).stdout?.trim() ?? "?";
  log(`pushed ${sha} (${n} fichier${n > 1 ? "s" : ""})`);
  return { ok: true, sha, n };
}

function watch() {
  const paths = existingPaths();
  const proc = spawn(
    "inotifywait",
    [
      "-m",
      "-r",
      "-e",
      "close_write,create,delete,move,attrib",
      "--exclude",
      String.raw`(^|/)(\.git|node_modules|\.vercel|dist)(/|$)`,
      ...paths,
    ],
    { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"] },
  );
  let timer;
  const bounce = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      try {
        syncOnce("sync automatique");
      } catch (err) {
        log(`sync error: ${err instanceof Error ? err.message : String(err)}`);
      }
    }, DEBOUNCE_MS);
  };
  proc.stdout.on("data", bounce);
  proc.stderr.on("data", (buf) => {
    const t = String(buf);
    if (t.trim()) log(`inotify: ${t.trim()}`);
  });
  proc.on("exit", (code) => {
    log(`inotifywait exit ${code}, relance dans 4s`);
    setTimeout(watch, 4000);
  });
  log(`veille GitHub sur ${paths.join(", ")}`);
}

const once = process.argv.includes("--once");
mkdirSync("/tmp", { recursive: true });
ensureIdentity();

if (once) {
  const res = syncOnce("mise à jour depuis le bac à sable");
  if (!res.ok) process.exit(1);
  process.exit(0);
}

try {
  syncOnce("mise à jour depuis le bac à sable");
} catch (err) {
  log(`sync initiale: ${err instanceof Error ? err.message : String(err)}`);
}
watch();
