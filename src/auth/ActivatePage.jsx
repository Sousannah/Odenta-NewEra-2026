import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AlertCircle, ArrowRight, Check, Eye, EyeOff, MailCheck } from "lucide-react";
import { cn } from "@/lib/cn";
import { useAsync } from "@/hooks";
import { authService } from "@/services";
import { useAuth } from "@/auth/AuthContext";
import { auth as authPaths } from "@/config/paths";
import { roleHome } from "@/auth/roles";
import { Button, IconButton } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { InfoBanner } from "@/components/ui/Misc";
import { OdentaLoaderPanel } from "@/components/ui/OdentaLoader";
import { Logo } from "@/components/shared/Logo";
import { passwordRules } from "@/auth/passwordRules";

/**
 * Redeeming an invitation.
 *
 * The other half of the credential model IT chooses per cohort. An account
 * created by invitation holds no password at all — so there is nothing for an
 * administrator to read out, nothing to write on a sticky note, and nothing in
 * a spreadsheet of two hundred secrets. The person sets their own password here,
 * once, against a single-use token.
 *
 * ## Two details that are load-bearing
 *
 * **The invitation is read before the form renders.** An anonymous "set your
 * password" box is one a cautious person closes and a careless one fills in for
 * the wrong account; showing whose invitation this is makes it answerable. It
 * discloses nothing — whoever holds the token is the person whose invitation it
 * is — and an invalid token is told only that it is invalid, because which of
 * expired, spent or forged it was is not information a bad token has earned.
 *
 * **They are signed straight in.** They have just proved they hold the link and
 * chosen a password; sending them to a login form to type it again is where
 * people mistype the thing they set ten seconds ago and conclude the account is
 * broken.
 */
export default function ActivatePage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const navigate = useNavigate();
  const { adoptSession } = useAuth();

  const { data: invitation, loading, error: lookupError } = useAsync(
    () => (token ? authService.readInvitation(token) : Promise.resolve(null)),
    [token]
  );

  const [form, setForm] = useState({ password: "", confirm: "" });
  const [reveal, setReveal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [fieldError, setFieldError] = useState(null);

  const rules = useMemo(() => passwordRules(form.password, invitation), [form.password, invitation]);
  const satisfied = rules.every((rule) => rule.met);
  const matches = form.password.length > 0 && form.password === form.confirm;

  const submit = async (event) => {
    event.preventDefault();
    setError(null);
    setFieldError(null);

    if (!satisfied) {
      setFieldError("That password does not meet the rules below yet.");
      return;
    }
    if (!matches) {
      setFieldError("The two passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      const session = await authService.activate({ token, password: form.password });
      adoptSession(session);
      navigate(roleHome(session?.user?.role), { replace: true });
    } catch (cause) {
      if (cause?.details?.password) setFieldError(cause.details.password);
      else setError(cause?.message ?? "That invitation could not be redeemed");
    } finally {
      setBusy(false);
    }
  };

  /* ---------------------------------------------------------- the states */

  if (!token) return <Dead title="That link is incomplete" body="The invitation link is missing its token. Ask your IT administrator to send it again." />;
  if (loading) return <Shell><OdentaLoaderPanel label="Checking the invitation…" /></Shell>;
  if (lookupError || !invitation) {
    return (
      <Dead
        title="That invitation is no longer valid"
        body="It may have expired, or it may already have been used. Ask your IT administrator for a new one — they can issue it from your account row."
      />
    );
  }

  return (
    <Shell>
      <form
        onSubmit={submit}
        className="flex flex-col gap-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-pop sm:p-8"
      >
        <header className="flex flex-col gap-1.5">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-success-soft text-success-strong">
            <MailCheck className="h-5 w-5" />
          </span>
          <h1 className="mt-2 text-xl font-bold text-ink">Welcome, {firstName(invitation.name)}</h1>
          <p className="text-[13px] text-ink-muted">
            Choose a password for <span className="font-semibold text-ink">{invitation.email}</span>
            {invitation.roleLabel ? (
              <>
                {" "}
                — your {invitation.roleLabel.toLowerCase()} account.
              </>
            ) : (
              "."
            )}{" "}
            Nobody else has ever seen it, and nobody can read it afterwards.
          </p>
        </header>

        {error ? (
          <InfoBanner tone="warning" icon={<AlertCircle className="h-4 w-4" />}>
            {error}
          </InfoBanner>
        ) : null}

        <Field label="Your new password" required error={fieldError}>
          <div className="relative">
            <Input
              type={reveal ? "text" : "password"}
              value={form.password}
              onChange={(event) => {
                setForm((current) => ({ ...current, password: event.target.value }));
                setFieldError(null);
              }}
              autoComplete="new-password"
              className="pr-11"
              autoFocus
            />
            <span className="absolute right-1.5 top-1/2 -translate-y-1/2">
              <IconButton
                label={reveal ? "Hide the password" : "Show the password"}
                size="sm"
                type="button"
                onClick={() => setReveal((current) => !current)}
                className="bg-transparent text-ink-soft hover:bg-slate-100"
              >
                {reveal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </IconButton>
            </span>
          </div>
        </Field>

        <Field
          label="Again, to be sure"
          required
          error={form.confirm && !matches ? "These do not match" : undefined}
        >
          <Input
            type={reveal ? "text" : "password"}
            value={form.confirm}
            onChange={(event) => setForm((current) => ({ ...current, confirm: event.target.value }))}
            autoComplete="new-password"
          />
        </Field>

        <RuleList rules={rules} />

        <Button
          type="submit"
          block
          loading={busy}
          disabled={!satisfied || !matches}
          rightIcon={<ArrowRight className="h-4 w-4" />}
        >
          Set my password and sign in
        </Button>
      </form>
    </Shell>
  );
}

/* ------------------------------------------------------------ the pieces */

function Shell({ children }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 sm:p-8">
      <div className="w-full max-w-[460px]">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        {children}
      </div>
    </div>
  );
}

/** Every dead end reads the same, because the reasons are not disclosable. */
function Dead({ title, body }) {
  return (
    <Shell>
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-pop sm:p-8">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-danger-soft text-danger">
          <AlertCircle className="h-6 w-6" />
        </span>
        <h1 className="text-lg font-bold text-ink">{title}</h1>
        <p className="text-[13px] text-ink-muted">{body}</p>
        <Button as={Link} to={authPaths.signIn} variant="secondary" block>
          Go to sign in
        </Button>
      </div>
    </Shell>
  );
}

function RuleList({ rules }) {
  return (
    <ul className="flex flex-col gap-1.5 rounded-2xl bg-slate-50 p-3.5">
      {rules.map((rule) => (
        <li key={rule.key} className="flex items-center gap-2 text-[12.5px]">
          <span
            className={cn(
              "flex h-4 w-4 shrink-0 items-center justify-center rounded-full",
              rule.met ? "bg-success text-white" : "bg-slate-200 text-transparent"
            )}
          >
            <Check className="h-3 w-3" />
          </span>
          <span className={rule.met ? "text-ink-muted" : "text-ink-soft"}>{rule.label}</span>
        </li>
      ))}
    </ul>
  );
}

const firstName = (name) => String(name ?? "").trim().split(/\s+/)[0] || "there";
