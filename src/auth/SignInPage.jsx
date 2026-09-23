import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AlertCircle, ArrowLeft, ArrowRight, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { cn } from "@/lib/cn";
import { safeInternalPath } from "@/lib/safeRedirect";
import { site } from "@/config/paths";
import { roleHome } from "@/auth/roles";
import { useAuth } from "@/auth/AuthContext";
import { authService } from "@/services";
import { GoogleMark, MicrosoftMark } from "@/components/shared/ProviderMarks";
import { SiteSurface } from "@/site/layout/SiteSurface";
import { LanguageToggle, ThemeToggle } from "@/site/layout/SiteHeader";
import { SiteLogo } from "@/site/components/SiteLogo";
import { useLanguage, useT } from "@/site/i18n/LanguageContext";
import { slogan } from "@/site/content/navigation";

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

/**
 * One input row: icon, control, optional trailing slot. The site's glass
 * input, not the portal's `Field`, so sign-in looks like the website it is
 * reached from.
 */
function GlassInput({ icon: Icon, trailing, className, ...props }) {
  return (
    <div className="relative">
      <Icon className="s-muted pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2" />
      <input className={cn("s-input ps-11 disabled:opacity-60", trailing && "pe-12", className)} {...props} />
      {trailing ? <div className="absolute end-2 top-1/2 -translate-y-1/2">{trailing}</div> : null}
    </div>
  );
}

export default function SignInPage() {
  return (
    <SiteSurface>
      <SignIn />
    </SiteSurface>
  );
}

