import { useState } from "react";
import { Check, ChevronDown, Tag } from "lucide-react";
import { cn } from "@/lib/cn";
import { useT } from "@/site/i18n/LanguageContext";
import { faqs, hero, included, plans } from "@/site/content/pricing";
import {
  CTABand,
  PageHero,
  Reveal,
  Section,
  SectionHeading,
  SiteButton,
} from "@/site/components";

function PlanCard({ plan, delay }) {
  const t = useT();

  return (
    <Reveal
      delay={delay}
      className={cn(
        "relative flex flex-col rounded-3xl border p-8 transition duration-300",
        plan.featured
          ? "border-transparent bg-od-gradient-deep text-white shadow-lift lg:-my-4 lg:py-12"
          : "border-slate-200/80 bg-white shadow-card hover:-translate-y-1 hover:border-accent-300 hover:shadow-lift"
      )}
    >
      {plan.badge ? (
        <span className="absolute -top-3 start-8 rounded-full bg-white px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-wide text-brand-700 shadow-card">
          {t(plan.badge)}
        </span>
      ) : null}

      <h3
        className={cn(
          "text-[15px] font-extrabold uppercase tracking-[0.12em]",
          plan.featured ? "text-accent-200" : "text-accent-600"
        )}
      >
        {t(plan.name)}
      </h3>

      <p className="mt-5 flex items-baseline gap-2">
        <span
          className={cn(
            "text-[42px] font-extrabold leading-none",
            plan.featured ? "text-white" : "od-gradient-text"
          )}
        >
          {t(plan.price)}
        </span>
        <span className={cn("text-[13px] font-semibold", plan.featured ? "text-white/70" : "text-ink-soft")}>
          {t(plan.unit)}
        </span>
      </p>

      <p className={cn("mt-4 text-[14.5px]", plan.featured ? "text-white/80" : "text-ink-muted")}>
        {t(plan.description)}
      </p>

      <ul className="mt-7 flex flex-1 flex-col gap-3.5">
        {plan.features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            <span
              className={cn(
                "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                plan.featured ? "bg-white/20 text-white" : "bg-accent-50 text-accent-600"
              )}
            >
              <Check className="h-3 w-3" strokeWidth={3.5} />
            </span>
            <span
              className={cn("text-[14.5px] leading-snug", plan.featured ? "text-white/90" : "text-ink-muted")}
            >
              {t(feature)}
            </span>
          </li>
        ))}
      </ul>

      <SiteButton
        to={plan.cta.to}
        variant={plan.featured ? "inverted" : "ghost"}
        className="mt-8 w-full"
      >
        {t(plan.cta.label)}
      </SiteButton>
    </Reveal>
  );
}

function Faq({ item, index }) {
  const t = useT();
  const [open, setOpen] = useState(index === 0);

  return (
    <Reveal
      delay={index * 70}
      className={cn(
        "rounded-2xl border bg-white transition",
        open ? "border-accent-300 shadow-card" : "border-slate-200/80"
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="od-focus flex w-full items-center justify-between gap-4 px-6 py-5 text-start"
      >
        <span className="text-[15.5px] font-extrabold text-brand-700">{t(item.question)}</span>
        <ChevronDown
          className={cn(
            "h-5 w-5 shrink-0 text-accent-600 transition-transform duration-300",
            open && "rotate-180"
          )}
        />
      </button>

      <div
        className={cn(
          "grid transition-all duration-300",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
          <p className="px-6 pb-6 text-[15px] leading-relaxed text-ink-muted">{t(item.answer)}</p>
        </div>
      </div>
    </Reveal>
  );
}

export default function PricingPage() {
  const t = useT();

  return (
    <>
      <PageHero
        eyebrow={hero.eyebrow}
        eyebrowIcon={<Tag className="h-3.5 w-3.5" />}
        title={hero.title}
        highlight={hero.highlight}
        description={hero.description}
      />

      <Section tone="plain" className="pt-0">
        <div className="grid items-start gap-7 lg:grid-cols-3">
          {plans.map((plan, index) => (
            <PlanCard key={plan.key} plan={plan} delay={index * 100} />
          ))}
        </div>

        <Reveal
          delay={200}
          className="mt-16 rounded-3xl border border-slate-200/80 bg-od-gradient-soft p-8 shadow-card"
        >
          <h3 className="text-[20px] font-extrabold text-brand-700">
            {t(included.title)} <span className="od-gradient-text">{t(included.highlight)}</span>
          </h3>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {included.items.map((item, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-od-gradient text-white">
                  <Check className="h-3 w-3" strokeWidth={3.5} />
                </span>
                <span className="text-[14.5px] text-ink-muted">{t(item)}</span>
              </li>
            ))}
          </ul>
        </Reveal>
      </Section>

      <Section tone="canvas">
        <SectionHeading
          eyebrow={{ en: "Questions", ar: "أسئلة" }}
          title={{ en: "What people", ar: "ما يسأل عنه" }}
          highlight={{ en: "always ask", ar: "الجميع" }}
        />
        <div className="mx-auto mt-12 flex max-w-3xl flex-col gap-4">
          {faqs.map((item, index) => (
            <Faq key={item.key} item={item} index={index} />
          ))}
        </div>
      </Section>

      <CTABand />
    </>
  );
}
