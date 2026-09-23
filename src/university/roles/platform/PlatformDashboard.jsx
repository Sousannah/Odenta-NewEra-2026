import { useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  Building2,
  Database,
  GraduationCap,
  Radar,
  Receipt,
  Server,
  ShieldAlert,
  University,
  Users,
} from "lucide-react";
import { useAsync } from "@/hooks";
import { platformService } from "@/services";
import { formatNumber, fromNow } from "@/lib/format";
import { ROLES } from "@/auth/roles";
import { platform } from "@/config/paths";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { MiniSelect } from "@/components/ui/Field";
import { CardSkeleton } from "@/components/ui/Skeleton";
import RoleSwitcherCard from "@/university/features/platform/RoleSwitcherCard";
import { OdentaLoaderPanel } from "@/components/ui/OdentaLoader";
import { EmptyState } from "@/components/ui/EmptyState";
import { DashboardShell } from "@/components/shared";
import { DonutChart, GroupedBarChart } from "@/components/charts";
import { TrendArea } from "@/university/features/platform/TrendArea";
import {
  HEALTH_LABEL,
  HEALTH_TONE,
  POSTURE,
  RANGES,
  SEVERITY_TONE,
  TENANT_LABEL,
  TENANT_TONE,
  formatEgpCompact,
  formatStorage,
  trendOf,
} from "@/university/features/platform/platformFormat";

/**
 * The command centre.
 *
 * Every tenant, every account, the money, the load and anything on fire — in
 * one read. `platformService.getOverview` is deliberately a single endpoint
 * rather than nine: the alternative is nine round trips on every open, nine
 * caches, and nine chances for the tenant count in a tile to disagree with the
 * tenant count in a chart legend. Every number on this screen is from the same
 * instant, which is a correctness property before it is a cheap one.
 *
 * The screen holds no clinical data and cannot: the founders' account has no
 * clinical permission, so there is no version of this board that can open a
 * patient record. That is enforced on the server — see the note on
 * `ROLES.SUPERADMIN` in `auth/permissions.js`.
 *
 * Ordered by what a founder acts on rather than by what is impressive: whatever
 * is wrong first, then the tenants that need a phone call, then the numbers.
 */
