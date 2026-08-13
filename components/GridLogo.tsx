export default function GridLogo({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 40"
      role="img"
      aria-label="Grid Bingo mark"
      className={className}
    >
      <defs>
        <linearGradient id="gridLogoFill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffb020" />
          <stop offset="100%" stopColor="#ff6a00" />
        </linearGradient>
      </defs>
      <g fill="url(#gridLogoFill)">
        <polygon points="12,2 58,2 50,12 4,12" />
        <polygon points="20,15 58,15 50,25 12,25" />
        <polygon points="28,28 58,28 50,38 20,38" />
      </g>
    </svg>
  );
}
