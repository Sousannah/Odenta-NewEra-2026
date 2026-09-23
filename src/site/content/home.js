import {
  Activity,
  BarChart3,
  Brain,
  CalendarCheck,
  ClipboardCheck,
  GraduationCap,
  Lock,
  ScanLine,
  ShieldCheck,
  Stethoscope,
  Users,
  Workflow,
} from "lucide-react";
import { site, auth } from "@/config/paths";
import { images } from "@/theme/assets";

/** Home page copy. Strings are `{ en, ar }`; `useT()` resolves them. */

export const hero = {
  eyebrow: { en: "AI dental platform", ar: "منصة أسنان بالذكاء الاصطناعي" },
  title: { en: "Revolutionising", ar: "ثورة في" },
  highlight: { en: "dental care with AI", ar: "رعاية الأسنان بالذكاء الاصطناعي" },
  description: {
    en: "Odenta joins clinical-grade radiograph analysis to the everyday work of a dental school and a dental clinic — charting, supervision, scheduling and billing on one patient record.",
    ar: "تجمع أودنتا بين تحليل الأشعة بجودة سريرية والعمل اليومي لكليات وعيادات الأسنان — الرسم البياني والإشراف والجدولة والفوترة على سجل واحد للمريض.",
  },
  primary: { label: { en: "Explore the platform", ar: "استكشف المنصة" }, to: site.services },
  secondary: { label: { en: "Try our AI", ar: "جرّب الذكاء الاصطناعي" }, to: site.tryAi },
  image: images.heroClinician,
  imageAlt: {
    en: "Clinician reviewing an AI-annotated dental radiograph",
    ar: "طبيب يراجع أشعة أسنان محللة بالذكاء الاصطناعي",
  },
  badge: {
    value: "95%",
    label: { en: "AI detection accuracy", ar: "دقة الاكتشاف بالذكاء الاصطناعي" },
  },
};

export const trustStats = [
  { key: "accuracy", value: "95%", label: { en: "Detection accuracy", ar: "دقة الاكتشاف" } },
  { key: "cases", value: "69k+", label: { en: "Cases reviewed", ar: "حالة تمت مراجعتها" } },
  { key: "students", value: "2,240", label: { en: "Students on Odenta", ar: "طالب على أودنتا" } },
  { key: "time", value: "2.4s", label: { en: "Average analysis time", ar: "متوسط زمن التحليل" } },
];

export const features = [
  {
    key: "ai-xray",
    icon: ScanLine,
    title: { en: "AI X-ray analysis", ar: "تحليل الأشعة بالذكاء الاصطناعي" },
    description: {
      en: "Caries, periapical lesions, bone loss and impactions detected on panoramic, periapical and bitewing films — each finding boxed, scored and tied to an FDI tooth number.",
      ar: "اكتشاف التسوس والآفات حول الذروية وفقدان العظم والانطمار على الأشعة البانورامية والذروية — كل نتيجة محددة ومُقيّمة ومرتبطة برقم السن.",
    },
    cta: { en: "See it work", ar: "شاهده يعمل" },
    to: site.tryAi,
  },
  {
    key: "student-workflow",
    icon: GraduationCap,
    title: { en: "Student workflow", ar: "سير عمل الطالب" },
    description: {
      en: "Case allocation, requirement tracking and department sheets for operative, endodontics, prosthodontics and periodontics — the whole rotation in one queue.",
      ar: "توزيع الحالات وتتبع المتطلبات وأوراق الأقسام — التدريب السريري بالكامل في قائمة واحدة.",
    },
    cta: { en: "For universities", ar: "للجامعات" },
    to: site.universities,
  },
  {
    key: "supervisor-review",
    icon: ClipboardCheck,
    title: { en: "Supervisor review", ar: "مراجعة المشرف" },
    description: {
      en: "Step-by-step sign-off with annotations, grades and a signature trail. Every approval is attributable, timestamped and exportable for accreditation.",
      ar: "اعتماد خطوة بخطوة مع الملاحظات والدرجات وسجل التوقيع. كل موافقة موثقة بالوقت وقابلة للتصدير للاعتماد.",
    },
  },
  {
    key: "charting",
    icon: Stethoscope,
    title: { en: "Digital charting", ar: "الرسم البياني الرقمي" },
    description: {
      en: "A surface-level odontogram in FDI, Universal and Palmer notation, with six-point periodontal charting and ICDAS caries scoring built in.",
      ar: "مخطط أسنان بمستوى الأسطح بترقيم FDI وUniversal وPalmer، مع رسم لثوي بست نقاط وتصنيف ICDAS للتسوس.",
    },
  },
  {
    key: "analytics",
    icon: BarChart3,
    title: { en: "Practice analytics", ar: "تحليلات الممارسة" },
    description: {
      en: "Chair utilisation, revenue per treatment, student competency progress and supervisor turnaround — reported per clinic, per department, per person.",
      ar: "استغلال الكراسي والإيراد لكل علاج وتقدم كفاءة الطلاب وسرعة استجابة المشرفين — تقارير لكل عيادة وقسم وشخص.",
    },
  },
  {
    key: "appointments",
    icon: CalendarCheck,
    title: { en: "Scheduling & recalls", ar: "الجدولة والمتابعة" },
    description: {
      en: "Chair-by-chair calendar, waitlist, check-in and automated recalls — with the front desk taking payment without ever opening a clinical note.",
      ar: "تقويم لكل كرسي وقائمة انتظار وتسجيل وصول ومتابعات تلقائية — مع تحصيل الاستقبال للمدفوعات دون فتح أي ملاحظة سريرية.",
    },
  },
];

