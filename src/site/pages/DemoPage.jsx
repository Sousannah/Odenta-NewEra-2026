import { useState } from "react";
import { ArrowRight, CalendarClock, Check, MonitorPlay, Users } from "lucide-react";
import { cn } from "@/lib/cn";
import { siteService } from "@/services";
import { slogan } from "@/site/content/navigation";
import { useLanguage, useT } from "@/site/i18n/LanguageContext";
import { Reveal, Section, SiteButton } from "@/site/components";
import { Field, FormSuccess, fieldErrors } from "@/site/components/Form";

const KINDS = [
  { value: "university", label: { en: "University", ar: "جامعة" } },
  { value: "clinic", label: { en: "Clinic", ar: "عيادة" } },
];

const ROLES = {
  university: [
    { en: "Dean / Vice dean", ar: "عميد / وكيل" },
    { en: "Faculty member", ar: "عضو هيئة تدريس" },
    { en: "Clinic supervisor", ar: "مشرف عيادة" },
    { en: "IT / Administration", ar: "تقنية المعلومات / الإدارة" },
    { en: "Other", ar: "أخرى" },
  ],
  clinic: [
    { en: "Clinic owner", ar: "مالك العيادة" },
    { en: "Dentist", ar: "طبيب أسنان" },
    { en: "Clinic manager", ar: "مدير العيادة" },
    { en: "Other", ar: "أخرى" },
  ],
};

const SIZES = {
  university: [
    { en: "Up to 200 students", ar: "حتى ٢٠٠ طالب" },
    { en: "200 – 800 students", ar: "٢٠٠ – ٨٠٠ طالب" },
    { en: "800+ students", ar: "أكثر من ٨٠٠ طالب" },
  ],
  clinic: [
    { en: "1 – 2 chairs", ar: "١ – ٢ كرسي" },
    { en: "3 – 6 chairs", ar: "٣ – ٦ كراسي" },
    { en: "7+ chairs or several branches", ar: "٧ كراسي أو أكثر أو عدة فروع" },
  ],
};

const PROMISES = [
  {
    icon: MonitorPlay,
    title: { en: "A live walkthrough", ar: "جولة مباشرة" },
    description: { en: "Thirty minutes, on your screen, shaped around your day.", ar: "ثلاثون دقيقة على شاشتك، مصممة حول يومك." },
  },
  {
    icon: Users,
    title: { en: "With a real person", ar: "مع شخص حقيقي" },
    description: { en: "Someone who understands a dental chair — not a sales script.", ar: "شخص يفهم كرسي الأسنان — لا نص مبيعات." },
  },
  {
    icon: CalendarClock,
    title: { en: "At your pace", ar: "بالوتيرة التي تناسبك" },
    description: { en: "We reply within one working day to find a time that suits you.", ar: "نرد خلال يوم عمل واحد لنجد الوقت المناسب لك." },
  },
];

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const EMPTY = { kind: "university", name: "", email: "", phone: "", organisation: "", role: "", size: "", message: "" };

