import { useEffect, useMemo, useState } from "react";
import { dateKeyOffset } from "@/lib/time";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  Clock3,
  GraduationCap,
  MapPin,
  ShieldCheck,
  University,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { site } from "@/config/paths";
import { useAsync } from "@/hooks";
import { siteService } from "@/services";
import { useLanguage, useT } from "@/site/i18n/LanguageContext";
import { PageHero, Reveal, Section, SiteButton } from "@/site/components";

/**
 * The teaching clinic is closed Friday and Saturday, so the wizard opens on the
 * next day it is actually open — landing on "the clinic is closed that day" is
 * a needless dead end for someone booking on a Thursday night.
 */
const isClosed = (key) => {
  const day = new Date(`${key}T00:00:00`).getDay();
  return day === 5 || day === 6;
};

const nextOpenDay = (from = 1) => {
  for (let offset = from; offset < from + 7; offset += 1) {
    const key = dateKeyOffset(offset);
    if (!isClosed(key)) return key;
  }
  return dateKeyOffset(from);
};

const STEPS = [
  { key: "campus", label: { en: "Campus", ar: "الجامعة" }, icon: University },
  { key: "slot", label: { en: "Date & time", ar: "التاريخ والوقت" }, icon: CalendarCheck },
  { key: "details", label: { en: "Your details", ar: "بياناتك" }, icon: UserRound },
  { key: "confirm", label: { en: "Confirm", ar: "التأكيد" }, icon: CheckCircle2 },
];

const EMPTY_FORM = {
  fullName: "",
  nationalId: "",
  phone: "",
  age: "",
  gender: "",
  occupation: "",
  address: "",
  chiefComplaint: "",
};

/* ------------------------------------------------------------ small parts */

