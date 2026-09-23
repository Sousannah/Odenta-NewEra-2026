import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";
import { useLanguage, useT } from "@/site/i18n/LanguageContext";
import { audiences, foundation, hero, next } from "@/site/content/services";
import { CTABand, PageHero, Reveal, Section, SectionHeading } from "@/site/components";

function AudiencePanel({ audience, delay }) {
  const t = useT();
  const { isRtl } = useLanguage();
  const Icon = audience.icon;

  return (
    <Reveal delay={delay} className="s-glass flex flex-col rounded-[34px] p-8 sm:p-10">
      <div className="flex items-center gap-3">
        <span className="s-icon-tile h-12 w-12">
          <Icon className="h-6 w-6" />
        </span>
        <span className="s-kicker !text-[11px]">{t(audience.eyebrow)}</span>
      </div>

      <h2 className="mt-7 text-[clamp(1.6rem,2.6vw,2.2rem)] leading-tight">{t(audience.title)}</h2>
      <p className="s-muted mt-3 text-[16px] leading-relaxed">{t(audience.description)}</p>

      <ul className="mt-8 flex flex-1 flex-col">
        {audience.items.map((item, index) => {
          const ItemIcon = item.icon;
          return (
            <li key={index} className={cn("flex items-start gap-4 py-4", index > 0 && "s-hairline border-t")}>
              <span className="s-chip !h-10 !w-10 shrink-0 !justify-center !p-0">
                <ItemIcon className="s-accent h-[18px] w-[18px]" />
              </span>
              <span>
                <span className="block text-[16px] font-semibold">{t(item.title)}</span>
                <span className="s-muted mt-0.5 block text-[14.5px] leading-relaxed">{t(item.description)}</span>
              </span>
            </li>
          );
        })}
      </ul>

      <Link
        to={audience.to}
        className="s-focus s-accent mt-6 inline-flex items-center gap-1.5 self-start rounded text-[15px] font-semibold transition-all hover:gap-2.5"
      >
        {t(audience.cta)}
        <ArrowRight className={cn("h-4 w-4", isRtl && "rotate-180")} />
      </Link>
    </Reveal>
  );
}

export default function ServicesPage() {
  const t = useT();

  return (
    <>
      <PageHero
        eyebrow={hero.eyebrow}
        title={hero.title}
        highlight={hero.highlight}
        description={hero.description}
      />

      <Section className="pt-4 lg:pt-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {audiences.map((audience, index) => (
            <AudiencePanel key={audience.key} audience={audience} delay={index * 120} />
          ))}
        </div>
      </Section>

      <Section>
        <SectionHeading eyebrow={foundation.eyebrow} title={foundation.title} highlight={foundation.highlight} />
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {foundation.items.map((item, index) => {
            const Icon = item.icon;
            return (
              <Reveal key={item.key} delay={index * 80} className="s-glass s-glass-hover rounded-[26px] p-7">
                <span className="s-chip !h-11 !w-11 !justify-center !p-0">
                  <Icon className="s-accent h-5 w-5" />
                </span>
                <h3 className="mt-6 text-[18px]">{t(item.title)}</h3>
                <p className="s-muted mt-2 text-[14.5px] leading-relaxed">{t(item.description)}</p>
              </Reveal>
            );
          })}
        </div>

        <Reveal className="mt-14 flex flex-col items-center gap-3 text-center">
          <span className="s-chip">
            <Sparkles className="s-accent h-3.5 w-3.5" />
            {t(next.title)}
          </span>
          <p className="s-muted max-w-lg text-[15px]">{t(next.description)}</p>
        </Reveal>
      </Section>

      <CTABand />
    </>
  );
}
