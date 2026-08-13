import { type Team } from "@/lib/drivers";

/**
 * Original geometric team mark: a raked hexagon carrying the team's short code.
 * Deliberately not a reproduction of any official team logo.
 */
export default function TeamBadge({
  team,
  className = "",
}: {
  team: Team;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 52 32" className={className} role="img" aria-label={team.name}>
      <polygon
        points="7,1.5 50.5,1.5 45,30.5 1.5,30.5"
        fill="rgba(0,0,0,0.35)"
        stroke={team.accent}
        strokeWidth="2"
      />
      <text
        x="26"
        y="22.5"
        textAnchor="middle"
        textLength="32"
        lengthAdjust="spacingAndGlyphs"
        className="font-display"
        fontSize="15"
        fontWeight="700"
        letterSpacing="0.5"
        fill="#FFFFFF"
      >
        {team.short}
      </text>
    </svg>
  );
}
