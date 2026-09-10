import { coerceValue, uid } from "./props";
import type { PropDef, PropValue, RoomStep } from "./types";
import type {
  AssistFill,
  AssistIntensity,
  AssistLength,
  AssistOverwrite,
  AssistVoice,
} from "./ui";
import { completeText, type ImproviseResult } from "./improvise";
import type { ImproviseAiInput, PropHint } from "./improvise-ai-types";

const LENGTH_HINT: Record<AssistLength, string> = {
  short: "une seule phrase",
  medium: "deux ou trois phrases",
  long: "un court paragraphe (4–6 phrases)",
};

const VOICE_HINT: Record<AssistVoice, string> = {
  sensory: "sensorielle : ce qu’on voit, sent, entend au seuil. Pas de résumé administratif.",
  sheet: "fiche froide : fonction, matière, accès, usage. Factuel.",
  mix: "une phrase sensorielle, puis une phrase de fiche (fonction / accès).",
};

const TONE_HINT: Record<AssistIntensity, string> = {
  sober: "sobre, précis, sans fioriture",
  lively: "vivant, concret, sans comédie",
  baroque: "dense, chargé de détails, jamais parodique",
};

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fence ? fence[1]!.trim() : trimmed;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(raw.slice(start, end + 1));
  } catch {
    return null;
  }
}

function mapPreset(def: PropHint, raw: unknown): unknown {
  if (typeof raw !== "string") return raw;
  const hit = def.options?.find(
    (o) => o.id === raw || o.label.toLowerCase() === raw.trim().toLowerCase(),
  );
  return hit?.id ?? raw;
}

function readInput(raw: unknown): ImproviseAiInput | null {
  if (!raw || typeof raw !== "object") return null;
  const t = raw as Record<string, unknown>;
  if (t.kind !== "room" && t.kind !== "zone") return null;
  if (typeof t.name !== "string") return null;
  return {
    name: t.name,
    kind: t.kind,
    workspace: typeof t.workspace === "string" ? t.workspace : "",
    floor: typeof t.floor === "string" ? t.floor : "",
    existing: typeof t.existing === "string" ? t.existing : "",
    prompt: typeof t.prompt === "string" ? t.prompt : "",
    voice: (t.voice as AssistVoice) || "sensory",
    length: (t.length as AssistLength) || "medium",
    intensity: (t.intensity as AssistIntensity) || "lively",
    fill: (t.fill as AssistFill) || "assigned",
    overwrite: (t.overwrite as AssistOverwrite) || "draft",
    props: Array.isArray(t.props) ? (t.props as PropHint[]) : [],
    current:
      t.current && typeof t.current === "object" && !Array.isArray(t.current)
        ? (t.current as Record<string, PropValue>)
        : {},
    steps: Array.isArray(t.steps)
      ? (t.steps as RoomStep[]).filter((s) => s && typeof s.label === "string")
      : undefined,
  };
}

