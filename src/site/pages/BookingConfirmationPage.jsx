import { Link, useLocation } from "react-router-dom";
import {
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  Clock3,
  MapPin,
  Phone,
  Printer,
  ShieldCheck,
  University,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { site } from "@/config/paths";
import { useLanguage, useT } from "@/site/i18n/LanguageContext";
import { Reveal, Section, SiteButton } from "@/site/components";
import { contactDetails } from "@/site/content/navigation";

/**
 * Booking confirmation.
 *
 * The reference is the whole point of this page: it is what reception asks for
 * at the desk, so it is the largest thing on screen and survives a print.
 * Arriving here without a booking in `location.state` means a reload or a
 * bookmark — send the patient back to the wizard rather than showing an empty
 * receipt.
 */
export default function BookingConfirmationPage() {
  const t = useT();
  const { isRtl } = useLanguage();
  const location = useLocation();

  const booking = location.state?.booking;

  if (!booking) {
    return (
      <Section tone="canvas">
        <div className="mx-auto flex max-w-lg flex-col items-center gap-5 py-16 text-center">
          <ClipboardList className="h-10 w-10 text-ink-faint" />
          <h1 className="text-2xl font-extrabold text-brand-700">
            {t({ en: "No booking to show", ar: "لا يوجد حجز لعرضه" })}
          </h1>
          <p className="text-[15px] text-ink-muted">
            {t({
              en: "This page shows the receipt straight after a booking. Start again to book a visit.",
              ar: "تعرض هذه الصفحة إيصال الحجز مباشرة بعد إتمامه. ابدأ من جديد لحجز موعد.",
            })}
          </p>
          <SiteButton to={site.book}>{t({ en: "Book a visit", ar: "احجز موعدًا" })}</SiteButton>
        </div>
      </Section>
    );
  }

  const when = new Date(`${booking.date}T${booking.time}:00`);

  const rows = [
    {
      icon: <University className="h-4 w-4" />,
      label: { en: "Campus", ar: "الجامعة" },
      value: booking.universityName,
      detail: booking.universityCity,
    },
    {
      icon: <CalendarCheck className="h-4 w-4" />,
      label: { en: "Date", ar: "التاريخ" },
      value: when.toLocaleDateString(undefined, {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    },
    {
      icon: <Clock3 className="h-4 w-4" />,
      label: { en: "Time", ar: "الوقت" },
      value: `${booking.time} – ${booking.endTime}`,
      detail:
        booking.session === "morning"
          ? t({ en: "Morning session", ar: "الفترة الصباحية" })
          : t({ en: "Afternoon session", ar: "الفترة المسائية" }),
    },
    {
      icon: <UserRound className="h-4 w-4" />,
      label: { en: "Patient", ar: "المريض" },
      value: booking.fullName,
      detail: booking.nationalId,
    },
    {
      icon: <Phone className="h-4 w-4" />,
      label: { en: "Phone", ar: "الهاتف" },
      value: booking.phone,
    },
  ];

  return (
    <>
      <Section tone="soft" className="pb-10 pt-16 lg:pb-12 lg:pt-20">
        <Reveal className="mx-auto flex max-w-2xl flex-col items-center text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-od-gradient text-white shadow-brand">
            <CheckCircle2 className="h-8 w-8" />
          </span>
          <h1 className="mt-6 text-[32px] font-extrabold leading-tight text-brand-700 md:text-[40px]">
            {t({ en: "Your visit is booked", ar: "تم حجز موعدك" })}
          </h1>
          <p className="mt-4 text-[16px] leading-relaxed text-ink-muted">
            {t({
              en: "Quote this reference at reception. We have also sent it to the phone number you gave us.",
              ar: "اذكر هذا الرقم المرجعي في الاستقبال. أرسلناه أيضًا إلى رقم الهاتف الذي أدخلته.",
            })}
          </p>
        </Reveal>
      </Section>

      <Section tone="canvas" className="pt-0">
        <div className="mx-auto -mt-8 max-w-3xl">
          <Reveal className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-lift">
            {/* --------------------------------------------- the reference */}
            <div className="flex flex-col items-center gap-2 bg-od-gradient px-8 py-8 text-center text-white">
              <span className="text-[11.5px] font-extrabold uppercase tracking-[0.18em] text-white/75">
                {t({ en: "Booking reference", ar: "الرقم المرجعي" })}
              </span>
              <span className="font-mono text-[34px] font-extrabold leading-none tracking-[0.06em] md:text-[42px]">
                {booking.reference}
              </span>
            </div>

            {/* ------------------------------------------------ the detail */}
            <dl className="grid gap-x-8 gap-y-6 px-8 py-8 sm:grid-cols-2">
              {rows.map((row) => (
                <div key={t(row.label)} className="flex min-w-0 items-start gap-3">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                    {row.icon}
                  </span>
                  <div className="min-w-0">
                    <dt className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-ink-soft">
                      {t(row.label)}
                    </dt>
                    <dd className="mt-1 break-words text-[15px] font-extrabold text-ink">
                      {row.value}
                    </dd>
                    {row.detail ? (
                      <dd className="mt-0.5 text-[12.5px] text-ink-muted">{row.detail}</dd>
                    ) : null}
                  </div>
                </div>
              ))}

              {booking.chiefComplaint ? (
                <div className="min-w-0 sm:col-span-2">
                  <dt className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-ink-soft">
                    {t({ en: "Reason for visit", ar: "سبب الزيارة" })}
                  </dt>
                  <dd className="mt-1 text-[14.5px] leading-relaxed text-ink-muted">
                    {booking.chiefComplaint}
                  </dd>
                </div>
              ) : null}
            </dl>

            {/* --------------------------------------------- what to bring */}
            <div className="border-t border-slate-100 bg-canvas px-8 py-7">
              <h2 className="text-[15px] font-extrabold text-brand-700">
                {t({ en: "On the day", ar: "يوم الزيارة" })}
              </h2>
              <ul className="mt-4 flex flex-col gap-3">
                {[
                  {
                    en: "Arrive 15 minutes early — screening and registration happen before your slot.",
                    ar: "احضر قبل الموعد بربع ساعة — يتم الفحص المبدئي والتسجيل قبل موعدك.",
                  },
                  {
                    en: "Bring your national ID and any previous X-rays or prescriptions.",
                    ar: "أحضر بطاقة الرقم القومي وأي أشعة أو روشتات سابقة.",
                  },
                  {
                    en: "Your treatment is carried out by a dental student under direct supervision. You will sign a consent form before anything begins.",
                    ar: "سيتم علاجك بواسطة طالب أسنان تحت إشراف مباشر. ستوقّع نموذج موافقة قبل بدء أي إجراء.",
                  },
                  {
                    en: "If you cannot attend, call the clinic so the slot can go to someone else.",
                    ar: "إذا تعذّر حضورك، اتصل بالعيادة حتى يستفيد شخص آخر من الموعد.",
                  },
                ].map((line) => (
                  <li key={line.en} className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent-600" />
                    <span className="text-[13.5px] leading-relaxed text-ink-muted">{t(line)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          {/* --------------------------------------------------- actions */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <SiteButton
              variant="ghost"
              onClick={() => window.print()}
              leftIcon={<Printer className="h-4 w-4" />}
            >
              {t({ en: "Print this page", ar: "اطبع هذه الصفحة" })}
            </SiteButton>
            <SiteButton to={site.universities}>
              {t({ en: "Explore university clinics", ar: "استكشف عيادات الجامعات" })}
            </SiteButton>
          </div>

          <p className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-center text-[13px] text-ink-soft">
            <span className="inline-flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5" />
              {contactDetails.phone}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className={cn("h-3.5 w-3.5", isRtl && "scale-x-[-1]")} />
              {t(contactDetails.address)}
            </span>
            <Link to={site.contact} className="font-bold text-accent-600 hover:text-brand-700">
              {t({ en: "Need to change it?", ar: "تريد تعديل الحجز؟" })}
            </Link>
          </p>
        </div>
      </Section>
    </>
  );
}
