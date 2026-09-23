import { useT } from "@/site/i18n/LanguageContext";
import { Reveal } from "./Reveal";
import { Eyebrow } from "./Section";

/**
 * The hero every inner page opens with — eyebrow, split headline, standfirst,
 * and an optional actions row.
 */
export function PageHero({ eyebrow, eyebrowIcon, title, highlight, description, actions, children }) {
  const t = useT();

  return (
    <section className="relative pb-12 pt-16 lg:pb-16 lg:pt-24">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-8">
        <Reveal className="mx-auto flex max-w-4xl flex-col items-center text-center">
          {eyebrow ? <Eyebrow icon={eyebrowIcon}>{t(eyebrow)}</Eyebrow> : null}

          <h1 className="s-display mt-7 !text-[clamp(2.4rem,5.6vw,4.6rem)]">
            {t(title)}
            {highlight ? (
              <>
                {" "}
                <span className="s-grad-text">{t(highlight)}</span>
              </>
            ) : null}
          </h1>

          {description ? <p className="s-lead mx-auto mt-6 max-w-2xl">{t(description)}</p> : null}

          {actions ? (
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">{actions}</div>
          ) : null}
        </Reveal>

        {children}
      </div>
    </section>
  );
}
