/** Shared Folio logomark — keep in sync with app/icon.svg */
export const LOGO_COLORS = {
  ink950: "#0b1220",
  ink900: "#0f172a",
  ink800: "#1e293b",
  ink700: "#334155",
  ink600: "#475569",
  ink200: "#e2e8f0",
  paper: "#f8fafc",
  paperEdge: "#cbd5e1",
  brand400: "#608cfa",
  brand500: "#3b66f6",
  brand600: "#2547eb",
  brand700: "#1e40af",
  pass: "#0f9d58",
  passLight: "#34d399",
} as const;

export const LOGO_VIEWBOX = "0 0 48 48";

export function FolioLogoDefs({ id = "folio" }: { id?: string }) {
  const p = (name: string) => `${id}-${name}`;
  return (
    <defs>
      <linearGradient id={p("bg")} x1="6" y1="4" x2="42" y2="44">
        <stop offset="0%" stopColor={LOGO_COLORS.ink950} />
        <stop offset="55%" stopColor={LOGO_COLORS.ink900} />
        <stop offset="100%" stopColor={LOGO_COLORS.ink800} />
      </linearGradient>
      <radialGradient id={p("glow")} cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(36 36) scale(20)">
        <stop offset="0%" stopColor={LOGO_COLORS.brand500} stopOpacity="0.35" />
        <stop offset="100%" stopColor={LOGO_COLORS.brand500} stopOpacity="0" />
      </radialGradient>
      <linearGradient id={p("paper")} x1="14" y1="10" x2="38" y2="40">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="100%" stopColor={LOGO_COLORS.paper} />
      </linearGradient>
      <linearGradient id={p("brand")} x1="11" y1="9" x2="37" y2="16">
        <stop offset="0%" stopColor={LOGO_COLORS.brand400} />
        <stop offset="50%" stopColor={LOGO_COLORS.brand500} />
        <stop offset="100%" stopColor={LOGO_COLORS.brand700} />
      </linearGradient>
      <linearGradient id={p("score")} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor={LOGO_COLORS.passLight} />
        <stop offset="100%" stopColor={LOGO_COLORS.pass} />
      </linearGradient>
      <filter id={p("shadow")} x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.4" />
      </filter>
      <filter id={p("glow-pass")} x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="1.2" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  );
}

export function FolioLogoPaths({ id = "folio" }: { id?: string }) {
  const p = (name: string) => `${id}-${name}`;
  return (
    <>
      {/* Canvas */}
      <rect width="48" height="48" rx="11" fill={`url(#${p("bg")})`} />
      <circle cx="36" cy="36" r="20" fill={`url(#${p("glow")})`} />
      <rect width="48" height="48" rx="11" fill="none" stroke="white" strokeOpacity="0.09" />

      {/* Scan beams — ATS metaphor */}
      <g stroke={LOGO_COLORS.brand400} strokeOpacity="0.28" strokeLinecap="round">
        <path d="M5 14h11" strokeWidth="1.5" />
        <path d="M5 18.5h8" strokeWidth="1.25" />
        <path d="M5 23h13" strokeWidth="1.5" />
        <path d="M5 27.5h7" strokeWidth="1.25" />
      </g>

      {/* Paper stack */}
      <rect
        x="4.5"
        y="9"
        width="22"
        height="28"
        rx="2.5"
        fill={LOGO_COLORS.ink600}
        fillOpacity="0.45"
        transform="rotate(-11 15.5 23)"
      />
      <rect
        x="7.5"
        y="10.5"
        width="22"
        height="28"
        rx="2.5"
        fill={LOGO_COLORS.ink700}
        fillOpacity="0.55"
        transform="rotate(-5 18.5 24.5)"
      />

      {/* Drop shadow */}
      <ellipse cx="26" cy="42.5" rx="13" ry="2.5" fill="#000" fillOpacity="0.28" />

      {/* Front document */}
      <rect
        x="10.5"
        y="8.5"
        width="27"
        height="33"
        rx="3"
        fill={`url(#${p("paper")})`}
        stroke={LOGO_COLORS.paperEdge}
        strokeWidth="0.6"
        strokeOpacity="0.75"
        filter={`url(#${p("shadow")})`}
      />

      {/* Folded corner */}
      <path d="M33.5 8.5h4v4L33.5 8.5z" fill={LOGO_COLORS.ink200} fillOpacity="0.9" />
      <path d="M33.5 8.5l4 4" stroke={LOGO_COLORS.paperEdge} strokeWidth="0.6" />

      {/* Resume header bar */}
      <path
        d="M10.5 11.5c0-1.66 1.34-3 3-3h21c1.66 0 3 1.34 3 3v4.5H10.5V11.5z"
        fill={`url(#${p("brand")})`}
      />

      {/* Bold F monogram on header */}
      <path
        fill="white"
        fillOpacity="0.96"
        d="M14.2 10.2h9.2v2.45h-6.35v2.95h5.35v2.4h-5.35v5.55h-2.85V10.2z"
      />

      {/* Body content lines */}
      <path
        d="M14 21.5h14M14 24.75h11.5M14 28h13.5M14 31.25h8.5"
        stroke={LOGO_COLORS.ink900}
        strokeOpacity="0.14"
        strokeWidth="1.35"
        strokeLinecap="round"
      />

      {/* Quantified metric highlight */}
      <rect x="14" y="26.4" width="10" height="3.2" rx="1.6" fill={LOGO_COLORS.pass} fillOpacity="0.16" />
      <path
        d="M15.2 28.1h5.8"
        stroke={`url(#${p("score")})`}
        strokeWidth="1.65"
        strokeLinecap="round"
      />
      <circle cx="23.8" cy="28.1" r="1.1" fill={LOGO_COLORS.pass} />

      {/* ATS score badge */}
      <circle cx="36.5" cy="36.5" r="9.5" fill={LOGO_COLORS.ink950} fillOpacity="0.95" />
      <circle
        cx="36.5"
        cy="36.5"
        r="8.25"
        fill="none"
        stroke="white"
        strokeOpacity="0.1"
        strokeWidth="1"
      />
      <circle
        cx="36.5"
        cy="36.5"
        r="6.75"
        fill="none"
        stroke="white"
        strokeOpacity="0.06"
        strokeWidth="3.5"
        strokeDasharray="28 14"
        transform="rotate(-90 36.5 36.5)"
      />
      <path
        d="M36.5 29.4a7.1 7.1 0 0 1 6.2 3.65"
        stroke={`url(#${p("score")})`}
        strokeWidth="2.4"
        strokeLinecap="round"
        fill="none"
        filter={`url(#${p("glow-pass")})`}
      />
      <text
        x="36.5"
        y="38.2"
        textAnchor="middle"
        fill="white"
        fontSize="7.5"
        fontWeight="700"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        92
      </text>
    </>
  );
}
