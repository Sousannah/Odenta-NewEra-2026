import { Link } from "react-router-dom";
import { Instagram, Linkedin } from "lucide-react";
import { useT } from "@/site/i18n/LanguageContext";
import { footerColumns, footerCopy, slogan, socialLinks } from "@/site/content/navigation";
import { SiteLogo } from "@/site/components/SiteLogo";

const SOCIAL_ICON = { instagram: Instagram, linkedin: Linkedin };

export function SiteFooter() {
  const t = useT();
  const year = new Date().getFullYear();

  return (
    <footer className="relative z-10 px-3 pb-5 pt-10 sm:px-5">
      <div className="s-glass mx-auto max-w-7xl rounded-[32px] px-6 py-12 sm:px-10 lg:px-14">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <SiteLogo size="lg" />
            <p className="s-kicker mt-5 !text-[11px]">{t(slogan)}</p>
            <p className="s-muted mt-4 max-w-sm text-[15px] leading-relaxed">{t(footerCopy.description)}</p>

            <div className="mt-6 flex items-center gap-2.5">
              {socialLinks.map((item) => {
                const Icon = SOCIAL_ICON[item.key];
                return (
                  <a
                    key={item.key}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Odenta on ${item.label}`}
                    className="s-btn s-btn-glass h-10 w-10 !p-0"
                  >
                    <Icon className="h-[18px] w-[18px]" />
                  </a>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-7">
            {footerColumns.map((column) => (
              <div key={column.key}>
                <h3 className="s-soft text-[12px] font-semibold uppercase tracking-[0.16em]">{t(column.title)}</h3>
                <ul className="mt-4 flex flex-col gap-2.5">
                  {column.links.map((link) => (
                    <li key={link.to}>
                      <Link
                        to={link.to}
                        className="s-focus s-muted rounded text-[15px] transition hover:text-[var(--s-text)]"
                      >
                        {t(link.label)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="s-divider mt-12" />
        <div className="s-soft mt-6 flex flex-col items-center justify-between gap-2 text-[13px] sm:flex-row">
          <span>
            © {year} {t(footerCopy.rights)}
          </span>
          <span>{t(footerCopy.madeIn)}</span>
        </div>
      </div>
    </footer>
  );
}
