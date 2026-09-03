import { useEffect, useState } from "react";
import { Building2, ClipboardList, Clock, Stethoscope } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatMoney, formatShortDate } from "@/lib/format";
import { useAsync } from "@/hooks";
import { useToast } from "@/components/ui/Toast";
import { clinicService, scheduleService } from "@/services";
import { ORAL_HYGIENE_QUESTIONS } from "@/config/domain";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Stepper } from "@/components/ui/Stepper";
import { AvatarCard } from "@/components/ui/Avatar";
import { Field, Input, Radio, Select, Textarea } from "@/components/ui/Field";
import { FileDrop, InfoBanner } from "@/components/ui/Misc";

const STEPS = [
  { id: 1, label: "Treatment & Dentist", icon: <Stethoscope className="h-5 w-5" /> },
  { id: 2, label: "Basic Information", icon: <ClipboardList className="h-5 w-5" /> },
  { id: 3, label: "Oral Hygiene habits", icon: <Building2 className="h-5 w-5" /> },
];

const EMPTY = {
  treatment: "",
  dentistId: "",
  startTime: "14:00",
  endTime: "15:00",
  note: "",
  files: [],
  name: "",
  age: "",
  gender: "Male",
  email: "",
  phone: "",
  address: "",
  habits: {},
};

/* ---------------------------------------------------------------- step 1 */

