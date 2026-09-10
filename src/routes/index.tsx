import { createFileRoute } from "@tanstack/react-router";
import { AtlasApp } from "@/components/atlas/atlas-app";

type Search = { e?: string };

export const Route = createFileRoute("/")({
  validateSearch: (raw: Record<string, unknown>): Search => ({
    e: typeof raw.e === "string" && raw.e.length > 0 ? raw.e : undefined,
  }),
  component: Home,
});

function Home() {
  const { e } = Route.useSearch();
  return <AtlasApp urlFloor={e} />;
}