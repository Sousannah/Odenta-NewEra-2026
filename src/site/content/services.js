import {
  BarChart3,
  Boxes,
  CalendarCheck,
  CalendarPlus,
  ClipboardCheck,
  CreditCard,
  FileHeart,
  FlaskConical,
  GraduationCap,
  Languages,
  Layers,
  ShieldCheck,
  Smartphone,
  Stethoscope,
  Target,
  Users,
} from "lucide-react";
import { site } from "@/config/paths";

/**
 * Services page copy.
 *
 * What the platform does today, told by audience. The roadmap is not on this
 * page on purpose — it lives in one line at the bottom, as a promise.
 */

export const hero = {
  eyebrow: { en: "Services", ar: "الخدمات" },
  title: { en: "Everything connected.", ar: "كل شيء متصل." },
  highlight: { en: "Nothing complicated.", ar: "ولا شيء معقد." },
  description: {
    en: "One platform for how dentistry is taught and practised — shaped around the people who do the work, not the other way round.",
    ar: "منصة واحدة لطريقة تعليم طب الأسنان وممارسته — مصممة حول من يقومون بالعمل، لا العكس.",
  },
};

export const audiences = [
  {
    key: "universities",
    icon: GraduationCap,
    eyebrow: { en: "For universities", ar: "للجامعات" },
    title: { en: "Clinical teaching, without the paper.", ar: "تعليم سريري، بلا ورق." },
    description: {
      en: "From the first patient a student meets to the final competency sign-off — the whole teaching clinic in one place.",
      ar: "من أول مريض يقابله الطالب حتى الاعتماد النهائي للكفاءة — عيادة التعليم بالكامل في مكان واحد.",
    },
    to: site.universities,
    cta: { en: "See universities", ar: "شاهد الجامعات" },
    items: [
      {
        icon: Users,
        title: { en: "Case allocation", ar: "توزيع الحالات" },
        description: { en: "The right patient to the right student, fairly and on time.", ar: "المريض المناسب للطالب المناسب، بعدل وفي الوقت." },
      },
      {
        icon: ClipboardCheck,
        title: { en: "Supervisor sign-off", ar: "اعتماد المشرف" },
        description: { en: "Every clinical step reviewed and signed, digitally.", ar: "كل خطوة سريرية تُراجع وتُعتمد رقميًا." },
      },
      {
        icon: Target,
        title: { en: "Requirements & milestones", ar: "المتطلبات والإنجازات" },
        description: { en: "Each student's progress, visible at a glance.", ar: "تقدم كل طالب، واضح من نظرة واحدة." },
      },
      {
        icon: CalendarPlus,
        title: { en: "Patient booking", ar: "حجز المرضى" },
        description: { en: "The public books straight into the teaching clinic.", ar: "يحجز الجمهور مباشرة في عيادة التعليم." },
      },
      {
        icon: BarChart3,
        title: { en: "Faculty overview", ar: "نظرة شاملة للكلية" },
        description: { en: "Departments, clinics and cohorts in one clear view.", ar: "الأقسام والعيادات والدفعات في عرض واحد واضح." },
      },
    ],
  },
  {
    key: "clinics",
    icon: Stethoscope,
    eyebrow: { en: "For clinics", ar: "للعيادات" },
    title: { en: "Your whole day, beautifully organised.", ar: "يومك بالكامل، منظم بأناقة." },
    description: {
      en: "The front desk, the chair and the back office finally working from the same page.",
      ar: "الاستقبال والكرسي والإدارة يعملون أخيرًا من الصفحة نفسها.",
    },
    to: site.clinics,
    cta: { en: "See clinics", ar: "شاهد العيادات" },
    items: [
      {
        icon: CalendarCheck,
        title: { en: "Scheduling", ar: "الجدولة" },
        description: { en: "Every chair, every dentist, every day — at a glance.", ar: "كل كرسي وكل طبيب وكل يوم — من نظرة." },
      },
      {
        icon: FileHeart,
        title: { en: "Patient records", ar: "سجلات المرضى" },
        description: { en: "Charting, history and treatment plans in one record.", ar: "المخطط والتاريخ وخطط العلاج في سجل واحد." },
      },
      {
        icon: CreditCard,
        title: { en: "Billing & payments", ar: "الفواتير والمدفوعات" },
        description: { en: "Estimates, instalments and receipts that add up.", ar: "تقديرات وأقساط وإيصالات دقيقة." },
      },
      {
        icon: FlaskConical,
        title: { en: "Lab & inventory", ar: "المعمل والمخزون" },
        description: { en: "Lab cases tracked, stock never a surprise.", ar: "حالات المعمل متتبعة، والمخزون بلا مفاجآت." },
      },
      {
        icon: Boxes,
        title: { en: "Your whole team", ar: "فريقك بالكامل" },
        description: { en: "Owner, dentist, assistant and reception — each with their own view.", ar: "المالك والطبيب والمساعد والاستقبال — لكل منهم واجهته." },
      },
    ],
  },
];

export const foundation = {
  eyebrow: { en: "Underneath it all", ar: "في الأساس" },
  title: { en: "One foundation,", ar: "أساس واحد،" },
  highlight: { en: "built to last.", ar: "مبني ليدوم." },
  items: [
    {
      key: "record",
      icon: Layers,
      title: { en: "One patient record", ar: "سجل واحد للمريض" },
      description: { en: "Every visit and every note, in one continuous story.", ar: "كل زيارة وكل ملاحظة، في قصة واحدة متصلة." },
    },
    {
      key: "secure",
      icon: ShieldCheck,
      title: { en: "Private by design", ar: "خصوصية من الأساس" },
      description: { en: "Role-based access, every read on the record logged.", ar: "صلاحيات حسب الدور، وكل اطلاع على السجل موثق." },
    },
    {
      key: "language",
      icon: Languages,
      title: { en: "Arabic & English", ar: "العربية والإنجليزية" },
      description: { en: "Fully bilingual, right-to-left native.", ar: "ثنائي اللغة بالكامل، ويدعم الكتابة من اليمين." },
    },
    {
      key: "mobile",
      icon: Smartphone,
      title: { en: "Web & mobile", ar: "الويب والهاتف" },
      description: { en: "At the chair, at the desk, or on the move.", ar: "عند الكرسي، أو على المكتب، أو أثناء التنقل." },
    },
  ],
};

export const next = {
  title: { en: "And this is only the beginning.", ar: "وهذه مجرد البداية." },
  description: {
    en: "We're building what comes next for dentistry. The future is closer than you think.",
    ar: "نحن نبني ما هو قادم لطب الأسنان. المستقبل أقرب مما تظن.",
  },
};
