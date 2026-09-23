import { Building2, Database, GraduationCap, Stethoscope, University, Users } from "lucide-react";
import { useAsync } from "@/hooks";
import { universityService } from "@/services";
import { formatDate, formatNumber } from "@/lib/format";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { OdentaLoaderPanel } from "@/components/ui/OdentaLoader";
import { DataTable } from "@/components/ui/DataTable";
import { PageHeader, StatCard, StatGrid } from "@/components/shared";
import { HorizontalBars } from "@/components/charts";

const TENANT_TONE = { active: "success", trial: "warning", suspended: "danger" };

/** Every campus on the platform, with the seat counts each one is billed on. */
export default function CampusesPage() {
  const { data: rows = [], loading } = useAsync(() => universityService.getCampuses(), [], []);

  const totals = rows.reduce(
    (acc, item) => ({
      students: acc.students + item.students,
      supervisors: acc.supervisors + item.supervisors,
      chairs: acc.chairs + item.chairs,
      storage: acc.storage + item.storageGb,
    }),
    { students: 0, supervisors: 0, chairs: 0, storage: 0 }
  );

  const columns = [
    {
      key: "name",
      header: "Campus",
      sortable: true,
      render: (item) => (
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <University className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <span className="block truncate text-[13.5px] font-bold text-ink">{item.name}</span>
            <span className="mt-0.5 block truncate text-[12px] text-ink-soft">
              {item.shortName} · {item.city}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "students",
      header: "Students",
      sortable: true,
      align: "center",
      render: (item) => <span className="text-[13px] font-bold text-ink">{formatNumber(item.students)}</span>,
    },
    {
      key: "supervisors",
      header: "Staff members",
      sortable: true,
      align: "center",
      render: (item) => (
        <span className="text-[13px] font-semibold text-ink-muted">{item.supervisors}</span>
      ),
    },
    {
      key: "chairs",
      header: "Chairs",
      sortable: true,
      align: "center",
      render: (item) => <span className="text-[13px] font-semibold text-ink-muted">{item.chairs}</span>,
    },
    {
      key: "cases",
      header: "Cases",
      sortable: true,
      align: "center",
      render: (item) => <span className="text-[13px] font-semibold text-ink-muted">{formatNumber(item.cases)}</span>,
    },
    {
      key: "storageGb",
      header: "Storage",
      sortable: true,
      align: "right",
      render: (item) => (
        <span className="text-[13px] font-semibold text-ink-muted">
          {formatNumber(item.storageGb)} GB
        </span>
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
      key: "status",
      header: "Plan",
      sortable: true,
      render: (item) => (
        <div className="flex flex-col items-start gap-1.5">
          <Badge tone={TENANT_TONE[item.status] ?? "neutral"}>{item.status}</Badge>
          <span className="text-[11.5px] text-ink-soft">{item.plan}</span>
        </div>
      ),
    },
  ];

  if (loading) {
    return <OdentaLoaderPanel />;
  }

  return (
    <div className="flex flex-col gap-4 p-4 sm:gap-5 sm:p-6">
      <PageHeader
        title="Campuses"
        description="Every university tenant on the platform, with the seats and storage each one is billed on."
      />

      <StatGrid cols={4}>
        <StatCard label="Campuses" value={rows.length} icon={<University className="h-5 w-5" />} />
        <StatCard
          label="Students"
          value={formatNumber(totals.students)}
          tone="success"
          icon={<GraduationCap className="h-5 w-5" />}
        />
        <StatCard
          label="Chairs"
          value={formatNumber(totals.chairs)}
          icon={<Stethoscope className="h-5 w-5" />}
        />
        <StatCard
          label="Storage"
          value={`${formatNumber(totals.storage)} GB`}
          tone="warning"
          icon={<Database className="h-5 w-5" />}
        />
      </StatGrid>

      <DataTable columns={columns} rows={rows} emptyTitle="No campuses" />

      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader title="Cases by campus" subtitle="Lifetime volume" />
          <CardBody className="pt-4">
            <HorizontalBars
              data={rows.map((item) => ({ name: item.shortName, value: item.cases }))}
              valueFormatter={formatNumber}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Storage by campus" subtitle="Imaging held on the platform" />
          <CardBody className="pt-4">
            <HorizontalBars
              data={rows.map((item) => ({ name: item.shortName, value: item.storageGb }))}
              color="#20B2AA"
              valueFormatter={(value) => `${formatNumber(value)} GB`}
            />
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Supervision ratio" subtitle="Students per staff member, per campus" />
        <CardBody className="pt-3">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {rows.map((item) => {
              const ratio = item.supervisors ? Math.round(item.students / item.supervisors) : 0;
              return (
                <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate text-[13.5px] font-extrabold text-ink">
                      {item.shortName}
                    </span>
                    <Users className="h-4 w-4 text-ink-soft" />
                  </div>
                  <p className="mt-2 text-[26px] font-extrabold leading-none text-ink">
                    {ratio}
                    <span className="ml-1.5 text-[13px] font-bold text-ink-soft">
                      students / staff member
                    </span>
                  </p>
                  <p className="mt-2 text-[12px] text-ink-muted">
                    {ratio > 20
                      ? "Above the ratio most accreditation bodies accept for chairside supervision."
                      : "Within the usual accreditation range."}
                  </p>
                </div>
              );
            })}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
