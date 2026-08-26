import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { GROK_PROVIDERS, authClient, authEnabled, signIn } from "@/lib/auth/client";
import { emailAndPasswordEnabled } from "@/lib/auth/email-password";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { pressProps } from "@/lib/press";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  return (
    <main className="grid min-h-dvh place-items-center bg-background px-4 text-foreground">
      <div className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-border bg-card p-6">
        <h1 className="font-display text-2xl font-medium tracking-[-0.03em]">
          Connexion
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Associez Atlas à votre compte pour retrouver couleurs, plan et
          propriétés d’un appareil à l’autre.
        </p>
        {authEnabled ? (
          <div className="flex flex-col gap-2">
            {GROK_PROVIDERS.map((p) => (
              <Button
                key={p.providerId}
                type="button"
                className="w-full"
                {...pressProps(() => {
                  void signIn(p.providerId, { callbackURL: "/parametres/compte" });
                })}
              >
                Continuer avec {p.label}
              </Button>
            ))}
            {emailAndPasswordEnabled ? (
              <>
                <Separator className="my-2" />
                <EmailAuth />
              </>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            La connexion n’est pas disponible pour le moment.
          </p>
        )}
        <Button variant="outline" asChild>
          <Link to="/parametres">Retour aux paramètres</Link>
        </Button>
      </div>
    </main>
  );
}

function EmailAuth() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      if (mode === "up") {
        const { error: err } = await authClient.signUp.email({
          email,
          password,
          name: email.split("@")[0] || "Atlas",
        });
        if (err) throw new Error(err.message);
      } else {
        const { error: err } = await authClient.signIn.email({
          email,
          password,
        });
        if (err) throw new Error(err.message);
      }
      window.location.href = "/parametres/compte";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connexion impossible");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <p className="text-xs text-muted-foreground">
        Ou un compte email propre à Atlas.
      </p>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="atlas-email">Email</Label>
        <Input
          id="atlas-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="atlas-password">Mot de passe</Label>
        <Input
          id="atlas-password"
          type="password"
          autoComplete={mode === "up" ? "new-password" : "current-password"}
          required
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" className="w-full" disabled={busy} aria-busy={busy}>
        {busy
          ? mode === "up"
            ? "Création…"
            : "Connexion…"
          : mode === "up"
            ? "Créer le compte"
            : "Se connecter"}
      </Button>
      <button
        type="button"
        className="text-xs text-muted-foreground underline-offset-4 hover:underline"
        onClick={() => {
          setMode((m) => (m === "in" ? "up" : "in"));
          setError(null);
        }}
      >
        {mode === "in"
          ? "Pas encore de compte — en créer un"
          : "Déjà un compte — se connecter"}
      </button>
    </form>
  );
}