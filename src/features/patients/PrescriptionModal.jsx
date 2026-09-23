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
  /**
   * The prescriber's explicit decision to prescribe anyway.
   *
   * Sent to the server as `acknowledgeAllergy`, stored on the prescription and
   * named in the audit trail. It exists because a record can be wrong — an
   * allergy noted from a childhood rash, a patient since formally tested — and
   * a screen that simply refused would be worked around by deleting the allergy
   * from the record, which removes the warning for everybody, forever, to get
   * past it once.
   */
  const [acknowledged, setAcknowledged] = useState(false);
  /** Conflicts the *server* found, which is the authoritative set. */
  const [serverConflicts, setServerConflicts] = useState([]);
  const toast = useToast();

  useEffect(() => {
    if (!open) return;
    setItems([blankItem()]);
    setNotes("");
    setAcknowledged(false);
    setServerConflicts([]);
  }, [open]);

  /**
   * A first-pass warning, not the check.
   *
   * Substring matching only, so it catches "Amoxicillin" against a recorded
   * "Amoxicillin" allergy and misses the case that matters most — amoxicillin
   * against a recorded *penicillin* allergy, which is the same β-lactam family
   * and the commonest serious allergy in dentistry. The server knows the
   * cross-reactivity groups and is the thing that actually refuses; this only
   * warns earlier so the prescriber is not surprised at the end.
   *
   * Deliberately not reimplemented here. Two copies of a clinical safety rule
   * is two rules, and the one that drifts is the one nobody is watching.
   */
  const allergies = (patient?.allergies ?? []).map((value) => value.toLowerCase());
  const conflicts = items.filter((item) =>
    allergies.some((allergy) => item.drug.toLowerCase().includes(allergy))
  );

  const blocked = (conflicts.length > 0 || serverConflicts.length > 0) && !acknowledged;

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
      await clinicalService.createPrescription(patient.id, {
        items,
        notes,
        acknowledgeAllergy: acknowledged,
      });
      toast.success(
        acknowledged ? "Prescription issued over an allergy warning" : "Prescription issued",
        `${items.length} item(s) for ${patient.name}`
      );
      onSaved?.();
      onClose();
    } catch (cause) {
      /**
       * The server found a conflict this screen did not — almost always a
       * cross-reactive one. Surfaced rather than toasted away, with the
       * acknowledgement offered, so the prescriber makes the call with the
       * conflict in front of them instead of retrying blind.
       */
      if (cause?.code === "allergy_conflict") {
        setServerConflicts(cause.details?.conflicts ?? []);
        toast.error("This contradicts the recorded allergies", cause.message);
      } else {
        toast.error("Could not issue prescription", cause.message);
      }
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
            disabled={blocked}
            onClick={issue}
          >
            {acknowledged ? "Issue anyway" : "Issue prescription"}
          </Button>
        </>
      }
    >
      {allergies.length || serverConflicts.length ? (
        <InfoBanner
          tone={conflicts.length || serverConflicts.length ? "warning" : "neutral"}
          icon={<AlertTriangle className="h-4 w-4" />}
        >
          {serverConflicts.length ? (
            <span>
              {serverConflicts
                .map((hit) => `${hit.drug} conflicts with a recorded allergy to ${hit.allergy}`)
                .join("; ")}
              .
            </span>
          ) : conflicts.length ? (
            <span>
              {conflicts.map((item) => item.drug).join(", ")} conflicts with a recorded allergy.
            </span>
          ) : (
            <span>
              Recorded allergies: {patient.allergies.join(", ")}. Every line is checked against
              these, including drugs in the same family.
            </span>
          )}

          {conflicts.length || serverConflicts.length ? (
            <label className="mt-2.5 flex cursor-pointer items-start gap-2 text-[12.5px] font-semibold">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={acknowledged}
                onChange={(event) => setAcknowledged(event.target.checked)}
              />
              <span>
                I have reviewed this and am prescribing deliberately. This decision is recorded
                against the prescription and in the audit trail.
              </span>
            </label>
          ) : null}
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
