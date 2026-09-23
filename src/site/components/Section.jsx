import { cn } from "@/lib/cn";
import { useT } from "@/site/i18n/LanguageContext";
import { Reveal } from "./Reveal";

/**
 * Tones are kept for the older pages that pass them, but every band is now
 * transparent — the ambient light behind the site is the background, and
 * glass cards are what separate one section from the next.
 */
const TONES = {
  plain: "",
  canvas: "",
  soft: "",
  radial: "",
  deep: "",
};

/** A full-width band with the shared vertical rhythm and page gutter. */
export function Section({ tone = "plain", id, className, containerClassName, children }) {
  return (
    <section id={id} className={cn("relative py-16 lg:py-24", TONES[tone], className)}>
      <div className={cn("mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-8", containerClassName)}>{children}</div>
    </section>
  );
}

/** The tracked capsule above a heading. */
export function Eyebrow({ icon, children, className }) {
  return (
    <span className={cn("s-chip s-kicker !text-[11px] !tracking-[0.22em]", className)}>
      {icon}
      {children}
    </span>
  );
}

/**
 * Section heading.
 *
 * `highlight` is painted with the Odenta gradient — the site's signature move.
 */
export function SectionHeading({
  eyebrow,
  eyebrowIcon,
  title,
  highlight,
  description,
  align = "center",
  className,
  children,
}) {
  const t = useT();
  const centered = align === "center";

  return (
    <Reveal
      className={cn(
        "flex flex-col gap-5",
        centered ? "mx-auto max-w-3xl items-center text-center" : "max-w-2xl items-start text-start",
        className
      )}
    >
      {eyebrow ? <Eyebrow icon={eyebrowIcon}>{t(eyebrow)}</Eyebrow> : null}

      <h2 className="s-title">
        {t(title)}
        {highlight ? (
          <>
            {" "}
            <span className="s-grad-text">{t(highlight)}</span>
          </>
        ) : null}
      </h2>

      {description ? <p className="s-lead max-w-2xl">{t(description)}</p> : null}

      {children}
    </Reveal>
  );
}
