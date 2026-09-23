import { ArrowRight, Check, Play, Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";
import { site } from "@/config/paths";
import { useAsync } from "@/hooks";
import { siteService } from "@/services";
import { useLanguage, useT } from "@/site/i18n/LanguageContext";
import {
  aiSection,
  features,
  hero,
  rolesSection,
  testimonialsSection,
  trustSection,
  trustStats,
  workflow,
} from "@/site/content/home";
import {
  CTABand,
  FeatureCard,
  FeatureRow,
  Reveal,
  Section,
  SectionHeading,
  SiteButton,
  StatStrip,
} from "@/site/components";

/* --------------------------------------------------------------------- hero */

function Hero() {
  const t = useT();
  const { isRtl } = useLanguage();

  return (
    <section className="relative overflow-hidden bg-white bg-od-radial">
      <div className="od-container grid items-center gap-14 py-16 lg:grid-cols-2 lg:gap-8 lg:py-24">
        <Reveal className="max-w-xl">
          <span className="od-eyebrow">
            <Sparkles className="h-3.5 w-3.5" />
            {t(hero.eyebrow)}
          </span>

          <h1 className="mt-6 text-[40px] font-extrabold leading-[1.08] tracking-tight text-brand-700 md:text-[56px]">
            {t(hero.title)} <span className="od-gradient-text">{t(hero.highlight)}</span>
          </h1>

          <p className="mt-6 text-[17px] leading-relaxed text-ink-muted">{t(hero.description)}</p>

          <div className="mt-9 flex flex-col gap-4 sm:flex-row">
            <SiteButton
              to={hero.primary.to}
              rightIcon={<ArrowRight className={cn("h-4 w-4", isRtl && "rotate-180")} />}
            >
              {t(hero.primary.label)}
            </SiteButton>
            <SiteButton variant="ghost" to={hero.secondary.to} leftIcon={<Play className="h-4 w-4" />}>
              {t(hero.secondary.label)}
            </SiteButton>
          </div>
        </Reveal>

        <Reveal delay={160} className="relative mx-auto w-full max-w-[540px]">
          {/* decorative rings behind the portrait */}
          <div className="pointer-events-none absolute -inset-6 rounded-full bg-od-gradient opacity-[0.07] blur-2xl" />
          <div className="pointer-events-none absolute -end-6 -top-6 h-24 w-24 rounded-full border-[10px] border-accent-100" />
          <div className="pointer-events-none absolute -bottom-8 -start-6 h-32 w-32 rounded-full bg-brand-50" />

          <div className="relative overflow-hidden rounded-[36px] border border-white shadow-lift">
            <img
              src={hero.image}
              alt={t(hero.imageAlt)}
              className="aspect-[4/5] w-full object-cover"
              loading="eager"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brand-900/35 via-transparent to-transparent" />
          </div>

          {/* floating accuracy chip */}
          <div className="absolute -bottom-6 start-4 flex items-center gap-3 rounded-2xl border border-slate-100 bg-white/95 px-5 py-4 shadow-pop backdrop-blur animate-float">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-od-gradient text-white">
              <Sparkles className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-[22px] font-extrabold leading-none od-gradient-text">
                {hero.badge.value}
              </span>
              <span className="mt-1 block text-[12px] font-semibold text-ink-muted">
                {t(hero.badge.label)}
              </span>
            </span>
          </div>
        </Reveal>
      </div>

      <div className="od-container pb-16 lg:pb-20">
        <StatStrip stats={trustStats} />
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------- AI panel */

function AiSection() {
  const t = useT();
  const { isRtl } = useLanguage();

  return (
    <Section tone="plain">
      <div className="grid items-center gap-14 lg:grid-cols-2">
        <div>
          <SectionHeading
            align="start"
            eyebrow={aiSection.eyebrow}
            eyebrowIcon={<Sparkles className="h-3.5 w-3.5" />}
            title={aiSection.title}
            highlight={aiSection.highlight}
            description={aiSection.description}
          />

          <div className="mt-10 flex flex-col gap-7">
            {aiSection.points.map((point, index) => (
              <FeatureRow key={point.key} feature={point} delay={index * 90} />
            ))}
          </div>
        </div>

        <Reveal delay={120} className="relative">
          <div className="rounded-[32px] border border-accent-200/70 bg-white p-4 shadow-lift">
            <div className="overflow-hidden rounded-3xl bg-ink">
              <img
                src={aiSection.image}
                alt={t(aiSection.imageAlt)}
                className="aspect-[16/11] w-full object-cover opacity-95"
                loading="lazy"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 px-3 pb-1 pt-5">
              <span className="flex items-center gap-2 text-[13px] font-bold text-ink-muted">
                <span className="h-2 w-2 rounded-full bg-success" />
                odenta-vision-3.1
              </span>
              <SiteButton
                variant="link"
                to={site.tryAi}
                rightIcon={<ArrowRight className={cn("h-4 w-4", isRtl && "rotate-180")} />}
              >
                {t({ en: "Run the demo", ar: "شغّل العرض" })}
              </SiteButton>
            </div>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}

/* ---------------------------------------------------------------- workflow */

function WorkflowSection() {
  const t = useT();
  const { isRtl } = useLanguage();

  return (
    <Section tone="soft">
      <SectionHeading
        eyebrow={workflow.eyebrow}
        title={workflow.title}
        highlight={workflow.highlight}
        description={workflow.description}
      />

      <div className="relative mt-16">
        {/* spine down the middle of the timeline */}
        <div className="pointer-events-none absolute inset-y-0 start-1/2 hidden w-0.5 -translate-x-1/2 bg-gradient-to-b from-brand-600 via-accent-500 to-transparent lg:block" />

        <div className="flex flex-col gap-16 lg:gap-24">
          {workflow.steps.map((step, index) => {
            const Icon = step.icon;
            const flipped = index % 2 === 1;

            return (
              <Reveal
                key={step.key}
                className={cn(
                  "grid items-center gap-10 lg:grid-cols-2 lg:gap-16",
                  flipped && "lg:[&>*:first-child]:order-2"
                )}
              >
                <div>
                  <div className="flex items-center gap-4">
                    <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-od-gradient text-[24px] font-extrabold text-white shadow-brand">
                      {step.number}
                    </span>
                    <h3 className="text-2xl font-extrabold text-brand-700">{t(step.title)}</h3>
                  </div>

                  <div className="mt-6 rounded-3xl border border-slate-200/80 bg-white p-7 shadow-card">
                    <ul className="flex flex-col gap-4">
                      {step.points.map((point, pointIndex) => (
                        <li key={pointIndex} className="flex items-start gap-3">
                          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-50 text-accent-600">
                            <Check className="h-3.5 w-3.5" strokeWidth={3} />
                          </span>
                          <span className="text-[15px] leading-relaxed text-ink-muted">{t(point)}</span>
                        </li>
                      ))}
                    </ul>

                    {step.cta ? (
                      <SiteButton
                        variant="link"
                        to={step.cta.to}
                        className="mt-6"
                        rightIcon={<ArrowRight className={cn("h-4 w-4", isRtl && "rotate-180")} />}
                      >
                        {t(step.cta.label)}
                      </SiteButton>
                    ) : null}
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute -inset-1 rounded-[32px] bg-od-gradient opacity-20 blur-lg" />
                  <div className="relative overflow-hidden rounded-[28px] border border-white bg-white shadow-lift">
                    <img
                      src={step.image}
                      alt={t(step.title)}
                      className="aspect-[16/10] w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <span className="absolute -top-5 end-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-accent-600 shadow-pop">
                    <Icon className="h-5 w-5" strokeWidth={2.2} />
                  </span>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------- roles */

function RolesSection() {
  const t = useT();
  const { isRtl } = useLanguage();

  return (
    <Section tone="plain">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <SectionHeading
            align="start"
            eyebrow={rolesSection.eyebrow}
            title={rolesSection.title}
            highlight={rolesSection.highlight}
            description={rolesSection.description}
          />
          <Reveal delay={140} className="mt-8">
            <SiteButton
              to={rolesSection.cta.to}
              rightIcon={<ArrowRight className={cn("h-4 w-4", isRtl && "rotate-180")} />}
            >
              {t(rolesSection.cta.label)}
            </SiteButton>
          </Reveal>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-7">
          {rolesSection.roles.map((role, index) => (
            <Reveal
              key={role.key}
              delay={index * 60}
              className="group rounded-2xl border border-slate-200/80 bg-white p-5 transition duration-300 hover:-translate-y-1 hover:border-accent-300 hover:shadow-lift"
            >
              <span className="block text-[15px] font-extrabold text-brand-700 transition group-hover:text-accent-600">
                {t(role.label)}
              </span>
              <span className="mt-1.5 block text-[13.5px] leading-relaxed text-ink-muted">
                {t(role.description)}
              </span>
            </Reveal>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------ testimonials */

function TestimonialsSection() {
  const t = useT();
  const { data: testimonials } = useAsync(() => siteService.getTestimonials(), [], []);

  if (!testimonials.length) return null;

  return (
    <Section tone="canvas">
      <SectionHeading
        eyebrow={testimonialsSection.eyebrow}
        title={testimonialsSection.title}
        highlight={testimonialsSection.highlight}
      />

      <div className="mt-14 grid gap-6 lg:grid-cols-3">
        {testimonials.map((item, index) => (
          <Reveal
            key={item.id}
            delay={index * 100}
            className="flex flex-col rounded-3xl border border-slate-200/80 bg-white p-8 shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-lift"
          >
            <span aria-hidden="true" className="text-[44px] font-black leading-none od-gradient-text">
              &ldquo;
            </span>
            <p className="mt-2 flex-1 text-[15px] leading-relaxed text-ink-muted">{t(item.quote)}</p>

            <div className="mt-7 flex items-center gap-3 border-t border-slate-100 pt-5">
              <img
                src={item.avatar}
                alt=""
                aria-hidden="true"
                className="h-11 w-11 rounded-full object-cover ring-2 ring-accent-100"
                loading="lazy"
              />
              <span>
                <span className="block text-[14px] font-extrabold text-brand-700">{item.name}</span>
                <span className="block text-[12.5px] text-ink-soft">{t(item.role)}</span>
              </span>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

/* -------------------------------------------------------------------- page */

export default function HomePage() {
  return (
    <>
      <Hero />

      <Section tone="plain">
        <SectionHeading
          eyebrow={{ en: "The platform", ar: "المنصة" }}
          title={{ en: "Comprehensive dental", ar: "إدارة شاملة" }}
          highlight={{ en: "management", ar: "لطب الأسنان" }}
          description={{
            en: "Everything a dental school and a dental clinic run on, in one place — and every module reads from the same patient record.",
            ar: "كل ما تحتاجه كليات وعيادات الأسنان في مكان واحد — وكل وحدة تقرأ من نفس سجل المريض.",
          }}
        />

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <FeatureCard key={feature.key} feature={feature} delay={(index % 3) * 90} />
          ))}
        </div>
      </Section>

      <AiSection />
      <WorkflowSection />
      <RolesSection />

      <Section tone="plain">
        <SectionHeading
          eyebrow={trustSection.eyebrow}
          title={trustSection.title}
          highlight={trustSection.highlight}
        />
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {trustSection.points.map((point, index) => (
            <FeatureCard key={point.key} feature={point} delay={index * 90} />
          ))}
        </div>
      </Section>

      <TestimonialsSection />
      <CTABand />
    </>
  );
}
