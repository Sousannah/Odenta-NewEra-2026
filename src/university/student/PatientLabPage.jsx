import { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { ArrowLeft, Building2, CheckCircle2, FlaskConical, GraduationCap } from "lucide-react";
import { cn } from "@/lib/cn";
import { useAsync } from "@/hooks";
import { universityService } from "@/services";
import { formatDate } from "@/lib/format";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/Field";
import { InfoBanner, KeyValue } from "@/components/ui/Misc";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { PageHeader } from "@/components/shared";
import { LabStatusBadge } from "@/university/components";

/**
 * Raising a lab prescription.
 *
 * The prescription is not one form but nine, and which one you need is decided
 * by three questions in order: which lab, which discipline, which stage. So the
 * screen is a funnel rather than a page of conditionals — at every point the
 * student is answering one question, and the form that appears is the one the
 * faculty actually prints.
 */

/* -------------------------------------------------------------- the forms */

const FIXED_STAGES = [
  { value: "primary", title: "1ry Impression", blurb: "Primary impression and diagnostic work" },
  { value: "final", title: "Final Restoration", blurb: "Design, material and shade" },
  { value: "tryin", title: "Try In", blurb: "Fit assessment and remakes" },
];

const REMOVABLE_STAGES = [
  { value: "complete", title: "Complete Denture", blurb: "Edentulous — full denture sequence" },
  { value: "rpd", title: "RPD", blurb: "Partially edentulous — framework sequence" },
];

const FIXED_PRIMARY_STEPS = [
  { key: "mountedDiagnosticCasts", label: "Mounted diagnostic casts" },
  { key: "diagnosticWaxUp", label: "Diagnostic wax up" },
  { key: "provisionalRestoration", label: "Provisional restoration" },
];

const COMPLETE_DENTURE_STEPS = [
  { key: "studyCastsAndCustomTrays", label: "Study casts and custom trays" },
  { key: "masterCastsAndRecordBlocks", label: "Master casts and record blocks" },
  { key: "settingOfTeeth", label: "Setting of teeth on mounted master casts (mean value articulator)" },
  { key: "finalProcessedPolishedDenture", label: "Final processed polished denture" },
];

const RPD_STEPS = [
  { key: "studyCastsAndCustomTrays", label: "Study casts and custom trays" },
  { key: "masterCastsAndMetalFramework", label: "Master casts and metal framework" },
  { key: "settingOfTeeth", label: "Setting of teeth on mounted master casts (mean value articulator)" },
  { key: "rpdTryIn", label: "RPD try-in" },
  { key: "finalProcessedPolishedDenture", label: "Final processed polished denture" },
];

const DESIGNS = ["Inlay/Onlay", "Crown", "Endocrown", "Veneer", "Fixed Partial Denture"];
const MATERIALS = [
  "Full metal",
  "Porcelain fused to metal",
  "Monolithic zirconia",
  "Porcelain fused to zirconia",
  "Emax",
];
const PONTICS = ["Modified ridge lap", "Ovate", "Hygienic", "Conical"];

/** The line the lab reads on the docket. */
const ITEM_LABEL = {
  fixed_prosthodontics_primary: "Fixed prosthodontics — primary impression",
  fixed_prosthodontics_final: "Fixed prosthodontics — final restoration",
  fixed_prosthodontics_tryin: "Fixed prosthodontics — try-in",
  removable_prosthodontics_complete: "Complete denture",
  removable_prosthodontics_rpd: "Removable partial denture",
  external: "External lab request",
};

const blankForms = () => ({
  fixedPrimary: {
    tooth: "",
    laboratorySteps: Object.fromEntries(FIXED_PRIMARY_STEPS.map((step) => [step.key, false])),
    notes: "",
  },
  fixedFinal: { tooth: "", design: "", material: "", pontic: "", color: "", notes: "" },
  fixedTryIn: { tooth: "", tryInOk: false, problemWithTryIn: false, remarks: "" },
  removableComplete: {
    laboratorySteps: Object.fromEntries(COMPLETE_DENTURE_STEPS.map((step) => [step.key, false])),
    notes: "",
  },
  removableRpd: {
    laboratorySteps: Object.fromEntries(RPD_STEPS.map((step) => [step.key, false])),
    notes: "",
  },
  external: { item: "", notes: "" },
});

/* ------------------------------------------------------------- the picker */

function ChoiceCard({ title, blurb, icon, tone = "brand", onClick }) {
  const tones = {
    brand: "border-brand-200 bg-brand-50/60 hover:border-brand-400",
    accent: "border-accent-200 bg-accent-50/60 hover:border-accent-400",
    neutral: "border-slate-200 bg-white hover:border-brand-300",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "od-focus flex flex-col items-start gap-1.5 rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-card",
        tones[tone]
      )}
    >
      {icon ? <span className="mb-1 text-brand-700">{icon}</span> : null}
      <span className="text-[14px] font-bold text-ink">{title}</span>
      <span className="text-[12.5px] text-ink-muted">{blurb}</span>
    </button>
  );
}