export default function PlatformDashboard() {
  const { user } = useOutletContext() ?? {};
  const navigate = useNavigate();
  const [range, setRange] = useState("30d");

  const { data, loading, error } = useAsync(
    () => platformService.getOverview({ range }),
    [range]
  );

  if (loading && !data) {
    return <OdentaLoaderPanel />;
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <EmptyState
          icon={<Radar className="h-6 w-6" />}
          title="The platform board is unavailable"
          description={error?.message ?? "Nothing came back from the platform service."}
        />
      </div>
    );
  }

  const { kpis, trends, security, fleet, alerts, tenants, atRisk, activity } = data;
  const posture = POSTURE[security?.level] ?? POSTURE.clear;

  return (
    <DashboardShell
      user={user}
      role={ROLES.SUPERADMIN}
      subtitle={`${kpis.tenants.total} tenants · ${formatNumber(kpis.accounts.total)} accounts`}
      actions={
        <>
          <MiniSelect value={range} onChange={(event) => setRange(event.target.value)}>
            {RANGES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </MiniSelect>
          <Button
            variant="secondary"
            leftIcon={<Users className="h-4 w-4" />}
            onClick={() => navigate(platform.accounts)}
          >
            Accounts
          </Button>
          <Button leftIcon={<University className="h-4 w-4" />} onClick={() => navigate(platform.tenants)}>
            Tenants
          </Button>
        </>
      }
      kpis={[
        {
          label: "Monthly recurring",
          value: formatEgpCompact(kpis.revenue.mrrEgp),
          icon: <Receipt className="h-5 w-5" />,
          tone: "success",
        },
        {
          label: "Tenants",
          value: formatNumber(kpis.tenants.total),
          icon: <University className="h-5 w-5" />,
        },
        {
          label: "Accounts",
          value: formatNumber(kpis.accounts.total),
          change: trendOf(trends?.signIns),
          icon: <Users className="h-5 w-5" />,
        },
        {
          label: "Storage held",
          value: formatStorage(kpis.usage.storageGb),
          icon: <Database className="h-5 w-5" />,
          tone: "warning",
        },
      ]}
    >
      <div className="grid grid-cols-12 gap-5">
        {/* ------------------------------------------------- what is wrong */}
        {/**
         * First, and only when there is something to say.
         *
         * An always-present "no alerts" panel trains an operator to scroll past
         * the top of the screen, which is exactly where an alert would appear.
         */}
        {alerts?.length ? (
          <Card className="col-span-12 border-danger/30">
            <CardHeader
              title={
                <span className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-danger" />
                  Needs attention
                </span>
              }
              subtitle={`${alerts.length} open ${alerts.length === 1 ? "incident" : "incidents"}`}
              action={
                <Button variant="link" size="sm" onClick={() => navigate(platform.security)}>
                  Security centre
                </Button>
              }
            />
            <CardBody className="pt-2">
              <ul className="flex flex-col gap-2">
                {alerts.map((alert) => (
                  <li
                    key={alert.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 px-3.5 py-2.5"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-bold text-ink">{alert.title}</span>
                      <span className="block truncate text-[12px] text-ink-soft">{alert.detail}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      {alert.tenantId ? <Badge tone="outline">{alert.tenantId}</Badge> : null}
                      <Badge tone={SEVERITY_TONE[alert.severity] ?? "neutral"}>{alert.severity}</Badge>
                      <span className="text-[11px] font-semibold text-ink-faint">{fromNow(alert.at)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        ) : null}

        {/* --------------------------------------------------- three states */}
        <Card className="col-span-12 lg:col-span-4">
          <CardHeader title="Security" subtitle={`Last ${security?.windowHours ?? 24} hours`} />
          <CardBody className="flex items-center gap-4 pt-2">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
              <ShieldAlert className="h-5 w-5 text-ink-muted" />
            </span>
            <div className="min-w-0">
              <Badge tone={posture.tone}>{posture.label}</Badge>
              <p className="mt-1 text-[12px] text-ink-soft">
                {security?.recent ?? 0} events · {security?.open ?? 0} unreviewed
              </p>
            </div>
          </CardBody>
        </Card>

        <Card className="col-span-12 lg:col-span-4">
          <CardHeader title="Fleet" subtitle={fleet?.regions?.join(" · ") || "—"} />
          <CardBody className="flex items-center gap-4 pt-2">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
              <Server className="h-5 w-5 text-ink-muted" />
            </span>
            <div className="min-w-0">
              <Badge tone={fleet?.degraded ? "warning" : "success"}>
                {fleet?.healthy ?? 0} of {fleet?.nodes ?? 0} healthy
              </Badge>
              <p className="mt-1 text-[12px] text-ink-soft">
                {fleet?.avgLatencyMs != null ? `${fleet.avgLatencyMs}ms average` : "No samples yet"}
              </p>
            </div>
          </CardBody>
        </Card>

        <Card className="col-span-12 lg:col-span-4">
          <CardHeader title="Collections" subtitle="Against what has been invoiced" />
          <CardBody className="flex items-center gap-4 pt-2">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
              <Receipt className="h-5 w-5 text-ink-muted" />
            </span>
            <div className="min-w-0">
              <Badge tone={kpis.revenue.overdueEgp > 0 ? "warning" : "success"}>
                {kpis.revenue.collectionRatePct}% collected
              </Badge>
              <p className="mt-1 text-[12px] text-ink-soft">
                {formatEgpCompact(kpis.revenue.outstandingEgp)} outstanding
                {kpis.revenue.overdueEgp > 0
                  ? ` · ${formatEgpCompact(kpis.revenue.overdueEgp)} overdue`
                  : ""}
              </p>
            </div>
          </CardBody>
        </Card>

        {/* -------------------------------------------------- who to call */}
        {/**
         * Sorted by health, not by revenue.
         *
         * The distinction the health score exists for: a quiet tenant on the
         * largest contract is the most urgent row on this screen, and a revenue
         * sort buries it under the ones that are fine.
         */}
        {atRisk?.length ? (
          <Card className="col-span-12 xl:col-span-5">
            <CardHeader title="Tenants to call" subtitle="Ranked by health, not by revenue" />
            <CardBody className="pt-2">
              <ul className="flex flex-col gap-2.5">
                {atRisk.map((tenant) => (
                  <li key={tenant.tenantId}>
                    <button
                      type="button"
                      onClick={() => navigate(platform.tenant(tenant.tenantId))}
                      className="od-focus flex w-full flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 px-3.5 py-3 text-left transition hover:border-slate-300 hover:bg-slate-50"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-[13px] font-bold text-ink">{tenant.name}</span>
                        <span className="block truncate text-[12px] text-ink-soft">
                          {tenant.city} · {formatEgpCompact(tenant.mrrEgp)}/mo ·{" "}
                          {formatNumber(tenant.totals?.cases ?? 0)} cases
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-2">
                        <Badge tone={TENANT_TONE[tenant.status]}>{TENANT_LABEL[tenant.status]}</Badge>
                        <Badge tone={HEALTH_TONE[tenant.health.band]}>
                          {HEALTH_LABEL[tenant.health.band]} {tenant.health.score}
                        </Badge>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        ) : null}

        {/* --------------------------------------------------- throughput */}
        <Card className={atRisk?.length ? "col-span-12 xl:col-span-7" : "col-span-12 xl:col-span-8"}>
          <CardHeader title="Platform throughput" subtitle="Across every tenant" />
          <CardBody className="pt-3">
            {data.series?.length ? (
              <GroupedBarChart
                data={data.series}
                xKey="day"
                height={260}
                series={[
                  { key: "cases", label: "Cases opened", color: "#0077B6" },
                  { key: "appointments", label: "Appointments", color: "#20B2AA" },
                  { key: "reviews", label: "Steps submitted", color: "#8AB6D6" },
                ]}
              />
            ) : (
              <EmptyState title="No activity in this window" className="py-10" />
            )}
          </CardBody>
        </Card>

        {/* -------------------------------------------------- where volume is */}
        <Card className="col-span-12 xl:col-span-4">
          <CardHeader title="Cases by tenant" subtitle="This window" />
          <CardBody className="pt-3">
            {data.tenantMix?.length ? (
              <DonutChart
                data={data.tenantMix.map((entry) => ({ name: entry.label, value: entry.value }))}
                total={data.tenantMix.reduce((sum, entry) => sum + entry.value, 0)}
                label="Cases"
                valueFormatter={formatNumber}
              />
            ) : (
              <EmptyState title="Nothing to chart yet" className="py-10" />
            )}
          </CardBody>
        </Card>

        {/* ------------------------------------------------------- storage */}
        <Card className="col-span-12 xl:col-span-8">
          <CardHeader
            title="Imaging storage"
            subtitle="Total held across tenants — the meter that bills"
          />
          <CardBody className="pt-3">
            {data.storageSeries?.length ? (
              <TrendArea
                data={data.storageSeries}
                xKey="day"
                yKey="storageGb"
                color="#20B2AA"
                height={200}
                valueFormatter={formatStorage}
              />
            ) : (
              <CardSkeleton />
            )}
          </CardBody>
        </Card>

        {/* ------------------------------------------------- what Odenta did */}
        <Card className="col-span-12 xl:col-span-4">
          <CardHeader
            title="Operator activity"
            subtitle="What Odenta did, most recent first"
            action={
              <Button variant="link" size="sm" onClick={() => navigate(platform.activity)}>
                Full trail
              </Button>
            }
          />
          <CardBody className="pt-2">
            {activity?.length ? (
              <ul className="flex flex-col gap-2">
                {activity.slice(0, 9).map((row) => (
                  <li key={row.id} className="flex items-start gap-3 rounded-xl px-2 py-2 hover:bg-slate-50">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-400" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-semibold text-ink">{row.actor}</span>
                      <span className="block truncate text-[12px] text-ink-soft">{row.detail}</span>
                    </span>
                    <span className="shrink-0 text-[11px] font-semibold text-ink-faint">
                      {fromNow(row.at)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={<Activity className="h-6 w-6" />}
                title="No operator activity yet"
                className="py-8"
              />
            )}
          </CardBody>
        </Card>

        {/* ----------------------------------------------- every tenant */}
        <Card className="col-span-12">
          <CardHeader
            title="Every tenant"
            subtitle="What each one is paying for, and what they are using"
            action={
              <Button variant="link" size="sm" onClick={() => navigate(platform.tenants)}>
                Manage
              </Button>
            }
          />
          <CardBody className="pt-2">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {tenants.map((tenant) => (
                <button
                  key={tenant.tenantId}
                  type="button"
                  onClick={() => navigate(platform.tenant(tenant.tenantId))}
                  className="od-focus rounded-2xl border border-slate-200 p-4 text-left transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex min-w-0 items-center gap-2">
                      {tenant.kind === "campus" ? (
                        <University className="h-4 w-4 shrink-0 text-ink-faint" />
                      ) : (
                        <Building2 className="h-4 w-4 shrink-0 text-ink-faint" />
                      )}
                      <span className="truncate text-[13.5px] font-extrabold text-ink">
                        {tenant.shortName ?? tenant.name}
                      </span>
                    </span>
                    <Badge tone={TENANT_TONE[tenant.status]}>{TENANT_LABEL[tenant.status]}</Badge>
                  </div>

                  <dl className="mt-3 grid grid-cols-2 gap-3">
                    {[
                      {
                        label: "Seats",
                        value: formatNumber(tenant.usage?.seats ?? 0),
                        icon: <GraduationCap className="h-3.5 w-3.5" />,
                      },
                      {
                        label: "Monthly",
                        value: formatEgpCompact(tenant.mrrEgp),
                        icon: <Receipt className="h-3.5 w-3.5" />,
                      },
                      {
                        label: "Cases",
                        value: formatNumber(tenant.totals?.cases ?? 0),
                        icon: <Activity className="h-3.5 w-3.5" />,
                      },
                      {
                        label: "Storage",
                        value: formatStorage(tenant.usage?.storageGb ?? 0),
                        icon: <Database className="h-3.5 w-3.5" />,
                      },
                    ].map((entry) => (
                      <div key={entry.label}>
                        <dt className="od-label flex items-center gap-1.5">
                          {entry.icon}
                          {entry.label}
                        </dt>
                        <dd className="mt-0.5 text-[15px] font-extrabold text-ink">{entry.value}</dd>
                      </div>
                    ))}
                  </dl>

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span className="truncate text-[11.5px] text-ink-faint">{tenant.city}</span>
                    <Badge tone={HEALTH_TONE[tenant.health.band]}>
                      {HEALTH_LABEL[tenant.health.band]} · {tenant.health.score}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Open a role, for testing. Preview is read-only and audited everywhere;
            the sign-in buttons only appear when the server offers them, which
            it does not in production. */}
        <div className="col-span-12">
          <RoleSwitcherCard tenants={tenants ?? []} />
        </div>
      </div>
    </DashboardShell>
  );
}
