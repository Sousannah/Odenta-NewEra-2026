import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Clock3,
  Facebook,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Youtube,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { site } from "@/config/paths";
import { siteService } from "@/services";
import { useLanguage, useT } from "@/site/i18n/LanguageContext";
import {
  contactDetails,
  footerColumns,
  footerCopy,
  socialLinks,
} from "@/site/content/navigation";
import { SiteLogo } from "@/site/components/SiteLogo";

const SOCIAL_ICON = {
  facebook: Facebook,
  instagram: Instagram,
  linkedin: Linkedin,
  youtube: Youtube,
};

function NewsletterForm() {
  const t = useT();
  const { isRtl } = useLanguage();
  const [email, setEmail] = useState("");
  const [state, setState] = useState("idle"); // idle | busy | done | error

  const submit = async (event) => {
    event.preventDefault();
    if (!email.trim()) return;
    setState("busy");
    try {
      await siteService.subscribeToNewsletter({ email });
      setState("done");
      setEmail("");
    } catch {
      setState("error");
    }
  };

  if (state === "done") {
    return (
      <p className="rounded-2xl border border-accent-200 bg-accent-50 px-4 py-3 text-[14px] font-semibold text-accent-700">
        {t(footerCopy.newsletterDone)}
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
      <label className="sr-only" htmlFor="newsletter-email">
        {t(footerCopy.newsletterPlaceholder)}
      </label>
      <input
        id="newsletter-email"
        type="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder={t(footerCopy.newsletterPlaceholder)}
        className="h-12 min-w-0 flex-1 rounded-full border border-slate-200 bg-white px-5 text-sm text-ink placeholder:text-ink-faint transition focus:border-accent-400 focus:outline-none focus:ring-4 focus:ring-accent-500/15"
      />
      <button
        type="submit"
        disabled={state === "busy"}
        className="od-cta shrink-0 px-6 py-3 text-[14px] disabled:opacity-70"
      >
        {t(footerCopy.newsletterCta)}
        <ArrowRight className={cn("h-4 w-4", isRtl && "rotate-180")} />
      </button>
    </form>
  );
}

export function SiteFooter() {
  const t = useT();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 bg-od-gradient-soft">
      <div className="od-container py-16 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-12">
          {/* brand + social */}
          <div className="lg:col-span-4">
            <SiteLogo size="lg" />
            <p className="mt-6 max-w-sm text-[15px] leading-relaxed text-ink-muted">
              {t(footerCopy.description)}
            </p>

            <div className="mt-7 flex items-center gap-3">
              {socialLinks.map((item) => {
                const Icon = SOCIAL_ICON[item.key];
                return (
                  <a
                    key={item.key}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={item.label}
                    className="od-focus flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-brand-600 transition hover:-translate-y-0.5 hover:border-transparent hover:bg-od-gradient hover:text-white hover:shadow-brand"
                  >
                    <Icon className="h-[18px] w-[18px]" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* link columns */}
          <div className="grid gap-8 sm:grid-cols-3 lg:col-span-5">
            {footerColumns.map((column) => (
              <div key={column.key}>
                <h3 className="text-[13px] font-extrabold uppercase tracking-[0.12em] text-brand-700">
                  {t(column.title)}
                </h3>
                <ul className="mt-5 flex flex-col gap-3">
                  {column.links.map((link) => (
                    <li key={link.to}>
                      <Link
                        to={link.to}
                        className="od-focus text-[15px] text-ink-muted transition hover:text-accent-600"
                      >
                        {t(link.label)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* contact + newsletter */}
          <div className="lg:col-span-3">
            <h3 className="text-[13px] font-extrabold uppercase tracking-[0.12em] text-brand-700">
              {t(footerCopy.newsletterTitle)}
            </h3>
            <p className="mt-5 text-[15px] leading-relaxed text-ink-muted">
              {t(footerCopy.newsletterBody)}
            </p>
            <div className="mt-5">
              <NewsletterForm />
            </div>

            <ul className="mt-8 flex flex-col gap-3 text-[14px] text-ink-muted">
              <li className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-accent-600" />
                <a href={`mailto:${contactDetails.email}`} className="hover:text-accent-600">
                  {contactDetails.email}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-accent-600" />
                <a href={`tel:${contactDetails.phone.replace(/\s/g, "")}`} className="hover:text-accent-600">
                  {contactDetails.phone}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent-600" />
                {t(contactDetails.address)}
              </li>
              <li className="flex items-start gap-3">
                <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-accent-600" />
                {t(contactDetails.hours)}
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-8 text-[13px] text-ink-soft md:flex-row">
          <span>
            © {year} {t(footerCopy.rights)}
          </span>
          <div className="flex items-center gap-6">
            <Link to={site.privacy} className="hover:text-accent-600">
              {t({ en: "Privacy", ar: "الخصوصية" })}
            </Link>
            <Link to={site.terms} className="hover:text-accent-600">
              {t({ en: "Terms", ar: "الشروط" })}
            </Link>
            <Link to={site.contact} className="hover:text-accent-600">
              {t({ en: "Support", ar: "الدعم" })}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
