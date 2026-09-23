import { ArrowRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";
import { site } from "@/config/paths";
import { useLanguage, useT } from "@/site/i18n/LanguageContext";
import { Reveal } from "./Reveal";
import { SiteButton } from "./SiteButton";

const DEFAULT = {
  title: { en: "Ready to transform", ar: "جاهز لتطوير" },
  highlight: { en: "your practice?", ar: "عيادتك؟" },
  description: {
    en: "Join the dental schools and clinics running their whole day on Odenta — imaging, charting, supervision and billing in one place.",
    ar: "انضم إلى كليات وعيادات الأسنان التي تدير يومها بالكامل على أودنتا — التصوير والرسم البياني والإشراف والفوترة في مكان واحد.",
  },
  primary: { label: { en: "Book a demo", ar: "احجز عرضًا توضيحيًا" }, to: site.contact },
  secondary: { label: { en: "Try our AI", ar: "جرّب الذكاء الاصطناعي" }, to: site.tryAi },
};

/** The closing gradient band every marketing page ends on. */
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
    <section className={cn("relative overflow-hidden bg-od-gradient-deep py-20 lg:py-24", className)}>
      {/* soft orbs — pure decoration */}
      <div className="pointer-events-none absolute -right-24 -top-28 h-[420px] w-[420px] rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-32 -left-20 h-[380px] w-[380px] rounded-full bg-white/[0.07]" />

      <div className="od-container relative text-center">
        <Reveal className="mx-auto max-w-3xl">
          <span className="od-eyebrow border-white/25 bg-white/10 text-white">
            <Sparkles className="h-3.5 w-3.5" />
            Odenta
          </span>

          <h2 className="mt-6 text-[34px] font-extrabold leading-[1.15] text-white md:text-[44px]">
            {t(title)} <span className="text-accent-200">{t(highlight)}</span>
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-[17px] leading-relaxed text-white/80">
            {t(description)}
          </p>
        </Reveal>

        <Reveal delay={140} className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <SiteButton
            variant="inverted"
            to={primary.to}
            rightIcon={<ArrowRight className={cn("h-4 w-4", isRtl && "rotate-180")} />}
          >
            {t(primary.label)}
          </SiteButton>
          {secondary ? (
            <SiteButton variant="inverted-ghost" to={secondary.to}>
              {t(secondary.label)}
            </SiteButton>
          ) : null}
        </Reveal>
      </div>
    </section>
  );
}
