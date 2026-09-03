import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { useToast } from "@/components/ui/Toast";
import { patientService } from "@/services";
import { ASA_CLASSES, CARIES_RISK, MEDICAL_ALERTS, RECALL_INTERVALS } from "@/config/dentalStandards";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, Input, Radio, Select, Textarea } from "@/components/ui/Field";

const EMPTY = {
  name: "",
  fullName: "",
  email: "",
  phone: "",
  dob: "",
  birthPlace: "",
  gender: "Male",
  address: "",
  asa: "I",
  alerts: [],
  allergies: "",
  medications: "",
  cariesRisk: "moderate",
  recallMonths: 6,
  insurer: "Self pay",
  policyNo: "",
  note: "",
};

export function PatientFormModal({ open, onClose, patient, onSaved }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const editing = Boolean(patient);

  useEffect(() => {
    if (!open) return;
    setForm(
      patient
        ? {
            ...EMPTY,
            ...patient,
            allergies: (patient.allergies ?? []).join(", "),
            medications: (patient.medications ?? []).join(", "),
            policyNo: patient.policyNo ?? "",
          }
        : EMPTY
    );
  }, [open, patient]);

  const update = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const toggleAlert = (value) =>
    update({
      alerts: form.alerts.includes(value)
        ? form.alerts.filter((item) => item !== value)
        : [...form.alerts, value],
    });

  const save = async () => {
    setSaving(true);
    const payload = {
      ...form,
      allergies: form.allergies
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
      medications: form.medications
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
    };

    try {
      if (editing) await patientService.updatePatient(patient.id, payload);
      else await patientService.createPatient(payload);
      toast.success(editing ? "Patient updated" : "Patient added", form.name);
      onSaved?.();
      onClose();
    } catch (cause) {
      toast.error("Could not save patient", cause.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Edit patient" : "Add patient"}
      description="Demographics, medical flags and recall interval feed the whole record."
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!form.name} loading={saving} className="min-w-[140px]" onClick={save}>
            {editing ? "Save changes" : "Add patient"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-6">
        <section>
          <span className="od-label">Identity</span>
          <div className="mt-3 flex flex-col gap-4">
            <Field label="Preferred name" required>
              <Input value={form.name} onChange={(e) => update({ name: e.target.value })} />
            </Field>
            <Field label="Full legal name">
              <Input value={form.fullName} onChange={(e) => update({ fullName: e.target.value })} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Date of birth">
                <Input type="date" value={form.dob} onChange={(e) => update({ dob: e.target.value })} />
              </Field>
              <Field label="Place of birth">
                <Input
                  placeholder="Sidoarjo"
                  value={form.birthPlace}
                  onChange={(e) => update({ birthPlace: e.target.value })}
                />
              </Field>
            </div>
            <Field label="Gender">
              <div className="grid grid-cols-2 gap-3 sm:max-w-[320px]">
                {["Male", "Female"].map((option) => (
                  <Radio
                    key={option}
                    name="patient-gender"
                    label={option}
                    checked={form.gender === option}
                    onChange={() => update({ gender: option })}
                  />
                ))}
              </div>
            </Field>
          </div>
        </section>

        <section className="border-t border-slate-100 pt-5">
          <span className="od-label">Contact</span>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <Field label="Email address">
              <Input type="email" value={form.email} onChange={(e) => update({ email: e.target.value })} />
            </Field>
            <Field label="Phone number">
              <Input value={form.phone} onChange={(e) => update({ phone: e.target.value })} />
            </Field>
          </div>
          <Field label="Address" className="mt-4" counter={`${(form.address ?? "").length} / 200`}>
            <Textarea
              rows={2}
              maxLength={200}
              value={form.address}
              onChange={(e) => update({ address: e.target.value })}
            />
          </Field>
        </section>

        <section className="border-t border-slate-100 pt-5">
          <span className="od-label">Medical</span>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <Field label="ASA physical status">
              <Select value={form.asa} onChange={(e) => update({ asa: e.target.value })}>
                {ASA_CLASSES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label} — {item.detail}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Caries risk">
              <Select value={form.cariesRisk} onChange={(e) => update({ cariesRisk: e.target.value })}>
                {CARIES_RISK.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Field label="Allergies" hint="comma separated" className="mt-4">
            <Input
              placeholder="Penicillin, latex"
              value={form.allergies}
              onChange={(e) => update({ allergies: e.target.value })}
            />
          </Field>

          <Field label="Current medications" hint="comma separated" className="mt-4">
            <Input
              placeholder="Warfarin 3 mg OD"
              value={form.medications}
              onChange={(e) => update({ medications: e.target.value })}
            />
          </Field>

          <div className="mt-4">
            <span className="text-[13px] font-semibold text-ink">Medical alerts</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {MEDICAL_ALERTS.map((alert) => {
                const on = form.alerts.includes(alert.value);
                return (
                  <button
                    key={alert.value}
                    type="button"
                    onClick={() => toggleAlert(alert.value)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-[12px] font-semibold transition",
                      on
                        ? "border-danger bg-danger-soft text-danger"
                        : "border-slate-200 bg-white text-ink-muted hover:border-slate-300"
                    )}
                  >
                    {alert.label}
                  </button>
                );
              })}
            </div>
          </div>

          <Field label="Clinical note" className="mt-4" counter={`${(form.note ?? "").length} / 200`}>
            <Textarea
              rows={2}
              maxLength={200}
              value={form.note}
              onChange={(e) => update({ note: e.target.value })}
            />
          </Field>
        </section>

        <section className="border-t border-slate-100 pt-5">
          <span className="od-label">Recall & insurance</span>
          <div className="mt-3 grid gap-4 sm:grid-cols-3">
            <Field label="Recall interval">
              <Select
                value={form.recallMonths}
                onChange={(e) => update({ recallMonths: Number(e.target.value) })}
              >
                {RECALL_INTERVALS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Insurer">
              <Input value={form.insurer} onChange={(e) => update({ insurer: e.target.value })} />
            </Field>
            <Field label="Policy number">
              <Input value={form.policyNo} onChange={(e) => update({ policyNo: e.target.value })} />
            </Field>
          </div>
        </section>
      </div>
    </Modal>
  );
}
