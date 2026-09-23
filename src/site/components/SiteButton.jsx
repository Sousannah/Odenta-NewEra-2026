import { Link } from "react-router-dom";
import { cn } from "@/lib/cn";

const VARIANTS = {
  /** Gradient pill — the primary call to action everywhere on the site. */
  primary: "od-cta",
  /** Outlined pill for the secondary action beside it. */
  ghost: "od-cta-ghost",
  /** Solid white pill, for use on top of the gradient. */
  inverted:
    "od-focus inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 text-[15px] font-bold text-brand-700 shadow-lift transition duration-300 hover:-translate-y-0.5 hover:text-accent-600",
  /** Outlined pill on top of the gradient. */
  "inverted-ghost":
    "od-focus inline-flex items-center justify-center gap-2 rounded-full border-2 border-white/40 px-7 py-3.5 text-[15px] font-bold text-white transition duration-300 hover:-translate-y-0.5 hover:border-white hover:bg-white/10",
  /** Text link with an arrow, for card footers. */
  link:
    "od-focus inline-flex items-center gap-1.5 text-[14px] font-bold text-accent-600 transition hover:gap-2.5 hover:text-brand-700",
};

const SIZES = {
  sm: "px-5 py-2.5 text-[13.5px]",
  md: "",
  lg: "px-8 py-4 text-base",
};

/**
 * Marketing CTA. Renders a router `<Link>` for `to`, an `<a>` for `href`, and
 * a `<button>` otherwise — so callers never have to pick the element.
 */
export function SiteButton({
  variant = "primary",
  size = "md",
  to,
  href,
  className,
  leftIcon,
  rightIcon,
  children,
  ...props
}) {
  const classes = cn(VARIANTS[variant], variant !== "link" && SIZES[size], className);
  const content = (
    <>
      {leftIcon}
      {children}
      {rightIcon}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {content}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} className={classes} {...props}>
        {content}
      </a>
    );
  }

  return (
    <button type="button" className={classes} {...props}>
      {content}
    </button>
  );
}
