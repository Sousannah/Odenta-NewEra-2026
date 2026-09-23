import { site, auth } from "@/config/paths";

/**
 * Public site chrome — header links, footer columns, contact details.
 *
 * Copy is `{ en, ar }`; `useT()` resolves it. Keeping it here (rather than in
 * the components) means a CMS can replace this module wholesale later.
 */

/** The brand line from the Odenta posts. */
export const slogan = {
  en: "Smarter Dentistry, Better Care.",
  ar: "طب أسنان أذكى، ورعاية أفضل.",
};

export const primaryNav = [
  { key: "universities", to: site.universities, label: { en: "Universities", ar: "الجامعات" } },
  { key: "clinics", to: site.clinics, label: { en: "Clinics", ar: "العيادات" } },
  { key: "services", to: site.services, label: { en: "Services", ar: "الخدمات" } },
  { key: "demo", to: site.demo, label: { en: "Book a demo", ar: "احجز عرضًا" } },
  { key: "contact", to: site.contact, label: { en: "Contact", ar: "تواصل معنا" } },
];

export const headerActions = {
  signIn: { to: auth.signIn, label: { en: "Login", ar: "تسجيل الدخول" } },
  dashboard: { label: { en: "My dashboard", ar: "لوحتي" } },
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
  { key: "instagram", label: "Instagram", handle: "@odenta.eg", href: "https://www.instagram.com/odenta.eg/" },
  { key: "linkedin", label: "LinkedIn", handle: "Odenta", href: "https://www.linkedin.com/company/odenta-eg" },
];

export const footerColumns = [
  {
    key: "explore",
    title: { en: "Explore", ar: "استكشف" },
    links: [
      { label: { en: "Universities", ar: "الجامعات" }, to: site.universities },
      { label: { en: "Clinics", ar: "العيادات" }, to: site.clinics },
      { label: { en: "Services", ar: "الخدمات" }, to: site.services },
    ],
  },
  {
    key: "company",
    title: { en: "Odenta", ar: "أودنتا" },
    links: [
      { label: { en: "Book a demo", ar: "احجز عرضًا" }, to: site.demo },
      { label: { en: "Contact", ar: "تواصل معنا" }, to: site.contact },
      { label: { en: "Login", ar: "تسجيل الدخول" }, to: auth.signIn },
    ],
  },
  {
    key: "legal",
    title: { en: "Legal", ar: "قانوني" },
    links: [
      { label: { en: "Privacy", ar: "الخصوصية" }, to: site.privacy },
      { label: { en: "Terms", ar: "الشروط" }, to: site.terms },
    ],
  },
];

export const footerCopy = {
  description: {
    en: "The future of dentistry, connected. One digital ecosystem for dental universities, clinics and the people they care for.",
    ar: "مستقبل طب الأسنان، متصل. منظومة رقمية واحدة لكليات طب الأسنان والعيادات ومن يرعونهم.",
  },
  rights: { en: "Odenta. All rights reserved.", ar: "أودنتا. جميع الحقوق محفوظة." },
  madeIn: { en: "Designed and built in Egypt.", ar: "صُمم وبُني في مصر." },
};

export const common = {
  learnMore: { en: "Learn more", ar: "اعرف المزيد" },
  getStarted: { en: "Get started", ar: "ابدأ الآن" },
  bookDemo: { en: "Book a demo", ar: "احجز عرضًا" },
  talkToUs: { en: "Talk to us", ar: "تحدث إلينا" },
  contactUs: { en: "Contact us", ar: "تواصل معنا" },
  explore: { en: "Explore", ar: "استكشف" },
  openPortal: { en: "Open the portal", ar: "افتح البوابة" },
  bookVisit: { en: "Book a visit", ar: "احجز موعدًا" },
  backHome: { en: "Back to home", ar: "العودة للرئيسية" },
};
