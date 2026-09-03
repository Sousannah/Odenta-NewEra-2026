import { useOutletContext } from "react-router-dom";
import { Download, Percent, Star, TrendingUp, UserPlus, Users } from "lucide-react";
import { useAsync } from "@/hooks";
import { analyticsService } from "@/services";
import { formatMoney, formatNumber, formatPercent } from "@/lib/format";
import { ROLES } from "@/auth/roles";
import { Card, CardBody, CardHeader, Caption } from "@/components/ui/Card";
import { MiniSelect } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { DataTable } from "@/components/ui/DataTable";
import { ProgressBar } from "@/components/ui/Stepper";
import { DashboardShell, StatBlock } from "@/components/shared";
import { DonutChart, LineAreaChart, GroupedBarChart, SegmentBar } from "@/components/charts";

/**
 * Clinic Owner.
 *
 * The question this screen answers is "is the practice healthy?" — money in,
 * money out, how well the chairs are used, and which clinician or branch is
 * carrying the load.
 */
export default function OwnerDashboard() {
  const { user } = useOutletContext() ?? {};
  const { data, loading } = useAsync(() => analyticsService.getDashboard(ROLES.OWNER), []);

  if (loading || !data) {
    return (
      <div className="grid grid-cols-12 gap-5 p-6">
        <CardSkeleton className="col-span-12 xl:col-span-8" />
        <CardSkeleton className="col-span-12 xl:col-span-4" />
        <CardSkeleton className="col-span-12 xl:col-span-4" />
        <CardSkeleton className="col-span-12 xl:col-span-8" />
      </div>
    );
  }

  const { kpis, cashflow, expenses, incomeExpense, patients, popularTreatments, stock } = data;

  const dentistColumns = [
    { key: "name", header: "Dentist", sortable: true, render: (row) => <b>{row.name}</b> },
    { key: "appointments", header: "Appointments", align: "center", sortable: true },
    {
      key: "utilisation",
      header: "Chair utilisation",
      width: 190,
      sortable: true,
      render: (row) => (
        <span className="block">
          <span className="mb-1 block text-[12px] font-bold text-ink">{row.utilisation}%</span>
          <ProgressBar
            value={row.utilisation}
            tone={row.utilisation >= 80 ? "success" : row.utilisation >= 65 ? "brand" : "warning"}
          />
        </span>
      ),
    },
    {
      key: "revenue",
      header: "Revenue",
      align: "right",
      sortable: true,
      render: (row) => <span className="font-bold">{formatMoney(row.revenue)}</span>,
    },
  ];

  return (
    <DashboardShell
      user={user}
      role={ROLES.OWNER}
      subtitle="Whole-practice performance"
      actions={
        <>
          <MiniSelect className="h-10" defaultValue="30">
            <option value="30">Last 30 days</option>
            <option value="90">Last quarter</option>
            <option value="365">Last 12 months</option>
          </MiniSelect>
          <Button leftIcon={<Download className="h-4 w-4" />}>Export board pack</Button>
        </>
      }
      kpis={[
        { label: "Revenue", value: formatMoney(kpis.revenue.total), change: kpis.revenue.change, icon: <TrendingUp className="h-5 w-5" />, tone: "success" },
        { label: "Profit", value: formatMoney(kpis.profit.total), change: kpis.profit.change, icon: <Percent className="h-5 w-5" /> },
        { label: "Chair utilisation", value: formatPercent(kpis.chairUtilisation.total, 0), change: kpis.chairUtilisation.change, icon: <Users className="h-5 w-5" />, tone: "warning" },
        { label: "Active patients", value: formatNumber(kpis.activePatients.total), change: kpis.activePatients.change, icon: <UserPlus className="h-5 w-5" />, tone: "brand" },
      ]}
    >
      <div className="grid grid-cols-12 gap-5">
        <Card className="col-span-12 xl:col-span-8">
          <CardHeader
            title="Cashflow"
            action={
              <MiniSelect defaultValue="12">
                <option value="12">Last 12 month</option>
                <option value="6">Last 6 month</option>
              </MiniSelect>
            }
          />
          <CardBody className="pt-3">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <StatBlock label="Total cash" value={formatMoney(cashflow.total)} change={cashflow.change} />
              <span className="text-[13px] font-semibold text-ink-muted">{cashflow.range}</span>
            </div>
            <div className="mt-4">
              <LineAreaChart data={cashflow.series} height={230} />
            </div>
          </CardBody>
        </Card>

        <Card className="col-span-12 xl:col-span-4">
          <CardHeader
            title="Expenses"
            action={
              <MiniSelect defaultValue="6">
                <option value="6">Last 6 months</option>
                <option value="12">Last 12 months</option>
              </MiniSelect>
            }
          />
          <CardBody className="pt-3">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <DonutChart data={expenses.slices} total={expenses.total} size={172} />
              <ul className="flex min-w-[150px] flex-1 flex-col gap-2">
                {expenses.slices.map((slice) => (
                  <li key={slice.name} className="flex items-center gap-2 text-[13px]">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: slice.color }} />
                    <span className="flex-1 truncate text-ink-muted">{slice.name}</span>
                    <span className="font-bold text-ink">{slice.value}%</span>
                  </li>
                ))}
              </ul>
            </div>

            <Caption className="mt-6 block">Top expense</Caption>
            <div className="mt-2 grid grid-cols-2 gap-2.5">
              {expenses.slices.slice(0, 4).map((slice) => (
                <div key={slice.name} className="rounded-xl border border-slate-200 px-3 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="h-1 w-2.5 rounded-full" style={{ background: slice.color }} />
                    <span className="truncate text-[12px] text-ink-muted">{slice.name}</span>
                  </div>
                  <div className="mt-1 text-[14px] font-bold text-ink">{formatMoney(slice.amount)}</div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card className="col-span-12 md:col-span-6 xl:col-span-4">
          <CardHeader
            title="Income & Expense"
            action={
              <MiniSelect defaultValue="6">
                <option value="6">Last 6 months</option>
              </MiniSelect>
            }
          />
          <CardBody className="pt-3">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <StatBlock label="Total income" accent="bg-[#8ECC97]" value={formatMoney(incomeExpense.income.total)} change={incomeExpense.income.change} />
              <StatBlock label="Total expenses" accent="bg-[#FEB509]" value={formatMoney(incomeExpense.expense.total)} change={incomeExpense.expense.change} />
            </div>
            <div className="mt-4">
              <GroupedBarChart
                data={incomeExpense.series}
                height={190}
                series={[
                  { key: "income", label: "Income", color: "#8ECC97" },
                  { key: "expense", label: "Expense", color: "#FEB509" },
                ]}
              />
            </div>
          </CardBody>
        </Card>

        <div className="col-span-12 flex flex-col gap-5 md:col-span-6 xl:col-span-4">
          <Card>
            <CardHeader title="Patients" subtitle={patients.range} />
            <CardBody className="pt-3">
              <PatientSplit data={patients} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Popular Treatment" />
            <CardBody className="flex flex-col gap-3 pt-3">
              {popularTreatments.map((item) => (
                <div key={item.name} className="flex items-center justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-2.5">
                    <span className="h-4 w-1 shrink-0 rounded-full bg-slate-300" />
                    <span className="truncate text-[13.5px] font-semibold text-ink">{item.name}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5 rounded-lg bg-slate-100 px-2 py-1">
                    <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                    <span className="text-[13px] font-bold text-ink">{item.rating}</span>
                  </span>
                </div>
              ))}
            </CardBody>
          </Card>
        </div>

        <Card className="col-span-12 md:col-span-6 xl:col-span-4">
          <CardHeader title="Stock availability" />
          <CardBody className="pt-3">
            <div className="flex flex-wrap gap-10">
              <StatBlock label="Total asset" value={formatMoney(stock.totalAsset)} />
              <StatBlock label="Total product" value={formatNumber(stock.totalProduct)} />
            </div>
            <SegmentBar segments={stock.segments} className="mt-5" />
            <div className="mt-3 flex flex-wrap gap-4">
              {stock.segments.map((segment) => (
                <span key={segment.name} className="flex items-center gap-2 text-[12px] text-ink-muted">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: segment.color }} />
                  {segment.name}
                </span>
              ))}
            </div>
            <hr className="my-4 border-slate-100" />
            <Caption>Low stock</Caption>
            <div className="mt-2.5 flex flex-col gap-2">
              {stock.lowStock.map((item) => (
                <div key={item.name} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5 text-[13px]">
                  <span className="font-semibold text-ink">{item.name}</span>
                  <span className="text-ink-muted">Qty: {item.quantity}</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card className="col-span-12 xl:col-span-7">
          <CardHeader title="Dentist performance" subtitle="Workload, utilisation and revenue" />
          <CardBody className="pt-3">
            <DataTable
              columns={dentistColumns}
              rows={data.byDentist}
              dense
              className="border-0 shadow-none"
            />
          </CardBody>
        </Card>

        <Card className="col-span-12 xl:col-span-5">
          <CardHeader title="Branches" subtitle="Revenue and utilisation by location" />
          <CardBody className="flex flex-col gap-4 pt-4">
            {data.branches.map((branch) => (
              <div key={branch.id} className="rounded-2xl border border-slate-200 px-4 py-3.5">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[13.5px] font-bold text-ink">{branch.name}</span>
                  <span className="text-[14px] font-extrabold text-ink">
                    {formatMoney(branch.revenue)}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <ProgressBar value={branch.utilisation} className="flex-1" />
                  <span className="text-[12px] font-bold text-ink-muted">
                    {branch.utilisation}%
                  </span>
                </div>
                <p className="mt-1.5 text-[12px] text-ink-soft">
                  {branch.appointments} appointments this period
                </p>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>
    </DashboardShell>
  );
}

function PatientSplit({ data }) {
  const total = data.newPatients + data.returningPatients;
  const newShare = (data.newPatients / total) * 100;
  const returningShare = 100 - newShare;

  return (
    <>
      <div className="flex items-stretch gap-4">
        <div style={{ width: `${newShare}%` }} className="min-w-0 border-l-2 border-brand-400 pl-3">
          <div className="text-[22px] font-extrabold text-ink">{data.newPatients}</div>
          <div className="mt-1 text-[12px] font-semibold text-ink">{newShare.toFixed(2)}%</div>
          <div className="truncate text-[11px] text-ink-soft">New patients</div>
        </div>
        <div style={{ width: `${returningShare}%` }} className="min-w-0 border-l-2 border-slate-300 pl-3">
          <div className="text-[22px] font-extrabold text-ink">{data.returningPatients}</div>
          <div className="mt-1 text-[12px] font-semibold text-ink">{returningShare.toFixed(2)}%</div>
          <div className="truncate text-[11px] text-ink-soft">Returning patients</div>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2">
        <span className="h-3 rounded-sm bg-[#61B1FF]" style={{ width: `${newShare}%` }} />
        <span className="flex h-3 gap-[3px] overflow-hidden" style={{ width: `${returningShare}%` }}>
          {Array.from({ length: Math.round(returningShare) }).map((_, index) => (
            <span key={index} className="h-3 w-[3px] shrink-0 rounded-sm bg-slate-300" />
          ))}
        </span>
      </div>
    </>
  );
}
