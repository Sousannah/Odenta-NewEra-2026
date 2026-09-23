import { useParams } from "react-router-dom";
import {
  CalendarDays,
  Hash,
  IdCard,
  Phone,
  Printer,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import { useAsync } from "@/hooks";
import { universityService } from "@/services";
import { formatDate } from "@/lib/format";
import { departmentMeta } from "@/config/academic";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { OdentaLoaderPanel } from "@/components/ui/OdentaLoader";
import { QrCode } from "@/components/ui/QrCode";
import { toneFor, labelFor } from "@/components/shared";

/**
 * A patient card, opened from the QR printed on it.
 *
 * No sign-in, because nobody who scans a card has an account: it is the
 * patient looking up their own next visit, the dentist they have been
 * referred to, or the relative who drove them in. The token in the URL is the
 * credential, and the screen behind it is an identity card — who this is, who
 * is treating them, when they are next expected.
 *
 * It is not the record. There is no chart here, no history and no diagnosis,
 * and that is not an oversight: a link that travels through WhatsApp should
 * carry exactly what the printed card in a wallet carries and nothing more.
 * Anything clinical needs a session, which is what the portal is for.
 */
export default function PatientCardPage() {
  const { token } = useParams();

  const { data, loading, error } = useAsync(
    () => (token ? universityService.getSharedCard(token) : null),
    [token]
  );

  if (loading) return <OdentaLoaderPanel label="Opening the card" />;

  if (error || !data) {
    return (
      <div className="mx-auto w-full max-w-lg px-4 py-16 sm:py-24">
        <EmptyState
          icon={<IdCard className="h-6 w-6" />}
          title="This card link is not valid"
          description="It may have been reissued, or the link was copied incompletely. Ask the clinic desk for a new one."
          className="od-card py-14"
        />
      </div>
    );
  }

  const { card, patient, student, campus, appointments = [] } = data;
  const shareUrl = typeof window === "undefined" ? "" : window.location.href;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:py-12">
      <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-card">
        {/* ------------------------------------------------------ the face */}
        <header className="bg-od-gradient px-5 py-5 text-white sm:px-7 sm:py-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-[15px] font-extrabold sm:text-[17px]">
                {campus?.shortName ?? "AIU"} Dental Clinic
              </p>
              <p className="truncate text-[10.5px] font-semibold uppercase tracking-[0.14em] text-white/80">
                Patient card
              </p>
            </div>
            <span className="shrink-0 rounded-lg bg-white/15 px-3 py-1.5 text-[12px] font-extrabold">
              {card?.cardNumber ?? "NOT ISSUED"}
            </span>
          </div>

          <p className="mt-5 text-[24px] font-extrabold leading-tight sm:text-[28px]">
            {patient?.name}
          </p>
          <p className="mt-1 text-[13px] font-semibold text-white/85">
            {patient?.age} yrs · {patient?.gender} · {patient?.nationalId}
          </p>
        </header>

        {/* ----------------------------------------------------- the detail */}
        <div className="grid gap-6 px-5 py-6 sm:grid-cols-[1fr_auto] sm:px-7">
          <dl className="grid grid-cols-2 gap-x-5 gap-y-4">
            <Detail
              label="Department"
              value={departmentMeta(card?.department).label}
              icon={<Stethoscope className="h-3.5 w-3.5" />}
            />
            <Detail label="Clinic" value={card?.clinic ?? "—"} />
            <Detail label="Student" value={student?.name ?? "Not allocated"} />
            <Detail label="Student ID" value={student?.studentNumber ?? "—"} />
            <Detail
              label="Serial number"
              value={patient?.serialNumber ?? "—"}
              icon={<Hash className="h-3.5 w-3.5" />}
            />
            <Detail
              label="Phone"
              value={patient?.phone ?? "—"}
              icon={<Phone className="h-3.5 w-3.5" />}
            />
          </dl>

          <div className="flex flex-col items-center gap-2 justify-self-center sm:justify-self-end">
            <QrCode value={shareUrl} size={132} title="This patient card" />
            <span className="text-[11px] font-semibold text-ink-faint">Scan to reopen</span>
          </div>
        </div>

        {/* -------------------------------------------------- the next visits */}
        <section className="border-t border-slate-100 px-5 py-5 sm:px-7">
          <h2 className="mb-3 flex items-center gap-2 text-[13px] font-extrabold text-ink">
            <CalendarDays className="h-4 w-4 text-brand-600" />
            Appointments
          </h2>
          {appointments.length === 0 ? (
            <p className="text-[13px] text-ink-soft">Nothing booked against this card yet.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {appointments.map((visit) => (
                <li
                  key={visit.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 px-3.5 py-2.5"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-bold text-ink">
                      {formatDate(visit.date, "EEE, d MMM yyyy")} · {visit.time}
                    </span>
                    <span className="block truncate text-[12px] text-ink-soft">
                      {departmentMeta(visit.department).label}
                    </span>
                  </span>
                  <Badge tone={toneFor(visit.status)}>{labelFor(visit.status)}</Badge>
                </li>
              ))}
            </ul>
          )}
        </section>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/60 px-5 py-3.5 sm:px-7">
          <span className="text-[11.5px] font-semibold text-ink-soft">
            Visits: {card?.visits ?? 0} · Opened {card?.openedAt ?? "—"}
          </span>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Printer className="h-4 w-4" />}
            onClick={() => window.print()}
          >
            Print
          </Button>
        </footer>
      </article>

      <p className="mt-4 flex items-start gap-2 px-1 text-[12px] leading-relaxed text-ink-soft">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />
        This is an identification card, not a medical record. Treatment notes, charts and
        history stay inside the clinic's portal and are not reachable from this link.
      </p>
    </div>
  );
}

function Detail({ label, value, icon }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-ink-soft">
        {label}
      </dt>
      <dd className="mt-1 flex min-w-0 items-center gap-1.5 break-words text-[13.5px] font-semibold text-ink">
        {icon ? <span className="shrink-0 text-ink-soft">{icon}</span> : null}
        {value ?? "—"}
      </dd>
    </div>
  );
}
