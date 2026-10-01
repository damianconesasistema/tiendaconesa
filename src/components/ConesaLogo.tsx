type Props = {
  className?: string;
  withTagline?: boolean;
};

export function ConesaLogo({ className, withTagline = false }: Props) {
  return (
    <svg
      viewBox="0 0 520 220"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Sanitarios Conesa Traslasierra"
      role="img"
    >
      <text
        x="30"
        y="42"
        fontFamily="var(--font-display), 'Barlow Condensed', sans-serif"
        fontWeight={800}
        fontSize={34}
        letterSpacing="8"
        fill="currentColor"
      >
        SANITARIOS
      </text>

      <g transform="translate(28, 60)">
        <text
          x="0"
          y="92"
          fontFamily="var(--font-display), 'Barlow Condensed', sans-serif"
          fontWeight={900}
          fontSize={120}
          letterSpacing="-2"
          fill="currentColor"
        >
          CONES
        </text>
        <g transform="translate(320, 0)">
          <polygon points="0,100 55,0 110,100 85,100 55,50 25,100" fill="#E63020" />
          <rect x="40" y="75" width="30" height="12" fill="#E63020" />
        </g>
      </g>

      {withTagline && (
        <text
          x="260"
          y="200"
          textAnchor="middle"
          fontFamily="var(--font-display), 'Barlow Condensed', sans-serif"
          fontWeight={700}
          fontSize={22}
          letterSpacing="6"
          fill="currentColor"
        >
          TRASLASIERRA — CÓRDOBA
        </text>
      )}
    </svg>
  );
}
