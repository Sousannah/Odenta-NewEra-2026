import { useMemo, useState } from "react";
import { CalendarPlus, GraduationCap, MessageCircle, Search } from "lucide-react";
import { site } from "@/config/paths";
import { useAsync } from "@/hooks";
import { siteService } from "@/services";
import { useT } from "@/site/i18n/LanguageContext";
import { CTABand, PageHero, Reveal, Section, SiteButton } from "@/site/components";
import {
  DirectoryCard,
  DirectoryEmpty,
  DirectorySkeleton,
  JoinCard,
  contactHref,
} from "@/site/components/Directory";

function UniversityCard({ university, delay }) {
  const t = useT();
  const departments = (university.departments ?? []).slice(0, 4).map((item) => item.label);

  return (
    <DirectoryCard
      delay={delay}
      cover={university.cover}
      logo={university.logo}
      name={university.name}
      place={university.city}
      badge={
        university.booking?.open
          ? { tone: "live", label: { en: "Clinic open", ar: "العيادة متاحة" } }
          : null
      }
      summary={university.summary}
      tags={departments}
      facts={[
        university.established ? { label: { en: "Established", ar: "التأسيس" }, value: university.established } : null,
        university.students ? { label: { en: "Students", ar: "الطلاب" }, value: university.students.toLocaleString() } : null,
        university.chairs ? { label: { en: "Chairs", ar: "الكراسي" }, value: university.chairs } : null,
      ].filter(Boolean)}
      actions={
        <>
          <SiteButton
            size="sm"
            to={contactHref(site.contact, "university", university.name?.en)}
            leftIcon={<MessageCircle className="h-4 w-4" />}
          >
            {t({ en: "Contact us", ar: "تواصل معنا" })}
          </SiteButton>
          {university.booking?.open ? (
            <SiteButton
              size="sm"
              variant="glass"
              to={`${site.book}?university=${encodeURIComponent(university.id)}`}
              leftIcon={<CalendarPlus className="h-4 w-4" />}
            >
              {t({ en: "Book a visit", ar: "احجز زيارة" })}
            </SiteButton>
          ) : null}
        </>
      }
    />
  );
}

export default function UniversitiesPage() {
  const t = useT();
  const [query, setQuery] = useState("");
  const { data: universities, loading, error } = useAsync(() => siteService.getUniversities(), [], []);

  const filtered = useMemo(() => {
    const list = universities ?? [];
    const needle = query.trim().toLowerCase();
    if (!needle) return list;
    return list.filter((item) =>
      [item.name?.en, item.name?.ar, item.shortName, item.city?.en, item.city?.ar]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(needle))
    );
  }, [universities, query]);

  return (
    <>
      <PageHero
        eyebrow={{ en: "Universities", ar: "الجامعات" }}
        eyebrowIcon={<GraduationCap className="h-3.5 w-3.5" />}
        title={{ en: "Where the next generation", ar: "حيث يتعلم الجيل القادم" }}
        highlight={{ en: "of dentists learns.", ar: "من أطباء الأسنان." }}
        description={{
          en: "The dental schools already teaching on Odenta — every case, every supervisor sign-off, every milestone, connected.",
          ar: "كليات طب الأسنان التي تُدرّس بالفعل على أودنتا — كل حالة، وكل اعتماد، وكل إنجاز، متصل.",
        }}
      >
        <Reveal delay={120} className="relative mx-auto mt-10 w-full max-w-md">
          <Search className="s-soft pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label={t({ en: "Search universities", ar: "ابحث عن جامعة" })}
            placeholder={t({ en: "Search by name or city", ar: "ابحث بالاسم أو المدينة" })}
            className="s-input s-glass !rounded-full ps-11"
          />
        </Reveal>
      </PageHero>

      <Section className="pt-4 lg:pt-6">
        {error ? (
          <DirectoryEmpty
            message={{
              en: "We couldn't load the universities just now. Please try again in a moment.",
              ar: "تعذر تحميل الجامعات الآن. يرجى المحاولة بعد قليل.",
            }}
          />
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {loading && !universities?.length ? (
                <DirectorySkeleton />
              ) : (
                filtered.map((university, index) => (
                  <UniversityCard key={university.id} university={university} delay={index * 90} />
                ))
              )}
              {!loading && !query ? (
                <JoinCard
                  delay={filtered.length * 90}
                  title={{ en: "Your university, next.", ar: "جامعتك، التالية." }}
                  description={{
                    en: "Bring your faculty into the ecosystem. We'll map your clinics and rotations with you.",
                    ar: "انضم بكليتك إلى المنظومة. سنرسم معك عياداتك ودوراتك التدريبية.",
                  }}
                  to={contactHref(site.contact, "university")}
                  cta={{ en: "Contact us", ar: "تواصل معنا" }}
                />
              ) : null}
            </div>

            {!loading && query && !filtered.length ? (
              <DirectoryEmpty
                message={{ en: "No university matches that search.", ar: "لا توجد جامعة مطابقة لهذا البحث." }}
                onReset={() => setQuery("")}
                resetLabel={{ en: "Clear search", ar: "مسح البحث" }}
              />
            ) : null}
          </>
        )}
      </Section>

      <CTABand
        title={{ en: "Teaching dentistry", ar: "تُدرّس طب الأسنان" }}
        highlight={{ en: "the modern way?", ar: "بالطريقة الحديثة؟" }}
        description={{
          en: "Tell us about your faculty — your clinics, your students, your supervisors — and we'll show you what Odenta looks like on your campus.",
          ar: "أخبرنا عن كليتك — عياداتك وطلابك ومشرفيك — وسنريك كيف تبدو أودنتا في حرمك الجامعي.",
        }}
      />
    </>
  );
}
