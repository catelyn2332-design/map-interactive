// Générateur SVG d'Atla — copie de src/lib/atla-svg.ts
import { ATLA_CATEGORIES, ATLA_TOTAL, atlaPercent } from "@/lib/atla";
import type { ResolvedTheme } from "@/lib/theme";

function polar(cx: number, cy: number, deg: number, radius: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
}

function slicePath(cx: number, cy: number, r: number, start: number, end: number) {
  const gap = 1.2;
  const a0 = start + gap / 2;
  const a1 = end - gap / 2;
  const p1 = polar(cx, cy, a0, r);
  const p2 = polar(cx, cy, a1, r);
  const large = a1 - a0 > 180 ? 1 : 0;
  return `M ${cx.toFixed(2)} ${cy.toFixed(2)} L ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${p2.x.toFixed(2)} ${p2.y.toFixed(2)} Z`;
}

const KEY = {
  personnages: "catPersonnages",
  map: "catMap",
  timelines: "catTimelines",
  factions: "catFactions",
  systeme: "catSysteme",
} as const;

export function serializeAtlaSvg(theme: ResolvedTheme): string {
  const cx = 400;
  const cy = 470;
  const r = 262;
  let angle = 0;
  const paths: string[] = [];
  const legend: string[] = [];
  ATLA_CATEGORIES.forEach((category, index) => {
    const count = category.fiches.length;
    const color = theme[KEY[category.id]];
    const sweep = (count / ATLA_TOTAL) * 360;
    paths.push(`  <path d="${slicePath(cx, cy, r, angle, angle + sweep)}" fill="${color}"/>`);
    legend.push(`  <g transform="translate(820 ${268 + index * 76})">
    <circle cx="10" cy="10" r="7" fill="${color}"/>
    <text x="32" y="5" fill="${theme.foreground}" font-family="Georgia, serif" font-size="22">${category.label}</text>
    <text x="32" y="28" fill="${theme.mutedForeground}" font-family="sans-serif" font-size="14">${count} · ${atlaPercent(count)} %</text>
  </g>`);
    angle += sweep;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="860" viewBox="0 0 1280 860">
  <rect width="1280" height="860" fill="${theme.background}"/>
  <rect x="36" y="36" width="1208" height="788" rx="28" fill="${theme.card}" stroke="${theme.border}"/>
  <text x="820" y="168" fill="${theme.foreground}" font-family="Georgia, serif" font-size="56">Atla</text>
${paths.join("\n")}
  <circle cx="${cx}" cy="${cy}" r="90" fill="${theme.background}"/>
  <text x="${cx}" y="${cy}" text-anchor="middle" fill="${theme.foreground}" font-family="Georgia, serif" font-size="48">${ATLA_TOTAL}</text>
${legend.join("\n")}
</svg>`;
}
