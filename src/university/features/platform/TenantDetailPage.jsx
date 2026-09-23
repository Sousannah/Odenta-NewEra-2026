import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  Database,
  Eye,
  PauseCircle,
  PlayCircle,
  Receipt,
  UserCheck,
  Users,
} from "lucide-react";
import { useAsync, useDisclosure } from "@/hooks";
import { platformService } from "@/services";
import { formatDate, formatNumber, fromNow } from "@/lib/format";
import { platform } from "@/config/paths";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { MiniSelect } from "@/components/ui/Field";
import { OdentaLoaderPanel } from "@/components/ui/OdentaLoader";
import { EmptyState } from "@/components/ui/EmptyState";
import { InfoBanner, KeyValue } from "@/components/ui/Misc";
import { DataTable } from "@/components/ui/DataTable";
import { useToast } from "@/components/ui/Toast";
import { PageHeader, StatCard, StatGrid } from "@/components/shared";
import TenantStatusModal from "./TenantStatusModal";
import PreviewTenantModal from "./PreviewTenantModal";
import {
  HEALTH_LABEL,
  HEALTH_TONE,
  INVOICE_TONE,
  TENANT_LABEL,
  TENANT_TONE,
  formatEgp,
  formatStorage,
} from "./platformFormat";

/**
 * One tenant, with everything a support call needs already on screen.
 *
 * Six lanes in one server read — the tenant, its seat usage, its subscription,
 * its invoices, its activity window and the operator actions taken against it.
 * A support engineer on a call cannot afford six clicks, and six endpoints
 * would be six round trips over whatever wifi they happen to be on.
 */
