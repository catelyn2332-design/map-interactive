import {
  GROUND_KINDS,
  groundFill,
  mixHex,
  type GroundKind,
  type GroundPalette,
} from "@/lib/map/types";

function GroundPattern({
  kind,
  fill,
}: {
  kind: GroundKind;
  fill: string;
}) {
  const ink = mixHex(fill, "#1f1c17", 0.45);
  const light = mixHex(fill, "#f3eee4", 0.45);
  const id = `atlas-ground-${kind}`;
  if (kind === "meadow") {
    return (
      <pattern id={id} width="28" height="28" patternUnits="userSpaceOnUse">
        <rect width="28" height="28" fill={fill} />
        <path
          d="M4 22 v-8 M10 24 v-6 M16 21 v-9 M22 24 v-7 M7 18 v-5 M19 19 v-6"
          stroke={ink}
          strokeWidth="1.4"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="13" cy="8" r="1.2" fill={mixHex(fill, "#b45a45", 0.55)} fillOpacity="0.55" />
      </pattern>
    );
  }
  if (kind === "forest") {
    return (
      <pattern id={id} width="32" height="28" patternUnits="userSpaceOnUse">
        <rect width="32" height="28" fill={fill} />
        <path d="M8 22 L8 16 L4 16 L8 6 L12 16 L8 16" fill={mixHex(fill, "#1f1c17", 0.35)} />
        <path d="M22 24 L22 18 L18 18 L22 8 L26 18 L22 18" fill={ink} />
        <path d="M15 20 L15 16 L12 16 L15 9 L18 16 L15 16" fill={light} />
      </pattern>
    );
  }
  if (kind === "sea") {
    return (
      <pattern id={id} width="36" height="24" patternUnits="userSpaceOnUse">
        <rect width="36" height="24" fill={fill} />
        <path
          d="M0 7 Q9 1 18 7 T36 7"
          fill="none"
          stroke={light}
          strokeOpacity="0.7"
          strokeWidth="1.6"
        />
        <path
          d="M0 16 Q9 10 18 16 T36 16"
          fill="none"
          stroke={ink}
          strokeOpacity="0.5"
          strokeWidth="1.8"
        />
      </pattern>
    );
  }
  if (kind === "sand") {
    return (
      <pattern id={id} width="24" height="24" patternUnits="userSpaceOnUse">
        <rect width="24" height="24" fill={fill} />
        <circle cx="4" cy="6" r="1.1" fill={ink} fillOpacity="0.45" />
        <circle cx="12" cy="4" r="0.8" fill={ink} fillOpacity="0.3" />
        <circle cx="19" cy="9" r="1.2" fill={light} />
        <circle cx="8" cy="15" r="0.9" fill={ink} fillOpacity="0.3" />
        <circle cx="16" cy="18" r="1.1" fill={ink} fillOpacity="0.4" />
        <circle cx="3" cy="20" r="0.7" fill={ink} fillOpacity="0.35" />
      </pattern>
    );
  }
  if (kind === "snow") {
    return (
      <pattern id={id} width="28" height="28" patternUnits="userSpaceOnUse">
        <rect width="28" height="28" fill={fill} />
        <circle cx="6" cy="7" r="1.4" fill={light} />
        <circle cx="18" cy="5" r="1" fill={ink} fillOpacity="0.25" />
        <circle cx="22" cy="16" r="1.6" fill={light} />
        <circle cx="9" cy="20" r="1.1" fill={ink} fillOpacity="0.22" />
        <path
          d="M14 12 l1.6 0 M14 12 l-1.6 0 M14 12 l0 1.6 M14 12 l0 -1.6"
          stroke={ink}
          strokeOpacity="0.35"
          strokeWidth="0.8"
          strokeLinecap="round"
        />
      </pattern>
    );
  }
  if (kind === "rock") {
    return (
      <pattern
        id={id}
        width="20"
        height="20"
        patternUnits="userSpaceOnUse"
        patternTransform="rotate(28)"
      >
        <rect width="20" height="20" fill={fill} />
        <line x1="0" y1="0" x2="0" y2="20" stroke={ink} strokeOpacity="0.45" strokeWidth="2" />
        <line x1="10" y1="0" x2="10" y2="20" stroke={light} strokeOpacity="0.45" strokeWidth="1.4" />
      </pattern>
    );
  }
  if (kind === "marsh") {
    return (
      <pattern id={id} width="32" height="22" patternUnits="userSpaceOnUse">
        <rect width="32" height="22" fill={fill} />
        <path
          d="M0 8 H32 M0 16 H32"
          stroke={ink}
          strokeOpacity="0.35"
          strokeWidth="1.4"
          strokeDasharray="5 7"
        />
        <circle cx="8" cy="5" r="1.4" fill={mixHex(fill, "#5b7fa6", 0.55)} fillOpacity="0.5" />
        <circle cx="22" cy="12" r="1.8" fill={mixHex(fill, "#5b7fa6", 0.55)} fillOpacity="0.35" />
      </pattern>
    );
  }
  if (kind === "path") {
    return (
      <pattern id={id} width="24" height="16" patternUnits="userSpaceOnUse">
        <rect width="24" height="16" fill={fill} />
        <path
          d="M0 5 H24 M0 11 H24"
          stroke={ink}
          strokeOpacity="0.4"
          strokeWidth="1.3"
          strokeDasharray="6 5"
        />
      </pattern>
    );
  }
  return (
    <pattern id={id} width="30" height="30" patternUnits="userSpaceOnUse">
      <rect width="30" height="30" fill={fill} />
      <circle cx="8" cy="8" r="2.2" fill={mixHex(fill, "#c45c4a", 0.65)} fillOpacity="0.75" />
      <circle cx="8" cy="8" r="0.8" fill={light} />
      <circle cx="22" cy="18" r="2" fill={mixHex(fill, "#b5812f", 0.6)} fillOpacity="0.7" />
      <circle cx="22" cy="18" r="0.7" fill={light} />
      <path
        d="M16 24 v-6 M4 20 v-5 M26 8 v-4"
        stroke={ink}
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </pattern>
  );
}

export function TerrainDefs({ palette }: { palette?: GroundPalette }) {
  return (
    <>
      {GROUND_KINDS.map((g) => (
        <GroundPattern key={`${g.id}-${groundFill(g.id, palette)}`} kind={g.id} fill={groundFill(g.id, palette)} />
      ))}
    </>
  );
}
