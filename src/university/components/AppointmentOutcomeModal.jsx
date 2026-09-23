import { useEffect, useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  Clock3,
  FolderOpen,
  LogIn,
  Stethoscope,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { universityService } from "@/services";
import { formatDate } from "@/lib/format";
import { toDateKey } from "@/lib/time";
import { CLINIC_SESSIONS, sessionForTime, sessionSlots } from "@/config/academic";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { InfoBanner } from "@/components/ui/Misc";
import { labelFor, toneFor } from "@/components/shared";
import { DepartmentChip, DetailGrid } from "./index";

/**
 * What happened to a visit.
 *
 * One popup, three outcomes, opened from every calendar in the portal — the
 * student's board, the desk's intake list and the registry. It exists because
 * "mark this finished" was previously only reachable from the desk's own
 * detail modal, so a student looking at their own chair had no way to close a
 * visit off at all.
 *
 * Postponing is not cancelling and it is not finishing: the clinic still
 * intends to see the patient, so the form asks where the visit is moving to
 * and carries the row there rather than leaving a dead slot behind.
 */

const OUTCOMES = [
  {
    value: "finished",
    label: "Finished",
    hint: "The patient was seen and the session is over.",
    icon: CheckCircle2,
    active: "border-success bg-success-soft text-success-strong",
  },
  {
    value: "postponed",
    label: "Postponed",
    hint: "Still going ahead, on another day.",
    icon: CalendarClock,
    active: "border-info bg-info-soft text-info-ink",
  },
  {
    value: "cancelled",
    label: "Cancelled",
    hint: "The visit is off and will not be rebooked.",
    icon: XCircle,
    active: "border-danger bg-danger-soft text-danger",
  },
];

/** Where a still-open visit can go next, before anybody records an outcome. */
const ADVANCE = {
  registered: { status: "arrived", label: "Check in", icon: LogIn },
  arrived: { status: "encounter", label: "Send to chair", icon: Stethoscope },
  postponed: { status: "registered", label: "Reopen", icon: Clock3 },
};

export function AppointmentOutcomeModal({
  appointment,
  open,
  onClose,
  onChanged,
  onOpenRecord,
  title = "Appointment",
}) {
  const [outcome, setOutcome] = useState("finished");
  const [date, setDate] = useState("");
  const [session, setSession] = useState(CLINIC_SESSIONS[0].value);
  const [time, setTime] = useState(CLINIC_SESSIONS[0].start);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open || !appointment) return;
    /* A visit that is already over opens on "postponed", because the only
       reason to reopen this popup is to move it. */
    const closed = ["finished", "cancelled"].includes(appointment.status);
    setOutcome(closed ? "postponed" : "finished");
    setDate(appointment.date ?? toDateKey());
    const nextSession = sessionForTime(appointment.time ?? "09:00");
    setSession(nextSession.value);
    setTime(appointment.time ?? nextSession.start);
    setNote("");
    setError(null);
  }, [open, appointment?.id, appointment?.status]);

  if (!appointment) return null;

  const advance = ADVANCE[appointment.status];

  const patch = async (payload, message) => {
    setBusy(true);
    setError(null);
    try {
      await universityService.updateAppointment(appointment.id, payload);
      onChanged?.(payload.status, message);
      onClose?.();
    } catch (cause) {
      setError(cause?.message ?? "Could not update this appointment.");
    } finally {
      setBusy(false);
    }
  };

  const record = () => {
    if (outcome === "postponed") {
      if (!date) {
        setError("Pick the date the visit is moving to.");
        return;
      }
      return patch(
        {
          status: "postponed",
          date,
          time,
          session,
          postponedFrom: appointment.date,
          note: note.trim() || appointment.note || null,
        },
        `Moved to ${formatDate(date, "d MMM")} at ${time}`
      );
    }
    return patch(
      { status: outcome, note: note.trim() || appointment.note || null },
      appointment.patientName
    );
  };

  const selected = OUTCOMES.find((item) => item.value === outcome);
  const OutcomeIcon = selected?.icon ?? CheckCircle2;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={appointment.patientName ?? title}
      description={`${formatDate(appointment.date, "EEE, d MMM yyyy")} at ${appointment.time}${
        appointment.reference ? ` · ${appointment.reference}` : ""
      }`}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          {advance ? (
            <Button
              variant="secondary"
              leftIcon={<advance.icon className="h-4 w-4" />}
              loading={busy}
              onClick={() => patch({ status: advance.status }, appointment.patientName)}
            >
              {advance.label}
            </Button>
          ) : null}
          <Button
            loading={busy}
            variant={outcome === "cancelled" ? "danger" : "primary"}
            leftIcon={<OutcomeIcon className="h-4 w-4" />}
            onClick={record}
          >
            Mark {selected?.label.toLowerCase()}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        {error ? <InfoBanner tone="warning">{error}</InfoBanner> : null}

        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={toneFor(appointment.status)}>{labelFor(appointment.status)}</Badge>
          {appointment.department ? (
            <DepartmentChip department={appointment.department} />
          ) : null}
          {appointment.postponedFrom ? (
            <Badge tone="info">
              <CalendarClock className="h-3 w-3" />
              Moved from {formatDate(appointment.postponedFrom, "d MMM")}
            </Badge>
          ) : null}
        </div>

        <DetailGrid
          columns={2}
          items={[
            { label: "Student", value: appointment.studentName ?? "Not allocated" },
            { label: "Session", value: appointment.session ?? "—" },
            { label: "Reason for visit", value: appointment.chiefComplaint ?? "—" },
            { label: "Chair", value: appointment.chair ?? "—" },
          ]}
        />

        {/* ------------------------------------------------------- outcome */}
        <div>
          <span className="od-label">Outcome</span>
          <div className="mt-2 grid gap-2.5 sm:grid-cols-3">
            {OUTCOMES.map((item) => {
              const Icon = item.icon;
              const active = outcome === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setOutcome(item.value)}
                  className={cn(
                    "od-focus flex flex-col gap-1.5 rounded-xl border px-3.5 py-3 text-left transition",
                    active
                      ? item.active
                      : "border-slate-200 text-ink-muted hover:border-slate-300 hover:bg-slate-50"
                  )}
                >
                  <span className="flex items-center gap-2 text-[13.5px] font-bold">
                    <Icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </span>
                  <span className="text-[11.5px] font-medium opacity-80">{item.hint}</span>
                </button>
              );
            })}
          </div>
        </div>

        {outcome === "postponed" ? (
          <div className="grid gap-4 rounded-2xl border border-info/25 bg-info-soft/40 p-4 sm:grid-cols-3">
            <Field label="New date" required>
              <Input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </Field>
            <Field label="Session">
              <Select
                value={session}
                onChange={(event) => {
                  const next = event.target.value;
                  setSession(next);
                  setTime(sessionSlots(next)[0] ?? time);
                }}
              >
                {CLINIC_SESSIONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Time">
              <Select value={time} onChange={(event) => setTime(event.target.value)}>
                {sessionSlots(session).map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        ) : null}

        <Field
          label="Note"
          hint={outcome === "cancelled" ? "Why the visit is off" : "optional"}
        >
          <Textarea
            rows={2}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder={
              outcome === "cancelled"
                ? "Patient called to cancel — no rebooking wanted."
                : "Anything the next person at this chair should know…"
            }
          />
        </Field>

        {onOpenRecord && appointment.nationalId ? (
          <Button
            variant="secondary"
            className="self-start"
            leftIcon={<FolderOpen className="h-4 w-4" />}
            onClick={() => onOpenRecord(appointment)}
          >
            Open the patient record
          </Button>
        ) : null}
      </div>
    </Modal>
  );
}
