import { pressProps } from "@/lib/press";
import { cn } from "@/lib/utils";

export function Chip({
  active,
  onClick,
  children,
  size = "md",
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  size?: "sm" | "md";
}) {
  return (
    <button
      type="button"
      {...pressProps(onClick)}
      aria-pressed={active}
      className={cn(
        "shrink-0 touch-manipulation rounded-full border text-xs transition-colors",
        size === "sm" ? "h-9 px-2.5" : "h-11 px-3",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