export default function TenantDetailPage() {
  const { tenantId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const statusModal = useDisclosure();
  const previewModal = useDisclosure();

  const [range, setRange] = useState("90d");

  const { data: tenant, loading, refetch } = useAsync(
    () => platformService.getTenant(tenantId, { range }),
    [tenantId, range]
  );

  const changeStatus = async ({ status, reason, cascadeAccounts }) => {
    const result = await platformService.setTenantStatus(tenantId, { status, reason, cascadeAccounts });
    /**
     * The cascade is reported, including what it could not do.
     *
     * A suspension that stopped 480 of 500 logins and said "done" would be the
     * worst outcome available — the twenty that are still working are exactly
     * the ones somebody needs to know about.
     */
    const cascade = result.cascade;
    toast.success(
      `${result.tenant.name} is ${TENANT_LABEL[status].toLowerCase()}`,
      cascade
        ? `${cascade.changed} of ${cascade.considered} accounts updated${
            cascade.failures?.length ? ` · ${cascade.failures.length} could not be changed` : ""
          }`
        : undefined
    );
    statusModal.close();
    refetch();
  };

  if (loading && !tenant) {
    return <OdentaLoaderPanel />;
  }

  if (!tenant) {
    return (
      <div className="p-6">
        <EmptyState
          title="No such tenant"
          description={`Nothing on the platform is addressed as ${tenantId}.`}
          action={<Button onClick={() => navigate(platform.tenants)}>Back to tenants</Button>}
        />
      </div>
    );
  }

  const stopped = tenant.status === "suspended" || tenant.status === "archived";
  const totals = tenant.window?.totals ?? {};

  return (
    <div className="flex flex-col gap-4 p-4 sm:gap-5 sm:p-6">
      <PageHeader
        title={tenant.name}
        description={`${tenant.kind === "campus" ? "University campus" : "Partner clinic"} · ${
          tenant.city ?? "—"
        } · signed ${formatDate(tenant.since, "MMMM yyyy")}`}
        actions={
          <>
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<ArrowLeft className="h-4 w-4" />}
              onClick={() => navigate(platform.tenants)}
            >
              All tenants
            </Button>
            <Button
              variant="secondary"
              leftIcon={<Eye className="h-4 w-4" />}
              onClick={previewModal.open}
              disabled={tenant.status === "archived"}
            >
              Open a preview
            </Button>
            {stopped ? (
              <Button
                variant="success"
                leftIcon={<PlayCircle className="h-4 w-4" />}
                onClick={() => statusModal.open({ status: "active" })}
                disabled={tenant.status === "archived"}
              >
                Reactivate
              </Button>
            ) : (
              <Button
                variant="danger-ghost"
                leftIcon={<PauseCircle className="h-4 w-4" />}
                onClick={() => statusModal.open({ status: "suspended" })}
              >
                Suspend
              </Button>
            )}
          </>
        }
      >
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge tone={TENANT_TONE[tenant.status]}>{TENANT_LABEL[tenant.status]}</Badge>
          <Badge tone="outline">{tenant.planDetail?.label ?? tenant.plan}</Badge>
          <Badge tone={HEALTH_TONE[tenant.health?.band]}>
            {HEALTH_LABEL[tenant.health?.band]} · {tenant.health?.score}
          </Badge>
          <span className="font-mono text-[12px] text-ink-faint">{tenant.tenantId}</span>
        </div>
      </PageHeader>

      {tenant.suspendedReason ? (
        <InfoBanner tone="danger">
          Suspended {fromNow(tenant.suspendedAt)} — {tenant.suspendedReason}
        </InfoBanner>
      ) : null}

      {tenant.quotaBreaches?.length ? (
        <InfoBanner tone="warning">
          Over plan on{" "}
          {tenant.quotaBreaches
            .map((breach) => `${breach.meter} (${formatNumber(breach.used)} of ${formatNumber(breach.allowed)})`)
            .join(" and ")}
          . Reported, not enforced — service continues while this is a billing conversation.
        </InfoBanner>
      ) : null}

      <StatGrid cols={4}>
        <StatCard
          label="Seats in use"
          value={formatNumber(tenant.usage?.seats ?? 0)}
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          label="Active this month" value={formatNumber(tenant.usage?.activeUsers30d ?? 0)} tone="success"
          icon={<UserCheck className="h-5 w-5" />}
        />
        <StatCard
          label="Imaging storage"
          value={formatStorage(tenant.usage?.storageGb ?? 0)}
          tone="warning"
          icon={<Database className="h-5 w-5" />}
        />
        <StatCard
          label="Monthly"
          value={formatEgp(
            tenant.contractPriceEgp ?? tenant.planDetail?.priceEgp ?? 0
          )}
          icon={<Receipt className="h-5 w-5" />}
        />
      </StatGrid>

      <div className="grid grid-cols-12 gap-5">
        {/* ------------------------------------------------------ activity */}
        <Card className="col-span-12 xl:col-span-8">
          <CardHeader
            title="What they have been doing"
            subtitle={`${tenant.window?.activeDays ?? 0} active days of ${tenant.window?.days ?? 0}`}
            action={
              <MiniSelect value={range} onChange={(event) => setRange(event.target.value)}>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="365d">Last year</option>
              </MiniSelect>
            }
          />
          <CardBody className="pt-2">
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { label: "Sign-ins", value: totals.signIns },
                { label: "Patients registered", value: totals.patients },
                { label: "Cases opened", value: totals.cases },
                { label: "Cases completed", value: totals.casesCompleted },
                { label: "Appointments", value: totals.appointments },
                { label: "Steps submitted", value: totals.reviews },
                { label: "Images uploaded", value: totals.mediaUploads },
                { label: "API requests", value: totals.apiRequests },
                { label: "Request units", value: totals.ruSpent },
              ].map((entry) => (
                <KeyValue key={entry.label} label={entry.label} value={formatNumber(entry.value ?? 0)} />
              ))}
            </div>
          </CardBody>
        </Card>

        {/* -------------------------------------------------------- health */}
        <Card className="col-span-12 xl:col-span-4">
          <CardHeader
            title="Health"
            subtitle="Activity first, because it moves before revenue does"
          />
          <CardBody className="pt-2">
            <div className="flex flex-col gap-3">
              {Object.entries(tenant.health?.components ?? {}).map(([key, value]) => (
                <div key={key}>
                  <div className="flex items-center justify-between text-[12.5px]">
                    <span className="font-semibold capitalize text-ink-muted">{key}</span>
                    <span className="font-bold text-ink">{value}</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <span
                      className="block h-full rounded-full bg-brand-500"
                      style={{ width: `${Math.max(0, Math.min(100, (value / 45) * 100))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* ------------------------------------------------------ contacts */}
        <Card className="col-span-12 xl:col-span-4">
          <CardHeader title="Contract" subtitle={tenant.subscription?.poNumber ?? "No PO on file"} />
          <CardBody className="flex flex-col gap-3 pt-2">
            <KeyValue label="Plan" value={tenant.planDetail?.label ?? tenant.plan} />
            <KeyValue label="Billing cycle" value={tenant.subscription?.billingCycle ?? "monthly"} />
            <KeyValue
              label="Renews"
              value={tenant.subscription?.renewsAt ? formatDate(tenant.subscription.renewsAt) : "—"}
            />
            <KeyValue label="Region" value={tenant.regionTag ?? "—"} />
            {tenant.contacts?.map((contact) => (
              <KeyValue
                key={contact.email}
                label={contact.role ? `${contact.name} · ${contact.role}` : contact.name}
                value={contact.email}
              />
            ))}
          </CardBody>
        </Card>

        {/* ------------------------------------------------------ invoices */}
        <Card className="col-span-12 xl:col-span-8">
          <CardHeader
            title="Invoices"
            subtitle="Most recent first"
            action={
              <Button variant="link" size="sm" onClick={() => navigate(platform.billing)}>
                Billing
              </Button>
            }
          />
          <CardBody className="pt-2">
            <DataTable
              dense
              rows={tenant.invoices ?? []}
              emptyTitle="Nothing invoiced yet"
              columns={[
                {
                  key: "number",
                  header: "Invoice",
                  render: (row) => (
                    <span className="font-mono text-[12.5px] text-ink-muted">{row.number}</span>
                  ),
                },
                { key: "period", header: "Period" },
                {
                  key: "totalEgp",
                  header: "Total",
                  align: "right",
                  render: (row) => (
                    <span className="text-[13px] font-semibold text-ink">{formatEgp(row.totalEgp)}</span>
                  ),
                },
                {
                  key: "status",
                  header: "Status",
                  render: (row) => <Badge tone={INVOICE_TONE[row.status]}>{row.status}</Badge>,
                },
                {
                  key: "dueAt",
                  header: "Due",
                  render: (row) => (
                    <span className="text-[13px] text-ink-muted">
                      {row.dueAt ? formatDate(row.dueAt) : "—"}
                    </span>
                  ),
                },
              ]}
            />
          </CardBody>
        </Card>

        {/* ------------------------------------------- what Odenta did here */}
        <Card className="col-span-12">
          <CardHeader
            title="Operator actions against this tenant"
            subtitle="Every change Odenta has made — this is the answer to “who touched our account”"
          />
          <CardBody className="pt-2">
            {tenant.activity?.length ? (
              <ul className="flex flex-col gap-2">
                {tenant.activity.map((row) => (
                  <li
                    key={row.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 px-3.5 py-2.5"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-semibold text-ink">
                        {row.detail ?? row.action}
                      </span>
                      <span className="block truncate text-[12px] text-ink-soft">
                        {row.actor} · <span className="font-mono">{row.action}</span>
                      </span>
                    </span>
                    <span className="shrink-0 text-[11.5px] font-semibold text-ink-faint">
                      {fromNow(row.at)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={<Building2 className="h-6 w-6" />}
                title="Odenta has not touched this tenant"
                className="py-8"
              />
            )}
          </CardBody>
        </Card>
      </div>

      <TenantStatusModal
        open={statusModal.isOpen}
        onClose={statusModal.close}
        tenant={tenant}
        intent={statusModal.payload?.status}
        onSubmit={changeStatus}
      />

      <PreviewTenantModal open={previewModal.isOpen} onClose={previewModal.close} tenant={tenant} />
    </div>
  );
}