function StepTreatment({ form, update, treatments, dentists, date }) {
  const popular = treatments.filter((item) => item.popular).slice(0, 3);
  const dentist = dentists.find((item) => item.id === form.dentistId);

  return (
    <div className="flex flex-col gap-5">
      <Field label="Treatment">
        <Select
          value={form.treatment}
          onChange={(event) => update({ treatment: event.target.value })}
        >
          <option value="">Select Treatment</option>
          {treatments.map((item) => (
            <option key={item.id} value={item.name}>
              {item.name}
            </option>
          ))}
        </Select>
      </Field>

      <div>
        <span className="od-label">Popular treatments</span>
        <div className="mt-2 flex flex-col gap-2">
          {popular.map((item) => {
            const selected = form.treatment === item.name;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => update({ treatment: item.name })}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-xl border-l-[3px] px-3.5 py-3 text-left transition",
                  selected
                    ? "border-brand-600 bg-brand-100"
                    : "border-brand-400 bg-slate-50 hover:bg-brand-50"
                )}
              >
                <span className="truncate text-[14px] font-bold text-ink">{item.name}</span>
                <span className="flex shrink-0 items-center gap-4 text-[12px] text-ink-muted">
                  <span>± {item.duration} hour(s)</span>
                  <span>
                    Start from <b className="text-ink">{formatMoney(item.price)}</b>
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <Field label="Dentist">
        <Select
          value={form.dentistId}
          onChange={(event) => update({ dentistId: event.target.value })}
        >
          <option value="">Select Dentist</option>
          {dentists.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </Select>
      </Field>

      {dentist ? (
        <div className="rounded-xl border border-slate-200 px-3.5 py-3">
          <AvatarCard
            name={dentist.name}
            label={`Today's appointment: ${dentist.todayAppointments} patient(s)`}
          />
        </div>
      ) : null}

      <div>
        <span className="text-[13px] font-semibold text-ink">Date &amp; Time</span>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <span className="border-l-2 border-brand-600 pl-2.5 text-[14px] font-bold text-ink">
            {formatShortDate(date ?? new Date())}
          </span>
          <span className="relative">
            <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
            <input
              type="time"
              value={form.startTime}
              onChange={(event) => update({ startTime: event.target.value })}
              className="h-10 rounded-xl border border-slate-200 pl-9 pr-3 text-sm font-semibold text-ink focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-600/10"
            />
          </span>
          <span className="text-sm text-ink-soft">to</span>
          <span className="relative">
            <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
            <input
              type="time"
              value={form.endTime}
              onChange={(event) => update({ endTime: event.target.value })}
              className="h-10 rounded-xl border border-slate-200 pl-9 pr-3 text-sm font-semibold text-ink focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-600/10"
            />
          </span>
        </div>
      </div>

      <Field label="Quick Note" hint="Optional" counter={`${form.note.length} / 200`}>
        <Textarea
          maxLength={200}
          rows={3}
          placeholder="Type a message..."
          value={form.note}
          onChange={(event) => update({ note: event.target.value })}
        />
      </Field>

      <div>
        <span className="text-[13px] font-semibold text-ink">
          Attached Files <span className="font-medium text-ink-soft">(Optional)</span>
        </span>
        <div className="mt-2">
          <FileDrop
            files={form.files}
            onAdd={(files) => update({ files: [...form.files, ...files].slice(0, 5) })}
            onRemove={(id) => update({ files: form.files.filter((file) => file.id !== id) })}
          />
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- step 2 */

function StepBasicInfo({ form, update }) {
  return (
    <div className="flex flex-col gap-5">
      <Field label="Patient Name" required>
        <Input
          placeholder="Full name"
          value={form.name}
          onChange={(event) => update({ name: event.target.value })}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Age">
          <Input
            type="number"
            min="0"
            placeholder="24"
            value={form.age}
            onChange={(event) => update({ age: event.target.value })}
          />
        </Field>
        <Field label="Gender">
          <div className="grid grid-cols-2 gap-3">
            {["Male", "Female"].map((option) => (
              <Radio
                key={option}
                name="gender"
                label={option}
                checked={form.gender === option}
                onChange={() => update({ gender: option })}
              />
            ))}
          </div>
        </Field>
      </div>

      <Field label="Email Address">
        <Input
          type="email"
          placeholder="patient@mail.com"
          value={form.email}
          onChange={(event) => update({ email: event.target.value })}
        />
      </Field>

      <Field label="Phone Number">
        <Input
          placeholder="+62 8951462718"
          value={form.phone}
          onChange={(event) => update({ phone: event.target.value })}
        />
      </Field>

      <Field label="Address" counter={`${form.address.length} / 200`}>
        <Textarea
          maxLength={200}
          rows={3}
          placeholder="Street, city, postal code"
          value={form.address}
          onChange={(event) => update({ address: event.target.value })}
        />
      </Field>
    </div>
  );
}

/* ---------------------------------------------------------------- step 3 */

function StepHabits({ form, update }) {
  return (
    <div className="flex flex-col gap-6">
      <InfoBanner tone="info">Oral Hygiene Habits it&apos;s optional, you can do it later</InfoBanner>

      {ORAL_HYGIENE_QUESTIONS.map((item, index) => (
        <div key={item.id}>
          <h4 className="text-[14px] font-bold text-ink">
            {index + 1}. {item.question}
          </h4>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {item.options.map((option) => (
              <Radio
                key={option}
                name={item.id}
                label={option}
                checked={form.habits[item.id] === option}
                onChange={() => update({ habits: { ...form.habits, [item.id]: option } })}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ modal */

export function AddToWaitlistModal({ open, onClose, preset, date, onCreated }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(EMPTY);
  const toast = useToast();

  const { data: treatments = [] } = useAsync(() => clinicService.getTreatments(), [open]);
  const { data: dentists = [] } = useAsync(() => clinicService.getDentists(), [open]);

  const update = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  useEffect(() => {
    if (open) {
      setStep(1);
      setForm({
        ...EMPTY,
        dentistId: preset.dentist?.id ?? "",
        startTime: preset.hour != null ? `${String(preset.hour).padStart(2, "0")}:00` : "14:00",
        endTime: preset.hour != null ? `${String(preset.hour + 1).padStart(2, "0")}:00` : "15:00",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, preset?.dentist?.id, preset?.hour]);

  const canContinue =
    step === 1 ? Boolean(form.treatment && form.dentistId) : step === 2 ? Boolean(form.name) : true;

  const [saving, setSaving] = useState(false);

  const finish = async () => {
    setSaving(true);
    try {
      await scheduleService.createAppointment({
        date: (date ?? new Date()).toISOString().slice(0, 10),
        dentistId: form.dentistId,
        treatment: form.treatment,
        start: form.startTime,
        end: form.endTime,
        note: form.note,
        patientId: form.patientId ?? null,
        patientName: form.name || "New patient",
      });
      onCreated?.(form);
      toast.success("Patient added to waitlist", `${form.name || "Patient"} · ${form.treatment}`);
      onClose();
    } catch (cause) {
      toast.error("Could not add to waitlist", cause.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add patient to waitlist"
      size="lg"
      closeIcon="x"
      footer={
        <>
          <Button variant="ghost" onClick={step === 1 ? onClose : () => setStep((s) => s - 1)}>
            {step === 1 ? "Cancel" : "Previous"}
          </Button>
          <Button
            disabled={!canContinue}
            loading={saving}
            onClick={() => (step === 3 ? finish() : setStep((s) => s + 1))}
            className="min-w-[120px]"
          >
            {step === 3 ? "Add to waitlist" : "Next"}
          </Button>
        </>
      }
    >
      <Stepper steps={STEPS} current={step} className="mb-7" />

      {step === 1 ? (
        <StepTreatment form={form} update={update} treatments={treatments} dentists={dentists} date={date} />
      ) : null}
      {step === 2 ? <StepBasicInfo form={form} update={update} /> : null}
      {step === 3 ? <StepHabits form={form} update={update} /> : null}
    </Modal>
  );
}
