import {
  BarChart3,
  Boxes,
  Brain,
  CalendarCheck,
  ClipboardCheck,
  CreditCard,
  FlaskConical,
  GraduationCap,
  ScanLine,
  ShieldCheck,
  Stethoscope,
  Users,
} from "lucide-react";
import { site } from "@/config/paths";
import { images } from "@/theme/assets";

/** Services page: the modules, who each one is for, and what it replaces. */

export const hero = {
  eyebrow: { en: "Services", ar: "الخدمات" },
  title: { en: "Everything a dental practice", ar: "كل ما تحتاجه عيادة الأسنان" },
  highlight: { en: "actually runs on", ar: "للعمل فعليًا" },
  description: {
    en: "Odenta is one platform with eight modules. Take the imaging on its own, or run the whole clinic on it — every module writes to the same patient record and the same audit trail.",
    ar: "أودنتا منصة واحدة بثماني وحدات. استخدم التصوير وحده، أو أدر العيادة بالكامل — كل وحدة تكتب في نفس سجل المريض ونفس سجل المراجعة.",
  },
};

export const modules = [
  {
    key: "ai-imaging",
    icon: ScanLine,
    title: { en: "AI imaging", ar: "التصوير بالذكاء الاصطناعي" },
    description: {
      en: "Panoramic, periapical and bitewing analysis. Findings are boxed on the film, scored for confidence and written to the tooth they belong to.",
      ar: "تحليل الأشعة البانورامية والذروية واللدغية. النتائج محددة على الصورة ومُقيّمة بالثقة ومرتبطة بالسن.",
    },
    cta: { en: "Run the demo", ar: "شغّل العرض" },
    to: site.tryAi,
  },
  {
    key: "charting",
    icon: Stethoscope,
    title: { en: "Charting & perio", ar: "الرسم البياني واللثة" },
    description: {
      en: "Surface-level odontogram in FDI, Universal and Palmer, six-point periodontal depths, recession, bleeding and mobility — all as structured data.",
      ar: "مخطط أسنان بمستوى الأسطح، وأعماق لثوية بست نقاط، والانحسار والنزيف والحركة — كلها بيانات مهيكلة.",
    },
  },
  {
    key: "student-workflow",
    icon: GraduationCap,
    title: { en: "Student workflow", ar: "سير عمل الطالب" },
    description: {
      en: "Case allocation, requirement counters and department sheets for every clinical rotation, with the student's own queue front and centre.",
      ar: "توزيع الحالات وعدادات المتطلبات وأوراق الأقسام لكل تدريب سريري، مع قائمة الطالب في المقدمة.",
    },
    cta: { en: "For universities", ar: "للجامعات" },
    to: site.universities,
  },
  {
    key: "supervision",
    icon: ClipboardCheck,
    title: { en: "Supervision & sign-off", ar: "الإشراف والاعتماد" },
    description: {
      en: "Step-level review with annotations, grades and signatures. Nothing advances without an attributable approval, and every approval is exportable.",
      ar: "مراجعة على مستوى الخطوة مع الملاحظات والدرجات والتوقيعات. لا شيء يتقدم دون موافقة موثقة قابلة للتصدير.",
    },
  },
  {
    key: "scheduling",
    icon: CalendarCheck,
    title: { en: "Scheduling & recalls", ar: "الجدولة والمتابعات" },
    description: {
      en: "Chair-by-chair calendar, waitlist, check-in, no-show tracking and recall campaigns driven by the treatment plan rather than a spreadsheet.",
      ar: "تقويم لكل كرسي وقائمة انتظار وتسجيل وصول وتتبع الغياب وحملات متابعة مبنية على خطة العلاج.",
    },
  },
  {
    key: "billing",
    icon: CreditCard,
    title: { en: "Billing & payments", ar: "الفوترة والمدفوعات" },
    description: {
      en: "CDT-coded estimates, insurance split, part payments, receipts and account pockets — with the front desk never needing the clinical note.",
      ar: "تقديرات مرمّزة وتقسيم التأمين ودفعات جزئية وإيصالات وحسابات — دون حاجة الاستقبال للملاحظة السريرية.",
    },
  },
  {
    key: "lab",
    icon: FlaskConical,
    title: { en: "Lab cases", ar: "حالات المعمل" },
    description: {
      en: "Work orders with shade, impression type and due date. The lab technician moves a case through stages the dentist can watch without a phone call.",
      ar: "أوامر عمل باللون ونوع الطبعة وتاريخ التسليم. يحرك الفني الحالة عبر مراحل يتابعها الطبيب دون اتصال.",
    },
  },
  {
    key: "inventory",
    icon: Boxes,
    title: { en: "Stock & sterilisation", ar: "المخزون والتعقيم" },
    description: {
      en: "Consumable levels, reorder points, peripheral servicing and sterilisation cycles with traceable instrument pouches.",
      ar: "مستويات المستهلكات ونقاط إعادة الطلب وصيانة الأجهزة ودورات التعقيم مع تتبع أكياس الأدوات.",
    },
  },
  {
    key: "analytics",
    icon: BarChart3,
    title: { en: "Reporting", ar: "التقارير" },
    description: {
      en: "Revenue, chair utilisation, treatment mix, student competency and supervisor turnaround — filtered by clinic, department or person.",
      ar: "الإيرادات واستغلال الكراسي ومزيج العلاجات وكفاءة الطلاب واستجابة المشرفين — بحسب العيادة أو القسم أو الشخص.",
    },
  },
];

