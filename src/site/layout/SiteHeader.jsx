import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Languages, LayoutDashboard, Menu, Moon, Sun, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { useAuth } from "@/auth/AuthContext";
import { roleHome } from "@/auth/roles";
import { useLanguage, useT } from "@/site/i18n/LanguageContext";
import { useSiteTheme } from "@/site/theme/ThemeContext";
import { headerActions, primaryNav } from "@/site/content/navigation";
import { SiteLogo } from "@/site/components/SiteLogo";
import { SiteButton } from "@/site/components/SiteButton";

export function ThemeToggle({ className }) {
  const { isDark, toggle } = useSiteTheme();
  const t = useT();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? t({ en: "Switch to light mode", ar: "الوضع الفاتح" }) : t({ en: "Switch to dark mode", ar: "الوضع الداكن" })}
      className={cn(
        "s-focus s-muted inline-flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-[var(--s-glass-strong)] hover:text-[var(--s-text)]",
        className
      )}
    >
      {isDark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
    </button>
  );
}

export function LanguageToggle({ className }) {
  const { language, toggle } = useLanguage();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={language === "en" ? "التبديل إلى العربية" : "Switch to English"}
      className={cn(
        "s-focus s-muted inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[14px] font-medium transition hover:bg-[var(--s-glass-strong)] hover:text-[var(--s-text)]",
        className
      )}
    >
      <Languages className="h-4 w-4" />
      {language === "en" ? "العربية" : "English"}
    </button>
  );
}

/**
 * A floating glass capsule, in the manner of the iOS 26 tab bar. It sits a
 * little below the top edge and tightens once the page scrolls under it.
 */
export function SiteHeader() {
  const t = useT();
  const { isAuthenticated, role } = useAuth();
  const { pathname } = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
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

  const account = isAuthenticated
    ? { to: roleHome(role), label: headerActions.dashboard.label, icon: <LayoutDashboard className="h-4 w-4" /> }
    : { to: headerActions.signIn.to, label: headerActions.signIn.label, icon: null };

  return (
    <header className="sticky top-0 z-50 px-3 sm:px-5">
      <div
        className={cn(
          "s-header-shell s-glass mx-auto rounded-[28px]",
          scrolled ? "mt-2 max-w-6xl" : "mt-4 max-w-7xl"
        )}
      >
        <div className="flex h-[60px] items-center gap-3 ps-5 pe-2.5">
          <SiteLogo />

          <nav aria-label={t({ en: "Main", ar: "الرئيسية" })} className="mx-auto hidden items-center gap-0.5 lg:flex">
            {primaryNav.map((item) => (
              <NavLink key={item.key} to={item.to} end={item.end} className="s-nav-link s-focus">
                {t(item.label)}
              </NavLink>
            ))}
          </nav>

          <div className="ms-auto flex items-center gap-1 lg:ms-0">
            <LanguageToggle className="hidden sm:inline-flex" />
            <ThemeToggle />
            <SiteButton
              variant="primary"
              size="sm"
              to={account.to}
              leftIcon={account.icon}
              className="hidden sm:inline-flex"
            >
              {t(account.label)}
            </SiteButton>

            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              className="s-focus s-text inline-flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-[var(--s-glass-strong)] lg:hidden"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* mobile sheet — grows out of the capsule itself */}
        <div
          className={cn(
            "grid transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] lg:hidden",
            open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          )}
        >
          <div className="overflow-hidden">
            <nav className="flex flex-col gap-1 px-3 pb-4 pt-1">
              {primaryNav.map((item) => (
                <NavLink
                  key={item.key}
                  to={item.to}
                  end={item.end}
                  tabIndex={open ? 0 : -1}
                  className="s-nav-link s-focus !px-4 !py-3 !text-[16px]"
                >
                  {t(item.label)}
                </NavLink>
              ))}
              <div className="s-divider my-2" />
              <div className="flex items-center justify-between gap-3 px-1">
                <LanguageToggle />
                <SiteButton to={account.to} size="sm" leftIcon={account.icon} tabIndex={open ? 0 : -1}>
                  {t(account.label)}
                </SiteButton>
              </div>
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}
