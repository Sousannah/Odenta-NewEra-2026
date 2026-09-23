import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp } from "lucide-react";
import { useAsync } from "@/hooks";
import { platformService } from "@/services";
import { formatNumber } from "@/lib/format";
import { platform } from "@/config/paths";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge, TrendChip } from "@/components/ui/Badge";
import { MiniSelect } from "@/components/ui/Field";
import { DataTable } from "@/components/ui/DataTable";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { OdentaLoaderPanel } from "@/components/ui/OdentaLoader";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader, Toolbar } from "@/components/shared";
import { DonutChart, GroupedBarChart } from "@/components/charts";
import { TrendArea } from "./TrendArea";
import {
  HEALTH_LABEL,
  HEALTH_TONE,
  RANGES,
  TENANT_LABEL,
  TENANT_TONE,
  formatEgpCompact,
  formatStorage,
  trendOf,
} from "./platformFormat";

/**
 * System-wide insight.
 *
 * Every number here is folded from per-tenant daily rollups rather than from
 * the things being counted. "Cases opened across every tenant this quarter" out
 * of case documents is a cross-partition aggregation whose cost grows with the
 * product's success and is charged again on every dashboard open; out of
 * rollups it is tenants × days small documents, which is a number a founder
 * chooses rather than one the market chooses for them.
 *
 * Every total arrives with its movement against the equivalent window
 * immediately before it, because a number on an analytics screen without
 * "against what" is decoration. That comparison is computed on the server, so
 * this screen and the command centre can never disagree about whether something
 * went up.
 */

/** The four series a founder actually charts, and what each one means. */
const SERIES = [
  { key: "cases", label: "Cases opened", color: "#0077B6" },
  { key: "appointments", label: "Appointments", color: "#20B2AA" },
  { key: "reviews", label: "Steps submitted", color: "#8AB6D6" },
  { key: "signIns", label: "Sign-ins", color: "#F4A261" },
];

/** The KPI strip. `format` decides how the number is read, not how it is stored. */
const KPIS = [
  { key: "signIns", label: "Sign-ins" },
  { key: "activeUsers", label: "Active users" },
  { key: "patients", label: "Patients registered" },
  { key: "cases", label: "Cases opened" },
  { key: "casesCompleted", label: "Cases completed" },
  { key: "appointments", label: "Appointments" },
  { key: "reviews", label: "Steps submitted" },
  { key: "mediaUploads", label: "Images uploaded" },
];

