import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ChevronDown,
  Flag,
  Globe,
  HelpCircle,
  LogOut,
  Megaphone,
  Menu,
  Plus,
  Search,
  UserCircle2,
} from "lucide-react";
import { allUniversityNavItems } from "@/config/universityNavigation";
import { UP } from "@/auth/permissions";
import { ROLE_META } from "@/auth/roles";
import { useAuth } from "@/auth/AuthContext";
import { Avatar } from "@/components/ui/Avatar";
import { Dropdown } from "@/components/ui/Dropdown";
import { IconButton } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { site, uni } from "@/config/paths";

/** Quick-create entries are permission gated like everything else. */
const QUICK_CREATE = [
  { value: `${uni.cases}?new=1`, label: "Register a case", permission: UP.CASE_ASSIGN },
  { value: `${uni.appointments}?new=1`, label: "Book an intake visit", permission: UP.UNI_APPOINTMENT_MANAGE },
  { value: `${uni.labRequests}?new=1`, label: "Raise a lab request", permission: UP.UNI_LAB_REQUEST },
  { value: `${uni.procedureRequests}?new=1`, label: "Raise a procedure request", permission: UP.PROCEDURE_REQUEST_VIEW },
  { value: `${uni.news}?new=1`, label: "Post an announcement", permission: UP.NEWS_MANAGE },
  { value: `${uni.bulkCreate}`, label: "Import a cohort", permission: UP.BULK_CREATE },
];

export function UniversityTopbar({ user, campus, onMenu }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { can, role, signOut } = useAuth();
  const toast = useToast();

  const items = allUniversityNavItems(user);
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

      <div className="min-w-0">
        <h1 className="truncate text-[15px] font-extrabold text-ink sm:text-lg">{title}</h1>
        <p className="truncate text-[11px] font-semibold text-ink-soft">
          {campus?.shortName ?? "Campus"} · {campus?.term ?? "Term"} {campus?.academicYear ?? ""}
        </p>
      </div>

      <div className="ml-auto flex min-w-0 items-center gap-1.5 sm:gap-3">
        {/**
         * Search and Help are fixtures, not decorations.
         *
         * Both used to disappear below `lg`, which meant the bar a person
         * learned on a wide screen was not the bar they got on a laptop — the
         * search box and the help button simply were not there any more. They
         * now shrink instead of vanishing: the field gives up its width down
         * to a square that still opens on click, and Help keeps its place at
         * every size.
         */}
        {/* On a phone the field is the 40px circle its own magnifier draws,
            and it widens over the bar when it takes focus — the page title
            keeps its room until somebody actually wants to search. */}
        <div className="relative min-w-0 max-w-10 flex-1 transition-[max-width] duration-300 ease-out focus-within:max-w-[240px] sm:max-w-none lg:flex-none">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <input
            aria-label="Search the portal"
            placeholder="Search cases, students, reviews…"
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
          <span className="hidden md:inline-flex">
            <IconButton label="Announcements" size="sm" onClick={() => navigate(uni.news)}>
              <Megaphone className="h-[18px] w-[18px] text-ink-soft" />
            </IconButton>
          </span>
          <IconButton label="Support" size="sm" onClick={() => navigate(uni.support)}>
            <HelpCircle className="h-[18px] w-[18px] text-ink-soft" />
          </IconButton>
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
            else navigate(uni.profile);
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
