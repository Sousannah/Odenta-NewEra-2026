import { useState } from "react";
import { Camera, ClipboardPlus, Landmark, Stethoscope, Trash2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { useAsync } from "@/hooks";
import { useToast } from "@/components/ui/Toast";
import { clinicService } from "@/services";
import { PLAN_DECLINE_REASONS, TOOTH_DECLINE_REASONS } from "@/config/domain";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { DotSteps, Stepper } from "@/components/ui/Stepper";
import { Field, Input, Radio, Select, Textarea } from "@/components/ui/Field";
import { InfoBanner } from "@/components/ui/Misc";
import { ToothChart, ToothLegend, toothName } from "@/components/dental";

const STEPS = [
  { id: 1, label: "Medical data", icon: <ClipboardPlus className="h-5 w-5" /> },
  { id: 2, label: "Treament Plan", icon: <Camera className="h-5 w-5" /> },
  { id: 3, label: "Oral Check", icon: <Stethoscope className="h-5 w-5" /> },
  { id: 4, label: "Plan Agreement", icon: <Landmark className="h-5 w-5" /> },
];

const LEGEND = [
  { label: "Recent findings", color: "#FE3D75" },
  { label: "Has treatment", color: "#A5B8F7" },
];

/* -------------------------------------------------------- tooth popover */

function ToothPopover({ tooth, entry, conditions, actions, onChange, onDelete, onSave }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-pop">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13.5px] font-bold text-ink">{toothName(tooth)}</span>
        <span className="flex items-center gap-1.5 rounded-md bg-brand-50 px-2 py-1 text-[11px] font-bold text-brand-700">
          <svg viewBox="0 0 12 14" className="h-3 w-3 fill-current" aria-hidden="true">
            <path d="M6 0C7 0 7.5.5 9 .5c1.6 0 2.5 1.2 2.5 2.9 0 1.8-.7 2.8-1.1 4.4C10 9.3 9.8 13 8.4 13c-1.2 0-1.1-2.8-2.4-2.8S4.7 13 3.6 13C2.2 13 2 9.3 1.6 7.8 1.2 6.2.5 5.2.5 3.4.5 1.7 1.4.5 3 .5 4.5.5 5 0 6 0Z" />
          </svg>
          {tooth}
        </span>
      </div>

      <div className="mt-2.5 flex flex-col gap-2">
        <Select
          className="h-9 text-[13px]"
          value={entry?.condition ?? ""}
          onChange={(event) => onChange({ condition: event.target.value })}
        >
          <option value="">Select condition</option>
          {conditions.map((item) => (
            <option key={item.value} value={item.value}>
              {item.short} · {item.label}
            </option>
          ))}
        </Select>

        <Select
          className="h-9 text-[13px]"
          value={entry?.action ?? ""}
          onChange={(event) => onChange({ action: event.target.value })}
        >
          <option value="">Select action</option>
          {actions.map((item) => (
            <option key={item.value} value={item.value}>
              {item.short} · {item.label}
            </option>
          ))}
        </Select>

        <Textarea
          rows={2}
          className="text-[13px]"
          placeholder="Add a clinical note…"
          value={entry?.note ?? ""}
          onChange={(event) => onChange({ note: event.target.value })}
        />
      </div>

      <div className="mt-2.5 flex items-center gap-2">
        <button
          type="button"
          aria-label="Remove finding"
          onClick={onDelete}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-danger transition hover:bg-danger-soft"
        >
          <Trash2 className="h-4 w-4" />
        </button>
        <Button variant="secondary" size="sm" block onClick={onSave} className="text-brand-600">
          Save
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- step one */

function StepMedicalData({ patient, form, update }) {
  return (
    <div className="flex flex-col gap-5">
      <InfoBanner tone="info">
        Patient &amp; Medical data are based on previous check, you can update it according to
        latest data.
      </InfoBanner>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Patient Name">
          <Input defaultValue={patient?.fullName ?? patient?.name ?? ""} />
        </Field>
        <Field label="Date of birth / place">
          <Input defaultValue={patient?.birthPlace ?? ""} />
        </Field>
        <Field label="Blood pressure">
          <Input
            placeholder="120/80 mmHg"
            value={form.bloodPressure}
            onChange={(event) => update({ bloodPressure: event.target.value })}
          />
        </Field>
        <Field label="Weight">
          <Input
            placeholder="68 kg"
            value={form.weight}
            onChange={(event) => update({ weight: event.target.value })}
          />
        </Field>
      </div>

      <Field label="Allergies">
        <Input
          placeholder="Penicillin, latex…"
          value={form.allergies}
          onChange={(event) => update({ allergies: event.target.value })}
        />
      </Field>

      <Field label="Main complaint" counter={`${form.complaint.length} / 200`}>
        <Textarea
          maxLength={200}
          rows={3}
          placeholder="What brought the patient in today?"
          value={form.complaint}
          onChange={(event) => update({ complaint: event.target.value })}
        />
      </Field>

      <Field label="Medical history">
        <div className="grid gap-3 sm:grid-cols-2">
          {["Diabetes", "Hypertension", "Heart disease", "None of the above"].map((option) => (
            <Radio
              key={option}
              name="history"
              label={option}
              checked={form.history === option}
              onChange={() => update({ history: option })}
            />
          ))}
        </div>
      </Field>
    </div>
  );
}

/* ------------------------------------------------- step two / three chart */

function StepChart({
  title,
  subtitle,
  findings,
  setFindings,
  conditions,
  actions,
  baseMarks,
  substep,
}) {
  const marks = {
    ...baseMarks,
    ...Object.keys(findings).reduce((acc, tooth) => {
      acc[tooth] = "finding";
      return acc;
    }, {}),
  };

  const updateTooth = (tooth, patch) =>
    setFindings((prev) => ({
      ...prev,
      [tooth]: { condition: "", action: "", note: "", ...prev[tooth], ...patch },
    }));

  const removeTooth = (tooth) =>
    setFindings((prev) => {
      const next = { ...prev };
      delete next[tooth];
      return next;
    });

  return (
    <div className="flex flex-col gap-4">
      {substep ? <DotSteps total={2} current={substep} /> : null}

      <div className="text-center">
        <h4 className="text-[17px] font-extrabold text-ink">{title}</h4>
        <p className="mt-0.5 text-[13px] text-ink-muted">{subtitle}</p>
      </div>

      <div className="mx-auto w-full max-w-[440px]">
        <ToothChart
          marks={marks}
          onSelect={(tooth) => {
            if (!findings[tooth]) updateTooth(tooth, {});
          }}
          renderPopover={(tooth, close) => (
            <ToothPopover
              tooth={tooth}
              entry={findings[tooth]}
              conditions={conditions}
              actions={actions}
              onChange={(patch) => updateTooth(tooth, patch)}
              onDelete={() => {
                removeTooth(tooth);
                close();
              }}
              onSave={close}
            />
          )}
          legend={<ToothLegend items={LEGEND} />}
        />
      </div>
    </div>
  );
}

/* ----------------------------------------------------------- step four */

function StepAgreement({ findings, agreement, setAgreement, conditions }) {
  const teeth = Object.keys(findings);

  return (
    <div className="flex flex-col gap-6">
      <DotSteps total={2} current={1} />

      <div className="text-center">
        <h4 className="text-[17px] font-extrabold text-ink">Medical service</h4>
        <p className="mt-0.5 text-[13px] text-ink-muted">
          The results of the examination of all teeth
        </p>
      </div>

      <div>
        <div className="grid gap-3 sm:grid-cols-3">
          {PLAN_DECLINE_REASONS.map((reason) => (
            <Radio
              key={reason}
              name="plan-reason"
              label={reason}
              checked={agreement.planReason === reason}
              onChange={() => setAgreement((prev) => ({ ...prev, planReason: reason }))}
            />
          ))}
        </div>
        <Field label="Other" className="mt-3" counter={`${agreement.planNote.length} / 200`}>
          <Textarea
            rows={2}
            maxLength={200}
            placeholder="Type a message..."
            value={agreement.planNote}
            onChange={(event) =>
              setAgreement((prev) => ({ ...prev, planNote: event.target.value }))
            }
          />
        </Field>
      </div>

      {teeth.length === 0 ? (
        <InfoBanner tone="neutral">
          No findings recorded yet — go back to the treatment plan to select teeth.
        </InfoBanner>
      ) : (
        teeth.map((tooth) => {
          const decision = agreement.teeth[tooth] ?? {};
          const condition = conditions.find((item) => item.value === findings[tooth].condition);
          return (
            <div key={tooth} className="border-t border-slate-100 pt-5">
              <h5 className="text-[15px] font-bold text-ink">Tooth repair</h5>

              <div className="mt-2.5 flex flex-wrap items-center justify-between gap-3">
                <div className="border-l-2 border-brand-600 pl-2.5">
                  <div className="flex items-center gap-2 text-[13.5px] font-bold text-ink">
                    {toothName(tooth)}
                    <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px]">{tooth}</span>
                  </div>
                  <div className="mt-0.5 text-[12px] text-ink-muted">
                    Condition:{" "}
                    <span className="rounded bg-danger-soft px-1.5 py-0.5 text-[11px] font-bold text-danger">
                      {condition?.short ?? "—"}
                    </span>{" "}
                    {condition?.label ?? "Not set"}
                  </div>
                </div>

                <div className="flex overflow-hidden rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() =>
                      setAgreement((prev) => ({
                        ...prev,
                        teeth: { ...prev.teeth, [tooth]: { ...decision, approved: true } },
                      }))
                    }
                    className={cn(
                      "px-4 py-2 text-[13px] font-semibold transition",
                      decision.approved === true
                        ? "bg-success-soft text-success-strong"
                        : "bg-white text-ink-muted hover:bg-slate-50"
                    )}
                  >
                    ✓ Approve
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setAgreement((prev) => ({
                        ...prev,
                        teeth: { ...prev.teeth, [tooth]: { ...decision, approved: false } },
                      }))
                    }
                    className={cn(
                      "border-l border-slate-200 px-4 py-2 text-[13px] font-semibold transition",
                      decision.approved === false
                        ? "bg-danger-soft text-danger"
                        : "bg-white text-ink-muted hover:bg-slate-50"
                    )}
                  >
                    Not now
                  </button>
                </div>
              </div>

              {decision.approved === false ? (
                <div className="mt-3">
                  <span className="text-[13px] font-semibold text-ink">Reason</span>
                  <div className="mt-2 grid gap-3 sm:grid-cols-3">
                    {TOOTH_DECLINE_REASONS.map((reason) => (
                      <Radio
                        key={reason}
                        name={`reason-${tooth}`}
                        label={reason}
                        checked={decision.reason === reason}
                        onChange={() =>
                          setAgreement((prev) => ({
                            ...prev,
                            teeth: { ...prev.teeth, [tooth]: { ...decision, reason } },
                          }))
                        }
                      />
                    ))}
                  </div>
                  <Field label="Other" className="mt-3">
                    <Textarea rows={2} maxLength={200} placeholder="Type a message..." />
                  </Field>
                </div>
              ) : null}
            </div>
          );
        })
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ modal */

export function MedicalCheckupModal({ open, onClose, reservation, patient, record, onSaved }) {
  const [step, setStep] = useState(1);
  const [medical, setMedical] = useState({
    bloodPressure: "",
    weight: "",
    allergies: (patient?.allergies ?? []).join(", "),
    complaint: reservation?.note ?? "",
    history: "None of the above",
  });
  const [findings, setFindings] = useState({});
  const [cosmetic, setCosmetic] = useState({});
  const [agreement, setAgreement] = useState({ planReason: "", planNote: "", teeth: {} });
  const toast = useToast();

  const { data: conditions = [] } = useAsync(() => clinicService.getToothConditions(), []);
  const { data: actions = [] } = useAsync(() => clinicService.getToothActions(), []);

  const baseMarks = (record?.medical ?? []).reduce((acc, entry) => {
    acc[entry.tooth] = entry.state === "treated" ? "treated" : "pending";
    return acc;
  }, {});

  const save = () => {
    onSaved?.({ medical, findings, cosmetic, agreement });
    toast.success("Medical checkup saved successfully", "You can also edit medical checkups");
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Medical Checkup"
      size="xl"
      closeIcon="chevron"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="secondary"
            disabled={step === 1}
            onClick={() => setStep((value) => value - 1)}
          >
            Previous
          </Button>
          <Button
            className="min-w-[120px]"
            onClick={() => (step === 4 ? save() : setStep((value) => value + 1))}
          >
            {step === 4 ? "Save checkup" : "Next"}
          </Button>
        </>
      }
    >
      <Stepper steps={STEPS} current={step} className="mb-7" />

      {step === 1 ? (
        <StepMedicalData patient={patient} form={medical} update={(patch) => setMedical((p) => ({ ...p, ...patch }))} />
      ) : null}

      {step === 2 ? (
        <StepChart
          substep={1}
          title="Medical service"
          subtitle="Select a problem tooth"
          findings={findings}
          setFindings={setFindings}
          conditions={conditions}
          actions={actions}
          baseMarks={baseMarks}
        />
      ) : null}

      {step === 3 ? (
        <StepChart
          substep={2}
          title="Cosmetic service"
          subtitle="Select the teeth included in the oral check"
          findings={cosmetic}
          setFindings={setCosmetic}
          conditions={conditions}
          actions={actions}
          baseMarks={baseMarks}
        />
      ) : null}

      {step === 4 ? (
        <StepAgreement
          findings={findings}
          agreement={agreement}
          setAgreement={setAgreement}
          conditions={conditions}
        />
      ) : null}
    </Modal>
  );
}
