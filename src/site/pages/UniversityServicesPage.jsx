import {
  BadgeCheck,
  BarChart3,
  CalendarCheck,
  ClipboardCheck,
  FlaskConical,
  GraduationCap,
  ScanLine,
  ShieldCheck,
  Stethoscope,
  Users,
} from "lucide-react";
import { site } from "@/config/paths";
import { useAsync } from "@/hooks";
import { siteService } from "@/services";
import { useT } from "@/site/i18n/LanguageContext";
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

/**
 * What Odenta does for a dental school.
 *
 * The audience here is a dean or a clinical director, not a patient — so the
 * page is organised around the two things they are buying: a supervised
 * teaching workflow, and the evidence trail that comes out of it.
 */

const FEATURES = [
  {
    key: "ai",
    icon: ScanLine,
    title: { en: "AI radiograph analysis", ar: "تحليل الأشعة بالذكاء الاصطناعي" },
    description: {
      en: "Caries, periapical lesions and impactions detected on upload, with the confidence shown. Students record their own diagnosis first — the overlay is a second opinion, not an answer key.",
      ar: "اكتشاف التسوس والآفات حول الذروية والانطمار عند الرفع، مع إظهار درجة الثقة. يسجّل الطالب تشخيصه أولًا — الطبقة رأي ثانٍ وليست إجابة جاهزة.",
    },
  },
  {
    key: "workflow",
    icon: GraduationCap,
    title: { en: "Student clinical workflow", ar: "سير العمل السريري للطالب" },
    description: {
      en: "One caseload per student, gated on consent, charted on the treatment sheet their rotation actually uses — operative, endodontics, prosthodontics, periodontics, surgery.",
      ar: "حالات مخصصة لكل طالب، مشروطة بالموافقة، ومسجّلة على ورقة العلاج الخاصة بتخصصه — الحشو، اللبية، التركيبات، اللثة، الجراحة.",
    },
  },
  {
    key: "review",
    icon: ClipboardCheck,
    title: { en: "Supervisor sign-off", ar: "اعتماد المشرف" },
    description: {
      en: "Every step of every procedure is submitted, graded and signed. Nothing advances until the previous step is accepted, and the whole trail is auditable years later.",
      ar: "كل خطوة في كل إجراء تُرسل وتُقيّم وتُعتمد. لا شيء يتقدم قبل قبول الخطوة السابقة، والسجل كامل وقابل للمراجعة بعد سنوات.",
    },
  },
  {
    key: "requirements",
    icon: BadgeCheck,
    title: { en: "Requirement tracking", ar: "تتبع المتطلبات" },
    description: {
      en: "The rotation quota, counted automatically from accepted work. A student knows what they still owe; a supervisor knows who will not clear it before the term ends.",
      ar: "حصة التدريب تُحتسب تلقائيًا من الأعمال المقبولة. الطالب يعرف ما تبقى عليه، والمشرف يعرف من لن ينهي متطلباته قبل نهاية الفصل.",
    },
  },
  {
    key: "lab",
    icon: FlaskConical,
    title: { en: "Lab pipeline", ar: "مسار المعمل" },
    description: {
      en: "Work orders raised chairside, approved by the supervising clinician, and tracked through production to delivery — university bench or external lab.",
      ar: "طلبات المعمل تُرفع من الكرسي، ويعتمدها المشرف، وتُتابع من الإنتاج حتى التسليم — معمل الجامعة أو معمل خارجي.",
    },
  },
  {
    key: "analytics",
    icon: BarChart3,
    title: { en: "Programme analytics", ar: "تحليلات البرنامج" },
    description: {
      en: "Throughput, acceptance rates, review turnaround and the rotations where the whole cohort is short — the numbers a progress board actually asks for.",
      ar: "معدلات الإنجاز والقبول وزمن المراجعة والتخصصات التي تأخر فيها الجميع — الأرقام التي تطلبها لجنة المتابعة فعلًا.",
    },
  },
];

