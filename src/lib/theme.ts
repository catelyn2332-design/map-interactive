export type Theme = {
  background: string;
  foreground: string;
  paper: string;
  card: string;
  primary: string;
  mutedForeground: string;
  clay: string;
  border: string;
  secondary: string;
  field: string;
  icon: string;
  iconStroke: string;
  displayFont: string;
  sansFont: string;
  radius: number;
};

export const FONT_CSS: Record<string, string> = {
  Fraunces: "Fraunces:opsz,wght@9..144,500;9..144,600",
  Newsreader: "Newsreader:opsz,wght@6..72,500;6..72,600",
  "Libre Baskerville": "Libre+Baskerville:wght@400;700",
  Spectral: "Spectral:wght@400;600",
  Figtree: "Figtree:wght@400;500;600",
  "Source Sans 3": "Source+Sans+3:wght@400;500;600",
  "Work Sans": "Work+Sans:wght@400;500;600",
  Karla: "Karla:wght@400;500;600",
};

export function extraFontsHref(theme: Theme): string | null {
  const names = [theme.displayFont, theme.sansFont].filter(
    (n) => n && n !== "Figtree" && n !== "Fraunces",
  );
  const unique = [...new Set(names)];
  if (!unique.length) return null;
  const q = unique
    .map((n) => `family=${FONT_CSS[n] ?? encodeURIComponent(n)}`)
    .join("&");
  return `https://fonts.googleapis.com/css2?${q}&display=swap`;
}

export function ensureThemeFonts(theme: Theme) {
  if (typeof document === "undefined") return;
  const href = extraFontsHref(theme);
  const id = "atlas-extra-fonts";
  const existing = document.getElementById(id);
  if (!href) {
    existing?.remove();
    return;
  }
  if (existing instanceof HTMLLinkElement) {
    if (existing.getAttribute("href") !== href) existing.href = href;
    return;
  }
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
}

export const FONT_OPTIONS = [
  {
    id: "Fraunces",
    stack: '"Fraunces", ui-serif, Georgia, serif',
    kind: "display" as const,
  },
  {
    id: "Newsreader",
    stack: '"Newsreader", ui-serif, Georgia, serif',
    kind: "display" as const,
  },
  {
    id: "Libre Baskerville",
    stack: '"Libre Baskerville", ui-serif, Georgia, serif',
    kind: "display" as const,
  },
  {
    id: "Spectral",
    stack: '"Spectral", ui-serif, Georgia, serif',
    kind: "display" as const,
  },
  {
    id: "Figtree",
    stack: '"Figtree", ui-sans-serif, system-ui, sans-serif',
    kind: "sans" as const,
  },
  {
    id: "Source Sans 3",
    stack: '"Source Sans 3", ui-sans-serif, system-ui, sans-serif',
    kind: "sans" as const,
  },
  {
    id: "Work Sans",
    stack: '"Work Sans", ui-sans-serif, system-ui, sans-serif',
    kind: "sans" as const,
  },
  {
    id: "Karla",
    stack: '"Karla", ui-sans-serif, system-ui, sans-serif',
    kind: "sans" as const,
  },
];

export const DEFAULT_THEME: Theme = {
  background: "#dbe8f0",
  foreground: "#738a9c",
  paper: "#eeffe0",
  card: "#e7f1f6",
  primary: "#5b7c8d",
  mutedForeground: "#738a9c",
  clay: "#8f3d32",
  border: "#b7c9d4",
  secondary: "#cfe0e8",
  field: "#f4f9fc",
  icon: "#d4e3eb",
  iconStroke: "#5a7384",
  displayFont: "Fraunces",
  sansFont: "Figtree",
  radius: 12,
};

export function isHex(value: string) {
  return /^#[0-9a-fA-F]{6}$/.test(value);
}

