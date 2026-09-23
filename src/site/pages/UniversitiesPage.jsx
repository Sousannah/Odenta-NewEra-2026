import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, GraduationCap, MapPin, Search, Users } from "lucide-react";
import { cn } from "@/lib/cn";
import { site } from "@/config/paths";
import { useAsync } from "@/hooks";
import { siteService } from "@/services";
import { useLanguage, useT } from "@/site/i18n/LanguageContext";
import {
  CTABand,
  PageHero,
  Reveal,
  Section,
  SectionHeading,
  SiteButton,
  StatStrip,
} from "@/site/components";

function UniversityCard({ university, delay }) {
  const t = useT();
  const { isRtl } = useLanguage();

  return (
    <Reveal
      delay={delay}
      className="group flex flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-card transition duration-300 hover:-translate-y-1 hover:border-accent-300 hover:shadow-lift"
    >
      <div className="relative h-44 overflow-hidden">
        <img
          src={university.cover}
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-900/70 to-transparent" />
        <span className="absolute bottom-4 start-5 flex items-center gap-2 text-[12.5px] font-bold text-white">
          <MapPin className="h-3.5 w-3.5" />
          {t(university.city)}
        </span>
        <span
          className={cn(
            "absolute top-4 end-5 rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide",
            university.booking.open ? "bg-success text-white" : "bg-white/90 text-ink-muted"
          )}
        >
          {university.booking.open
            ? t({ en: "Enrolling", ar: "التسجيل مفتوح" })
            : t({ en: "Waitlist", ar: "قائمة انتظار" })}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-7">
        <div className="flex items-start gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-100 bg-white p-1.5">
            <img src={university.logo} alt="" aria-hidden="true" className="h-full w-full object-contain" />
          </span>
          <div className="min-w-0">
            <h3 className="text-[19px] font-extrabold leading-snug text-brand-700">
              {t(university.name)}
            </h3>
            <p className="mt-1 text-[12.5px] font-semibold text-ink-soft">
              {t({ en: "Est.", ar: "تأسست" })} {university.established} · {t(university.accreditation)}
            </p>
          </div>
        </div>

        <p className="mt-5 flex-1 text-[14.5px] leading-relaxed text-ink-muted">
          {t(university.summary)}
        </p>

        <dl className="mt-6 grid grid-cols-3 gap-3 border-t border-slate-100 pt-5 text-center">
          {[
            { value: university.students, label: { en: "Students", ar: "طالب" } },
            { value: university.supervisors, label: { en: "Supervisors", ar: "مشرف" } },
            { value: university.chairs, label: { en: "Chairs", ar: "كرسي" } },
          ].map((stat, index) => (
            <div key={index}>
              <dt className="sr-only">{t(stat.label)}</dt>
              <dd className="text-[19px] font-extrabold od-gradient-text">{stat.value}</dd>
              <span className="text-[11.5px] font-semibold text-ink-soft">{t(stat.label)}</span>
            </div>
          ))}
        </dl>

        <Link
          to={site.university(university.slug)}
          className="od-focus mt-6 inline-flex items-center gap-1.5 text-[14px] font-bold text-accent-600 transition hover:gap-2.5 hover:text-brand-700"
        >
          {t({ en: "View programme", ar: "عرض البرنامج" })}
          <ArrowRight className={cn("h-4 w-4", isRtl && "rotate-180")} />
        </Link>
      </div>
    </Reveal>
  );
}

