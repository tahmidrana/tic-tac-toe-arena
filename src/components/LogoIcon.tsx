export function LogoIcon({ size = 36, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="li-bg" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6d28d9" />
          <stop offset="1" stopColor="#a21caf" />
        </linearGradient>
        <linearGradient id="li-x" x1="5" y1="5" x2="18" y2="18" gradientUnits="userSpaceOnUse">
          <stop stopColor="#bae6fd" />
          <stop offset="1" stopColor="#0284c7" />
        </linearGradient>
        <linearGradient id="li-o" x1="45" y1="45" x2="61" y2="61" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fecdd3" />
          <stop offset="1" stopColor="#e11d48" />
        </linearGradient>
        <filter id="li-glow-x" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="li-glow-o" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Background rounded square */}
      <rect width="64" height="64" rx="14" fill="url(#li-bg)" />

      {/* Inner top shine */}
      <rect x="1" y="1" width="62" height="28" rx="13" fill="white" fillOpacity="0.09" />

      {/* Subtle border */}
      <rect x="0.75" y="0.75" width="62.5" height="62.5" rx="13.25" stroke="white" strokeOpacity="0.13" strokeWidth="1.5" />

      {/* Grid lines — vertical */}
      <line x1="22" y1="8" x2="22" y2="56" stroke="white" strokeOpacity="0.22" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="42" y1="8" x2="42" y2="56" stroke="white" strokeOpacity="0.22" strokeWidth="1.5" strokeLinecap="round" />
      {/* Grid lines — horizontal */}
      <line x1="8" y1="22" x2="56" y2="22" stroke="white" strokeOpacity="0.22" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="8" y1="42" x2="56" y2="42" stroke="white" strokeOpacity="0.22" strokeWidth="1.5" strokeLinecap="round" />

      {/* X — top-left cell (cell center ≈ 11, 11) */}
      <g filter="url(#li-glow-x)">
        <line x1="6.5" y1="6.5" x2="17" y2="17" stroke="url(#li-x)" strokeWidth="3.5" strokeLinecap="round" />
        <line x1="17" y1="6.5" x2="6.5" y2="17" stroke="url(#li-x)" strokeWidth="3.5" strokeLinecap="round" />
      </g>

      {/* O — bottom-right cell (cell center ≈ 53, 53) */}
      <g filter="url(#li-glow-o)">
        <circle cx="53" cy="53" r="6.5" stroke="url(#li-o)" strokeWidth="3.5" fill="none" />
      </g>

      {/* Center accent dot */}
      <circle cx="32" cy="32" r="2.5" fill="white" fillOpacity="0.2" />
      <circle cx="32" cy="32" r="1" fill="white" fillOpacity="0.5" />
    </svg>
  );
}
