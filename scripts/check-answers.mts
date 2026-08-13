import { ANSWERS } from "../lib/answers";
import { DRIVERS } from "../lib/drivers";
import { TILES } from "../lib/board";

let broken = 0;
for (const [pos, ids] of Object.entries(ANSWERS)) {
  const tile = TILES[Number(pos)];
  const names = ids.map((i) => (DRIVERS[i] ? `${DRIVERS[i].first} ${DRIVERS[i].last}` : `MISSING(${i})`));
  if (names.some((n) => n.startsWith("MISSING"))) broken++;
  const caption = tile.kind === "fact" ? tile.caption : "LOGO";
  console.log(pos.padStart(2), "|", caption.padEnd(27), "->", names.join(", "));
}

const covered = new Set(Object.keys(ANSWERS).map(Number));
const traits = TILES.map((t, i) => (t.kind === "fact" ? i : -1)).filter((i) => i >= 0);
const uncovered = traits.filter((i) => !covered.has(i));

console.log("\ntraits:", traits.length, "| answered:", covered.size, "| uncovered:", uncovered);
console.log(broken === 0 && uncovered.length === 0 ? "OK" : "PROBLEMS FOUND");