export default function UniversitiesPage() {
  const t = useT();
  const [query, setQuery] = useState("");
  const { data: universities, loading } = useAsync(() => siteService.getUniversities(), [], []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return universities;
    return universities.filter((item) =>
      [item.name?.en, item.name?.ar, item.shortName, item.city?.en]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(needle))
    );
  }, [universities, query]);

  const totals = useMemo(
    () => [
      {
        key: "partners",
        value: String(universities.length),
        label: { en: "Partner universities", ar: "جامعة شريكة" },
      },
      {
        key: "students",
        value: universities.reduce((sum, item) => sum + item.students, 0).toLocaleString(),
        label: { en: "Students enrolled", ar: "طالب مسجل" },
      },
      {
        key: "supervisors",
        value: String(universities.reduce((sum, item) => sum + item.supervisors, 0)),
        label: { en: "Supervisors", ar: "مشرف" },
      },
      {
        key: "cases",
        value: `${Math.round(universities.reduce((sum, item) => sum + item.casesReviewed, 0) / 1000)}k`,
        label: { en: "Cases reviewed", ar: "حالة تمت مراجعتها" },
      },
    ],
    [universities]
  );

  return (
    <>
      <PageHero
        eyebrow={{ en: "For universities", ar: "للجامعات" }}
        eyebrowIcon={<GraduationCap className="h-3.5 w-3.5" />}
        title={{ en: "Dental schools running on", ar: "كليات أسنان تعمل على" }}
        highlight={{ en: "Odenta", ar: "أودنتا" }}
        description={{
          en: "Clinical rotations, case allocation, supervisor sign-off and competency evidence — for the campuses that have replaced the paper logbook.",
          ar: "التدريب السريري وتوزيع الحالات واعتماد المشرفين وأدلة الكفاءة — للجامعات التي استغنت عن السجل الورقي.",
        }}
        actions={
          <SiteButton to={site.contact}>
            {t({ en: "Bring Odenta to your campus", ar: "أحضر أودنتا إلى جامعتك" })}
          </SiteButton>
        }
      />

      {universities.length ? (
        <div className="od-container -mt-4 pb-4">
          <StatStrip stats={totals} />
        </div>
      ) : null}

      <Section tone="canvas">
        <div className="flex flex-col items-center gap-6">
          <SectionHeading
            eyebrow={{ en: "Partners", ar: "الشركاء" }}
            title={{ en: "Find a", ar: "ابحث عن" }}
            highlight={{ en: "partner campus", ar: "جامعة شريكة" }}
            description={{
              en: "Each campus publishes its departments, chair count and intake dates. Prospective patients can book directly with the student clinic.",
              ar: "تنشر كل جامعة أقسامها وعدد كراسيها ومواعيد القبول. يمكن للمرضى الحجز مباشرة مع عيادة الطلاب.",
            }}
          />

          <Reveal delay={120} className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t({ en: "Search universities or cities", ar: "ابحث عن جامعة أو مدينة" })}
              className="h-12 w-full rounded-full border border-slate-200 bg-white ps-11 pe-5 text-sm text-ink placeholder:text-ink-faint transition focus:border-accent-400 focus:outline-none focus:ring-4 focus:ring-accent-500/15"
            />
          </Reveal>
        </div>

        <div className="mt-14 grid gap-7 md:grid-cols-2 lg:grid-cols-3">
          {loading
            ? Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="h-[460px] animate-pulse rounded-3xl border border-slate-200/80 bg-white"
                />
              ))
            : filtered.map((university, index) => (
                <UniversityCard key={university.id} university={university} delay={index * 90} />
              ))}
        </div>

        {!loading && !filtered.length ? (
          <div className="mt-14 flex flex-col items-center gap-4 rounded-3xl border border-dashed border-slate-300 bg-white px-8 py-16 text-center">
            <Users className="h-8 w-8 text-ink-faint" />
            <p className="text-[15px] font-semibold text-ink-muted">
              {t({ en: "No campus matches that search.", ar: "لا توجد جامعة مطابقة لهذا البحث." })}
            </p>
            <SiteButton variant="ghost" size="sm" onClick={() => setQuery("")}>
              {t({ en: "Clear search", ar: "مسح البحث" })}
            </SiteButton>
          </div>
        ) : null}
      </Section>

      <CTABand
        title={{ en: "Bring Odenta to", ar: "أحضر أودنتا إلى" }}
        highlight={{ en: "your campus", ar: "جامعتك" }}
        description={{
          en: "Tell us how many chairs and students you run, and we will map the rotation before the first demo call.",
          ar: "أخبرنا بعدد الكراسي والطلاب لديك، وسنرسم خريطة التدريب قبل أول مكالمة عرض.",
        }}
        primary={{ label: { en: "Talk to us", ar: "تحدث إلينا" }, to: site.contact }}
        secondary={{ label: { en: "See services", ar: "شاهد الخدمات" }, to: site.services }}
      />
    </>
  );
}
