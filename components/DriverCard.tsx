import { TEAMS, type Driver } from "@/lib/drivers";
import TeamBadge from "@/components/TeamBadge";

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

  return (
    <div
      className={`driver-card relative flex aspect-[1/1.15] w-full flex-col justify-between overflow-hidden rounded-2xl p-2 select-none ${
        state === "ghost" ? "rotate-[-4deg] scale-105 shadow-2xl" : ""
      } ${state === "selected" ? "ring-2 ring-white" : ""} ${
        state === "placed" ? "opacity-25 grayscale" : ""
      } ${className}`}
      style={{
        background: `linear-gradient(150deg, ${team.primary} 0%, ${team.primary} 55%, rgba(0,0,0,0.42) 100%)`,
        color: team.ink,
        boxShadow:
          state === "ghost"
            ? `0 24px 48px -12px rgba(0,0,0,0.75), 0 0 0 2px ${team.accent}`
            : `inset 0 0 0 1px rgba(255,255,255,0.18)`,
      }}
    >
      <span
        aria-hidden="true"
        className="driver-watermark font-display pointer-events-none absolute -right-1 -bottom-3 leading-none font-bold opacity-20"
      >
        {driver.number}
      </span>

      <div className="relative flex items-start justify-between gap-1">
        <TeamBadge team={team} className="driver-badge shrink-0" />
        <span className="driver-num font-display leading-none font-bold opacity-80">
          #{driver.number}
        </span>
      </div>

      <div className="relative min-w-0">
        <p className="driver-first truncate leading-tight font-semibold opacity-80">{driver.first}</p>
        <p className="driver-last font-display font-bold tracking-tight uppercase">{driver.last}</p>
      </div>

      <span
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-1"
        style={{ background: team.accent }}
      />
    </div>
  );
}

/** Compact strip shown once a driver is dropped on a trait square. */
export function DriverChip({ driver }: { driver: Driver }) {
  const team = TEAMS[driver.team];

  return (
    <span
      className="flex w-full items-center gap-1 rounded-md px-1 py-0.5"
      style={{ background: team.primary, color: team.ink }}
    >
      <TeamBadge team={team} className="h-3 w-5 shrink-0" />
      <span className="font-display truncate text-[0.6rem] leading-none font-bold uppercase">
        {driver.last}
      </span>
      <span className="font-display ml-auto text-[0.55rem] leading-none font-bold opacity-75">
        {driver.number}
      </span>
    </span>
  );
}