export async function generatePlaceWithAi(
  raw: unknown,
): Promise<{ ok: true; result: ImproviseResult } | { ok: false; error: string }> {
  const data = readInput(raw);
  if (!data) return { ok: false, error: "Requête incomplète." };

  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) return { ok: false, error: "IA indisponible ici." };

  const skipDesc = Boolean(data.existing?.trim()) && data.overwrite === "skip";
  const completeDesc = Boolean(data.existing?.trim()) && data.overwrite !== "skip" && data.overwrite !== "replace";
  const needProps = data.fill !== "description" && data.props.length > 0;
  const kindWord = data.kind === "zone" ? "zone" : "pièce";
  const name = data.name.trim() || (data.kind === "zone" ? "cette zone" : "cette pièce");
  const existingSteps = (data.steps ?? []).filter((s) => typeof s.label === "string");

  const system = [
    "Tu aides à remplir une carte interactive de worldbuilding (bac à sable).",
    'Tu réponds UNIQUEMENT par un objet JSON : {"description": string, "props": object, "steps": [{"label": string}]}.',
    "Le champ « consigne » est une INSTRUCTION. Ne la recopie jamais, ni en tout ni en partie, dans la description.",
    "La description doit coller au NOM du lieu et à la consigne. Invente le texte ; n’utilise pas de phrases toutes faites.",
    "Les valeurs de props doivent coller à la description que tu viens d’écrire, pas à un autre lieu.",
    "Pas de markdown, pas de titre, pas de liste à puces dans description.",
  ].join(" ");

  const user = [
    data.workspace ? `Monde / workspace : ${data.workspace}` : "Monde : non nommé.",
    data.floor ? `Étage : ${data.floor}` : null,
    `Lieu : ${kindWord} nommé « ${name} ».`,
    data.existing?.trim()
      ? `Texte actuel : ${data.existing.trim().slice(0, 600)}`
      : "Pas encore de description.",
    skipDesc
      ? "Ne change pas la description : renvoie exactement le texte actuel."
      : completeDesc
        ? `Le lieu a déjà un texte. N’écris PAS une nouvelle description complète et ne recopie pas le texte actuel. Écris uniquement une SUITE (${LENGTH_HINT[data.length]}) qui le complète, voix ${VOICE_HINT[data.voice]}, ton ${TONE_HINT[data.intensity]}.`
        : `Écris une description en français, ${LENGTH_HINT[data.length]}, voix ${VOICE_HINT[data.voice]}, ton ${TONE_HINT[data.intensity]}.`,
    data.kind === "room"
      ? existingSteps.length
        ? `Étapes actuelles : ${JSON.stringify(existingSteps.map((s) => s.label))}. Renvoie "steps" : enrichis les intitulés vides, garde les autres, tu peux en ajouter 1 ou 2 (max 6 au total). Objets { "label": string } seulement.`
        : 'Propose 2 ou 3 étapes concrètes (fouiller, écouter, ouvrir…) dans "steps": [{"label": string}].'
      : 'Renvoie "steps": [].',
    data.prompt.trim()
      ? `Consigne de l’autrice (à suivre, jamais à citer) : ${data.prompt.trim().slice(0, 800)}`
      : "Pas de consigne particulière.",
    needProps
      ? `Remplis props avec ces clés seulement : ${JSON.stringify(
          data.props.map((p) => ({
            id: p.id,
            nom: p.name,
            type: p.type,
            choix: p.options?.map((o) => `${o.id}=${o.label}`),
          })),
        )}. Types : preset = id d’un choix, choice = texte, tags = tableau de textes, toggle = bool, color = #hex, number = nombre, text/longtext = texte.`
      : 'Renvoie "props": {}.',
    `Valeurs actuelles : ${JSON.stringify(data.current ?? {})}.`,
  ]
    .filter(Boolean)
    .join("\n");

  const maxTokens = data.length === "short" ? 280 : data.length === "long" ? 700 : 420;
  const temperature =
    data.intensity === "sober" ? 0.4 : data.intensity === "baroque" ? 1 : 0.75;

  let res: Response;
  try {
    res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4.5",
        temperature,
        max_tokens: maxTokens,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });
  } catch {
    return { ok: false, error: "Réseau IA indisponible." };
  }

  if (!res.ok) {
    return { ok: false, error: `IA indisponible (${res.status}).` };
  }

  const body = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = body.choices?.[0]?.message?.content ?? "";
  const parsed = extractJson(text);
  if (!parsed || typeof parsed !== "object") {
    return { ok: false, error: "Réponse IA illisible." };
  }
  const rec = parsed as Record<string, unknown>;
  let description = typeof rec.description === "string" ? rec.description.trim() : "";
  if (skipDesc) description = data.existing?.trim() ?? description;
  else if (completeDesc) description = completeText(data.existing, description);
  if (!description) {
    return { ok: false, error: "L’IA n’a pas écrit de description." };
  }

  const rawProps =
    rec.props && typeof rec.props === "object" && !Array.isArray(rec.props)
      ? (rec.props as Record<string, unknown>)
      : {};
  const props: Record<string, PropValue> = { ...data.current };
  if (needProps) {
    for (const hint of data.props) {
      if (!(hint.id in rawProps)) continue;
      const fake = {
        id: hint.id,
        name: hint.name,
        type: hint.type as PropDef["type"],
        options: hint.options ?? [],
        vars: [],
        filterable: false,
        mapTint: false,
      } satisfies PropDef;
      props[hint.id] = coerceValue(fake, mapPreset(hint, rawProps[hint.id]));
    }
  }

  let steps: RoomStep[] | undefined;
  if (data.kind === "room") {
    const rawSteps = Array.isArray(rec.steps) ? rec.steps : [];
    const labels: string[] = [];
    for (const item of rawSteps) {
      const label =
        typeof item === "string"
          ? item.trim()
          : item && typeof item === "object" && typeof (item as { label?: unknown }).label === "string"
            ? (item as { label: string }).label.trim()
            : "";
      if (label) labels.push(label.slice(0, 80));
      if (labels.length >= 6) break;
    }
    if (labels.length) {
      const prev = existingSteps;
      const next: RoomStep[] = [];
      const used = new Set<number>();
      for (const step of prev) {
        if (step.label.trim()) {
          next.push({ ...step });
        } else {
          const i = labels.findIndex((_, idx) => !used.has(idx));
          if (i >= 0) {
            used.add(i);
            next.push({ ...step, label: labels[i]! });
          } else {
            next.push({ ...step });
          }
        }
      }
      for (let i = 0; i < labels.length && next.length < 6; i++) {
        if (used.has(i)) continue;
        const already = next.some((s) => s.label === labels[i]);
        if (already) continue;
        next.push({ id: uid("step"), label: labels[i]!, done: false });
      }
      steps = next;
    }
  }

  return {
    ok: true,
    result: { description, props, skippedDescription: skipDesc, steps },
  };
}
