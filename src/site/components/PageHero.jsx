import { cn } from "@/lib/cn";
import { useT } from "@/site/i18n/LanguageContext";
import { Reveal } from "./Reveal";
import { Eyebrow } from "./Section";

/**
 * The compact hero every inner page opens with — eyebrow, split headline,
 * standfirst, and an optional actions row.
 */
export function PageHero({ eyebrow, eyebrowIcon, title, highlight, description, actions, children }) {
  const t = useT();

  return (
    <section className="relative overflow-hidden bg-white bg-od-radial pb-16 pt-16 lg:pb-20 lg:pt-24">
      <div className="od-container relative">
        <Reveal className="mx-auto max-w-3xl text-center">
          {eyebrow ? <Eyebrow icon={eyebrowIcon}>{t(eyebrow)}</Eyebrow> : null}

          <h1
            className={cn(
              "mt-6 text-[36px] font-extrabold leading-[1.1] tracking-tight text-brand-700",
              "md:text-[52px]"
            )}
          >
            {t(title)}
            {highlight ? (
              <>
                {" "}
                <span className="od-gradient-text">{t(highlight)}</span>
              </>
            ) : null}
          </h1>

          {description ? (
            <p className="mx-auto mt-5 max-w-2xl text-[17px] leading-relaxed text-ink-muted">
              {t(description)}
            </p>
          ) : null}

          {actions ? (
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              {actions}
            </div>
          ) : null}
        </Reveal>

        {children}
      </div>
    </section>
  );
}
