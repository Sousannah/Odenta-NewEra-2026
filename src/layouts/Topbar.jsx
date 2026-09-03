import { useLocation, useNavigate } from "react-router-dom";
import {
  Activity,
  ChevronDown,
  Flag,
  HelpCircle,
  Plus,
  Search,
  Settings,
} from "lucide-react";
import { allNavItems } from "@/config/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { Dropdown } from "@/components/ui/Dropdown";
import { IconButton } from "@/components/ui/Button";

const QUICK_CREATE = [
  { value: "/reservations?new=1", label: "New reservation" },
  { value: "/patients?new=1", label: "New patient" },
  { value: "/treatments?new=1", label: "New treatment" },
  { value: "/stocks?new=1", label: "New stock item" },
];

export function Topbar({ user }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const active = allNavItems.find((item) => pathname.startsWith(item.to));
  const title = active?.label ?? "Dashboard";
  const { completed = 0, total = 4 } = user?.onboarding ?? {};

  return (
    <header className="flex h-[68px] shrink-0 items-center gap-4 border-b border-slate-200 bg-white px-6">
      <h1 className="shrink-0 text-lg font-extrabold text-ink">{title}</h1>

      <div className="ml-auto flex items-center gap-3">
        <div className="relative hidden lg:block">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <input
            placeholder="Search for anything here..."
            className="h-10 w-[300px] rounded-full border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-ink placeholder:text-ink-faint transition focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-600/10 xl:w-[340px]"
          />
        </div>

        <Dropdown
          items={QUICK_CREATE}
          onSelect={(value) => navigate(value)}
          trigger={
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-white shadow-sm transition hover:bg-brand-700">
              <Plus className="h-5 w-5" strokeWidth={2.5} />
            </span>
          }
        />

        <div className="hidden items-center gap-1 md:flex">
          <IconButton label="Help" size="sm">
            <HelpCircle className="h-[18px] w-[18px] text-ink-soft" />
          </IconButton>
          <IconButton label="Activity" size="sm">
            <Activity className="h-[18px] w-[18px] text-ink-soft" />
          </IconButton>
          <IconButton label="Settings" size="sm">
            <Settings className="h-[18px] w-[18px] text-ink-soft" />
          </IconButton>
        </div>

        <span className="hidden items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-[12px] font-bold text-ink-muted md:inline-flex">
          <Flag className="h-3.5 w-3.5 text-success" />
          {completed}/{total}
        </span>

        <span className="hidden h-8 w-px bg-slate-200 sm:block" />

        <Dropdown
          items={[
            { value: "profile", label: "My profile" },
            { value: "clinic", label: "Clinic settings" },
            { value: "logout", label: "Log out", tone: "danger" },
          ]}
          trigger={
            <span className="flex items-center gap-2.5">
              <Avatar name={user?.name ?? ""} size="sm" />
              <span className="hidden text-left leading-tight sm:block">
                <span className="block text-[13px] font-bold text-ink">{user?.name}</span>
                <span className="block text-[11px] text-ink-soft">{user?.role}</span>
              </span>
              <ChevronDown className="h-4 w-4 text-ink-soft" />
            </span>
          }
        />
      </div>
    </header>
  );
}
