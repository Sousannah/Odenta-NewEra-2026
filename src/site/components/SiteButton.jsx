import { Link } from "react-router-dom";
import { cn } from "@/lib/cn";

const VARIANTS = {
  /** Gradient pill — the primary call to action everywhere on the site. */
  primary: "s-btn s-btn-primary",
  /** Frosted pill for the secondary action beside it. */
  ghost: "s-btn s-btn-glass",
  glass: "s-btn s-btn-glass",
  /** Kept for older pages that sit on a coloured band; both now read as glass. */
  inverted: "s-btn s-btn-glass",
  "inverted-ghost": "s-btn s-btn-glass",
  /** Text link with an arrow, for card footers. */
  link: "s-btn s-btn-link text-[15px]",
};

const SIZES = {
  sm: "s-btn-sm",
  md: "s-btn-md",
  lg: "s-btn-lg",
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
  const classes = cn(VARIANTS[variant] ?? VARIANTS.primary, variant !== "link" && SIZES[size], className);
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
