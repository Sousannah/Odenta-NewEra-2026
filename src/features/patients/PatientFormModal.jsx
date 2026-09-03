import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, Input, Radio, Textarea } from "@/components/ui/Field";

const EMPTY = {
  name: "",
  email: "",
  phone: "",
  age: "",
  gender: "Male",
  birthPlace: "",
  address: "",
  allergies: "",
  note: "",
};

export function PatientFormModal({ open, onClose, patient, onSaved }) {
  const [form, setForm] = useState(EMPTY);
  const toast = useToast();
  const editing = Boolean(patient);

  useEffect(() => {
    if (!open) return;
    setForm(
      patient
        ? { ...EMPTY, ...patient, allergies: (patient.allergies ?? []).join(", ") }
        : EMPTY
    );
  }, [open, patient]);

  const update = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Edit patient" : "Add patient"}
      description="Patient records feed reservations, billing and medical history."
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!form.name}
            className="min-w-[140px]"
            onClick={() => {
              onSaved?.(form);
              toast.success(editing ? "Patient updated" : "Patient added", form.name);
              onClose();
            }}
          >
            {editing ? "Save changes" : "Add patient"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <Field label="Patient name" required>
          <Input value={form.name} onChange={(e) => update({ name: e.target.value })} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Email address">
            <Input type="email" value={form.email} onChange={(e) => update({ email: e.target.value })} />
          </Field>
          <Field label="Phone number">
            <Input value={form.phone} onChange={(e) => update({ phone: e.target.value })} />
          </Field>
          <Field label="Age">
            <Input type="number" value={form.age} onChange={(e) => update({ age: e.target.value })} />
          </Field>
          <Field label="Gender">
            <div className="grid grid-cols-2 gap-3">
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

        <Field label="Place & date of birth">
          <Input
            placeholder="Sidoarjo, January 21 2002"
            value={form.birthPlace}
            onChange={(e) => update({ birthPlace: e.target.value })}
          />
        </Field>

        <Field label="Address" counter={`${(form.address ?? "").length} / 200`}>
          <Textarea
            rows={3}
            maxLength={200}
            value={form.address}
            onChange={(e) => update({ address: e.target.value })}
          />
        </Field>

        <Field label="Allergies" hint="comma separated">
          <Input value={form.allergies} onChange={(e) => update({ allergies: e.target.value })} />
        </Field>

        <Field label="Clinical note" counter={`${(form.note ?? "").length} / 200`}>
          <Textarea
            rows={2}
            maxLength={200}
            value={form.note}
            onChange={(e) => update({ note: e.target.value })}
          />
        </Field>
      </div>
    </Modal>
  );
}
