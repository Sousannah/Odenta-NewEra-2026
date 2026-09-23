import { useId } from "react";
import { cn } from "@/lib/cn";

/**
 * The glowing tooth from the Odenta posts — a molar drawn in light, standing
 * on a reflective floor. Pure SVG: it draws itself once on mount, then the
 * sparks around it breathe.
 *
 * `tone="night"` forces the dark palette (for panels that are dark in both
 * themes); otherwise it follows the site theme through the CSS tokens.
 */
const OUTER =
  "M170 330 C150 250 118 172 148 110 C172 60 240 54 270 86 C286 102 314 102 330 86 C360 54 428 60 452 110 C482 172 450 250 430 330";
const INNER =
  "M200 330 C186 256 162 182 182 130 C200 90 246 86 268 110 C284 126 316 126 332 110 C354 86 400 90 418 130 C438 182 414 256 400 330";
const ROOTS = "M242 330 C250 272 270 244 300 244 C330 244 350 272 358 330";

const SPARKS = [
  [120, 150, 1.6, 0],
  [488, 132, 1.4, 0.8],
  [96, 250, 1.1, 1.6],
  [512, 238, 1.8, 0.4],
  [300, 40, 1.3, 1.2],
  [214, 60, 1, 2],
  [396, 58, 1.2, 2.6],
  [150, 300, 1, 3],
  [456, 300, 1.2, 1.9],
];

export function GlowArch({ className, tone }) {
  const uid = useId().replace(/:/g, "");
  const night = tone === "night";
  const stroke = `arch-stroke-${uid}`;
  const glow = `arch-glow-${uid}`;
  const floor = `arch-floor-${uid}`;

  return (
    <svg viewBox="0 0 600 380" fill="none" aria-hidden="true" className={cn("w-full", className)}>
      <defs>
        <linearGradient id={stroke} x1="0" y1="330" x2="0" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0" style={{ stopColor: night ? "#9ff4ff" : "var(--s-aqua)" }} />
          <stop offset="0.55" style={{ stopColor: night ? "#39d3e6" : "var(--s-brand)" }} />
          <stop offset="1" style={{ stopColor: night ? "#c8fbff" : "var(--s-aqua)" }} />
        </linearGradient>
        <filter id={glow} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
        <radialGradient id={floor} cx="300" cy="334" r="240" gradientUnits="userSpaceOnUse">
          <stop offset="0" style={{ stopColor: night ? "#39d3e6" : "var(--s-aqua)" }} stopOpacity="0.55" />
          <stop offset="1" style={{ stopColor: night ? "#39d3e6" : "var(--s-aqua)" }} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* reflective floor */}
      <ellipse cx="300" cy="336" rx="250" ry="22" fill={`url(#${floor})`} />
      <line x1="60" y1="334" x2="540" y2="334" stroke={`url(#${floor})`} strokeWidth="1.2" />

      {/* bloom behind the strokes */}
      <g filter={`url(#${glow})`} opacity={night ? 0.95 : 0.55}>
        <path d={OUTER} stroke={`url(#${stroke})`} strokeWidth="8" pathLength="1" className="s-arch-stroke" />
        <path d={ROOTS} stroke={`url(#${stroke})`} strokeWidth="6" pathLength="1" className="s-arch-stroke" />
      </g>

      {/* the ribbons */}
      <path d={OUTER} stroke={`url(#${stroke})`} strokeWidth="2.6" strokeLinecap="round" pathLength="1" className="s-arch-stroke" />
      <path
        d={INNER}
        stroke={`url(#${stroke})`}
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.55"
        pathLength="1"
        className="s-arch-stroke"
        style={{ animationDelay: "0.5s" }}
      />
      <path
        d={ROOTS}
        stroke={`url(#${stroke})`}
        strokeWidth="2.2"
        strokeLinecap="round"
        pathLength="1"
        className="s-arch-stroke"
        style={{ animationDelay: "0.9s" }}
      />

      {/* mirrored reflection in the floor */}
      <g transform="translate(0 668) scale(1 -1)" opacity="0.14">
        <path d={OUTER} stroke={`url(#${stroke})`} strokeWidth="2" />
      </g>

      {SPARKS.map(([cx, cy, r, delay], index) => (
        <circle
          key={index}
          cx={cx}
          cy={cy}
          r={r}
          className="s-twinkle"
          style={{ fill: night ? "#c8fbff" : "var(--s-aqua)", animationDelay: `${delay}s` }}
        />
      ))}
    </svg>
  );
}