export const aiSection = {
  eyebrow: { en: "The model", ar: "النموذج" },
  title: { en: "Powered by", ar: "مدعوم بـ" },
  highlight: { en: "advanced AI", ar: "ذكاء اصطناعي متقدم" },
  description: {
    en: "Odenta Vision is trained on annotated clinical radiographs and validated against specialist consensus. It reports what it sees, how sure it is, and where — never a diagnosis without evidence.",
    ar: "تم تدريب Odenta Vision على أشعة سريرية موصوفة والتحقق منه مقابل إجماع الأخصائيين. يقدم ما يراه ومدى ثقته وموضعه — لا تشخيص دون دليل.",
  },
  image: images.xray,
  imageAlt: { en: "Annotated dental radiograph", ar: "أشعة أسنان موصوفة" },
  points: [
    {
      key: "realtime",
      icon: Brain,
      title: { en: "Real-time analysis", ar: "تحليل فوري" },
      description: {
        en: "Results in about two seconds, with bounding boxes drawn over the film and a confidence score on every finding.",
        ar: "نتائج خلال ثانيتين تقريبًا، مع مربعات تحديد على الصورة ودرجة ثقة لكل نتيجة.",
      },
    },
    {
      key: "accuracy",
      icon: ShieldCheck,
      title: { en: "Clinical accuracy", ar: "دقة سريرية" },
      description: {
        en: "95% detection accuracy across common conditions, measured against dentist-labelled ground truth rather than a held-out split alone.",
        ar: "دقة اكتشاف ٩٥٪ في الحالات الشائعة، مقاسة مقابل تصنيف أطباء الأسنان.",
      },
    },
    {
      key: "learning",
      icon: GraduationCap,
      title: { en: "Learning assistant", ar: "مساعد تعليمي" },
      description: {
        en: "Students compare their own reading to the model's, and supervisors see both — disagreement becomes a teaching moment, not a hidden error.",
        ar: "يقارن الطلاب قراءتهم بقراءة النموذج، ويرى المشرفون الاثنين — الاختلاف يصبح فرصة تعليمية لا خطأً مخفيًا.",
      },
    },
  ],
};

export const workflow = {
  eyebrow: { en: "How it works", ar: "كيف تعمل" },
  title: { en: "A simple", ar: "سير عمل" },
  highlight: { en: "workflow", ar: "بسيط" },
  description: {
    en: "Three steps from an unassigned patient to a signed-off, billed case — the same path whether you run a teaching hospital or a five-chair practice.",
    ar: "ثلاث خطوات من مريض غير مخصص إلى حالة معتمدة ومفوترة — نفس المسار سواء كنت مستشفى تعليميًا أو عيادة بخمسة كراسي.",
  },
  steps: [
    {
      key: "capture",
      number: "1",
      icon: Users,
      title: { en: "Capture the case", ar: "سجّل الحالة" },
      image: images.dashboard,
      points: [
        { en: "Register the patient and pull the medical history", ar: "سجّل المريض واستدعِ التاريخ الطبي" },
        { en: "Upload radiographs and clinical photography", ar: "ارفع الأشعة والصور السريرية" },
        { en: "Chart existing conditions on the odontogram", ar: "سجّل الحالات القائمة على مخطط الأسنان" },
      ],
      cta: { label: { en: "University tools", ar: "أدوات الجامعة" }, to: site.universities },
    },
    {
      key: "analyse",
      number: "2",
      icon: Brain,
      title: { en: "Analyse and plan", ar: "حلّل وخطّط" },
      image: images.aiAnalysis,
      points: [
        { en: "AI returns boxed findings with confidence scores", ar: "يعيد الذكاء الاصطناعي نتائج محددة بدرجات ثقة" },
        { en: "Build a CDT-coded treatment plan from the findings", ar: "ابنِ خطة علاج مرمّزة انطلاقًا من النتائج" },
        { en: "Capture consent and estimate the patient's share", ar: "وثّق الموافقة وقدّر حصة المريض" },
      ],
      cta: { label: { en: "Try our AI", ar: "جرّب الذكاء الاصطناعي" }, to: site.tryAi },
    },
    {
      key: "deliver",
      number: "3",
      icon: Workflow,
      title: { en: "Deliver and sign off", ar: "نفّذ واعتمد" },
      image: images.dashboardAlt,
      points: [
        { en: "Supervisor reviews each step and signs it", ar: "يراجع المشرف كل خطوة ويعتمدها" },
        { en: "Lab cases, sterilisation and stock move with the case", ar: "تتحرك حالات المعمل والتعقيم والمخزون مع الحالة" },
        { en: "Front desk bills, takes payment and books the recall", ar: "يفوتر الاستقبال ويحصّل ويحجز المتابعة" },
      ],
      cta: { label: { en: "Clinic tools", ar: "أدوات العيادة" }, to: site.clinics },
    },
  ],
};

