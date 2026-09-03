import { CalendarRange, Download, Percent, TrendingUp, UserPlus, Users } from "lucide-react";
import { useAsync } from "@/hooks";
import { analyticsService } from "@/services";
import { formatMoney, formatNumber, formatPercent } from "@/lib/format";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { MiniSelect } from "@/components/ui/Field";
import { DataTable } from "@/components/ui/DataTable";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { GroupedBarChart, HorizontalBars } from "@/components/charts";
import { PageHeader, StatCard } from "@/components/shared";

export default function ReportPage() {
  const { data, loading } = useAsync(() => analyticsService.getReportMetrics(), []);

  if (loading || !data) {
    return (
      <div className="grid grid-cols-12 gap-5 p-6">
        <CardSkeleton className="col-span-12 xl:col-span-6" />
        <CardSkeleton className="col-span-12 xl:col-span-6" />
      </div>
    );
  }

  const dentistColumns = [
    { key: "name", header: "Dentist", sortable: true, render: (row) => <b>{row.name}</b> },
    { key: "appointments", header: "Appointments", align: "center", sortable: true },
    {
      key: "revenue",
      header: "Revenue",
      align: "right",
      sortable: true,
      render: (row) => <span className="font-bold">{formatMoney(row.revenue)}</span>,
    },
    {
      key: "avg",
      header: "Avg / appointment",
      align: "right",
      sortValue: (row) => row.revenue / row.appointments,
      render: (row) => formatMoney(row.revenue / row.appointments),
    },
  ];

  return (
    <div className="flex flex-col gap-5 p-6">
      <PageHeader
        title="Report"
        description="How the clinic performed this period, across treatments and dentists."
        actions={
          <>
            <Button variant="secondary" leftIcon={<CalendarRange className="h-4 w-4" />}>
              Last 30 days
            </Button>
            <Button leftIcon={<Download className="h-4 w-4" />}>Export report</Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Appointments"
          value={formatNumber(data.appointments.total)}
          change={data.appointments.change}
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          label="Revenue"
          value={formatMoney(data.revenue.total)}
          change={data.revenue.change}
          tone="success"
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <StatCard
          label="New patients"
          value={formatNumber(data.newPatients.total)}
          change={data.newPatients.change}
          tone="warning"
          icon={<UserPlus className="h-5 w-5" />}
        />
        <StatCard
          label="Chair utilisation"
          value={formatPercent(data.utilisation.total, 0)}
          change={data.utilisation.change}
          tone="danger"
          icon={<Percent className="h-5 w-5" />}
        />
      </div>

      <div className="grid grid-cols-12 gap-5">
        <Card className="col-span-12 xl:col-span-7">
          <CardHeader
            title="Weekly activity"
            subtitle="Appointments against revenue"
            action={
              <MiniSelect defaultValue="week">
                <option value="week">This week</option>
                <option value="month">This month</option>
              </MiniSelect>
            }
          />
          <CardBody className="pt-3">
            <GroupedBarChart
              data={data.weekly}
              xKey="day"
              height={260}
              dualAxis
              series={[
                { key: "revenue", label: "Revenue", color: "#4B66E9", axis: "left" },
                {
                  key: "appointments",
                  label: "Appointments",
                  color: "#8ECC97",
                  axis: "right",
                  format: "number",
                },
              ]}
            />
          </CardBody>
        </Card>

        <Card className="col-span-12 xl:col-span-5">
          <CardHeader title="Most performed treatments" subtitle="By number of procedures" />
          <CardBody className="pt-4">
            <HorizontalBars data={data.byTreatment} />
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Dentist performance" subtitle="Workload and revenue contribution" />
        <CardBody className="pt-3">
          <DataTable
            columns={dentistColumns}
            rows={data.byDentist}
            dense
            className="border-0 shadow-none"
          />
        </CardBody>
      </Card>
    </div>
  );
}
