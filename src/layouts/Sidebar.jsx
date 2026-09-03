import { NavLink } from "react-router-dom";
import { Building2, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { navigationFor } from "@/config/navigation";
import { ROLE_META } from "@/auth/roles";
import { useAuth } from "@/auth/AuthContext";
import { Logo } from "@/components/shared/Logo";
import { Badge } from "@/components/ui/Badge";

function ClinicCard({ clinic, collapsed }) {
  if (collapsed) {
    return (
      <div
        title={clinic?.name}
        className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-brand-600"
      >
        <Building2 className="h-4 w-4" />
      </div>
    );
  }
  return (
    <button
      type="button"
      className="od-focus flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left transition hover:border-slate-300"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
        <Building2 className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[13px] font-bold text-ink">{clinic?.name}</span>
        <span className="block truncate text-[11px] text-ink-soft">{clinic?.address}</span>
      </span>
    </button>
  );
}

function NavRow({ item, collapsed }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        cn(
          "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-semibold transition-colors",
          collapsed && "justify-center px-0",
          isActive
            ? "bg-brand-600 text-white shadow-sm"
            : "text-ink-muted hover:bg-brand-100 hover:text-brand-700"
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            className={cn(
              "h-[18px] w-[18px] shrink-0",
              isActive ? "text-white" : "text-ink-soft group-hover:text-brand-600"
            )}
            strokeWidth={2.2}
          />
          {!collapsed ? <span className="truncate">{item.label}</span> : null}
        </>
      )}
    </NavLink>
  );
}

export function Sidebar({ clinic, collapsed, onToggle }) {
  const { user, role } = useAuth();
  const { sections, footer } = navigationFor(user);
  const meta = ROLE_META[role];

  return (
    <aside
      className={cn(
        "relative z-20 flex h-full shrink-0 flex-col gap-4 border-r border-slate-200 bg-[#F8FAFC] px-4 py-5 transition-[width] duration-300 ease-out",
        collapsed ? "w-[84px]" : "w-[264px]"
      )}
    >
      <div className={cn("flex items-center", collapsed ? "justify-center" : "px-1")}>
        <Logo collapsed={collapsed} />
      </div>

      <ClinicCard clinic={clinic} collapsed={collapsed} />

      {!collapsed && meta ? (
        <Badge tone={meta.tone} className="w-fit">
          {meta.label}
        </Badge>
      ) : null}

      <nav className="-mr-2 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-2">
        {sections.map((section, index) => (
          <div key={section.group ?? `root-${index}`} className="flex flex-col gap-1">
            {section.group && !collapsed ? (
              <span className="px-3 pb-1 pt-2 text-[10px] font-extrabold uppercase tracking-[0.12em] text-ink-faint">
                {section.group}
              </span>
            ) : null}
            {section.group && collapsed ? (
              <span className="mx-auto my-1 h-px w-6 bg-slate-200" />
            ) : null}
            {section.items.map((item) => (
              <NavRow key={item.key} item={item} collapsed={collapsed} />
            ))}
          </div>
        ))}
      </nav>

      {footer.length ? (
        <div className="flex flex-col gap-1 border-t border-slate-200 pt-3">
          {footer.map((item) => (
            <NavRow key={item.key} item={item} collapsed={collapsed} />
          ))}
        </div>
      ) : null}

      <button
        type="button"
        onClick={onToggle}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="absolute -right-3.5 top-7 flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-ink-soft shadow-sm transition hover:text-brand-600"
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </aside>
  );
}