function Stepper({ current }) {
  const t = useT();
  const { isRtl } = useLanguage();

  return (
    <ol className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-x-2 gap-y-3">
      {STEPS.map((step, index) => {
        const Icon = step.icon;
        const done = index < current;
        const active = index === current;
        return (
          <li key={step.key} className="flex items-center gap-2">
            <span
              className={cn(
                "flex items-center gap-2 rounded-full border px-4 py-2 text-[13px] font-bold transition",
                active
                  ? "border-transparent bg-od-gradient text-white shadow-brand"
                  : done
                    ? "border-accent-200 bg-accent-50 text-accent-700"
                    : "border-slate-200 bg-white text-ink-soft"
              )}
            >
              {done ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              {t(step.label)}
            </span>
            {index < STEPS.length - 1 ? (
              <ArrowRight className={cn("h-4 w-4 text-ink-faint", isRtl && "rotate-180")} />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

function FieldRow({ label, required, hint, children }) {
  const t = useT();
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13.5px] font-bold text-ink">
        {t(label)}
        {required ? <span className="text-danger"> *</span> : null}
        {hint ? <span className="ml-1.5 font-medium text-ink-soft">({t(hint)})</span> : null}
      </span>
      {children}
    </label>
  );
}

const CONTROL =
  "h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-[14.5px] text-ink placeholder:text-ink-faint transition focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-600/10";

/* ------------------------------------------------------------- the screen */

/**
 * Book a chair in a university clinic.
 *
 * Four steps rather than one long form: on a phone, a booking abandoned
 * halfway is a patient who does not get seen, and the shorter each step is the
 * fewer of those there are. The slot is re-checked on submit because the same
 * hour may have filled while the form was open.
 */
export default function BookAppointmentPage() {
  const t = useT();
  const { isRtl } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();

  const preselected = location.state?.universityId ?? params.get("university") ?? "";

  const [step, setStep] = useState(preselected ? 1 : 0);
  const [universityId, setUniversityId] = useState(preselected);
  const [date, setDate] = useState(nextOpenDay);
  const [time, setTime] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const { data: universities = [], loading: loadingUniversities } = useAsync(
    () => siteService.getUniversities(),
    [],
    []
  );

  const { data: availability, loading: loadingSlots } = useAsync(
    () =>
      universityId && date
        ? siteService.getBookingSlots({ universityId, date })
        : Promise.resolve(null),
    [universityId, date]
  );

  const university = useMemo(
    () => universities.find((item) => item.id === universityId) ?? null,
    [universities, universityId]
  );

  /* a slot chosen on one day must not survive a date change */
  useEffect(() => {
    setTime(null);
  }, [date, universityId]);

  const set = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const detailsComplete =
    form.fullName.trim() && form.nationalId.trim() && form.phone.trim() && form.chiefComplaint.trim();

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const booking = await siteService.bookAppointment({
        universityId,
        date,
        time,
        fullName: form.fullName.trim(),
        nationalId: form.nationalId.trim(),
        phone: form.phone.trim(),
        age: form.age ? Number(form.age) : null,
        gender: form.gender || null,
        occupation: form.occupation.trim() || null,
        address: form.address.trim() || null,
        chiefComplaint: form.chiefComplaint.trim(),
      });
      navigate(site.bookingConfirmation, { state: { booking }, replace: true });
    } catch (cause) {
      /* a slot can fill while the form is open — send the patient back to pick again */
      if (cause?.code === "slot_unavailable") {
        setStep(1);
        setTime(null);
      }
      setError(cause?.message ?? t({ en: "Could not book that visit", ar: "تعذّر حجز الموعد" }));
    } finally {
      setBusy(false);
    }
  };

  const canContinue =
    (step === 0 && Boolean(universityId)) ||
    (step === 1 && Boolean(time)) ||
    (step === 2 && Boolean(detailsComplete));

  const days = Array.from({ length: 14 }, (_, index) => dateKeyOffset(index + 1));

  return (
    <>
      <PageHero
        eyebrow={{ en: "University clinics", ar: "عيادات الجامعات" }}
        eyebrowIcon={<GraduationCap className="h-3.5 w-3.5" />}
        title={{ en: "Book a visit at a", ar: "احجز موعدًا في" }}
        highlight={{ en: "teaching clinic", ar: "عيادة تعليمية" }}
        description={{
          en: "Treatment is carried out by a senior dental student under the supervision of a qualified clinician, at a reduced fee. Choose a campus, pick a time, and bring your ID on the day.",
          ar: "يتم العلاج بواسطة طالب أسنان في سنوات متقدمة وتحت إشراف طبيب مؤهل، برسوم مخفضة. اختر الجامعة والوقت، وأحضر بطاقتك يوم الزيارة.",
        }}
      >
        <div className="mt-12">
          <Stepper current={step} />
        </div>
      </PageHero>

      <Section tone="canvas" className="pt-0">
        <div className="mx-auto -mt-10 max-w-4xl">
          <Reveal className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-lift md:p-9">
            {/* ------------------------------------------------ step 1 */}
            {step === 0 ? (
              <div className="flex flex-col gap-6">
                <header>
                  <h2 className="text-[22px] font-extrabold text-brand-700">
                    {t({ en: "Which campus?", ar: "أي جامعة؟" })}
                  </h2>
                  <p className="mt-1.5 text-[14.5px] text-ink-muted">
                    {t({
                      en: "Each university clinic sets its own intake days and fees.",
                      ar: "كل عيادة جامعية تحدد أيام الاستقبال والرسوم الخاصة بها.",
                    })}
                  </p>
                </header>

                {loadingUniversities ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div
                        key={index}
                        className="h-[132px] animate-pulse rounded-2xl border border-slate-200 bg-slate-50"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {universities.map((item) => {
                      const active = universityId === item.id;
                      const open = item.booking?.open;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          disabled={!open}
                          onClick={() => setUniversityId(item.id)}
                          className={cn(
                            "od-focus flex items-start gap-4 rounded-2xl border p-5 text-start transition",
                            active
                              ? "border-accent-400 bg-accent-50/60 shadow-card"
                              : "border-slate-200 bg-white hover:border-accent-300 hover:shadow-card",
                            !open && "cursor-not-allowed opacity-55"
                          )}
                        >
                          <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-white p-1.5">
                            <img
                              src={item.logo}
                              alt=""
                              aria-hidden="true"
                              className="h-full w-full object-contain"
                            />
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-[15px] font-extrabold text-brand-700">
                              {t(item.name)}
                            </span>
                            <span className="mt-1 flex items-center gap-1.5 text-[12.5px] font-semibold text-ink-muted">
                              <MapPin className="h-3.5 w-3.5 text-accent-600" />
                              {t(item.city)}
                            </span>
                            <span className="mt-2 block text-[12px] font-bold uppercase tracking-wide">
                              {open ? (
                                <span className="text-accent-700">
                                  {t({ en: "Accepting patients", ar: "يستقبل مرضى" })}
                                </span>
                              ) : (
                                <span className="text-ink-faint">
                                  {t({ en: "Intake closed", ar: "الاستقبال مغلق" })}
                                </span>
                              )}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : null}

            {/* ------------------------------------------------ step 2 */}
            {step === 1 ? (
              <div className="flex flex-col gap-6">
                <header>
                  <h2 className="text-[22px] font-extrabold text-brand-700">
                    {t({ en: "Pick a date and time", ar: "اختر التاريخ والوقت" })}
                  </h2>
                  <p className="mt-1.5 text-[14.5px] text-ink-muted">
                    {t({
                      en: "The teaching clinic runs a morning and an afternoon session, Sunday to Thursday.",
                      ar: "تعمل العيادة التعليمية في فترتين صباحية ومسائية، من الأحد إلى الخميس.",
                    })}
                  </p>
                </header>

                <div className="od-scroll-x -mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
                  {days.map((day) => {
                    const active = day === date;
                    const closed = isClosed(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        disabled={closed}
                        onClick={() => setDate(day)}
                        className={cn(
                          "od-focus flex min-w-[86px] shrink-0 flex-col items-center gap-0.5 rounded-2xl border px-3 py-3 transition",
                          active
                            ? "border-transparent bg-od-gradient text-white shadow-brand"
                            : "border-slate-200 bg-white hover:border-accent-300",
                          closed && "cursor-not-allowed opacity-45"
                        )}
                      >
                        <span
                          className={cn(
                            "text-[11px] font-bold uppercase tracking-wide",
                            active ? "text-white/80" : "text-ink-soft"
                          )}
                        >
                          {new Date(`${day}T00:00:00`).toLocaleDateString(undefined, { weekday: "short" })}
                        </span>
                        <span
                          className={cn(
                            "text-[19px] font-extrabold leading-none",
                            active ? "text-white" : "text-ink"
                          )}
                        >
                          {new Date(`${day}T00:00:00`).getDate()}
                        </span>
                        <span
                          className={cn(
                            "text-[11px] font-semibold",
                            active ? "text-white/80" : "text-ink-faint"
                          )}
                        >
                          {new Date(`${day}T00:00:00`).toLocaleDateString(undefined, { month: "short" })}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {loadingSlots ? (
                  <div className="grid gap-3 sm:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, index) => (
                      <div
                        key={index}
                        className="h-[76px] animate-pulse rounded-2xl border border-slate-200 bg-slate-50"
                      />
                    ))}
                  </div>
                ) : !availability?.slots?.some((slot) => slot.capacity > 0) ? (
                  <div className="rounded-2xl border border-slate-200 bg-canvas px-6 py-12 text-center">
                    <Clock3 className="mx-auto h-7 w-7 text-ink-faint" />
                    <p className="mt-3 text-[15px] font-bold text-ink">
                      {t({ en: "The clinic is closed that day", ar: "العيادة مغلقة في هذا اليوم" })}
                    </p>
                    <p className="mt-1 text-[13.5px] text-ink-muted">
                      {t({ en: "Try Sunday to Thursday.", ar: "جرّب من الأحد إلى الخميس." })}
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-3">
                    {availability.slots.map((slot) => {
                      const active = time === slot.time;
                      return (
                        <button
                          key={slot.time}
                          type="button"
                          disabled={!slot.available}
                          onClick={() => setTime(slot.time)}
                          className={cn(
                            "od-focus flex flex-col items-start gap-1 rounded-2xl border px-4 py-3.5 text-start transition",
                            active
                              ? "border-transparent bg-od-gradient text-white shadow-brand"
                              : "border-slate-200 bg-white hover:border-accent-300",
                            !slot.available && "cursor-not-allowed opacity-45"
                          )}
                        >
                          <span
                            className={cn(
                              "text-[16px] font-extrabold",
                              active ? "text-white" : "text-ink"
                            )}
                          >
                            {slot.time} – {slot.endTime}
                          </span>
                          <span
                            className={cn(
                              "text-[12px] font-semibold",
                              active ? "text-white/80" : "text-ink-soft"
                            )}
                          >
                            {slot.available
                              ? t({
                                  en: `${slot.remaining} place${slot.remaining === 1 ? "" : "s"} left`,
                                  ar: `${slot.remaining} مكان متاح`,
                                })
                              : t({ en: "Fully booked", ar: "مكتمل" })}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : null}

            {/* ------------------------------------------------ step 3 */}
            {step === 2 ? (
              <div className="flex flex-col gap-6">
                <header>
                  <h2 className="text-[22px] font-extrabold text-brand-700">
                    {t({ en: "Your details", ar: "بياناتك" })}
                  </h2>
                  <p className="mt-1.5 text-[14.5px] text-ink-muted">
                    {t({
                      en: "Bring the same national ID with you on the day — the clinic checks it at reception.",
                      ar: "أحضر نفس بطاقة الرقم القومي يوم الزيارة — يتم التحقق منها في الاستقبال.",
                    })}
                  </p>
                </header>

                <div className="grid gap-5 sm:grid-cols-2">
                  <FieldRow label={{ en: "Full name", ar: "الاسم بالكامل" }} required>
                    <input className={CONTROL} value={form.fullName} onChange={set("fullName")} />
                  </FieldRow>

                  <FieldRow label={{ en: "National ID", ar: "الرقم القومي" }} required>
                    <input className={CONTROL} value={form.nationalId} onChange={set("nationalId")} />
                  </FieldRow>

                  <FieldRow label={{ en: "Phone number", ar: "رقم الهاتف" }} required>
                    <input className={CONTROL} value={form.phone} onChange={set("phone")} />
                  </FieldRow>

                  <FieldRow label={{ en: "Age", ar: "السن" }}>
                    <input
                      type="number"
                      min={1}
                      max={120}
                      className={CONTROL}
                      value={form.age}
                      onChange={set("age")}
                    />
                  </FieldRow>

                  <FieldRow label={{ en: "Gender", ar: "النوع" }}>
                    <select className={cn(CONTROL, "cursor-pointer")} value={form.gender} onChange={set("gender")}>
                      <option value="">{t({ en: "Prefer not to say", ar: "أفضل عدم الإفصاح" })}</option>
                      <option value="female">{t({ en: "Female", ar: "أنثى" })}</option>
                      <option value="male">{t({ en: "Male", ar: "ذكر" })}</option>
                    </select>
                  </FieldRow>

                  <FieldRow label={{ en: "Occupation", ar: "المهنة" }}>
                    <input className={CONTROL} value={form.occupation} onChange={set("occupation")} />
                  </FieldRow>

                  <FieldRow label={{ en: "Address", ar: "العنوان" }}>
                    <input className={CONTROL} value={form.address} onChange={set("address")} />
                  </FieldRow>

                  <div className="sm:col-span-2">
                    <FieldRow
                      label={{ en: "What brings you in?", ar: "ما سبب الزيارة؟" }}
                      required
                      hint={{ en: "in your own words", ar: "بكلماتك" }}
                    >
                      <textarea
                        rows={4}
                        className={cn(CONTROL, "h-auto resize-y py-3")}
                        value={form.chiefComplaint}
                        onChange={set("chiefComplaint")}
                        placeholder={t({
                          en: "Pain in the lower left back tooth when I drink something cold…",
                          ar: "ألم في الضرس الخلفي السفلي الأيسر عند شرب شيء بارد…",
                        })}
                      />
                    </FieldRow>
                  </div>
                </div>
              </div>
            ) : null}

            {/* ------------------------------------------------ step 4 */}
            {step === 3 ? (
              <div className="flex flex-col gap-6">
                <header>
                  <h2 className="text-[22px] font-extrabold text-brand-700">
                    {t({ en: "Check and confirm", ar: "راجع وأكّد" })}
                  </h2>
                  <p className="mt-1.5 text-[14.5px] text-ink-muted">
                    {t({
                      en: "Nothing is booked until you confirm.",
                      ar: "لن يتم الحجز حتى تضغط على التأكيد.",
                    })}
                  </p>
                </header>

                <dl className="grid gap-x-8 gap-y-5 rounded-2xl border border-slate-200 bg-canvas p-6 sm:grid-cols-2">
                  {[
                    { label: { en: "Campus", ar: "الجامعة" }, value: university ? t(university.name) : "—" },
                    {
                      label: { en: "Date", ar: "التاريخ" },
                      value: new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      }),
                    },
                    { label: { en: "Time", ar: "الوقت" }, value: time ?? "—" },
                    { label: { en: "Name", ar: "الاسم" }, value: form.fullName },
                    { label: { en: "National ID", ar: "الرقم القومي" }, value: form.nationalId },
                    { label: { en: "Phone", ar: "الهاتف" }, value: form.phone },
                    {
                      label: { en: "Reason for visit", ar: "سبب الزيارة" },
                      value: form.chiefComplaint,
                      wide: true,
                    },
                  ].map((row) => (
                    <div key={t(row.label)} className={cn("min-w-0", row.wide && "sm:col-span-2")}>
                      <dt className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-ink-soft">
                        {t(row.label)}
                      </dt>
                      <dd className="mt-1 break-words text-[14.5px] font-bold text-ink">
                        {row.value || "—"}
                      </dd>
                    </div>
                  ))}
                </dl>

                <div className="flex items-start gap-3 rounded-2xl border border-accent-200 bg-accent-50/60 p-5">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-accent-600" />
                  <p className="text-[13.5px] leading-relaxed text-ink-muted">
                    {t({
                      en: "Your treatment will be carried out by a dental student under the direct supervision of a qualified clinician. You will be asked to sign a consent form at your first visit, and you may stop treatment at any point.",
                      ar: "سيتم علاجك بواسطة طالب أسنان تحت الإشراف المباشر لطبيب مؤهل. سيُطلب منك توقيع نموذج موافقة في الزيارة الأولى، ويمكنك إيقاف العلاج في أي وقت.",
                    })}
                  </p>
                </div>
              </div>
            ) : null}

            {error ? (
              <p className="mt-6 rounded-xl bg-danger-soft px-4 py-3 text-[13.5px] font-semibold text-danger">
                {error}
              </p>
            ) : null}

            {/* ------------------------------------------------ nav row */}
            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-6">
              <SiteButton
                variant="link"
                onClick={() => (step === 0 ? navigate(site.universities) : setStep(step - 1))}
                leftIcon={<ArrowLeft className={cn("h-4 w-4", isRtl && "rotate-180")} />}
              >
                {step === 0
                  ? t({ en: "All universities", ar: "كل الجامعات" })
                  : t({ en: "Back", ar: "رجوع" })}
              </SiteButton>

              {step < STEPS.length - 1 ? (
                <SiteButton
                  onClick={() => setStep(step + 1)}
                  className={cn(!canContinue && "pointer-events-none opacity-50")}
                  rightIcon={<ArrowRight className={cn("h-4 w-4", isRtl && "rotate-180")} />}
                >
                  {t({ en: "Continue", ar: "متابعة" })}
                </SiteButton>
              ) : (
                <SiteButton
                  onClick={submit}
                  className={cn(busy && "pointer-events-none opacity-70")}
                  leftIcon={<CalendarCheck className="h-4 w-4" />}
                >
                  {busy
                    ? t({ en: "Booking…", ar: "جارٍ الحجز…" })
                    : t({ en: "Confirm booking", ar: "تأكيد الحجز" })}
                </SiteButton>
              )}
            </div>
          </Reveal>

          <p className="mt-6 flex items-center justify-center gap-2 text-center text-[13px] text-ink-soft">
            <ClipboardList className="h-4 w-4" />
            {t({
              en: "Bring your national ID and any previous X-rays with you.",
              ar: "أحضر بطاقة الرقم القومي وأي أشعة سابقة.",
            })}
          </p>
        </div>
      </Section>
    </>
  );
}
