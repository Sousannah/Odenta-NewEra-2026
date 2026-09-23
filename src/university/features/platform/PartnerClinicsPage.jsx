import { Building2, Stethoscope, UserRound } from "lucide-react";
import { useAsync } from "@/hooks";
import { universityService } from "@/services";
import { formatDate } from "@/lib/format";
import { app } from "@/config/paths";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { PageHeader, StatCard, StatGrid } from "@/components/shared";

const TENANT_TONE = { active: "success", trial: "warning", suspended: "danger" };

/**
 * Partner clinics.
 *
 * Private practices running the clinic portal. They are a separate tenancy
 * from a campus: no student caseload, no review loop, and their patient data
 * is never visible from here — only the account-level facts.
 */
export default function PartnerClinicsPage() {
  const { data: rows = [], loading } = useAsync(
    () => universityService.getPartnerClinics(),
    [],
    []
  );

  const columns = [
    {
      key: "name",
      header: "Clinic",
      sortable: true,
      render: (item) => (
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-50 text-accent-600">
            <Building2 className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <span className="block truncate text-[13.5px] font-bold text-ink">{item.name}</span>
            <span className="mt-0.5 block truncate text-[12px] text-ink-soft">{item.city}</span>
          </div>
        </div>
      ),
    },
    {
      key: "chairs",
      header: "Chairs",
      sortable: true,
      align: "center",
      render: (item) => <span className="text-[13px] font-bold text-ink">{item.chairs}</span>,
    },
    {
      key: "dentists",
      header: "Dentists",
      sortable: true,
      align: "center",
      render: (item) => (
        <span className="text-[13px] font-semibold text-ink-muted">{item.dentists}</span>
      ),
    },
    {
      key: "since",
      header: "Live since",
      sortable: true,
      render: (item) => (
        <span className="text-[13px] text-ink-muted">{formatDate(item.since, "MMM yyyy")}</span>
      ),
    },
    {
      key: "plan",
      header: "Plan",
      sortable: true,
      render: (item) => <Badge tone="outline">{item.plan}</Badge>,
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (item) => (
        <Badge tone={TENANT_TONE[item.status] ?? "neutral"}>{item.status}</Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: () => (
        <Button as="a" href={app.root} variant="secondary" size="xs">
          Open clinic portal
        </Button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4 p-4 sm:gap-5 sm:p-6">
      <PageHeader
        title="Partner clinics"
        description="Private practices running the Odenta clinic portal. Their patient records are not reachable from here — only account-level facts."
      />

      <StatGrid cols={3}>
        <StatCard label="Clinics" value={rows.length} icon={<Building2 className="h-5 w-5" />} />
        <StatCard
          label="Chairs"
          value={rows.reduce((sum, item) => sum + item.chairs, 0)}
          tone="success"
          icon={<Stethoscope className="h-5 w-5" />}
        />
        <StatCard
          label="Dentists"
          value={rows.reduce((sum, item) => sum + item.dentists, 0)}
          icon={<UserRound className="h-5 w-5" />}
        />
      </StatGrid>

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        emptyTitle="No partner clinics"
        emptyDescription="Clinics appear here once their tenancy is provisioned."
      />
    </div>
  );
}
