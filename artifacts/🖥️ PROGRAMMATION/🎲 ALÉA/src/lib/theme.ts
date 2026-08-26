export type Theme = {
  background: string;
  foreground: string;
  card: string;
  primary: string;
  mutedForeground: string;
  displayFont: string;
  sansFont: string;
};

export type SavedPalette = {
  id: string;
  name: string;
  theme: Theme;
};

export const FONT_OPTIONS = [
  { id: "Fraunces", stack: '"Fraunces", ui-serif, Georgia, serif', kind: "display" as const },
  { id: "Newsreader", stack: '"Newsreader", ui-serif, Georgia, serif', kind: "display" as const },
  { id: "Libre Baskerville", stack: '"Libre Baskerville", ui-serif, Georgia, serif', kind: "display" as const },
  { id: "IBM Plex Serif", stack: '"IBM Plex Serif", ui-serif, Georgia, serif', kind: "display" as const },
  { id: "Space Grotesk", stack: '"Space Grotesk", ui-sans-serif, system-ui, sans-serif', kind: "display" as const },
  { id: "Figtree", stack: '"Figtree", ui-sans-serif, system-ui, sans-serif', kind: "sans" as const },
  { id: "Source Sans 3", stack: '"Source Sans 3", ui-sans-serif, system-ui, sans-serif', kind: "sans" as const },
  { id: "Work Sans", stack: '"Work Sans", ui-sans-serif, system-ui, sans-serif', kind: "sans" as const },
  { id: "IBM Plex Sans", stack: '"IBM Plex Sans", ui-sans-serif, system-ui, sans-serif', kind: "sans" as const },
  { id: "DM Sans", stack: '"DM Sans", ui-sans-serif, system-ui, sans-serif', kind: "sans" as const },
];

export const DEFAULT_THEME: Theme = {
  background: "#0c0c0b",
  foreground: "#eceae4",
  card: "#161614",
  primary: "#c8c4ba",
  mutedForeground: "#9a9890",
  displayFont: "Fraunces",
  sansFont: "Figtree",
};

export const PRESETS: { id: string; name: string; theme: Theme }[] = [
  { id: "encre", name: "Encre", theme: DEFAULT_THEME },
  {
    id: "papier",
    name: "Papier",
    theme: {
      background: "#f4f1ea",
      foreground: "#1c1a16",
      card: "#ebe6db",
      primary: "#2b2924",
      mutedForeground: "#6f6a61",
      displayFont: "Fraunces",
      sansFont: "Figtree",
    },
  },
  {
    id: "sel",
    name: "Sel",
    theme: {
      background: "#12151a",
      foreground: "#e8eef4",
      card: "#1a1f26",
      primary: "#c5d0db",
      mutedForeground: "#8b97a3",
      displayFont: "Newsreader",
      sansFont: "Source Sans 3",
    },
  },
  {
    id: "sepia",
    name: "Sépia",
    theme: {
      background: "#1a1410",
      foreground: "#f0e6d8",
      card: "#241c16",
      primary: "#d4b48c",
      mutedForeground: "#a89480",
      displayFont: "Libre Baskerville",
      sansFont: "Work Sans",
    },
  },
];

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
  return rgbToHex(A.r + (B.r - A.r) * t, A.g + (B.g - A.g) * t, A.b + (B.b - A.b) * t);
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
  return luminance(hex) > 0.45 ? "#0c0c0b" : "#eceae4";
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

