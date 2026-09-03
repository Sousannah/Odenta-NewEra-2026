import { CalendarRange, Download, Percent, TrendingUp, UserPlus, Users } from "lucide-react";
import { useAsync } from "@/hooks";
import { analyticsService } from "@/services";
import { formatMoney, formatNumber, formatPercent } from "@/lib/format";
import { P } from "@/auth/permissions";
import { useAuth } from "@/auth/AuthContext";
import { PERIO_STAGES } from "@/config/dentalStandards";
import { Card, CardBody, CardHeader, Caption } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { MiniSelect } from "@/components/ui/Field";
import { DataTable } from "@/components/ui/DataTable";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { ProgressBar } from "@/components/ui/Stepper";
import { DonutChart, GroupedBarChart, HorizontalBars } from "@/components/charts";
import { PageHeader, StatCard } from "@/components/shared";

/**
 * Reporting.
 *
 * Financial and clinical panels are separated because the roles that read
 * them are different — an accountant needs the money, a clinical lead needs
 * risk mix and recall compliance.
 */
export default function ReportPage() {
  const { can } = useAuth();
  const { data, loading } = useAsync(() => analyticsService.getReport(), []);

  const showFinance = can(P.REPORT_FINANCIAL);
  const showClinical = can(P.REPORT_CLINICAL);

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
    ...(showFinance
      ? [
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
        ]
      : []),
  ];

  return (
    <div className="flex flex-col gap-5 p-6">
      <PageHeader
        title="Report"
        description="How the clinic performed this period, across treatments and dentists."
        actions={
          <>
            <MiniSelect className="h-10" defaultValue="30">
              <option value="30">Last 30 days</option>
              <option value="90">Last quarter</option>
              <option value="365">Last 12 months</option>
            </MiniSelect>
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
        {showFinance ? (
          <StatCard
            label="Revenue"
            value={formatMoney(data.revenue.total)}
            change={data.revenue.change}
            tone="success"
            icon={<TrendingUp className="h-5 w-5" />}
          />
        ) : null}
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

        {showClinical ? (
          <>
            <Card className="col-span-12 xl:col-span-5">
              <CardHeader
                title="Caries risk mix"
                subtitle="Whole active patient base"
                action={<CalendarRange className="h-4 w-4 text-ink-soft" />}
              />
              <CardBody className="flex flex-wrap items-center justify-between gap-4 pt-3">
                <DonutChart
                  data={data.clinical.cariesRiskSplit}
                  total={data.clinical.cariesRiskSplit.reduce((sum, item) => sum + item.value, 0)}
                  label="Patients"
                  size={168}
                />
                <ul className="flex min-w-[150px] flex-1 flex-col gap-2">
                  {data.clinical.cariesRiskSplit.map((slice) => (
                    <li key={slice.name} className="flex items-center gap-2 text-[13px]">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ background: slice.color }}
                      />
                      <span className="flex-1 truncate text-ink-muted">{slice.name}</span>
                      <span className="font-bold text-ink">{slice.value}</span>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>

            <Card className="col-span-12 xl:col-span-7">
              <CardHeader
                title="Periodontal staging"
                subtitle="AAP / EFP 2018 classification across charted patients"
              />
              <CardBody className="pt-4">
                <HorizontalBars data={data.clinical.perioStages} color="#E45689" />

                <div className="mt-6 border-t border-slate-100 pt-4">
                  <Caption>Recall compliance</Caption>
                  <div className="mt-2 flex items-center gap-3">
                    <ProgressBar
                      value={data.clinical.recallCompliance}
                      className="flex-1"
                      tone={data.clinical.recallCompliance >= 75 ? "success" : "warning"}
                    />
                    <span className="text-[15px] font-extrabold text-ink">
                      {data.clinical.recallCompliance}%
                    </span>
                  </div>
                  <p className="mt-2 text-[12px] text-ink-soft">
                    Share of patients who attended within one month of their due date.
                  </p>
                </div>

                <div className="mt-5 grid gap-2 sm:grid-cols-2">
                  {PERIO_STAGES.map((stage) => (
                    <div key={stage.value} className="rounded-xl border border-slate-200 px-3.5 py-2.5">
                      <span className="text-[12.5px] font-bold text-ink">{stage.label}</span>
                      <span className="mt-0.5 block text-[11.5px] text-ink-soft">{stage.detail}</span>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          </>
        ) : null}
      </div>

      <Card>
        <CardHeader title="Dentist performance" subtitle="Workload and contribution" />
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
