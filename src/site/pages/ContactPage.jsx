import { useState } from "react";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock3,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { site } from "@/config/paths";
import { siteService } from "@/services";
import { contactDetails } from "@/site/content/navigation";
import { useLanguage, useT } from "@/site/i18n/LanguageContext";
import { CTABand, PageHero, Reveal, Section, SiteButton } from "@/site/components";

const TOPICS = [
  { value: "university", label: { en: "University programme", ar: "برنامج جامعي" } },
  { value: "clinic", label: { en: "Clinic onboarding", ar: "تفعيل عيادة" } },
  { value: "demo", label: { en: "Product demo", ar: "عرض المنتج" } },
  { value: "support", label: { en: "Support", ar: "الدعم" } },
  { value: "other", label: { en: "Something else", ar: "شيء آخر" } },
];

const EMPTY = { name: "", email: "", organisation: "", topic: "university", message: "" };

/** Shared field wrapper so every input on the site looks the same. */
function FormField({ label, htmlFor, error, required, children }) {
  const t = useT();
  return (
    <label htmlFor={htmlFor} className="flex flex-col gap-2">
      <span className="text-[13px] font-bold text-ink">
        {t(label)}
        {required ? <span className="ms-1 text-danger">*</span> : null}
      </span>
      {children}
      {error ? <span className="text-[12.5px] font-semibold text-danger">{t(error)}</span> : null}
    </label>
  );
}

const inputClass =
  "h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-ink placeholder:text-ink-faint transition focus:border-accent-400 focus:outline-none focus:ring-4 focus:ring-accent-500/15";

