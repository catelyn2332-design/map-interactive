import { OWNER } from "@/lib/progress/owner";
const BEARER_SS = "grok-auth.bearer-token";
const BEARER_LS = "atlas-auth.bearer-token";
const USER_LS = "atlas-auth.last-user";
const EMAIL_LS = "atlas-auth.last-email";

export type LastUser = {
  id: string;
  displayName: string | null;
  primaryEmail: string | null;
  profileImageUrl: string | null;
};

function read(storage: Storage, key: string): string | null {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function write(storage: Storage, key: string, value: string | null) {
  try {
    if (value) storage.setItem(key, value);
    else storage.removeItem(key);
  } catch {
    /* quota / private mode */
  }
}

/** Copy the durable token into the live session store (and vice versa). */
export function rehydrateBearer(): string | null {
  if (typeof window === "undefined") return null;
  const fromSession = read(window.sessionStorage, BEARER_SS);
  const fromLocal = read(window.localStorage, BEARER_LS);
  const token = fromSession || fromLocal;
  if (!token) return null;
  if (!fromSession) write(window.sessionStorage, BEARER_SS, token);
  if (!fromLocal) write(window.localStorage, BEARER_LS, token);
  return token;
}

/** Keep localStorage in sync whenever a live token is present. */
export function mirrorBearer() {
  if (typeof window === "undefined") return;
  const token = read(window.sessionStorage, BEARER_SS);
  if (token) write(window.localStorage, BEARER_LS, token);
}

export function persistAuthToken(token: string) {
  if (typeof window === "undefined") return;
  write(window.sessionStorage, BEARER_SS, token);
  write(window.localStorage, BEARER_LS, token);
}

export function captureAuthToken(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const rec = data as Record<string, unknown>;
  if (typeof rec.token === "string" && rec.token.length > 8) return rec.token;
  const session = rec.session;
  if (session && typeof session === "object") {
    const tok = (session as { token?: unknown }).token;
    if (typeof tok === "string" && tok.length > 8) return tok;
  }
  return null;
}

export function readLastUser(): LastUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(USER_LS);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (typeof parsed.id !== "string" || !parsed.id) return null;
    return {
      id: parsed.id,
      displayName: typeof parsed.displayName === "string" ? parsed.displayName : null,
      primaryEmail:
        typeof parsed.primaryEmail === "string" ? parsed.primaryEmail : null,
      profileImageUrl:
        typeof parsed.profileImageUrl === "string" ? parsed.profileImageUrl : null,
    };
  } catch {
    return null;
  }
}

export function persistLastUser(user: LastUser) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(USER_LS, JSON.stringify(user));
    if (user.primaryEmail) window.localStorage.setItem(EMAIL_LS, user.primaryEmail);
  } catch {
    /* ignore */
  }
  mirrorBearer();
}

/** Rattache le bac à sable au compte Grok de Lamina, sans auth. */
export function pinOwnerAccount() {
  persistLastUser({
    id: OWNER.id,
    displayName: OWNER.displayName,
    primaryEmail: OWNER.primaryEmail,
    profileImageUrl: OWNER.profileImageUrl,
  });
}

export function readLastEmail(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(EMAIL_LS) ?? "";
  } catch {
    return "";
  }
}

/** Drop the mirrored token. Keep the pinned Grok owner. */
export function clearPersistedSession() {
  if (typeof window === "undefined") return;
  write(window.sessionStorage, BEARER_SS, null);
  write(window.localStorage, BEARER_LS, null);
  pinOwnerAccount();
}

export function hasPersistedSession(): boolean {
  return Boolean(rehydrateBearer() || readLastUser());
}

/** Inline boot: restore the bearer before React / get-session run. */
export const SESSION_BOOT_SCRIPT = `(function(){try{var k=${JSON.stringify(BEARER_SS)};var l=${JSON.stringify(BEARER_LS)};var t=sessionStorage.getItem(k)||localStorage.getItem(l);if(t){sessionStorage.setItem(k,t);localStorage.setItem(l,t);}var u=${JSON.stringify({
  id: OWNER.id,
  displayName: OWNER.displayName,
  primaryEmail: OWNER.primaryEmail,
  profileImageUrl: OWNER.profileImageUrl,
})};localStorage.setItem(${JSON.stringify(USER_LS)},JSON.stringify(u));localStorage.setItem(${JSON.stringify(EMAIL_LS)},${JSON.stringify(OWNER.primaryEmail)});}catch(e){}})();`;

let persistStarted = false;

export function startSessionPersist() {
  if (typeof window === "undefined" || persistStarted) return;
  persistStarted = true;
  rehydrateBearer();
  pinOwnerAccount();
  let hadToken = Boolean(read(window.sessionStorage, BEARER_SS));
  const tick = () => {
    const now = read(window.sessionStorage, BEARER_SS);
    if (hadToken && !now) {
      write(window.localStorage, BEARER_LS, null);
      hadToken = false;
      pinOwnerAccount();
      return;
    }
    if (now) {
      hadToken = true;
      write(window.localStorage, BEARER_LS, now);
    }
  };
  window.setInterval(tick, 800);
  window.addEventListener("pagehide", tick);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") tick();
  });
}
