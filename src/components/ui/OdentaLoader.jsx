import { useId } from "react";
import { cn } from "@/lib/cn";

/**
 * The Odenta loader.
 *
 * Six SVG glyphs spelling ODENTA, each drawn by a dash window travelling
 * around its outline — the wordmark writes and unwrites itself for as long as
 * the wait lasts. Ported from the original Odenta app so both products wait
 * the same way; the only change is the palette, which now comes from the
 * design system (ocean blue into teal) rather than the original's arbitrary
 * primaries.
 *
 * The keyframes live in `styles/index.css` as `.od-loader-dash`, so a screen
 * with several loaders on it ships them once. Gradient ids are per-instance —
 * two loaders in one document would otherwise fight over the same `<defs>`.
 *
 *   <OdentaLoaderScreen />                  full viewport — boot, auth handoff
 *   <OdentaLoaderPanel label="…" />         fills its container — route/page
 *   <OdentaLoader size="sm" tone="light" /> inline, over a dark surface
 *   <OdentaSpinner />                       compact ring — buttons, table rows
 */

/**
 * Per-glyph box size in px; the viewBox scales the stroke along with it.
 *
 * `gap` is a fraction of the glyph rather than a fixed step, so the wordmark
 * keeps the same letterspacing at every size.
 */
const GLYPH_GAP_RATIO = 0.11;

const SIZES = {
  xs: { glyph: 24, label: "text-[10px] mt-2" },
  sm: { glyph: 34, label: "text-[11px] mt-3" },
  md: { glyph: 48, label: "text-[11px] mt-4" },
  lg: { glyph: 64, label: "text-[12px] mt-5" },
};

/**
 * Three gradients per tone, mirroring the original loader's three-way
 * alternation. `signature` is the one that rotates — it is what keeps the
 * wordmark from reading as a static outline while the dash travels.
 */
const PALETTES = {
  brand: {
    deep: ["#00639A", "#0E88C6"],
    signature: ["#0077B6", "#20B2AA"],
    aqua: ["#20B2AA", "#63D9D1"],
  },
  light: {
    deep: ["#FFFFFF", "#9CE8E2"],
    signature: ["#CDF3F0", "#FFFFFF"],
    aqua: ["#9CE8E2", "#63D9D1"],
  },
};

/**
 * ODENTA, one entry per letter, with the gradient each one wears.
 *
 * Every glyph is drawn inside the same 12→52 box. The original's `D` stopped
 * at x=28 and its `N` at x=32 while `O`, `T` and `A` ran the full width, so the
 * word came out with two holes in it — both are redrawn here to the common
 * width. `E` is deliberately left narrow; that is how an E is supposed to sit.
 *
 * `O` is a circle rather than a path because a stroked circle distributes the
 * dash evenly without the seam a hand-written pair of arcs leaves behind.
 */
const GLYPHS = [
  { key: "O", tone: "aqua", circle: true },
  { key: "D", tone: "deep", d: "M12,12 h20 a20,20 0 0,1 0,40 h-20 z" },
  { key: "E", tone: "signature", d: "M12,12 h32 m-32,0 v40 h32 m-32,-20 h24" },
  { key: "N", tone: "deep", d: "M12,52 v-40 l40,40 v-40" },
  { key: "T", tone: "aqua", d: "M12,12 h40 m-20,0 v40" },
  { key: "A", tone: "signature", d: "M12,52 l20,-40 l20,40 m-12,-12 h-16" },
];

/**
 * Cropped to the ink plus a stroke's clearance.
 *
 * The glyphs are authored on a 64 grid but only ever occupy 12→52, and the
 * 12 units of dead margin on each side is what made the letters read as
 * six separate icons rather than one word.
 */
const GLYPH_VIEWBOX = "8 8 48 48";