export default function PlatformAnalyticsPage() {
  const navigate = useNavigate();
  const [range, setRange] = useState("30d");
  const [tenantId, setTenantId] = useState("all");

  const { data: tenants = [] } = useAsync(() => platformService.getTenants(), [], []);
  const { data, loading } = useAsync(
    () => platformService.getAnalytics({ range, tenantId }),
    [range, tenantId]
  );

  if (loading && !data) {
    return <OdentaLoaderPanel />;
  }

  const totals = data?.totals ?? {};
  const scoped = tenantId !== "all";

  return (
    <div className="flex flex-col gap-4 p-4 sm:gap-5 sm:p-6">
      <PageHeader
        title="Insights"
        description="Folded from per-tenant daily counters, so a year of history costs the same read as a week. Every total is shown against the window immediately before it."
      />

      <Toolbar
        left={
          <MiniSelect value={tenantId} onChange={(event) => setTenantId(event.target.value)}>
            <option value="all">Every tenant</option>
            {tenants.map((tenant) => (
              <option key={tenant.tenantId} value={tenant.tenantId}>
                {tenant.shortName ?? tenant.name}
              </option>
            ))}
          </MiniSelect>
        }
        right={
          <MiniSelect value={range} onChange={(event) => setRange(event.target.value)}>
            {RANGES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </MiniSelect>
        }
      />

      {/* --------------------------------------------------------- the strip */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {KPIS.map((kpi) => {
          const entry = totals[kpi.key];
          return (
            <div key={kpi.key} className="od-card px-4 py-3.5">
              <span className="od-label">{kpi.label}</span>
              <div className="mt-1.5 flex flex-wrap items-baseline gap-2">
                <span className="text-[21px] font-extrabold text-ink">
                  {formatNumber(entry?.value ?? 0)}
                </span>
                {trendOf(entry) != null ? <TrendChip value={trendOf(entry)} /> : null}
              </div>
              <span className="mt-0.5 block text-[11.5px] text-ink-faint">
                {formatNumber(entry?.previous ?? 0)} in the previous {data?.range?.days ?? 30} days
              </span>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-12 gap-5">
        {/* ---------------------------------------------------- throughput */}
        <Card className="col-span-12 xl:col-span-8">
          <CardHeader
            title="Throughput"
            subtitle={scoped ? tenants.find((t) => t.tenantId === tenantId)?.name : "Across every tenant"}
          />
          <CardBody className="pt-3">
            {data?.series?.length ? (
              <GroupedBarChart data={data.series} xKey="day" height={280} series={SERIES} />
            ) : (
              <EmptyState title="No activity in this window" className="py-12" />
            )}
          </CardBody>
        </Card>

        {/* ------------------------------------------------------ adoption */}
        {/**
         * The number that moves before revenue does.
         *
         * One large campus going quiet is a rounding error in "cases opened"
         * and a third of the platform in this — which is exactly why it gets
         * its own chart rather than being inferred from the volume one.
         */}
        <Card className="col-span-12 xl:col-span-4">
          <CardHeader title="Adoption" subtitle="Share of tenants active each day" />
          <CardBody className="pt-3">
            {data?.adoptionSeries?.length ? (
              <TrendArea
                data={data.adoptionSeries}
                xKey="day"
                yKey="pct"
                height={280}
                color="#20B2AA"
                valueFormatter={(value) => `${value}%`}
                label="of tenants"
              />
            ) : (
              <CardSkeleton />
            )}
          </CardBody>
        </Card>

        {/* ------------------------------------------------------- storage */}
        <Card className="col-span-12 xl:col-span-7">
          <CardHeader title="Imaging storage" subtitle="A level, not a flow — the latest reading each day" />
          <CardBody className="pt-3">
            {data?.storageSeries?.length ? (
              <TrendArea
                data={data.storageSeries}
                xKey="day"
                yKey="value"
                height={220}
                color="#F4A261"
                valueFormatter={formatStorage}
              />
            ) : (
              <CardSkeleton />
            )}
          </CardBody>
        </Card>

        {/* ------------------------------------------------------- mix */}
        <Card className="col-span-12 xl:col-span-5">
          <CardHeader title="Volume by tenant" subtitle="Cases opened in this window" />
          <CardBody className="pt-3">
            {data?.tenants?.length ? (
              <DonutChart
                data={data.tenants
                  .filter((row) => (row.totals?.cases ?? 0) > 0)
                  .slice(0, 8)
                  .map((row) => ({ name: row.shortName ?? row.name, value: row.totals.cases }))}
                total={data.tenants.reduce((sum, row) => sum + (row.totals?.cases ?? 0), 0)}
                label="Cases"
                valueFormatter={formatNumber}
              />
            ) : (
              <EmptyState title="Nothing to chart yet" className="py-12" />
            )}
          </CardBody>
        </Card>

        {/* -------------------------------------------------- the table */}
        <Card className="col-span-12">
          <CardHeader
            title="Every tenant, compared"
            subtitle="Ranked by volume. Health is scored from activity first, because it moves first."
          />
          <CardBody className="pt-2">
            <DataTable
              dense
              rows={data?.tenants ?? []}
              rowKey={(row) => row.tenantId}
              onRowClick={(row) => navigate(platform.tenant(row.tenantId))}
              emptyTitle="No tenant activity in this window"
              columns={[
                {
                  key: "name",
                  header: "Tenant",
                  sortable: true,
                  render: (row) => (
                    <div className="min-w-0">
                      <span className="block truncate text-[13.5px] font-bold text-ink">{row.name}</span>
                      <span className="block truncate text-[12px] text-ink-soft">
                        {row.kind === "campus" ? "University" : "Clinic"} ·{" "}
                        {formatEgpCompact(row.mrrEgp)}/mo
                      </span>
                    </div>
                  ),
                },
                {
                  key: "status",
                  header: "Status",
                  render: (row) => <Badge tone={TENANT_TONE[row.status]}>{TENANT_LABEL[row.status]}</Badge>,
                },
                {
                  key: "activeDays",
                  header: "Active days",
                  align: "right",
                  sortable: true,
                  render: (row) => (
                    <span className="text-[13px] font-semibold text-ink">
                      {row.activeDays}
                      <span className="text-ink-faint"> / {data?.range?.days}</span>
                    </span>
                  ),
                },
                ...["cases", "appointments", "reviews", "signIns"].map((metric) => ({
                  key: metric,
                  header: SERIES.find((s) => s.key === metric)?.label ?? metric,
                  align: "right",
                  sortable: true,
                  sortValue: (row) => row.totals?.[metric] ?? 0,
                  render: (row) => (
                    <div className="text-right">
                      <span className="block text-[13px] font-semibold text-ink">
                        {formatNumber(row.totals?.[metric] ?? 0)}
                      </span>
                      {trendOf(row.change?.[metric]) != null ? (
                        <span className="mt-0.5 inline-block">
                          <TrendChip value={trendOf(row.change[metric])} showIcon={false} />
                        </span>
                      ) : null}
                    </div>
                  ),
                })),
                {
                  key: "health",
                  header: "Health",
                  align: "right",
                  sortable: true,
                  sortValue: (row) => row.health?.score ?? 0,
                  render: (row) => (
                    <Badge tone={HEALTH_TONE[row.health?.band]}>
                      {HEALTH_LABEL[row.health?.band]} · {row.health?.score}
                    </Badge>
                  ),
                },
              ]}
            />
          </CardBody>
        </Card>

        {/* -------------------------------------------------- reliability */}
        <Card className="col-span-12">
          <CardHeader
            title="Reliability"
            subtitle="Error rate across every request served in this window"
          />
          <CardBody className="flex flex-wrap items-center gap-8 pt-3">
            <div>
              <span className="od-label">Error rate</span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-[26px] font-extrabold text-ink">{data?.errorRatePct ?? 0}%</span>
                <span className="text-[12px] text-ink-faint">
                  was {data?.previousErrorRatePct ?? 0}%
                </span>
              </div>
            </div>
            <div>
              <span className="od-label">Requests served</span>
              <div className="mt-1 text-[26px] font-extrabold text-ink">
                {formatNumber(totals.apiRequests?.value ?? 0)}
              </div>
            </div>
            <div>
              <span className="od-label">Request units spent</span>
              <div className="mt-1 text-[26px] font-extrabold text-ink">
                {formatNumber(totals.ruSpent?.value ?? 0)}
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate(platform.servers)}
              className="od-focus ml-auto inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand-600 hover:underline"
            >
              <TrendingUp className="h-4 w-4" />
              Infrastructure and cost
            </button>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
