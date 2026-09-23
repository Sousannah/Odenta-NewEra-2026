import { cn } from "@/lib/cn";
import { formatLongDate, greetingFor } from "@/lib/format";
import { ROLE_META } from "@/auth/roles";
import { Badge } from "@/components/ui/Badge";
import { StatCard, StatGrid } from "./StatBlock";

/**
 * Every role dashboard opens the same way: greeting, role badge, a KPI row,
 * then a grid of cards. Keeping that in one component is what makes the role
 * dashboards feel like one product.
 *
 * The badge names *who is signed in*, not whose board they are reading — the
 * founders' account lands on the owner's board in the clinic portal and should
 * still be told it is the platform account looking at it.
 */
export function DashboardShell({ user, role, subtitle, actions, kpis, children, className }) {
  const meta = ROLE_META[user?.role] ?? ROLE_META[role];
  const now = new Date();

  return (
    <div className={cn("flex flex-col gap-5 p-4 sm:gap-6 sm:p-6", className)}>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-xl font-extrabold text-ink sm:text-2xl">
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
        <StatGrid cols={Math.min(kpis.length, 4)}>
          {kpis.map((kpi) => (
            <StatCard key={kpi.label} {...kpi} />
          ))}
        </StatGrid>
      ) : null}

      {children}
    </div>
  );
}
