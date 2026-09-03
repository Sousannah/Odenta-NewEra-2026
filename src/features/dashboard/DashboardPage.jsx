import { useOutletContext } from "react-router-dom";
import { Star } from "lucide-react";
import { useAsync } from "@/hooks";
import { analyticsService } from "@/services";
import { formatLongDate, formatMoney, formatNumber, greetingFor } from "@/lib/format";
import { Card, CardBody, CardHeader, Caption } from "@/components/ui/Card";
import { MiniSelect } from "@/components/ui/Field";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { StatBlock } from "@/components/shared";
import { DonutChart, GroupedBarChart, LineAreaChart, SegmentBar } from "@/components/charts";

/* --------------------------------------------------------------- greeting */

function Greeting({ user }) {
  const now = new Date();
  return (
    <div>
      <h2 className="text-2xl font-extrabold text-ink">
        {greetingFor(now)}, {user?.firstName ?? "there"}!
      </h2>
      <p className="mt-1 text-sm font-medium text-ink-soft">{formatLongDate(now)}</p>
    </div>
  );
}

/* --------------------------------------------------------------- cashflow */

function CashflowCard({ data }) {
  return (
    <Card className="col-span-12 xl:col-span-8">
      <CardHeader
        title="Cashflow"
        action={
          <MiniSelect defaultValue="12">
            <option value="12">Last 12 month</option>
            <option value="6">Last 6 month</option>
            <option value="3">Last 3 month</option>
          </MiniSelect>
        }
      />
      <CardBody className="pt-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <StatBlock label="Total cash" value={formatMoney(data.total)} change={data.change} />
          <span className="text-[13px] font-semibold text-ink-muted">{data.range}</span>
        </div>
        <div className="mt-4">
          <LineAreaChart data={data.series} height={230} />
        </div>
      </CardBody>
    </Card>
  );
}

/* --------------------------------------------------------------- expenses */

function ExpensesCard({ data }) {
  const top = data.slices.slice(0, 4);
  return (
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
          <DonutChart data={data.slices} total={data.total} size={172} />
          <ul className="flex min-w-[150px] flex-1 flex-col gap-2">
            {data.slices.map((slice) => (
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
          {top.map((slice) => (
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
  );
}

/* -------------------------------------------------------- income & expense */

function IncomeExpenseCard({ data }) {
  return (
    <Card className="col-span-12 md:col-span-6 xl:col-span-4">
      <CardHeader
        title="Income & Expense"
        action={
          <MiniSelect defaultValue="6">
            <option value="6">Last 6 months</option>
            <option value="12">Last 12 months</option>
          </MiniSelect>
        }
      />
      <CardBody className="pt-3">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <StatBlock
            label="Total income"
            accent="bg-[#8ECC97]"
            value={formatMoney(data.income.total)}
            change={data.income.change}
          />
          <StatBlock
            label="Total expenses"
            accent="bg-[#FEB509]"
            value={formatMoney(data.expense.total)}
            change={data.expense.change}
          />
        </div>
        <div className="mt-4">
          <GroupedBarChart
            data={data.series}
            series={[
              { key: "income", label: "Income", color: "#8ECC97" },
              { key: "expense", label: "Expense", color: "#FEB509" },
            ]}
            height={190}
          />
        </div>
      </CardBody>
    </Card>
  );
}

/* --------------------------------------------------------------- patients */

function PatientsCard({ data }) {
  const total = data.newPatients + data.returningPatients;
  const newShare = (data.newPatients / total) * 100;
  const returningShare = 100 - newShare;

  return (
    <Card>
      <CardHeader
        title="Patients"
        action={
          <MiniSelect defaultValue="month">
            <option value="month">This month</option>
            <option value="last">Last month</option>
          </MiniSelect>
        }
      />
      <CardBody className="pt-3">
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
          <span
            className="h-3 rounded-sm bg-[#61B1FF]"
            style={{ width: `${newShare}%` }}
            aria-hidden="true"
          />
          <span
            className="flex h-3 gap-[3px] overflow-hidden"
            style={{ width: `${returningShare}%` }}
            aria-hidden="true"
          >
            {Array.from({ length: Math.round(returningShare) }).map((_, index) => (
              <span key={index} className="h-3 w-[3px] shrink-0 rounded-sm bg-slate-300" />
            ))}
          </span>
        </div>
      </CardBody>
    </Card>
  );
}

/* ----------------------------------------------------- popular treatments */

function PopularTreatmentsCard({ data }) {
  return (
    <Card>
      <CardHeader title="Popular Treatment" />
      <CardBody className="flex flex-col gap-3 pt-3">
        {data.map((item) => (
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
  );
}

/* ------------------------------------------------------------------ stock */

function StockCard({ data }) {
  return (
    <Card className="col-span-12 md:col-span-6 xl:col-span-4">
      <CardHeader title="Stock availability" />
      <CardBody className="pt-3">
        <div className="flex flex-wrap gap-10">
          <StatBlock label="Total asset" value={formatMoney(data.totalAsset)} />
          <StatBlock label="Total product" value={formatNumber(data.totalProduct)} />
        </div>

        <SegmentBar segments={data.segments} className="mt-5" />

        <div className="mt-3 flex flex-wrap gap-4">
          {data.segments.map((segment) => (
            <span key={segment.name} className="flex items-center gap-2 text-[12px] text-ink-muted">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: segment.color }} />
              {segment.name}
            </span>
          ))}
        </div>

        <hr className="my-4 border-slate-100" />

        <div className="flex items-center justify-between">
          <Caption>Low stock</Caption>
          <button type="button" className="text-[12px] font-bold text-brand-600 hover:text-brand-800">
            View all
          </button>
        </div>

        <div className="mt-2.5 flex flex-col gap-2">
          {data.lowStock.map((item) => (
            <div
              key={item.name}
              className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5 text-[13px]"
            >
              <span className="font-semibold text-ink">{item.name}</span>
              <span className="flex items-center gap-2.5">
                <span className="text-ink-muted">Qty: {item.quantity}</span>
                <span className="h-4 w-px bg-slate-300" />
                <button type="button" className="font-bold text-brand-600 hover:text-brand-800">
                  Order
                </button>
              </span>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}

/* ------------------------------------------------------------------ page */

export default function DashboardPage() {
  const { user } = useOutletContext() ?? {};
  const { data, loading } = useAsync(() => analyticsService.getDashboard(), []);

  return (
    <div className="flex flex-col gap-6 p-6">
      <Greeting user={user} />

      {loading || !data ? (
        <div className="grid grid-cols-12 gap-5">
          <CardSkeleton className="col-span-12 xl:col-span-8" />
          <CardSkeleton className="col-span-12 xl:col-span-4" />
          <CardSkeleton className="col-span-12 xl:col-span-4" />
          <CardSkeleton className="col-span-12 xl:col-span-4" />
          <CardSkeleton className="col-span-12 xl:col-span-4" />
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-5">
          <CashflowCard data={data.cashflow} />
          <ExpensesCard data={data.expenses} />

          <IncomeExpenseCard data={data.incomeExpense} />

          {/* middle column stacks patients over the popular-treatment list */}
          <div className="col-span-12 flex flex-col gap-5 md:col-span-6 xl:col-span-4">
            <PatientsCard data={data.patients} />
            <PopularTreatmentsCard data={data.popularTreatments} />
          </div>

          <StockCard data={data.stock} />
        </div>
      )}
    </div>
  );
}
