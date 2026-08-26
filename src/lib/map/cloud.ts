import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { dbSource, getSql } from "@/lib/db";

function isRecord(raw: unknown): raw is Record<string, unknown> {
  return Boolean(raw) && typeof raw === "object" && !Array.isArray(raw);
}

/** Table exists + which backend is live. No row contents — safe unsigned. */
export const cloudBackendReady = createServerFn({ method: "GET" }).handler(
  async () => {
    const sql = await getSql();
    const rows = await sql<{ name: string | null }>`
      select to_regclass('public.atlas_cloud')::text as name
    `;
    return {
      source: dbSource,
      table: Boolean(rows[0]?.name),
    };
  },
);

export const inspectOwnCloud = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const rows = await sql<{ saved_at: string; bytes: number }>`
      select saved_at::text as saved_at, length(payload)::int as bytes
      from atlas_cloud
      where user_id = ${context.userId}
      limit 1
    `;
    const row = rows[0];
    if (!row) {
      return { present: false as const, source: dbSource };
    }
    return {
      present: true as const,
      source: dbSource,
      savedAt: row.saved_at,
      bytes: row.bytes,
    };
  });

export const loadCloudPrefs = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const rows = await sql<{ payload: string; saved_at: string }>`
      select payload, saved_at::text as saved_at
      from atlas_cloud
      where user_id = ${context.userId}
      limit 1
    `;
    const row = rows[0];
    if (!row) return null;
    const savedAt = Date.parse(row.saved_at);
    return {
      savedAt: Number.isFinite(savedAt) ? savedAt : Date.now(),
      payloadJson: row.payload,
    };
  });

export const saveCloudPrefs = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: unknown) => {
    if (!isRecord(data) || typeof data.savedAt !== "number" || typeof data.payloadJson !== "string") {
      throw new Error("invalid cloud prefs");
    }
    return { savedAt: data.savedAt, payloadJson: data.payloadJson };
  })
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const iso = new Date(data.savedAt).toISOString();
    await sql`
      insert into atlas_cloud (user_id, payload, saved_at)
      values (${context.userId}, ${data.payloadJson}, ${iso}::timestamptz)
      on conflict (user_id) do update
        set payload = excluded.payload,
            saved_at = excluded.saved_at
    `;
    return { ok: true as const };
  });

export const clearCloudPrefs = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    await sql`delete from atlas_cloud where user_id = ${context.userId}`;
    return { ok: true as const };
  });
