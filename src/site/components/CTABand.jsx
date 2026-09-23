import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { site } from "@/config/paths";
import { useLanguage, useT } from "@/site/i18n/LanguageContext";
import { slogan } from "@/site/content/navigation";
import { Reveal } from "./Reveal";
import { SiteButton } from "./SiteButton";

const DEFAULT = {
  title: { en: "The future is closer", ar: "المستقبل أقرب" },
  highlight: { en: "than you think.", ar: "مما تظن." },
  description: {
    en: "Bring your university or clinic into one connected ecosystem. We will walk you through it, live, in thirty minutes.",
    ar: "انضم بجامعتك أو عيادتك إلى منظومة واحدة متصلة. سنعرضها لك مباشرة في ثلاثين دقيقة.",
  },
  primary: { label: { en: "Book a demo", ar: "احجز عرضًا" }, to: site.demo },
  secondary: { label: { en: "Contact us", ar: "تواصل معنا" }, to: site.contact },
};

/** The closing glass panel every page ends on. */
export function CTABand({
  title = DEFAULT.title,
  highlight = DEFAULT.highlight,
  description = DEFAULT.description,
  primary = DEFAULT.primary,
  secondary = DEFAULT.secondary,
  className,
}) {
  const t = useT();
  const { isRtl } = useLanguage();

  return (
    <section className={cn("relative px-3 py-16 sm:px-5 lg:py-24", className)}>
      <Reveal className="s-glass relative mx-auto max-w-6xl overflow-hidden rounded-[36px] px-6 py-16 text-center sm:px-12 lg:py-20">
        {/* a slow aqua bloom inside the panel */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-40 left-1/2 h-80 w-[640px] -translate-x-1/2 rounded-full opacity-60 blur-3xl"
          style={{ background: "radial-gradient(closest-side, var(--s-orb-2), transparent)" }}
        />

        <p className="s-kicker relative">{t(slogan)}</p>
        <h2 className="s-title relative mx-auto mt-5 max-w-3xl">
          {t(title)} <span className="s-grad-text">{t(highlight)}</span>
        </h2>
        {description ? <p className="s-lead relative mx-auto mt-5 max-w-2xl">{t(description)}</p> : null}

        <div className="relative mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <SiteButton
            size="lg"
            to={primary.to}
            rightIcon={<ArrowRight className={cn("h-4 w-4", isRtl && "rotate-180")} />}
          >
            {t(primary.label)}
          </SiteButton>
          {secondary ? (
            <SiteButton size="lg" variant="glass" to={secondary.to}>
              {t(secondary.label)}
            </SiteButton>
          ) : null}
        </div>
      </Reveal>
    </section>
  );
}
