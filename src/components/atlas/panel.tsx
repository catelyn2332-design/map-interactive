import { NamedTitle } from "@/components/atlas/editable-title";
import { cn } from "@/lib/utils";

export function Panel({
  titleId,
  fallback,
  children,
  className,
  bodyClassName,
}: {
  titleId: string;
  fallback: string;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      className={cn(
        "flex min-w-0 flex-col gap-1.5 rounded-lg border border-border bg-card p-2",
        className,
      )}
    >
      <NamedTitle
        id={titleId}
        fallback={fallback}
        as="h2"
        className="px-0.5 font-sans text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground"
      />
      <div className={cn("flex flex-wrap items-center gap-1.5", bodyClassName)}>{children}</div>
    </section>
  );
}
