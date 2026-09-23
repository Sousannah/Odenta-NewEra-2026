import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { LanguageProvider } from "@/site/i18n/LanguageContext";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";

/** Every route change starts at the top of the new page. */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  }, [pathname]);
  return null;
}

/**
 * Shell for the public site. The portal has its own shell (`AppLayout`) — the
 * two share the theme but nothing else, so marketing chrome never loads inside
 * a signed-in screen.
 */
export function SiteLayout() {
  return (
    <LanguageProvider>
      <div className="flex min-h-screen flex-col bg-white">
        <ScrollToTop />
        <SiteHeader />
        <main className="flex-1">
          <Outlet />
        </main>
        <SiteFooter />
      </div>
    </LanguageProvider>
  );
}

export default SiteLayout;
