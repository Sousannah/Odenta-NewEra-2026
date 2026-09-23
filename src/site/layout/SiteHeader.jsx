import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { ArrowRight, Languages, LayoutDashboard, Menu, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { auth, site } from "@/config/paths";
import { useAuth } from "@/auth/AuthContext";
import { roleHome } from "@/auth/roles";
import { useLanguage, useT } from "@/site/i18n/LanguageContext";
import { headerActions, primaryNav } from "@/site/content/navigation";
import { SiteLogo } from "@/site/components/SiteLogo";
import { SiteButton } from "@/site/components/SiteButton";

/** Underline-on-hover link, filled when the route is active. */
function HeaderLink({ item, onNavigate }) {
  const t = useT();
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          "group relative py-1 text-[15.5px] font-semibold transition-colors duration-300",
          isActive ? "text-accent-600" : "text-brand-700 hover:text-accent-600"
        )
      }
    >
      {({ isActive }) => (
        <>
          {t(item.label)}
          <span
            className={cn(
              "absolute -bottom-0.5 start-0 h-0.5 rounded-full bg-od-gradient transition-all duration-300",
              isActive ? "w-full" : "w-0 group-hover:w-full"
            )}
          />
        </>
      )}
    </NavLink>
  );
}

export function SiteHeader() {
  const t = useT();
  const { language, toggle } = useLanguage();
  const { isAuthenticated, role } = useAuth();
  const { pathname } = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* a route change always closes the mobile sheet */
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b transition-all duration-300",
        scrolled
          ? "border-slate-200/80 bg-white/90 shadow-card backdrop-blur-lg"
          : "border-transparent bg-white"
      )}
    >
      <div className="od-container flex h-[76px] items-center gap-6">
        <SiteLogo />

        <nav className="hidden items-center gap-7 lg:flex">
          {primaryNav.map((item) => (
            <HeaderLink key={item.key} item={item} />
          ))}
        </nav>

        <div className="ms-auto flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={toggle}
            aria-label={language === "en" ? "التبديل إلى العربية" : "Switch to English"}
            className="od-focus hidden items-center gap-1.5 rounded-full px-3 py-2 text-[14px] font-bold text-brand-700 transition hover:bg-brand-50 hover:text-accent-600 sm:inline-flex"
          >
            <Languages className="h-4 w-4" />
            {language === "en" ? "العربية" : "English"}
          </button>

          {isAuthenticated ? (
            <SiteButton
              variant="ghost"
              size="sm"
              to={roleHome(role)}
              leftIcon={<LayoutDashboard className="h-4 w-4" />}
              className="hidden sm:inline-flex"
            >
              {t({ en: "My dashboard", ar: "لوحتي" })}
            </SiteButton>
          ) : (
            <SiteButton
              variant="ghost"
              size="sm"
              to={auth.signIn}
              className="hidden sm:inline-flex"
            >
              {t(headerActions.signIn.label)}
            </SiteButton>
          )}

          <SiteButton
            size="sm"
            to={site.tryAi}
            leftIcon={<Sparkles className="h-4 w-4" />}
            className="hidden md:inline-flex"
          >
            {t(headerActions.tryAi.label)}
          </SiteButton>

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="od-focus inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 text-brand-700 transition hover:border-accent-300 hover:text-accent-600 lg:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* mobile sheet */}
      <div
        className={cn(
          "overflow-hidden border-t border-slate-200 bg-white transition-[max-height,opacity] duration-300 lg:hidden",
          open ? "max-h-[75vh] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="od-container flex flex-col gap-1 py-5">
          {primaryNav.map((item) => (
            <NavLink
              key={item.key}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "rounded-xl px-4 py-3 text-[15.5px] font-bold transition",
                  isActive
                    ? "bg-brand-50 text-accent-600"
                    : "text-brand-700 hover:bg-brand-50/60 hover:text-accent-600"
                )
              }
            >
              {t(item.label)}
            </NavLink>
          ))}

          <div className="mt-3 flex flex-col gap-3 border-t border-slate-200 pt-4">
            <SiteButton
              to={isAuthenticated ? roleHome(role) : auth.signIn}
              variant="ghost"
              className="w-full"
            >
              {isAuthenticated ? t({ en: "My dashboard", ar: "لوحتي" }) : t(headerActions.signIn.label)}
            </SiteButton>
            <SiteButton to={site.tryAi} className="w-full" rightIcon={<ArrowRight className="h-4 w-4" />}>
              {t(headerActions.tryAi.label)}
            </SiteButton>
            <button
              type="button"
              onClick={toggle}
              className="od-focus inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-[14px] font-bold text-brand-700 hover:bg-brand-50"
            >
              <Languages className="h-4 w-4" />
              {language === "en" ? "العربية" : "English"}
            </button>
          </div>
        </div>
      </div>

      {/* the gradient hairline that ties the header to the brand */}
      <div aria-hidden="true" className="h-0.5 bg-od-gradient opacity-70" />
    </header>
  );
}