/* ------------------------------------------------------------ the screen */

export default function PatientLabPage() {
  const { record } = useOutletContext();
  const toast = useToast();

  const [labKind, setLabKind] = useState("");
  const [discipline, setDiscipline] = useState("");
  const [stage, setStage] = useState("");
  const [forms, setForms] = useState(blankForms);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const { data: requests = [], loading, refetch } = useAsync(
    () => universityService.getLabRequests({ studentId: record.studentId ?? "all" }),
    [record.studentId],
    []
  );

  const mine = useMemo(
    () => requests.filter((item) => item.caseId === record.id),
    [requests, record.id]
  );

  const patch = (formKey, changes) =>
    setForms((prev) => ({ ...prev, [formKey]: { ...prev[formKey], ...changes } }));

  const patchStep = (formKey, stepKey, checked) =>
    setForms((prev) => ({
      ...prev,
      [formKey]: {
        ...prev[formKey],
        laboratorySteps: { ...prev[formKey].laboratorySteps, [stepKey]: checked },
      },
    }));

  const reset = () => {
    setLabKind("");
    setDiscipline("");
    setStage("");
    setForms(blankForms());
    setError("");
  };

  /** Which of the nine forms is on screen, as a stable key. */
  const formType =
    labKind === "external"
      ? "external"
      : discipline === "fixed"
        ? stage && `fixed_prosthodontics_${stage}`
        : discipline === "removable"
          ? stage && `removable_prosthodontics_${stage}`
          : null;

  const formDataFor = () => {
    switch (formType) {
      case "fixed_prosthodontics_primary":
        return { formType, ...forms.fixedPrimary };
      case "fixed_prosthodontics_final":
        return { formType, ...forms.fixedFinal };
      case "fixed_prosthodontics_tryin":
        return { formType, ...forms.fixedTryIn };
      case "removable_prosthodontics_complete":
        return { formType, ...forms.removableComplete };
      case "removable_prosthodontics_rpd":
        return { formType, ...forms.removableRpd };
      case "external":
        return { formType, ...forms.external };
      default:
        return null;
    }
  };

  const submit = async () => {
    const formData = formDataFor();
    if (!formData) return;

    if (formType === "external" && !forms.external.item.trim()) {
      setError("Describe what the external lab is being asked to make.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await universityService.raiseLabRequest({
        caseId: record.id,
        patientName: record.patientName,
        studentId: record.studentId,
        studentName: record.studentName,
        supervisorId: record.supervisorId,
        supervisorName: record.supervisorName,
        department: record.department,
        item: forms.external.item || ITEM_LABEL[formType],
        teeth: [formData.tooth].filter(Boolean),
        shade: formData.color ?? null,
        labKind: labKind === "external" ? "external" : "university",
        labName: labKind === "external" ? "External lab" : "AIU Prosthetics Lab",
        formData,
      });
      toast.success("Lab request submitted", ITEM_LABEL[formType]);
      reset();
      refetch();
    } catch (cause) {
      setError(cause?.message ?? "Could not submit the lab request.");
    } finally {
      setSubmitting(false);
    }
  };

  /* The read-only header every prescription carries. */
  const Header = () => (
    <div className="mb-5 grid gap-4 rounded-2xl bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-4">
      <KeyValue label="Student name" value={record.studentName ?? "—"} />
      <KeyValue label="Student ID" value={record.studentId ?? "—"} />
      <KeyValue label="Patient name" value={record.patientName} />
      <KeyValue label="Date" value={formatDate(new Date(), "d MMM yyyy")} />
    </div>
  );

  const stageTitle =
    !labKind
      ? "Select lab type"
      : labKind === "external"
        ? "External lab request"
        : !discipline
          ? "Select form type"
          : !stage
            ? `Select ${discipline === "fixed" ? "fixed" : "removable"} prosthodontics form`
            : "Laboratory prescription form";

  return (
    <div className="flex flex-col gap-4 p-4 sm:gap-5 sm:p-6">
      <PageHeader
        title="Laboratory requests"
        description={`Submit a lab prescription for ${record.patientName}.`}
      />

      <Card>
        <CardHeader
          title={stageTitle}
          subtitle={formType ? ITEM_LABEL[formType] : "Three questions decide which form you need."}
          action={
            labKind ? (
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<ArrowLeft className="h-4 w-4" />}
                onClick={reset}
              >
                Start over
              </Button>
            ) : null
          }
        />
        <CardBody className="pt-2">
          {error ? <InfoBanner tone="warning" className="mb-4">{error}</InfoBanner> : null}

          {/* 1 — which lab */}
          {!labKind ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <ChoiceCard
                title="University lab"
                blurb="Internal laboratory — uses the faculty prescription forms"
                icon={<GraduationCap className="h-5 w-5" />}
                onClick={() => setLabKind("university")}
              />
              <ChoiceCard
                title="Outside lab"
                blurb="External specialist laboratory — free-text prescription"
                icon={<Building2 className="h-5 w-5" />}
                tone="accent"
                onClick={() => setLabKind("external")}
              />
            </div>
          ) : null}

          {/* 2 — which discipline */}
          {labKind === "university" && !discipline ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <ChoiceCard
                title="Fixed Prosthodontics"
                blurb="Crowns, bridges, inlays and veneers"
                tone="neutral"
                onClick={() => setDiscipline("fixed")}
              />
              <ChoiceCard
                title="Removable Prosthodontics"
                blurb="Complete and partial dentures"
                tone="neutral"
                onClick={() => setDiscipline("removable")}
              />
            </div>
          ) : null}

          {/* 3 — which stage */}
          {labKind === "university" && discipline && !stage ? (
            <div
              className={cn(
                "grid gap-3",
                discipline === "fixed" ? "sm:grid-cols-3" : "sm:grid-cols-2"
              )}
            >
              {(discipline === "fixed" ? FIXED_STAGES : REMOVABLE_STAGES).map((entry) => (
                <ChoiceCard
                  key={entry.value}
                  title={entry.title}
                  blurb={entry.blurb}
                  onClick={() => setStage(entry.value)}
                />
              ))}
            </div>
          ) : null}

          {/* ---------------------------------------------------- the forms */}

          {formType === "fixed_prosthodontics_primary" ? (
            <div>
              <Header />
              <Field label="Tooth" className="mb-4">
                <Input
                  placeholder="Enter tooth number"
                  value={forms.fixedPrimary.tooth}
                  onChange={(event) => patch("fixedPrimary", { tooth: event.target.value })}
                />
              </Field>
              <Field label="Laboratory steps required" className="mb-4">
                <div className="flex flex-col gap-2.5 rounded-xl border border-slate-200 p-3.5">
                  {FIXED_PRIMARY_STEPS.map((step) => (
                    <Checkbox
                      key={step.key}
                      label={step.label}
                      checked={forms.fixedPrimary.laboratorySteps[step.key]}
                      onChange={(event) =>
                        patchStep("fixedPrimary", step.key, event.target.checked)
                      }
                    />
                  ))}
                </div>
              </Field>
              <Field label="Notes">
                <Textarea
                  rows={3}
                  placeholder="Enter notes…"
                  value={forms.fixedPrimary.notes}
                  onChange={(event) => patch("fixedPrimary", { notes: event.target.value })}
                />
              </Field>
            </div>
          ) : null}

          {formType === "fixed_prosthodontics_final" ? (
            <div>
              <Header />
              <Field label="Tooth" className="mb-4">
                <Input
                  placeholder="Enter tooth number"
                  value={forms.fixedFinal.tooth}
                  onChange={(event) => patch("fixedFinal", { tooth: event.target.value })}
                />
              </Field>
              <div className="mb-4 grid gap-4 md:grid-cols-3">
                <Field label="Design">
                  <Select
                    value={forms.fixedFinal.design}
                    onChange={(event) => patch("fixedFinal", { design: event.target.value })}
                  >
                    <option value="">Select design</option>
                    {DESIGNS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Material">
                  <Select
                    value={forms.fixedFinal.material}
                    onChange={(event) => patch("fixedFinal", { material: event.target.value })}
                  >
                    <option value="">Select material</option>
                    {MATERIALS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Pontic">
                  <Select
                    value={forms.fixedFinal.pontic}
                    onChange={(event) => patch("fixedFinal", { pontic: event.target.value })}
                  >
                    <option value="">Select pontic</option>
                    {PONTICS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
              <Field label="Shade" hint="VITA classical" className="mb-4">
                <Input
                  placeholder="e.g. A2"
                  value={forms.fixedFinal.color}
                  onChange={(event) => patch("fixedFinal", { color: event.target.value })}
                />
              </Field>
              <Field label="Notes">
                <Textarea
                  rows={3}
                  placeholder="Enter notes…"
                  value={forms.fixedFinal.notes}
                  onChange={(event) => patch("fixedFinal", { notes: event.target.value })}
                />
              </Field>
            </div>
          ) : null}

          {formType === "fixed_prosthodontics_tryin" ? (
            <div>
              <Header />
              <Field label="Tooth" className="mb-4">
                <Input
                  placeholder="Enter tooth number"
                  value={forms.fixedTryIn.tooth}
                  onChange={(event) => patch("fixedTryIn", { tooth: event.target.value })}
                />
              </Field>
              <Field label="Status" className="mb-4">
                <div className="flex flex-col gap-2.5 rounded-xl border border-slate-200 p-3.5">
                  {/* Mutually exclusive: the try-in either fits or it does not. */}
                  <Checkbox
                    label="Try-in OK"
                    checked={forms.fixedTryIn.tryInOk}
                    onChange={(event) =>
                      patch("fixedTryIn", {
                        tryInOk: event.target.checked,
                        problemWithTryIn: event.target.checked ? false : forms.fixedTryIn.problemWithTryIn,
                      })
                    }
                  />
                  <Checkbox
                    label="Problem with try-in"
                    checked={forms.fixedTryIn.problemWithTryIn}
                    onChange={(event) =>
                      patch("fixedTryIn", {
                        problemWithTryIn: event.target.checked,
                        tryInOk: event.target.checked ? false : forms.fixedTryIn.tryInOk,
                      })
                    }
                  />
                </div>
              </Field>
              <Field label="Remarks">
                <Textarea
                  rows={3}
                  placeholder="Enter remarks…"
                  value={forms.fixedTryIn.remarks}
                  onChange={(event) => patch("fixedTryIn", { remarks: event.target.value })}
                />
              </Field>
            </div>
          ) : null}

          {formType === "removable_prosthodontics_complete" ||
          formType === "removable_prosthodontics_rpd" ? (
            <div>
              <Header />
              <Field label="Laboratory steps required" className="mb-4">
                <div className="flex flex-col gap-2.5 rounded-xl border border-slate-200 p-3.5">
                  {(formType === "removable_prosthodontics_rpd"
                    ? RPD_STEPS
                    : COMPLETE_DENTURE_STEPS
                  ).map((step) => {
                    const formKey =
                      formType === "removable_prosthodontics_rpd" ? "removableRpd" : "removableComplete";
                    return (
                      <Checkbox
                        key={step.key}
                        label={step.label}
                        checked={forms[formKey].laboratorySteps[step.key]}
                        onChange={(event) => patchStep(formKey, step.key, event.target.checked)}
                      />
                    );
                  })}
                </div>
              </Field>
              <Field label="Notes">
                <Textarea
                  rows={3}
                  placeholder="Enter notes…"
                  value={
                    formType === "removable_prosthodontics_rpd"
                      ? forms.removableRpd.notes
                      : forms.removableComplete.notes
                  }
                  onChange={(event) =>
                    patch(
                      formType === "removable_prosthodontics_rpd" ? "removableRpd" : "removableComplete",
                      { notes: event.target.value }
                    )
                  }
                />
              </Field>
            </div>
          ) : null}

          {formType === "external" ? (
            <div>
              <Header />
              <Field label="What is being made" required className="mb-4">
                <Input
                  placeholder="e.g. Zirconia crown, tooth 26"
                  value={forms.external.item}
                  onChange={(event) => patch("external", { item: event.target.value })}
                />
              </Field>
              <Field label="Notes">
                <Textarea
                  rows={4}
                  placeholder="Enter notes for the outside lab…"
                  value={forms.external.notes}
                  onChange={(event) => patch("external", { notes: event.target.value })}
                />
              </Field>
            </div>
          ) : null}

          {formType ? (
            <div className="mt-5 flex justify-end gap-3">
              <Button variant="secondary" onClick={reset}>
                Cancel
              </Button>
              <Button loading={submitting} leftIcon={<FlaskConical className="h-4 w-4" />} onClick={submit}>
                Submit request
              </Button>
            </div>
          ) : null}
        </CardBody>
      </Card>

      {/* ------------------------------------------------------- the history */}
      <Card>
        <CardHeader title="Request history" subtitle={`${mine.length} request(s) for this patient`} />
        <CardBody className="pt-2">
          {loading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 2 }).map((_, index) => (
                <Skeleton key={index} className="h-24 w-full" />
              ))}
            </div>
          ) : mine.length === 0 ? (
            <EmptyState
              icon={<FlaskConical className="h-6 w-6" />}
              title="No lab requests yet"
              description="Requests you raise for this patient appear here."
              className="py-10"
            />
          ) : (
            <ul className="flex flex-col gap-3">
              {mine.map((request) => (
                <li key={request.id} className="rounded-xl border border-slate-200 px-4 py-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-2.5">
                      {request.labKind === "external" ? (
                        <Building2 className="h-4 w-4 shrink-0 text-accent-600" />
                      ) : (
                        <GraduationCap className="h-4 w-4 shrink-0 text-brand-600" />
                      )}
                      <span className="truncate text-[13.5px] font-bold text-ink">{request.item}</span>
                    </span>
                    <LabStatusBadge status={request.status} />
                  </div>
                  <p className="mt-1.5 text-[12px] text-ink-soft">
                    Submitted {formatDate(request.requestedAt, "d MMM yyyy")} · due{" "}
                    {formatDate(request.dueAt, "d MMM yyyy")}
                  </p>
                  {request.formData?.notes ? (
                    <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-[12.5px] text-ink-muted">
                      {request.formData.notes}
                    </p>
                  ) : null}
                  {request.note ? (
                    <p className="mt-2 flex items-start gap-2 rounded-lg bg-brand-50/70 px-3 py-2 text-[12.5px] text-brand-800">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      {request.note}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