const ROLES = [
  {
    key: "student",
    icon: <GraduationCap className="h-5 w-5" />,
    title: { en: "Students", ar: "الطلاب" },
    lines: [
      { en: "Own caseload and clinic sessions", ar: "الحالات والجلسات الخاصة بك" },
      { en: "Odontogram, treatment sheets and imaging", ar: "مخطط الأسنان وأوراق العلاج والأشعة" },
      { en: "Submit steps and see exactly what to correct", ar: "أرسل الخطوات واعرف ما يجب تصحيحه" },
      { en: "Live requirement progress", ar: "متابعة المتطلبات لحظيًا" },
    ],
  },
  {
    key: "supervisor",
    icon: <ClipboardCheck className="h-5 w-5" />,
    title: { en: "Supervisors", ar: "المشرفون" },
    lines: [
      { en: "A review queue ordered oldest first", ar: "قائمة مراجعة مرتبة بالأقدم أولًا" },
      { en: "Grade, return or reject with a reason", ar: "قيّم أو أعد أو ارفض مع السبب" },
      { en: "Cohort progress and students at risk", ar: "تقدم الدفعة والطلاب المتأخرون" },
      { en: "Lab approvals in the same place", ar: "اعتماد طلبات المعمل في نفس المكان" },
    ],
  },
  {
    key: "admin",
    icon: <Users className="h-5 w-5" />,
    title: { en: "Faculty administration", ar: "إدارة الكلية" },
    lines: [
      { en: "People, rotations and announcements", ar: "الأشخاص والتدريبات والإعلانات" },
      { en: "Intake bookings from the public site", ar: "حجوزات الاستقبال من الموقع" },
      { en: "Case allocation across the floor", ar: "توزيع الحالات على الأدوار" },
      { en: "Full student activity trail", ar: "سجل نشاط الطلاب بالكامل" },
    ],
  },
  {
    key: "it",
    icon: <ShieldCheck className="h-5 w-5" />,
    title: { en: "IT", ar: "تقنية المعلومات" },
    lines: [
      { en: "Bulk cohort creation from a paste", ar: "إنشاء دفعة كاملة بلصق واحد" },
      { en: "Lockouts, resets and MFA", ar: "الإيقاف وإعادة التعيين والتحقق الثنائي" },
      { en: "Role assignment audited end to end", ar: "إسناد الأدوار مُسجّل بالكامل" },
      { en: "Reads logged as well as writes", ar: "تسجيل القراءة كما الكتابة" },
    ],
  },
];

