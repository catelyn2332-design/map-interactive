import { rect } from "./geometry";
import { emptyRoom, linkFloors, SANDBOX_VIEW, type WorldState } from "./house";
import type { Character, FloorMeta, MapFixture, Room, TokenPos } from "./types";

type Box = [number, number, number, number];

function room(
  id: string,
  floorId: string,
  name: string,
  box: Box,
  extra: Partial<Room> = {},
): Room {
  const [x, y, w, h] = box;
  return emptyRoom({
    id,
    floorId,
    name,
    label: extra.label ?? name,
    poly: extra.poly ?? rect(x, y, w, h),
    connections: extra.connections ?? [],
    description: extra.description ?? "",
    travel: extra.travel,
  });
}

function stair(
  id: string,
  floorId: string,
  x: number,
  y: number,
  toFloor: string,
): MapFixture {
  return {
    id,
    floorId,
    kind: "stair",
    x,
    y,
    rotation: 0,
    length: 72,
    width: 40,
    style: "straight",
    label: "Escalier",
    toFloor,
  };
}

const FLOORS: FloorMeta[] = linkFloors([
  {
    id: "parcelle",
    name: "Parcelle",
    short: "P",
    order: 0,
    viewBox: [...SANDBOX_VIEW],
    blurb: "Colline, mer au sud, friche et chemin. La maison n’est encore qu’une ombre.",
    material: "herbe, pierre, sel",
  },
  {
    id: "cave",
    name: "Cave",
    short: "C",
    order: 1,
    viewBox: [...SANDBOX_VIEW],
    blurb: "Pierre froide, citernes, pièce scellée. On n’y reste pas longtemps.",
    material: "pierre",
  },
  {
    id: "rdc",
    name: "Rez-de-chaussée",
    short: "0",
    order: 2,
    viewBox: [...SANDBOX_VIEW],
    blurb: "Lambris verts, hall irrégulier, pièces trop grandes pour trois personnes.",
    material: "bois vert, pierre",
  },
  {
    id: "etage",
    name: "Étage",
    short: "1",
    order: 3,
    viewBox: [...SANDBOX_VIEW],
    blurb: "Chambres des jumeaux, palier dangereux, porte fermée à clé.",
    material: "plancher, poussière",
  },
  {
    id: "combles",
    name: "Combles",
    short: "2",
    order: 4,
    viewBox: [...SANDBOX_VIEW],
    blurb: "Poutres, archives, cache de Stella. Le jour passe par la trappe.",
    material: "charpente",
  },
  {
    id: "toit",
    name: "Toit",
    short: "T",
    order: 5,
    viewBox: [...SANDBOX_VIEW],
    blurb: "Le perchoir. Stella parle ici à quelqu’un qui n’est plus dans la maison.",
    material: "ardoise, sel",
  },
]);

