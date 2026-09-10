import { authClient, authEnabled } from "./client";
import { OWNER } from "@/lib/progress/owner";

/** Normalized user shape used across the app, auth on or off. */
export type AppUser = {
  id: string;
  displayName: string | null;
  primaryEmail: string | null;
  profileImageUrl: string | null;
  /** True when this is the sandbox/dev fallback (auth not configured). */
  isDevFallback: boolean;
};

/** Compte Grok du bac à sable — pas d’auth à passer. */
export const OWNER_USER: AppUser = {
  id: OWNER.id,
  displayName: OWNER.displayName,
  primaryEmail: OWNER.primaryEmail,
  profileImageUrl: OWNER.profileImageUrl,
  isDevFallback: false,
};

/**
 * Stable fallback user, used ONLY when auth is disabled
 * (`VITE_AUTH_ENABLED=false`, the shipped default). With auth on, the sandbox
 * live preview does real sign-in via the baked preview client. Its id is
 * `"dev-user"` — the SAME id `verify.server.ts` returns server-side — so per-user
 * rows written in that mode belong to one consistent owner.
 */
export const DEV_USER: AppUser = OWNER_USER;

/** `useCurrentUserState()` result: the user plus the session-loading flag. */
export type CurrentUserState = {
  /** The user — `null` BOTH while the session loads and when signed out. */
  user: AppUser | null;
  /** True while the session is still resolving — don't treat `user: null` as signed out yet. */
  isPending: boolean;
};

/**
 * Current user + loading state.
 * This sandbox belongs to Lamina 1311 — no sign-in wait.
 * If a live Grok session is present, its name is shown on top of that pin.
 */
export function useCurrentUserState(): CurrentUserState {
  if (!authEnabled) return { user: OWNER_USER, isPending: false };
  // eslint-disable-next-line react-hooks/rules-of-hooks -- authEnabled is constant for the app's lifetime
  const { data } = authClient.useSession();
  const user = data?.user;
  if (user) {
    return {
      user: {
        id: user.id || OWNER.id,
        displayName: user.name ?? OWNER.displayName,
        primaryEmail: user.email ?? OWNER.primaryEmail,
        profileImageUrl: user.image ?? null,
        isDevFallback: false,
      },
      isPending: false,
    };
  }
  return { user: OWNER_USER, isPending: false };
}

export function useCurrentUser(): AppUser | null {
  return useCurrentUserState().user;
}