export function OdentaLoader({ size = "md", tone = "brand", label, className }) {
  /* useId is colon-heavy and colons are not valid in a url(#…) reference. */
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const { glyph, label: labelClass } = SIZES[size] ?? SIZES.md;
  const palette = PALETTES[tone] ?? PALETTES.brand;
  const gradient = (name) => `od-loader-${name}-${uid}`;

  return (
    <div
      className={cn("flex flex-col items-center", className)}
      role="status"
      aria-live="polite"
      /* The glyphs spell a word left to right whatever the page direction is. */
      dir="ltr"
    >
      <svg width="0" height="0" viewBox="0 0 64 64" className="absolute" aria-hidden="true">
        <defs>
          <linearGradient id={gradient("deep")} gradientUnits="userSpaceOnUse" x1="0" y1="62" x2="0" y2="2">
            <stop stopColor={palette.deep[0]} />
            <stop offset="1" stopColor={palette.deep[1]} />
          </linearGradient>

          <linearGradient id={gradient("signature")} gradientUnits="userSpaceOnUse" x1="0" y1="64" x2="0" y2="0">
            <stop stopColor={palette.signature[0]} />
            <stop offset="1" stopColor={palette.signature[1]} />
            <animateTransform
              attributeName="gradientTransform"
              type="rotate"
              dur="8s"
              repeatCount="indefinite"
              keyTimes="0; 0.125; 0.25; 0.375; 0.5; 0.625; 0.75; 0.875; 1"
              keySplines=".42,0,.58,1;.42,0,.58,1;.42,0,.58,1;.42,0,.58,1;.42,0,.58,1;.42,0,.58,1;.42,0,.58,1;.42,0,.58,1"
              values="0 32 32;-270 32 32;-270 32 32;-540 32 32;-540 32 32;-810 32 32;-810 32 32;-1080 32 32;-1080 32 32"
            />
          </linearGradient>

          <linearGradient id={gradient("aqua")} gradientUnits="userSpaceOnUse" x1="0" y1="62" x2="0" y2="2">
            <stop stopColor={palette.aqua[0]} />
            <stop offset="1" stopColor={palette.aqua[1]} />
          </linearGradient>
        </defs>
      </svg>

      <div
        className="flex items-center"
        style={{ gap: `${Math.round(glyph * GLYPH_GAP_RATIO)}px` }}
        aria-hidden="true"
      >
        {GLYPHS.map((letter) => {
          const stroke = `url(#${gradient(letter.tone)})`;
          return (
            <svg
              key={letter.key}
              xmlns="http://www.w3.org/2000/svg"
              viewBox={GLYPH_VIEWBOX}
              width={glyph}
              height={glyph}
              fill="none"
              className="shrink-0"
            >
              {letter.circle ? (
                <circle cx="32" cy="32" r="20" stroke={stroke} pathLength="360" className="od-loader-dash" />
              ) : (
                <path d={letter.d} stroke={stroke} pathLength="360" className="od-loader-dash" />
              )}
            </svg>
          );
        })}
      </div>

      {label ? (
        <span
          className={cn(
            "font-bold uppercase tracking-[0.18em]",
            tone === "light" ? "text-white/75" : "text-ink-soft",
            labelClass
          )}
        >
          {label}
        </span>
      ) : (
        <span className="sr-only">Loading</span>
      )}
    </div>
  );
}

/** Full viewport. The app booting, or a session being re-established. */
export function OdentaLoaderScreen({ label = "Loading Odenta", size = "md", className }) {
  return (
    <div
      className={cn(
        "flex min-h-screen w-full items-center justify-center bg-white px-6",
        className
      )}
    >
      <OdentaLoader size={size} label={label} />
    </div>
  );
}

/**
 * Fills whatever it is dropped into — a route's Suspense fallback, a dashboard
 * still waiting on its first fetch. Sized off the viewport rather than the
 * parent so it holds the fold open instead of collapsing to a thin strip.
 */
export function OdentaLoaderPanel({ label = "Loading", size = "md", className }) {
  return (
    <div
      className={cn(
        "flex min-h-[60vh] w-full flex-1 items-center justify-center p-6",
        className
      )}
    >
      <OdentaLoader size={size} label={label} />
    </div>
  );
}

/**
 * Covers content that is being replaced rather than fetched for the first
 * time — the old view stays legible underneath, dimmed.
 *
 * The parent must be positioned.
 */
export function OdentaLoaderOverlay({ label, size = "sm", tone = "brand", className }) {
  return (
    <div
      className={cn(
        "absolute inset-0 z-20 flex items-center justify-center backdrop-blur-[2px]",
        tone === "light" ? "bg-ink/45" : "bg-white/70",
        className
      )}
    >
      <OdentaLoader size={size} tone={tone} label={label} />
    </div>
  );
}

const SPINNER_STOPS = {
  brand: ["#0077B6", "#20B2AA"],
  light: ["#FFFFFF", "#9CE8E2"],
};

/**
 * The compact form, for places the wordmark cannot go: inside a button, beside
 * a table row, next to a "load more". `tone="current"` inherits the text
 * colour, which is what a coloured button needs.
 */
export function OdentaSpinner({ size = 18, tone = "brand", className }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const id = `od-spinner-${uid}`;
  const stops = SPINNER_STOPS[tone];

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      className={cn("shrink-0 animate-spin", className)}
      aria-hidden="true"
    >
      {stops ? (
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop stopColor={stops[0]} />
            <stop offset="1" stopColor={stops[1]} />
          </linearGradient>
        </defs>
      ) : null}
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2.75" />
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke={stops ? `url(#${id})` : "currentColor"}
        strokeWidth="2.75"
        strokeLinecap="round"
        strokeDasharray="17 40"
      />
    </svg>
  );
}

export default OdentaLoader;
