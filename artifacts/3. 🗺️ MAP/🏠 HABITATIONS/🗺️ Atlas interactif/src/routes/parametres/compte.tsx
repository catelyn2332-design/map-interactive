import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { SettingsShell } from "@/components/atlas/settings-shell";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { inspectOwnCloud } from "@/lib/map/cloud";
import {
  notifyCloudSession,
  restoreCloudPreferences,
  saveCloudPreferences,
  usePrefs,
} from "@/lib/map/prefs";
import { useAtlas } from "@/lib/map/store";
import { pressProps } from "@/lib/press";

export const Route = createFileRoute("/parametres/compte")({
  component: ComptePage,
});

function formatBytes(n: number) {
  if (n < 1024) return `${n} o`;
  if (n < 1024 * 1024) return `${Math.round(n / 102.4) / 10} ko`;
  return `${Math.round(n / 104857.6) / 10} Mo`;
}

function ComptePage() {
  const { user, isPending } = useCurrentUserState();
  const resetWorld = useAtlas((s) => s.resetWorld);
  const cloud = usePrefs((s) => s.cloud);
  const cloudSavedAt = usePrefs((s) => s.cloudSavedAt);
  const [waited, setWaited] = useState(false);
  const [meta, setMeta] = useState<{
    present: boolean;
    bytes?: number;
    savedAt?: string;
  } | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setWaited(true), 3500);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (isPending) return;
    notifyCloudSession(Boolean(user));
  }, [user, isPending]);

  useEffect(() => {
    if (!user) {
      setMeta(null);
      return;
    }
    let cancelled = false;
    inspectOwnCloud()
      .then((row) => {
        if (cancelled) return;
        setMeta(row);
      })
      .catch(() => {
        if (!cancelled) setMeta(null);
      });
    return () => {
      cancelled = true;
    };
  }, [user, cloud, cloudSavedAt]);

  async function pushCloud() {
    const result = await saveCloudPreferences();
    if (result === "ok") toast.success("Copie enregistrée sur le compte");
    else if (result === "skipped")
      toast.error("Connexion requise pour copier sur le compte");
    else toast.error("La copie sur le compte a échoué");
  }

  async function pullCloud() {
    const ok = await restoreCloudPreferences();
    if (ok) toast.success("Plan restauré depuis le compte");
    else toast.message("Aucune copie sur ce compte pour le moment");
  }

  const showAuth = !isPending || waited;
  const cloudLine = !showAuth
    ? "Vérification du compte…"
    : !user
      ? "Copie locale uniquement — connectez-vous pour une copie sur le compte."
      : cloud === "syncing"
        ? "Copie vers le compte…"
        : cloud === "error"
          ? "La dernière copie sur le compte a échoué."
          : meta?.present
            ? `Copie sur le compte · ${formatBytes(meta.bytes ?? 0)}${
                cloudSavedAt
                  ? ` · ${new Date(cloudSavedAt).toLocaleString("fr-FR")}`
                  : ""
              }`
            : "Aucune copie sur ce compte pour le moment.";

  return (
    <SettingsShell title="Compte et données">
      <section className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
        <h2 className="font-display text-lg font-medium tracking-[-0.02em]">
          Compte
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Connecté, le plan, les descriptions des pièces, les étages et les
          pions se copient tout seuls sur le compte. Le thème reste le vôtre ;
          le bouton ci-dessous force une copie immédiate, y compris
          l’apparence.
        </p>
        <p className="text-xs text-muted-foreground" aria-live="polite" data-cloud-status={cloud}>
          {cloudLine}
        </p>
        {!showAuth ? (
          <div className="h-11 w-full animate-pulse rounded-md bg-muted" />
        ) : user ? (
          <>
            <UserButton />
            {user.primaryEmail ? (
              <p className="text-xs text-muted-foreground">{user.primaryEmail}</p>
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
            <p className="text-sm text-muted-foreground">
              Connectez-vous pour retrouver ce plan sur un autre appareil.
              En aperçu, le compte ne survit pas à un redémarrage — un email
              Atlas se recrée en quelques secondes.
            </p>
            <Button asChild>
              <Link to="/login">Se connecter</Link>
            </Button>
          </>
        )}
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
