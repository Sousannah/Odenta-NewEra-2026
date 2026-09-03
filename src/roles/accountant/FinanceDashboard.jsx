import { useNavigate, useOutletContext } from "react-router-dom";
import { ArrowDownLeft, ArrowUpRight, Download, Receipt, TrendingUp, Wallet } from "lucide-react";
import { cn } from "@/lib/cn";
import { useAsync } from "@/hooks";
import { analyticsService, financeService } from "@/services";
import { formatDate, formatMoney } from "@/lib/format";
import { ROLES } from "@/auth/roles";
import { Card, CardBody, CardHeader, Caption } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/ui/DataTable";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { DashboardShell, StatBlock, toneFor } from "@/components/shared";
import { DonutChart, GroupedBarChart, HorizontalBars } from "@/components/charts";

/**
 * Accountant / finance officer.
 *
 * Cash position by pocket, what is still owed and how old it is, what was
 * spent on purchasing, and the income/expense shape of the month.
 */
export default function FinanceDashboard() {
  const { user } = useOutletContext() ?? {};
  const navigate = useNavigate();

  const { data, loading } = useAsync(() => analyticsService.getDashboard(ROLES.ACCOUNTANT), []);
  const { data: accounts = [] } = useAsync(
    () => financeService.getAccounts({ active: "true" }),
    [],
    []
  );
  const { data: transactions = [] } = useAsync(() => financeService.getTransactions(), [], []);
  const { data: bills = [] } = useAsync(() => financeService.getBills(), [], []);

  if (loading || !data) {
    return (
      <div className="grid grid-cols-12 gap-5 p-6">
        <CardSkeleton className="col-span-12 xl:col-span-8" />
        <CardSkeleton className="col-span-12 xl:col-span-4" />
      </div>
    );
  }

  const { kpis, incomeExpense, expenses, ageing } = data;
  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
  const openBills = bills.filter((item) => item.payment !== "FULLY PAID");

  const billColumns = [
    { key: "id", header: "Bill", sortable: true, render: (row) => <b>#{row.id}</b> },
    { key: "patient", header: "Patient", sortable: true },
    {
      key: "reservationDate",
      header: "Date",
      sortable: true,
      render: (row) => formatDate(row.reservationDate),
    },
    {
      key: "payment",
      header: "Status",
      render: (row) => <Badge tone={toneFor(row.payment)}>{row.payment}</Badge>,
    },
    {
      key: "total",
      header: "Amount",
      align: "right",
      sortable: true,
      render: (row) => <span className="font-bold">{formatMoney(row.total)}</span>,
    },
  ];

  return (
    <DashboardShell
      user={user}
      role={ROLES.ACCOUNTANT}
      subtitle="Cash position & receivables"
      actions={
        <>
          <Button variant="secondary" leftIcon={<Wallet className="h-4 w-4" />} onClick={() => navigate("/accounts")}>
            Accounts
          </Button>
          <Button leftIcon={<Download className="h-4 w-4" />}>Export ledger</Button>
        </>
      }
      kpis={[
        { label: "Revenue", value: formatMoney(kpis.revenue.total), change: kpis.revenue.change, icon: <TrendingUp className="h-5 w-5" />, tone: "success" },
        { label: "Collected today", value: formatMoney(kpis.collected.total), change: kpis.collected.change, icon: <ArrowDownLeft className="h-5 w-5" /> },
        { label: "Outstanding", value: formatMoney(kpis.outstanding.total), change: kpis.outstanding.change, tone: "danger", icon: <Receipt className="h-5 w-5" /> },
        { label: "Purchases", value: formatMoney(kpis.purchases.total), change: kpis.purchases.change, tone: "warning", icon: <ArrowUpRight className="h-5 w-5" /> },
      ]}
    >
      <div className="grid grid-cols-12 gap-5">
        <Card className="col-span-12 xl:col-span-8">
          <CardHeader
            title="Account balances"
            subtitle={`${accounts.length} active pocket(s)`}
            action={
              <Button variant="link" size="sm" onClick={() => navigate("/accounts")}>
                Transfer money
              </Button>
            }
          />
          <CardBody className="pt-3">
            <StatBlock label="Total balance" value={formatMoney(totalBalance)} />
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {accounts.map((account) => (
                <button
                  key={account.id}
                  type="button"
                  onClick={() => navigate("/accounts")}
                  className="rounded-2xl border border-slate-200 px-4 py-3.5 text-left transition hover:border-brand-300 hover:bg-brand-50/40"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-[13px] font-bold text-ink">{account.name}</span>
                    {account.isDefault ? <Badge tone="neutral">Default</Badge> : null}
                  </div>
                  <div className="mt-1.5 text-[18px] font-extrabold text-ink">
                    {formatMoney(account.balance)}
                  </div>
                </button>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card className="col-span-12 xl:col-span-4">
          <CardHeader title="Receivables ageing" subtitle="How old the debt is" />
          <CardBody className="pt-4">
            <HorizontalBars
              data={ageing.map((row) => ({ name: row.bucket, value: row.value }))}
              valueFormatter={(value) => formatMoney(value)}
              color="#E45689"
            />
          </CardBody>
        </Card>

        <Card className="col-span-12 xl:col-span-7">
          <CardHeader title="Income & expense" subtitle="Last six months" />
          <CardBody className="pt-3">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <StatBlock label="Total income" accent="bg-[#8ECC97]" value={formatMoney(incomeExpense.income.total)} change={incomeExpense.income.change} />
              <StatBlock label="Total expenses" accent="bg-[#FEB509]" value={formatMoney(incomeExpense.expense.total)} change={incomeExpense.expense.change} />
            </div>
            <div className="mt-4">
              <GroupedBarChart
                data={incomeExpense.series}
                height={220}
                series={[
                  { key: "income", label: "Income", color: "#8ECC97" },
                  { key: "expense", label: "Expense", color: "#FEB509" },
                ]}
              />
            </div>
          </CardBody>
        </Card>

        <Card className="col-span-12 xl:col-span-5">
          <CardHeader title="Expense split" subtitle={expenses.range} />
          <CardBody className="flex flex-wrap items-center justify-between gap-4 pt-3">
            <DonutChart data={expenses.slices} total={expenses.total} size={168} />
            <ul className="flex min-w-[150px] flex-1 flex-col gap-2">
              {expenses.slices.map((slice) => (
                <li key={slice.name} className="flex items-center gap-2 text-[13px]">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: slice.color }} />
                  <span className="flex-1 truncate text-ink-muted">{slice.name}</span>
                  <span className="font-bold text-ink">{slice.value}%</span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>

        <Card className="col-span-12 xl:col-span-7">
          <CardHeader
            title="Open bills"
            subtitle={`${openBills.length} awaiting payment`}
            action={
              <Button variant="link" size="sm" onClick={() => navigate("/sales")}>
                Go to sales
              </Button>
            }
          />
          <CardBody className="pt-3">
            <DataTable
              columns={billColumns}
              rows={openBills}
              dense
              onRowClick={() => navigate("/sales")}
              className="border-0 shadow-none"
              emptyTitle="Nothing outstanding"
            />
          </CardBody>
        </Card>

        <Card className="col-span-12 xl:col-span-5">
          <CardHeader title="Recent movements" subtitle="Across every pocket" />
          <CardBody className="pt-2">
            <ul className="flex flex-col">
              {transactions.slice(0, 7).map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-center justify-between gap-3 border-b border-slate-100 py-2.5 last:border-b-0"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-semibold text-ink">
                      {entry.label}
                    </span>
                    <span className="block truncate text-[11.5px] text-ink-soft">
                      {formatDate(entry.date, "d MMM HH:mm")} · {entry.method}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "shrink-0 text-[13px] font-bold",
                      entry.direction === "in" ? "text-success-strong" : "text-danger"
                    )}
                  >
                    {entry.direction === "in" ? "+" : "−"}
                    {formatMoney(entry.amount)}
                  </span>
                </li>
              ))}
            </ul>
            <Caption className="mt-4 block">
              Every movement is written to the audit log with the acting user.
            </Caption>
          </CardBody>
        </Card>
      </div>
    </DashboardShell>
  );
}
