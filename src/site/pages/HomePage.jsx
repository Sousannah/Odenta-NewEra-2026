import { Link } from "react-router-dom";
import { ArrowRight, Instagram } from "lucide-react";
import { cn } from "@/lib/cn";
import { useLanguage, useT } from "@/site/i18n/LanguageContext";
import { images, universityLogos } from "@/theme/assets";
import { slogan, socialLinks } from "@/site/content/navigation";
import { closing, ecosystem, hero, origin, principles, teaser } from "@/site/content/home";
import { CTABand, Reveal, Section, SectionHeading, SiteButton } from "@/site/components";
import { GlowArch } from "@/site/components/GlowArch";

const Arrow = ({ className }) => {
  const { isRtl } = useLanguage();
  return <ArrowRight className={cn("h-4 w-4", isRtl && "rotate-180", className)} />;
};

/* ------------------------------------------------------------------ hero */

/* where each ecosystem node floats around the tooth, as % of the stage */
const NODE_POSITIONS = [
  "start-[2%] top-[22%] sm:start-[6%]",
  "end-[2%] top-[22%] sm:end-[6%]",
  "start-1/2 -translate-x-1/2 bottom-[-4%] rtl:translate-x-1/2",
];

function Hero() {
  const t = useT();

  return (
    <section className="relative overflow-hidden pb-10 pt-16 sm:pt-20 lg:pt-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <Reveal className="mx-auto flex max-w-5xl flex-col items-center text-center">
          <p className="s-kicker">{t(slogan)}</p>

          <h1 className="s-display mt-7">
            {t(hero.title)}
            <br />
            <span className="s-grad-text">{t(hero.highlight)}</span>
          </h1>

          <p className="s-lead mx-auto mt-7 max-w-2xl">{t(hero.description)}</p>

          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
            <SiteButton size="lg" to={hero.primary.to} rightIcon={<Arrow />}>
              {t(hero.primary.label)}
            </SiteButton>
            <SiteButton size="lg" variant="glass" to={hero.secondary.to}>
              {t(hero.secondary.label)}
            </SiteButton>
          </div>
        </Reveal>

        <Reveal delay={200} className="relative mx-auto mt-10 max-w-3xl sm:mt-14">
          <GlowArch className="s-float mx-auto max-w-[620px]" />

          {hero.nodes.map((node, index) => {
            const Icon = node.icon;
            return (
              <span
                key={node.key}
                className={cn(
                  "s-glass absolute flex items-center gap-2 rounded-full py-1.5 pe-4 ps-1.5 text-[13.5px] font-medium sm:text-[14.5px]",
                  NODE_POSITIONS[index]
                )}
              >
                <span className="s-icon-tile h-8 w-8 !rounded-full">
                  <Icon className="h-4 w-4" />
                </span>
                {t(node.label)}
              </span>
            );
          })}
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------- ecosystem */

function Ecosystem() {
  const t = useT();

  return (
    <Section>
      <SectionHeading
        eyebrow={ecosystem.eyebrow}
        title={ecosystem.title}
        highlight={ecosystem.highlight}
        description={ecosystem.description}
      />

      <div className="relative mt-16 grid gap-5 md:grid-cols-3">
        {ecosystem.pillars.map((pillar, index) => {
          const Icon = pillar.icon;
          return (
            <Reveal key={pillar.key} delay={index * 110}>
              <Link
                to={pillar.to}
                className="s-glass s-glass-hover s-focus group flex h-full flex-col rounded-[28px] p-8"
              >
                <span className="s-icon-tile relative h-[52px] w-[52px]">
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="mt-7 text-[22px]">{t(pillar.title)}</h3>
                <p className="s-muted mt-3 flex-1 text-[15.5px] leading-relaxed">{t(pillar.description)}</p>
                <span className="s-accent mt-7 inline-flex items-center gap-1.5 text-[15px] font-semibold transition-all group-hover:gap-2.5">
                  {t(pillar.cta)}
                  <Arrow />
                </span>
              </Link>
            </Reveal>
          );
        })}
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------ principles */

function Principles() {
  const t = useT();

  return (
    <Section>
      <SectionHeading eyebrow={principles.eyebrow} title={principles.title} highlight={principles.highlight} />

      <div className="mt-16 grid gap-5 md:grid-cols-3">
        {principles.items.map((item, index) => {
          const Icon = item.icon;
          const wide = item.size === "wide" || item.size === "full";
          return (
            <Reveal
              key={item.key}
              delay={(index % 3) * 90}
              className={cn(
                "s-glass s-glass-hover flex flex-col justify-between rounded-[28px] p-8",
                item.size === "wide" && "md:col-span-2",
                item.size === "full" && "md:col-span-3"
              )}
            >
              <span className="s-chip !h-11 !w-11 !justify-center !p-0">
                <Icon className="s-accent h-5 w-5" />
              </span>
              <div className={cn("mt-8", wide && "max-w-xl")}>
                <h3 className={cn(wide ? "text-[26px]" : "text-[20px]")}>{t(item.title)}</h3>
                <p className="s-muted mt-3 text-[15.5px] leading-relaxed">{t(item.description)}</p>
              </div>
            </Reveal>
          );
        })}
      </div>
    </Section>
  );
}

/* ---------------------------------------------------------------- origin */

function Origin() {
  const t = useT();

  return (
    <Section>
      <Reveal className="s-glass grid overflow-hidden rounded-[36px] lg:grid-cols-2">
        <div className="relative min-h-[280px] lg:min-h-[460px]">
          <img
            src={images.campus}
            alt={t({ en: "Alamein International University campus", ar: "حرم جامعة العلمين الدولية" })}
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
          <span className="s-glass absolute bottom-5 start-5 flex items-center gap-3 rounded-2xl py-2 pe-4 ps-2">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#fff] p-1.5">
              <img src={universityLogos.aiu} alt="" aria-hidden="true" className="h-full w-full object-contain" />
            </span>
            <span className="text-[14px] font-semibold leading-tight">
              {t({ en: "Alamein International University", ar: "جامعة العلمين الدولية" })}
              <span className="s-muted block text-[12.5px] font-normal">
                {t({ en: "Founding campus", ar: "الحرم المؤسس" })}
              </span>
            </span>
          </span>
        </div>

        <div className="flex flex-col justify-center p-8 sm:p-12 lg:p-16">
          <span className="s-kicker !text-[11px]">{t(origin.eyebrow)}</span>
          <h2 className="s-title mt-5">
            {t(origin.title)} <span className="s-grad-text">{t(origin.highlight)}</span>
          </h2>
          <p className="s-lead mt-6">{t(origin.description)}</p>
          <div className="mt-9">
            <SiteButton variant="glass" to={origin.cta.to} rightIcon={<Arrow />}>
              {t(origin.cta.label)}
            </SiteButton>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}

/* ---------------------------------------------------------------- teaser */

/**
 * "Something is coming." — dark in both themes, like the post it is lifted
 * from. The only place the site hints at what is being built next.
 */
function Teaser() {
  const t = useT();
  const instagram = socialLinks.find((item) => item.key === "instagram");

  return (
    <Section>
      <Reveal
        className="relative overflow-hidden rounded-[36px] border border-cyan-300/15 px-6 pb-4 pt-16 text-center text-[#eaf5ff] sm:px-12 lg:pt-20"
        style={{
          background:
            "radial-gradient(900px 420px at 50% 115%, rgba(40,200,220,0.35), transparent 60%), radial-gradient(600px 300px at 85% 0%, rgba(0,119,182,0.35), transparent 60%), linear-gradient(180deg, #041325 0%, #020912 100%)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08), 0 40px 90px -40px rgba(0, 60, 110, 0.7)",
        }}
      >
        <p className="text-[13px] font-medium uppercase tracking-[0.5em] text-[#9fb8cc] rtl:tracking-[0.05em]">
          {t(teaser.kicker)}
        </p>
        <h2 style={{ fontWeight: 300 }} className="mt-4 text-[clamp(2.6rem,7vw,5.6rem)] uppercase leading-none tracking-[0.18em] text-[#7fe9f0] [text-shadow:0_0_40px_rgba(60,220,230,0.45)] rtl:tracking-normal">
          {t(teaser.title)}
        </h2>
        <p className="mx-auto mt-7 max-w-xl text-[17px] leading-relaxed text-[#a9c1d4]">{t(teaser.description)}</p>

        {instagram ? (
          <a
            href={instagram.href}
            target="_blank"
            rel="noopener noreferrer"
            className="s-btn s-btn-md mt-9 border border-white/15 bg-white/10 text-white backdrop-blur-xl hover:bg-white/15"
          >
            <Instagram className="h-4 w-4" />
            {t(teaser.cta)}
            <span className="text-white/60">{instagram.handle}</span>
          </a>
        ) : null}

        <GlowArch tone="night" className="mx-auto mt-6 max-w-[520px]" />
      </Reveal>
    </Section>
  );
}

export default function HomePage() {
  return (
    <>
      <Hero />
      <Ecosystem />
      <Principles />
      <Origin />
      <Teaser />
      <CTABand title={closing.title} highlight={closing.highlight} description={closing.description} />
    </>
  );
}
