import { NavLink } from "react-router-dom";
import { ChevronLeft, ChevronRight, GraduationCap, Radar, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { navFor } from "@/config/nav";
import { PORTALS, ROLE_META, portalFor } from "@/auth/roles";
import { useAuth } from "@/auth/AuthContext";
import { Logo } from "@/components/shared/Logo";
import { Badge } from "@/components/ui/Badge";
import { site } from "@/config/paths";

/**
 * Campus card.
 *
 * Sits where the clinic sidebar shows the practice: a signed-in user should
 * never have to wonder which tenant's data they are looking at.
 */
function CampusCard({ campus, collapsed }) {
  if (collapsed) {
    return (
      <div
        title={campus?.name}
        className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-accent-600"
      >
        <GraduationCap className="h-4 w-4" />
      </div>
    );
  }
  return (
    <div className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-50 text-accent-600">
        <GraduationCap className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[13px] font-bold text-ink">
          {campus?.shortName ?? campus?.name ?? "Campus"}
        </span>
        <span className="block truncate text-[11px] text-ink-soft">
          {campus?.faculty ?? "Faculty of Dentistry"}
        </span>
      </span>
    </div>
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

/** The console's own header card. The platform operates above every tenant. */
function ConsoleCard({ collapsed }) {
  if (collapsed) {
    return (
      <div
        title="Odenta platform console"
        className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-danger-ink"
      >
        <Radar className="h-4 w-4" />
      </div>
    );
  }
  return (
    <div className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-danger-soft text-danger-ink">
        <Radar className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[13px] font-bold text-ink">Odenta Platform</span>
        <span className="block truncate text-[11px] text-ink-soft">Every tenant · no patient data</span>
      </span>
    </div>
  );
}

/**
 * The university portal's navigation.
 *
 * Rail on a desktop, drawer below `lg` — the same two shapes as the clinic
 * sidebar, and deliberately the same geometry, so the two portals feel like
 * one product on a phone as much as they do on a monitor. `UniversityLayout`
 * resolves `collapsed` before passing it: a drawer is never a rail.
 */
export function UniversitySidebar({ campus, collapsed, onToggle, mobileOpen = false, onCloseMobile }) {
  const { user, role } = useAuth();
  const isPlatform = portalFor(role) === PORTALS.PLATFORM;
  /* A lookup by role, not a filter over a shared tree — see config/nav. */
  const { sections, footer } = navFor(user);
  const meta = ROLE_META[role];

  const closeOnMobile = onCloseMobile ? () => onCloseMobile() : undefined;

  return (
    <>
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

        {/**
         * Which tenant am I looking at — or none, for the console.
         *
         * The platform account is not inside a campus, and showing it a card
         * reading "Campus · Faculty of Dentistry" was the same category error as
         * the sidebar it used to inherit: a shell telling an operator they are
         * somewhere they are not. It gets a card that says what it is instead.
         */}
        {isPlatform ? <ConsoleCard collapsed={collapsed} /> : <CampusCard campus={campus} collapsed={collapsed} />}

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
