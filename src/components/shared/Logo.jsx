import { Link } from "react-router-dom";
import { cn } from "@/lib/cn";
import { site } from "@/config/paths";
import { brandAssets } from "@/theme/assets";
import { brand, accent } from "@/theme/tokens";

/**
 * The Odenta mark as SVG.
 *
 * Used anywhere the mark sits on a coloured or dark surface — a gradient
 * panel, a hero — where the raster mark's own colours would disappear into the
 * ground behind them.
 */
export function ToothMark({ className, gradientId = "odMark" }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("h-7 w-7", className)} aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={brand[600]} />
          <stop offset="100%" stopColor={accent[500]} />
        </linearGradient>
      </defs>
      <path
        d="M16 3c3 0 4.2-1.2 7.2-1.2C27 1.8 29 4.6 29 8.6c0 4.4-1.6 6.6-2.6 10.4-.9 3.4-1.2 10.8-4.4 10.8-2.7 0-2.6-6.6-6-6.6s-3.3 6.6-6 6.6c-3.2 0-3.5-7.4-4.4-10.8C4.6 15.2 3 13 3 8.6 3 4.6 5 1.8 8.8 1.8 11.8 1.8 13 3 16 3Z"
        fill={`url(#${gradientId})`}
      />
      <path
        d="M11.5 8.6c1.4-1 3.1-1.4 4.5-1.4"
        stroke="#fff"
        strokeOpacity="0.85"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

/** Mark sizes, shared by the rail and the expanded header so they agree. */
const MARK_SIZES = {
  sm: "h-9 w-9",
  md: "h-11 w-11",
  lg: "h-[52px] w-[52px]",
};

const WORD_SIZES = {
  sm: "text-[19px]",
  md: "text-[23px]",
  lg: "text-[26px]",
};

/**
 * The tooth on its own, as shipped artwork.
 *
 * The raster mark rather than `ToothMark`: it is the real logo, gradients,
 * circuitry and all, and with the plate cut out of it there is nothing left to
 * clash with whatever it is placed on.
 */
export function BrandMark({ size = "md", className }) {
  return (
    <img
      src={brandAssets.markPng}
      alt=""
      aria-hidden="true"
      draggable="false"
      className={cn("shrink-0 select-none object-contain", MARK_SIZES[size] ?? MARK_SIZES.md, className)}
    />
  );
}

/**
 * Portal wordmark.
 *
 * `variant="image"` uses the shipped wide logo — what the auth screens want,
 * where the mark is the only thing on the page. `variant="mark"` pairs the
 * cut-out tooth with live text, which is what the portal shells use: it holds
 * up when the sidebar collapses to a rail, and the word can grow without the
 * tooth growing with it.
 *
 * Pass `to` to make the whole thing a link — the shells point it at the public
 * home page, so the mark behaves the way a logo in a top-left corner is
 * expected to.
 */
export function Logo({
  collapsed = false,
  variant = "image",
  inverted = false,
  size = "md",
  to,
  className,
}) {
  const wide = variant === "image" && !collapsed && !inverted;

  const content = wide ? (
    <img
      src={brandAssets.logo}
      alt="Odenta"
      className={cn("h-9 w-auto object-contain", className)}
    />
  ) : (
    <span className={cn("flex items-center gap-2.5", className)}>
      {inverted ? (
        <ToothMark className={MARK_SIZES[size] ?? MARK_SIZES.md} />
      ) : (
        <BrandMark size={size} />
      )}
      {!collapsed ? (
        <span
          className={cn(
            "font-display font-extrabold tracking-tight",
            WORD_SIZES[size] ?? WORD_SIZES.md,
            inverted ? "text-white" : "text-ink"
          )}
        >
          Odenta
        </span>
      ) : null}
    </span>
  );

  if (!to) return content;

  return (
    <Link
      to={to === true ? site.home : to}
      aria-label="Odenta home"
      title="Odenta home"
      className="od-focus inline-flex shrink-0 items-center rounded-xl transition hover:opacity-90 active:scale-[0.97]"
    >
      {content}
    </Link>
  );
}
