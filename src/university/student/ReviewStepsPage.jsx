import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { CheckCircle2, CircleDashed, Send } from "lucide-react";
import { cn } from "@/lib/cn";
import { universityService } from "@/services";
import { uni } from "@/config/paths";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field, Select, Textarea } from "@/components/ui/Field";
import { ProgressBar } from "@/components/ui/Stepper";
import { InfoBanner } from "@/components/ui/Misc";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { PageHeader } from "@/components/shared";
import { DetailGrid } from "@/university/components";

/**
 * Submitting a step for sign-off.
 *
 * The student ticks what they actually completed and sends it; the supervisor
 * decides. Consent gates the whole thing — the server rejects a submission on
 * an unconsented case, so the block is surfaced here rather than discovered on
 * submit.
 *
 * Three procedures are taught as two distinct sequences each, so those ask for
 * a sub-type before the checklist can be fetched.
 */

const PROCEDURES = [
  { value: "Operative", department: "operative" },
  { value: "Fixed Prosthodontics", department: "prosthodontics_fixed" },
  { value: "Removable Prosthodontics", department: "prosthodontics_removable" },
  { value: "Endodontics", department: "endodontics" },
  { value: "Periodontics", department: "periodontics" },
  { value: "Oral Surgery", department: "oral_surgery" },
];

const SUB_TYPES = {
  "Removable Prosthodontics": [
    {
      value: "Complete Denture",
      title: "Complete Denture",
      blurb: "Full denture evaluation for edentulous patients",
    },
    {
      value: "Partial Denture",
      title: "Partial Denture",
      blurb: "Partial denture evaluation for partially edentulous patients",
    },
  ],
  "Fixed Prosthodontics": [
    {
      value: "Crown Procedure",
      title: "Crown Procedure",
      blurb: "Single crown preparation and placement",
    },
    {
      value: "Bridge Procedure",
      title: "Fixed Partial Denture (FPD)",
      blurb: "Bridge preparation and placement across multiple teeth",
    },
  ],
  Operative: [
    {
      value: "Amalgam Restoration",
      title: "Amalgam Restoration",
      blurb: "Metallic restoration for posterior teeth",
    },
    {
      value: "Composite Restoration",
      title: "Composite Restoration",
      blurb: "Tooth-coloured restoration for anterior or posterior teeth",
    },
  ],
};

const departmentFor = (procedure) =>
  PROCEDURES.find((entry) => entry.value === procedure)?.department;

