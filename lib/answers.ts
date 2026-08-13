import { FREE_POSITIONS, TILES } from "@/lib/board";

/** Driver ids, mirroring the order in lib/drivers.ts. */
const D = {
  norris: 0,
  piastri: 1,
  russell: 2,
  antonelli: 3,
  leclerc: 4,
  hamilton: 5,
  verstappen: 6,
  hadjar: 7,
  lawson: 8,
  lindblad: 9,
  gasly: 10,
  colapinto: 11,
  alonso: 12,
  stroll: 13,
  bearman: 14,
  ocon: 15,
  bortoleto: 16,
  hulkenberg: 17,
  albon: 18,
  sainz: 19,
  bottas: 20,
  perez: 21,
} as const;

/**
 * Accepted drivers per board position. Plenty of traits fit more than one
 * driver on the 2026 grid, so any listed driver scores that square.
 */
export const ANSWERS: Record<number, number[]> = {
  1: [D.lindblad], // I'm the youngest driver
  2: [D.leclerc], // I have a dog named Leo
  3: [D.gasly], // My first win was in Monza
  4: [D.hamilton], // I was a race winner in my rookie season
  5: [D.norris], // I've had two Australian teammates
  6: [D.hamilton, D.lawson], // I play the guitar and have recorded in a studio
  7: [D.alonso], // I have over 400 race starts
  8: [D.antonelli, D.stroll], // Youngest driver to start on the front row
  9: [D.albon, D.verstappen], // I have a lot of pets
  10: [D.piastri], // I'm a big cricket fan
  11: [D.hadjar], // My helmet design features physics equations
  12: [D.piastri, D.lawson, D.colapinto, D.bortoleto], // Southern Hemisphere
  13: [D.colapinto], // I lived above a kart factory as a teenager
  14: [D.verstappen, D.norris, D.leclerc, D.perez], // Podium at all American circuits
  15: [D.bearman, D.albon, D.ocon, D.russell, D.bortoleto, D.hulkenberg, D.stroll], // Over 6 foot
  16: [D.sainz, D.alonso], // I'm Spanish
  17: [D.verstappen], // Both of my parents have been race drivers
  18: [D.stroll], // I have a motorcycle collection
  19: [D.alonso, D.hulkenberg], // I've won the 24 Hours of Le Mans
  20: [D.bottas], // I have a passion for coffee
  21: [D.russell], // I'm known for the 'T Pose'
  22: [D.lawson, D.bearman, D.russell, D.hulkenberg], // Subbed in for a sick or injured driver
};

export const TRAIT_POSITIONS = TILES.map((_, i) => i).filter((i) => !FREE_POSITIONS.includes(i));

export type Verdict = "correct" | "wrong" | null;

export const acceptedFor = (pos: number): number[] => ANSWERS[pos] ?? [];

export function isCorrect(pos: number, driverId: number | null): boolean {
  return driverId !== null && acceptedFor(pos).includes(driverId);
}

export type Scorecard = {
  correct: number;
  answered: number;
  total: number;
  verdicts: Record<number, Verdict>;
  /** Positions answered with a driver who doesn't fit. */
  misses: number[];
};

export function scoreBoard(board: (number | null)[]): Scorecard {
  const verdicts: Record<number, Verdict> = {};
  const misses: number[] = [];
  let correct = 0;
  let answered = 0;

  for (const pos of TRAIT_POSITIONS) {
    const driverId = board[pos] ?? null;
    if (driverId === null) {
      verdicts[pos] = null;
      continue;
    }
    answered += 1;
    if (isCorrect(pos, driverId)) {
      verdicts[pos] = "correct";
      correct += 1;
    } else {
      verdicts[pos] = "wrong";
      misses.push(pos);
    }
  }

  return { correct, answered, total: TRAIT_POSITIONS.length, verdicts, misses };
}

/** Flavour text for the end-of-game readout. */
export function rankFor(correct: number, total: number): string {
  const pct = (correct / total) * 100;
  if (pct === 100) return "Lights out and away we go — perfect grid";
  if (pct >= 80) return "Pole position pace";
  if (pct >= 60) return "Points finish";
  if (pct >= 40) return "Midfield scrap";
  if (pct >= 20) return "Back of the grid";
  return "Pit lane start";
}
