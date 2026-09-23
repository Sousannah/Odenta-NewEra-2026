import { useEffect, useState } from "react";
import { Lock, Pencil, Save, Stethoscope, X } from "lucide-react";
import { universityService } from "@/services";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field, Textarea } from "@/components/ui/Field";
import { InfoBanner } from "@/components/ui/Misc";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { DetailGrid } from "@/university/components";

/**
 * The medical history panel.
 *
 * Rendered as its own tab and again as the first tab of every treatment sheet,
 * because the sheet is signed on the assumption the history was read. Identity
 * fields are shown but locked: a student may correct what the patient told
 * them, never who the patient is.
 */

const CHRONIC_DISEASES = [
  "Diabetes",
  "Hypertension",
  "Heart Disease",
  "Asthma",
  "Thyroid Disorder",
  "Kidney Disease",
  "Liver Disease",
  "Arthritis",
  "Cancer",
  "Other",
];

const toForm = (record) => ({
  chronicDiseases: record?.medicalInfo?.chronicDiseases ?? [],
  recentSurgicalProcedures: record?.medicalInfo?.recentSurgicalProcedures ?? "",
  currentMedications: record?.medicalInfo?.currentMedications ?? "",
  chiefComplaint: record?.medicalInfo?.chiefComplaint ?? record?.chiefComplaint ?? "",
});

export function MedicalPanel({ record, onSaved, compact = false }) {
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(() => toForm(record));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => setForm(toForm(record)), [record]);

  const toggleDisease = (disease) =>
    setForm((prev) => ({
      ...prev,
      chronicDiseases: prev.chronicDiseases.includes(disease)
        ? prev.chronicDiseases.filter((item) => item !== disease)
        : [...prev.chronicDiseases, disease],
    }));

  const save = async (event) => {
    event.preventDefault();
    if (!form.chiefComplaint.trim()) {
      setError("A chief complaint is required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const updated = await universityService.updatePatientRecord(record.nationalId, {
        chiefComplaint: form.chiefComplaint,
        medicalInfo: { ...form },
      });
      setEditing(false);
      onSaved?.(updated);
      toast.success("Medical information saved", record.patientName);
    } catch (cause) {
      setError(cause?.message ?? "Could not save the medical information.");
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <Card>
        <CardHeader
          title="Edit medical information"
          subtitle="Only the clinical history — identity fields stay locked."
          action={
            <Button variant="ghost" size="sm" leftIcon={<X className="h-4 w-4" />} onClick={() => setEditing(false)}>
              Cancel
            </Button>
          }
        />
        <CardBody className="pt-2">
          <form onSubmit={save} className="flex flex-col gap-4">
            {error ? <InfoBanner tone="warning">{error}</InfoBanner> : null}

            <Field label="Chronic diseases">
              <div className="grid gap-2 rounded-xl border border-slate-200 p-3 sm:grid-cols-2 lg:grid-cols-3">
                {CHRONIC_DISEASES.map((disease) => {
                  const checked = form.chronicDiseases.includes(disease);
                  return (
                    <button
                      key={disease}
                      type="button"
                      aria-pressed={checked}
                      onClick={() => toggleDisease(disease)}
                      className={
                        checked
                          ? "od-focus rounded-lg border border-brand-600 bg-brand-50/70 px-3 py-2 text-left text-[12.5px] font-semibold text-brand-800"
                          : "od-focus rounded-lg border border-slate-200 px-3 py-2 text-left text-[12.5px] text-ink-muted hover:border-slate-300 hover:bg-slate-50"
                      }
                    >
                      {disease}
                    </button>
                  );
                })}
              </div>
            </Field>

            <Field label="Recent surgical procedures">
              <Textarea
                rows={3}
                placeholder="List any recent surgical procedures"
                value={form.recentSurgicalProcedures}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, recentSurgicalProcedures: event.target.value }))
                }
              />
            </Field>

            <Field label="Current medications">
              <Textarea
                rows={3}
                placeholder="List any current medications"
                value={form.currentMedications}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, currentMedications: event.target.value }))
                }
              />
            </Field>

            <Field label="Chief complaint" required>
              <Textarea
                rows={3}
                placeholder="Describe the patient's main complaint or reason for visit"
                value={form.chiefComplaint}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, chiefComplaint: event.target.value }))
                }
              />
            </Field>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => setEditing(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={saving} leftIcon={<Save className="h-4 w-4" />}>
                Save medical info
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {!compact ? (
        <Card>
          <CardHeader
            title="Personal information"
            subtitle="Captured at screening"
            action={
              <Badge tone="neutral">
                <Lock className="h-3 w-3" />
                Read only
              </Badge>
            }
          />
          <CardBody className="pt-2">
            <DetailGrid
              columns={4}
              items={[
                { label: "Full name", value: record.patientName },
                { label: "National ID", value: record.nationalId },
                { label: "Phone number", value: record.phone },
                { label: "Gender", value: record.gender },
                { label: "Age", value: record.age },
                { label: "Address", value: record.address },
                { label: "Occupation", value: record.occupation },
                { label: "Card number", value: record.cardNumber ?? "Not issued" },
              ]}
            />
          </CardBody>
        </Card>
      ) : null}

      <Card>
        <CardHeader
          title="Medical history"
          subtitle="Read this before every appointment"
          action={
            <Button
              size="sm"
              variant="secondary"
              leftIcon={<Pencil className="h-4 w-4" />}
              onClick={() => setEditing(true)}
            >
              Edit medical info
            </Button>
          }
        />
        <CardBody className="pt-2">
          <DetailGrid
            columns={3}
            items={[
              {
                label: "Chronic diseases",
                value: form.chronicDiseases.length ? form.chronicDiseases.join(", ") : "None",
              },
              {
                label: "Recent surgical procedures",
                value: form.recentSurgicalProcedures || "None",
              },
              { label: "Current medications", value: form.currentMedications || "None" },
            ]}
          />

          {record.allergies?.length ? (
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
              <span className="od-label">Allergies</span>
              {record.allergies.map((allergy) => (
                <Badge key={allergy} tone="danger">
                  {allergy}
                </Badge>
              ))}
            </div>
          ) : null}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Chief complaint" subtitle="In the patient's own words" />
        <CardBody className="pt-2">
          <p className="flex items-start gap-3 rounded-xl bg-brand-50/60 px-4 py-3.5 text-[13.5px] leading-relaxed text-ink">
            <Stethoscope className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
            {form.chiefComplaint || "None recorded"}
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
