import { Compass, Home } from "lucide-react";
import { site } from "@/config/paths";
import { useT } from "@/site/i18n/LanguageContext";
import { Reveal, SiteButton } from "@/site/components";

export default function SiteNotFoundPage() {
  const t = useT();

  return (
    <section className="relative flex min-h-[70vh] items-center overflow-hidden bg-white bg-od-radial">
      <div className="od-container">
        <Reveal className="mx-auto flex max-w-xl flex-col items-center text-center">
          <span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-od-gradient text-white shadow-brand">
            <Compass className="h-9 w-9" />
          </span>

          <p className="mt-8 text-[64px] font-extrabold leading-none od-gradient-text">404</p>

          <h1 className="mt-4 text-[28px] font-extrabold text-brand-700">
            {t({ en: "This page has moved on", ar: "هذه الصفحة لم تعد موجودة" })}
          </h1>

          <p className="mt-4 text-[16px] leading-relaxed text-ink-muted">
            {t({
              en: "The link may be old, or the page may have been renamed. Everything on the site is one hop from the home page.",
              ar: "قد يكون الرابط قديمًا أو تم تغيير اسم الصفحة. كل محتوى الموقع على بعد خطوة من الصفحة الرئيسية.",
            })}
          </p>

          <div className="mt-9 flex flex-col gap-4 sm:flex-row">
            <SiteButton to={site.home} leftIcon={<Home className="h-4 w-4" />}>
              {t({ en: "Back to home", ar: "العودة للرئيسية" })}
            </SiteButton>
            <SiteButton variant="ghost" to={site.contact}>
              {t({ en: "Contact us", ar: "تواصل معنا" })}
            </SiteButton>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
