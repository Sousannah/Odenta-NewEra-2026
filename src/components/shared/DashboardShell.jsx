import { cn } from "@/lib/cn";
import { formatLongDate, greetingFor } from "@/lib/format";
import { ROLE_META } from "@/auth/roles";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "./StatBlock";

/**
 * Every role dashboard opens the same way: greeting, role badge, a KPI row,
 * then a grid of cards. Keeping that in one component is what makes seven
 * dashboards feel like one product.
 */
export function DashboardShell({ user, role, subtitle, actions, kpis, children, className }) {
  const meta = ROLE_META[role];
  const now = new Date();

  return (
    <div className={cn("flex flex-col gap-6 p-6", className)}>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-2xl font-extrabold text-ink">
              {greetingFor(now)}, {user?.firstName ?? "there"}!
            </h2>
            {meta ? <Badge tone={meta.tone}>{meta.label}</Badge> : null}
          </div>
          <p className="mt-1 text-sm font-medium text-ink-soft">
            {formatLongDate(now)}
            {subtitle ? <span className="text-ink-faint"> · {subtitle}</span> : null}
          </p>
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </header>

      {kpis?.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map((kpi) => (
            <StatCard key={kpi.label} {...kpi} />
          ))}
        </div>
      ) : null}

      {children}
    </div>
  );
}
