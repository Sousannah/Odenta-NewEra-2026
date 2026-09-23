import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { safeInternalPath } from "@/lib/safeRedirect";
import { site } from "@/config/paths";
import { roleHome } from "@/auth/roles";
import { useAuth } from "@/auth/AuthContext";
import { authService } from "@/services";
import { GoogleMark, MicrosoftMark } from "@/components/shared/ProviderMarks";
import { Button, IconButton } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { OdentaLoaderOverlay } from "@/components/ui/OdentaLoader";
import { Logo, ToothMark } from "@/components/shared/Logo";
import { images } from "@/theme/assets";

/**
 * Sign-in.
 *
 * Three ways in, all of which end at `/auth/*` and none of which create an
 * account: an email and password, a Google ID token, an Entra ID token. The two
 * federated buttons are rendered only for providers the *server* says it has
 * configured, so a deployment without an OAuth registration shows a password
 * form and nothing that could fail.
 *
 * ## Throttling
 *
 * Five failures inside five minutes locks the form for the rest of that
 * window. This is a courtesy, not a control: it lives in a React state hook
 * and a reload clears it, so the server must throttle the endpoint too. What
 * it buys is the honest message — a typo repeated five times gets told what is
 * happening rather than silently failing a sixth time.
 */

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 5 * 60 * 1000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const mmss = (ms) => {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
};

