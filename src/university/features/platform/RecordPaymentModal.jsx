import { useEffect, useState } from "react";
import { platformService } from "@/services";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { InfoBanner } from "@/components/ui/Misc";
import { formatEgp } from "./platformFormat";

const METHODS = [
  { value: "bank_transfer", label: "Bank transfer" },
  { value: "cheque", label: "Cheque" },
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "credit_note", label: "Credit note" },
];

/**
 * Record money that has arrived.
 *
 * The payment and the invoice it settles are written in one transactional batch
 * on the server — a half-applied pair is a ledger that lies in one of two
 * directions, and both are worse than the write failing outright.
 *
 * Overpayment is accepted and does not warn. Tenants round up, settle two
 * invoices with one transfer and send the VAT separately; refusing the record
 * would leave money that exists in the bank and not in the ledger, which is the
 * worse of the two inconsistencies.
 *
 * There is no way to unrecord a payment. A ledger with a delete is not a
 * ledger — money received in error is corrected with a credit note, which
 * leaves both the original and the correction visible to anyone reconciling
 * against a bank statement.
 */
export default function RecordPaymentModal({ open, onClose, invoice, invoices = [], onRecorded }) {
  const [invoiceId, setInvoiceId] = useState("");
  const [amountEgp, setAmountEgp] = useState("");
  const [method, setMethod] = useState("bank_transfer");
  const [externalReference, setExternalReference] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setNote("");
    setExternalReference("");

    if (invoice) {
      setInvoiceId(invoice.invoiceId);
      /* Default to what is still owed — the overwhelmingly common case, and it
         saves an operator doing subtraction against a bank statement. */
      setAmountEgp(String(Math.round(((invoice.totalEgp ?? 0) - (invoice.paidEgp ?? 0)) / 100)));
    } else {
      setInvoiceId("");
      setAmountEgp("");
    }
  }, [open, invoice]);

  const outstanding = invoices.filter(
    (row) => row.status === "issued" || row.status === "overdue"
  );

  const selected = invoice ?? outstanding.find((row) => row.invoiceId === invoiceId);
  const owed = selected ? (selected.totalEgp ?? 0) - (selected.paidEgp ?? 0) : 0;
  const piastres = Math.round(Number(amountEgp || 0) * 100);

  const submit = async (event) => {
    event.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const result = await platformService.recordPayment({
        invoiceId,
        amountEgp: piastres,
        method,
        externalReference: externalReference.trim() || undefined,
        note: note.trim() || undefined,
      });
      onRecorded?.(result);
    } catch (cause) {
      setError(cause);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Record a payment"
      description="A record of money that has already moved. Nothing is charged from here."
      size="md"
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        {error ? <InfoBanner tone="danger">{error.message}</InfoBanner> : null}

        <Field label="Invoice" required>
          <Select
            value={invoiceId}
            onChange={(event) => {
              setInvoiceId(event.target.value);
              const next = outstanding.find((row) => row.invoiceId === event.target.value);
              if (next) {
                setAmountEgp(String(Math.round(((next.totalEgp ?? 0) - (next.paidEgp ?? 0)) / 100)));
              }
            }}
            disabled={Boolean(invoice)}
          >
            <option value="">Choose an invoice…</option>
            {(invoice ? [invoice] : outstanding).map((row) => (
              <option key={row.invoiceId} value={row.invoiceId}>
                {row.number} · {row.tenantName} · {formatEgp((row.totalEgp ?? 0) - (row.paidEgp ?? 0))}{" "}
                owed
              </option>
            ))}
          </Select>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Amount (EGP)"
            required
            hint={selected ? `${formatEgp(owed)} outstanding` : undefined}
            error={error?.details?.amountEgp}
          >
            <Input
              type="number"
              min="1"
              step="1"
              value={amountEgp}
              onChange={(event) => setAmountEgp(event.target.value)}
            />
          </Field>

          <Field label="Method" required>
            <Select value={method} onChange={(event) => setMethod(event.target.value)}>
              {METHODS.map((entry) => (
                <option key={entry.value} value={entry.value}>
                  {entry.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field
          label="Bank reference"
          hint="The only field that makes a line on a statement findable later."
        >
          <Input
            value={externalReference}
            onChange={(event) => setExternalReference(event.target.value)}
            maxLength={120}
            placeholder="NBE-482913"
            className="font-mono"
          />
        </Field>

        <Field label="Note">
          <Textarea value={note} onChange={(event) => setNote(event.target.value)} rows={2} maxLength={500} />
        </Field>

        {selected && piastres > owed ? (
          <InfoBanner tone="info">
            That is {formatEgp(piastres - owed)} more than this invoice owes. It will be recorded in
            full — a tenant settling two invoices with one transfer is normal, and money in the bank
            but not in the ledger is the worse inconsistency.
          </InfoBanner>
        ) : null}

        <div className="mt-2 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving} disabled={!invoiceId || piastres <= 0}>
            Record {piastres > 0 ? formatEgp(piastres) : "payment"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
