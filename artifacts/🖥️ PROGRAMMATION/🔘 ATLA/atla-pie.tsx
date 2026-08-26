import { useMemo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Sector, Tooltip } from "recharts";
import type { PieSectorDataItem } from "recharts/types/polar/Pie";
import {
  ATLA_CATEGORIES,
  ATLA_TOTAL,
  type AtlaCategory,
  type AtlaCategoryId,
} from "@/lib/atla";

type ChartRow = AtlaCategory & { count: number };

type AtlaPieProps = {
  selectedId: AtlaCategoryId | null;
  onSelect: (id: AtlaCategoryId) => void;
};

type TipProps = {
  active?: boolean;
  payload?: Array<{ payload: ChartRow }>;
};

function AtlaTooltip({ active, payload }: TipProps) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  const percent = ((row.count / ATLA_TOTAL) * 100).toFixed(1).replace(".", ",");
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2 text-sm shadow-soft">
      <p className="font-medium text-foreground">{row.label}</p>
      <p className="mt-0.5 tabular-nums text-muted-foreground">
        {row.count} fiche{row.count > 1 ? "s" : ""} · {percent} %
      </p>
    </div>
  );
}

function ActiveSlice(props: PieSectorDataItem) {
  const outer = typeof props.outerRadius === "number" ? props.outerRadius + 4 : 4;
  return <Sector {...props} outerRadius={outer} stroke="var(--color-background)" strokeWidth={2} />;
}

export function AtlaPie({ selectedId, onSelect }: AtlaPieProps) {
  const data = useMemo<ChartRow[]>(
    () => ATLA_CATEGORIES.map((category) => ({ ...category, count: category.fiches.length })),
    [],
  );

  const selectedIndex = data.findIndex((row) => row.id === selectedId);

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[26rem]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="label"
            cx="50%"
            cy="50%"
            innerRadius="0%"
            outerRadius="80%"
            paddingAngle={1.2}
            stroke="var(--color-background)"
            strokeWidth={2}
            activeIndex={selectedIndex >= 0 ? selectedIndex : undefined}
            activeShape={ActiveSlice}
            onClick={(_, index) => {
              const row = data[index];
              if (row) onSelect(row.id);
            }}
            animationDuration={500}
            animationEasing="ease-out"
          >
            {data.map((row) => (
              <Cell
                key={row.id}
                fill={row.colorToken}
                fillOpacity={selectedId && selectedId !== row.id ? 0.38 : 1}
                className="cursor-pointer outline-none"
                style={{ transition: "fill-opacity 250ms cubic-bezier(0.22, 1, 0.36, 1)" }}
              />
            ))}
          </Pie>
          <Tooltip content={<AtlaTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="flex size-[7.25rem] flex-col items-center justify-center rounded-full bg-background/92 shadow-soft sm:size-32">
          <span className="font-display text-4xl font-medium leading-none tracking-tight tabular-nums text-foreground sm:text-5xl">
            {ATLA_TOTAL}
          </span>
          <span className="mt-1.5 text-[0.65rem] font-medium uppercase tracking-[0.22em] text-subtle">
            fiches
          </span>
        </div>
      </div>
    </div>
  );
}
