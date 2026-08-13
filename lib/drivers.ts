export type Team = {
  id: string;
  name: string;
  short: string;
  /** Card body colour. */
  primary: string;
  /** Accent used for the stripe + badge ring. */
  accent: string;
  /** Text colour that clears 4.5:1 on `primary`. */
  ink: string;
};

export type Driver = {
  id: number;
  first: string;
  last: string;
  number: number;
  team: string;
};

export const TEAMS: Record<string, Team> = {
  mclaren: { id: "mclaren", name: "McLaren", short: "MCL", primary: "#FF8000", accent: "#47C7FC", ink: "#1B0D00" },
  mercedes: { id: "mercedes", name: "Mercedes-AMG", short: "MER", primary: "#00D7B6", accent: "#C8CCCE", ink: "#04211D" },
  ferrari: { id: "ferrari", name: "Scuderia Ferrari", short: "FER", primary: "#E8002D", accent: "#FFF200", ink: "#FFFFFF" },
  redbull: { id: "redbull", name: "Red Bull Racing", short: "RBR", primary: "#1E3FCC", accent: "#FFD400", ink: "#FFFFFF" },
  racingbulls: { id: "racingbulls", name: "Racing Bulls", short: "VCARB", primary: "#6692FF", accent: "#FFFFFF", ink: "#08142E" },
  alpine: { id: "alpine", name: "Alpine", short: "ALP", primary: "#0093CC", accent: "#FF87BC", ink: "#FFFFFF" },
  aston: { id: "aston", name: "Aston Martin", short: "AMR", primary: "#1F8F6E", accent: "#CEDC00", ink: "#FFFFFF" },
  haas: { id: "haas", name: "Haas F1 Team", short: "HAAS", primary: "#B6BABD", accent: "#E6002B", ink: "#101114" },
  audi: { id: "audi", name: "Audi F1 Team", short: "AUDI", primary: "#C8102E", accent: "#D0D3D4", ink: "#FFFFFF" },
  williams: { id: "williams", name: "Williams Racing", short: "WIL", primary: "#1B6EF3", accent: "#64C4FF", ink: "#FFFFFF" },
  cadillac: { id: "cadillac", name: "Cadillac F1 Team", short: "CAD", primary: "#14202E", accent: "#C6A664", ink: "#FFFFFF" },
};

/** 2026 grid, in team order. */
export const DRIVERS: Driver[] = [
  { id: 0, first: "Lando", last: "Norris", number: 1, team: "mclaren" },
  { id: 1, first: "Oscar", last: "Piastri", number: 81, team: "mclaren" },
  { id: 2, first: "George", last: "Russell", number: 63, team: "mercedes" },
  { id: 3, first: "Andrea Kimi", last: "Antonelli", number: 12, team: "mercedes" },
  { id: 4, first: "Charles", last: "Leclerc", number: 16, team: "ferrari" },
  { id: 5, first: "Lewis", last: "Hamilton", number: 44, team: "ferrari" },
  { id: 6, first: "Max", last: "Verstappen", number: 3, team: "redbull" },
  { id: 7, first: "Isack", last: "Hadjar", number: 6, team: "redbull" },
  { id: 8, first: "Liam", last: "Lawson", number: 30, team: "racingbulls" },
  { id: 9, first: "Arvid", last: "Lindblad", number: 41, team: "racingbulls" },
  { id: 10, first: "Pierre", last: "Gasly", number: 10, team: "alpine" },
  { id: 11, first: "Franco", last: "Colapinto", number: 43, team: "alpine" },
  { id: 12, first: "Fernando", last: "Alonso", number: 14, team: "aston" },
  { id: 13, first: "Lance", last: "Stroll", number: 18, team: "aston" },
  { id: 14, first: "Oliver", last: "Bearman", number: 87, team: "haas" },
  { id: 15, first: "Esteban", last: "Ocon", number: 31, team: "haas" },
  { id: 16, first: "Gabriel", last: "Bortoleto", number: 5, team: "audi" },
  { id: 17, first: "Nico", last: "Hülkenberg", number: 27, team: "audi" },
  { id: 18, first: "Alex", last: "Albon", number: 23, team: "williams" },
  { id: 19, first: "Carlos", last: "Sainz Jr.", number: 55, team: "williams" },
  { id: 20, first: "Valtteri", last: "Bottas", number: 77, team: "cadillac" },
  { id: 21, first: "Sergio", last: "Pérez", number: 11, team: "cadillac" },
];

export const driverById = (id: number) => DRIVERS[id];
export const teamOf = (driver: Driver) => TEAMS[driver.team];
