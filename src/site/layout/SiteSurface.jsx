import { cn } from "@/lib/cn";
import { LanguageProvider } from "@/site/i18n/LanguageContext";
import { SiteThemeProvider, useSiteTheme } from "@/site/theme/ThemeContext";
import "@/site/styles/site.css";

/** The light the glass refracts — three slow orbs and a faint grid. */
export function Ambient() {
  return (
    <div aria-hidden="true" className="s-ambient">
      <div className="s-orb s-orb-1" />
      <div className="s-orb s-orb-2" />
      <div className="s-orb s-orb-3" />
    </div>
  );
}

function Themed({ className, children }) {
  const { isDark } = useSiteTheme();
  return (
    <div className={cn("od-site relative min-h-screen", isDark && "dark", className)}>
      <Ambient />
      {children}
    </div>
  );
}

/**
 * The public surface — language, light/dark, the site stylesheet and the
 * ambient backdrop — for any screen that should look like the website.
 *
 * `SiteLayout` wraps the marketing pages in it; screens that live outside that
 * layout (sign-in) wrap themselves, so they share the look without inheriting
 * the marketing header and footer.
 */
export function SiteSurface({ className, children }) {
  return (
    <LanguageProvider>
      <SiteThemeProvider>
        <Themed className={className}>{children}</Themed>
      </SiteThemeProvider>
    </LanguageProvider>
  );
}