export default function ReviewStepsPage() {
  const { record } = useOutletContext();
  const navigate = useNavigate();
  const toast = useToast();

  const [procedure, setProcedure] = useState("");
  const [subType, setSubType] = useState("");
  const [steps, setSteps] = useState([]);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const needsSubType = Boolean(SUB_TYPES[procedure]);
  const consentSigned = Boolean(record.consent?.isSigned ?? record.consentSigned);

  /* Fetch as soon as the choice is complete — a sub-type where one is needed. */
  useEffect(() => {
    if (!procedure) return;
    if (needsSubType && !subType) {
      setSteps([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError("");

    universityService
      .getReviewSteps(procedure, needsSubType ? subType : undefined)
      .then((result) => {
        if (!cancelled) setSteps(result);
      })
      .catch((cause) => {
        if (!cancelled) {
          setSteps([]);
          setError(cause?.message ?? `No review steps are published for ${procedure}.`);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [procedure, subType, needsSubType]);

  const toggleStep = (index) =>
    setSteps((prev) =>
      prev.map((step, position) =>
        position === index ? { ...step, completed: !step.completed } : step
      )
    );

  const completed = steps.filter((step) => step.completed).length;

  const submit = async () => {
    if (!procedure) return setError("Select a procedure type before submitting.");
    if (needsSubType && !subType) return setError("Select which sequence you are being signed off on.");
    if (!steps.length) return setError("No review steps are available for this procedure.");
    if (!completed) return setError("Tick at least one completed step before submitting.");

    setSubmitting(true);
    setError("");
    try {
      await universityService.submitStep({
        caseId: record.id,
        procedureType: needsSubType ? `${procedure} — ${subType}` : procedure,
        department: departmentFor(procedure) ?? record.department,
        reviewSteps: steps,
        stepIndex: completed,
        stepTotal: steps.length,
        note: note || null,
        comment: "",
      });
      setDone(true);
      toast.success("Submitted for review", "A staff member will decide on this step.");
    } catch (cause) {
      setError(
        cause?.code === "consent_required"
          ? "Patient consent must be signed before a step can be submitted."
          : cause?.message ?? "Could not submit the review."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setDone(false);
    setNote("");
    setSteps((prev) => prev.map((step) => ({ ...step, completed: false })));
  };

  if (done) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4 sm:gap-5 sm:p-6">
        <EmptyState
          icon={<CheckCircle2 className="h-6 w-6 text-success" />}
          title="Review submitted successfully"
          description={`Your ${procedure} review is now with ${record.supervisorName ?? "your supervisor"}. It will appear in My Reviews until a decision is made.`}
          className="od-card py-16"
          action={
            <div className="flex flex-wrap justify-center gap-3">
              <Button onClick={reset}>Submit another review</Button>
              <Button variant="secondary" onClick={() => navigate(uni.reviews)}>
                Go to my reviews
              </Button>
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 p-4 sm:gap-5 sm:p-6">
      <PageHeader
        title="Review steps"
        description="Tick what you completed, then send the step to your staff member."
      />

      {!consentSigned ? (
        <InfoBanner
          tone="warning"
          action={
            <Button
              size="xs"
              variant="secondary"
              onClick={() => navigate(uni.patientTab(record.nationalId, "consent"))}
            >
              Capture consent
            </Button>
          }
        >
          This case has no signed consent, so nothing can be submitted for review yet.
        </InfoBanner>
      ) : null}

      {error ? <InfoBanner tone="warning">{error}</InfoBanner> : null}

      <Card>
        <CardBody>
          <DetailGrid
            columns={4}
            items={[
              { label: "Patient", value: record.patientName },
              { label: "National ID", value: record.nationalId },
              { label: "Student", value: record.studentName ?? "—" },
              { label: "Supervisor", value: record.supervisorName ?? "—" },
            ]}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Procedure type" subtitle="What are you being signed off on?" />
        <CardBody className="pt-2">
          <Field>
            <Select
              value={procedure}
              onChange={(event) => {
                setProcedure(event.target.value);
                setSubType("");
                setError("");
              }}
            >
              <option value="">Select a procedure type</option>
              {PROCEDURES.map((entry) => (
                <option key={entry.value} value={entry.value}>
                  {entry.value}
                </option>
              ))}
            </Select>
          </Field>
        </CardBody>
      </Card>

      {needsSubType ? (
        <Card>
          <CardHeader
            title={procedure === "Operative" ? "Restoration type" : "Which sequence"}
            subtitle="These are taught as two different step lists."
          />
          <CardBody className="pt-2">
            <div className="grid gap-3 sm:grid-cols-2">
              {SUB_TYPES[procedure].map((option) => {
                const selected = subType === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => {
                      setSubType(option.value);
                      setError("");
                    }}
                    className={cn(
                      "od-focus flex flex-col items-start gap-1 rounded-2xl border p-4 text-left transition",
                      selected
                        ? "border-brand-600 bg-brand-50/70 shadow-sm"
                        : "border-slate-200 hover:border-brand-300 hover:bg-brand-50/40"
                    )}
                  >
                    <span className="text-[14px] font-bold text-ink">{option.title}</span>
                    <span className="text-[12.5px] text-ink-muted">{option.blurb}</span>
                  </button>
                );
              })}
            </div>
          </CardBody>
        </Card>
      ) : null}

      <Card>
        <CardHeader
          title={
            needsSubType && subType ? `${procedure}: ${subType}` : `${procedure || "Procedure"} steps`
          }
          subtitle={steps.length ? `${completed} of ${steps.length} completed` : undefined}
          action={
            steps.length ? (
              <div className="w-40">
                <ProgressBar
                  value={(completed / steps.length) * 100}
                  tone={completed === steps.length ? "success" : "brand"}
                />
              </div>
            ) : null
          }
        />
        <CardBody className="pt-2">
          {!procedure ? (
            <InfoBanner tone="warning">Select a procedure type from the dropdown above.</InfoBanner>
          ) : needsSubType && !subType ? (
            <InfoBanner tone="warning">
              Select which sequence you are being signed off on before the checklist can load.
            </InfoBanner>
          ) : loading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          ) : steps.length === 0 ? (
            <InfoBanner tone="warning">
              No review steps are published for this procedure.
            </InfoBanner>
          ) : (
            <ul className="flex flex-col gap-2">
              {steps.map((step, index) => (
                <li key={`${step.description}-${index}`}>
                  <button
                    type="button"
                    aria-pressed={step.completed}
                    onClick={() => toggleStep(index)}
                    className={cn(
                      "od-focus flex w-full items-center justify-between gap-3 rounded-xl border px-3.5 py-3 text-left transition",
                      step.completed
                        ? "border-brand-300 bg-brand-50/60"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span
                        className={cn(
                          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold",
                          step.completed ? "bg-brand-600 text-white" : "bg-slate-200 text-ink-soft"
                        )}
                      >
                        {index + 1}
                      </span>
                      <span
                        className={cn(
                          "min-w-0 text-[13.5px]",
                          step.completed ? "font-semibold text-ink" : "text-ink-muted"
                        )}
                      >
                        {step.description}
                      </span>
                    </span>
                    <span
                      className={cn(
                        "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold",
                        step.completed
                          ? "bg-brand-600 text-white"
                          : "bg-slate-100 text-ink-soft"
                      )}
                    >
                      {step.completed ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <CircleDashed className="h-3 w-3" />
                      )}
                      {step.completed ? "Done" : "Not done"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Additional notes" subtitle="Optional — anything the staff member should know" />
        <CardBody className="pt-2">
          <Textarea
            rows={4}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Add any additional notes about the steps you completed"
          />
        </CardBody>
      </Card>

      <div className="flex justify-end">
        <Button
          size="lg"
          loading={submitting}
          leftIcon={<Send className="h-4 w-4" />}
          disabled={!consentSigned || !steps.length || !completed || (needsSubType && !subType)}
          onClick={submit}
        >
          Submit review
        </Button>
      </div>
    </div>
  );
}