const ROOMS: Room[] = [
  room("vue-mer", "parcelle", "Versant mer", [80, 620, 720, 220], {
    description: "Le vent arrive salé. On voit la crique sans l’entendre vraiment.",
    connections: ["jardin-friche", "chemin-colline"],
  }),
  room("vue-montagnes", "parcelle", "Versant montagnes", [820, 80, 640, 280], {
    connections: ["chemin-colline"],
  }),
  room("chemin-colline", "parcelle", "Chemin de colline", [620, 280, 160, 360], {
    connections: ["vue-mer", "vue-montagnes", "porche", "jardin-friche"],
  }),
  room("jardin-friche", "parcelle", "Jardin en friche", [80, 280, 520, 320], {
    connections: ["potager", "chemin-colline", "vue-mer", "maison-empreinte"],
  }),
  room("potager", "parcelle", "Potager", [80, 80, 280, 180], {
    connections: ["jardin-friche", "citerne-ext"],
  }),
  room("citerne-ext", "parcelle", "Citerne de pluie", [380, 80, 160, 180], {
    connections: ["potager", "bucher"],
  }),
  room("bucher", "parcelle", "Bûcher", [560, 80, 140, 180], {
    connections: ["citerne-ext"],
  }),
  room("porche", "parcelle", "Porche sud", [800, 500, 220, 120], {
    connections: ["chemin-colline", "maison-empreinte"],
    travel: [{ toFloor: "rdc", toRoom: "hall", label: "Entrer" }],
  }),
  room("maison-empreinte", "parcelle", "Emprise de la maison", [800, 280, 520, 200], {
    connections: ["porche", "jardin-friche"],
    description: "Le volume de la maison vu du dehors — toits décalés, tourelle ouest.",
  }),

  room("escalier-cave", "cave", "Escalier de pierre", [550, 100, 180, 140], {
    connections: ["couloir-pierre"],
    travel: [{ toFloor: "rdc", toRoom: "escalier-rdc", label: "Monter" }],
  }),
  room("couloir-pierre", "cave", "Couloir de pierre", [460, 240, 90, 360], {
    connections: [
      "escalier-cave",
      "cave-provisions",
      "cave-vin",
      "atelier-cave",
      "chaufferie",
      "citernes",
      "chambre-scellee",
    ],
  }),
  room("cave-provisions", "cave", "Cave à provisions", [240, 240, 220, 180], {
    connections: ["couloir-pierre"],
  }),
  room("cave-vin", "cave", "Cave à vin abandonnée", [240, 440, 220, 180], {
    connections: ["couloir-pierre"],
  }),
  room("atelier-cave", "cave", "Atelier de bricolage", [550, 260, 250, 180], {
    connections: ["couloir-pierre"],
  }),
  room("chaufferie", "cave", "Chaufferie", [550, 460, 250, 160], {
    connections: ["couloir-pierre"],
  }),
  room("citernes", "cave", "Salle des citernes", [820, 240, 340, 200], {
    connections: ["couloir-pierre"],
  }),
  room("chambre-scellee", "cave", "Chambre scellée", [820, 460, 240, 180], {
    connections: ["couloir-pierre"],
    description: "La porte ne s’ouvre pas. Myriam ne commente pas.",
  }),

  room("tour-rdc", "rdc", "Tourelle — pied", [100, 80, 140, 240], {
    connections: ["bibliotheque", "veranda-ouest"],
  }),
  room("veranda-ouest", "rdc", "Véranda ouest", [100, 340, 140, 220], {
    connections: ["tour-rdc", "cabinet-myriam"],
  }),
  room("bibliotheque", "rdc", "Bibliothèque", [240, 80, 220, 220], {
    connections: ["tour-rdc", "couloir-portraits"],
  }),
  room("cabinet-myriam", "rdc", "Cabinet de Myriam", [240, 320, 220, 180], {
    connections: ["veranda-ouest", "couloir-portraits", "atelier-enfants"],
  }),
  room("atelier-enfants", "rdc", "Atelier des enfants", [240, 520, 220, 180], {
    connections: ["cabinet-myriam"],
  }),
  room("couloir-portraits", "rdc", "Couloir des portraits", [460, 80, 90, 440], {
    connections: ["bibliotheque", "cabinet-myriam", "hall", "escalier-rdc"],
  }),
  room("escalier-rdc", "rdc", "Grand escalier", [550, 80, 180, 130], {
    connections: ["couloir-portraits", "hall"],
    travel: [
      { toFloor: "cave", toRoom: "escalier-cave", label: "Descendre" },
      { toFloor: "etage", toRoom: "escalier-etage", label: "Monter" },
    ],
  }),
  room("hall", "rdc", "Hall d’entrée", [550, 210, 180, 180], {
    connections: ["escalier-rdc", "couloir-portraits", "salon", "salle-a-manger", "wc-rdc"],
    description: "Le plancher penche un peu. On sent la mer sans la voir.",
  }),
  room("wc-rdc", "rdc", "Salle d’eau", [550, 410, 120, 130], {
    connections: ["hall"],
  }),
  room("salon", "rdc", "Salon", [730, 80, 340, 280], {
    connections: ["hall", "parlor", "salle-a-manger"],
    description: "Pièce trop vaste. Le canapé n’occupe qu’un coin.",
  }),
  room("parlor", "rdc", "Salon du piano", [1070, 80, 250, 200], {
    connections: ["salon"],
  }),
  room("salle-a-manger", "rdc", "Salle à manger", [730, 380, 280, 200], {
    connections: ["hall", "salon", "cuisine"],
  }),
  room("cuisine", "rdc", "Cuisine", [1010, 380, 310, 200], {
    connections: ["salle-a-manger", "office"],
  }),
  room("office", "rdc", "Arrière-cuisine", [1010, 600, 160, 120], {
    connections: ["cuisine", "buanderie"],
  }),
  room("buanderie", "rdc", "Buanderie", [1170, 600, 150, 120], {
    connections: ["office"],
  }),

  room("tour-etage", "etage", "Cabinet d’observation", [100, 80, 140, 240], {
    connections: ["nursery"],
  }),
  room("nursery", "etage", "Ancienne chambre jumelle", [240, 80, 220, 220], {
    connections: ["tour-etage", "couloir-dangereux"],
  }),
  room("piece-fermee", "etage", "Chambre fermée", [240, 320, 220, 180], {
    connections: ["couloir-dangereux"],
    description: "Serrure récente. Myriam a la clé.",
  }),
  room("dressing", "etage", "Linge et dressing", [240, 520, 220, 180], {
    connections: ["couloir-dangereux"],
  }),
  room("couloir-dangereux", "etage", "Couloir aux planchers", [460, 80, 90, 440], {
    connections: [
      "nursery",
      "piece-fermee",
      "dressing",
      "palier",
      "escalier-etage",
      "chambre-stella",
      "chambre-antoine",
    ],
  }),
  room("escalier-etage", "etage", "Cage d’escalier", [550, 80, 180, 130], {
    connections: ["couloir-dangereux", "palier"],
    travel: [
      { toFloor: "rdc", toRoom: "escalier-rdc", label: "Descendre" },
      { toFloor: "combles", toRoom: "trappe-combles", label: "Combles" },
    ],
  }),
  room("palier", "etage", "Palier irrégulier", [550, 210, 180, 180], {
    connections: ["escalier-etage", "couloir-dangereux", "sdb"],
  }),
  room("sdb", "etage", "Salle de bain", [550, 410, 180, 160], {
    connections: ["palier", "chambre-myriam"],
  }),
  room("chambre-stella", "etage", "Chambre de Stella", [730, 80, 250, 280], {
    connections: ["couloir-dangereux", "chambre-antoine"],
    description: "Fenêtre vers la mer. Désordre vivant. Accès au toit par la tête.",
  }),
  room("chambre-antoine", "etage", "Chambre d’Antoine", [980, 80, 340, 280], {
    connections: ["couloir-dangereux", "chambre-stella"],
  }),
  room("chambre-myriam", "etage", "Chambre de Myriam", [730, 380, 280, 200], {
    connections: ["sdb", "petit-salon"],
  }),
  room("petit-salon", "etage", "Petit salon", [1010, 380, 310, 200], {
    connections: ["chambre-myriam", "piece-cartons"],
  }),
  room("piece-cartons", "etage", "Pièce des cartons", [1010, 600, 310, 120], {
    connections: ["petit-salon"],
  }),

  room("trappe-combles", "combles", "Trappe et jour", [550, 80, 180, 140], {
    connections: ["grenier"],
    travel: [
      { toFloor: "etage", toRoom: "escalier-etage", label: "Étage" },
      { toFloor: "toit", toRoom: "lucarne", label: "Toit" },
    ],
  }),
  room("grenier", "combles", "Grenier principal", [550, 240, 500, 280], {
    connections: ["trappe-combles", "archives", "poutres-dangereuses", "cache-stella"],
  }),
  room("archives", "combles", "Archives", [240, 240, 280, 220], {
    connections: ["grenier"],
  }),
  room("poutres-dangereuses", "combles", "Travée des poutres", [1070, 240, 250, 220], {
    connections: ["grenier"],
  }),
  room("cache-stella", "combles", "Cache de Stella", [550, 540, 220, 140], {
    connections: ["grenier"],
    description: "Couvertures, carnets, vue sur les chevrons.",
  }),

  room("lucarne", "toit", "Lucarne", [550, 200, 180, 120], {
    connections: ["faitage-stella", "versant-mer", "versant-est"],
    travel: [{ toFloor: "combles", toRoom: "trappe-combles", label: "Rentrer" }],
  }),
  room("faitage-stella", "toit", "Faîtage — le perchoir", [500, 80, 420, 120], {
    connections: ["lucarne", "cheminees"],
    description: "Ici Stella parle à son père. Le vent coupe les phrases.",
  }),
  room("cheminees", "toit", "Souches de cheminée", [940, 80, 180, 120], {
    connections: ["faitage-stella"],
  }),
  room("versant-mer", "toit", "Versant mer", [400, 320, 380, 220], {
    connections: ["lucarne"],
  }),
  room("versant-est", "toit", "Versant montagnes", [800, 320, 380, 220], {
    connections: ["lucarne"],
  }),
];

