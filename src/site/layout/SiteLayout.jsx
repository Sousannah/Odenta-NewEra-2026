import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { SiteSurface } from "./SiteSurface";
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
 * two share the brand but nothing else, so marketing chrome never loads inside
 * a signed-in screen, and the site's dark theme never leaks into the portal.
 */
export function SiteLayout() {
  return (
    <SiteSurface className="flex flex-col">
      <ScrollToTop />
      <SiteHeader />
      <main className="relative z-10 flex-1">
        <Outlet />
      </main>
      <SiteFooter />
    </SiteSurface>
  );
}

export default SiteLayout;