export default function UniversityServicesPage() {
  const t = useT();
  const { data: universities = [] } = useAsync(() => siteService.getUniversities(), [], []);

  const totals = universities.reduce(
    (acc, item) => ({
      students: acc.students + (item.students ?? 0),
      supervisors: acc.supervisors + (item.supervisors ?? 0),
      chairs: acc.chairs + (item.chairs ?? 0),
      cases: acc.cases + (item.casesReviewed ?? 0),
    }),
    { students: 0, supervisors: 0, chairs: 0, cases: 0 }
  );

  const stats = [
    {
      key: "students",
      value: totals.students.toLocaleString(),
      label: { en: "Students on the platform", ar: "طالب على المنصة" },
    },
    {
      key: "supervisors",
      value: totals.supervisors.toLocaleString(),
      label: { en: "Supervising clinicians", ar: "طبيب مشرف" },
    },
    {
      key: "chairs",
      value: totals.chairs.toLocaleString(),
      label: { en: "Teaching chairs", ar: "كرسي تعليمي" },
    },
    {
      key: "cases",
      value: totals.cases.toLocaleString(),
      label: { en: "Cases signed off", ar: "حالة معتمدة" },
    },
  ];

  return (
    <>
      <PageHero
        eyebrow={{ en: "For universities", ar: "للجامعات" }}
        eyebrowIcon={<GraduationCap className="h-3.5 w-3.5" />}
        title={{ en: "Run the teaching clinic", ar: "أدر العيادة التعليمية" }}
        highlight={{ en: "on one record", ar: "بسجل واحد" }}
        description={{
          en: "Case allocation, charting, treatment sheets, supervisor sign-off and requirement tracking — the whole clinical rotation inside one system, with an audit trail that survives accreditation.",
          ar: "توزيع الحالات والتسجيل وأوراق العلاج واعتماد المشرفين وتتبع المتطلبات — التدريب السريري كاملًا في نظام واحد، بسجل مراجعة يصمد أمام الاعتماد.",
        }}
        actions={
          <>
            <SiteButton to={site.contact} rightIcon={<Stethoscope className="h-4 w-4" />}>
              {t({ en: "Book a walkthrough", ar: "احجز عرضًا توضيحيًا" })}
            </SiteButton>
            <SiteButton variant="ghost" to={site.tryAi}>
              {t({ en: "Try the AI", ar: "جرّب الذكاء الاصطناعي" })}
            </SiteButton>
          </>
        }
      >
        <div className="mt-14">
          <StatStrip stats={stats} />
        </div>
      </PageHero>

      {/* --------------------------------------------------------- modules */}
      <Section tone="canvas">
        <SectionHeading
          eyebrow={{ en: "Modules", ar: "الوحدات" }}
          title={{ en: "Everything a clinical rotation", ar: "كل ما يحتاجه التدريب السريري" }}
          highlight={{ en: "actually needs", ar: "فعليًا" }}
          description={{
            en: "Nothing here is a generic practice-management feature with a student label on it. Each module exists because a dental school asked for it.",
            ar: "لا شيء هنا مجرد خاصية إدارة عيادات بملصق طلابي. كل وحدة موجودة لأن كلية طب أسنان طلبتها.",
          }}
        />

        <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {FEATURES.map((feature, index) => (
            <FeatureCard key={feature.key} feature={feature} delay={index * 70} />
          ))}
        </div>
      </Section>

      {/* ----------------------------------------------------------- roles */}
      <Section tone="plain">
        <SectionHeading
          eyebrow={{ en: "One record, every role", ar: "سجل واحد، كل الأدوار" }}
          title={{ en: "Each role sees", ar: "كل دور يرى" }}
          highlight={{ en: "only its own work", ar: "عمله فقط" }}
          description={{
            en: "A student cannot open another student's caseload. A supervisor sees the cohort they sign for. IT never sees a clinical note. The API enforces the same split the interface shows.",
            ar: "لا يستطيع الطالب فتح حالات طالب آخر. المشرف يرى الدفعة التي يعتمدها. تقنية المعلومات لا ترى أي ملاحظة سريرية. وواجهة البرمجة تطبق نفس الفصل الذي تراه في الواجهة.",
          }}
        />

        <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {ROLES.map((role, index) => (
            <Reveal
              key={role.key}
              delay={index * 70}
              className="flex flex-col rounded-3xl border border-slate-200/80 bg-white p-7 shadow-card transition duration-300 hover:-translate-y-1 hover:border-accent-300 hover:shadow-lift"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                {role.icon}
              </span>
              <h3 className="mt-5 text-[17px] font-extrabold text-brand-700">{t(role.title)}</h3>
              <ul className="mt-4 flex flex-col gap-2.5">
                {role.lines.map((line) => (
                  <li key={line.en} className="flex items-start gap-2.5">
                    <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent-600" />
                    <span className="text-[13.5px] leading-relaxed text-ink-muted">{t(line)}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ------------------------------------------------------- patients */}
      <Section tone="soft">
        <div className="grid items-center gap-12 lg:grid-cols-12">
          <Reveal className="lg:col-span-6">
            <SectionHeading
              align="start"
              eyebrow={{ en: "For patients", ar: "للمرضى" }}
              eyebrowIcon={<CalendarCheck className="h-3.5 w-3.5" />}
              title={{ en: "Treatment at a", ar: "علاج في" }}
              highlight={{ en: "reduced fee", ar: "برسوم مخفضة" }}
              description={{
                en: "University clinics treat the public under supervision. Patients book online, get a reference, and are screened before being allocated to a student — the same record the whole faculty works from.",
                ar: "تعالج عيادات الجامعات الجمهور تحت إشراف. يحجز المريض عبر الإنترنت، ويحصل على رقم مرجعي، ويُفحص مبدئيًا قبل إسناده لطالب — على نفس السجل الذي تعمل عليه الكلية.",
              }}
            />
            <div className="mt-8 flex flex-wrap gap-4">
              <SiteButton to={site.book} leftIcon={<CalendarCheck className="h-4 w-4" />}>
                {t({ en: "Book a visit", ar: "احجز موعدًا" })}
              </SiteButton>
              <SiteButton variant="ghost" to={site.universities}>
                {t({ en: "See the campuses", ar: "شاهد الجامعات" })}
              </SiteButton>
            </div>
          </Reveal>

          <Reveal delay={120} className="lg:col-span-6">
            <ol className="flex flex-col gap-4">
              {[
                {
                  title: { en: "Pick a campus and a time", ar: "اختر الجامعة والوقت" },
                  body: {
                    en: "Live slot availability, two sessions a day, Sunday to Thursday.",
                    ar: "مواعيد متاحة لحظيًا، فترتان يوميًا، من الأحد إلى الخميس.",
                  },
                },
                {
                  title: { en: "Get a booking reference", ar: "احصل على رقم مرجعي" },
                  body: {
                    en: "Quote it at reception. It reaches the clinic desk the moment you confirm.",
                    ar: "اذكره في الاستقبال. يصل إلى مكتب العيادة فور التأكيد.",
                  },
                },
                {
                  title: { en: "Screening and allocation", ar: "الفحص والإسناد" },
                  body: {
                    en: "A clinician screens you first, then allocates the case to a student in the right rotation.",
                    ar: "يفحصك طبيب أولًا، ثم يُسند الحالة إلى طالب في التخصص المناسب.",
                  },
                },
                {
                  title: { en: "Supervised treatment", ar: "علاج تحت إشراف" },
                  body: {
                    en: "You sign a consent form first. Every step is checked by a qualified clinician before the next one starts.",
                    ar: "توقّع نموذج موافقة أولًا. كل خطوة يراجعها طبيب مؤهل قبل بدء التالية.",
                  },
                },
              ].map((step, index) => (
                <li
                  key={step.title.en}
                  className="flex items-start gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-od-gradient text-[14px] font-extrabold text-white">
                    {index + 1}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[15px] font-extrabold text-brand-700">
                      {t(step.title)}
                    </span>
                    <span className="mt-1 block text-[13.5px] leading-relaxed text-ink-muted">
                      {t(step.body)}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>
      </Section>

      <CTABand />
    </>
  );
}
