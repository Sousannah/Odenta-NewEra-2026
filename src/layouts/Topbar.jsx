import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Activity,
  ChevronDown,
  Flag,
  HelpCircle,
  LogOut,
  Menu,
  Plus,
  Globe,
  Search,
  Settings,
  UserCircle2,
} from "lucide-react";
import { allNavItems } from "@/config/navigation";
import { P } from "@/auth/permissions";
import { ROLE_META } from "@/auth/roles";
import { useAuth } from "@/auth/AuthContext";
import { Avatar } from "@/components/ui/Avatar";
import { Dropdown } from "@/components/ui/Dropdown";
import { IconButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { app, site } from "@/config/paths";

/** Quick-create entries are permission gated like everything else. */
const QUICK_CREATE = [
  { value: `${app.schedule}?new=1`, label: "New reservation", permission: P.APPOINTMENT_CREATE },
  { value: `${app.patients}?new=1`, label: "New patient", permission: P.PATIENT_CREATE },
  { value: `${app.treatments}?new=1`, label: "New treatment", permission: P.TREATMENT_MANAGE },
  { value: `${app.stocks}?new=1`, label: "New stock item", permission: P.STOCK_MANAGE },
  { value: `${app.labCases}?new=1`, label: "New lab case", permission: P.LAB_CASE_MANAGE },
];

export function Topbar({ user, onMenu }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { can, role, signOut } = useAuth();
  const toast = useToast();

  const items = allNavItems(user);
  const active = items
    .filter((item) => item.to && item.to !== "/")
    .sort((a, b) => b.to.length - a.to.length)
    .find((item) => pathname.startsWith(item.to));

  const title = active?.label ?? ROLE_META[role]?.short ?? "Dashboard";
  const { completed = 0, total = 4 } = user?.onboarding ?? {};
  const createOptions = QUICK_CREATE.filter((item) => can(item.permission));

  return (
    <header className="flex h-[68px] shrink-0 items-center gap-2 border-b border-slate-200 bg-white px-3 sm:gap-4 sm:px-6">
      {/* The drawer handle. Only exists below `lg`, where the rail is a drawer. */}
      {onMenu ? (
        <button
          type="button"
          onClick={onMenu}
          aria-label="Open navigation"
          className="od-focus -ml-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-ink-muted transition hover:bg-slate-100 hover:text-brand-600 lg:hidden"
        >
          <Menu className="h-5 w-5" strokeWidth={2.2} />
        </button>
      ) : null}

      <h1 className="min-w-0 truncate text-[15px] font-extrabold text-ink sm:text-lg">{title}</h1>

      <div className="ml-auto flex min-w-0 items-center gap-1.5 sm:gap-3">
        {/* Shrinks rather than disappearing below `lg` — see the same note in
            the university top bar. A control that is only there on a wide
            monitor is a control nobody learns to rely on. */}
        {/* On a phone the field is the 40px circle its own magnifier draws,
            and it widens over the bar when it takes focus — the page title
            keeps its room until somebody actually wants to search. */}
        <div className="relative min-w-0 max-w-10 flex-1 transition-[max-width] duration-300 ease-out focus-within:max-w-[240px] sm:max-w-none lg:flex-none">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <input
            aria-label="Search the practice"
            placeholder="Search for anything here..."
            className="h-10 w-full min-w-[40px] rounded-full border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-ink placeholder:text-ink-faint transition focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-600/10 sm:w-[200px] lg:w-[280px] xl:w-[320px]"
          />
        </div>

        {createOptions.length ? (
          <Dropdown
            items={createOptions}
            onSelect={(value) => navigate(value)}
            trigger={
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-white shadow-sm transition hover:bg-brand-700">
                <Plus className="h-5 w-5" strokeWidth={2.5} />
              </span>
            }
          />
        ) : null}

        <div className="flex items-center gap-1">
          <Link
            to={site.home}
            aria-label="Open the public site"
            title="Public site"
            className="od-focus hidden h-8 w-8 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-slate-100 hover:text-brand-600 md:inline-flex"
          >
            <Globe className="h-[18px] w-[18px]" />
          </Link>
          <IconButton label="Support" size="sm" onClick={() => navigate(app.support)}>
            <HelpCircle className="h-[18px] w-[18px] text-ink-soft" />
          </IconButton>
          <span className="hidden items-center gap-1 md:inline-flex">
            <IconButton label="Activity" size="sm" onClick={() => navigate(app.audit)}>
              <Activity className="h-[18px] w-[18px] text-ink-soft" />
            </IconButton>
            <IconButton label="Settings" size="sm" onClick={() => toast.info("Settings coming soon")}>
              <Settings className="h-[18px] w-[18px] text-ink-soft" />
            </IconButton>
          </span>
        </div>

        <span className="hidden items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-[12px] font-bold text-ink-muted lg:inline-flex">
          <Flag className="h-3.5 w-3.5 text-success" />
          {completed}/{total}
        </span>

        <span className="hidden h-8 w-px bg-slate-200 sm:block" />

        <Dropdown
          items={[
            { value: "profile", label: "My profile", icon: <UserCircle2 className="h-4 w-4" /> },
            { value: "logout", label: "Sign out", tone: "danger", icon: <LogOut className="h-4 w-4" /> },
          ]}
          onSelect={(value) => {
            if (value === "logout") signOut();
            else toast.info("Profile page coming soon");
          }}
          trigger={
            <span className="flex items-center gap-2.5">
              <Avatar name={user?.name ?? ""} size="sm" />
              <span className="hidden text-left leading-tight sm:block">
                <span className="block text-[13px] font-bold text-ink">{user?.name}</span>
                <span className="block text-[11px] text-ink-soft">
                  {ROLE_META[role]?.label ?? ""}
                </span>
              </span>
              <ChevronDown className="h-4 w-4 text-ink-soft" />
            </span>
          }
        />
      </div>
    </header>
  );
}

/** Small badge the dashboards use to restate the active role in-page. */
export function RoleChip({ role }) {
  const meta = ROLE_META[role];
  if (!meta) return null;
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}
