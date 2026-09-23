import { Link } from "react-router-dom";
import { cn } from "@/lib/cn";
import { site } from "@/config/paths";
import { brandAssets } from "@/theme/assets";

const SIZES = {
  sm: { mark: "h-7 w-7", text: "text-[17px]" },
  md: { mark: "h-8 w-8", text: "text-[19px]" },
  lg: { mark: "h-11 w-11", text: "text-[26px]" },
};

/**
 * The Odenta mark beside a live wordmark, linked home.
 *
 * Live text rather than the wordmark PNG because the PNG's lettering is navy
 * and disappears on the dark theme; the tooth itself reads on both grounds.
 */
export function SiteLogo({ size = "md", className, to = site.home }) {
  const s = SIZES[size] ?? SIZES.md;
  return (
    <Link
      to={to}
      aria-label="Odenta home"
      dir="ltr"
      className={cn("s-focus inline-flex shrink-0 items-center gap-2 rounded-xl", className)}
    >
      <img src={brandAssets.markPng} alt="" aria-hidden="true" className={cn("object-contain", s.mark)} />
      <span className={cn("s-text font-semibold tracking-[-0.02em]", s.text)}>Odenta</span>
    </Link>
  );
}
