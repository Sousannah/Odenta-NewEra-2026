import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { useAsync, useLocalStorage } from "@/hooks";
import { clinicService } from "@/services";

export function AppLayout() {
  const [collapsed, setCollapsed] = useLocalStorage("odenta.sidebar.collapsed", false);
  const { data: clinic } = useAsync(() => clinicService.getClinic(), []);
  const { data: user } = useAsync(() => clinicService.getCurrentUser(), []);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-canvas">
      <Sidebar
        clinic={clinic}
        collapsed={collapsed}
        onToggle={() => setCollapsed((value) => !value)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar user={user} />
        <main className="min-h-0 flex-1 overflow-y-auto">
          <Outlet context={{ clinic, user }} />
        </main>
      </div>
    </div>
  );
}
