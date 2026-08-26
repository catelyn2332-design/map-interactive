import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { GROK_PROVIDERS, readRememberedAccount, signIn } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { pressProps } from "@/lib/press";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const remembered = readRememberedAccount();
  return (
    <main className="grid min-h-dvh place-items-center bg-background px-4 text-foreground">
      <div className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-border bg-card p-6">
        <h1 className="font-display text-2xl font-medium tracking-[-0.03em]">
          Connexion
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Associez Atlas à votre compte Google ou X. Le compte
          provisoire dev@example.com n’est plus utilisé.
        </p>
        {remembered?.primaryEmail || remembered?.displayName ? (
          <p className="rounded-md border border-border bg-background px-3 py-2 text-xs text-muted-foreground">
            Dernier compte :{" "}
            <span className="font-medium text-foreground">
              {remembered.primaryEmail ?? remembered.displayName}
            </span>
          </p>
        ) : null}
        <div className="flex flex-col gap-2">
          {GROK_PROVIDERS.map((p) => (
            <Button
              key={p.providerId}
              type="button"
              className="w-full"
              {...pressProps(() => {
                void signIn(p.providerId, {
                  callbackURL: "/parametres/compte",
                }).catch((err) => {
                  toast.error(
                    err instanceof Error
                      ? err.message
                      : "Connexion impossible — autorisez les pop-ups",
                  );
                });
              })}
            >
              Continuer avec {p.label}
            </Button>
          ))}
        </div>
        <Button variant="outline" asChild>
          <Link to="/parametres/compte">Retour au compte</Link>
        </Button>
      </div>
    </main>
  );
}
