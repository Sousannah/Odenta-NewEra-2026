import { ArrowRight, Check, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/cn";
import { site } from "@/config/paths";
import { useLanguage, useT } from "@/site/i18n/LanguageContext";
import { assurance, audiences, hero, modules } from "@/site/content/services";
import {
  CTABand,
  FeatureCard,
  PageHero,
  Reveal,
  Section,
  SectionHeading,
  SiteButton,
} from "@/site/components";

/** "For universities" / "For clinics" — image on one side, claims on the other. */
function AudienceBlock({ audience, flipped }) {
  const t = useT();
  const { isRtl } = useLanguage();
  const Icon = audience.icon;

  return (
    <Reveal
      className={cn(
        "grid items-center gap-10 lg:grid-cols-2 lg:gap-16",
        flipped && "lg:[&>*:first-child]:order-2"
      )}
    >
      <div>
        <span className="od-eyebrow">
          <Icon className="h-3.5 w-3.5" />
          {t(audience.eyebrow)}
        </span>

        <h3 className="mt-5 text-[28px] font-extrabold leading-tight text-brand-700 md:text-[34px]">
          {t(audience.title)}
        </h3>
        <p className="mt-4 text-[16px] leading-relaxed text-ink-muted">{t(audience.description)}</p>

        <ul className="mt-7 flex flex-col gap-3.5">
          {audience.points.map((point, index) => (
            <li key={index} className="flex items-start gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-50 text-accent-600">
                <Check className="h-3.5 w-3.5" strokeWidth={3} />
              </span>
              <span className="text-[15px] text-ink-muted">{t(point)}</span>
            </li>
          ))}
        </ul>

        <SiteButton
          to={audience.to}
          className="mt-8"
          rightIcon={<ArrowRight className={cn("h-4 w-4", isRtl && "rotate-180")} />}
        >
          {t(audience.cta)}
        </SiteButton>
      </div>

      <div className="relative">
        <div className="absolute -inset-1 rounded-[32px] bg-od-gradient opacity-20 blur-lg" />
        <div className="relative overflow-hidden rounded-[28px] border border-white bg-white shadow-lift">
          <img
            src={audience.image}
            alt={t(audience.title)}
            className="aspect-[16/10] w-full object-cover"
            loading="lazy"
          />
        </div>
      </div>
    </Reveal>
  );
}

export default function ServicesPage() {
  const t = useT();
  const { isRtl } = useLanguage();

  return (
    <>
      <PageHero
        eyebrow={hero.eyebrow}
        eyebrowIcon={<LayoutGrid className="h-3.5 w-3.5" />}
        title={hero.title}
        highlight={hero.highlight}
        description={hero.description}
        actions={
          <>
            <SiteButton
              to={site.contact}
              rightIcon={<ArrowRight className={cn("h-4 w-4", isRtl && "rotate-180")} />}
            >
              {t({ en: "Book a demo", ar: "احجز عرضًا توضيحيًا" })}
            </SiteButton>
            <SiteButton variant="ghost" to={site.pricing}>
              {t({ en: "See pricing", ar: "شاهد الأسعار" })}
            </SiteButton>
          </>
        }
      />

      <Section tone="plain" className="pt-0">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {modules.map((module, index) => (
            <FeatureCard key={module.key} feature={module} delay={(index % 3) * 90} />
          ))}
        </div>
      </Section>

      <Section tone="soft">
        <SectionHeading
          eyebrow={{ en: "Two programmes", ar: "برنامجان" }}
          title={{ en: "Shaped around", ar: "مصمم حول" }}
          highlight={{ en: "how you work", ar: "طريقة عملك" }}
          description={{
            en: "The modules are the same. What changes is who is in the chair beside the patient, and what the platform asks of them.",
            ar: "الوحدات نفسها. ما يتغير هو من يجلس بجوار المريض وما تطلبه المنصة منه.",
          }}
        />

        <div className="mt-16 flex flex-col gap-20 lg:gap-24">
          {audiences.map((audience, index) => (
            <AudienceBlock key={audience.key} audience={audience} flipped={index % 2 === 1} />
          ))}
        </div>
      </Section>

      <Section tone="plain">
        <SectionHeading
          eyebrow={{ en: "Assurance", ar: "الضمانات" }}
          title={{ en: "What you can", ar: "ما يمكنك" }}
          highlight={{ en: "count on", ar: "الاعتماد عليه" }}
        />
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {assurance.map((item, index) => (
            <FeatureCard key={item.key} feature={item} delay={index * 90} />
          ))}
        </div>
      </Section>

      <CTABand />
    </>
  );
}
