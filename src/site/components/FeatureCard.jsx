import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { useLanguage, useT } from "@/site/i18n/LanguageContext";
import { Reveal } from "./Reveal";
import { SiteButton } from "./SiteButton";

/**
 * The site's workhorse card: gradient icon tile, title, body, optional link.
 * `feature` is a content object — `{ icon, title, description, cta, to }`.
 */
export function FeatureCard({ feature, delay = 0, className }) {
  const t = useT();
  const { isRtl } = useLanguage();
  const Icon = feature.icon;

  return (
    <Reveal delay={delay} className={cn("group od-panel flex flex-col", className)}>
      {Icon ? (
        <span className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 transition duration-300 group-hover:bg-od-gradient group-hover:text-white group-hover:shadow-brand">
          <Icon className="h-6 w-6" strokeWidth={2.1} />
        </span>
      ) : null}

      <h3 className="text-xl font-extrabold text-brand-700">{t(feature.title)}</h3>
      <p className="mt-3 flex-1 text-[15px] leading-relaxed text-ink-muted">
        {t(feature.description)}
      </p>

      {feature.cta && feature.to ? (
        <SiteButton
          variant="link"
          to={feature.to}
          className="mt-5"
          rightIcon={<ArrowRight className={cn("h-4 w-4", isRtl && "rotate-180")} />}
        >
          {t(feature.cta)}
        </SiteButton>
      ) : null}
    </Reveal>
  );
}

/** Compact row used inside two-column "why it matters" lists. */
export function FeatureRow({ feature, delay = 0 }) {
  const t = useT();
  const Icon = feature.icon;

  return (
    <Reveal delay={delay} className="flex items-start gap-4">
      {Icon ? (
        <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-50 text-accent-600">
          <Icon className="h-5 w-5" strokeWidth={2.2} />
        </span>
      ) : null}
      <div>
        <h4 className="text-[16px] font-extrabold text-brand-700">{t(feature.title)}</h4>
        <p className="mt-1 text-[15px] leading-relaxed text-ink-muted">{t(feature.description)}</p>
      </div>
    </Reveal>
  );
}
