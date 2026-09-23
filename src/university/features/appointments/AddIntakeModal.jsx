import { useState } from "react";
import { toDateKey } from "@/lib/time";
import { CalendarPlus } from "lucide-react";
import { universityService } from "@/services";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { InfoBanner } from "@/components/ui/Misc";
import { useToast } from "@/components/ui/Toast";
import { CLINIC_SESSIONS } from "@/config/academic";

const TIMES = ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00"];

const EMPTY = {
  patientName: "",
  nationalId: "",
  phone: "",
  age: "",
  chiefComplaint: "",
  date: toDateKey(),
  time: TIMES[0],
};

/** Take a screening booking over the phone or at the desk. */
export function AddIntakeModal({ open, onClose, onCreated }) {
  const toast = useToast();
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const set = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const submit = async () => {
    if (!form.patientName.trim() || !form.phone.trim() || !form.nationalId.trim()) {
      setError("Name, national ID and phone number are required.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await universityService.createAppointment({
        ...form,
        age: form.age ? Number(form.age) : null,
        session: form.time < "12:00" ? "morning" : "afternoon",
        department: "screening",
        caseId: null,
        studentId: null,
        studentName: null,
        chair: null,
      });
      toast.success("Appointment booked", `${form.patientName} · ${form.date} ${form.time}`);
      onCreated?.();
      onClose?.();
      setForm(EMPTY);
    } catch (cause) {
      setError(cause?.message ?? "Could not book this appointment");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Book a screening visit"
      description="The patient is seen by the screening clinic first, then allocated to a student."
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
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" required className="sm:col-span-2">
          <Input value={form.patientName} onChange={set("patientName")} placeholder="Yara Hassan" />
        </Field>

        <Field label="National ID" required>
          <Input value={form.nationalId} onChange={set("nationalId")} placeholder="2xxxxxxxxxxxxx" />
        </Field>

        <Field label="Phone" required>
          <Input value={form.phone} onChange={set("phone")} placeholder="+20 1xx xxx xxxx" />
        </Field>

        <Field label="Age">
          <Input type="number" min={1} max={120} value={form.age} onChange={set("age")} />
        </Field>

        <Field label="Date" required>
          <Input type="date" value={form.date} onChange={set("date")} />
        </Field>

        <Field label="Time" required>
          <Select value={form.time} onChange={set("time")}>
            {TIMES.map((time) => (
              <option key={time} value={time}>
                {time} —{" "}
                {CLINIC_SESSIONS.find((session) =>
                  time < "12:00" ? session.value === "morning" : session.value === "afternoon"
                )?.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Chief complaint" className="sm:col-span-2">
          <Textarea
            rows={3}
            value={form.chiefComplaint}
            onChange={set("chiefComplaint")}
            placeholder="In the patient's own words…"
          />
        </Field>

        {error ? (
          <div className="sm:col-span-2">
            <InfoBanner tone="warning">{error}</InfoBanner>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
