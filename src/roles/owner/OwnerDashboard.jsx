import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Download, Percent, Star, TrendingUp, UserPlus, Users } from "lucide-react";
import { useAsync } from "@/hooks";
import { ownerService } from "@/services";
import { formatMoney, formatNumber, formatPercent } from "@/lib/format";
import { ROLES } from "@/auth/roles";
import { Card, CardBody, CardHeader, Caption } from "@/components/ui/Card";
import { MiniSelect } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { OdentaLoaderPanel } from "@/components/ui/OdentaLoader";
import { DataTable } from "@/components/ui/DataTable";
import { ProgressBar } from "@/components/ui/Stepper";
import { DashboardShell, StatBlock } from "@/components/shared";
import { DonutChart, LineAreaChart, GroupedBarChart, HorizontalBars, SegmentBar } from "@/components/charts";

/**
 * Clinic Owner.
 *
 * The question this screen answers is "is the practice healthy?" — money in,
 * money out, how well the chairs are used, and which clinician or branch is
 * carrying the load.
 *
 * It also carries what used to sit on a separate accountant's board. In an
 * Egyptian private practice the owner *is* the finance function: the desk takes
 * the cash, and the owner is the one who has to notice that a quarter of it is
 * sixty days old.
 */
/**
 * The windows the board offers.
 *
 * A fixed set rather than a free day count, matching the server: each value is
 * its own cache entry there, and an unbounded parameter would turn the
 * most-refreshed screen in the product into the most expensive one.
 */
const RANGES = [
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last quarter" },
  { value: "365", label: "Last 12 months" },
];

