export type Tile =
  | { id: number; kind: "logo" }
  | { id: number; kind: "fact"; caption: string; text: string };

/**
 * 6 rows x 4 columns, read left-to-right, top-to-bottom.
 * Positions 0 (top-left) and 23 (bottom-right) are the logo / free squares.
 */
export const TILES: Tile[] = [
  { id: 0, kind: "logo" },
  { id: 1, kind: "fact", caption: "Youngest Driver", text: "I'm the youngest driver" },
  { id: 2, kind: "fact", caption: "Dog Called Leo", text: "I have a dog named Leo" },
  { id: 3, kind: "fact", caption: "1st Win in Monza", text: "My first win was in Monza" },

  { id: 4, kind: "fact", caption: "Rookie Race Winner", text: "I was a race winner in my rookie season" },
  { id: 5, kind: "fact", caption: "2 Aussie Team-Mates", text: "I've had two Australian teammates" },
  { id: 6, kind: "fact", caption: "Guitarist, Studio Recording", text: "I play the guitar and have recorded in a studio" },
  { id: 7, kind: "fact", caption: "400+ Race Starts", text: "I have over 400 race starts" },

  { id: 8, kind: "fact", caption: "Youngest on Front Row", text: "I'm the youngest driver to start on the front row" },
  { id: 9, kind: "fact", caption: "Lots of Pets", text: "I have a lot of pets" },
  { id: 10, kind: "fact", caption: "Loves Cricket", text: "I'm a big cricket fan" },
  { id: 11, kind: "fact", caption: "Equations on Helmet", text: "My helmet design features physics equations" },

  { id: 12, kind: "fact", caption: "Southern Hemisphere", text: "I was born in the Southern Hemisphere" },
  { id: 13, kind: "fact", caption: "Lived at Kart Factory", text: "I lived above a kart factory as a teenager" },
  { id: 14, kind: "fact", caption: "All 3 USA Podiums", text: "I have a podium finish at all American Circuits" },
  { id: 15, kind: "fact", caption: "Over 6 Foot Tall", text: "I'm over 6 foot tall (182 cm)" },

  { id: 16, kind: "fact", caption: "Spanish", text: "I'm Spanish" },
  { id: 17, kind: "fact", caption: "Race Driver Parents", text: "Both of my parents have been race drivers (one in F1)" },
  { id: 18, kind: "fact", caption: "Motorcycle Collection", text: "I have a motorcycle collection" },
  { id: 19, kind: "fact", caption: "24hrs of Le Mans Winner", text: "I've won the 24 hours of Le Mans" },

  { id: 20, kind: "fact", caption: "Passion for Coffee", text: "I have a passion for coffee" },
  { id: 21, kind: "fact", caption: "T-Pose", text: "I'm known for the 'T Pose'" },
  { id: 22, kind: "fact", caption: "Filled in for sick driver", text: "I've subbed in for a sick or injured driver" },
  { id: 23, kind: "logo" },
];

export const COLS = 4;
export const ROWS = 6;
export const FREE_POSITIONS = [0, TILES.length - 1];

const rows = Array.from({ length: ROWS }, (_, r) =>
  Array.from({ length: COLS }, (_, c) => r * COLS + c),
);
const cols = Array.from({ length: COLS }, (_, c) =>
  Array.from({ length: ROWS }, (_, r) => r * COLS + c),
);

/** Every winnable line: 6 rows of 4, then 4 columns of 6. */
export const LINES: number[][] = [...rows, ...cols];

export function lineLabel(index: number): string {
  return index < ROWS ? `Row ${index + 1}` : `Column ${index - ROWS + 1}`;
}
