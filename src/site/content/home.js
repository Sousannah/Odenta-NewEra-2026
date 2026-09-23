import {
  Building2,
  FileHeart,
  GraduationCap,
  Languages,
  Layers,
  ShieldCheck,
  Smartphone,
  Stethoscope,
  UserRound,
} from "lucide-react";
import { site } from "@/config/paths";

/**
 * Home page copy. Strings are `{ en, ar }`; `useT()` resolves them.
 *
 * Voice: the Odenta posts — "The Future of Dentistry, Connected. One Digital
 * Ecosystem. Built for What's Next." Calm, confident, short. What the platform
 * will do next is deliberately teased, not listed.
 */

export const hero = {
  title: { en: "The future of dentistry,", ar: "مستقبل طب الأسنان،" },
  highlight: { en: "connected.", ar: "متصل." },
  description: {
    en: "One digital ecosystem for dental universities, clinics and the patients they care for. Built for what's next.",
    ar: "منظومة رقمية واحدة لكليات طب الأسنان والعيادات والمرضى الذين يرعونهم. مبنية لما هو قادم.",
  },
  primary: { label: { en: "Book a demo", ar: "احجز عرضًا" }, to: site.demo },
  secondary: { label: { en: "Explore universities", ar: "استكشف الجامعات" }, to: site.universities },
  nodes: [
    { key: "universities", icon: GraduationCap, label: { en: "Universities", ar: "الجامعات" } },
    { key: "clinics", icon: Building2, label: { en: "Clinics", ar: "العيادات" } },
    { key: "patients", icon: UserRound, label: { en: "Patients", ar: "المرضى" } },
  ],
};

export const ecosystem = {
  eyebrow: { en: "One digital ecosystem", ar: "منظومة رقمية واحدة" },
  title: { en: "Everyone in dentistry,", ar: "كل من في طب الأسنان،" },
  highlight: { en: "on the same page.", ar: "على صفحة واحدة." },
  description: {
    en: "Dental schools, private clinics and patients have always worked in separate worlds. Odenta brings them into one — so care flows, and nothing gets lost in between.",
    ar: "عاشت كليات طب الأسنان والعيادات الخاصة والمرضى دائمًا في عوالم منفصلة. أودنتا تجمعهم في عالم واحد — لتنساب الرعاية ولا يضيع شيء بينهم.",
  },
  pillars: [
    {
      key: "universities",
      icon: GraduationCap,
      title: { en: "For universities", ar: "للجامعات" },
      description: {
        en: "Clinical teaching without the paper. Every case, every supervisor sign-off and every student milestone — in one place.",
        ar: "تعليم سريري بلا ورق. كل حالة، وكل اعتماد من المشرف، وكل إنجاز للطالب — في مكان واحد.",
      },
      to: site.universities,
      cta: { en: "See universities", ar: "شاهد الجامعات" },
    },
    {
      key: "clinics",
      icon: Stethoscope,
      title: { en: "For clinics", ar: "للعيادات" },
      description: {
        en: "Your whole day, beautifully organised. From the first appointment to the final receipt, with your team in sync.",
        ar: "يومك بالكامل، منظم بأناقة. من أول موعد حتى آخر إيصال، وفريقك في تناغم تام.",
      },
      to: site.clinics,
      cta: { en: "See clinics", ar: "شاهد العيادات" },
    },
    {
      key: "patients",
      icon: FileHeart,
      title: { en: "For patients", ar: "للمرضى" },
      description: {
        en: "Care that remembers you. Book a visit in a teaching clinic, and carry one record wherever your treatment goes.",
        ar: "رعاية تتذكرك. احجز زيارتك في عيادة جامعية، واحمل سجلًا واحدًا أينما ذهب علاجك.",
      },
      to: site.universities,
      cta: { en: "Find a clinic", ar: "ابحث عن عيادة" },
    },
  ],
};

