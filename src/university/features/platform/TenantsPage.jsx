import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Gauge, Plus, Receipt, University } from "lucide-react";
import { useAsync, useDebounced, useDisclosure } from "@/hooks";
import { platformService } from "@/services";
import { formatNumber } from "@/lib/format";
import { platform } from "@/config/paths";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { MiniSelect } from "@/components/ui/Field";
import { DataTable } from "@/components/ui/DataTable";
import { SearchInput } from "@/components/ui/Misc";
import { useToast } from "@/components/ui/Toast";
import { PageHeader, StatCard, StatGrid, Toolbar } from "@/components/shared";
import TenantFormModal from "./TenantFormModal";
import {
  TENANT_LABEL,
  TENANT_TONE,
  formatEgpCompact,
  formatStorage,
} from "./platformFormat";

/**
 * Every university and partner clinic Odenta has signed.
 *
 * The two used to be separate screens — Campuses and Partner Clinics — and are
 * one here, because the questions a founder asks are about *tenants*: which are
 * paying, which are over quota, which have gone quiet. Splitting them by kind
 * meant asking each question twice and adding the answers up by hand. `kind` is
 * a filter and a column instead.
 *
 * Search and filtering happen on the server against the cached tenant list, so
 * typing costs nothing — see `platformRepo.searchTenants` for why this list is
 * filtered in memory there while the account directory is not.
 */
export default function TenantsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const form = useDisclosure();

  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("all");
  const [status, setStatus] = useState("all");
  const search = useDebounced(query, 250);

  const { data: rows = [], loading, refetch } = useAsync(
    () => platformService.getTenants({ q: search, kind, status }),
    [search, kind, status],
    []
  );

  const create = async (payload) => {
    const tenant = await platformService.createTenant(payload);
    toast.success("Tenant signed", `${tenant.name} is on ${tenant.plan.replace(/_/g, " ")}`);
    form.close();
    refetch();
    navigate(platform.tenant(tenant.tenantId));
  };

  const campuses = rows.filter((row) => row.kind === "campus").length;
  const clinics = rows.length - campuses;
  const mrr = rows.reduce((sum, row) => sum + (row.mrrEgp ?? 0), 0);
  const overQuota = rows.filter((row) => row.quotaBreaches?.length).length;

  const columns = [
    {
      key: "name",
      header: "Tenant",
      sortable: true,
      render: (row) => (
        <div className="flex min-w-0 items-center gap-2.5">
          {row.kind === "campus" ? (
            <University className="h-4 w-4 shrink-0 text-ink-faint" />
          ) : (
            <Building2 className="h-4 w-4 shrink-0 text-ink-faint" />
          )}
          <div className="min-w-0">
            <span className="block truncate text-[13.5px] font-bold text-ink">{row.name}</span>
            <span className="mt-0.5 block truncate text-[12px] text-ink-soft">
              {row.city} · <span className="font-mono">{row.tenantId}</span>
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "plan",
      header: "Plan",
      sortable: true,
      render: (row) => (
        <div className="min-w-0">
          <span className="block truncate text-[13px] font-semibold text-ink">{row.planLabel}</span>
          <span className="block text-[12px] text-ink-soft">{formatEgpCompact(row.mrrEgp)} / month</span>
        </div>
      ),
    },
    {
      key: "seats",
      header: "Seats",
      align: "right",
      sortable: true,
      sortValue: (row) => row.usage?.seats ?? 0,
      render: (row) => (
        <div className="text-right">
          <span className="block text-[13px] font-semibold text-ink">
            {formatNumber(row.usage?.seats ?? 0)}
          </span>
          <span className="block text-[12px] text-ink-soft">
            {formatNumber(row.usage?.activeUsers30d ?? 0)} active
          </span>
        </div>
      ),
    },
    {
      key: "storage",
      header: "Storage",
      align: "right",
      sortable: true,
      sortValue: (row) => row.usage?.storageGb ?? 0,
      render: (row) => (
        <span className="text-[13px] text-ink-muted">{formatStorage(row.usage?.storageGb ?? 0)}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (row) => (
        <div className="flex flex-col items-start gap-1.5">
          <Badge tone={TENANT_TONE[row.status]}>{TENANT_LABEL[row.status]}</Badge>
          {/**
           * Quota is reported, never enforced — see `domain/platform.js`. A
           * clinic that cannot register a patient because an invoice is late is
           * not a trade Odenta should make on a patient's behalf, so this is a
           * badge that starts a conversation rather than a block.
           */}
          {row.quotaBreaches?.length ? (
            <Badge tone="warning">
              Over {row.quotaBreaches.map((breach) => breach.meter).join(" & ")}
            </Badge>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4 p-4 sm:gap-5 sm:p-6">
      <PageHeader
        title="Tenants"
        description="Every university and partner clinic on the platform. Suspending one stops its service and deactivates its logins — it never deletes its records."
        actions={
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={form.open}>
            Sign a tenant
          </Button>
        }
      />

      <StatGrid cols={4}>
        <StatCard label="Campuses" value={campuses} icon={<University className="h-5 w-5" />} />
        <StatCard
          label="Partner clinics"
          value={clinics}
          tone="success"
          icon={<Building2 className="h-5 w-5" />}
        />
        <StatCard
          label="Monthly recurring" value={formatEgpCompact(mrr)} tone="success"
          icon={<Receipt className="h-5 w-5" />}
        />
        <StatCard
          label="Over quota" value={overQuota} tone={overQuota ? "warning" : "brand"}
          icon={<Gauge className="h-5 w-5" />}
        />
      </StatGrid>

      <Toolbar
        left={
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Name, city or tenant id…"
            className="w-full sm:w-[320px]"
          />
        }
        right={
          <>
            <MiniSelect value={kind} onChange={(event) => setKind(event.target.value)}>
              <option value="all">Every kind</option>
              <option value="campus">Universities</option>
              <option value="clinic">Partner clinics</option>
            </MiniSelect>
            <MiniSelect value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="all">Any status</option>
              {Object.entries(TENANT_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </MiniSelect>
          </>
        }
      />

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        dense
        onRowClick={(row) => navigate(platform.tenant(row.tenantId))}
        emptyTitle="No tenants match"
        emptyDescription="Try clearing the search or the status filter."
      />

      <TenantFormModal open={form.isOpen} onClose={form.close} onSubmit={create} />
    </div>
  );
}