export const audiences = [
  {
    key: "universities",
    icon: GraduationCap,
    eyebrow: { en: "For universities", ar: "للجامعات" },
    title: { en: "Run the clinical rotation, not the paperwork", ar: "أدر التدريب السريري لا الأوراق" },
    description: {
      en: "Allocate cases to students by requirement, supervise them step by step, and produce the competency evidence your accreditation body asks for — without a single paper logbook.",
      ar: "وزّع الحالات على الطلاب حسب المتطلبات، وأشرف خطوة بخطوة، وأنتج أدلة الكفاءة المطلوبة للاعتماد — دون سجل ورقي واحد.",
    },
    image: images.dashboard,
    to: site.universities,
    cta: { en: "University programme", ar: "برنامج الجامعات" },
    points: [
      { en: "Requirement counters per department and per student", ar: "عدادات المتطلبات لكل قسم وطالب" },
      { en: "Supervisor sign-off with signature and grade", ar: "اعتماد المشرف بالتوقيع والدرجة" },
      { en: "Accreditation exports in one click", ar: "تصدير ملفات الاعتماد بنقرة واحدة" },
    ],
  },
  {
    key: "clinics",
    icon: Users,
    eyebrow: { en: "For clinics", ar: "للعيادات" },
    title: { en: "One record, every role, no double entry", ar: "سجل واحد، كل الأدوار، دون ازدواج" },
    description: {
      en: "The dentist charts, the assistant turns the room, the front desk takes payment and the lab moves the case — each from a dashboard built for that job, all on the same record.",
      ar: "الطبيب يرسم، والمساعد يجهّز الغرفة، والاستقبال يحصّل، والمعمل يحرك الحالة — كل من لوحة مصممة لعمله وعلى نفس السجل.",
    },
    image: images.dashboardAlt,
    to: site.clinics,
    cta: { en: "Clinic programme", ar: "برنامج العيادات" },
    points: [
      { en: "Four role dashboards out of the box", ar: "أربع لوحات أدوار جاهزة" },
      { en: "Clinical and financial data kept separate", ar: "فصل البيانات السريرية عن المالية" },
      { en: "Multi-branch reporting for owners", ar: "تقارير متعددة الفروع للملاك" },
    ],
  },
];

export const assurance = [
  {
    key: "standards",
    icon: ShieldCheck,
    title: { en: "Clinical standards built in", ar: "معايير سريرية مدمجة" },
    description: {
      en: "FDI tooth identity, ICDAS caries scoring and CDT procedure codes — so your data leaves Odenta as cleanly as it arrived.",
      ar: "ترقيم FDI وتصنيف ICDAS ورموز CDT — لتخرج بياناتك من أودنتا بنفس نظافة دخولها.",
    },
  },
  {
    key: "model",
    icon: Brain,
    title: { en: "A model that shows its work", ar: "نموذج يوضح عمله" },
    description: {
      en: "Every finding carries a confidence score and a bounding box. The clinician confirms or rejects it, and that decision is what gets stored.",
      ar: "كل نتيجة تحمل درجة ثقة ومربع تحديد. يؤكدها الطبيب أو يرفضها، والقرار هو ما يُخزَّن.",
    },
  },
  {
    key: "migration",
    icon: Boxes,
    title: { en: "Bring your existing records", ar: "انقل سجلاتك الحالية" },
    description: {
      en: "Patients, appointment history and radiographs import from CSV or an existing system, with a dry run before anything is written.",
      ar: "استيراد المرضى وتاريخ المواعيد والأشعة من CSV أو نظام قائم، مع تجربة أولية قبل الكتابة.",
    },
  },
];
