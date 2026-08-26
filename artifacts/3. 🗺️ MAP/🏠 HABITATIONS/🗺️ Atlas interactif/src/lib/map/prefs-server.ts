import { join } from "node:path";
import { createServerFn } from "@tanstack/react-start";

function prefsPath() {
  return join(process.cwd(), ".data", "atlas-prefs.json");
}

export const loadServerPrefs = createServerFn({ method: "GET" }).handler(
  async (): Promise<string | null> => {
    try {
      const { readFile } = await import("node:fs/promises");
      return await readFile(prefsPath(), "utf8");
    } catch {
      return null;
    }
  },
);

export const saveServerPrefs = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    if (typeof data !== "string" || !data) {
      throw new Error("invalid prefs");
    }
    return data;
  })
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    try {
      const { mkdir, writeFile } = await import("node:fs/promises");
      const dir = join(process.cwd(), ".data");
      await mkdir(dir, { recursive: true });
      await writeFile(prefsPath(), data, "utf8");
      return { ok: true };
    } catch {
      return { ok: false };
    }
  });
