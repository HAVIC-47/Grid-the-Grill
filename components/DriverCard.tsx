import type { CSSProperties } from "react";
import { TEAMS, type Driver } from "@/lib/drivers";
import TeamBadge from "@/components/TeamBadge";

type CardVars = CSSProperties & { "--team": string; "--accent": string };

/** Surname type size as a share of card width, stepped down for longer names. */
function lastNameScale(last: string): number {
  const n = last.length;
  if (n <= 6) return 16;
  if (n === 7) return 14.5;
  if (n === 8) return 13;
  if (n === 9) return 11.8;
  if (n === 10) return 10.8;
  return 9.8;
}

/** Full rounded card used in the paddock tray and as the drag ghost. */
export default function DriverCard({
  driver,
  state = "idle",
  className = "",
}: {
  driver: Driver;
  state?: "idle" | "selected" | "ghost" | "placed";
  className?: string;
}) {
  const team = TEAMS[driver.team];
  const surnameScale = lastNameScale(driver.last);

  return (
    <div
      className={`driver-card relative flex aspect-[1/1.15] w-full flex-col justify-between overflow-hidden rounded-2xl p-2 select-none ${
        state === "ghost" ? "rotate-[-4deg] scale-105" : ""
      } ${state === "selected" ? "ring-2 ring-amber" : ""} ${
        state === "placed" ? "opacity-25 grayscale" : ""
      } ${className}`}
      style={
        {
          "--team": team.primary,
          "--accent": team.accent,
          boxShadow:
            state === "ghost"
              ? `0 24px 48px -12px rgba(0,0,0,0.8), 0 0 0 2px ${team.accent}`
              : "inset 0 0 0 1px rgba(255,255,255,0.14)",
        } as CardVars
      }
    >
      <span aria-hidden="true" className="driver-watermark font-display">
        {driver.number}
      </span>

      <div className="relative z-10 flex items-start justify-between gap-1">
        <TeamBadge team={team} className="driver-badge shrink-0" />
        <span className="driver-num font-display leading-none font-bold" style={{ color: team.accent }}>
          {driver.number}
        </span>
      </div>

      <div className="relative z-10 min-w-0">
        <p className="driver-first truncate">{driver.first}</p>
        <p
          className="driver-last font-display"
          style={{ fontSize: `clamp(0.5rem, ${surnameScale}cqi, 1.3rem)` }}
        >
          {driver.last}
        </p>
      </div>

      <span
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 z-10 h-[3px]"
        style={{ background: team.accent }}
      />
    </div>
  );
}

/** Name plate shown once a driver is dropped on a trait square. */
export function DriverChip({ driver }: { driver: Driver }) {
  const team = TEAMS[driver.team];

  return (
    <span className="tile-driver" style={{ background: team.primary, color: team.ink }}>
      <TeamBadge team={team} className="tile-driver-badge" />
      <span className="tile-driver-name font-display">{driver.last}</span>
      <span className="tile-driver-num font-display">{driver.number}</span>
    </span>
  );
}
