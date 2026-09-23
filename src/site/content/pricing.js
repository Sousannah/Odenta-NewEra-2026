import { site } from "@/config/paths";

/** Pricing page: plans, what is in each, and the questions people always ask. */

export const hero = {
  eyebrow: { en: "Pricing", ar: "الأسعار" },
  title: { en: "Priced per chair,", ar: "التسعير لكل كرسي،" },
  highlight: { en: "not per surprise", ar: "بلا مفاجآت" },
  description: {
    en: "One number per active chair per month. Imaging, charting, scheduling, billing and support are in every plan — the tiers differ by scale and governance, not by holding features hostage.",
    ar: "رقم واحد لكل كرسي فعّال شهريًا. التصوير والرسم والجدولة والفوترة والدعم في كل الخطط — الفروق في الحجم والحوكمة لا في حجب المزايا.",
  },
};

export const plans = [
  {
    key: "practice",
    name: { en: "Practice", ar: "العيادة" },
    price: { en: "$79", ar: "٧٩$" },
    unit: { en: "per chair / month", ar: "لكل كرسي / شهريًا" },
    description: {
      en: "For single-site clinics up to eight chairs.",
      ar: "للعيادات ذات الموقع الواحد حتى ثمانية كراسي.",
    },
    cta: { label: { en: "Start a trial", ar: "ابدأ تجربة" }, to: site.contact },
    features: [
      { en: "All clinical and finance modules", ar: "كل الوحدات السريرية والمالية" },
      { en: "AI imaging — 400 analyses a month", ar: "تصوير بالذكاء الاصطناعي — ٤٠٠ تحليل شهريًا" },
      { en: "Four role dashboards", ar: "أربع لوحات أدوار" },
      { en: "Email support, next working day", ar: "دعم بالبريد خلال يوم عمل" },
    ],
  },
  {
    key: "group",
    name: { en: "Group", ar: "المجموعة" },
    price: { en: "$64", ar: "٦٤$" },
    unit: { en: "per chair / month", ar: "لكل كرسي / شهريًا" },
    featured: true,
    badge: { en: "Most chosen", ar: "الأكثر اختيارًا" },
    description: {
      en: "For multi-branch groups that report across sites.",
      ar: "للمجموعات متعددة الفروع التي تحتاج تقارير موحدة.",
    },
    cta: { label: { en: "Book a demo", ar: "احجز عرضًا" }, to: site.contact },
    features: [
      { en: "Everything in Practice", ar: "كل ما في خطة العيادة" },
      { en: "Unlimited AI analyses", ar: "تحليلات غير محدودة" },
      { en: "Multi-branch reporting and consolidation", ar: "تقارير موحدة متعددة الفروع" },
      { en: "Custom roles and permission sets", ar: "أدوار وصلاحيات مخصصة" },
      { en: "Priority support with a named contact", ar: "دعم أولوية بمسؤول محدد" },
    ],
  },
  {
    key: "university",
    name: { en: "University", ar: "الجامعة" },
    price: { en: "Custom", ar: "حسب الطلب" },
    unit: { en: "per campus / year", ar: "لكل حرم / سنويًا" },
    description: {
      en: "For dental schools and teaching hospitals.",
      ar: "لكليات الأسنان والمستشفيات التعليمية.",
    },
    cta: { label: { en: "Talk to us", ar: "تحدث إلينا" }, to: site.contact },
    features: [
      { en: "Everything in Group", ar: "كل ما في خطة المجموعة" },
      { en: "Student workflow and requirement tracking", ar: "سير عمل الطلاب وتتبع المتطلبات" },
      { en: "Supervisor sign-off and signature manager", ar: "اعتماد المشرفين وإدارة التوقيعات" },
      { en: "Accreditation exports and competency reports", ar: "تقارير الاعتماد والكفاءات" },
      { en: "Onboarding for every cohort, every year", ar: "تدريب لكل دفعة كل عام" },
    ],
  },
];

export const included = {
  title: { en: "In every", ar: "في كل" },
  highlight: { en: "plan", ar: "خطة" },
  items: [
    { en: "Unlimited patient records", ar: "سجلات مرضى غير محدودة" },
    { en: "Unlimited staff accounts", ar: "حسابات موظفين غير محدودة" },
    { en: "FDI, ICDAS and CDT standards", ar: "معايير FDI وICDAS وCDT" },
    { en: "Full audit log", ar: "سجل مراجعة كامل" },
    { en: "Data export, any time", ar: "تصدير البيانات في أي وقت" },
    { en: "Migration from your current system", ar: "نقل من نظامك الحالي" },
  ],
};

export const faqs = [
  {
    key: "chairs",
    question: { en: "What counts as a chair?", ar: "ما الذي يُحتسب ككرسي؟" },
    answer: {
      en: "A treatment chair that saw at least one appointment in the billing month. A chair standing idle through a quiet month is not billed.",
      ar: "كرسي علاج استقبل موعدًا واحدًا على الأقل خلال شهر الفوترة. الكرسي غير المستخدم لا يُحتسب.",
    },
  },
  {
    key: "trial",
    question: { en: "Is there a trial?", ar: "هل هناك فترة تجريبية؟" },
    answer: {
      en: "Thirty days on the Practice plan with your own data, migrated by us. No card, and the export button works throughout.",
      ar: "ثلاثون يومًا على خطة العيادة ببياناتك ننقلها لك. دون بطاقة، وزر التصدير يعمل طوال الفترة.",
    },
  },
  {
    key: "data",
    question: { en: "Who owns the clinical data?", ar: "من يملك البيانات السريرية؟" },
    answer: {
      en: "You do. Export the full record set — patients, charts, images, plans and finance — as structured files whenever you want, including on the day you leave.",
      ar: "أنت. يمكنك تصدير كل السجلات — المرضى والمخططات والصور والخطط والمالية — كملفات مهيكلة في أي وقت، حتى يوم مغادرتك.",
    },
  },
  {
    key: "ai",
    question: { en: "Is the AI an extra?", ar: "هل الذكاء الاصطناعي إضافة مدفوعة؟" },
    answer: {
      en: "No. Imaging is in every plan; only the monthly analysis allowance changes, and it is a soft limit — we call you before anything stops.",
      ar: "لا. التصوير في كل الخطط؛ يتغير فقط الحد الشهري للتحليلات، وهو حد مرن — نتصل بك قبل توقف أي شيء.",
    },
  },
  {
    key: "hosting",
    question: { en: "Where is the data hosted?", ar: "أين تُستضاف البيانات؟" },
    answer: {
      en: "In the region you choose at onboarding. Universities that require on-premise hosting are supported on the University plan.",
      ar: "في المنطقة التي تختارها عند التفعيل. الجامعات التي تتطلب استضافة داخلية مدعومة في خطة الجامعة.",
    },
  },
];
