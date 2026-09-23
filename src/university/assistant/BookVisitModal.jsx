import { useEffect, useState } from "react";
import { CalendarPlus } from "lucide-react";
import { universityService } from "@/services";
import { formatDate } from "@/lib/format";
import { toDateKey } from "@/lib/time";
import { statusForVisitDate } from "@/config/domain";
import { CLINIC_SESSIONS, DEPARTMENTS, sessionSlots } from "@/config/academic";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { InfoBanner } from "@/components/ui/Misc";

/**
 * Book a visit for somebody already on file.
 *
 * Small on purpose. The desk reached this from a patient's record, so
 * everything the intake form asks for — name, national ID, phone, age — is
 * already known; asking again is how you end up with two records for one
 * person. What is left is when, in which rotation, and what for.
 *
 * It writes straight to the appointment list rather than sending the desk to
 * the intake screen to type it a second time.
 */
export function BookVisitModal({ patient, open, onClose, onBooked }) {
  const [date, setDate] = useState(toDateKey());
  const [session, setSession] = useState(CLINIC_SESSIONS[0].value);
  const [time, setTime] = useState(CLINIC_SESSIONS[0].start);
  const [department, setDepartment] = useState(DEPARTMENTS[0].key);
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open || !patient) return;
    setDate(toDateKey());
    setSession(CLINIC_SESSIONS[0].value);
    setTime(CLINIC_SESSIONS[0].start);
    setDepartment(patient.department ?? DEPARTMENTS[0].key);
    setChiefComplaint(patient.chiefComplaint ?? "");
    setNote("");
    setError(null);
    setBusy(false);
  }, [open, patient?.id]);

  if (!patient) return null;

  const today = toDateKey();
  const status = statusForVisitDate(date, today);

  const submit = async () => {
    if (!date) {
      setError("Pick a date for the visit.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await universityService.createAppointment({
        patientName: patient.patientName,
        nationalId: patient.nationalId,
        phone: patient.phone ?? null,
        age: patient.age ?? null,
        caseId: patient.id,
        studentId: patient.studentId ?? null,
        studentName: patient.studentName ?? null,
        date,
        time,
        session,
        department,
        chiefComplaint: chiefComplaint.trim() || null,
        note: note.trim() || null,
        chair: null,
        status,
      });
      onBooked?.({ date, time, status });
      onClose?.();
    } catch (cause) {
      setError(cause?.message ?? "Could not book this visit.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Book a visit"
      description={`${patient.patientName} · ${patient.nationalId}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} loading={busy} leftIcon={<CalendarPlus className="h-4 w-4" />}>
            Book visit
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {error ? <InfoBanner tone="warning">{error}</InfoBanner> : null}

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Date" required>
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

        <Field label="Rotation">
          <Select value={department} onChange={(event) => setDepartment(event.target.value)}>
            {DEPARTMENTS.map((item) => (
              <option key={item.key} value={item.key}>
                {item.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Reason for visit">
          <Textarea
            rows={2}
            value={chiefComplaint}
            onChange={(event) => setChiefComplaint(event.target.value)}
            placeholder="In the patient's own words…"
          />
        </Field>

        <Field label="Note" hint="optional">
          <Textarea
            rows={2}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Anything the chair needs to know…"
          />
        </Field>

        {status === "finished" ? (
          <InfoBanner tone="neutral">
            {formatDate(date, "d MMM yyyy")} is in the past, so this is recorded as a visit that
            already happened rather than one the clinic is expecting.
          </InfoBanner>
        ) : null}

        {patient.studentName ? (
          <InfoBanner tone="neutral">
            Booked to <strong>{patient.studentName}</strong>, who already has this case.
          </InfoBanner>
        ) : null}
      </div>
    </Modal>
  );
}