function DemoForm() {
  const t = useT();
  const { isRtl } = useLanguage();
  const [form, setForm] = useState(EMPTY);
  const [state, setState] = useState("idle"); // idle | busy | done
  const [errors, setErrors] = useState({});
  const [failure, setFailure] = useState(null);

  const update = (field) => (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));
  const setKind = (kind) => setForm((prev) => ({ ...prev, kind, role: "", size: "" }));

  const submit = async (event) => {
    event.preventDefault();
    const local = {};
    if (!form.name.trim()) local.name = true;
    if (!EMAIL.test(form.email.trim())) local.email = true;
    if (!form.organisation.trim()) local.organisation = true;
    setErrors(local);
    setFailure(null);
    if (Object.keys(local).length) return;

    setState("busy");
    const kind = KINDS.find((item) => item.value === form.kind);
    try {
      await siteService.requestDemo({
        name: form.name.trim(),
        email: form.email.trim(),
        organisation: form.organisation.trim(),
        phone: form.phone.trim() || undefined,
        role: form.role || undefined,
        size: [kind?.label.en, form.size].filter(Boolean).join(" · ") || undefined,
        message: form.message.trim() || undefined,
      });
      setState("done");
    } catch (cause) {
      const fields = fieldErrors(cause);
      if (fields) setErrors(fields);
      else setFailure(t({ en: "Something went wrong. Please try again.", ar: "حدث خطأ ما. يرجى المحاولة مرة أخرى." }));
      setState("idle");
    }
  };

  if (state === "done") {
    return (
      <FormSuccess
        title={{ en: "You're on our calendar.", ar: "أنت على جدولنا." }}
        body={{
          en: "Thank you. We'll be in touch within one working day to find a time that suits you.",
          ar: "شكرًا لك. سنتواصل معك خلال يوم عمل واحد لنجد الوقت المناسب لك.",
        }}
        again={{ en: "Request another demo", ar: "اطلب عرضًا آخر" }}
        onAgain={() => {
          setForm(EMPTY);
          setState("idle");
        }}
      />
    );
  }

  return (
    <form onSubmit={submit} noValidate>
      <span className="s-muted text-[13.5px] font-medium">{t({ en: "I'm booking for", ar: "أحجز لـ" })}</span>
      {/* segmented control, iOS style */}
      <div role="radiogroup" className="s-chip mt-2 grid w-full grid-cols-2 gap-1 !p-1">
        {KINDS.map((kind) => {
          const active = form.kind === kind.value;
          return (
            <button
              key={kind.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setKind(kind.value)}
              className={cn(
                "s-focus rounded-full py-2.5 text-[15px] font-semibold transition",
                active ? "s-btn-primary text-white" : "s-muted hover:text-[var(--s-text)]"
              )}
            >
              {t(kind.label)}
            </button>
          );
        })}
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <Field
          label={{ en: "Full name", ar: "الاسم الكامل" }}
          htmlFor="demo-name"
          required
          error={errors.name ? { en: "Please enter your name", ar: "يرجى إدخال اسمك" } : null}
        >
          <input id="demo-name" className="s-input" value={form.name} onChange={update("name")} autoComplete="name" />
        </Field>

        <Field
          label={{ en: "Work email", ar: "البريد الإلكتروني للعمل" }}
          htmlFor="demo-email"
          required
          error={errors.email ? { en: "Please enter a valid email", ar: "يرجى إدخال بريد صالح" } : null}
        >
          <input
            id="demo-email"
            type="email"
            dir="ltr"
            className="s-input"
            value={form.email}
            onChange={update("email")}
            autoComplete="email"
          />
        </Field>

        <Field
          label={form.kind === "university" ? { en: "University", ar: "الجامعة" } : { en: "Clinic", ar: "العيادة" }}
          htmlFor="demo-org"
          required
          error={errors.organisation ? { en: "Please tell us where you work", ar: "يرجى إخبارنا بجهة عملك" } : null}
        >
          <input
            id="demo-org"
            className="s-input"
            value={form.organisation}
            onChange={update("organisation")}
            autoComplete="organization"
          />
        </Field>

        <Field label={{ en: "Phone", ar: "الهاتف" }} htmlFor="demo-phone">
          <input
            id="demo-phone"
            type="tel"
            dir="ltr"
            className="s-input"
            value={form.phone}
            onChange={update("phone")}
            autoComplete="tel"
          />
        </Field>

        <Field label={{ en: "Your role", ar: "دورك" }} htmlFor="demo-role">
          <select id="demo-role" className="s-input" value={form.role} onChange={update("role")}>
            <option value="">{t({ en: "Choose…", ar: "اختر…" })}</option>
            {ROLES[form.kind].map((role) => (
              <option key={role.en} value={role.en}>
                {t(role)}
              </option>
            ))}
          </select>
        </Field>

        <Field label={{ en: "Size", ar: "الحجم" }} htmlFor="demo-size">
          <select id="demo-size" className="s-input" value={form.size} onChange={update("size")}>
            <option value="">{t({ en: "Choose…", ar: "اختر…" })}</option>
            {SIZES[form.kind].map((size) => (
              <option key={size.en} value={size.en}>
                {t(size)}
              </option>
            ))}
          </select>
        </Field>

        <Field label={{ en: "Anything we should know?", ar: "هل هناك ما يجب أن نعرفه؟" }} htmlFor="demo-message" className="sm:col-span-2">
          <textarea id="demo-message" rows={4} className="s-input" value={form.message} onChange={update("message")} />
        </Field>
      </div>

      {failure ? (
        <p className="mt-5 rounded-2xl bg-rose-500/10 px-4 py-3 text-[14px] font-medium text-rose-500">{failure}</p>
      ) : null}

      <SiteButton
        className="mt-8 w-full"
        size="lg"
        type="submit"
        disabled={state === "busy"}
        rightIcon={<ArrowRight className={cn("h-4 w-4", isRtl && "rotate-180")} />}
      >
        {state === "busy" ? t({ en: "Sending…", ar: "جارٍ الإرسال…" }) : t({ en: "Book my demo", ar: "احجز عرضي" })}
      </SiteButton>
    </form>
  );
}

export default function DemoPage() {
  const t = useT();

  return (
    <Section className="pt-16 lg:pt-24">
      <div className="grid items-start gap-10 lg:grid-cols-12 lg:gap-14">
        <Reveal className="lg:col-span-5 lg:pt-6">
          <p className="s-kicker">{t(slogan)}</p>
          <h1 className="s-display mt-6 !text-[clamp(2.4rem,5vw,4.2rem)]">
            {t({ en: "See Odenta", ar: "شاهد أودنتا" })}{" "}
            <span className="s-grad-text">{t({ en: "in action.", ar: "وهي تعمل." })}</span>
          </h1>
          <p className="s-lead mt-6">
            {t({
              en: "Book a personal walkthrough for your university or clinic. We'll show you how everything connects — from the first appointment to the final sign-off.",
              ar: "احجز جولة شخصية لجامعتك أو عيادتك. سنريك كيف يتصل كل شيء — من أول موعد حتى الاعتماد النهائي.",
            })}
          </p>

          <ul className="mt-10 flex flex-col gap-5">
            {PROMISES.map((item, index) => {
              const Icon = item.icon;
              return (
                <li key={index} className="flex items-start gap-4">
                  <span className="s-icon-tile h-11 w-11 shrink-0">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-[16px] font-semibold">{t(item.title)}</span>
                    <span className="s-muted mt-0.5 block text-[15px]">{t(item.description)}</span>
                  </span>
                </li>
              );
            })}
          </ul>

          <p className="s-soft mt-10 flex items-center gap-2 text-[14px]">
            <Check className="s-accent h-4 w-4" />
            {t({ en: "No commitment. No card required.", ar: "بلا التزام. بلا بطاقة دفع." })}
          </p>
        </Reveal>

        <Reveal delay={120} className="s-glass rounded-[34px] p-7 sm:p-10 lg:col-span-7">
          <DemoForm />
        </Reveal>
      </div>
    </Section>
  );
}