export function themeCssVars(theme: Theme): Record<string, string> {
  const bg = theme.background;
  const fg = theme.foreground;
  return {
    "--color-background": bg,
    "--color-foreground": fg,
    "--color-card": theme.card,
    "--color-card-foreground": fg,
    "--color-muted": mix(bg, fg, 0.08),
    "--color-muted-foreground": theme.mutedForeground,
    "--color-primary": theme.primary,
    "--color-primary-foreground": contrastInk(theme.primary),
    "--color-secondary": mix(bg, fg, 0.08),
    "--color-secondary-foreground": fg,
    "--color-accent": mix(bg, fg, 0.12),
    "--color-accent-foreground": fg,
    "--color-border": mix(bg, fg, 0.16),
    "--color-input": mix(bg, fg, 0.16),
    "--color-ring": theme.primary,
    "--font-sans": fontStack(theme.sansFont, "sans"),
    "--font-display": fontStack(theme.displayFont, "display"),
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

export const THEME_BOOT_SCRIPT = `(function(){try{var raw=localStorage.getItem("alea-theme");if(!raw)return;var t=JSON.parse(raw).state.theme;if(!t||!t.background)return;function hexToRgb(h){h=String(h).replace("#","");return{r:parseInt(h.slice(0,2),16),g:parseInt(h.slice(2,4),16),b:parseInt(h.slice(4,6),16)};}function rgbToHex(r,g,b){function to(v){return Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,"0");}return"#"+to(r)+to(g)+to(b);}function mix(a,b,p){var A=hexToRgb(a),B=hexToRgb(b);return rgbToHex(A.r+(B.r-A.r)*p,A.g+(B.g-A.g)*p,A.b+(B.b-A.b)*p);}function lum(h){var c=hexToRgb(h),l=[c.r,c.g,c.b].map(function(v){v=v/255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4);});return 0.2126*l[0]+0.7152*l[1]+0.0722*l[2];}var bg=t.background,fg=t.foreground,r=document.documentElement;var fonts={"Fraunces":'"Fraunces", ui-serif, Georgia, serif',"Newsreader":'"Newsreader", ui-serif, Georgia, serif',"Libre Baskerville":'"Libre Baskerville", ui-serif, Georgia, serif',"IBM Plex Serif":'"IBM Plex Serif", ui-serif, Georgia, serif',"Space Grotesk":'"Space Grotesk", ui-sans-serif, system-ui, sans-serif',"Figtree":'"Figtree", ui-sans-serif, system-ui, sans-serif',"Source Sans 3":'"Source Sans 3", ui-sans-serif, system-ui, sans-serif',"Work Sans":'"Work Sans", ui-sans-serif, system-ui, sans-serif',"IBM Plex Sans":'"IBM Plex Sans", ui-sans-serif, system-ui, sans-serif',"DM Sans":'"DM Sans", ui-sans-serif, system-ui, sans-serif'};r.style.setProperty("--color-background",bg);r.style.setProperty("--color-foreground",fg);r.style.setProperty("--color-card",t.card||mix(bg,fg,0.06));r.style.setProperty("--color-card-foreground",fg);r.style.setProperty("--color-muted",mix(bg,fg,0.08));r.style.setProperty("--color-muted-foreground",t.mutedForeground||mix(bg,fg,0.45));r.style.setProperty("--color-primary",t.primary||fg);r.style.setProperty("--color-primary-foreground",lum(t.primary||fg)>0.45?"#0c0c0b":"#eceae4");r.style.setProperty("--color-secondary",mix(bg,fg,0.08));r.style.setProperty("--color-secondary-foreground",fg);r.style.setProperty("--color-accent",mix(bg,fg,0.12));r.style.setProperty("--color-accent-foreground",fg);r.style.setProperty("--color-border",mix(bg,fg,0.16));r.style.setProperty("--color-input",mix(bg,fg,0.16));r.style.setProperty("--color-ring",t.primary||fg);if(t.sansFont&&fonts[t.sansFont])r.style.setProperty("--font-sans",fonts[t.sansFont]);if(t.displayFont&&fonts[t.displayFont])r.style.setProperty("--font-display",fonts[t.displayFont]);r.style.backgroundColor=bg;r.style.colorScheme=lum(bg)<0.45?"dark":"light";var meta=document.querySelector('meta[name="theme-color"]');if(meta)meta.setAttribute("content",bg);}catch(e){}})();`;
