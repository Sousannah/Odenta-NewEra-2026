import { Link } from "react-router-dom";
import { cn } from "@/lib/cn";
import { site } from "@/config/paths";
import { brandAssets } from "@/theme/assets";

const SIZES = {
  sm: "h-9",
  md: "h-12",
  lg: "h-14",
};

/**
 * The Odenta wordmark, linked home.
 *
 * `brandAssets.logo` is the background-removed build, so the mark sits cleanly
 * on any light ground — the tinted footer included. On a dark surface use
 * `<Logo variant="mark" inverted>` from `components/shared`, which draws the
 * mark as SVG beside live text.
 */
export function SiteLogo({ size = "md", className, to = site.home }) {
  return (
    <Link
      to={to}
      aria-label="Odenta home"
      className={cn("od-focus inline-flex shrink-0 items-center rounded-lg", className)}
    >
      <img
        src={brandAssets.logo}
        alt="Odenta"
        className={cn("w-auto object-contain", SIZES[size])}
      />
    </Link>
  );
}
