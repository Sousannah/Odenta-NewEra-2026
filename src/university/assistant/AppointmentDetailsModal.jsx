import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  Globe,
  LogIn,
  Phone,
  Stethoscope,
  UserPlus,
  XCircle,
} from "lucide-react";
import { universityService } from "@/services";
import { formatDate } from "@/lib/format";
import { uni } from "@/config/paths";
import { CLINIC_SESSIONS, sessionForTime, sessionSlots } from "@/config/academic";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Field, Input, Select } from "@/components/ui/Field";
import { InfoBanner } from "@/components/ui/Misc";
import { toneFor, labelFor } from "@/components/shared";
import { DepartmentChip, DetailGrid } from "@/university/components";

/**
 * One visit, opened from the desk.
 *
 * The desk's job on a visit is a short list — check them in, put a student on
 * it, mark it finished, cancel it — so the actions are the footer rather than
 * something to hunt for, and the panel above them is only what you need to
 * decide which one to press.
 */

/** Where a visit can go from where it is. Finishing, postponing and cancelling
    are always available until the visit is over; the rest is a straight line. */
const NEXT = {
  registered: { status: "arrived", label: "Check in", icon: LogIn },
  arrived: { status: "encounter", label: "Send to chair", icon: Stethoscope },
  postponed: { status: "registered", label: "Reopen", icon: LogIn },
};

export function AppointmentDetailsModal({
  appointment,
  open,
  onClose,
  onChanged,
  onAssignStudent,
}) {
  const navigate = useNavigate();

  /**
   * Moving a visit is a booking, not a status flip — a postponed visit that
   * keeps yesterday's date is a row nobody will ever look at again. So the
   * button opens the new slot's fields inline rather than writing the status
   * straight away.
   */
  const [moving, setMoving] = useState(false);
  const [date, setDate] = useState("");
  const [session, setSession] = useState(CLINIC_SESSIONS[0].value);
  const [time, setTime] = useState(CLINIC_SESSIONS[0].start);

  useEffect(() => {
    if (!open || !appointment) return;
    setMoving(false);
    setDate(appointment.date ?? "");
    const next = sessionForTime(appointment.time ?? "09:00");
    setSession(next.value);
    setTime(appointment.time ?? next.start);
  }, [open, appointment?.id]);

  if (!appointment) return null;

  const advance = NEXT[appointment.status];
  const closed = ["finished", "cancelled", "no_show"].includes(appointment.status);

  const patch = async (payload) => {
    await universityService.updateAppointment(appointment.id, payload);
    onChanged?.(payload.status);
    onClose?.();
  };

  const move = (status) => patch({ status });

  const postpone = () =>
    patch({
      status: "postponed",
      date,
      time,
      session,
      postponedFrom: appointment.date,
    });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={appointment.patientName}
      description={`${formatDate(appointment.date, "EEE, d MMM yyyy")} at ${appointment.time} · ${appointment.reference}`}
      size="lg"
      footer={
        moving ? (
          <>
            <Button variant="secondary" onClick={() => setMoving(false)}>
              Back
            </Button>
            <Button
              disabled={!date}
              leftIcon={<CalendarClock className="h-4 w-4" />}
              onClick={postpone}
            >
              Move the visit
            </Button>
          </>
        ) : (
          <>
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
            {!closed ? (
              <>
                <Button
                  variant="danger-ghost"
                  leftIcon={<XCircle className="h-4 w-4" />}
                  onClick={() => move("cancelled")}
                >
                  Cancel visit
                </Button>
                <Button
                  variant="secondary"
                  leftIcon={<CalendarClock className="h-4 w-4" />}
                  onClick={() => setMoving(true)}
                >
                  Postpone
                </Button>
                <Button
                  variant="secondary"
                  leftIcon={<CheckCircle2 className="h-4 w-4" />}
                  onClick={() => move("finished")}
                >
                  Mark finished
                </Button>
              </>
            ) : null}
            {advance ? (
              <Button leftIcon={<advance.icon className="h-4 w-4" />} onClick={() => move(advance.status)}>
                {advance.label}
              </Button>
            ) : null}
          </>
        )
      }
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={toneFor(appointment.status)}>{labelFor(appointment.status)}</Badge>
          <DepartmentChip department={appointment.department} />
          {appointment.postponedFrom ? (
            <Badge tone="info">
              <CalendarClock className="h-3 w-3" />
              Moved from {formatDate(appointment.postponedFrom, "d MMM")}
            </Badge>
          ) : null}
          {appointment.channel === "public_booking" ? (
            <Badge tone="info">
              <Globe className="h-3 w-3" />
              Booked online
            </Badge>
          ) : (
            <Badge tone="neutral">
              <Phone className="h-3 w-3" />
              Booked at the desk
            </Badge>
          )}
        </div>

        {appointment.channel === "public_booking" && appointment.status === "registered" ? (
          <InfoBanner tone="warning">
            Nobody has spoken to this patient — the booking came straight off the website. Confirm
            the reason for the visit when they arrive.
          </InfoBanner>
        ) : null}

        {moving ? (
          <div className="grid gap-4 rounded-2xl border border-info/25 bg-info-soft/40 p-4 sm:grid-cols-3">
            <Field label="New date" required>
              <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
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

        <DetailGrid
          columns={2}
          items={[
            { label: "National ID", value: appointment.nationalId },
            { label: "Phone", value: appointment.phone },
            { label: "Age", value: appointment.age },
            { label: "Session", value: `${appointment.session} · chair ${appointment.chair ?? "—"}` },
            { label: "Reason for visit", value: appointment.chiefComplaint },
            {
              label: "Booked",
              value: appointment.createdAt ? formatDate(appointment.createdAt, "d MMM yyyy") : "—",
            },
          ]}
        />

        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3.5">
          <span className="od-label">Student</span>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <span className="text-[13.5px] font-bold text-ink">
              {appointment.studentName ?? "Nobody allocated yet"}
            </span>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<UserPlus className="h-4 w-4" />}
              onClick={() => onAssignStudent?.(appointment)}
            >
              {appointment.studentName ? "Reassign" : "Assign a student"}
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {appointment.caseId ? (
            <Button
              variant="secondary"
              leftIcon={<ExternalLink className="h-4 w-4" />}
              onClick={() => navigate(uni.case(appointment.caseId))}
            >
              Open the case
            </Button>
          ) : null}
          {appointment.nationalId ? (
            <Button
              variant="secondary"
              leftIcon={<CalendarDays className="h-4 w-4" />}
              onClick={() => navigate(uni.dossier(appointment.nationalId))}
            >
              Patient dossier
            </Button>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}
