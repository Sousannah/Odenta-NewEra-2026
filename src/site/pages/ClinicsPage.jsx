import { ArrowRight, Building2, Check, MapPin, Stethoscope } from "lucide-react";
import { cn } from "@/lib/cn";
import { site, auth } from "@/config/paths";
import { useAsync } from "@/hooks";
import { siteService } from "@/services";
import { CLINIC_ROLE_ORDER, ROLE_META } from "@/auth/roles";
import { useLanguage, useT } from "@/site/i18n/LanguageContext";
import { images } from "@/theme/assets";
import {
  CTABand,
  PageHero,
  Reveal,
  Section,
  SectionHeading,
  SiteButton,
} from "@/site/components";

const BENEFITS = [
  {
    key: "record",
    title: { en: "One record, no double entry", ar: "سجل واحد دون ازدواج" },
    description: {
      en: "Charting, imaging, plans, lab work and billing all attach to the same patient — nothing is retyped between systems.",
      ar: "الرسم والتصوير والخطط وأعمال المعمل والفوترة مرتبطة بنفس المريض — لا إعادة إدخال بين الأنظمة.",
    },
  },
  {
    key: "roles",
    title: { en: "A dashboard per job", ar: "لوحة لكل وظيفة" },
    description: {
      en: "Four role dashboards ship with the platform, each showing the day from that person's chair.",
      ar: "أربع لوحات أدوار جاهزة، كل منها تعرض اليوم من موقع صاحبها.",
    },
  },
  {
    key: "money",
    title: { en: "Money that reconciles", ar: "أموال قابلة للمطابقة" },
    description: {
      en: "Estimates, part payments, insurance splits and account pockets — with a purchase ledger on the other side.",
      ar: "التقديرات والدفعات الجزئية وتقسيم التأمين والحسابات — مع دفتر مشتريات في المقابل.",
    },
  },
  {
    key: "compliance",
    title: { en: "An audit trail that holds up", ar: "سجل مراجعة موثوق" },
    description: {
      en: "Every clinical read is logged with actor, record and time — the evidence an inspection actually asks for.",
      ar: "كل اطلاع سريري مسجل بالفاعل والسجل والوقت — الدليل الذي يطلبه التفتيش فعلًا.",
    },
  },
];

function ClinicCard({ clinic, delay }) {
  const t = useT();

  return (
    <Reveal
      delay={delay}
      className="group overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-card transition duration-300 hover:-translate-y-1 hover:border-accent-300 hover:shadow-lift"
    >
      <div className="relative h-40 overflow-hidden">
        <img
          src={clinic.image}
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-900/65 to-transparent" />
      </div>

      <div className="p-6">
        <h3 className="text-[17px] font-extrabold text-brand-700">{t(clinic.name)}</h3>
        <p className="mt-1.5 flex items-center gap-1.5 text-[12.5px] font-semibold text-ink-soft">
          <MapPin className="h-3.5 w-3.5 text-accent-600" />
          {t(clinic.city)} · {t({ en: "since", ar: "منذ" })} {clinic.since}
        </p>
        <p className="mt-4 text-[14px] text-ink-muted">{t(clinic.focus)}</p>

        <div className="mt-5 flex items-center gap-4 border-t border-slate-100 pt-4 text-[12.5px] font-bold text-ink-muted">
          <span className="inline-flex items-center gap-1.5">
            <Stethoscope className="h-3.5 w-3.5 text-accent-600" />
            {clinic.chairs} {t({ en: "chairs", ar: "كرسي" })}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5 text-accent-600" />
            {clinic.dentists} {t({ en: "dentists", ar: "طبيب" })}
          </span>
        </div>
      </div>
    </Reveal>
  );
}

