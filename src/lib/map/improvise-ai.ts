import type { ImproviseResult } from "./improvise";
import type { ImproviseAiInput } from "./improvise-ai-types";

export type { ImproviseAiInput, PropHint } from "./improvise-ai-types";

export async function requestImprovise(
  input: ImproviseAiInput,
): Promise<{ ok: true; result: ImproviseResult } | { ok: false; error: string }> {
  let res: Response;
  try {
    res = await fetch("/api/atlas/improvise", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(28000),
    });
  } catch (err) {
    const name = err instanceof Error ? err.name : "";
    if (name === "TimeoutError" || name === "AbortError") {
      return { ok: false, error: "L’IA a mis trop longtemps." };
    }
    return { ok: false, error: "Impossible de joindre l’IA." };
  }

  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    return { ok: false, error: `Réponse vide (${res.status}).` };
  }
  const rec = body && typeof body === "object" ? (body as Record<string, unknown>) : null;
  if (rec && rec.ok === true && rec.result && typeof rec.result === "object") {
    const result = rec.result as ImproviseResult;
    if (typeof result.description === "string") {
      return { ok: true, result };
    }
  }
  const error =
    rec && typeof rec.error === "string" && rec.error.trim()
      ? rec.error
      : `IA indisponible (${res.status}).`;
  return { ok: false, error };
}
