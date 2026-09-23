import { useMemo, useRef, useState } from "react";
import { Camera, ClipboardPlus, Landmark, Stethoscope } from "lucide-react";
import { cn } from "@/lib/cn";
import { useToast } from "@/components/ui/Toast";
import { formatDate } from "@/lib/format";
import { PLAN_DECLINE_REASONS, TOOTH_DECLINE_REASONS } from "@/config/domain";
import { ASA_CLASSES, conditionByValue } from "@/config/dentalStandards";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { DotSteps, Stepper } from "@/components/ui/Stepper";
import { Field, Input, Radio, Select, Textarea } from "@/components/ui/Field";
import { InfoBanner } from "@/components/ui/Misc";
import { Badge } from "@/components/ui/Badge";
import { formatSurfaces, toothFullName, toothName } from "@/components/dental";
import { ToothChart, toClinicEntries } from "@/odontogram";

const STEPS = [
  { id: 1, label: "Medical data", icon: <ClipboardPlus className="h-5 w-5" /> },
  { id: 2, label: "Treatment Plan", icon: <Camera className="h-5 w-5" /> },
  { id: 3, label: "Oral Check", icon: <Stethoscope className="h-5 w-5" /> },
  { id: 4, label: "Plan Agreement", icon: <Landmark className="h-5 w-5" /> },
];

/* ------------------------------------------------------------- step one */

