import { site, auth } from "@/config/paths";

/**
 * Public site chrome — header links, footer columns, contact details.
 *
 * Copy is `{ en, ar }`; `useT()` resolves it. Keeping it here (rather than in
 * the components) means a CMS can replace this module wholesale later.
 */

export const primaryNav = [
  { key: "home", to: site.home, label: { en: "Home", ar: "الرئيسية" }, end: true },
  { key: "universities", to: site.universities, label: { en: "Universities", ar: "الجامعات" } },
  { key: "clinics", to: site.clinics, label: { en: "Clinics", ar: "العيادات" } },
  { key: "services", to: site.services, label: { en: "Services", ar: "الخدمات" } },
  { key: "book", to: site.book, label: { en: "Book a visit", ar: "احجز موعدًا" } },
  { key: "pricing", to: site.pricing, label: { en: "Pricing", ar: "الأسعار" } },
  { key: "contact", to: site.contact, label: { en: "Contact", ar: "تواصل معنا" } },
];

export const headerActions = {
  signIn: { to: auth.signIn, label: { en: "Login", ar: "تسجيل الدخول" } },
  tryAi: { to: site.tryAi, label: { en: "Try Our AI", ar: "جرّب الذكاء الاصطناعي" } },
};

export const contactDetails = {
  email: "hello@odenta.ai",
  supportEmail: "support@odenta.ai",
  phone: "+20 155 000 4321",
  address: {
    en: "Alamein International University, New Alamein City, Egypt",
    ar: "جامعة العلمين الدولية، مدينة العلمين الجديدة، مصر",
  },
  hours: {
    en: "Sunday – Thursday, 9:00 – 17:00 EET",
    ar: "الأحد – الخميس، ٩:٠٠ – ١٧:٠٠",
  },
};

export const socialLinks = [
  { key: "facebook", label: "Facebook", href: "https://facebook.com/odenta" },
  { key: "instagram", label: "Instagram", href: "https://instagram.com/odenta" },
  { key: "linkedin", label: "LinkedIn", href: "https://linkedin.com/company/odenta" },
  { key: "youtube", label: "YouTube", href: "https://youtube.com/@odenta" },
];

export const footerColumns = [
  {
    key: "platform",
    title: { en: "Platform", ar: "المنصة" },
    links: [
      { label: { en: "Services", ar: "الخدمات" }, to: site.services },
      { label: { en: "For universities", ar: "للجامعات" }, to: site.universityServices },
      { label: { en: "Partner universities", ar: "الجامعات الشريكة" }, to: site.universities },
      { label: { en: "For clinics", ar: "للعيادات" }, to: site.clinics },
      { label: { en: "Pricing", ar: "الأسعار" }, to: site.pricing },
      { label: { en: "Try our AI", ar: "جرّب الذكاء الاصطناعي" }, to: site.tryAi },
    ],
  },
  {
    key: "patients",
    title: { en: "Patients", ar: "المرضى" },
    links: [
      { label: { en: "Book a visit", ar: "احجز موعدًا" }, to: site.book },
      { label: { en: "University clinics", ar: "عيادات الجامعات" }, to: site.universities },
      { label: { en: "Contact the clinic", ar: "تواصل مع العيادة" }, to: site.contact },
    ],
  },
  {
    key: "company",
    title: { en: "Company", ar: "الشركة" },
    links: [
      { label: { en: "About Odenta", ar: "عن أودنتا" }, to: site.about },
      { label: { en: "Contact", ar: "تواصل معنا" }, to: site.contact },
      { label: { en: "Sign in", ar: "تسجيل الدخول" }, to: auth.signIn },
    ],
  },
  {
    key: "legal",
    title: { en: "Legal", ar: "قانوني" },
    links: [
      { label: { en: "Privacy policy", ar: "سياسة الخصوصية" }, to: site.privacy },
      { label: { en: "Terms of service", ar: "شروط الخدمة" }, to: site.terms },
    ],
  },
];

export const footerCopy = {
  description: {
    en: "Odenta pairs clinical-grade AI imaging with the day-to-day workflow of a dental school and a dental clinic — one patient record, every role.",
    ar: "تجمع أودنتا بين تحليل الأشعة بالذكاء الاصطناعي وسير العمل اليومي لكليات وعيادات طب الأسنان — سجل واحد للمريض، وكل الأدوار.",
  },
  newsletterTitle: { en: "Stay in the loop", ar: "ابقَ على اطلاع" },
  newsletterBody: {
    en: "Product releases, clinical research and university programme news. One email a month.",
    ar: "تحديثات المنتج وأبحاث سريرية وأخبار البرامج الجامعية. رسالة واحدة شهريًا.",
  },
  newsletterPlaceholder: { en: "Your work email", ar: "بريدك الإلكتروني" },
  newsletterCta: { en: "Subscribe", ar: "اشترك" },
  newsletterDone: { en: "You're on the list — thank you.", ar: "تم الاشتراك — شكرًا لك." },
  rights: {
    en: "Odenta. All rights reserved.",
    ar: "أودنتا. جميع الحقوق محفوظة.",
  },
};

export const common = {
  learnMore: { en: "Learn more", ar: "اعرف المزيد" },
  getStarted: { en: "Get started", ar: "ابدأ الآن" },
  bookDemo: { en: "Book a demo", ar: "احجز عرضًا توضيحيًا" },
  talkToUs: { en: "Talk to us", ar: "تحدث إلينا" },
  explore: { en: "Explore", ar: "استكشف" },
  openPortal: { en: "Open the portal", ar: "افتح البوابة" },
  bookVisit: { en: "Book a visit", ar: "احجز موعدًا" },
  backHome: { en: "Back to home", ar: "العودة للرئيسية" },
};
