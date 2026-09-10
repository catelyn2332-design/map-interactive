import type { ReactNode } from "react";

/** Libellé lu par la bulle globale au survol. `className="contents"` n’ajoute pas de boîte. */
export function Tip({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
  side?: "top" | "bottom" | "left" | "right";
}) {
  return (
    <span data-tip={label} className="contents">
      {children}
    </span>
  );
}