export const principles = {
  eyebrow: { en: "Designed with intent", ar: "مصمم بعناية" },
  title: { en: "Smarter dentistry", ar: "طب أسنان أذكى" },
  highlight: { en: "starts with better tools.", ar: "يبدأ بأدوات أفضل." },
  items: [
    {
      key: "record",
      icon: Layers,
      size: "wide",
      title: { en: "One record. Every role.", ar: "سجل واحد. لكل الأدوار." },
      description: {
        en: "Students, supervisors, dentists, assistants and the front desk each see exactly what their work needs — all from the same patient story.",
        ar: "الطلاب والمشرفون والأطباء والمساعدون والاستقبال، يرى كل منهم ما يحتاجه عمله بالضبط — من قصة المريض نفسها.",
      },
    },
    {
      key: "secure",
      icon: ShieldCheck,
      title: { en: "Private by design", ar: "خصوصية من الأساس" },
      description: {
        en: "Role-based access and a complete audit trail. Patient data stays where it belongs.",
        ar: "صلاحيات حسب الدور وسجل مراجعة كامل. بيانات المريض تبقى في مكانها.",
      },
    },
    {
      key: "language",
      icon: Languages,
      title: { en: "Arabic & English", ar: "العربية والإنجليزية" },
      description: {
        en: "Fully bilingual, right-to-left native. Built in Egypt, for the region.",
        ar: "ثنائي اللغة بالكامل، ويدعم الكتابة من اليمين أصلًا. صُنع في مصر، للمنطقة.",
      },
    },
    {
      key: "everywhere",
      icon: Smartphone,
      title: { en: "Wherever you work", ar: "أينما كنت تعمل" },
      description: {
        en: "At the chair, at the desk, or on the move — on the web and on your phone.",
        ar: "عند الكرسي، أو على المكتب، أو أثناء التنقل — على الويب وعلى هاتفك.",
      },
    },
    {
      key: "chair",
      icon: UserRound,
      title: { en: "Shaped at the chair", ar: "صُمم عند الكرسي" },
      description: {
        en: "Designed alongside students, supervisors and clinicians — not in a boardroom.",
        ar: "صُمم مع الطلاب والمشرفين والأطباء — لا في قاعة اجتماعات.",
      },
    },
    {
      key: "standards",
      icon: Stethoscope,
      size: "full",
      title: { en: "Speaks the language of dentistry", ar: "يتحدث لغة طب الأسنان" },
      description: {
        en: "Digital charting, periodontal records and treatment plans built on the clinical standards dentists already trust — nothing to relearn.",
        ar: "مخططات أسنان رقمية وسجلات لثة وخطط علاج مبنية على المعايير السريرية التي يثق بها الأطباء — لا شيء لتتعلمه من جديد.",
      },
    },
  ],
};

export const origin = {
  eyebrow: { en: "Where it began", ar: "من أين بدأنا" },
  title: { en: "Born in a", ar: "وُلدت في" },
  highlight: { en: "dental school.", ar: "كلية طب أسنان." },
  description: {
    en: "Odenta was built at Alamein International University, side by side with the students, supervisors and clinicians who use it every day. Every screen was shaped at a real dental chair.",
    ar: "بُنيت أودنتا في جامعة العلمين الدولية، جنبًا إلى جنب مع الطلاب والمشرفين والأطباء الذين يستخدمونها كل يوم. كل شاشة تشكّلت عند كرسي أسنان حقيقي.",
  },
  cta: { label: { en: "Our universities", ar: "جامعاتنا" }, to: site.universities },
};

export const teaser = {
  kicker: { en: "Something", ar: "شيء ما" },
  title: { en: "is coming.", ar: "قادم." },
  description: {
    en: "We're building what comes next for dentistry. The future is closer than you think.",
    ar: "نحن نبني ما هو قادم لطب الأسنان. المستقبل أقرب مما تظن.",
  },
  cta: { en: "Follow the journey", ar: "تابع الرحلة" },
};

export const closing = {
  title: { en: "Built for", ar: "مبنية" },
  highlight: { en: "what's next.", ar: "لما هو قادم." },
  description: {
    en: "Bring your university or clinic into one connected ecosystem. We'll show you around, live, in thirty minutes.",
    ar: "انضم بجامعتك أو عيادتك إلى منظومة واحدة متصلة. سنأخذك في جولة مباشرة خلال ثلاثين دقيقة.",
  },
};
