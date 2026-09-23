import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Banknote, Hourglass, PiggyBank, Plus, Receipt, TrendingUp } from "lucide-react";
import { useAsync, useDisclosure } from "@/hooks";
import { platformService } from "@/services";
import { formatDate, formatNumber } from "@/lib/format";
import { platform } from "@/config/paths";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { MiniSelect } from "@/components/ui/Field";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { InfoBanner } from "@/components/ui/Misc";
import { useToast } from "@/components/ui/Toast";
import { PageHeader, StatCard, StatGrid, Toolbar } from "@/components/shared";
import { GroupedBarChart } from "@/components/charts";
import InvoiceDraftModal from "./InvoiceDraftModal";
import RecordPaymentModal from "./RecordPaymentModal";
import { INVOICE_TONE, formatEgp, formatEgpCompact } from "./platformFormat";

/**
 * The money.
 *
 * ## Two different truths, shown together
 *
 * `recurring` is what the contracts say is due each month, folded from the
 * tenant list at zero cost. `ledger` is what has actually been invoiced and
 * collected. They disagree constantly — a tenant signed mid-month, an invoice
 * not yet raised, a transfer still in the banking system — and a billing screen
 * that showed one number would be lying about whichever question was being
 * asked. So both are on screen, labelled.
 *
 * ## Nothing here charges anybody
 *
 * Odenta's customers are universities and clinics paying by transfer against a
 * purchase order, which is the instrument that matters in this market. So this
 * is a ledger: a payment is a record of money that has already moved. Adding a
 * card gateway later is one new method and a webhook, and no change to the
 * shape of this screen.
 *
 * ## Invoices are not edited
 *
 * An issued invoice is immutable — its status moves and nothing else does. A
 * mistake is corrected by voiding and reissuing, and a refund is a credit note.
 * An invoice is a document a tenant's finance department has already filed, and
 * silently changing a number they hold a copy of is how a dispute becomes
 * unresolvable.
 */
