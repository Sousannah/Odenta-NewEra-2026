import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { useAsync, useIsDesktop, useLocalStorage } from "@/hooks";
import { clinicService } from "@/services";
import { useAuth } from "@/auth/AuthContext";

export function AppLayout() {
  const [collapsed, setCollapsed] = useLocalStorage("odenta.sidebar.collapsed", false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user, role } = useAuth();
  const { data: clinic } = useAsync(() => clinicService.getClinic(), []);
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

  return (
    <div className="flex h-screen w-full overflow-hidden bg-canvas">
      <Sidebar
        clinic={clinic}
        /* The rail only collapses on a desktop — a drawer always shows labels. */
        collapsed={isDesktop && collapsed}
        onToggle={() => setCollapsed((value) => !value)}
        mobileOpen={drawerOpen}
        onCloseMobile={() => setDrawerOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar user={user} onMenu={() => setDrawerOpen(true)} />
        <main className="min-h-0 flex-1 overflow-y-auto">
          {/* role is in the key so a role switch remounts the screen cleanly */}
          <Outlet key={role} context={{ clinic, user, role }} />
        </main>
      </div>
    </div>
  );
}
