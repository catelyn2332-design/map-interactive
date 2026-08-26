import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { SettingsShell } from "@/components/atlas/settings-shell";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  GROK_PROVIDERS,
  readRememberedAccount,
  signIn,
  signOut,
} from "@/lib/auth/client";
import { UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  restoreCloudPreferences,
  savePreferences,
} from "@/lib/map/prefs";
import { useAtlas } from "@/lib/map/store";
import { pressProps } from "@/lib/press";

export const Route = createFileRoute("/parametres/compte")({
  component: ComptePage,
});

function ComptePage() {
  const { user, isPending } = useCurrentUserState();
  const resetWorld = useAtlas((s) => s.resetWorld);
  const remembered = readRememberedAccount();
  const [busy, setBusy] = useState<string | null>(null);

  const realUser = user && !user.isDevFallback ? user : null;
  const fakeDev = Boolean(user?.isDevFallback);

  async function pushCloud() {
    const ok = await savePreferences();
    if (ok) toast.success("Copie enregistrée sur le compte");
    else toast.error("Connexion requise pour copier sur le compte");
  }

  async function pullCloud() {
    const ok = await restoreCloudPreferences();
    if (ok) toast.success("Plan restauré depuis le compte");
    else toast.message("Aucune copie sur ce compte pour le moment");
  }

  async function connect(providerId: string) {
    setBusy(providerId);
    try {
      await signIn(providerId, { callbackURL: "/parametres/compte" });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Connexion impossible — réessayez",
      );
      setBusy(null);
    }
  }

  async function disconnect() {
    setBusy("out");
    try {
      await signOut("/parametres/compte");
    } catch {
      toast.error("Déconnexion impossible — réessayez");
      setBusy(null);
    }
  }

  return (
    <SettingsShell title="Compte et données">
      <section className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
        <h2 className="font-display text-lg font-medium tracking-[-0.02em]">
          Compte
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Connecté, le plan, les descriptions des pièces, les étages et les
          pions se copient tout seuls sur le compte. Le thème reste le vôtre.
        </p>
        {isPending ? (
          <div className="h-11 w-full animate-pulse rounded-md bg-muted" />
        ) : realUser ? (
          <>
            <UserButton />
            {realUser.primaryEmail ? (
              <p className="text-xs text-muted-foreground">{realUser.primaryEmail}</p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Button type="button" {...pressProps(() => void pushCloud())}>
                Enregistrer sur le compte
              </Button>
              <Button
                type="button"
                variant="outline"
                {...pressProps(() => void pullCloud())}
              >
                Restaurer depuis le compte
              </Button>
            </div>
          </>
        ) : (
          <>
            {fakeDev ? (
              <p className="rounded-md border border-border bg-background px-3 py-2 text-sm">
                Compte local provisoire :{" "}
                <span className="font-medium">dev@example.com</span>
                . Ce n’est pas votre compte Grok. Connectez-vous ci-dessous pour
                le remplacer.
              </p>
            ) : remembered ? (
              <p className="text-sm text-muted-foreground">
                Dernier compte utilisé :{" "}
                <span className="font-medium text-foreground">
                  {remembered.primaryEmail ??
                    remembered.displayName ??
                    "compte enregistré"}
                </span>
                . Reconnectez-vous — la session Grok ne traverse pas d’elle-même
                un nouveau aperçu.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Aucun compte réel n’est lié pour le moment.
              </p>
            )}
          </>
        )}

        <Separator />

        <h3 className="text-sm font-medium">
          {realUser ? "Changer de compte" : "Se connecter"}
        </h3>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Google ou X via le courtier Grok. Changer de compte déconnecte
          d’abord la session actuelle, puis ouvre le sélecteur du fournisseur.
        </p>
        <div className="flex flex-col gap-2">
          {GROK_PROVIDERS.map((p) => (
            <Button
              key={p.providerId}
              type="button"
              variant={realUser ? "outline" : "default"}
              disabled={busy !== null}
              {...pressProps(() => void connect(p.providerId))}
            >
              {busy === p.providerId
                ? "Ouverture…"
                : realUser
                  ? `Passer à ${p.label}`
                  : `Continuer avec ${p.label}`}
            </Button>
          ))}
          {realUser ? (
            <Button
              type="button"
              variant="ghost"
              disabled={busy !== null}
              {...pressProps(() => void disconnect())}
            >
              {busy === "out" ? "Déconnexion…" : "Se déconnecter"}
            </Button>
          ) : null}
        </div>
      </section>

      <Separator />

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-medium tracking-[-0.02em]">
          Données locales
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Le plan vide n’efface pas la copie éventuellement déjà posée sur le
          compte.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            {...pressProps(() => {
              resetWorld();
              toast.message("Plan vide");
            })}
          >
            Nouveau plan vide
          </Button>
          <Button variant="outline" asChild>
            <Link to="/sauvegardes">Sauvegardes nommées</Link>
          </Button>
        </div>
      </section>
    </SettingsShell>
  );
}