export default function SignInPage() {
  const { signIn, signInWithProvider } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: "", password: "" });
  const [reveal, setReveal] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  /**
   * Which providers the server has configured.
   *
   * Asked rather than assumed: the client ids live in this app's build config
   * *and* in the server's environment, and a button whose token the server
   * cannot verify is worse than no button. Starts empty so nothing flashes in
   * and then disappears.
   */
  const [providers, setProviders] = useState([]);
  /** The provider currently mid-flight, so only its own button spins. */
  const [pending, setPending] = useState(null);

  /* Failure timestamps inside the current window, newest last. */
  const [failures, setFailures] = useState([]);
  const [now, setNow] = useState(() => Date.now());

  /**
   * Where to go after signing in.
   *
   * `RequireAuth` puts the path the person was heading for into router state,
   * which is not settable from a URL — so this is internal today. It is passed
   * through `safeInternalPath` anyway: the pinned `react-router-dom` carries an
   * open-redirect advisory for backslashes in `navigate`, and "remember where
   * they were heading" is the feature that grows a `?redirect=` parameter the
   * first time somebody links into a screen from an email. See the note in
   * `lib/safeRedirect.js`.
   */
  const destination = safeInternalPath(location.state?.from, null);

  const lockedUntil = useMemo(() => {
    const recent = failures.filter((at) => now - at < LOCKOUT_MS);
    return recent.length >= MAX_ATTEMPTS ? recent[recent.length - 1] + LOCKOUT_MS : null;
  }, [failures, now]);

  const locked = lockedUntil !== null && lockedUntil > now;
  const remaining = Math.max(0, MAX_ATTEMPTS - failures.filter((at) => now - at < LOCKOUT_MS).length);

  /* Only ticking while locked — nothing else on this screen needs a clock. */
  useEffect(() => {
    if (!locked) return undefined;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [locked]);

  const set = (key) => (event) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
    if (error) setError(null);
  };

  /* Caught on the password field only — a shouted email address is harmless. */
  const watchCapsLock = (event) => setCapsLock(event.getModifierState?.("CapsLock") ?? false);

  useEffect(() => {
    let live = true;
    authService.listProviders().then((rows) => {
      if (live) setProviders(rows);
    });
    return () => {
      live = false;
    };
  }, []);

  /* Not a hook, despite the shape of the name it used to carry. As
     `useProvider`, the `onClick` below read as a hook call inside a callback —
     to eslint, and to anybody skimming the file. */
  const startProviderSignIn = useCallback(
    async (provider) => {
      if (busy || locked) return;
      setPending(provider);
      setError(null);
      try {
        const session = await signInWithProvider(provider);
        navigate(destination ?? roleHome(session.user.role), { replace: true });
      } catch (cause) {
        /* Closing the provider's window is a decision, not a failure — showing
           an error for it would be telling somebody off for changing their
           mind. */
        if (!cause?.cancelled) setError(cause?.message ?? "That sign-in did not complete.");
        setPending(null);
      }
    },
    [busy, locked, signInWithProvider, navigate, destination]
  );

  const submit = async (event) => {
    event.preventDefault();
    if (busy || locked) return;

    const email = form.email.trim().toLowerCase();

    if (!email || !form.password) return setError("Enter your email and password.");
    if (!EMAIL_PATTERN.test(email)) return setError("That does not look like an email address.");

    setBusy(true);
    setError(null);
    try {
      const session = await signIn({ email, password: form.password });
      setFailures([]);
      navigate(destination ?? roleHome(session.user.role), { replace: true });
    } catch (cause) {
      setNow(Date.now());
      setFailures((prev) => [...prev.filter((at) => Date.now() - at < LOCKOUT_MS), Date.now()]);
      setError(cause.message ?? "Unable to sign in");
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* ------------------------------------------------------------ form */}
      <div className="od-radial relative flex w-full flex-col justify-center bg-white px-6 py-12 lg:w-[560px] lg:px-14">
        {/* The form stays legible underneath rather than being swapped out, so
            a slow sign-in does not read as the page having gone somewhere. */}
        {busy ? <OdentaLoaderOverlay size="sm" label="Signing you in" /> : null}

        <div className="flex items-center justify-between gap-4">
          <Link to={site.home} className="od-focus rounded-lg">
            <Logo />
          </Link>
          <Link
            to={site.home}
            className="inline-flex items-center gap-1.5 text-[13px] font-bold text-ink-muted transition hover:text-accent-600"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to site
          </Link>
        </div>

        <div className="mt-10">
          <h1 className="text-[30px] font-extrabold leading-tight text-ink">
            Welcome back to <span className="od-gradient-text">Odenta</span>
          </h1>
          <p className="mt-2 text-sm text-ink-muted">
            Sign in to reach your dashboard — clinic front desk to chairside, student chair to
            staff sign-off.
          </p>
        </div>

        <form onSubmit={submit} noValidate className="mt-8 flex flex-col gap-5">
          <Field label="Work email" required>
            <Input
              autoFocus
              type="email"
              name="email"
              autoComplete="username"
              placeholder="you@avicena.clinic"
              leftIcon={<Mail className="h-4 w-4" />}
              value={form.email}
              onChange={set("email")}
              disabled={locked}
            />
          </Field>

          <div className="flex flex-col gap-1.5">
            <Field
              label="Password"
              required
              counter={
                <Link
                  to={site.contact}
                  className="text-[12px] font-bold text-brand-600 transition hover:text-accent-600"
                >
                  Forgot password?
                </Link>
              }
            >
              <Input
                type={reveal ? "text" : "password"}
                name="password"
                autoComplete="current-password"
                placeholder="••••••••"
                leftIcon={<Lock className="h-4 w-4" />}
                value={form.password}
                onChange={set("password")}
                onKeyUp={watchCapsLock}
                onKeyDown={watchCapsLock}
                onBlur={() => setCapsLock(false)}
                disabled={locked}
                rightSlot={
                  <IconButton
                    size="sm"
                    variant="ghost"
                    label={reveal ? "Hide password" : "Show password"}
                    onClick={() => setReveal((prev) => !prev)}
                    tabIndex={-1}
                  >
                    {reveal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </IconButton>
                }
              />
            </Field>

            {capsLock ? (
              <span className="text-[12px] font-semibold text-warning-ink">
                Caps Lock is on.
              </span>
            ) : null}
          </div>

          {/* One region for both messages, so a screen reader hears the change
              rather than only sighted users seeing the box appear. */}
          <div aria-live="polite">
            {locked ? (
              <p className="flex items-start gap-2.5 rounded-xl bg-warning-soft px-3.5 py-3 text-[13px] font-semibold text-warning-ink">
                <AlertCircle className="mt-px h-4 w-4 shrink-0" />
                <span>
                  Too many attempts. Try again in {mmss(lockedUntil - now)}, or{" "}
                  <Link to={site.contact} className="underline underline-offset-2">
                    ask us to reset it
                  </Link>
                  .
                </span>
              </p>
            ) : error ? (
              <p className="flex items-start gap-2.5 rounded-xl bg-danger-soft px-3.5 py-3 text-[13px] font-semibold text-danger">
                <AlertCircle className="mt-px h-4 w-4 shrink-0" />
                <span>
                  {error}
                  {remaining < MAX_ATTEMPTS ? (
                    <span className="mt-0.5 block font-medium text-danger/80">
                      {remaining} {remaining === 1 ? "attempt" : "attempts"} left before the form
                      locks for five minutes.
                    </span>
                  ) : null}
                </span>
              </p>
            ) : null}
          </div>

          <Button
            type="submit"
            block
            size="lg"
            loading={busy}
            disabled={locked}
            rightIcon={busy ? null : <ArrowRight className="h-4 w-4" />}
          >
            {busy ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        {providers.length ? (
          <div className="mt-8">
            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-slate-200" />
              <span className="od-label">or continue with</span>
              <span className="h-px flex-1 bg-slate-200" />
            </div>

            <div
              className={cn(
                "mt-5 grid gap-3",
                providers.length > 1 ? "sm:grid-cols-2" : "sm:grid-cols-1"
              )}
            >
              {providers.map((provider) => (
                <Button
                  key={provider.id}
                  type="button"
                  variant="secondary"
                  size="lg"
                  block
                  disabled={locked || busy || Boolean(pending)}
                  loading={pending === provider.id}
                  onClick={() => startProviderSignIn(provider.id)}
                  leftIcon={
                    pending === provider.id ? null : provider.id === "google" ? (
                      <GoogleMark className="h-[18px] w-[18px]" />
                    ) : (
                      <MicrosoftMark className="h-[18px] w-[18px]" />
                    )
                  }
                >
                  {provider.label}
                </Button>
              ))}
            </div>

            <p className="mt-4 text-[12px] leading-relaxed text-ink-soft">
              Your Odenta account has to exist already — signing in with {providers.map((p) => p.label).join(" or ")}{" "}
              does not create one. Ask your administrator if you do not have access yet.
            </p>
          </div>
        ) : null}

        <p className="mt-10 text-[12px] leading-relaxed text-ink-soft">
          Patient records are protected health information. By signing in you accept the{" "}
          <Link to={site.terms} className="font-semibold text-brand-600 hover:text-accent-600">
            terms
          </Link>{" "}
          and{" "}
          <Link to={site.privacy} className="font-semibold text-brand-600 hover:text-accent-600">
            privacy policy
          </Link>
          .
        </p>
      </div>

      {/* -------------------------------------------------- marketing panel */}
      <div className="relative hidden flex-1 items-center justify-center overflow-hidden bg-od-gradient-deep lg:flex">
        <img
          src={images.heroWide}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover opacity-[0.14]"
        />

        <div className="relative z-10 max-w-[460px] px-12 text-white">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-[12px] font-extrabold uppercase tracking-[0.14em] text-white">
            <Sparkles className="h-3.5 w-3.5" />
            Role based
          </span>

          <h2 className="mt-6 text-[32px] font-extrabold leading-tight text-white">
            One record. Every way of working.
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-white/80">
            In a clinic the dentist charts, the assistant turns the room and the front desk takes
            the payment. In a dental school the student treats and the staff member signs. Everyone
            works from the same patient record, and sees only what their role needs.
          </p>

          <ul className="mt-9 flex flex-col gap-3.5">
            {[
              "FDI, Universal and Palmer notation",
              "Six-point periodontal charting",
              "Staff sign-off on every student step",
              "Requirement tracking across the rotation",
            ].map((line) => (
              <li key={line} className="flex items-center gap-3 text-[14.5px] text-white/90">
                <ShieldCheck className="h-4 w-4 shrink-0 text-accent-200" />
                {line}
              </li>
            ))}
          </ul>

          <div className="mt-10 flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
            <ToothMark className="h-9 w-9 shrink-0" gradientId="signInMark" />
            <p className="text-[13px] leading-relaxed text-white/85">
              New here?{" "}
              <Link to={site.contact} className="font-bold text-white underline underline-offset-2">
                Talk to us
              </Link>{" "}
              about bringing Odenta to your clinic or campus.
            </p>
          </div>
        </div>

        <div className="absolute -right-24 -top-24 h-[420px] w-[420px] rounded-full bg-white/10" />
        <div className="absolute -bottom-32 -left-16 h-[360px] w-[360px] rounded-full bg-white/5" />
      </div>
    </div>
  );
}
