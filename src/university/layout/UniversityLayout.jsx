import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Eye } from "lucide-react";
import { UniversitySidebar } from "./UniversitySidebar";
import { UniversityTopbar } from "./UniversityTopbar";
import { useAsync, useIsDesktop, useLocalStorage } from "@/hooks";
import { universityService } from "@/services";
import { useAuth } from "@/auth/AuthContext";
import { PORTALS, portalFor, roleHome } from "@/auth/roles";

/**
 * The university portal shell.
 *
 * Deliberately a sibling of `AppLayout` rather than a variant of it: the two
 * portals share the design system, not their navigation, their vocabulary, or
 * their tenant object.
 */
export function UniversityLayout() {
  const [collapsed, setCollapsed] = useLocalStorage("odenta.uni.sidebar.collapsed", false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user, role, preview } = useAuth();
  /* The founders' account belongs to no campus, so the API answers 403; skip
     the call rather than log a failure on every platform page. */
  const noCampus = portalFor(role) === PORTALS.PLATFORM;
  const { data: campus } = useAsync(
    () => (noCampus ? Promise.resolve(null) : universityService.getCampus()),
    [noCampus]
  );
  const { pathname } = useLocation();
  const isDesktop = useIsDesktop();

  /* Navigating dismisses the drawer; on a desktop there is no drawer to dismiss. */
  useEffect(() => setDrawerOpen(false), [pathname]);
  useEffect(() => {
    if (isDesktop) setDrawerOpen(false);
  }, [isDesktop]);

  /* Escape closes it, the way it closes every other overlay in the app. */
  useEffect(() => {
    if (!drawerOpen) return undefined;
    const onKey = (event) => event.key === "Escape" && setDrawerOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  /**
   * The shell itself refuses a role that does not belong in it.
   *
   * The per-route `RequirePortal` guards each screen, and that is not quite
   * enough here: the platform console's ten routes are *children of this
   * layout*, so the layout cannot be wrapped in a single portal guard the way
   * `/app` is. Without this, a clinic role landing on `/university-portal`
   * mounts the campus shell — Campus card, campus vocabulary — for the frame
   * before the index redirect fires.
   *
   * One frame is not a security problem; the server refuses every request the
   * shell would make. It is a correctness one: a shell that renders for
   * somebody who is not in that portal is the exact confusion this whole change
   * set removes, and leaving it would make the boundary look approximate.
   *
   * Both tenant-portal *and* platform roles are admitted, because both
   * legitimately render inside this layout at different paths.
   */
  const portal = portalFor(role);
  if (role && portal !== PORTALS.UNIVERSITY && portal !== PORTALS.PLATFORM) {
    return <Navigate to={roleHome(role)} replace />;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-canvas">
      <UniversitySidebar
        campus={campus}
        /* The rail only collapses on a desktop — a drawer always shows labels. */
        collapsed={isDesktop && collapsed}
        onToggle={() => setCollapsed((value) => !value)}
        mobileOpen={drawerOpen}
        onCloseMobile={() => setDrawerOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        {/**
         * The preview banner.
         *
         * Above the top bar and impossible to dismiss, because the failure mode
         * this whole feature has is a person forgetting which session they are
         * looking at and drawing a conclusion about a tenant from it. The
         * read-only guarantee is enforced by the server — this is here so the
         * human knows, not so the app does.
         */}
        {preview ? (
          <div
            role="status"
            className="flex flex-wrap items-center justify-center gap-2 bg-warning-soft px-4 py-2 text-[12.5px] font-semibold text-warning-ink"
          >
            <Eye className="h-3.5 w-3.5" aria-hidden="true" />
            {preview.banner ?? "Read-only tenant preview"}
            <span className="font-normal opacity-80">
              — nothing you do here can change anything. Close this tab to end it.
            </span>
          </div>
        ) : null}

        <UniversityTopbar user={user} campus={campus} onMenu={() => setDrawerOpen(true)} />
        <main className="min-h-0 flex-1 overflow-y-auto">
          {/* role is in the key so a role switch remounts the screen cleanly */}
          <Outlet key={role} context={{ campus, user, role, preview }} />
        </main>
      </div>
    </div>
  );
}
