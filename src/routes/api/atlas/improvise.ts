import { createFileRoute } from "@tanstack/react-router";
import { generatePlaceWithAi } from "@/lib/map/improvise-engine";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

export const Route = createFileRoute("/api/atlas/improvise")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return json({ ok: false, error: "Requête invalide." }, 400);
        }
        try {
          const out = await generatePlaceWithAi(body);
          return json(out);
        } catch {
          return json({ ok: false, error: "Erreur interne IA." }, 500);
        }
      },
    },
  },
});
