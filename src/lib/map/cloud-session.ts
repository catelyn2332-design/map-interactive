/** Session probe for cloud copy — no Better Auth client (keeps the map light). */

import {
  hasPersistedSession,
  rehydrateBearer,
} from "./session-persist";

const AUTH_ON = import.meta.env.VITE_AUTH_ENABLED !== "false";

let known: boolean | null =
  typeof import.meta.hot?.data.cloudSignedIn === "boolean"
    ? (import.meta.hot.data.cloudSignedIn as boolean)
    : null;
let inflight: Promise<boolean> | null = null;

if (typeof window !== "undefined") {
  rehydrateBearer();
  if (known === null && hasPersistedSession()) known = true;
}

export function peekCloudSession(): boolean | null {
  return known;
}

export function rememberCloudSession(signedIn: boolean) {
  known = signedIn;
  if (import.meta.hot) import.meta.hot.data.cloudSignedIn = signedIn;
}

export function isUnauthorizedError(err: unknown): boolean {
  if (!err) return false;
  if (typeof err === "string") return err.includes("Unauthorized");
  if (typeof err !== "object") return false;
  const rec = err as { message?: unknown; name?: unknown };
  const message = typeof rec.message === "string" ? rec.message : "";
  const name = typeof rec.name === "string" ? rec.name : "";
  return message.includes("Unauthorized") || name === "UnauthorizedError";
}

/** True only after a live session round-trip (or a remembered signed-in flag). */
export async function hasCloudSession(): Promise<boolean> {
  if (!AUTH_ON) {
    rememberCloudSession(false);
    return false;
  }
  rehydrateBearer();
  if (known === true) return true;
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const headers: Record<string, string> = {};
      const token = rehydrateBearer();
      if (token) headers.Authorization = `Bearer ${token}`;
      const ctrl = new AbortController();
      const timer = window.setTimeout(() => ctrl.abort(), 2500);
      const res = await fetch("/api/auth/get-session", {
        credentials: "include",
        headers,
        signal: ctrl.signal,
      });
      window.clearTimeout(timer);
      if (res.status === 401 || res.status === 403) {
        rememberCloudSession(false);
        return false;
      }
      if (!res.ok) {
        // Network / preview hiccup — keep a persisted account rather than
        // flipping the visitor to signed-out mid-session.
        if (hasPersistedSession()) {
          rememberCloudSession(true);
          return true;
        }
        return false;
      }
      const data = (await res.json()) as { user?: { id?: string } } | null;
      const ok = Boolean(data?.user?.id);
      rememberCloudSession(ok);
      return ok;
    } catch {
      if (hasPersistedSession()) {
        rememberCloudSession(true);
        return true;
      }
      return false;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}
