import { createFileRoute } from "@tanstack/react-router";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import snap from "@/lib/progress/home-plan.json";
import { ACCOUNT_EMAIL, OWNER } from "@/lib/progress/owner";

const VAULT_DIR = path.join(process.cwd(), "atlas-cloud");
const VAULT_FILE = path.join(VAULT_DIR, `${ACCOUNT_EMAIL}.json`);

type VaultDoc = {
  email: string;
  displayName: string;
  grokHandle: string;
  userId: string;
  savedAt: number;
  payloadJson: string;
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

function stamp(doc: Partial<VaultDoc> & { savedAt: number; payloadJson: string }): VaultDoc {
  return {
    email: ACCOUNT_EMAIL,
    displayName: OWNER.displayName,
    grokHandle: OWNER.grokHandle,
    userId: OWNER.id,
    savedAt: doc.savedAt,
    payloadJson: doc.payloadJson,
  };
}

async function readVault(): Promise<VaultDoc> {
  try {
    const raw = await readFile(VAULT_FILE, "utf8");
    const doc = JSON.parse(raw) as VaultDoc;
    if (doc && typeof doc.payloadJson === "string") {
      return stamp({
        savedAt: typeof doc.savedAt === "number" ? doc.savedAt : Date.now(),
        payloadJson: doc.payloadJson,
      });
    }
  } catch {
    /* fallback snapshot */
  }
  return stamp({
    savedAt: (snap as { savedAt?: number }).savedAt ?? Date.now(),
    payloadJson: JSON.stringify((snap as { payload: unknown }).payload ?? snap),
  });
}

async function writeVault(doc: VaultDoc) {
  await mkdir(VAULT_DIR, { recursive: true });
  await writeFile(VAULT_FILE, JSON.stringify(doc), "utf8");
}

export const Route = createFileRoute("/api/atlas/cloud")({
  server: {
    handlers: {
      GET: async () => {
        const doc = await readVault();
        return json(doc);
      },
      POST: async ({ request }) => {
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return json({ ok: false, error: "invalid json" }, 400);
        }
        const rec = body && typeof body === "object" ? (body as Record<string, unknown>) : null;
        const savedAt =
          typeof rec?.savedAt === "number" && Number.isFinite(rec.savedAt)
            ? rec.savedAt
            : Date.now();
        const payloadJson =
          typeof rec?.payloadJson === "string"
            ? rec.payloadJson
            : rec?.payload
              ? JSON.stringify(rec.payload)
              : null;
        if (!payloadJson) return json({ ok: false, error: "missing payload" }, 400);
        try {
          JSON.parse(payloadJson);
        } catch {
          return json({ ok: false, error: "payload json" }, 400);
        }
        const doc = stamp({ savedAt, payloadJson });
        await writeVault(doc);
        return json({
          ok: true,
          savedAt,
          bytes: payloadJson.length,
          email: doc.email,
          displayName: doc.displayName,
        });
      },
    },
  },
});
