import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { platformService } from "@/services";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { InfoBanner } from "@/components/ui/Misc";

/**
 * Delete a login, permanently.
 *
 * Two things this dialog is careful about, both of which are about being
 * honest rather than about being cautious.
 *
 * **It says what survives.** Deleting removes the *login*. The steps that
 * person submitted, the decisions they signed and the audit rows naming them
 * stay — a teaching record whose author vanished is not a teaching record, and
 * a clinical system that can erase the authorship of a signed-off procedure
 * would not survive an accreditation visit.
 *
 * **It asks for the address, not for "DELETE".** The mistake this prevents is
 * not misunderstanding the button — it is clicking the wrong row. Typing a
 * constant confirms you read the dialog; typing *this account's* address
 * confirms you read the row. The server checks it too.
 *
 * Deactivation is offered as the way out, because it is what almost everybody
 * who opens this dialog actually wants.
 */
export default function DeleteAccountModal({ open, onClose, account, onDeleted }) {
  const [confirmEmail, setConfirmEmail] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setConfirmEmail("");
    setReason("");
    setError(null);
  }, [open]);

  if (!account) return null;

  const matches = confirmEmail.trim().toLowerCase() === String(account.email).toLowerCase();

  const submit = async (event) => {
    event.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const result = await platformService.deleteAccount(account.userId, {
        confirmEmail: confirmEmail.trim(),
        reason: reason.trim() || undefined,
      });
      onDeleted?.(result);
    } catch (cause) {
      setError(cause);
    } finally {
      setSaving(false);
    }
  };

  const deactivate = async () => {
    setSaving(true);
    try {
      await platformService.setAccountStatus(account.userId, {
        status: "disabled",
        reason: reason.trim() || "Deactivated instead of deleted",
      });
      onDeleted?.({ email: account.email, deleted: false });
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
      title={`Delete ${account.name}`}
      description="This removes the login and cannot be undone."
      size="md"
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        {error ? <InfoBanner tone="danger">{error.message}</InfoBanner> : null}

        <InfoBanner tone="warning" icon={<AlertTriangle className="h-4 w-4" />}>
          Deleting removes the login only. Everything {account.name.split(" ")[0]} did — submitted
          steps, signed decisions and every audit row naming them — stays exactly as it is.
        </InfoBanner>

        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">
          <p className="text-[12.5px] text-ink-muted">
            Deactivating is reversible, ends every session immediately, and keeps the account
            available to reactivate. It is almost always what is wanted here.
          </p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="mt-3"
            loading={saving}
            onClick={deactivate}
          >
            Deactivate instead
          </Button>
        </div>

        <Field
          label="Type the account's email to confirm"
          required
          error={error?.details?.confirmEmail}
          hint={account.email}
        >
          <Input
            value={confirmEmail}
            onChange={(event) => setConfirmEmail(event.target.value)}
            placeholder={account.email}
            autoComplete="off"
          />
        </Field>

        <Field label="Reason" hint="Recorded against the platform audit trail.">
          <Textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={2}
            maxLength={500}
          />
        </Field>

        <div className="mt-2 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="danger" loading={saving} disabled={!matches}>
            Delete this login
          </Button>
        </div>
      </form>
    </Modal>
  );
}
