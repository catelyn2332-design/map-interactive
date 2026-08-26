import { cn } from "@/lib/utils";

function Die({ rolling }: { rolling: boolean }) {
  return (
    <svg
      viewBox="0 0 72 72"
      className={cn(
        "size-[72px] text-primary",
        rolling && "animate-dice-spin",
      )}
      aria-hidden="true"
    >
      <rect
        x="3"
        y="3"
        width="66"
        height="66"
        rx="14"
        fill="currentColor"
        stroke="color-mix(in oklab, var(--color-primary-foreground) 16%, transparent)"
        strokeWidth="1.5"
      />
      <circle cx="22" cy="22" r="5" fill="var(--color-primary-foreground)" />
      <circle cx="50" cy="22" r="5" fill="var(--color-primary-foreground)" />
      <circle cx="36" cy="36" r="5" fill="var(--color-primary-foreground)" />
      <circle cx="22" cy="50" r="5" fill="var(--color-primary-foreground)" />
      <circle cx="50" cy="50" r="5" fill="var(--color-primary-foreground)" />
    </svg>
  );
}

export function DiceButton({
  rolling,
  onRoll,
}: {
  rolling: boolean;
  onRoll: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onRoll}
      disabled={rolling}
      aria-label="Lancer le dé"
      className="group flex w-full flex-col items-center gap-4 rounded-xl border border-border bg-card px-6 py-7 text-center transition-opacity duration-150 hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-80"
    >
      <Die rolling={rolling} />
      <div>
        <p className="font-display text-xl tracking-tight text-foreground">
          Lancer le dé
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Mots inconnus, hors de ce qui existe déjà
        </p>
      </div>
    </button>
  );
}
