import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sanitizeHexColor } from "@/lib/map/types";
import { cn } from "@/lib/utils";

export function ColorWheel({
  value,
  onChange,
  label = "Couleur",
  id = "zone-color",
  className,
}: {
  value: string;
  onChange: (hex: string) => void;
  label?: string;
  id?: string;
  className?: string;
}) {
  const hex = sanitizeHexColor(value) ?? "#6a7a58";
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label ? <Label htmlFor={id}>{label}</Label> : null}
      <div className="flex items-center gap-3">
        <input
          id={id}
          type="color"
          value={hex}
          aria-label={label || "Roue des couleurs"}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 w-14 cursor-pointer appearance-none rounded-md border border-border bg-card p-1"
        />
        <Input
          value={hex}
          aria-label="Code couleur"
          className="font-mono uppercase"
          onChange={(e) => {
            const next = e.target.value;
            if (next === "" || next === "#") {
              onChange("#");
              return;
            }
            const clean = sanitizeHexColor(next);
            if (clean) onChange(clean);
            else if (/^#[0-9a-fA-F]{1,6}$/.test(next)) onChange(next);
          }}
          onBlur={() => {
            const clean = sanitizeHexColor(hex);
            if (clean) onChange(clean);
          }}
        />
      </div>
    </div>
  );
}
