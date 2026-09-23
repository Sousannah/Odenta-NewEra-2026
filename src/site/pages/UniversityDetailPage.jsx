import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarCheck,
  ChevronRight,
  GraduationCap,
  MapPin,
  Stethoscope,
  Users,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { site } from "@/config/paths";
import { useAsync } from "@/hooks";
import { siteService } from "@/services";
import { useLanguage, useT } from "@/site/i18n/LanguageContext";
import { CTABand, Reveal, Section, SiteButton, StatStrip } from "@/site/components";

export default function UniversityDetailPage() {
  const { universityId } = useParams();
  const t = useT();
  const { isRtl } = useLanguage();
  const { data: university, loading, error } = useAsync(
    () => siteService.getUniversity(universityId),
    [universityId]
  );

  if (loading) {
    return (
      <div className="od-container py-24">
        <div className="h-[420px] animate-pulse rounded-3xl border border-slate-200 bg-white" />
      </div>
    );
  }

  if (error || !university) {
    return (
      <div className="od-container flex flex-col items-center gap-5 py-28 text-center">
        <GraduationCap className="h-10 w-10 text-ink-faint" />
        <h1 className="text-2xl font-extrabold text-brand-700">
          {t({ en: "We could not find that campus", ar: "لم نتمكن من العثور على هذه الجامعة" })}
        </h1>
        <SiteButton to={site.universities} variant="ghost">
          {t({ en: "All universities", ar: "كل الجامعات" })}
        </SiteButton>
      </div>
    );
  }

  const stats = [
    { key: "students", value: university.students.toLocaleString(), label: { en: "Students", ar: "طالب" } },
    { key: "supervisors", value: String(university.supervisors), label: { en: "Supervisors", ar: "مشرف" } },
    { key: "chairs", value: String(university.chairs), label: { en: "Chairs", ar: "كرسي" } },
    {
      key: "cases",
      value: university.casesReviewed.toLocaleString(),
      label: { en: "Cases reviewed", ar: "حالة تمت مراجعتها" },
    },
  ];

  return (
    <>
      {/* cover */}
      <section className="relative">
        <div className="relative h-[320px] overflow-hidden md:h-[400px]">
          <img src={university.cover} alt="" aria-hidden="true" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-900/85 via-brand-900/45 to-brand-900/25" />
        </div>

        <div className="od-container relative -mt-32 pb-4">
          <Reveal className="rounded-3xl border border-white/60 bg-white/95 p-8 shadow-lift backdrop-blur">
            <nav className="flex items-center gap-2 text-[12.5px] font-semibold text-ink-soft">
              <Link to={site.universities} className="hover:text-accent-600">
                {t({ en: "Universities", ar: "الجامعات" })}
              </Link>
              <ChevronRight className={cn("h-3.5 w-3.5", isRtl && "rotate-180")} />
              <span className="text-ink-muted">{university.shortName}</span>
            </nav>

            <div className="mt-5 flex flex-col gap-6 md:flex-row md:items-center">
              <span className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-100 bg-white p-2 shadow-card">
                <img src={university.logo} alt="" aria-hidden="true" className="h-full w-full object-contain" />
              </span>

              <div className="min-w-0 flex-1">
                <h1 className="text-[30px] font-extrabold leading-tight text-brand-700 md:text-[38px]">
                  {t(university.name)}
                </h1>
                <p className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[13.5px] font-semibold text-ink-muted">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-accent-600" />
                    {t(university.city)}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <BadgeCheck className="h-4 w-4 text-accent-600" />
                    {t(university.accreditation)}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarCheck className="h-4 w-4 text-accent-600" />
                    {t({ en: "Next intake", ar: "القبول القادم" })}{" "}
                    {new Date(university.booking.nextIntake).toLocaleDateString(undefined, {
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </p>
              </div>

              <SiteButton
                to={university.booking.open ? `${site.book}?university=${university.id}` : site.contact}
                className="shrink-0"
                leftIcon={<CalendarCheck className="h-4 w-4" />}
              >
                {university.booking.open
                  ? t({ en: "Book a visit", ar: "احجز موعدًا" })
                  : t({ en: "Join the waitlist", ar: "انضم لقائمة الانتظار" })}
              </SiteButton>
            </div>
          </Reveal>
        </div>
      </section>

      <div className="od-container py-10">
        <StatStrip stats={stats} />
      </div>

      <Section tone="plain" className="pt-4">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <h2 className="text-[26px] font-extrabold text-brand-700">
              {t({ en: "About the programme", ar: "عن البرنامج" })}
            </h2>
            <p className="mt-4 text-[16px] leading-relaxed text-ink-muted">{t(university.summary)}</p>

            <h3 className="mt-10 text-[18px] font-extrabold text-brand-700">
              {t({ en: "Clinical departments", ar: "الأقسام السريرية" })}
            </h3>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {university.departments.map((department, index) => (
                <Reveal
                  key={department.key}
                  delay={index * 70}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white px-5 py-4 transition hover:border-accent-300 hover:shadow-card"
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                      <Stethoscope className="h-[18px] w-[18px]" />
                    </span>
                    <span className="text-[14.5px] font-bold text-ink">{t(department.label)}</span>
                  </span>
                  <span className="shrink-0 rounded-full bg-accent-50 px-3 py-1 text-[12px] font-extrabold text-accent-700">
                    {department.chairs} {t({ en: "chairs", ar: "كرسي" })}
                  </span>
                </Reveal>
              ))}
            </div>
          </div>

          <aside className="lg:col-span-5">
            <div className="rounded-3xl border border-slate-200/80 bg-od-gradient-soft p-8 shadow-card">
              <h3 className="text-[18px] font-extrabold text-brand-700">
                {t({ en: "Programmes offered", ar: "البرامج المتاحة" })}
              </h3>
              <ul className="mt-5 flex flex-col gap-3">
                {university.programmes.map((programme, index) => (
                  <li key={index} className="flex items-start gap-3 text-[15px] text-ink-muted">
                    <GraduationCap className="mt-0.5 h-[18px] w-[18px] shrink-0 text-accent-600" />
                    {t(programme)}
                  </li>
                ))}
              </ul>

              <h3 className="mt-9 text-[18px] font-extrabold text-brand-700">
                {t({ en: "Odenta modules in use", ar: "وحدات أودنتا المستخدمة" })}
              </h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {university.services.map((service) => (
                  <span
                    key={service}
                    className="rounded-full border border-brand-100 bg-white px-3.5 py-1.5 text-[12.5px] font-bold text-brand-700"
                  >
                    {service.replace(/-/g, " ")}
                  </span>
                ))}
              </div>

              <div className="mt-9 flex flex-col gap-3">
                {university.booking.open ? (
                  <SiteButton to={`${site.book}?university=${university.id}`} className="w-full">
                    {t({ en: "Book a visit here", ar: "احجز موعدًا هنا" })}
                  </SiteButton>
                ) : null}
                <SiteButton variant="ghost" to={site.contact} className="w-full">
                  {t({ en: "Request an intro call", ar: "اطلب مكالمة تعريفية" })}
                </SiteButton>
                <SiteButton variant="ghost" to={site.universities} className="w-full">
                  <ArrowLeft className={cn("h-4 w-4", isRtl && "rotate-180")} />
                  {t({ en: "All universities", ar: "كل الجامعات" })}
                </SiteButton>
              </div>
            </div>

            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-white p-5">
              <Users className="mt-0.5 h-5 w-5 shrink-0 text-accent-600" />
              <p className="text-[13.5px] leading-relaxed text-ink-muted">
                {t({
                  en: "Student clinics treat the public at a reduced fee, under the direct supervision of a qualified clinician. You are screened first, then allocated to a student in the right rotation.",
                  ar: "عيادات الطلاب تعالج الجمهور برسوم مخفضة وتحت الإشراف المباشر لطبيب مؤهل. يتم فحصك أولًا ثم إسنادك إلى طالب في التخصص المناسب.",
                })}
              </p>
            </div>
          </aside>
        </div>
      </Section>

      <CTABand />
    </>
  );
}
