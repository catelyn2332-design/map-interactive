import { resolveRoom } from "./edits";
import type { Character, Room, TokenPos } from "./types";

export function sessionMarkdown(input: {
  floorId: string;
  sceneRoomId: string | null;
  tokens: Record<string, TokenPos>;
  notes: Record<string, string>;
  selectedId: string | null;
  rooms: Room[];
  floors: Array<{ id: string; name: string; short: string }>;
  characters: Character[];
  schema?: never;
}): string {
  const nameOf = (id: string | null) => {
    if (!id) return null;
    return resolveRoom(id, input.rooms)?.name ?? id;
  };
  const floor = input.floors.find((f) => f.id === input.floorId);
  const lines: string[] = [
    "## Session — Atlas",
    "",
    `**Étage :** ${floor?.name ?? input.floorId}`,
    input.sceneRoomId
      ? `**Scène :** ${nameOf(input.sceneRoomId)}`
      : "**Scène :** —",
    input.selectedId ? `**Focus :** ${nameOf(input.selectedId)}` : "",
    "",
    "### Positions",
  ];
  if (!input.characters.length) {
    lines.push("- Aucun pion");
  }
  for (const who of input.characters) {
    const pos = input.tokens[who.id];
    if (!pos) continue;
    const fl = input.floors.find((f) => f.id === pos.floorId);
    lines.push(
      `- **${who.name}** — ${nameOf(pos.roomId) ?? "sur le plan"} (${fl?.short ?? pos.floorId})`,
    );
  }
  const noted = Object.entries(input.notes).filter(([, t]) => t.trim());
  if (noted.length) {
    lines.push("", "### Notes");
    for (const [id, text] of noted) {
      lines.push(`- **${nameOf(id)}** : ${text.trim()}`);
    }
  }
  return lines.filter((l) => l !== "").join("\n") + "\n";
}
