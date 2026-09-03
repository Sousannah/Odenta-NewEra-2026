import { useLocation, useNavigate } from "react-router-dom";
import {
  Activity,
  ChevronDown,
  Flag,
  HelpCircle,
  LogOut,
  Plus,
  Repeat,
  Search,
  Settings,
  UserCircle2,
} from "lucide-react";
import { allNavItems } from "@/config/navigation";
import { P } from "@/auth/permissions";
import { ROLE_META, ROLE_ORDER } from "@/auth/roles";
import { useAuth } from "@/auth/AuthContext";
import { Avatar } from "@/components/ui/Avatar";
import { Dropdown } from "@/components/ui/Dropdown";
import { IconButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";

/** Quick-create entries are permission gated like everything else. */
const QUICK_CREATE = [
  { value: "/schedule?new=1", label: "New reservation", permission: P.APPOINTMENT_CREATE },
  { value: "/patients?new=1", label: "New patient", permission: P.PATIENT_CREATE },
  { value: "/treatments?new=1", label: "New treatment", permission: P.TREATMENT_MANAGE },
  { value: "/stocks?new=1", label: "New stock item", permission: P.STOCK_MANAGE },
  { value: "/lab-cases?new=1", label: "New lab case", permission: P.LAB_CASE_MANAGE },
];

export function Topbar({ user }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { can, role, switchRole, signOut } = useAuth();
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
    <header className="flex h-[68px] shrink-0 items-center gap-4 border-b border-slate-200 bg-white px-6">
      <h1 className="shrink-0 text-lg font-extrabold text-ink">{title}</h1>

      <div className="ml-auto flex items-center gap-3">
        <div className="relative hidden lg:block">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <input
            placeholder="Search for anything here..."
            className="h-10 w-[280px] rounded-full border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-ink placeholder:text-ink-faint transition focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-600/10 xl:w-[320px]"
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

        <div className="hidden items-center gap-1 md:flex">
          <IconButton label="Help" size="sm" onClick={() => navigate("/support")}>
            <HelpCircle className="h-[18px] w-[18px] text-ink-soft" />
          </IconButton>
          <IconButton label="Activity" size="sm" onClick={() => navigate("/audit")}>
            <Activity className="h-[18px] w-[18px] text-ink-soft" />
          </IconButton>
          <IconButton label="Settings" size="sm" onClick={() => toast.info("Settings coming soon")}>
            <Settings className="h-[18px] w-[18px] text-ink-soft" />
          </IconButton>
        </div>

        <span className="hidden items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-[12px] font-bold text-ink-muted md:inline-flex">
          <Flag className="h-3.5 w-3.5 text-success" />
          {completed}/{total}
        </span>

        <span className="hidden h-8 w-px bg-slate-200 sm:block" />

        {/* Demo affordance: hop between roles to inspect each dashboard. */}
        <Dropdown
          align="right"
          value={role}
          items={ROLE_ORDER.map((value) => ({
            value,
            label: ROLE_META[value].label,
            icon: <Repeat className="h-3.5 w-3.5" />,
          }))}
          onSelect={async (next) => {
            const session = await switchRole(next);
            navigate(ROLE_META[next].home, { replace: true });
            toast.info(`Now viewing as ${ROLE_META[next].label}`, session.user.name);
          }}
          trigger={
            <span className="hidden items-center gap-1.5 rounded-full border border-dashed border-brand-300 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-brand-600 lg:inline-flex">
              <Repeat className="h-3 w-3" />
              Switch role
            </span>
          }
        />

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
