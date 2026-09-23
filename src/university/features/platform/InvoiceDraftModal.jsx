import { useEffect, useState } from "react";
import { platformService } from "@/services";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Switch, Textarea } from "@/components/ui/Field";
import { InfoBanner, KeyValue } from "@/components/ui/Misc";
import { formatEgp } from "./platformFormat";

/**
 * Draft an invoice, look at it, then decide.
 *
 * The draft is priced by the server from the plan catalogue plus metered
 * overage and is deliberately *not* written until somebody presses the button.
 * A billing run that issues automatically is a billing run that sends something
 * wrong to a university at three in the morning — and unlike almost everything
 * else in this console, that one cannot be quietly corrected, because the
 * tenant's finance department has already filed a copy.
 *
 * Amounts are edited in EGP because that is how a person thinks about them, and
 * converted to piastres at the boundary. The server counts in integers.
 */
export default function InvoiceDraftModal({ open, onClose, tenants = [], onIssued }) {
  const [tenantId, setTenantId] = useState("");
  const [period, setPeriod] = useState(() => new Date().toISOString().slice(0, 7));
  const [lines, setLines] = useState([]);
  const [note, setNote] = useState("");
  const [issueNow, setIssueNow] = useState(false);
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) {
      setDraft(null);
      setLines([]);
      setError(null);
      return;
    }
    if (!tenantId) return;

    let cancelled = false;
    setError(null);
    platformService
      .getInvoiceDraft(tenantId, { period })
      .then((result) => {
        if (cancelled) return;
        setDraft(result);
        setLines(result.lines);
      })
      .catch((cause) => !cancelled && setError(cause));

    return () => {
      cancelled = true;
    };
  }, [open, tenantId, period]);

  const setLine = (index, key, value) =>
    setLines((current) =>
      current.map((line, position) => (position === index ? { ...line, [key]: value } : line))
    );

  const addLine = () =>
    setLines((current) => [...current, { description: "", quantity: 1, unitEgp: 0 }]);

  const removeLine = (index) =>
    setLines((current) => current.filter((_, position) => position !== index));

  const subtotalEgp = lines.reduce(
    (sum, line) => sum + Math.round(Number(line.unitEgp || 0) * Number(line.quantity || 1)),
    0
  );
  const vatPct = draft?.vatPct ?? 14;
  const vatEgp = Math.round((subtotalEgp * vatPct) / 100);

  const submit = async (event) => {
    event.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const invoice = await platformService.createInvoice({
        tenantId,
        period,
        lines: lines
          .filter((line) => line.description.trim())
          .map((line) => ({
            description: line.description.trim(),
            quantity: Number(line.quantity) || 1,
            unitEgp: Math.round(Number(line.unitEgp) || 0),
          })),
        dueAt: draft?.dueAt,
        note: note.trim() || undefined,
        issue: issueNow,
      });
      onIssued?.(invoice);
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
      title="Draft an invoice"
      description="Priced from the plan and metered overage. Nothing is written until you create it."
      size="lg"
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        {error ? <InfoBanner tone="danger">{error.message}</InfoBanner> : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Tenant" required>
            <Select value={tenantId} onChange={(event) => setTenantId(event.target.value)}>
              <option value="">Choose a tenant…</option>
              {tenants
                .filter((tenant) => tenant.status !== "archived")
                .map((tenant) => (
                  <option key={tenant.tenantId} value={tenant.tenantId}>
                    {tenant.name}
                  </option>
                ))}
            </Select>
          </Field>

          <Field label="Period" required hint="What the invoice is for, not when it is raised">
            <Input
              type="month"
              value={period}
              onChange={(event) => setPeriod(event.target.value)}
            />
          </Field>
        </div>

        {draft ? (
          <>
            <div className="flex flex-col gap-2.5">
              {lines.map((line, index) => (
                <div key={index} className="grid grid-cols-12 items-end gap-2">
                  <div className="col-span-12 sm:col-span-6">
                    <Field label={index === 0 ? "Description" : undefined}>
                      <Input
                        value={line.description}
                        onChange={(event) => setLine(index, "description", event.target.value)}
                        maxLength={200}
                      />
                    </Field>
                  </div>
                  <div className="col-span-4 sm:col-span-2">
                    <Field label={index === 0 ? "Qty" : undefined}>
                      <Input
                        type="number"
                        min="0.01"
                        step="1"
                        value={line.quantity}
                        onChange={(event) => setLine(index, "quantity", event.target.value)}
                      />
                    </Field>
                  </div>
                  <div className="col-span-6 sm:col-span-3">
                    <Field label={index === 0 ? "Unit (EGP)" : undefined}>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        /* Shown in EGP, stored in piastres — converted here so
                           the server never receives a decimal. */
                        value={Math.round(Number(line.unitEgp || 0) / 100)}
                        onChange={(event) =>
                          setLine(index, "unitEgp", Math.round(Number(event.target.value || 0) * 100))
                        }
                      />
                    </Field>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeLine(index)}
                      disabled={lines.length === 1}
                    >
                      ×
                    </Button>
                  </div>
                </div>
              ))}

              <Button type="button" variant="link" size="sm" className="self-start" onClick={addLine}>
                Add a line
              </Button>
            </div>

            <div className="rounded-xl border border-slate-200 p-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <KeyValue label="Subtotal" value={formatEgp(subtotalEgp)} />
                <KeyValue label={`VAT (${vatPct}%)`} value={formatEgp(vatEgp)} />
                <KeyValue label="Total" value={formatEgp(subtotalEgp + vatEgp)} />
              </div>
              {draft.usage ? (
                <p className="mt-3 text-[12px] text-ink-soft">
                  Metered at {draft.usage.seats ?? 0} seats and{" "}
                  {Math.round(draft.usage.storageGb ?? 0)} GB of imaging.
                </p>
              ) : null}
            </div>

            <Field label="Note" hint="Appears on the invoice">
              <Textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={2}
                maxLength={1000}
              />
            </Field>

            <div className="rounded-xl border border-slate-200 p-3.5">
              <Switch
                checked={issueNow}
                onChange={setIssueNow}
                label="Issue immediately rather than saving as a draft"
              />
              <p className="mt-2 text-[12px] text-ink-soft">
                An issued invoice cannot be edited — only voided and reissued. A draft can be
                corrected first.
              </p>
            </div>
          </>
        ) : tenantId ? (
          <p className="text-[13px] text-ink-soft">Pricing this tenant…</p>
        ) : null}

        <div className="mt-2 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving} disabled={!draft || subtotalEgp <= 0}>
            {issueNow ? "Create and issue" : "Save as draft"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
