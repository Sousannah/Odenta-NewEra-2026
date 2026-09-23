import { useState } from "react";
import { Eye, ShieldCheck } from "lucide-react";
import { useAsync } from "@/hooks";
import { platformService } from "@/services";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Field, Select, Textarea } from "@/components/ui/Field";
import { InfoBanner } from "@/components/ui/Misc";

/**
 * Open a tenant's portal, read-only, to see what they see.
 *
 * The dialog spends most of its space explaining what this is *not*, because
 * the feature it resembles is one this product deliberately does not have.
 *
 * It does not sign you in as a person. The session is minted for a named
 * preview identity that belongs to the tenant and is visible in its account
 * list — `preview.uni_student@aiu.odenta.preview` — so no patient's record is
 * ever read through somebody's identity, and no audit row can say a tenant's
 * own staff did something Odenta did.
 *
 * It cannot change anything. Every mutating request on the session is refused
 * by the server, not by this screen.
 *
 * It expires. Thirty minutes, with no refresh cookie, so a tab left open on a
 * train stops working before the journey ends.
 *
 * Reproducing a bug only one named person can see is a real need this does not
 * serve, and the answer is a support request with that user's consent, handled
 * by their own IT administrator. That is slower, and it is the correct amount
 * of friction for reading a named person's clinical screen.
 */
export default function PreviewTenantModal({ open, onClose, tenant }) {
  const [role, setRole] = useState("");
  const [reason, setReason] = useState("");
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState(null);

  const { data, loading } = useAsync(
    () => (open && tenant ? platformService.getPreviewTargets(tenant.tenantId) : Promise.resolve(null)),
    [open, tenant?.tenantId]
  );

  const targets = data?.targets ?? [];

  const start = async (event) => {
    event.preventDefault();
    setError(null);
    setOpening(true);

    try {
      const session = await platformService.openPreviewSession({
        tenantId: tenant.tenantId,
        role,
        reason: reason.trim(),
      });

      /**
       * Handed to a new tab, never put in the URL.
       *
       * A token in a query string is a token in browser history, in a referrer
       * header and in every access log between here and the server. It goes
       * through `sessionStorage` instead, which `authService.claimPreviewSession`
       * reads once and removes — and which dies with the tab, like the session
       * it represents.
       *
       * Written *before* the tab is opened, because `sessionStorage` is copied
       * to a tab opened with `window.open` at the moment it opens. Writing it
       * afterwards would leave the new tab reading an empty store and landing
       * signed out.
       */
      try {
        window.sessionStorage.setItem(
          "odenta.preview.session",
          JSON.stringify({
            token: session.token,
            banner: session.banner,
            expiresInSeconds: session.expiresInSeconds,
            user: session.user,
            tenant: session.tenant,
          })
        );
      } catch {
        /* Private mode, or storage disabled. Refuse rather than opening a tab
           that would fall back to the operator's own session — that one can
           write, and this one must not be able to. */
        setError(
          new Error("This browser is blocking session storage, so a read-only preview cannot be opened safely.")
        );
        return;
      }

      /* `noopener` so the preview tab cannot reach back into this one through
         `window.opener` — it is a lower-trust session by construction. */
      const opened = window.open(session.user.home ?? "/", "_blank", "noopener");
      if (!opened) {
        window.sessionStorage.removeItem("odenta.preview.session");
        setError(new Error("Your browser blocked the new tab — allow pop-ups for this site and try again."));
        return;
      }

      onClose();
    } catch (cause) {
      setError(cause);
    } finally {
      setOpening(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Preview ${tenant?.name ?? "tenant"}`}
      description="See the portal as one of this tenant's roles experiences it."
      size="md"
    >
      <form onSubmit={start} className="flex flex-col gap-4">
        {error ? <InfoBanner tone="danger">{error.message}</InfoBanner> : null}

        <InfoBanner tone="info" icon={<ShieldCheck className="h-4 w-4" />}>
          You will be signed in as a named preview identity that belongs to this tenant — never as a
          real person. The session is read-only, expires in thirty minutes, and is recorded as a
          high-severity security event.
        </InfoBanner>

        <Field label="Role to preview" required>
          <Select value={role} onChange={(event) => setRole(event.target.value)} disabled={loading}>
            <option value="">Choose a role…</option>
            {targets.map((target) => (
              <option key={target.role} value={target.role}>
                {target.label}
                {target.exists ? "" : " — identity will be created"}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label="Why"
          required
          hint="Recorded against this tenant's audit trail, which they can ask to see."
          error={error?.details?.reason}
        >
          <Textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={2}
            maxLength={300}
            placeholder="Reproducing the timetable layout issue reported on 14 September."
          />
        </Field>

        <div className="flex flex-wrap items-center gap-2 text-[12px] text-ink-soft">
          <Badge tone="warning">Read only</Badge>
          <Badge tone="outline">30 minutes</Badge>
          <Badge tone="outline">Audited</Badge>
        </div>

        <div className="mt-2 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            leftIcon={<Eye className="h-4 w-4" />}
            loading={opening}
            disabled={!role || reason.trim().length < 3}
          >
            Open preview
          </Button>
        </div>
      </form>
    </Modal>
  );
}