function ContactForm() {
  const t = useT();
  const { isRtl } = useLanguage();
  const [form, setForm] = useState(EMPTY);
  const [state, setState] = useState("idle"); // idle | busy | done
  const [errors, setErrors] = useState({});
  const [failure, setFailure] = useState(null);

  const update = (field) => (event) =>
    setForm((prev) => ({ ...prev, [field]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setState("busy");
    setErrors({});
    setFailure(null);

    try {
      await siteService.submitContactRequest(form);
      setState("done");
      setForm(EMPTY);
    } catch (cause) {
      /* the API returns field-level details on a 422 */
      if (cause?.details) setErrors(cause.details);
      else setFailure(cause?.message ?? "Something went wrong. Please try again.");
      setState("idle");
    }
  };

  if (state === "done") {
    return (
      <div className="flex flex-col items-center gap-5 rounded-3xl border border-accent-200 bg-accent-50/60 px-8 py-16 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-od-gradient text-white shadow-brand">
          <CheckCircle2 className="h-8 w-8" />
        </span>
        <h3 className="text-[22px] font-extrabold text-brand-700">
          {t({ en: "Message received", ar: "تم استلام رسالتك" })}
        </h3>
        <p className="max-w-sm text-[15px] leading-relaxed text-ink-muted">
          {t({
            en: "We reply within one working day. If it is urgent, call the number on the right and ask for the clinical team.",
            ar: "نرد خلال يوم عمل واحد. إذا كان الأمر عاجلًا، اتصل بالرقم المجاور واطلب الفريق السريري.",
          })}
        </p>
        <SiteButton variant="ghost" size="sm" onClick={() => setState("idle")}>
          {t({ en: "Send another message", ar: "أرسل رسالة أخرى" })}
        </SiteButton>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-3xl border border-slate-200/80 bg-white p-8 shadow-card"
      noValidate
    >
      <h3 className="text-[20px] font-extrabold text-brand-700">
        {t({ en: "Send us a message", ar: "أرسل لنا رسالة" })}
      </h3>
      <p className="mt-2 text-[14.5px] text-ink-muted">
        {t({
          en: "Tell us who you are and what you run — we will come back with the right person, not a sales sequence.",
          ar: "أخبرنا من أنت وما تديره — سنرد عليك بالشخص المناسب، لا برسائل تسويقية.",
        })}
      </p>

      <div className="mt-7 grid gap-5 sm:grid-cols-2">
        <FormField
          label={{ en: "Full name", ar: "الاسم الكامل" }}
          htmlFor="contact-name"
          required
          error={errors.name ? { en: "Please enter your name", ar: "يرجى إدخال اسمك" } : null}
        >
          <input
            id="contact-name"
            className={inputClass}
            value={form.name}
            onChange={update("name")}
            placeholder={t({ en: "Dr. Nour Hassan", ar: "د. نور حسن" })}
            autoComplete="name"
          />
        </FormField>

        <FormField
          label={{ en: "Work email", ar: "البريد الإلكتروني" }}
          htmlFor="contact-email"
          required
          error={errors.email ? { en: "Please enter a work email", ar: "يرجى إدخال بريد صالح" } : null}
        >
          <input
            id="contact-email"
            type="email"
            className={inputClass}
            value={form.email}
            onChange={update("email")}
            placeholder="you@clinic.com"
            autoComplete="email"
          />
        </FormField>

        <FormField label={{ en: "Organisation", ar: "الجهة" }} htmlFor="contact-org">
          <input
            id="contact-org"
            className={inputClass}
            value={form.organisation}
            onChange={update("organisation")}
            placeholder={t({ en: "University or clinic", ar: "جامعة أو عيادة" })}
            autoComplete="organization"
          />
        </FormField>

        <FormField label={{ en: "What is this about?", ar: "بخصوص ماذا؟" }} htmlFor="contact-topic">
          <select
            id="contact-topic"
            className={cn(inputClass, "appearance-none")}
            value={form.topic}
            onChange={update("topic")}
          >
            {TOPICS.map((topic) => (
              <option key={topic.value} value={topic.value}>
                {t(topic.label)}
              </option>
            ))}
          </select>
        </FormField>

        <div className="sm:col-span-2">
          <FormField
            label={{ en: "Message", ar: "الرسالة" }}
            htmlFor="contact-message"
            required
            error={errors.message ? { en: "Please add a message", ar: "يرجى كتابة رسالة" } : null}
          >
            <textarea
              id="contact-message"
              rows={5}
              className={cn(inputClass, "h-auto resize-y py-3.5 leading-relaxed")}
              value={form.message}
              onChange={update("message")}
              placeholder={t({
                en: "How many chairs and students do you run? What are you using today?",
                ar: "كم عدد الكراسي والطلاب لديك؟ وما النظام المستخدم حاليًا؟",
              })}
            />
          </FormField>
        </div>
      </div>

      {failure ? (
        <p className="mt-5 rounded-2xl bg-danger-soft px-4 py-3 text-[13.5px] font-semibold text-danger">
          {failure}
        </p>
      ) : null}

      <SiteButton
        className="mt-7 w-full sm:w-auto"
        type="submit"
        disabled={state === "busy"}
        rightIcon={<ArrowRight className={cn("h-4 w-4", isRtl && "rotate-180")} />}
      >
        {state === "busy"
          ? t({ en: "Sending…", ar: "جارٍ الإرسال…" })
          : t({ en: "Send message", ar: "أرسل الرسالة" })}
      </SiteButton>
    </form>
  );
}

export default function ContactPage() {
  const t = useT();

  const channels = [
    {
      key: "email",
      icon: Mail,
      label: { en: "Email us", ar: "راسلنا" },
      value: contactDetails.email,
      href: `mailto:${contactDetails.email}`,
    },
    {
      key: "phone",
      icon: Phone,
      label: { en: "Call us", ar: "اتصل بنا" },
      value: contactDetails.phone,
      href: `tel:${contactDetails.phone.replace(/\s/g, "")}`,
    },
    {
      key: "support",
      icon: MessageSquare,
      label: { en: "Existing customer", ar: "عميل حالي" },
      value: contactDetails.supportEmail,
      href: `mailto:${contactDetails.supportEmail}`,
    },
  ];

  return (
    <>
      <PageHero
        eyebrow={{ en: "Contact", ar: "تواصل" }}
        eyebrowIcon={<MessageSquare className="h-3.5 w-3.5" />}
        title={{ en: "Let's talk about", ar: "لنتحدث عن" }}
        highlight={{ en: "your practice", ar: "ممارستك" }}
        description={{
          en: "Whether you run a teaching hospital or a five-chair clinic, the first conversation is with someone who has worked a chair — not a sales script.",
          ar: "سواء كنت تدير مستشفى تعليميًا أو عيادة بخمسة كراسي، أول حديث سيكون مع شخص عمل على الكرسي — لا نص مبيعات.",
        }}
      />

      <Section tone="canvas" className="pt-0">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Reveal>
              <ContactForm />
            </Reveal>
          </div>

          <div className="flex flex-col gap-6 lg:col-span-5">
            <Reveal delay={120} className="rounded-3xl border border-slate-200/80 bg-white p-8 shadow-card">
              <h3 className="text-[18px] font-extrabold text-brand-700">
                {t({ en: "Get in touch", ar: "ابقَ على تواصل" })}
              </h3>

              <ul className="mt-6 flex flex-col gap-5">
                {channels.map((channel) => {
                  const Icon = channel.icon;
                  return (
                    <li key={channel.key} className="flex items-start gap-4">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                        <Icon className="h-[18px] w-[18px]" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[12.5px] font-bold uppercase tracking-wide text-ink-soft">
                          {t(channel.label)}
                        </span>
                        <a
                          href={channel.href}
                          className="mt-0.5 block truncate text-[15px] font-bold text-ink transition hover:text-accent-600"
                        >
                          {channel.value}
                        </a>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </Reveal>

            <Reveal
              delay={200}
              className="rounded-3xl border border-slate-200/80 bg-od-gradient-soft p-8 shadow-card"
            >
              <h3 className="text-[18px] font-extrabold text-brand-700">
                {t({ en: "Where we are", ar: "أين نحن" })}
              </h3>

              <p className="mt-5 flex items-start gap-3 text-[15px] leading-relaxed text-ink-muted">
                <MapPin className="mt-0.5 h-[18px] w-[18px] shrink-0 text-accent-600" />
                {t(contactDetails.address)}
              </p>
              <p className="mt-4 flex items-start gap-3 text-[15px] text-ink-muted">
                <Clock3 className="mt-0.5 h-[18px] w-[18px] shrink-0 text-accent-600" />
                {t(contactDetails.hours)}
              </p>
              <p className="mt-4 flex items-start gap-3 text-[15px] text-ink-muted">
                <Building2 className="mt-0.5 h-[18px] w-[18px] shrink-0 text-accent-600" />
                {t({
                  en: "Campus visits welcome — tell us a day and we will host you in the student clinic.",
                  ar: "زيارات الحرم الجامعي مرحب بها — أخبرنا باليوم وسنستضيفك في عيادة الطلاب.",
                })}
              </p>
            </Reveal>
          </div>
        </div>
      </Section>

      <CTABand
        title={{ en: "Prefer to see it", ar: "تفضل أن تراه" }}
        highlight={{ en: "working first?", ar: "يعمل أولًا؟" }}
        description={{
          en: "Run a radiograph through the public demo before you book anything — no account, no upload of a real patient film needed.",
          ar: "جرّب الأشعة عبر العرض العام قبل أي حجز — دون حساب ودون رفع صورة مريض حقيقي.",
        }}
        primary={{ label: { en: "Try our AI", ar: "جرّب الذكاء الاصطناعي" }, to: site.tryAi }}
        secondary={{ label: { en: "See services", ar: "شاهد الخدمات" }, to: site.services }}
      />
    </>
  );
}