function hexToRgb(hex: string) {
  const n = hex.replace("#", "");
  return {
    r: parseInt(n.slice(0, 2), 16),
    g: parseInt(n.slice(2, 4), 16),
    b: parseInt(n.slice(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number) {
  const to = (v: number) =>
    Math.max(0, Math.min(255, Math.round(v)))
      .toString(16)
      .padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}

export function mix(a: string, b: string, t: number) {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  return rgbToHex(
    A.r + (B.r - A.r) * t,
    A.g + (B.g - A.g) * t,
    A.b + (B.b - A.b) * t,
  );
}

export function luminance(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  const lin = [r, g, b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * lin[0]! + 0.7152 * lin[1]! + 0.0722 * lin[2]!;
}

export function contrastInk(hex: string) {
  return luminance(hex) > 0.45 ? "#1f1c17" : "#f3eee4";
}

export function isDarkTheme(theme: Theme) {
  return luminance(theme.background) < 0.45;
}

export function fontStack(name: string, fallback: "display" | "sans") {
  const found = FONT_OPTIONS.find((f) => f.id === name);
  if (found) return found.stack;
  return fallback === "display"
    ? "ui-serif, Georgia, serif"
    : "ui-sans-serif, system-ui, sans-serif";
}

export function themesEqual(a: Theme, b: Theme) {
  return (Object.keys(DEFAULT_THEME) as (keyof Theme)[]).every(
    (key) => a[key] === b[key],
  );
}

function darken(hex: string, amount = 0.12) {
  return mix(hex, "#111111", amount);
}

export function themeCssVars(theme: Theme): Record<string, string> {
  const bg = theme.background;
  const fg = theme.foreground;
  const r = theme.radius;
  const field = theme.field;
  const icon = theme.icon;
  return {
    "--color-background": bg,
    "--color-foreground": fg,
    "--color-paper": theme.paper,
    "--color-card": theme.card,
    "--color-card-foreground": fg,
    "--color-muted": mix(bg, fg, 0.08),
    "--color-muted-foreground": theme.mutedForeground,
    "--color-primary": theme.primary,
    "--color-primary-foreground": contrastInk(theme.primary),
    "--color-primary-hover": darken(theme.primary, 0.14),
    "--color-secondary": theme.secondary,
    "--color-secondary-foreground": fg,
    "--color-accent": mix(theme.card, theme.primary, 0.16),
    "--color-accent-foreground": fg,
    "--color-border": theme.border,
    "--color-input": theme.border,
    "--color-field": field,
    "--color-field-foreground": fg,
    "--color-icon": icon,
    "--color-icon-foreground": contrastInk(icon),
    "--color-icon-hover": darken(icon, 0.12),
    "--color-icon-stroke": theme.iconStroke,
    "--color-ring": theme.primary,
    "--color-destructive": theme.clay,
    "--color-destructive-foreground": contrastInk(theme.clay),
    "--color-ink": fg,
    "--color-stone": mix(theme.paper, fg, 0.28),
    "--color-clay": theme.clay,
    "--color-token-stella": mix(fg, theme.paper, 0.35),
    "--color-token-antoine": mix(theme.primary, fg, 0.35),
    "--color-token-myriam": theme.primary,
    "--font-sans": fontStack(theme.sansFont, "sans"),
    "--font-display": fontStack(theme.displayFont, "display"),
    "--radius": `${r}px`,
    "--radius-sm": `${Math.max(4, r - 4)}px`,
    "--radius-md": `${r}px`,
    "--radius-lg": `${r + 4}px`,
    "--radius-xl": `${r + 12}px`,
  };
}

export function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  if (!isHex(theme.background) || !isHex(theme.foreground)) return;
  const root = document.documentElement;
  const vars = themeCssVars(theme);
  for (const [key, value] of Object.entries(vars)) {
    root.style.setProperty(key, value);
  }
  root.style.backgroundColor = theme.background;
  root.style.colorScheme = isDarkTheme(theme) ? "dark" : "light";
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", theme.background);
}

export const THEME_STORAGE_KEY = "atlas-bellarosa-theme";

export const THEME_BOOT_SCRIPT = `(function(){try{function read(k){try{var raw=localStorage.getItem(k);if(!raw)return null;var parsed=JSON.parse(raw);var t=(parsed&&parsed.state&&parsed.state.theme)||(parsed&&parsed.theme)||parsed;if(t&&typeof t==="object"&&t.background&&t.foreground)return t;return null;}catch(err){return null;}}var t=read("${THEME_STORAGE_KEY}")||read("${THEME_STORAGE_KEY}-backup");if(!t)return;function hexToRgb(h){h=String(h).replace("#","");return{r:parseInt(h.slice(0,2),16),g:parseInt(h.slice(2,4),16),b:parseInt(h.slice(4,6),16)};}function rgbToHex(r,g,b){function to(v){return Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,"0");}return"#"+to(r)+to(g)+to(b);}function mix(a,b,p){var A=hexToRgb(a),B=hexToRgb(b);return rgbToHex(A.r+(B.r-A.r)*p,A.g+(B.g-A.g)*p,A.b+(B.b-A.b)*p);}function lum(h){var c=hexToRgb(h),l=[c.r,c.g,c.b].map(function(v){v=v/255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4);});return 0.2126*l[0]+0.7152*l[1]+0.0722*l[2];}var fonts={"Fraunces":'"Fraunces", ui-serif, Georgia, serif',"Newsreader":'"Newsreader", ui-serif, Georgia, serif',"Libre Baskerville":'"Libre Baskerville", ui-serif, Georgia, serif',"Spectral":'"Spectral", ui-serif, Georgia, serif',"Figtree":'"Figtree", ui-sans-serif, system-ui, sans-serif',"Source Sans 3":'"Source Sans 3", ui-sans-serif, system-ui, sans-serif',"Work Sans":'"Work Sans", ui-sans-serif, system-ui, sans-serif',"Karla":'"Karla", ui-sans-serif, system-ui, sans-serif'};var bg=t.background,fg=t.foreground,r=document.documentElement,rad=typeof t.radius==="number"?t.radius:12,card=t.card||mix(bg,fg,0.06),field=t.field||mix(card,"#ffffff",lum(card)>0.45?0.35:0.08),icon=t.icon||mix(card,fg,0.12);r.style.setProperty("--color-background",bg);r.style.setProperty("--color-foreground",fg);r.style.setProperty("--color-paper",t.paper||mix(bg,fg,0.04));r.style.setProperty("--color-card",card);r.style.setProperty("--color-card-foreground",fg);r.style.setProperty("--color-muted",mix(bg,fg,0.08));r.style.setProperty("--color-muted-foreground",t.mutedForeground||mix(bg,fg,0.45));r.style.setProperty("--color-primary",t.primary||fg);r.style.setProperty("--color-primary-foreground",lum(t.primary||fg)>0.45?"#1f1c17":"#f3eee4");r.style.setProperty("--color-primary-hover",mix(t.primary||fg,"#111111",0.14));r.style.setProperty("--color-secondary",t.secondary||mix(card,fg,0.08));r.style.setProperty("--color-secondary-foreground",fg);r.style.setProperty("--color-accent",mix(card,t.primary||fg,0.16));r.style.setProperty("--color-accent-foreground",fg);r.style.setProperty("--color-border",t.border||mix(bg,fg,0.18));r.style.setProperty("--color-input",t.border||mix(bg,fg,0.18));r.style.setProperty("--color-field",field);r.style.setProperty("--color-field-foreground",fg);r.style.setProperty("--color-icon",icon);r.style.setProperty("--color-icon-foreground",lum(icon)>0.45?"#1f1c17":"#f3eee4");r.style.setProperty("--color-icon-hover",mix(icon,"#111111",0.12));r.style.setProperty("--color-icon-stroke",t.iconStroke||fg);r.style.setProperty("--color-ring",t.primary||fg);r.style.setProperty("--color-destructive",t.clay||"#8f3d32");r.style.setProperty("--color-ink",fg);r.style.setProperty("--color-clay",t.clay||"#8f3d32");r.style.setProperty("--color-stone",mix(t.paper||bg,fg,0.28));if(t.sansFont&&fonts[t.sansFont])r.style.setProperty("--font-sans",fonts[t.sansFont]);if(t.displayFont&&fonts[t.displayFont])r.style.setProperty("--font-display",fonts[t.displayFont]);r.style.setProperty("--radius",rad+"px");r.style.setProperty("--radius-sm",Math.max(4,rad-4)+"px");r.style.setProperty("--radius-md",rad+"px");r.style.setProperty("--radius-lg",(rad+4)+"px");r.style.setProperty("--radius-xl",(rad+12)+"px");r.style.backgroundColor=bg;r.style.colorScheme=lum(bg)<0.45?"dark":"light";var meta=document.querySelector('meta[name="theme-color"]');if(meta)meta.setAttribute("content",bg);}catch(e){}})();`;
