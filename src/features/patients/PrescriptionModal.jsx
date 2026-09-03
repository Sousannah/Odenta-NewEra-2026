import { useEffect, useState } from "react";
import { AlertTriangle, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { clinicalService } from "@/services";
import { PRESCRIPTION_FORMULARY } from "@/config/dentalStandards";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { InfoBanner } from "@/components/ui/Misc";

const blankItem = () => {
  const drug = PRESCRIPTION_FORMULARY[0];
  return {
    key: Math.random().toString(36).slice(2),
    drug: drug.name,
    strength: drug.strengths[0],
    sig: drug.defaultSig,
    days: drug.days,
    quantity: drug.days * 3,
  };
};

/**
 * Prescribing.
 *
 * The formulary drives sensible defaults for dose and duration, and the
 * patient's recorded allergies are checked against every line before the
 * script can be issued.
 */
export function PrescriptionModal({ open, onClose, patient, onSaved }) {
  const [items, setItems] = useState([blankItem()]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (!open) return;
    setItems([blankItem()]);
    setNotes("");
  }, [open]);

  const allergies = (patient?.allergies ?? []).map((value) => value.toLowerCase());
  const conflicts = items.filter((item) =>
    allergies.some((allergy) => item.drug.toLowerCase().includes(allergy))
  );

  const patch = (key, updates) =>
    setItems((prev) => prev.map((item) => (item.key === key ? { ...item, ...updates } : item)));

  const pickDrug = (key, name) => {
    const drug = PRESCRIPTION_FORMULARY.find((entry) => entry.name === name);
    if (!drug) return;
    patch(key, {
      drug: drug.name,
      strength: drug.strengths[0],
      sig: drug.defaultSig,
      days: drug.days,
      quantity: drug.days * 3,
    });
  };

  const issue = async () => {
    setSaving(true);
    try {
      await clinicalService.createPrescription(patient.id, { items, notes });
      toast.success("Prescription issued", `${items.length} item(s) for ${patient.name}`);
      onSaved?.();
      onClose();
    } catch (cause) {
      toast.error("Could not issue prescription", cause.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New prescription"
      description={patient ? `${patient.name} · ${patient.mrn}` : undefined}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="min-w-[150px]"
            loading={saving}
            disabled={conflicts.length > 0}
            onClick={issue}
          >
            Issue prescription
          </Button>
        </>
      }
    >
      {allergies.length ? (
        <InfoBanner
          tone={conflicts.length ? "warning" : "neutral"}
          icon={<AlertTriangle className="h-4 w-4" />}
        >
          {conflicts.length
            ? `${conflicts.map((item) => item.drug).join(", ")} conflicts with a recorded allergy — change it before issuing.`
            : `Recorded allergies: ${patient.allergies.join(", ")}. Every line is checked against these.`}
        </InfoBanner>
      ) : null}

      <div className="mt-5 flex flex-col gap-4">
        {items.map((item, index) => {
          const drug = PRESCRIPTION_FORMULARY.find((entry) => entry.name === item.drug);
          const clash = allergies.some((allergy) => item.drug.toLowerCase().includes(allergy));

          return (
            <div
              key={item.key}
              className={`rounded-2xl border px-4 py-4 ${clash ? "border-danger/40 bg-danger-soft" : "border-slate-200"}`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="od-label">Item {index + 1}</span>
                {items.length > 1 ? (
                  <button
                    type="button"
                    aria-label="Remove item"
                    onClick={() => setItems((prev) => prev.filter((entry) => entry.key !== item.key))}
                    className="rounded-lg p-1.5 text-ink-faint transition hover:bg-white hover:text-danger"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                ) : null}
              </div>

              <div className="mt-2.5 grid gap-4 sm:grid-cols-2">
                <Field label="Drug">
                  <Select value={item.drug} onChange={(event) => pickDrug(item.key, event.target.value)}>
                    {PRESCRIPTION_FORMULARY.map((entry) => (
                      <option key={entry.name} value={entry.name}>
                        {entry.name} ({entry.class})
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Strength">
                  <Select
                    value={item.strength}
                    onChange={(event) => patch(item.key, { strength: event.target.value })}
                  >
                    {(drug?.strengths ?? []).map((strength) => (
                      <option key={strength}>{strength}</option>
                    ))}
                  </Select>
                </Field>
              </div>

              <Field label="Directions (sig)" className="mt-4">
                <Input value={item.sig} onChange={(event) => patch(item.key, { sig: event.target.value })} />
              </Field>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="Duration (days)">
                  <Input
                    type="number"
                    min="1"
                    value={item.days}
                    onChange={(event) => patch(item.key, { days: Number(event.target.value) })}
                  />
                </Field>
                <Field label="Quantity to dispense">
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(event) => patch(item.key, { quantity: Number(event.target.value) })}
                  />
                </Field>
              </div>
            </div>
          );
        })}

        <Button
          variant="secondary"
          size="sm"
          className="w-fit text-brand-600"
          leftIcon={<Plus className="h-3.5 w-3.5" />}
          onClick={() => setItems((prev) => [...prev, blankItem()])}
        >
          Add item
        </Button>

        <Field label="Notes to patient" counter={`${notes.length} / 200`}>
          <Textarea
            rows={2}
            maxLength={200}
            placeholder="Complete the full course, take after food…"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </Field>
      </div>
    </Modal>
  );
}