function SignIn() {
  const t = useT();
  const { isRtl } = useLanguage();
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

    if (!email || !form.password)
      return setError(t({ en: "Enter your email and password.", ar: "أدخل بريدك الإلكتروني وكلمة المرور." }));
    if (!EMAIL_PATTERN.test(email))
      return setError(t({ en: "That does not look like an email address.", ar: "هذا لا يبدو بريدًا إلكترونيًا صحيحًا." }));

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

  const arrow = <ArrowRight className={cn("h-4 w-4", isRtl && "rotate-180")} />;

  return (
    <div className="relative z-10 flex min-h-screen flex-col px-4 py-5 sm:px-6">
      {/* top bar — the way back, and the two preferences the site offers */}
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3">
        <SiteLogo />
        <div className="flex items-center gap-1">
          <Link
            to={site.home}
            className="s-focus s-muted me-1 hidden items-center gap-1.5 rounded-full px-3 py-2 text-[14px] font-medium transition hover:text-[var(--s-text)] sm:inline-flex"
          >
            <ArrowLeft className={cn("h-4 w-4", isRtl && "rotate-180")} />
            {t({ en: "Back to site", ar: "العودة للموقع" })}
          </Link>
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </div>

      <main className="flex flex-1 items-center justify-center py-10">
        <div className="w-full max-w-[440px]">
          <div className="text-center">
            <p className="s-kicker !text-[11px]">{t(slogan)}</p>
            <h1 className="s-title mt-4 !text-[clamp(2rem,4vw,2.6rem)]">
              {t({ en: "Welcome back.", ar: "مرحبًا بعودتك." })}
            </h1>
            <p className="s-muted mt-3 text-[15.5px]">
              {t({ en: "Sign in to your Odenta workspace.", ar: "سجّل الدخول إلى مساحة عملك في أودنتا." })}
            </p>
          </div>

          <div className="s-glass relative mt-8 overflow-hidden rounded-[32px] p-7 sm:p-9">
            <form onSubmit={submit} noValidate className="flex flex-col gap-5">
              <label className="flex flex-col gap-2">
                <span className="s-muted text-[13.5px] font-medium">{t({ en: "Email", ar: "البريد الإلكتروني" })}</span>
                <GlassInput
                  icon={Mail}
                  autoFocus
                  type="email"
                  name="email"
                  dir="ltr"
                  autoComplete="username"
                  placeholder="you@clinic.com"
                  value={form.email}
                  onChange={set("email")}
                  disabled={locked}
                />
              </label>

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-3">
                  <label htmlFor="signin-password" className="s-muted text-[13.5px] font-medium">
                    {t({ en: "Password", ar: "كلمة المرور" })}
                  </label>
                  <Link to={site.contact} className="s-focus s-accent rounded text-[13px] font-medium hover:opacity-80">
                    {t({ en: "Forgot password?", ar: "نسيت كلمة المرور؟" })}
                  </Link>
                </div>
                <GlassInput
                  icon={Lock}
                  id="signin-password"
                  type={reveal ? "text" : "password"}
                  name="password"
                  dir="ltr"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={set("password")}
                  onKeyUp={watchCapsLock}
                  onKeyDown={watchCapsLock}
                  onBlur={() => setCapsLock(false)}
                  disabled={locked}
                  trailing={
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setReveal((prev) => !prev)}
                      aria-label={
                        reveal
                          ? t({ en: "Hide password", ar: "إخفاء كلمة المرور" })
                          : t({ en: "Show password", ar: "إظهار كلمة المرور" })
                      }
                      className="s-soft inline-flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-[var(--s-glass-strong)] hover:text-[var(--s-text)]"
                    >
                      {reveal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }
                />
                {capsLock ? (
                  <span className="text-[12.5px] font-medium text-amber-500">
                    {t({ en: "Caps Lock is on.", ar: "زر الأحرف الكبيرة مفعّل." })}
                  </span>
                ) : null}
              </div>

              {/* One region for both messages, so a screen reader hears the change
                  rather than only sighted users seeing the box appear. */}
              <div aria-live="polite">
                {locked ? (
                  <p className="flex items-start gap-2.5 rounded-2xl bg-amber-500/10 px-4 py-3 text-[13.5px] font-medium text-amber-600">
                    <AlertCircle className="mt-px h-4 w-4 shrink-0" />
                    <span>
                      {t({ en: "Too many attempts. Try again in", ar: "محاولات كثيرة. حاول مرة أخرى بعد" })}{" "}
                      <span dir="ltr">{mmss(lockedUntil - now)}</span>
                      {t({ en: ", or ", ar: "، أو " })}
                      <Link to={site.contact} className="underline underline-offset-2">
                        {t({ en: "ask us to reset it", ar: "اطلب منا إعادة تعيينها" })}
                      </Link>
                      .
                    </span>
                  </p>
                ) : error ? (
                  <p className="flex items-start gap-2.5 rounded-2xl bg-rose-500/10 px-4 py-3 text-[13.5px] font-medium text-rose-500">
                    <AlertCircle className="mt-px h-4 w-4 shrink-0" />
                    <span>
                      {error}
                      {remaining < MAX_ATTEMPTS ? (
                        <span className="mt-0.5 block font-normal opacity-80">
                          {t({
                            en: `${remaining} ${remaining === 1 ? "attempt" : "attempts"} left before the form locks for five minutes.`,
                            ar: `تبقّى ${remaining} ${remaining === 1 ? "محاولة" : "محاولات"} قبل قفل النموذج لمدة خمس دقائق.`,
                          })}
                        </span>
                      ) : null}
                    </span>
                  </p>
                ) : null}
              </div>

              <button type="submit" disabled={locked || busy} className="s-btn s-btn-primary s-btn-lg w-full">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {busy ? t({ en: "Signing in…", ar: "جارٍ تسجيل الدخول…" }) : t({ en: "Sign in", ar: "تسجيل الدخول" })}
                {busy ? null : arrow}
              </button>
            </form>

            {providers.length ? (
              <div className="mt-7">
                <div className="flex items-center gap-3">
                  <span className="s-divider flex-1" />
                  <span className="s-soft text-[12px] font-medium uppercase tracking-[0.14em]">
                    {t({ en: "or continue with", ar: "أو تابع باستخدام" })}
                  </span>
                  <span className="s-divider flex-1" />
                </div>

                <div className={cn("mt-5 grid gap-3", providers.length > 1 ? "sm:grid-cols-2" : "sm:grid-cols-1")}>
                  {providers.map((provider) => (
                    <button
                      key={provider.id}
                      type="button"
                      disabled={locked || busy || Boolean(pending)}
                      onClick={() => startProviderSignIn(provider.id)}
                      className="s-btn s-btn-glass s-btn-md w-full"
                    >
                      {pending === provider.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : provider.id === "google" ? (
                        <GoogleMark className="h-[18px] w-[18px]" />
                      ) : (
                        <MicrosoftMark className="h-[18px] w-[18px]" />
                      )}
                      {provider.label}
                    </button>
                  ))}
                </div>

                <p className="s-soft mt-4 text-[12.5px] leading-relaxed">
                  {t({
                    en: `Your Odenta account has to exist already — signing in with ${providers.map((p) => p.label).join(" or ")} does not create one. Ask your administrator if you do not have access yet.`,
                    ar: `يجب أن يكون حسابك في أودنتا موجودًا مسبقًا — تسجيل الدخول عبر ${providers.map((p) => p.label).join(" أو ")} لا ينشئ حسابًا. اطلب من المسؤول منحك الوصول إن لم يكن لديك.`,
                  })}
                </p>
              </div>
            ) : null}
          </div>

          <p className="s-muted mt-7 text-center text-[14.5px]">
            {t({ en: "New to Odenta?", ar: "جديد على أودنتا؟" })}{" "}
            <Link to={site.demo} className="s-focus s-accent rounded font-semibold hover:opacity-80">
              {t({ en: "Book a demo", ar: "احجز عرضًا" })}
            </Link>
          </p>

          <p className="s-soft mx-auto mt-4 max-w-sm text-center text-[12.5px] leading-relaxed">
            {t({
              en: "Patient records are protected health information. By signing in you accept the",
              ar: "سجلات المرضى معلومات صحية محمية. بتسجيل الدخول فإنك توافق على",
            })}{" "}
            <Link to={site.terms} className="s-accent hover:opacity-80">
              {t({ en: "terms", ar: "الشروط" })}
            </Link>{" "}
            {t({ en: "and", ar: "و" })}{" "}
            <Link to={site.privacy} className="s-accent hover:opacity-80">
              {t({ en: "privacy policy", ar: "سياسة الخصوصية" })}
            </Link>
            .
          </p>
        </div>
      </main>
    </div>
  );
}
