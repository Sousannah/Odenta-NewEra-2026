import { Link } from "react-router-dom";
import { ArrowRight, MapPin, Plus, SearchX } from "lucide-react";
import { cn } from "@/lib/cn";
import { useLanguage, useT } from "@/site/i18n/LanguageContext";
import { Reveal } from "./Reveal";
import { SiteButton } from "./SiteButton";

/**
 * Images a directory entry must not show publicly.
 *
 * Some seeded profiles borrow the product's own screenshots as a cover (one
 * of them shows the AI panel) or an Odenta logo as a stand-in for the
 * school's crest. Neither belongs on a public card, so they fall back to the
 * brand gradient / no crest until the profile gets real artwork.
 */
const PLACEHOLDER_IMAGE = /\/imgs\/(dash\d*|ai(_\d+)?|analytics|chart|x-?ray(-\d+)?|odenta-logo\d*)\.(jpe?g|png)$/i;
const publicImage = (src) => (src && !PLACEHOLDER_IMAGE.test(src) ? src : null);

/**
 * The directory card shared by the Universities and Clinics pages: a cover,
 * an identity row, a few facts, and the actions. Glass throughout, with the
 * cover image doing the colour work.
 */
export function DirectoryCard({ cover: rawCover, logo: rawLogo, name, place, badge, summary, tags = [], facts = [], actions, delay = 0 }) {
  const t = useT();
  const cover = publicImage(rawCover);
  const logo = publicImage(rawLogo);

  return (
    <Reveal delay={delay} className="s-glass s-glass-hover group flex flex-col overflow-hidden rounded-[30px]">
      <div className="relative h-48 overflow-hidden">
        {cover ? (
          <img
            src={cover}
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="h-full w-full object-cover transition duration-[1200ms] ease-out group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full" style={{ background: "var(--s-grad)" }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />

        {place ? (
          <span className="absolute bottom-4 start-5 flex items-center gap-1.5 text-[13px] font-medium text-white">
            <MapPin className="h-3.5 w-3.5" />
            {t(place)}
          </span>
        ) : null}
        {badge ? (
          <span
            className={cn(
              "absolute end-4 top-4 rounded-full px-3 py-1 text-[12px] font-semibold backdrop-blur-xl",
              badge.tone === "live" ? "bg-emerald-500/85 text-white" : "bg-white/75 text-slate-700"
            )}
          >
            {t(badge.label)}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-7">
        <div className="flex items-center gap-4">
          {logo ? (
            <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#fff] p-1.5 shadow-sm ring-1 ring-black/5">
              <img src={logo} alt="" aria-hidden="true" className="h-full w-full object-contain" />
            </span>
          ) : null}
          <h3 className="text-[20px] leading-snug">{t(name)}</h3>
        </div>

        {summary ? <p className="s-muted mt-5 text-[15px] leading-relaxed">{t(summary)}</p> : null}

        {tags.length ? (
          <ul className="mt-5 flex flex-wrap gap-2">
            {tags.map((tag, index) => (
              <li key={index} className="s-chip !py-1 !text-[12px]">
                {t(tag)}
              </li>
            ))}
          </ul>
        ) : null}

        <div className="flex-1" />

        {facts.length ? (
          <dl className="s-hairline mt-6 grid grid-cols-3 gap-3 border-t pt-5">
            {facts.map((fact, index) => (
              <div key={index}>
                <dt className="s-soft text-[12px]">{t(fact.label)}</dt>
                <dd className="mt-0.5 text-[17px] font-semibold tabular-nums">{fact.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}

        {actions ? <div className="mt-6 flex flex-wrap items-center gap-2.5">{actions}</div> : null}
      </div>
    </Reveal>
  );
}

/** The "yours could be next" tile that closes every directory grid. */
export function JoinCard({ title, description, to, cta, delay = 0 }) {
  const t = useT();
  const { isRtl } = useLanguage();

  return (
    <Reveal delay={delay} className="h-full">
      <Link
        to={to}
        className="s-glass s-glass-hover s-focus group flex h-full min-h-[420px] flex-col items-center justify-center rounded-[30px] border-dashed p-10 text-center"
      >
        <span className="s-icon-tile h-16 w-16 !rounded-full transition duration-500 group-hover:rotate-90">
          <Plus className="h-7 w-7" />
        </span>
        <h3 className="mt-7 text-[22px]">{t(title)}</h3>
        <p className="s-muted mx-auto mt-3 max-w-xs text-[15px] leading-relaxed">{t(description)}</p>
        <span className="s-accent mt-7 inline-flex items-center gap-1.5 text-[15px] font-semibold transition-all group-hover:gap-2.5">
          {t(cta)}
          <ArrowRight className={cn("h-4 w-4", isRtl && "rotate-180")} />
        </span>
      </Link>
    </Reveal>
  );
}

export function DirectorySkeleton({ count = 3 }) {
  return Array.from({ length: count }).map((_, index) => (
    <div key={index} className="s-glass h-[460px] animate-pulse rounded-[30px]" />
  ));
}

export function DirectoryEmpty({ message, onReset, resetLabel }) {
  const t = useT();
  return (
    <div className="s-glass mt-10 flex flex-col items-center gap-4 rounded-[30px] px-8 py-16 text-center">
      <SearchX className="s-soft h-8 w-8" />
      <p className="s-muted text-[15px]">{t(message)}</p>
      {onReset ? (
        <SiteButton variant="glass" size="sm" onClick={onReset}>
          {t(resetLabel)}
        </SiteButton>
      ) : null}
    </div>
  );
}

/** `/contact?topic=…&organisation=…` — the contact form opens pre-filled. */
export const contactHref = (base, topic, organisation) => {
  const params = new URLSearchParams({ topic });
  if (organisation) params.set("organisation", organisation);
  return `${base}?${params.toString()}`;
};