export default function BillingPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const draftModal = useDisclosure();
  const paymentModal = useDisclosure();

  const [tenantId, setTenantId] = useState("all");
  const [status, setStatus] = useState("all");

  const { data: tenants = [] } = useAsync(() => platformService.getTenants(), [], []);
  const { data: summary, refetch: refetchSummary } = useAsync(
    () => platformService.getBillingSummary({ months: 12 }),
    []
  );
  const { data: invoices = [], loading, refetch } = useAsync(
    () => platformService.getInvoices({ tenantId, status, limit: 100 }),
    [tenantId, status],
    []
  );

  const after = () => {
    refetch();
    refetchSummary();
  };

  const setStatusFor = async (invoice, next) => {
    try {
      await platformService.setInvoiceStatus(invoice.invoiceId, { status: next });
      toast.success(`${invoice.number} is ${next}`, invoice.tenantName);
      after();
    } catch (error) {
      toast.error("Could not update that invoice", error.message);
    }
  };

  const recurring = summary?.recurring;
  const ledger = summary?.ledger;

  return (
    <div className="flex flex-col gap-4 p-4 sm:gap-5 sm:p-6">
      <PageHeader
        title="Billing"
        description="A ledger, not a payment processor — a payment here is a record of money that has already arrived. Issued invoices are never edited; a mistake is voided and reissued."
        actions={
          <>
            <Button
              variant="secondary"
              leftIcon={<Banknote className="h-4 w-4" />}
              onClick={paymentModal.open}
            >
              Record a payment
            </Button>
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={draftModal.open}>
              Draft an invoice
            </Button>
          </>
        }
      />

      {ledger?.overdue?.length ? (
        <InfoBanner tone="warning">
          {ledger.overdue.length} {ledger.overdue.length === 1 ? "tenant is" : "tenants are"} overdue
          — {formatEgpCompact(ledger.overdueEgp)} outstanding, oldest{" "}
          {ledger.overdue[0].daysLate} days late ({ledger.overdue[0].tenantName}).
        </InfoBanner>
      ) : null}

      <StatGrid cols={4}>
        <StatCard
          label="Monthly recurring"
          value={formatEgpCompact(recurring?.mrrEgp ?? 0)}
          tone="success"
          icon={<Receipt className="h-5 w-5" />}
        />
        <StatCard
          label="Annual run rate" value={formatEgpCompact(recurring?.arrEgp ?? 0)} tone="success"
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <StatCard
          label="Outstanding" value={formatEgpCompact(ledger?.outstandingEgp ?? 0)} tone={ledger?.overdueEgp ? "warning" : "brand"}
          icon={<Hourglass className="h-5 w-5" />}
        />
        <StatCard
          label="Collected" value={`${ledger?.collectionRatePct ?? 100}%`} tone={(ledger?.collectionRatePct ?? 100) < 90 ? "danger" : "success"}
          icon={<PiggyBank className="h-5 w-5" />}
        />
      </StatGrid>

      <div className="grid grid-cols-12 gap-5">
        {/* ------------------------------------------------- billed vs paid */}
        <Card className="col-span-12 xl:col-span-8">
          <CardHeader
            title="Billed and collected"
            subtitle="By the period the invoice is for, not by when it was raised"
          />
          <CardBody className="pt-3">
            {ledger?.series?.length ? (
              <GroupedBarChart
                data={ledger.series.map((entry) => ({
                  period: entry.period,
                  /* Charted in whole EGP rather than piastres — a y-axis in
                     hundredths of a currency unit is unreadable. */
                  billed: Math.round(entry.billedEgp / 100),
                  collected: Math.round(entry.collectedEgp / 100),
                }))}
                xKey="period"
                height={260}
                series={[
                  { key: "billed", label: "Billed", color: "#8AB6D6", format: "money" },
                  { key: "collected", label: "Collected", color: "#20B2AA", format: "money" },
                ]}
              />
            ) : (
              <EmptyState title="Nothing invoiced yet" className="py-12" />
            )}
          </CardBody>
        </Card>

        {/* -------------------------------------------------------- by plan */}
        <Card className="col-span-12 xl:col-span-4">
          <CardHeader title="Revenue by plan" subtitle="What the contracts say" />
          <CardBody className="pt-2">
            <ul className="flex flex-col gap-2.5">
              {(recurring?.byPlan ?? []).map((entry) => (
                <li
                  key={entry.plan}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3.5 py-2.5"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-bold text-ink">{entry.label}</span>
                    <span className="block text-[12px] text-ink-soft">
                      {entry.tenants} {entry.tenants === 1 ? "tenant" : "tenants"}
                    </span>
                  </span>
                  <span className="shrink-0 text-[13px] font-extrabold text-ink">
                    {formatEgpCompact(entry.mrrEgp)}
                  </span>
                </li>
              ))}
            </ul>
            {recurring?.trialing ? (
              <p className="mt-3 text-[12px] text-ink-soft">
                {recurring.trialing} on trial, contributing nothing yet — the pipeline, not the
                revenue.
              </p>
            ) : null}
          </CardBody>
        </Card>

        {/* -------------------------------------------------------- overdue */}
        {ledger?.overdue?.length ? (
          <Card className="col-span-12 xl:col-span-5">
            <CardHeader title="Chase list" subtitle="Longest overdue first" />
            <CardBody className="pt-2">
              <ul className="flex flex-col gap-2">
                {ledger.overdue.map((row) => (
                  <li key={`${row.tenantId}-${row.dueAt}`}>
                    <button
                      type="button"
                      onClick={() => navigate(platform.tenant(row.tenantId))}
                      className="od-focus flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 px-3.5 py-2.5 text-left transition hover:bg-slate-50"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-[13px] font-bold text-ink">
                          {row.tenantName ?? row.tenantId}
                        </span>
                        <span className="block text-[12px] text-ink-soft">
                          due {formatDate(row.dueAt)} · {row.daysLate} days late
                        </span>
                      </span>
                      <span className="shrink-0 text-[13px] font-extrabold text-danger">
                        {formatEgp(row.owedEgp)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        ) : null}
      </div>

      <Toolbar
        left={
          <MiniSelect value={tenantId} onChange={(event) => setTenantId(event.target.value)}>
            <option value="all">Every tenant</option>
            {tenants.map((tenant) => (
              <option key={tenant.tenantId} value={tenant.tenantId}>
                {tenant.shortName ?? tenant.name}
              </option>
            ))}
          </MiniSelect>
        }
        right={
          <MiniSelect value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="all">Any status</option>
            <option value="draft">Draft</option>
            <option value="issued">Issued</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="void">Void</option>
          </MiniSelect>
        }
      />

      <DataTable
        loading={loading}
        rows={invoices}
        rowKey={(row) => row.invoiceId}
        dense
        emptyTitle="No invoices match"
        columns={[
          {
            key: "number",
            header: "Invoice",
            sortable: true,
            render: (row) => (
              <div className="min-w-0">
                <span className="block truncate font-mono text-[12.5px] font-bold text-ink">
                  {row.number}
                </span>
                <span className="block truncate text-[12px] text-ink-soft">{row.tenantName}</span>
              </div>
            ),
          },
          { key: "period", header: "Period", sortable: true },
          {
            key: "totalEgp",
            header: "Total",
            align: "right",
            sortable: true,
            render: (row) => (
              <span className="text-[13px] font-semibold text-ink">{formatEgp(row.totalEgp)}</span>
            ),
          },
          {
            key: "paidEgp",
            header: "Paid",
            align: "right",
            sortable: true,
            render: (row) => (
              <span className="text-[13px] text-ink-muted">{formatEgp(row.paidEgp ?? 0)}</span>
            ),
          },
          {
            key: "dueAt",
            header: "Due",
            sortable: true,
            render: (row) => (
              <span className="text-[13px] text-ink-muted">
                {row.dueAt ? formatDate(row.dueAt) : "—"}
              </span>
            ),
          },
          {
            key: "status",
            header: "Status",
            sortable: true,
            render: (row) => <Badge tone={INVOICE_TONE[row.status]}>{row.status}</Badge>,
          },
          {
            key: "actions",
            header: "",
            align: "right",
            render: (row) => (
              <div className="flex justify-end gap-1.5">
                {row.status === "draft" ? (
                  <Button size="xs" onClick={() => setStatusFor(row, "issued")}>
                    Issue
                  </Button>
                ) : null}
                {row.status === "issued" || row.status === "overdue" ? (
                  <Button
                    variant="secondary"
                    size="xs"
                    leftIcon={<Banknote className="h-3.5 w-3.5" />}
                    onClick={() => paymentModal.open(row)}
                  >
                    Payment
                  </Button>
                ) : null}
                {row.status === "draft" || row.status === "issued" ? (
                  <Button variant="ghost" size="xs" onClick={() => setStatusFor(row, "void")}>
                    Void
                  </Button>
                ) : null}
              </div>
            ),
          },
        ]}
      />

      <InvoiceDraftModal
        open={draftModal.isOpen}
        onClose={draftModal.close}
        tenants={tenants}
        onIssued={(invoice) => {
          toast.success("Invoice created", `${invoice.number} · ${formatEgp(invoice.totalEgp)}`);
          draftModal.close();
          after();
        }}
      />

      <RecordPaymentModal
        open={paymentModal.isOpen}
        onClose={paymentModal.close}
        invoice={paymentModal.payload}
        invoices={invoices}
        onRecorded={(result) => {
          toast.success(
            "Payment recorded",
            result.settled ? "The invoice is settled" : `${formatEgp(result.invoicePaidEgp)} paid so far`
          );
          paymentModal.close();
          after();
        }}
      />
    </div>
  );
}
