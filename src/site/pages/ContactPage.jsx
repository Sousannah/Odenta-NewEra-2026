import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ArrowRight, Clock3, Instagram, Linkedin, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { cn } from "@/lib/cn";
import { site } from "@/config/paths";
import { siteService } from "@/services";
import { contactDetails, socialLinks } from "@/site/content/navigation";
import { useLanguage, useT } from "@/site/i18n/LanguageContext";
import { PageHero, Reveal, Section, SiteButton } from "@/site/components";
import { Field, FormSuccess, fieldErrors } from "@/site/components/Form";

const TOPICS = [
  { value: "university", label: { en: "A university", ar: "جامعة" } },
  { value: "clinic", label: { en: "A clinic", ar: "عيادة" } },
  { value: "patient", label: { en: "I'm a patient", ar: "أنا مريض" } },
  { value: "partnership", label: { en: "Partnership", ar: "شراكة" } },
  { value: "support", label: { en: "Support", ar: "الدعم" } },
  { value: "other", label: { en: "Something else", ar: "شيء آخر" } },
];

const SOCIAL_ICON = { instagram: Instagram, linkedin: Linkedin };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function ContactForm() {
  const t = useT();
  const { isRtl } = useLanguage();
  const [params] = useSearchParams();

  /* arriving from a directory card pre-fills who the message is about */
  const initial = () => ({
    name: "",
    email: "",
    phone: "",
    organisation: params.get("organisation") ?? "",
    topic: TOPICS.some((item) => item.value === params.get("topic")) ? params.get("topic") : "university",
    message: "",
  });

  const [form, setForm] = useState(initial);
  const [state, setState] = useState("idle"); // idle | busy | done
  const [errors, setErrors] = useState({});
  const [failure, setFailure] = useState(null);

  const update = (field) => (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    const local = {};
    if (!form.name.trim()) local.name = true;
    if (!EMAIL.test(form.email.trim())) local.email = true;
    if (!form.message.trim()) local.message = true;
    setErrors(local);
    setFailure(null);
    if (Object.keys(local).length) return;

    setState("busy");
    const topic = TOPICS.find((item) => item.value === form.topic);
    try {
      await siteService.submitContactRequest({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        organisation: form.organisation.trim() || undefined,
        subject: topic?.label.en,
        message: form.message.trim(),
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
        title={{ en: "Message received.", ar: "تم استلام رسالتك." }}
        body={{
          en: "Thank you for reaching out. A real person from the Odenta team will reply within one working day.",
          ar: "شكرًا لتواصلك. سيرد عليك شخص حقيقي من فريق أودنتا خلال يوم عمل واحد.",
        }}
        again={{ en: "Send another message", ar: "أرسل رسالة أخرى" }}
        onAgain={() => {
          setForm(initial());
          setState("idle");
        }}
      />
    );
  }

  return (
    <form onSubmit={submit} noValidate>
      <h2 className="text-[24px]">{t({ en: "Send us a message", ar: "أرسل لنا رسالة" })}</h2>
      <p className="s-muted mt-2 text-[15px]">
        {t({
          en: "Tell us a little about you — we'll come back with the right person.",
          ar: "أخبرنا قليلًا عنك — وسنعود إليك بالشخص المناسب.",
        })}
      </p>

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        <Field
          label={{ en: "Full name", ar: "الاسم الكامل" }}
          htmlFor="contact-name"
          required
          error={errors.name ? { en: "Please enter your name", ar: "يرجى إدخال اسمك" } : null}
        >
          <input id="contact-name" className="s-input" value={form.name} onChange={update("name")} autoComplete="name" />
        </Field>

        <Field
          label={{ en: "Email", ar: "البريد الإلكتروني" }}
          htmlFor="contact-email"
          required
          error={errors.email ? { en: "Please enter a valid email", ar: "يرجى إدخال بريد صالح" } : null}
        >
          <input
            id="contact-email"
            type="email"
            dir="ltr"
            className="s-input"
            value={form.email}
            onChange={update("email")}
            autoComplete="email"
          />
        </Field>

        <Field label={{ en: "Phone", ar: "الهاتف" }} htmlFor="contact-phone">
          <input
            id="contact-phone"
            type="tel"
            dir="ltr"
            className="s-input"
            value={form.phone}
            onChange={update("phone")}
            autoComplete="tel"
          />
        </Field>

        <Field label={{ en: "I'm contacting you about", ar: "أتواصل معكم بخصوص" }} htmlFor="contact-topic">
          <select id="contact-topic" className="s-input" value={form.topic} onChange={update("topic")}>
            {TOPICS.map((topic) => (
              <option key={topic.value} value={topic.value}>
                {t(topic.label)}
              </option>
            ))}
          </select>
        </Field>

        <Field label={{ en: "University or clinic", ar: "الجامعة أو العيادة" }} htmlFor="contact-org" className="sm:col-span-2">
          <input
            id="contact-org"
            className="s-input"
            value={form.organisation}
            onChange={update("organisation")}
            autoComplete="organization"
          />
        </Field>

        <Field
          label={{ en: "Message", ar: "الرسالة" }}
          htmlFor="contact-message"
          required
          className="sm:col-span-2"
          error={errors.message ? { en: "Please add a message", ar: "يرجى كتابة رسالة" } : null}
        >
          <textarea
            id="contact-message"
            rows={5}
            className="s-input"
            value={form.message}
            onChange={update("message")}
            placeholder={t({ en: "How can we help?", ar: "كيف يمكننا مساعدتك؟" })}
          />
        </Field>
      </div>

      {failure ? (
        <p className="mt-5 rounded-2xl bg-rose-500/10 px-4 py-3 text-[14px] font-medium text-rose-500">{failure}</p>
      ) : null}

      <SiteButton
        className="mt-8 w-full sm:w-auto"
        size="lg"
        type="submit"
        disabled={state === "busy"}
        rightIcon={<ArrowRight className={cn("h-4 w-4", isRtl && "rotate-180")} />}
      >
        {state === "busy" ? t({ en: "Sending…", ar: "جارٍ الإرسال…" }) : t({ en: "Send message", ar: "أرسل الرسالة" })}
      </SiteButton>
    </form>
  );
}

function Channel({ icon: Icon, label, value, href, external }) {
  const t = useT();
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="s-focus group flex items-center gap-4 rounded-2xl p-2 transition hover:bg-[var(--s-glass-strong)]"
    >
      <span className="s-chip !h-11 !w-11 shrink-0 !justify-center !p-0">
        <Icon className="s-accent h-[18px] w-[18px]" />
      </span>
      <span className="min-w-0">
        <span className="s-soft block text-[12.5px]">{t(label)}</span>
        <span className="block truncate text-[15px] font-medium" dir="ltr">
          {value}
        </span>
      </span>
    </a>
  );
}

export default function ContactPage() {
  const t = useT();

  return (
    <>
      <PageHero
        eyebrow={{ en: "Contact", ar: "تواصل" }}
        eyebrowIcon={<MessageCircle className="h-3.5 w-3.5" />}
        title={{ en: "Let's talk.", ar: "لنتحدث." }}
        highlight={{ en: "We're listening.", ar: "نحن نستمع." }}
        description={{
          en: "A dean, a dentist, a student or a patient — the first conversation is always with a person, never a script.",
          ar: "عميد أو طبيب أو طالب أو مريض — أول حديث يكون دائمًا مع إنسان، لا مع نص جاهز.",
        }}
      />

      <Section className="pt-4 lg:pt-6">
        <div className="grid gap-6 lg:grid-cols-12">
          <Reveal className="s-glass rounded-[32px] p-7 sm:p-10 lg:col-span-8">
            <ContactForm />
          </Reveal>

          <div className="flex flex-col gap-6 lg:col-span-4">
            <Reveal delay={120} className="s-glass rounded-[32px] p-6">
              <h3 className="px-2 pt-2 text-[18px]">{t({ en: "Reach us directly", ar: "تواصل معنا مباشرة" })}</h3>
              <div className="mt-4 flex flex-col gap-1">
                <Channel icon={Mail} label={{ en: "Email", ar: "البريد" }} value={contactDetails.email} href={`mailto:${contactDetails.email}`} />
                <Channel
                  icon={Phone}
                  label={{ en: "Phone", ar: "الهاتف" }}
                  value={contactDetails.phone}
                  href={`tel:${contactDetails.phone.replace(/\s/g, "")}`}
                />
                {socialLinks.map((item) => (
                  <Channel
                    key={item.key}
                    icon={SOCIAL_ICON[item.key]}
                    label={{ en: item.label, ar: item.label }}
                    value={item.handle}
                    href={item.href}
                    external
                  />
                ))}
              </div>
            </Reveal>

            <Reveal delay={200} className="s-glass rounded-[32px] p-8">
              <h3 className="text-[18px]">{t({ en: "Where we are", ar: "أين نحن" })}</h3>
              <p className="s-muted mt-5 flex items-start gap-3 text-[15px] leading-relaxed">
                <MapPin className="s-accent mt-0.5 h-[18px] w-[18px] shrink-0" />
                {t(contactDetails.address)}
              </p>
              <p className="s-muted mt-4 flex items-start gap-3 text-[15px]">
                <Clock3 className="s-accent mt-0.5 h-[18px] w-[18px] shrink-0" />
                {t(contactDetails.hours)}
              </p>
              <SiteButton variant="glass" size="sm" to={site.demo} className="mt-7">
                {t({ en: "Prefer a live demo?", ar: "تفضل عرضًا مباشرًا؟" })}
              </SiteButton>
            </Reveal>
          </div>
        </div>
      </Section>
    </>
  );
}
