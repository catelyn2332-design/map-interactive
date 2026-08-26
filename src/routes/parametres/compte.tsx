import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { SettingsShell } from "@/components/atlas/settings-shell";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { UserButton } from "@/lib/auth/gates";
import { useCurrentUserState, type AppUser } from "@/lib/auth/use-current-user";
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
  const [live, setLive] = useState(false);
  useEffect(() => {
    setLive(true);
  }, []);

  return (
    <SettingsShell title="Compte et données">
      {live ? <CompteAuth /> : <SignedOutPanel />}
      <Separator />
      <LocalDataPanel />
    </SettingsShell>
  );
}

function CompteAuth() {
  const { user } = useCurrentUserState();
  useEffect(() => {
    notifyCloudSession(Boolean(user));
  }, [user]);
  return user ? <SignedInPanel user={user} /> : <SignedOutPanel />;
}

function SignedOutPanel() {
  return (
    <section className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
      <h2 className="font-display text-lg font-medium tracking-[-0.02em]">
        Compte
      </h2>
      <p className="text-sm leading-relaxed text-muted-foreground">
        Connecté, le plan, les descriptions des pièces, les étages et les pions
        se copient tout seuls sur le compte. Le thème reste le vôtre.
      </p>
      <p className="text-xs text-muted-foreground" aria-live="polite">
        Copie locale uniquement — connectez-vous pour une copie sur le compte.
      </p>
      <p className="text-sm text-muted-foreground">
        Connectez-vous pour retrouver ce plan sur un autre appareil. En aperçu,
        le compte ne survit pas à un redémarrage.
      </p>
      <Button asChild>
        <Link to="/login">Se connecter</Link>
      </Button>
    </section>
  );
}

function SignedInPanel({ user }: { user: AppUser }) {
  const cloud = usePrefs((s) => s.cloud);
  const cloudSavedAt = usePrefs((s) => s.cloudSavedAt);
  const [meta, setMeta] = useState<{
    present: boolean;
    bytes?: number;
    savedAt?: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    inspectOwnCloud()
      .then((row) => {
        if (!cancelled) setMeta(row);
      })
      .catch(() => {
        if (!cancelled) setMeta(null);
      });
    return () => {
      cancelled = true;
    };
  }, [cloud, cloudSavedAt]);

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

  const cloudLine =
    cloud === "syncing"
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
    <section className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
      <h2 className="font-display text-lg font-medium tracking-[-0.02em]">
        Compte
      </h2>
      <p className="text-sm leading-relaxed text-muted-foreground">
        Connecté, le plan, les descriptions des pièces, les étages et les pions
        se copient tout seuls sur le compte. Le thème reste le vôtre ; le
        bouton ci-dessous force une copie immédiate, y compris l’apparence.
      </p>
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {cloudLine}
      </p>
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
    </section>
  );
}

function LocalDataPanel() {
  const resetWorld = useAtlas((s) => s.resetWorld);
  return (
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
  );
}
