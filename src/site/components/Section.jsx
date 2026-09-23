import { cn } from "@/lib/cn";
import { useT } from "@/site/i18n/LanguageContext";
import { Reveal } from "./Reveal";

const TONES = {
  plain: "bg-white",
  canvas: "bg-canvas",
  soft: "bg-od-gradient-soft",
  radial: "bg-white bg-od-radial",
  deep: "bg-od-gradient-deep text-white",
};

/** A full-width band with the shared vertical rhythm and page gutter. */
export function Section({ tone = "plain", id, className, containerClassName, children }) {
  return (
    <section id={id} className={cn("od-section relative overflow-hidden", TONES[tone], className)}>
      <div className={cn("od-container relative", containerClassName)}>{children}</div>
    </section>
  );
}

/** Small capsule above a heading — "AI imaging", "For universities", … */
export function Eyebrow({ icon, children, inverted = false, className }) {
  return (
    <span
      className={cn(
        "od-eyebrow",
        inverted && "border-white/25 bg-white/10 text-white",
        className
      )}
    >
      {icon}
      {children}
    </span>
  );
}

/**
 * Section heading.
 *
 * `title` may be a string or `{ lead, highlight }` — the highlight half is
 * painted with the Odenta gradient, which is the site's signature move.
 */
export function SectionHeading({
  eyebrow,
  eyebrowIcon,
  title,
  highlight,
  description,
  align = "center",
  inverted = false,
  className,
  children,
}) {
  const t = useT();
  const centered = align === "center";

  return (
    <Reveal
      className={cn(
        "flex flex-col gap-4",
        centered ? "mx-auto max-w-3xl items-center text-center" : "max-w-2xl items-start text-start",
        className
      )}
    >
      {eyebrow ? (
        <Eyebrow icon={eyebrowIcon} inverted={inverted}>
          {t(eyebrow)}
        </Eyebrow>
      ) : null}

      <h2
        className={cn(
          "text-[32px] font-extrabold leading-[1.15] tracking-tight md:text-[42px]",
          inverted ? "text-white" : "text-brand-700"
        )}
      >
        {t(title)}
        {highlight ? (
          <>
            {" "}
            <span className={inverted ? "text-accent-200" : "od-gradient-text"}>{t(highlight)}</span>
          </>
        ) : null}
      </h2>

      {description ? (
        <p
          className={cn(
            "text-[17px] leading-relaxed",
            inverted ? "text-white/80" : "text-ink-muted"
          )}
        >
          {t(description)}
        </p>
      ) : null}

      {children}
    </Reveal>
  );
}
