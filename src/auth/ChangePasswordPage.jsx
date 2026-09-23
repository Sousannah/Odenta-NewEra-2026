import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Check, Eye, EyeOff, KeyRound, Lock, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/cn";
import { authService } from "@/services";
import { useAuth } from "@/auth/AuthContext";
import { roleHome } from "@/auth/roles";
import { Button, IconButton } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { InfoBanner } from "@/components/ui/Misc";
import { Logo } from "@/components/shared/Logo";
import { passwordRules } from "@/auth/passwordRules";

/**
 * Set a new password.
 *
 * This is what makes a temporary password temporary. An IT administrator issues
 * one, reads it out, and the account is flagged — without this screen that flag
 * is a badge on an admin table and the credential somebody said aloud stays
 * valid for the rest of the year.
 *
 * ## Why the current password is asked for
 *
 * The caller already holds a valid session, so it looks redundant. It is not: a
 * live session can be a borrowed laptop or a machine somebody walked away from,
 * and requiring the existing password is what stops a change of ownership being
 * something a passer-by can do in ten seconds. The server enforces it too — this
 * field is not the control, it is the prompt for it.
 *
 * ## Why the rules are shown rather than only enforced
 *
 * A password form that rejects on submit teaches by failure. The checklist below
 * updates as they type, and it mirrors the server's policy exactly, so there is
 * no rule they can satisfy here and be refused for there. Length leads, because
 * length is what actually matters — a twelve-character passphrase beats an
 * eight-character one with a symbol in it by orders of magnitude.
 */
export default function ChangePasswordPage() {
  const { user, refresh } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ currentPassword: "", password: "", confirm: "" });
  const [reveal, setReveal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [fieldError, setFieldError] = useState(null);

  const forced = Boolean(user?.mustResetPassword);

  const set = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    setFieldError(null);
  };

  /** The server's policy, mirrored so the two cannot disagree. */
  const rules = useMemo(() => passwordRules(form.password, user), [form.password, user]);

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
      await authService.changePassword({
        currentPassword: form.currentPassword,
        password: form.password,
      });

      /**
       * The session was replaced, so the context has to be re-read.
       *
       * The server ended every refresh family the account held — including the
       * one this tab was using — and issued a fresh pair in the same response.
       * Without re-reading it, `mustResetPassword` would still be true here and
       * the guard would send them straight back to this screen.
       */
      await refresh?.();
      navigate(roleHome(user?.role), { replace: true });
    } catch (cause) {
      /* A 422 names the field; anything else is about the attempt. */
      if (cause?.details?.password) setFieldError(cause.details.password);
      else setError(cause?.message ?? "The password could not be changed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 sm:p-8">
      <div className="w-full max-w-[460px]">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>

        <form
          onSubmit={submit}
          className="flex flex-col gap-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-pop sm:p-8"
        >
          <header className="flex flex-col gap-1.5">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
              <KeyRound className="h-5 w-5" />
            </span>
            <h1 className="mt-2 text-xl font-bold text-ink">
              {forced ? "Choose your own password" : "Change your password"}
            </h1>
            <p className="text-[13px] text-ink-muted">
              {forced
                ? "You are signed in with a password an administrator issued. Replace it before going any further — they can still read the one you have."
                : "You will stay signed in here. Every other session on this account will be signed out."}
            </p>
          </header>

          {error ? (
            <InfoBanner tone="warning" icon={<AlertCircle className="h-4 w-4" />}>
              {error}
            </InfoBanner>
          ) : null}

          <Field label={forced ? "The password you were given" : "Current password"} required>
            <Input
              type="password"
              value={form.currentPassword}
              onChange={set("currentPassword")}
              autoComplete="current-password"
              leftIcon={<Lock className="h-4 w-4" />}
              autoFocus
            />
          </Field>

          <Field label="New password" required error={fieldError}>
            <div className="relative">
              <Input
                type={reveal ? "text" : "password"}
                value={form.password}
                onChange={set("password")}
                autoComplete="new-password"
                className="pr-11"
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
            label="New password again"
            required
            error={form.confirm && !matches ? "These do not match" : undefined}
          >
            <Input
              type={reveal ? "text" : "password"}
              value={form.confirm}
              onChange={set("confirm")}
              autoComplete="new-password"
            />
          </Field>

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

          <Button
            type="submit"
            block
            loading={busy}
            disabled={!form.currentPassword || !satisfied || !matches}
            leftIcon={<ShieldCheck className="h-4 w-4" />}
          >
            Set this password
          </Button>

          {!forced ? (
            <Button variant="link" size="sm" onClick={() => navigate(-1)} type="button">
              Not now
            </Button>
          ) : null}
        </form>
      </div>
    </div>
  );
}
