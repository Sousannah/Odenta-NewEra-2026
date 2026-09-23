import { useState } from "react";
import {
  CalendarRange,
  Download,
  PiggyBank,
  Printer,
  Receipt,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useAsync, useDisclosure } from "@/hooks";
import { financeService } from "@/services";
import { formatDate, formatMoney } from "@/lib/format";
import { P } from "@/auth/permissions";
import { useAuth } from "@/auth/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { DataTable } from "@/components/ui/DataTable";
import { Button, IconButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { SearchInput } from "@/components/ui/Misc";
import { StatCard, StatGrid, Toolbar, toneFor } from "@/components/shared";
import { BillPaymentModal } from "./BillPaymentModal";

function BillLines({ bill, onPay, canPay }) {
  return (
    <div className="divide-y divide-slate-100">
      {bill.items.map((item) => (
        <div key={item.id} className="flex flex-wrap items-center gap-4 py-3">
          <span className="w-[150px] text-[13px] text-ink-muted">
            Bill ID <b className="text-ink">#{item.ref}</b>
          </span>
          <span className="flex-1 text-[13px] text-ink-muted">
            For <b className="text-ink">{item.label}</b>
          </span>
          <span className="text-[13px] text-ink-muted">
            Amount <b className="text-ink">{formatMoney(item.amount)}</b>
          </span>
          {item.status === "SET PAYMENT" && canPay ? (
            <Button size="sm" onClick={() => onPay(bill)}>
              Set Payment
            </Button>
          ) : (
            <Badge tone={toneFor(item.status)}>{item.status}</Badge>
          )}
          <span className="flex items-center gap-1">
            <IconButton label="Download bill" size="sm">
              <Download className="h-4 w-4 text-ink-soft" />
            </IconButton>
            <IconButton label="Print bill" size="sm">
              <Printer className="h-4 w-4 text-ink-soft" />
            </IconButton>
          </span>
        </div>
      ))}
    </div>
  );
}

export default function SalesPage() {
  const { can } = useAuth();
  const canPay = can(P.PAYMENT_TAKE);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const payment = useDisclosure();

  /**
   * How many rows a tab loads at once.
   *
   * Named, because the tab badge has to know it. Both of these endpoints are
   * bounded server-side — bills by a continuation token, payments by the month
   * window — so a bare `bills.length` in the badge silently becomes a lie about
   * the practice the moment there is more than one page of them, and it is a
   * lie that looks entirely plausible. `PAGE_SIZE` lets the badge say "50+"
   * instead of claiming there are exactly fifty.
   */
  const PAGE_SIZE = 50;

  const { data: summary } = useAsync(() => financeService.getSummary(), []);
  const { data: bills = [], loading, refetch } = useAsync(
    () => financeService.getBills({ q: query, limit: PAGE_SIZE }),
    [query],
    []
  );
  const { data: payments = [], refetch: refetchPayments } = useAsync(
    () => financeService.getPayments({ q: query, limit: PAGE_SIZE }),
    [query],
    []
  );

  /**
   * A full page means there is probably another one behind it.
   *
   * Deliberately not a count query. The real "how much is still owed" figure is
   * the Outstanding tile above, which the server answers with one aggregate —
   * so paying for a second COUNT on every keystroke of the search box, to put
   * an exact number on a tab, would be buying precision nobody acts on.
   */
  const badge = (rows) => (rows.length >= PAGE_SIZE ? `${PAGE_SIZE}+` : rows.length);

  const openPayment = (bill) => {
    setSelected(bill);
    payment.open();
  };

  const billColumns = [
    {
      key: "appointmentId",
      header: "Reservation ID",
      sortable: true,
      render: (row) => (
        <span className="flex items-center gap-2">
          <span className="text-[13.5px] font-bold text-ink">#{row.appointmentId}</span>
          {row.isNew ? <Badge tone="info">New</Badge> : null}
        </span>
      ),
    },
    {
      key: "patient",
      header: "Patient name",
      sortable: true,
      render: (row) => (
        <span className="flex items-center gap-2.5">
          <Avatar name={row.patient} size="xs" />
          <span className="text-[13.5px] font-semibold text-brand-700">{row.patient}</span>
        </span>
      ),
    },
    {
      key: "items",
      header: "Number of bill",
      render: (row) => {
        const paid = row.items.filter((item) => item.status === "PAID").length;
        return `${paid}/${row.items.length}`;
      },
    },
    {
      key: "reservationDate",
      header: "Reservation date",
      sortable: true,
      render: (row) => formatDate(row.reservationDate),
    },
    {
      key: "total",
      header: "Total amount",
      sortable: true,
      align: "right",
      render: (row) => <span className="font-bold">{formatMoney(row.total)}</span>,
    },
    {
      key: "payment",
      header: "Payment",
      render: (row) => <Badge tone={toneFor(row.payment)}>{row.payment}</Badge>,
    },
  ];

  const paymentColumns = [
    { key: "id", header: "Payment ID", sortable: true },
    {
      key: "patient",
      header: "Patient",
      render: (row) => (
        <span className="flex items-center gap-2.5">
          <Avatar name={row.patient} size="xs" />
          <span className="text-[13.5px] font-semibold text-ink">{row.patient}</span>
        </span>
      ),
    },
    { key: "billId", header: "Bill" },
    {
      key: "date",
      header: "Received at",
      sortable: true,
      render: (row) => formatDate(row.date, "dd MMM yyyy · HH:mm"),
    },
    { key: "method", header: "Method", render: (row) => <Badge tone="neutral">{row.method}</Badge> },
    { key: "account", header: "Account" },
    { key: "receivedBy", header: "Received by" },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      sortable: true,
      render: (row) => (
        <span className="font-bold text-success-strong">{formatMoney(row.amount)}</span>
      ),
    },
  ];

  const toolbar = (
    <Toolbar
      className="mb-4"
      left={
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search name or reservation ID…"
          className="w-full sm:w-[300px]"
        />
      }
      right={
        <>
          <Button variant="secondary" leftIcon={<CalendarRange className="h-4 w-4" />}>
            {summary?.range ?? "This month"}
          </Button>
          <Button leftIcon={<Download className="h-4 w-4" />}>Export</Button>
        </>
      }
    />
  );

  return (
    <div className="flex flex-col gap-5 px-6 pb-6 pt-5">
      <StatGrid cols={4}>
        <StatCard
          label="Revenue this month"
          value={formatMoney(summary?.revenue?.total ?? 0)}
          change={summary?.revenue?.change}
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <StatCard
          label="Profit this month"
          value={formatMoney(summary?.profit?.total ?? 0)}
          change={summary?.profit?.change}
          tone="success"
          icon={<Wallet className="h-5 w-5" />}
        />
        <StatCard
          label="Outstanding"
          value={formatMoney(summary?.outstanding?.total ?? 0)}
          change={summary?.outstanding?.change}
          tone="danger"
          icon={<Receipt className="h-5 w-5" />}
        />
        <StatCard
          label="Collected today" value={formatMoney(summary?.collected?.total ?? 0)} change={summary?.collected?.change} tone="warning"
          icon={<PiggyBank className="h-5 w-5" />}
        />
      </StatGrid>

      <Tabs defaultValue="bill">
        <TabsList>
          <TabsTrigger value="bill" badge={badge(bills)}>
            Bill
          </TabsTrigger>
          <TabsTrigger value="received" badge={badge(payments)}>
            Payment Received
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bill" className="pt-5">
          {toolbar}
          <DataTable
            columns={billColumns}
            rows={bills}
            loading={loading}
            initialExpanded={bills[0] ? [bills[0].id] : []}
            expandable={(bill) => <BillLines bill={bill} onPay={openPayment} canPay={canPay} />}
            emptyTitle="No bills yet"
            emptyDescription="Finished treatments create a bill automatically."
          />
        </TabsContent>

        <TabsContent value="received" className="pt-5">
          {toolbar}
          <DataTable columns={paymentColumns} rows={payments} emptyTitle="No payments received" />
        </TabsContent>
      </Tabs>

      <BillPaymentModal
        open={payment.isOpen}
        onClose={() => {
          payment.close();
          refetch();
          refetchPayments();
        }}
        bill={selected}
      />
    </div>
  );
}
