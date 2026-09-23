import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { CalendarDays, Clock3, Plus, Trash2 } from "lucide-react";
import { useAsync } from "@/hooks";
import { universityService } from "@/services";
import { formatDate } from "@/lib/format";
import { toDateKey } from "@/lib/time";
import { CLINIC_SESSIONS, DEPARTMENTS, departmentMeta } from "@/config/academic";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { ConfirmDialog, Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { InfoBanner, SearchInput } from "@/components/ui/Misc";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { PageHeader, toneFor, labelFor } from "@/components/shared";

/**
 * One patient's visits.
 *
 * Same booking as the calendar, narrowed to a patient already in hand — so the
 * patient is fixed and the form starts from what the record already knows.
 */

const slotsFor = (sessionValue) => {
  const session = CLINIC_SESSIONS.find((item) => item.value === sessionValue);
  if (!session) return [];
  const [startHour] = session.start.split(":").map(Number);
  const [endHour] = session.end.split(":").map(Number);
  const slots = [];
  for (let hour = startHour; hour < endHour; hour += 1) {
    slots.push(`${String(hour).padStart(2, "0")}:00`);
    slots.push(`${String(hour).padStart(2, "0")}:30`);
  }
  return slots;
};

export default function PatientAppointmentsPage() {
  const { record } = useOutletContext();
  const toast = useToast();

  const { data: appointments = [], loading, refetch } = useAsync(
    () => universityService.getCaseAppointments(record.id),
    [record.id],
    []
  );

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(null);
  const [form, setForm] = useState({
    date: "",
    session: CLINIC_SESSIONS[0].value,
    time: CLINIC_SESSIONS[0].start,
    department: record.department,
    chiefComplaint: record.chiefComplaint ?? "",
    note: "",
  });

  const visible = appointments.filter((item) => {
    if (!query.trim()) return true;
    const needle = query.trim().toLowerCase();
    return [item.chiefComplaint, item.note, departmentMeta(item.department).label]
      .filter(Boolean)
      .some((field) => String(field).toLowerCase().includes(needle));
  });

  const book = async (event) => {
    event.preventDefault();
    if (!form.date) return setError("Pick a date.");
    if (!form.time) return setError("Pick a time.");
    if (!form.chiefComplaint.trim()) return setError("A chief complaint is required.");

    setSaving(true);
    setError("");
    try {
      await universityService.bookCaseAppointment(record.id, {
        date: form.date,
        time: form.time,
        session: form.session,
        department: form.department,
        chiefComplaint: form.chiefComplaint,
        note: form.note || null,
      });
      refetch();
      setOpen(false);
      toast.success("Appointment booked", `${formatDate(form.date, "d MMM")} at ${form.time}`);
    } catch (cause) {
      setError(cause?.message ?? "Could not book the appointment.");
    } finally {
      setSaving(false);
    }
  };

  const cancel = async (appointment) => {
    try {
      await universityService.cancelCaseAppointment(record.id, appointment.id);
      refetch();
      toast.success("Appointment cancelled");
    } catch (cause) {
      toast.error("Could not cancel the appointment", cause?.message);
    }
  };

  const today = toDateKey();

  /** Both entry points open the same dialog, dated today by default. */
  const openBooking = () => {
    setError("");
    setForm((prev) => ({ ...prev, date: prev.date || today }));
    setOpen(true);
  };

  return (
    <div className="flex flex-col gap-4 p-4 sm:gap-5 sm:p-6">
      <PageHeader
        title="Appointments"
        description={`Every visit booked for ${record.patientName}.`}
        actions={
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openBooking}>
            New appointment
          </Button>
        }
      />

      <SearchInput
        value={query}
        onChange={setQuery}
        placeholder="Search appointments…"
        className="w-full sm:max-w-[380px]"
      />

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-20 w-full" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="h-6 w-6" />}
          title="No appointments found"
          description={query ? "Try a different search term." : "Book the next visit for this patient."}
          className="od-card py-16"
          action={
            <Button size="sm" onClick={openBooking}>
              Add appointment
            </Button>
          }
        />
      ) : (
        <Card>
          <CardBody className="p-0">
            <ul className="divide-y divide-slate-100">
              {visible.map((item) => {
                const past = item.date < today;
                return (
                  <li
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 transition hover:bg-brand-50/40"
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span
                        className={
                          past
                            ? "h-2.5 w-2.5 shrink-0 rounded-full bg-slate-300"
                            : "h-2.5 w-2.5 shrink-0 rounded-full bg-brand-600"
                        }
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-[13.5px] font-bold text-ink">
                          {departmentMeta(item.department).label}
                        </span>
                        <span className="block truncate text-[12px] text-ink-soft">
                          {item.chiefComplaint ?? item.note ?? "—"}
                        </span>
                      </span>
                    </span>

                    <span className="flex shrink-0 items-center gap-3">
                      <span className="text-right">
                        <span className="block whitespace-nowrap text-[13px] font-semibold text-ink">
                          {formatDate(item.date, "EEE, d MMM yyyy")}
                        </span>
                        <span className="flex items-center justify-end gap-1 text-[12px] text-ink-soft">
                          <Clock3 className="h-3 w-3" />
                          {item.time}
                        </span>
                      </span>
                      <Badge tone={toneFor(item.status)}>{labelFor(item.status)}</Badge>
                      {!past ? (
                        <Button
                          variant="danger-ghost"
                          size="xs"
                          leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                          onClick={() => setCancelling(item)}
                        >
                          Cancel
                        </Button>
                      ) : null}
                    </span>
                  </li>
                );
              })}
            </ul>
          </CardBody>
        </Card>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="New appointment"
        description={`${record.patientName} · ${record.nationalId}`}
        size="md"
      >
        <form onSubmit={book} className="flex flex-col gap-4">
          {error ? <InfoBanner tone="warning">{error}</InfoBanner> : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Date" required>
              <Input
                type="date"
                value={form.date}
                onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))}
              />
            </Field>
            <Field label="Session" required>
              <Select
                value={form.session}
                onChange={(event) => {
                  const session = event.target.value;
                  setForm((prev) => ({ ...prev, session, time: slotsFor(session)[0] ?? prev.time }));
                }}
              >
                {CLINIC_SESSIONS.map((session) => (
                  <option key={session.value} value={session.value}>
                    {session.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Field label="Time" required>
            <Select
              value={form.time}
              onChange={(event) => setForm((prev) => ({ ...prev, time: event.target.value }))}
            >
              {slotsFor(form.session).map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Rotation" required>
            <Select
              value={form.department}
              onChange={(event) => setForm((prev) => ({ ...prev, department: event.target.value }))}
            >
              {DEPARTMENTS.map((item) => (
                <option key={item.key} value={item.key}>
                  {item.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Chief complaint" required>
            <Textarea
              rows={3}
              value={form.chiefComplaint}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, chiefComplaint: event.target.value }))
              }
            />
          </Field>

          <Field label="Notes" hint="optional">
            <Textarea
              rows={3}
              value={form.note}
              onChange={(event) => setForm((prev) => ({ ...prev, note: event.target.value }))}
            />
          </Field>

          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Save
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(cancelling)}
        onClose={() => setCancelling(null)}
        onConfirm={() => cancel(cancelling)}
        title="Cancel this appointment?"
        description="The chair is released and the patient will need re-booking."
        confirmLabel="Cancel appointment"
      />
    </div>
  );
}