export default function ClinicsPage() {
  const t = useT();
  const { isRtl } = useLanguage();
  const { data: clinics } = useAsync(() => siteService.getPartnerClinics(), [], []);

  return (
    <>
      <PageHero
        eyebrow={{ en: "For clinics", ar: "للعيادات" }}
        eyebrowIcon={<Building2 className="h-3.5 w-3.5" />}
        title={{ en: "Run the whole day on", ar: "أدر يومك بالكامل على" }}
        highlight={{ en: "one platform", ar: "منصة واحدة" }}
        description={{
          en: "From the first phone call to the final receipt — scheduling, charting, imaging, lab work, stock and money, without a second system to keep in step.",
          ar: "من أول مكالمة إلى آخر إيصال — الجدولة والرسم والتصوير والمعمل والمخزون والمال، دون نظام ثانٍ تتابعه.",
        }}
        actions={
          <>
            <SiteButton
              to={site.contact}
              rightIcon={<ArrowRight className={cn("h-4 w-4", isRtl && "rotate-180")} />}
            >
              {t({ en: "Book a demo", ar: "احجز عرضًا توضيحيًا" })}
            </SiteButton>
            <SiteButton variant="ghost" to={auth.signIn}>
              {t({ en: "Sign in to the portal", ar: "ادخل إلى البوابة" })}
            </SiteButton>
          </>
        }
      />

      <Section tone="plain" className="pt-0">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <Reveal className="relative">
            <div className="absolute -inset-1 rounded-[32px] bg-od-gradient opacity-20 blur-lg" />
            <div className="relative overflow-hidden rounded-[28px] border border-white shadow-lift">
              <img
                src={images.dashboardAlt}
                alt={t({ en: "Odenta clinic dashboard", ar: "لوحة عيادة أودنتا" })}
                className="aspect-[16/11] w-full object-cover"
                loading="lazy"
              />
            </div>
          </Reveal>

          <div>
            <SectionHeading
              align="start"
              eyebrow={{ en: "Why clinics move", ar: "لماذا تنتقل العيادات" }}
              title={{ en: "Less admin,", ar: "إدارة أقل،" }}
              highlight={{ en: "more chair time", ar: "وقت أطول على الكرسي" }}
            />

            <div className="mt-8 flex flex-col gap-5">
              {BENEFITS.map((benefit, index) => (
                <Reveal key={benefit.key} delay={index * 80} className="flex items-start gap-4">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-od-gradient text-white">
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  </span>
                  <span>
                    <span className="block text-[16px] font-extrabold text-brand-700">
                      {t(benefit.title)}
                    </span>
                    <span className="mt-1 block text-[14.5px] leading-relaxed text-ink-muted">
                      {t(benefit.description)}
                    </span>
                  </span>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Section tone="soft">
        <SectionHeading
          eyebrow={{ en: "Role dashboards", ar: "لوحات الأدوار" }}
          title={{ en: "Four roles,", ar: "أربعة أدوار،" }}
          highlight={{ en: "four views", ar: "أربع واجهات" }}
          description={{
            en: "Each role sees the same patient through a different lens, and only the parts of the record their job requires.",
            ar: "كل دور يرى نفس المريض من زاوية مختلفة، وفقط الأجزاء التي يحتاجها عمله.",
          }}
        />

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {CLINIC_ROLE_ORDER.map((role, index) => {
            const meta = ROLE_META[role];
            return (
              <Reveal
                key={role}
                delay={(index % 4) * 80}
                className="rounded-2xl border border-slate-200/80 bg-white p-6 transition duration-300 hover:-translate-y-1 hover:border-accent-300 hover:shadow-lift"
              >
                <span className="od-label">{meta.short}</span>
                <h3 className="mt-2 text-[16px] font-extrabold text-brand-700">{meta.label}</h3>
                <p className="mt-2.5 text-[13.5px] leading-relaxed text-ink-muted">
                  {meta.description}
                </p>
              </Reveal>
            );
          })}
        </div>
      </Section>

      {clinics.length ? (
        <Section tone="plain">
          <SectionHeading
            eyebrow={{ en: "Partner clinics", ar: "العيادات الشريكة" }}
            title={{ en: "Practices already", ar: "عيادات تعمل" }}
            highlight={{ en: "on Odenta", ar: "على أودنتا" }}
          />
          <div className="mt-14 grid gap-7 md:grid-cols-2 lg:grid-cols-3">
            {clinics.map((clinic, index) => (
              <ClinicCard key={clinic.id} clinic={clinic} delay={index * 90} />
            ))}
          </div>
        </Section>
      ) : null}

      <CTABand
        title={{ en: "Move your clinic", ar: "انقل عيادتك" }}
        highlight={{ en: "onto Odenta", ar: "إلى أودنتا" }}
        description={{
          en: "We migrate your patients, appointment history and radiographs, and run a dry import before anything is written.",
          ar: "ننقل مرضاك وتاريخ المواعيد والأشعة، وننفذ استيرادًا تجريبيًا قبل كتابة أي شيء.",
        }}
      />
    </>
  );
}