export default function OwnerDashboard() {
  const { user } = useOutletContext() ?? {};

  /**
   * The range selector drives the fetch.
   *
   * It used to be a `defaultValue` on an uncontrolled select — three options
   * that changed nothing, which is worse than no control at all: the numbers
   * stay still and the reader concludes the practice had an identical quarter.
   */
  const [range, setRange] = useState("30");
  const { data, loading } = useAsync(() => ownerService.getBoard(range), [range], null, {
    /* The heaviest read in the practice portal, and the first thing an owner
       sees every time they open the app. */
    key: `clinic:owner-board:${range}`,
  });

  /* Held across a range change so switching window does not blank the page —
     the previous board stays up, dimmed, while the next one arrives. */
  if (!data) {
    return <OdentaLoaderPanel />;
  }

  const { kpis, cashflow, expenses, incomeExpense, patients, popularTreatments, stock, ageing, outstanding } = data;

  const outstandingTotal = ageing.reduce((sum, row) => sum + row.value, 0);
  /* Guarded because a practice with nothing outstanding divides by zero here,
     and the tile it produces reads "NaN% over 90 days". */
  const over90Share = outstandingTotal > 0 ? Math.round((ageing[ageing.length - 1].value / outstandingTotal) * 100) : 0;

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
          <MiniSelect
            className="h-10"
            value={range}
            disabled={loading}
            onChange={(event) => setRange(event.target.value)}
          >
            {RANGES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </MiniSelect>
          <Button
            leftIcon={<Download className="h-4 w-4" />}
            onClick={() => exportBoardPack(data, range)}
          >
            Export board pack
          </Button>
        </>
      }
      kpis={[
        { label: "Revenue", value: formatMoney(kpis.revenue.total), change: kpis.revenue.change, icon: <TrendingUp className="h-5 w-5" />, tone: "success" },
        { label: "Profit", value: formatMoney(kpis.profit.total), change: kpis.profit.change, icon: <Percent className="h-5 w-5" /> },
        { label: "Chair utilisation", value: formatPercent(kpis.chairUtilisation.total, 0), change: kpis.chairUtilisation.change, icon: <Users className="h-5 w-5" />, tone: "warning" },
        { label: "Active patients", value: formatNumber(kpis.activePatients.total), change: kpis.activePatients.change, icon: <UserPlus className="h-5 w-5" />, tone: "brand" },
      ]}
    >
      {/* Dimmed rather than replaced while a new window loads: the previous
          board stays readable, so changing range does not blank the page and
          then repaint it. */}
      <div
        className={`grid grid-cols-12 gap-5 transition-opacity ${loading ? "pointer-events-none opacity-60" : ""}`}
        aria-busy={loading}
      >
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
              <StatBlock label="Total income" accent="bg-success" value={formatMoney(incomeExpense.income.total)} change={incomeExpense.income.change} />
              <StatBlock label="Total expenses" accent="bg-warning" value={formatMoney(incomeExpense.expense.total)} change={incomeExpense.expense.change} />
            </div>
            <div className="mt-4">
              <GroupedBarChart
                data={incomeExpense.series}
                height={190}
                series={[
                  { key: "income", label: "Income", color: "#8ECC97", format: "money" },
                  { key: "expense", label: "Expense", color: "#FEB509", format: "money" },
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

        <Card className="col-span-12 md:col-span-6 xl:col-span-4">
          <CardHeader
            title="Outstanding balances"
            subtitle="What patients still owe, by age"
          />
          <CardBody className="pt-3">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <StatBlock
                label="Total outstanding"
                value={formatMoney(outstandingTotal)}
                change={outstanding.change}
              />
              <span className="text-[12px] font-semibold text-ink-soft">
                {over90Share}% over 90 days
              </span>
            </div>
            <div className="mt-4">
              <HorizontalBars
                data={ageing.map((row) => ({ name: row.bucket, value: row.value }))}
                valueFormatter={formatMoney}
              />
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

/**
 * Export the board as a CSV the owner can open in Excel.
 *
 * Generated in the browser from the payload already on screen, deliberately.
 * The alternative — a server endpoint that rebuilds and renders it — would mean
 * a second implementation of every fold on this page, and the day the two
 * disagreed the exported figure and the displayed one would both be defensible.
 * Here the file is definitionally what the owner is looking at.
 *
 * CSV rather than PDF because this is the number-checking artefact: it gets
 * pasted into a spreadsheet next to a bank statement. The board *pack* a PDF
 * implies is a different deliverable and would be the server's job.
 */
function exportBoardPack(board, range) {
  const rows = [
    ["Odenta — practice board", `Last ${range} days`],
    ["Generated", new Date().toISOString()],
    [],
    ["Metric", "Value", "Change %"],
    ["Revenue", board.kpis.revenue.total, board.kpis.revenue.change ?? ""],
    ["Profit", board.kpis.profit.total, board.kpis.profit.change ?? ""],
    ["Chair utilisation %", board.kpis.chairUtilisation.total, board.kpis.chairUtilisation.change ?? ""],
    ["Active patients", board.kpis.activePatients.total, board.kpis.activePatients.change ?? ""],
    [],
    ["Dentist", "Appointments", "Revenue", "Utilisation %"],
    ...board.byDentist.map((row) => [row.name, row.appointments, row.revenue, row.utilisation]),
    [],
    ["Branch", "Appointments", "Revenue", "Utilisation %"],
    ...board.branches.map((row) => [row.name, row.appointments, row.revenue, row.utilisation]),
    [],
    ["Expense category", "Amount", "Share %"],
    ...board.expenses.slices.map((slice) => [slice.name, slice.amount, slice.value]),
    [],
    ["Receivables age", "Amount"],
    ...board.ageing.map((row) => [row.bucket, row.value]),
  ];

  /**
   * Escaped properly, because a branch name contains a comma and a category
   * can contain an ampersand and a quote. `rows.join(",")` produces a file that
   * opens with the columns shifted from the first such value onwards — wrong,
   * and it looks fine until somebody reconciles it.
   */
  const escape = (value) => {
    const text = value === null || value === undefined ? "" : String(value);
    return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };

  const csv = rows.map((row) => row.map(escape).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));

  const link = document.createElement("a");
  link.href = url;
  link.download = `odenta-board-${range}d-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  /* Revoked on the next tick rather than immediately — Safari has not started
     the download by the time the click handler returns. */
  setTimeout(() => URL.revokeObjectURL(url), 1000);
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
        <span className="h-3 rounded-sm bg-brand-400" style={{ width: `${newShare}%` }} />
        <span className="flex h-3 gap-[3px] overflow-hidden" style={{ width: `${returningShare}%` }}>
          {Array.from({ length: Math.round(returningShare) }).map((_, index) => (
            <span key={index} className="h-3 w-[3px] shrink-0 rounded-sm bg-slate-300" />
          ))}
        </span>
      </div>
    </>
  );
}
