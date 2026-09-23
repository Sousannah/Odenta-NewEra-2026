import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, Select, Switch, Textarea } from "@/components/ui/Field";
import { InfoBanner } from "@/components/ui/Misc";
import { formatNumber } from "@/lib/format";
import { TENANT_LABEL } from "./platformFormat";

/**
 * Stop or restart a tenant's service.
 *
 * The sharpest dialog in the console, so it does three things the rest do not.
 *
 * **It insists on a reason.** Not a nicety: six weeks later somebody asks why a
 * teaching hospital lost access mid-rotation, and "an operator clicked suspend"
 * is not an answer. The server requires it too — this is the affordance.
 *
 * **It says what will happen to the logins.** Suspending a tenant deactivates
 * its accounts, because a tenant marked suspended whose users can still sign in
 * is a tenant that is not suspended. The count is shown before the click, and
 * the cascade can be turned off for the one legitimate case — pausing billing
 * while a pilot cohort keeps working — which then shows up in the audit trail
 * as a deliberate choice rather than as a suspension that silently did nothing.
 *
 * **It refuses to pretend archiving is deleting.** Archiving ends the contract
 * and starts a retention clock. It does not erase a university's patient
 * records, and the dialog says so rather than letting an operator assume it.
 */
export default function TenantStatusModal({ open, onClose, tenant, intent, onSubmit }) {
  const [status, setStatus] = useState(intent ?? "suspended");
  const [reason, setReason] = useState("");
  const [cascade, setCascade] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setStatus(intent ?? "suspended");
    setReason("");
    setCascade(true);
    setError(null);
  }, [open, intent]);

  if (!tenant) return null;

  const stopping = status === "suspended" || status === "archived";
  const seats = tenant.usage?.seats ?? 0;

  const submit = async (event) => {
    event.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await onSubmit({ status, reason: reason.trim() || undefined, cascadeAccounts: cascade });
    } catch (cause) {
      setError(cause);
    } finally {
      setSaving(false);
    }
  };

  /**
   * Only the transitions the server's state machine allows.
   *
   * Offering a move it would refuse produces a 409 the operator reads as a bug.
   * `domain/platform.js` owns the machine; this mirrors it.
   */
  const options = {
    trial: ["active", "archived"],
    active: ["past_due", "suspended", "archived"],
    past_due: ["active", "suspended", "archived"],
    suspended: ["active", "archived"],
    archived: [],
  }[tenant.status] ?? [];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Change ${tenant.name}`}
      description={`Currently ${TENANT_LABEL[tenant.status].toLowerCase()}.`}
      size="md"
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        {error ? <InfoBanner tone="danger">{error.message}</InfoBanner> : null}

        <Field label="New status" required>
          <Select value={status} onChange={(event) => setStatus(event.target.value)}>
            {options.map((value) => (
              <option key={value} value={value}>
                {TENANT_LABEL[value]}
              </option>
            ))}
          </Select>
        </Field>

        {status === "archived" ? (
          <InfoBanner tone="warning" icon={<AlertTriangle className="h-4 w-4" />}>
            Archiving ends the contract and stops the service. It does not delete this tenant's
            records — erasure is a documented runbook against a backup, not a button, because the
            data is a university's patient records.
          </InfoBanner>
        ) : null}

        <Field
          label="Reason"
          required={stopping}
          hint="Read months from now, by someone else, trying to understand what happened."
          error={error?.details?.reason}
        >
          <Textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={3}
            maxLength={500}
            placeholder={
              stopping
                ? "Contract lapsed — three invoices unpaid and no reply since 12 August."
                : "Payment received; reactivating on the finance team's confirmation."
            }
          />
        </Field>

        <div className="rounded-xl border border-slate-200 p-3.5">
          <Switch
            checked={cascade}
            onChange={setCascade}
            label={
              stopping
                ? `Also deactivate this tenant's ${formatNumber(seats)} logins`
                : `Also reactivate this tenant's logins`
            }
          />
          <p className="mt-2 text-[12px] text-ink-soft">
            {cascade
              ? stopping
                ? "Every account is deactivated and every session ends immediately. Platform accounts are never touched."
                : "Accounts deactivated by this suspension are turned back on."
              : "The tenant's flag changes and its people carry on working. Use this to pause billing without stopping a pilot — it is recorded as a deliberate choice."}
          </p>
        </div>

        <div className="mt-2 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant={stopping ? "danger" : "success"}
            loading={saving}
            disabled={stopping && !reason.trim()}
          >
            {stopping ? `Suspend ${tenant.shortName ?? tenant.name}` : "Reactivate"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