function StepMedicalData({ patient, form, update }) {
  return (
    <div className="flex flex-col gap-5">
      <InfoBanner tone="info">
        Patient &amp; medical data are carried over from the previous check — update anything that
        has changed today.
      </InfoBanner>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Patient name">
          <Input readOnly value={patient?.fullName ?? patient?.name ?? ""} />
        </Field>
        <Field label="Date of birth">
          <Input readOnly value={patient ? formatDate(patient.dob, "d MMMM yyyy") : ""} />
        </Field>
        <Field label="ASA physical status">
          <Select value={form.asa} onChange={(event) => update({ asa: event.target.value })}>
            {ASA_CLASSES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label} — {item.detail}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Blood pressure" hint="mmHg">
          <Input
            placeholder="120/80"
            value={form.bloodPressure}
            onChange={(event) => update({ bloodPressure: event.target.value })}
          />
        </Field>
      </div>

      {patient?.alerts?.length || patient?.allergies?.length ? (
        <div>
          <span className="od-label">Carried-forward alerts</span>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {(patient.allergies ?? []).map((allergy) => (
              <Badge key={allergy} tone="danger">
                Allergy · {allergy}
              </Badge>
            ))}
            {(patient.alerts ?? []).map((alert) => (
              <Badge key={alert} tone="warning">
                {alert}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}

      <Field label="Chief complaint" counter={`${form.complaint.length} / 200`}>
        <Textarea
          maxLength={200}
          rows={3}
          placeholder="What brought the patient in today?"
          value={form.complaint}
          onChange={(event) => update({ complaint: event.target.value })}
        />
      </Field>

      <Field label="Anaesthetic used" hint="agent, concentration, volume">
        <Input
          placeholder="Articaine 4% with 1:100,000 adrenaline, 1.7 ml"
          value={form.anaesthetic}
          onChange={(event) => update({ anaesthetic: event.target.value })}
        />
      </Field>
    </div>
  );
}

/* ------------------------------------------------- step two / three chart */

/**
 * A charting step.
 *
 * The same tooth chart as the patient record, chairside: the clinician marks
 * what they find on the chart itself rather than through a popover of their
 * own, and the step keeps the chart's payload. What the agreement step needs —
 * one condition per tooth — is derived from that payload rather than collected
 * separately, so the two can never disagree.
 *
 * Each step seeds from the patient's existing chart, so a clinician marks
 * today's findings on top of what is already on the record instead of a blank
 * mouth.
 */
function StepChart({ title, subtitle, payload, setPayload, basePayload, substep }) {
  const chartRef = useRef(null);
  const entries = useMemo(() => (payload ? toClinicEntries(payload) : []), [payload]);

  return (
    <div className="flex flex-col gap-4">
      {substep ? <DotSteps total={2} current={substep} /> : null}

      <div className="text-center">
        <h4 className="text-[17px] font-extrabold text-ink">{title}</h4>
        <p className="mt-0.5 text-[13px] text-ink-muted">{subtitle}</p>
      </div>

      <ToothChart
        ref={chartRef}
        value={payload ?? basePayload}
        onChange={setPayload}
        enableNotes
        enableIcdas
        panelMaxHeight="46vh"
      />

      {entries.length ? (
        <ul className="flex flex-col gap-2">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="flex items-center gap-3 rounded-xl border border-slate-200 px-3.5 py-2.5"
            >
              <span className="flex h-7 min-w-[34px] items-center justify-center rounded-lg bg-slate-100 text-[12px] font-bold text-ink">
                {entry.tooth}
              </span>
              <span className="min-w-0 flex-1 text-[13px] text-ink">
                {conditionByValue(entry.condition)?.label ?? entry.condition}
                {entry.surfaces?.length ? ` · ${formatSurfaces(entry.surfaces)}` : ""}
              </span>
              <Badge tone={entry.status === "completed" ? "success" : "warning"}>
                {entry.status}
              </Badge>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}


/* ----------------------------------------------------------- step four */

function StepAgreement({ findings, agreement, setAgreement }) {
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
            onChange={(event) => setAgreement((prev) => ({ ...prev, planNote: event.target.value }))}
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
          const condition = conditionByValue(findings[tooth].condition);
          return (
            <div key={tooth} className="border-t border-slate-100 pt-5">
              <h5 className="text-[15px] font-bold text-ink">
                {condition?.label ?? "Finding"} · {toothName(tooth)}
              </h5>

              <div className="mt-2.5 flex flex-wrap items-center justify-between gap-3">
                <div className="border-l-2 border-brand-600 pl-2.5">
                  <div className="flex items-center gap-2 text-[13.5px] font-bold text-ink">
                    {toothFullName(tooth)}
                    <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px]">{tooth}</span>
                  </div>
                  <div className="mt-0.5 text-[12px] text-ink-muted">
                    Condition:{" "}
                    <span className="rounded bg-danger-soft px-1.5 py-0.5 text-[11px] font-bold text-danger">
                      {condition?.short ?? "—"}
                    </span>{" "}
                    {condition?.label ?? "Not set"}
                    {findings[tooth].surfaces?.length
                      ? ` · ${formatSurfaces(findings[tooth].surfaces)}`
                      : ""}
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

export function MedicalCheckupModal({
  open,
  onClose,
  appointment,
  patient,
  odontogram = null,
  onSaved,
}) {
  const [step, setStep] = useState(1);
  const [medical, setMedical] = useState({
    asa: patient?.asa ?? "I",
    bloodPressure: "",
    complaint: appointment?.note ?? "",
    anaesthetic: "",
  });
  /* Two charts, one per service. Both start from the patient's existing chart
     and are kept as the odontogram's own payloads. */
  const [medicalChart, setMedicalChart] = useState(null);
  const [cosmeticChart, setCosmeticChart] = useState(null);
  const [agreement, setAgreement] = useState({ planReason: "", planNote: "", teeth: {} });
  const toast = useToast();

  /* What the agreement step signs off on: one condition per tooth, derived
     from the medical chart rather than collected a second time. */
  const findings = useMemo(() => {
    if (!medicalChart) return {};
    return toClinicEntries(medicalChart).reduce((acc, entry) => {
      acc[entry.tooth] ??= entry;
      return acc;
    }, {});
  }, [medicalChart]);

  const save = () => {
    onSaved?.({
      medical,
      findings,
      odontogram: medicalChart,
      cosmeticOdontogram: cosmeticChart,
      agreement,
    });
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
          <Button variant="secondary" disabled={step === 1} onClick={() => setStep((v) => v - 1)}>
            Previous
          </Button>
          <Button className="min-w-[120px]" onClick={() => (step === 4 ? save() : setStep((v) => v + 1))}>
            {step === 4 ? "Save checkup" : "Next"}
          </Button>
        </>
      }
    >
      <Stepper steps={STEPS} current={step} className="mb-7" />

      {step === 1 ? (
        <StepMedicalData
          patient={patient}
          form={medical}
          update={(patch) => setMedical((prev) => ({ ...prev, ...patch }))}
        />
      ) : null}

      {/* One chart at a time: the charting engine is a singleton, so the two
          steps are mutually exclusive rather than mounted together and hidden. */}
      {step === 2 ? (
        <StepChart
          substep={1}
          title="Medical service"
          subtitle="Chart what you find — tooth, surface and root"
          payload={medicalChart}
          setPayload={setMedicalChart}
          basePayload={odontogram}
        />
      ) : null}

      {step === 3 ? (
        <StepChart
          substep={2}
          title="Cosmetic service"
          subtitle="Chart the teeth included in the cosmetic plan"
          payload={cosmeticChart}
          setPayload={setCosmeticChart}
          basePayload={odontogram}
        />
      ) : null}

      {step === 4 ? (
        <StepAgreement findings={findings} agreement={agreement} setAgreement={setAgreement} />
      ) : null}
    </Modal>
  );
}
