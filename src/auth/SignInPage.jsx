import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Lock, Mail } from "lucide-react";
import { cn } from "@/lib/cn";
import { ROLE_META, ROLE_ORDER, roleHome } from "@/auth/roles";
import { useAuth } from "@/auth/AuthContext";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { Logo } from "@/components/shared/Logo";
import { Badge } from "@/components/ui/Badge";

/**
 * Sign-in.
 *
 * The credential form is the real path (it posts to /auth/sign-in). The role
 * cards below it are a demo shortcut so every dashboard can be inspected
 * without seeding passwords — remove the "Explore as" block for production.
 */
export default function SignInPage() {
  const { signIn, switchRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const destination = location.state?.from;

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const session = await signIn(form);
      navigate(destination ?? roleHome(session.user.role), { replace: true });
    } catch (cause) {
      setError(cause.message ?? "Unable to sign in");
    } finally {
      setBusy(false);
    }
  };

  const exploreAs = async (role) => {
    setBusy(true);
    try {
      await switchRole(role);
      navigate(roleHome(role), { replace: true });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-canvas">
      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-[560px] lg:px-14">
        <Logo />

        <div className="mt-10">
          <h1 className="text-[26px] font-extrabold text-ink">Sign in to Odenta</h1>
          <p className="mt-2 text-sm text-ink-muted">
            Clinic management for the whole team — front desk to lab bench.
          </p>
        </div>

        <form onSubmit={submit} className="mt-8 flex flex-col gap-5">
          <Field label="Work email" required>
            <Input
              type="email"
              autoComplete="username"
              placeholder="you@avicena.clinic"
              leftIcon={<Mail className="h-4 w-4" />}
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            />
          </Field>

          <Field label="Password" required>
            <Input
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              leftIcon={<Lock className="h-4 w-4" />}
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
            />
          </Field>

          {error ? (
            <p className="rounded-xl bg-danger-soft px-3.5 py-2.5 text-[13px] font-semibold text-danger">
              {error}
            </p>
          ) : null}

          <Button type="submit" block size="lg" loading={busy} rightIcon={<ArrowRight className="h-4 w-4" />}>
            Sign in
          </Button>
        </form>

        <div className="mt-10">
          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-slate-200" />
            <span className="od-label">Explore as</span>
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
            {ROLE_ORDER.map((role) => {
              const meta = ROLE_META[role];
              return (
                <button
                  key={role}
                  type="button"
                  disabled={busy}
                  onClick={() => exploreAs(role)}
                  className={cn(
                    "rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-left transition",
                    "hover:border-brand-300 hover:bg-brand-50/40 disabled:opacity-60"
                  )}
                >
                  <span className="block text-[13px] font-bold text-ink">{meta.short}</span>
                  <span className="mt-0.5 block truncate text-[11px] text-ink-soft">
                    {meta.label}
                  </span>
                </button>
              );
            })}
          </div>

          <p className="mt-4 text-[12px] text-ink-soft">
            Demo shortcut — no password required. Remove this block before production.
          </p>
        </div>
      </div>

      {/* marketing panel */}
      <div className="relative hidden flex-1 items-center justify-center overflow-hidden bg-gradient-to-br from-brand-600 via-brand-700 to-[#27389A] lg:flex">
        <div className="relative z-10 max-w-[440px] px-10 text-white">
          <Badge tone="outline" className="border-white/30 bg-white/10 text-white">
            Role based
          </Badge>
          <h2 className="mt-5 text-[30px] font-extrabold leading-tight text-white">
            One record. Seven ways of working.
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-white/80">
            The dentist charts. The assistant turns the room. The front desk takes the payment.
            Everyone works from the same patient record, and sees only what their role needs.
          </p>

          <ul className="mt-8 flex flex-col gap-3">
            {[
              "FDI, Universal and Palmer notation",
              "Six-point periodontal charting",
              "CDT-coded treatment planning",
              "Sterilisation cycle traceability",
            ].map((line) => (
              <li key={line} className="flex items-center gap-3 text-[14px] text-white/90">
                <span className="h-1.5 w-1.5 rounded-full bg-white/70" />
                {line}
              </li>
            ))}
          </ul>
        </div>

        <div className="absolute -right-24 -top-24 h-[420px] w-[420px] rounded-full bg-white/10" />
        <div className="absolute -bottom-32 -left-16 h-[360px] w-[360px] rounded-full bg-white/5" />
      </div>
    </div>
  );
}
