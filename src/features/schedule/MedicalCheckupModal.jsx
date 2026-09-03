import { useMemo, useState } from "react";
import { Camera, ClipboardPlus, Landmark, Stethoscope, Trash2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { useToast } from "@/components/ui/Toast";
import { formatDate } from "@/lib/format";
import { PLAN_DECLINE_REASONS, TOOTH_DECLINE_REASONS } from "@/config/domain";
import {
  ASA_CLASSES,
  ICDAS_CODES,
  PROCEDURE_CODES,
  TOOTH_CONDITIONS,
  conditionByValue,
} from "@/config/dentalStandards";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { DotSteps, Stepper } from "@/components/ui/Stepper";
import { Field, Input, Radio, Select, Textarea } from "@/components/ui/Field";
import { InfoBanner } from "@/components/ui/Misc";
import { Badge } from "@/components/ui/Badge";
import {
  DEFAULT_LEGEND,
  Odontogram,
  OdontogramLegend,
  formatSurfaces,
  surfaceLabel,
  surfacesFor,
  toothFullName,
  toothName,
} from "@/components/dental";
import { chartToFindings } from "./DetailPanels";

const STEPS = [
  { id: 1, label: "Medical data", icon: <ClipboardPlus className="h-5 w-5" /> },
  { id: 2, label: "Treatment Plan", icon: <Camera className="h-5 w-5" /> },
  { id: 3, label: "Oral Check", icon: <Stethoscope className="h-5 w-5" /> },
  { id: 4, label: "Plan Agreement", icon: <Landmark className="h-5 w-5" /> },
];

/* -------------------------------------------------------- tooth popover */

function ToothPopover({ tooth, entry, onChange, onDelete, onSave }) {
  const surfaces = surfacesFor(tooth);
  const condition = conditionByValue(entry?.condition);
  const selected = entry?.surfaces ?? [];

  const toggleSurface = (code) =>
    onChange({
      surfaces: selected.includes(code)
        ? selected.filter((item) => item !== code)
        : [...selected, code],
    });

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-pop">
      <div className="flex items-center justify-between gap-2">
        <span className="min-w-0">
          <span className="block truncate text-[13.5px] font-bold text-ink">{toothName(tooth)}</span>
          <span className="block truncate text-[10.5px] text-ink-soft">{toothFullName(tooth)}</span>
        </span>
        <span className="flex shrink-0 items-center gap-1.5 rounded-md bg-brand-50 px-2 py-1 text-[11px] font-bold text-brand-700">
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
          {TOOTH_CONDITIONS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.short} · {item.label}
            </option>
          ))}
        </Select>

        {condition?.surface ? (
          <div>
            <span className="od-label">Surfaces</span>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {surfaces.map((code) => (
                <button
                  key={code}
                  type="button"
                  title={surfaceLabel(code)}
                  onClick={() => toggleSurface(code)}
                  className={cn(
                    "h-7 w-8 rounded-lg border text-[11px] font-bold transition",
                    selected.includes(code)
                      ? "border-brand-600 bg-brand-600 text-white"
                      : "border-slate-200 bg-white text-ink-muted hover:border-brand-300"
                  )}
                >
                  {code}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {entry?.condition === "caries" ? (
          <Select
            className="h-9 text-[13px]"
            value={entry?.icdas ?? ""}
            onChange={(event) => onChange({ icdas: event.target.value })}
          >
            <option value="">ICDAS severity</option>
            {ICDAS_CODES.map((item) => (
              <option key={item.code} value={item.code}>
                {item.code} · {item.label}
              </option>
            ))}
          </Select>
        ) : null}

        <Select
          className="h-9 text-[13px]"
          value={entry?.code ?? ""}
          onChange={(event) => onChange({ code: event.target.value })}
        >
          <option value="">Planned procedure</option>
          {PROCEDURE_CODES.map((item) => (
            <option key={item.code} value={item.code}>
              {item.code} · {item.label}
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

function StepChart({ title, subtitle, findings, setFindings, baseFindings, substep }) {
  const merged = useMemo(() => {
    const result = { ...baseFindings };
    Object.entries(findings).forEach(([tooth, entry]) => {
      const surfaces = {};
      (entry.surfaces ?? []).forEach((surface) => {
        surfaces[surface] = "danger";
      });
      result[tooth] = { tone: "danger", surfaces };
    });
    return result;
  }, [baseFindings, findings]);

  const updateTooth = (tooth, patch) =>
    setFindings((prev) => ({
      ...prev,
      [tooth]: { condition: "", surfaces: [], code: "", note: "", ...prev[tooth], ...patch },
    }));

  const removeTooth = (tooth) =>
    setFindings((prev) => {
      const next = { ...prev };
      delete next[tooth];
      return next;
    });

  const entries = Object.entries(findings);

  return (
    <div className="flex flex-col gap-4">
      {substep ? <DotSteps total={2} current={substep} /> : null}

      <div className="text-center">
        <h4 className="text-[17px] font-extrabold text-ink">{title}</h4>
        <p className="mt-0.5 text-[13px] text-ink-muted">{subtitle}</p>
      </div>

      <div className="mx-auto w-full max-w-[540px]">
        <Odontogram
          findings={merged}
          surfaceMode
          onSelectTooth={(tooth) => {
            if (!findings[tooth]) updateTooth(tooth, {});
          }}
          onSelectSurface={(tooth, surface) => {
            const current = findings[tooth]?.surfaces ?? [];
            updateTooth(tooth, {
              surfaces: current.includes(surface) ? current : [...current, surface],
            });
          }}
          renderPopover={(tooth, close) => (
            <ToothPopover
              tooth={tooth}
              entry={findings[tooth]}
              onChange={(patch) => updateTooth(tooth, patch)}
              onDelete={() => {
                removeTooth(tooth);
                close();
              }}
              onSave={close}
            />
          )}
          legend={<OdontogramLegend items={DEFAULT_LEGEND} />}
        />
      </div>

      {entries.length ? (
        <ul className="flex flex-col gap-2">
          {entries.map(([tooth, entry]) => (
            <li
              key={tooth}
              className="flex items-center gap-3 rounded-xl border border-slate-200 px-3.5 py-2.5"
            >
              <span className="flex h-7 min-w-[34px] items-center justify-center rounded-lg bg-slate-100 text-[12px] font-bold text-ink">
                {tooth}
              </span>
              <span className="min-w-0 flex-1 text-[13px] text-ink">
                {conditionByValue(entry.condition)?.label ?? "No condition set"}
                {entry.surfaces?.length ? ` · ${formatSurfaces(entry.surfaces)}` : ""}
                {entry.code ? ` · ${entry.code}` : ""}
              </span>
              <button
                type="button"
                onClick={() => removeTooth(tooth)}
                aria-label={`Remove tooth ${tooth}`}
                className="rounded-lg p-1.5 text-ink-faint transition hover:bg-danger-soft hover:text-danger"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
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
                    {findings[tooth].code ? ` · ${findings[tooth].code}` : ""}
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

export function MedicalCheckupModal({ open, onClose, appointment, patient, chart = [], onSaved }) {
  const [step, setStep] = useState(1);
  const [medical, setMedical] = useState({
    asa: patient?.asa ?? "I",
    bloodPressure: "",
    complaint: appointment?.note ?? "",
    anaesthetic: "",
  });
  const [findings, setFindings] = useState({});
  const [cosmetic, setCosmetic] = useState({});
  const [agreement, setAgreement] = useState({ planReason: "", planNote: "", teeth: {} });
  const toast = useToast();

  const baseFindings = useMemo(() => chartToFindings(chart), [chart]);

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

      {step === 2 ? (
        <StepChart
          substep={1}
          title="Medical service"
          subtitle="Select a problem tooth, then a surface"
          findings={findings}
          setFindings={setFindings}
          baseFindings={baseFindings}
        />
      ) : null}

      {step === 3 ? (
        <StepChart
          substep={2}
          title="Cosmetic service"
          subtitle="Select the teeth included in the oral check"
          findings={cosmetic}
          setFindings={setCosmetic}
          baseFindings={baseFindings}
        />
      ) : null}

      {step === 4 ? (
        <StepAgreement findings={findings} agreement={agreement} setAgreement={setAgreement} />
      ) : null}
    </Modal>
  );
}
