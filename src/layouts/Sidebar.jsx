import { NavLink } from "react-router-dom";
import { Building2, ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { navFor } from "@/config/nav";
import { ROLE_META } from "@/auth/roles";
import { useAuth } from "@/auth/AuthContext";
import { Logo } from "@/components/shared/Logo";
import { Badge } from "@/components/ui/Badge";
import { site } from "@/config/paths";

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

function NavRow({ item, collapsed, onNavigate }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      onClick={onNavigate}
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

/**
 * The clinic portal's navigation.
 *
 * Two shapes, one component. On a desktop it is a rail that can be collapsed
 * to icons; below `lg` it slides in over the content as a drawer and is never
 * collapsed, because a 84px strip of unlabelled icons is a worse phone
 * navigation than no navigation at all. `AppLayout` decides which shape is in
 * play and passes `collapsed` already resolved.
 */
export function Sidebar({ clinic, collapsed, onToggle, mobileOpen = false, onCloseMobile }) {
  const { user, role } = useAuth();
  /* A lookup by role, not a filter over a shared tree — see config/nav. */
  const { sections, footer } = navFor(user);
  const meta = ROLE_META[role];

  /* Tapping a destination inside the drawer should also dismiss it. */
  const closeOnMobile = onCloseMobile ? () => onCloseMobile() : undefined;

  return (
    <>
      {/* The scrim. Present only as a drawer, and it is also the way out. */}
      <div
        onClick={onCloseMobile}
        aria-hidden="true"
        className={cn(
          "fixed inset-0 z-40 bg-ink/40 backdrop-blur-[2px] transition-opacity duration-300 lg:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-full w-[272px] max-w-[86vw] shrink-0 flex-col gap-4 border-r border-slate-200 bg-od-gradient-soft px-4 py-5 shadow-pop transition-[transform,visibility] duration-300 ease-out",
          "lg:visible lg:static lg:z-20 lg:max-w-none lg:translate-x-0 lg:shadow-none lg:transition-[width]",
          /* `invisible` keeps a closed drawer out of the tab order; it is in the
             transition list so the slide-out still plays before it applies. */
          mobileOpen ? "visible translate-x-0" : "invisible -translate-x-full",
          collapsed ? "lg:w-[84px]" : "lg:w-[264px]"
        )}
      >
        <div className={cn("flex items-center", collapsed ? "justify-center" : "justify-between px-1")}>
          <Logo collapsed={collapsed} variant="mark" size={collapsed ? "md" : "lg"} to={site.home} />
          {!collapsed ? (
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="Close navigation"
              className="od-focus -mr-1 flex h-9 w-9 items-center justify-center rounded-xl text-ink-soft transition hover:bg-white/70 hover:text-brand-600 lg:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          ) : null}
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
                <NavRow
                  key={item.key}
                  item={item}
                  collapsed={collapsed}
                  onNavigate={closeOnMobile}
                />
              ))}
            </div>
          ))}
        </nav>

        {footer.length ? (
          <div className="flex flex-col gap-1 border-t border-slate-200 pt-3">
            {footer.map((item) => (
              <NavRow key={item.key} item={item} collapsed={collapsed} onNavigate={closeOnMobile} />
            ))}
          </div>
        ) : null}

        <button
          type="button"
          onClick={onToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="absolute -right-3.5 top-7 hidden h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-ink-soft shadow-sm transition hover:text-brand-600 lg:flex"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </aside>
    </>
  );
}
