import { useEffect, useRef, useState } from "react";
import { MoreHorizontal, Plus } from "lucide-react";
import { cn } from "@/lib/cn";
import { AvatarCard } from "@/components/ui/Avatar";
import { StatusPill } from "@/components/ui/Badge";
import { APPOINTMENT_STATUS } from "@/config/domain";
import {
  SLOT_HEIGHT,
  heightFor,
  hourRange,
  labelForHour,
  nowOffset,
  offsetFor,
  toClockLabel,
} from "@/lib/time";
import { appointmentAppearance } from "./appointmentStyles";

const COLUMN_WIDTH = 336;
const GUTTER_WIDTH = 80;
const HEADER_HEIGHT = 84;

/* ------------------------------------------------------------ event card */

function AppointmentBlock({ appointment, onOpen }) {
  const look = appointmentAppearance(appointment);
  const Icon = look.icon;
  const status = APPOINTMENT_STATUS[appointment.status];
  const height = heightFor(appointment.start, appointment.end);
  const compact = height < 92;

  return (
    <button
      type="button"
      onClick={() => onOpen(appointment)}
      style={{ top: offsetFor(appointment.start) + 3, height }}
      className={cn(
        "absolute left-2 right-2 flex flex-col gap-1.5 overflow-hidden rounded-xl px-3 py-2.5 text-left transition hover:shadow-card",
        look.card
      )}
    >
      <span className="flex items-start justify-between gap-2">
        <span className="flex min-w-0 items-start gap-2.5">
          <span
            className={cn(
              "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md",
              look.badge
            )}
          >
            <Icon className="h-3 w-3" strokeWidth={2.6} />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[13.5px] font-bold text-ink">
              {appointment.patientName}
            </span>
            <span className="mt-0.5 block truncate text-[12px] font-medium text-ink-muted">
              {toClockLabel(appointment.start)} <span className="px-0.5">&gt;</span>{" "}
              {toClockLabel(appointment.end)}
            </span>
          </span>
        </span>
        {!compact ? (
          <StatusPill tone={look.chipTone} className="shrink-0">
            {status.label}
          </StatusPill>
        ) : null}
      </span>

      {!compact ? (
        <span
          className={cn(
            "mt-auto w-fit rounded-full border px-2.5 py-1 text-[12px] font-semibold text-ink",
            look.pill
          )}
        >
          {appointment.treatment}
        </span>
      ) : null}
    </button>
  );
}

/* ------------------------------------------------------------ time gutter */

function TimeGutter({ timezone }) {
  return (
    <div
      className="sticky left-0 z-20 shrink-0 bg-white"
      style={{ width: GUTTER_WIDTH }}
    >
      <div
        className="sticky top-0 z-30 flex items-center justify-center border-b border-r border-slate-200 bg-white text-[11px] font-bold text-ink-soft"
        style={{ height: HEADER_HEIGHT }}
      >
        {timezone}
      </div>
      <div className="relative border-r border-slate-200 bg-white">
        {hourRange().map((hour) => (
          <div
            key={hour}
            className="relative border-b border-slate-100 text-center"
            style={{ height: SLOT_HEIGHT }}
          >
            <span className="absolute -top-2 left-0 right-0 text-[12px] font-semibold text-ink-soft">
              {labelForHour(hour)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* --------------------------------------------------------- dentist column */

function DentistColumn({ dentist, appointments, onOpenAppointment, onCreate }) {
  return (
    <div
      className="shrink-0 border-r border-slate-200"
      style={{ width: COLUMN_WIDTH }}
    >
      <div
        className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-slate-200 bg-white px-4"
        style={{ height: HEADER_HEIGHT }}
      >
        <AvatarCard
          name={dentist.name}
          label={`Today's appointment: ${appointments.length} patient(s)`}
          size="md"
        />
        <button
          type="button"
          aria-label={`More options for ${dentist.name}`}
          className="rounded-lg p-1.5 text-ink-soft transition hover:bg-slate-100"
        >
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </div>

      <div className="relative">
        {hourRange().map((hour) => (
          <button
            key={hour}
            type="button"
            disabled={!onCreate}
            onClick={() => onCreate?.({ dentist, hour })}
            className="group relative block w-full border-b border-slate-100 transition enabled:hover:bg-brand-50/50"
            style={{ height: SLOT_HEIGHT }}
          >
            {onCreate ? (
              <span className="pointer-events-none absolute inset-0 hidden items-center justify-center group-hover:flex">
                <span className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[12px] font-bold text-brand-600 shadow-card">
                  <Plus className="h-3.5 w-3.5" /> Add to waitlist
                </span>
              </span>
            ) : null}
          </button>
        ))}

        {appointments.map((appointment) => (
          <AppointmentBlock
            key={appointment.id}
            appointment={appointment}
            onOpen={onOpenAppointment}
          />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ board */

export function CalendarBoard({
  dentists,
  appointments,
  timezone = "GMT +07:00",
  onOpenAppointment,
  onCreate,
}) {
  const scrollRef = useRef(null);
  const [ticker, setTicker] = useState(() => nowOffset());

  useEffect(() => {
    const id = setInterval(() => setTicker(nowOffset()), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    // land the viewport on the current hour rather than at 8am
    if (ticker != null && scrollRef.current) {
      scrollRef.current.scrollTop = Math.max(ticker - 160, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={scrollRef}
      className="od-card relative min-h-0 flex-1 overflow-auto p-0"
    >
      <div className="relative flex min-w-max">
        <TimeGutter timezone={timezone} />

        <div className="relative flex">
          {dentists.map((dentist) => (
            <DentistColumn
              key={dentist.id}
              dentist={dentist}
              appointments={appointments.filter((item) => item.dentistId === dentist.id)}
              onOpenAppointment={onOpenAppointment}
              onCreate={onCreate}
            />
          ))}

          {ticker != null ? (
            <div
              className="pointer-events-none absolute left-0 right-0 z-[5]"
              style={{ top: HEADER_HEIGHT + ticker }}
            >
              <span className="absolute -left-1 -top-[5px] h-2.5 w-2.5 rounded-full bg-danger" />
              <span className="block h-px w-full bg-danger/70" />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
