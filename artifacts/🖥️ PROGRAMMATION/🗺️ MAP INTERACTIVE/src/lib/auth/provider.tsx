import { useEffect, type ReactNode } from "react";
import { rememberAccount } from "./client";
import { useCurrentUserState } from "./use-current-user";

/**
 * App-wide client provider mounted once near the root (in `src/routes/__root.tsx`).
 * Remembers the last real account so a return to Grok can reconnect instead of
 * falling back to the fake `dev@example.com` user.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <>
      <AuthMemory />
      {children}
    </>
  );
}

function AuthMemory() {
  const { user, isPending } = useCurrentUserState();
  useEffect(() => {
    if (isPending) return;
    if (user && !user.isDevFallback) {
      rememberAccount({
        id: user.id,
        displayName: user.displayName,
        primaryEmail: user.primaryEmail,
      });
    }
  }, [user, isPending]);
  return null;
}
