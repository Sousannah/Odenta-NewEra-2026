import { useEffect, useState } from "react";
import { Check, Copy, KeyRound, Link2, ShieldAlert } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { InfoBanner } from "@/components/ui/Misc";
import { formatDate } from "@/lib/format";

/**
 * The one screen in the portal that displays a secret.
 *
 * It exists because the server genuinely cannot show it again: only an Argon2id
 * hash of the password, or a keyed digest of the invitation, was ever stored. So
 * this dialog is the entire lifetime of that value, and everything about it is
 * shaped by that:
 *
 *   - it cannot be dismissed by clicking the overlay or pressing Escape, only
 *     by the button that says the credential has been passed on. A dialog
 *     holding a value that cannot be recovered should not close because
 *     somebody clicked slightly to the left of it.
 *   - the value is never put in a URL, a query string or a toast, all of which
 *     outlive the dialog in history, in a log or on screen.
 *   - "Copy" writes to the clipboard and says so, because the alternative is
 *     somebody transcribing sixteen characters by eye and locking the account.
 *
 * The other half of the job is telling the administrator what to *do* with it,
 * which is why the wording differs per mode. A temporary password has to be
 * handed over in person or by phone and changed at first sign-in; an invitation
 * link can be emailed, because it is single-use and sets no password of its own.
 */
export default function CredentialModal({ open, account, credential, onClose }) {
  const [copied, setCopied] = useState(false);

  const isInvite = credential?.mode === "invite";
  /**
   * A federated account has no secret at all — the provider is the credential.
   * Checked before `value` is derived so this dialog never opens around an
   * empty string with a Copy button next to it, which is what it would do if
   * `federated` were allowed to fall through to the temporary-password branch.
   */
  const isFederated = credential?.mode === "federated";
  const value = isInvite ? activationUrl(credential?.activationToken) : credential?.temporaryPassword;

  /* Reset between accounts, so a second dialog never opens showing "Copied". */
  useEffect(() => {
    if (open) setCopied(false);
  }, [open, value]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      /**
       * Clipboard access is refused outside a secure context and in some
       * embedded browsers. Selecting the text is the fallback, and it is why the
       * value is rendered as selectable text rather than only behind a button.
       */
      setCopied(false);
    }
  };

  if (!open || !credential) return null;

  /* Nothing was minted, so there is nothing to guard: this one *can* be
     dismissed normally. It exists to confirm the account is ready and to say
     how the person gets in, which is the one thing they cannot guess. */
  if (isFederated) {
    return (
      <Modal
        open={open}
        onClose={onClose}
        title="Account ready"
        description={`For ${account?.name ?? "the new account"} · ${account?.email ?? ""}`}
        size="md"
        footer={
          <Button onClick={onClose} autoFocus>
            Done
          </Button>
        }
      >
        <InfoBanner tone="info">
          No password was created and there is nothing to pass on. They sign in with the
          &ldquo;Continue with&rdquo; button on the sign-in page, using this exact address — if their
          provider account is under a different one, sign-in will be refused and the address here
          has to be corrected.
        </InfoBanner>
      </Modal>
    );
  }

  return (
    <Modal
      open={open}
      /* Deliberately no `onClose`: the overlay and Escape must not dismiss a
         value that cannot be shown again. */
      title={isInvite ? "Invitation link" : "Temporary password"}
      description={`For ${account?.name ?? "the new account"} · ${account?.email ?? ""}`}
      size="md"
      footer={
        <>
          <Button
            variant="secondary"
            leftIcon={copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            onClick={copy}
          >
            {copied ? "Copied" : "Copy"}
          </Button>
          {/* Focused on open, so the deliberate button is the keyboard path
              out rather than Escape — which is disabled here on purpose. */}
          <Button autoFocus onClick={onClose}>
            I have passed this on
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <InfoBanner tone="warning" icon={<ShieldAlert className="h-4 w-4" />}>
          This is shown once. Nothing stored on the server can reproduce it — if
          it is lost, issue a new one from the account row.
        </InfoBanner>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-2 flex items-center gap-2">
            {isInvite ? (
              <Link2 className="h-4 w-4 text-ink-soft" />
            ) : (
              <KeyRound className="h-4 w-4 text-ink-soft" />
            )}
            <span className="text-[12px] font-bold uppercase tracking-wide text-ink-soft">
              {isInvite ? "Single-use link" : "Password"}
            </span>
            {credential.expiresAt ? (
              <Badge tone="neutral">
                Expires {formatDate(credential.expiresAt, "d MMM yyyy")}
              </Badge>
            ) : null}
          </div>

          {/**
           * Selectable, monospaced and breakable.
           *
           * `select-all` so one click takes the whole value — a partial
           * selection is how somebody pastes fifteen of sixteen characters and
           * then reports that the password does not work.
           */}
          <p className="select-all break-all font-mono text-[15px] font-semibold leading-relaxed text-ink">
            {value}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 p-4">
          <p className="mb-2 text-[13px] font-bold text-ink">What happens next</p>
          {isInvite ? (
            <ul className="flex flex-col gap-1.5 text-[12.5px] text-ink-muted">
              <li>
                Send the link to {account?.email ?? "them"}. It is safe to email — it works
                once and sets no password by itself.
              </li>
              <li>They choose their own password when they open it, and are signed straight in.</li>
              <li>
                Until then the account shows as <Badge tone="warning">invited</Badge> and cannot
                be signed into.
              </li>
            </ul>
          ) : (
            <ul className="flex flex-col gap-1.5 text-[12.5px] text-ink-muted">
              <li>
                Give this to {account?.name ?? "them"} in person or by phone — not by email,
                where it would sit in two mailboxes indefinitely.
              </li>
              <li>They must change it the first time they sign in; the portal will insist.</li>
              <li>Every session the account had open has already been ended.</li>
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
}

/**
 * The link an invited person opens.
 *
 * Built from the current origin rather than configured, so it is correct in
 * development, on a staging host and in production without a second setting to
 * get wrong. The token rides in the fragment-free query string because the
 * activation screen reads it before any session exists.
 */
function activationUrl(token) {
  if (!token) return "";
  const base = typeof window === "undefined" ? "" : window.location.origin;
  return `${base}/activate?token=${encodeURIComponent(token)}`;
}