export const rolesSection = {
  eyebrow: { en: "Role based", ar: "قائم على الأدوار" },
  title: { en: "One record.", ar: "سجل واحد." },
  highlight: { en: "Four ways of working.", ar: "أربع طرق للعمل." },
  description: {
    en: "Four roles, because that is what a clinic here actually has. Everyone who touches a case gets a dashboard shaped around their job — and sees only what that job needs. The split is enforced by permissions, not by convention.",
    ar: "أربعة أدوار، لأن هذا ما تحتاجه العيادة فعليًا. كل من يتعامل مع الحالة لديه لوحة مصممة لعمله — ويرى فقط ما يحتاجه. الفصل مفروض بالصلاحيات لا بالعُرف.",
  },
  cta: { label: { en: "Sign in to the portal", ar: "ادخل إلى البوابة" }, to: auth.signIn },
  roles: [
    { key: "owner", label: { en: "Clinic owner", ar: "مالك العيادة" }, description: { en: "Revenue, chair utilisation, outstanding balances and the team", ar: "الإيرادات واستغلال الكراسي والمستحقات والفريق" } },
    { key: "dentist", label: { en: "Dentist", ar: "طبيب الأسنان" }, description: { en: "Today's list, charting, plans, prescriptions and lab work", ar: "قائمة اليوم والرسم والخطط والوصفات وأعمال المعمل" } },
    { key: "assistant", label: { en: "Dental assistant", ar: "مساعد الأسنان" }, description: { en: "Room turnover, sterilisation log, consumables and impressions", ar: "تجهيز الغرف وسجل التعقيم والمستهلكات والطبعات" } },
    { key: "receptionist", label: { en: "Reception", ar: "الاستقبال" }, description: { en: "Booking, check-in, recalls, payment and chasing the lab", ar: "الحجز والتسجيل والمتابعات والدفع ومتابعة المعمل" } },
  ],
};

export const trustSection = {
  eyebrow: { en: "Built for clinical data", ar: "مبني لبيانات سريرية" },
  title: { en: "Patient data handled", ar: "بيانات المرضى تُدار" },
  highlight: { en: "the way it should be", ar: "كما ينبغي" },
  points: [
    {
      key: "permissions",
      icon: Lock,
      title: { en: "Least privilege by default", ar: "أقل صلاحية افتراضيًا" },
      description: {
        en: "Demographics and clinical records are separate permissions. A receptionist can take a payment without opening a treatment note.",
        ar: "البيانات الشخصية والسجلات السريرية صلاحيات منفصلة. يمكن للاستقبال تحصيل الدفع دون فتح ملاحظة علاجية.",
      },
    },
    {
      key: "audit",
      icon: Activity,
      title: { en: "Every read is logged", ar: "كل اطلاع مُسجّل" },
      description: {
        en: "Who opened which record, when, and from where — an audit trail an accreditation review can actually work through.",
        ar: "من فتح أي سجل ومتى ومن أين — سجل مراجعة يمكن لجهة الاعتماد العمل عليه فعلًا.",
      },
    },
    {
      key: "standards",
      icon: ShieldCheck,
      title: { en: "Standards, not conventions", ar: "معايير لا أعراف" },
      description: {
        en: "FDI tooth identity, ICDAS caries scoring, CDT procedure codes and six-point perio depths — stored as data, not as free text.",
        ar: "ترقيم FDI وتصنيف ICDAS ورموز CDT وأعماق اللثة بست نقاط — مخزّنة كبيانات لا كنص حر.",
      },
    },
  ],
};

export const testimonialsSection = {
  eyebrow: { en: "From the chairs", ar: "من الكراسي" },
  title: { en: "What clinicians", ar: "ماذا يقول" },
  highlight: { en: "tell us", ar: "الأطباء" },
};
