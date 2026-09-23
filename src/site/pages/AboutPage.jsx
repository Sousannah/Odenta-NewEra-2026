import { Compass, Flag, HeartPulse, Lightbulb, Target, Users } from "lucide-react";
import { site } from "@/config/paths";
import { useT } from "@/site/i18n/LanguageContext";
import { images, people } from "@/theme/assets";
import {
  CTABand,
  FeatureCard,
  PageHero,
  Reveal,
  Section,
  SectionHeading,
  SiteButton,
  StatStrip,
} from "@/site/components";

const VALUES = [
  {
    key: "clinical",
    icon: HeartPulse,
    title: { en: "Clinical truth first", ar: "الحقيقة السريرية أولًا" },
    description: {
      en: "A model that guesses confidently is worse than no model. Odenta reports what it sees, how sure it is, and leaves the diagnosis to the clinician.",
      ar: "النموذج الذي يخمّن بثقة أسوأ من عدم وجوده. تعرض أودنتا ما تراه ومدى ثقتها، وتترك التشخيص للطبيب.",
    },
  },
  {
    key: "teaching",
    icon: Lightbulb,
    title: { en: "Built for teaching", ar: "مبنية للتعليم" },
    description: {
      en: "Every workflow assumes someone is learning it. Disagreement between a student and the model is surfaced, not hidden — that is where teaching happens.",
      ar: "كل سير عمل يفترض أن هناك من يتعلمه. الاختلاف بين الطالب والنموذج يُظهر ولا يُخفى — وهناك يحدث التعليم.",
    },
  },
  {
    key: "standards",
    icon: Compass,
    title: { en: "Standards over shortcuts", ar: "معايير لا اختصارات" },
    description: {
      en: "FDI, ICDAS and CDT are stored as structured data from the first release, so a record written today still means the same thing in ten years.",
      ar: "معايير FDI وICDAS وCDT مخزّنة كبيانات مهيكلة منذ الإصدار الأول، ليظل السجل مفهومًا بعد عشر سنوات.",
    },
  },
];

const TIMELINE = [
  {
    year: "2023",
    title: { en: "The first campus", ar: "أول جامعة" },
    description: {
      en: "Odenta starts as a student workflow tool at Alamein International University — case allocation and supervisor sign-off, nothing more.",
      ar: "بدأت أودنتا كأداة لسير عمل الطلاب في جامعة العلمين الدولية — توزيع الحالات واعتماد المشرفين، لا أكثر.",
    },
  },
  {
    year: "2024",
    title: { en: "Imaging joins the record", ar: "التصوير ينضم للسجل" },
    description: {
      en: "The first radiograph model ships, writing findings straight onto the odontogram rather than into a separate report.",
      ar: "إطلاق أول نموذج للأشعة، يكتب النتائج مباشرة على مخطط الأسنان بدل تقرير منفصل.",
    },
  },
  {
    year: "2025",
    title: { en: "The clinic side", ar: "جانب العيادة" },
    description: {
      en: "Scheduling, billing, lab cases and stock arrive, and Odenta becomes the whole day rather than one part of it.",
      ar: "وصلت الجدولة والفوترة وحالات المعمل والمخزون، وأصبحت أودنتا اليوم بأكمله لا جزءًا منه.",
    },
  },
  {
    year: "2026",
    title: { en: "New era", ar: "عهد جديد" },
    description: {
      en: "A rebuilt portal with a role dashboard for every job in the practice, and a public platform for patients and partner campuses.",
      ar: "بوابة معاد بناؤها بلوحة لكل وظيفة في العيادة، ومنصة عامة للمرضى والجامعات الشريكة.",
    },
  },
];

const TEAM = [
  {
    key: "sousannah",
    name: "Sousannah Magdy",
    role: { en: "Clinical product", ar: "المنتج السريري" },
    avatar: people.sousannah,
  },
  {
    key: "salma",
    name: "Salma Hassan",
    role: { en: "Imaging & research", ar: "التصوير والأبحاث" },
    avatar: people.salma,
  },
  {
    key: "jana",
    name: "Jana Adel",
    role: { en: "Clinic operations", ar: "تشغيل العيادات" },
    avatar: people.jana,
  },
];

const STATS = [
  { key: "founded", value: "2023", label: { en: "Founded", ar: "التأسيس" } },
  { key: "campuses", value: "3", label: { en: "Partner campuses", ar: "جامعة شريكة" } },
  { key: "clinics", value: "19", label: { en: "Clinics live", ar: "عيادة تعمل" } },
  { key: "records", value: "69k+", label: { en: "Cases on record", ar: "حالة مسجلة" } },
];