const FIXTURES: MapFixture[] = [
  stair("stair-rdc-up", "rdc", 640, 145, "etage"),
  stair("stair-rdc-down", "rdc", 640, 145, "cave"),
  stair("stair-etage", "etage", 640, 145, "rdc"),
  stair("stair-cave", "cave", 640, 170, "rdc"),
  stair("stair-combles", "combles", 640, 150, "etage"),
];

const CHARACTERS: Character[] = [
  { id: "stella", name: "Stella", short: "S", role: "Fille", color: "#7a6a58" },
  { id: "antoine", name: "Antoine", short: "A", role: "Fils", color: "#5d7380" },
  { id: "myriam", name: "Myriam", short: "M", role: "Mère", color: "#3f5344" },
];

const TOKENS: Record<string, TokenPos> = {
  stella: { floorId: "etage", roomId: "chambre-stella" },
  antoine: { floorId: "etage", roomId: "chambre-antoine" },
  myriam: { floorId: "rdc", roomId: "salon" },
};

export function catalogWorld(): WorldState {
  return {
    floors: FLOORS.map((f) => ({ ...f, viewBox: [...f.viewBox] as FloorMeta["viewBox"] })),
    rooms: ROOMS.map((r) => ({
      ...r,
      poly: r.poly.map((p) => [p[0], p[1]] as [number, number]),
      connections: [...r.connections],
    })),
    fixtures: FIXTURES.map((m) => ({ ...m })),
    characters: CHARACTERS.map((c) => ({ ...c })),
    tokens: { ...TOKENS },
    groups: [],
  };
}