export default function AboutPage() {
  const t = useT();

  return (
    <>
      <PageHero
        eyebrow={{ en: "About us", ar: "من نحن" }}
        eyebrowIcon={<Flag className="h-3.5 w-3.5" />}
        title={{ en: "We build the software", ar: "نبني البرمجيات" }}
        highlight={{ en: "dentistry deserves", ar: "التي يستحقها طب الأسنان" }}
        description={{
          en: "Odenta started inside a dental school, not a boardroom. Every screen was drawn beside a chair, with the person who would have to use it between patients.",
          ar: "بدأت أودنتا داخل كلية طب أسنان لا في قاعة اجتماعات. كل شاشة رُسمت بجوار الكرسي مع من سيستخدمها بين المرضى.",
        }}
      />

      <div className="od-container pb-16">
        <StatStrip stats={STATS} />
      </div>

      <Section tone="plain" className="pt-0">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <Reveal className="relative">
            <div className="absolute -inset-1 rounded-[32px] bg-od-gradient opacity-20 blur-lg" />
            <div className="relative overflow-hidden rounded-[28px] border border-white shadow-lift">
              <img
                src={images.campus}
                alt={t({ en: "Alamein International University campus", ar: "حرم جامعة العلمين الدولية" })}
                className="aspect-[4/3] w-full object-cover"
                loading="lazy"
              />
            </div>
          </Reveal>

          <div>
            <SectionHeading
              align="start"
              eyebrow={{ en: "Our mission", ar: "مهمتنا" }}
              eyebrowIcon={<Target className="h-3.5 w-3.5" />}
              title={{ en: "Make good dentistry", ar: "جعل طب الأسنان الجيد" }}
              highlight={{ en: "easier to practise", ar: "أسهل في الممارسة" }}
              description={{
                en: "A dental student should spend their rotation treating patients, not chasing a supervisor for a signature. A clinic should spend its afternoon on chairs, not on reconciling two systems that disagree.",
                ar: "يجب أن يقضي طالب الأسنان تدريبه في علاج المرضى لا في ملاحقة توقيع المشرف. ويجب أن تقضي العيادة يومها على الكراسي لا في مطابقة نظامين متعارضين.",
              }}
            />
            <p className="mt-6 text-[16px] leading-relaxed text-ink-muted">
              {t({
                en: "So we built one record that every role reads differently, put a radiograph model beside it that shows its working, and made the audit trail something an accreditation review can actually read.",
                ar: "لذلك بنينا سجلًا واحدًا يقرأه كل دور بطريقته، ووضعنا بجانبه نموذجًا للأشعة يوضح عمله، وجعلنا سجل المراجعة قابلًا للقراءة فعلًا من جهات الاعتماد.",
              })}
            </p>
            <SiteButton to={site.services} className="mt-8">
              {t({ en: "See what we built", ar: "شاهد ما بنيناه" })}
            </SiteButton>
          </div>
        </div>
      </Section>

      <Section tone="soft">
        <SectionHeading
          eyebrow={{ en: "What we hold to", ar: "ما نلتزم به" }}
          title={{ en: "Three", ar: "ثلاثة" }}
          highlight={{ en: "non-negotiables", ar: "مبادئ ثابتة" }}
        />
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {VALUES.map((value, index) => (
            <FeatureCard key={value.key} feature={value} delay={index * 90} />
          ))}
        </div>
      </Section>

      <Section tone="plain">
        <SectionHeading
          eyebrow={{ en: "How we got here", ar: "كيف وصلنا" }}
          title={{ en: "From one campus to", ar: "من جامعة واحدة إلى" }}
          highlight={{ en: "a platform", ar: "منصة" }}
        />

        <div className="relative mt-16">
          <div className="pointer-events-none absolute inset-y-0 start-[27px] w-0.5 bg-gradient-to-b from-brand-600 via-accent-500 to-transparent md:start-1/2 md:-translate-x-1/2" />

          <div className="flex flex-col gap-10">
            {TIMELINE.map((entry, index) => (
              <Reveal
                key={entry.year}
                delay={index * 90}
                className="relative flex gap-6 md:grid md:grid-cols-2 md:gap-16"
              >
                <span
                  className={`relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-od-gradient text-[13px] font-extrabold text-white shadow-brand md:absolute md:start-1/2 md:-translate-x-1/2`}
                >
                  {entry.year}
                </span>

                <div
                  className={`rounded-3xl border border-slate-200/80 bg-white p-6 shadow-card md:col-span-1 ${
                    index % 2 === 0 ? "md:col-start-1 md:me-12" : "md:col-start-2 md:ms-12"
                  }`}
                >
                  <h3 className="text-[17px] font-extrabold text-brand-700">{t(entry.title)}</h3>
                  <p className="mt-2 text-[14.5px] leading-relaxed text-ink-muted">
                    {t(entry.description)}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </Section>

      <Section tone="canvas">
        <SectionHeading
          eyebrow={{ en: "The team", ar: "الفريق" }}
          eyebrowIcon={<Users className="h-3.5 w-3.5" />}
          title={{ en: "Clinicians and engineers,", ar: "أطباء ومهندسون،" }}
          highlight={{ en: "in the same room", ar: "في نفس الغرفة" }}
        />

        <div className="mx-auto mt-14 grid max-w-3xl gap-6 sm:grid-cols-3">
          {TEAM.map((member, index) => (
            <Reveal
              key={member.key}
              delay={index * 90}
              className="flex flex-col items-center rounded-3xl border border-slate-200/80 bg-white p-7 text-center shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-lift"
            >
              <img
                src={member.avatar}
                alt=""
                aria-hidden="true"
                className="h-24 w-24 rounded-full object-cover ring-4 ring-accent-100"
                loading="lazy"
              />
              <h3 className="mt-5 text-[16px] font-extrabold text-brand-700">{member.name}</h3>
              <p className="mt-1 text-[13px] font-semibold text-ink-soft">{t(member.role)}</p>
            </Reveal>
          ))}
        </div>
      </Section>

      <CTABand />
    </>
  );
}
