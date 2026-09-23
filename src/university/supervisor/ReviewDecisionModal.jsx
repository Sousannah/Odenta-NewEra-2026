import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Check,
  CircleSlash,
  FolderOpen,
  GraduationCap,
  RotateCcw,
  Stethoscope,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { uni } from "@/config/paths";
import { REVIEW_STATUS, gradeFor } from "@/config/academic";
import { formatDate, fromNow } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { SegmentedControl } from "@/components/ui/Tabs";
import { InfoBanner } from "@/components/ui/Misc";
import { DepartmentChip, DetailGrid, ReviewStatusBadge } from "@/university/components";
import { ReviewStepsPanel, stepTotals } from "./ReviewStepsPanel";
import { SignatureMark } from "./SignatureManager";
import { PatientDossierModal } from "./PatientDossierModal";

/**
 * One submitted step, opened from the faculty side.
 *
 * Two stages, in order, because a staff member does two different things here
 * and mixing them is how a step gets signed off without anybody reading the
 * record: first what the student submitted, then the verdict. The original put
 * that behind a segmented control in the corner, which read as a view toggle —
 * something optional — so the record went unread. It is a numbered rail now:
 * the stage you are on is stated, the one you have finished is ticked, and the
 * only forward button on stage one is "continue to the decision".
 *
 * The step checklist is where the verdict actually gets made. Recording it per
 * step is the difference between "returned" and something a student can act on
 * tomorrow morning.
 */

const DECISIONS = [
  { value: REVIEW_STATUS.ACCEPTED, label: "Accept" },
  { value: REVIEW_STATUS.RETURNED, label: "Return" },
  { value: REVIEW_STATUS.REJECTED, label: "Reject" },
];

const ICONS = {
  [REVIEW_STATUS.ACCEPTED]: BadgeCheck,
  [REVIEW_STATUS.RETURNED]: RotateCcw,
  [REVIEW_STATUS.REJECTED]: CircleSlash,
};

function QuickCard({ icon: Icon, label, value, tone }) {
  return (
    <div className={cn("flex items-center gap-2.5 rounded-xl border px-3 py-2.5", tone)}>
      <Icon className="h-4 w-4 shrink-0" />
      <span className="min-w-0">
        <span className="block text-[11px] font-bold uppercase tracking-wide opacity-70">{label}</span>
        <span className="block truncate text-[13px] font-bold">{value ?? "—"}</span>
      </span>
    </div>
  );
}

/**
 * The order of work, made a thing on the screen rather than something the
 * reader is trusted to infer. `done` ticks a stage that has been visited, so
 * a returning reader can see they already read the record.
 */
function StageRail({ stage, onStage, decisionLabel, recordRead }) {
  const stages = [
    {
      key: "record",
      step: 1,
      label: "Read the record",
      hint: "What the student submitted",
      done: recordRead && stage !== "record",
    },
    {
      key: "decision",
      step: 2,
      label: decisionLabel,
      hint: "Rule on each step, then sign",
      done: false,
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-2">
      <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
        {stages.map((entry, index) => {
          const active = stage === entry.key;
          return (
            <div key={entry.key} className="flex flex-1 items-center gap-2">
              <button
                type="button"
                aria-current={active ? "step" : undefined}
                onClick={() => onStage(entry.key)}
                className={cn(
                  "od-focus flex flex-1 items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left transition",
                  active
                    ? "border-brand-600 bg-white shadow-sm"
                    : "border-transparent bg-transparent hover:bg-white/70"
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-extrabold transition-colors",
                    entry.done
                      ? "bg-success text-white"
                      : active
                        ? "bg-brand-600 text-white ring-4 ring-brand-600/15"
                        : "border border-slate-300 bg-white text-ink-soft"
                  )}
                >
                  {entry.done ? <Check className="h-4 w-4" /> : entry.step}
                </span>
                <span className="min-w-0">
                  <span
                    className={cn(
                      "block truncate text-[13.5px] font-bold",
                      active ? "text-ink" : "text-ink-muted"
                    )}
                  >
                    {entry.label}
                  </span>
                  <span className="block truncate text-[11.5px] text-ink-soft">{entry.hint}</span>
                </span>
              </button>
              {index === 0 ? (
                <ArrowRight className="hidden h-4 w-4 shrink-0 text-ink-faint sm:block" />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ReviewDecisionModal({ review, open, onClose, onDecide, signature }) {
  const navigate = useNavigate();

  const [stage, setStage] = useState("record");
  const [recordRead, setRecordRead] = useState(false);
  const [dossierOpen, setDossierOpen] = useState(false);
  const [decision, setDecision] = useState(REVIEW_STATUS.ACCEPTED);
  const [stepStatuses, setStepStatuses] = useState({});
  const [comment, setComment] = useState("");
  const [score, setScore] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const pending = review?.status === REVIEW_STATUS.PENDING;

  useEffect(() => {
    if (!open) return;
    setStage("record");
    setRecordRead(false);
    setDossierOpen(false);
    setDecision(REVIEW_STATUS.ACCEPTED);
    setComment("");
    setScore("");
    setError(null);
    /* A decided review shows the verdicts it was given; a pending one starts
       blank so nothing is signed off by inheritance. */
    setStepStatuses(
      review?.status === REVIEW_STATUS.PENDING ? {} : { ...(review?.stepStatuses ?? {}) }
    );
  }, [open, review?.id, review?.status, review?.stepStatuses]);

  const steps = review?.reviewSteps ?? [];
  const totals = useMemo(() => stepTotals(steps, stepStatuses), [steps, stepStatuses]);

  if (!review) return null;

  const goToStage = (next) => {
    if (next === "decision") setRecordRead(true);
    setStage(next);
  };

  const setStep = (index, status) =>
    setStepStatuses((prev) => ({ ...prev, [index]: status }));

  /* Accepting a step-by-step review with steps still undecided means the
     checklist and the verdict disagree, so it is blocked rather than guessed. */
  const undecided = pending && steps.length > 0 && totals.pending > 0;

  const submit = async () => {
    if (decision !== REVIEW_STATUS.ACCEPTED && !comment.trim()) {
      setError("Tell the student what to correct — a bare 'no' is not something they can act on.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const numeric = score === "" ? null : Number(score);
      await onDecide?.({
        status: decision,
        comment: comment.trim() || null,
        score: decision === REVIEW_STATUS.ACCEPTED ? numeric : null,
        grade:
          decision === REVIEW_STATUS.ACCEPTED && numeric != null ? gradeFor(numeric).value : null,
        stepStatuses,
      });
      onClose?.();
    } catch (cause) {
      setError(cause?.message ?? "Could not record the decision.");
    } finally {
      setBusy(false);
    }
  };

  const DecisionIcon = ICONS[decision];
  const decisionLabel = pending ? "Make the decision" : "The outcome";

  const footer = !pending ? (
    <>
      {stage === "decision" ? (
        <Button
          variant="secondary"
          leftIcon={<ArrowLeft className="h-4 w-4" />}
          onClick={() => setStage("record")}
        >
          Back to the record
        </Button>
      ) : null}
      <Button
        variant={stage === "record" ? "primary" : "secondary"}
        rightIcon={stage === "record" ? <ArrowRight className="h-4 w-4" /> : undefined}
        onClick={stage === "record" ? () => goToStage("decision") : onClose}
      >
        {stage === "record" ? "See the outcome" : "Close"}
      </Button>
    </>
  ) : stage === "record" ? (
    <>
      <Button variant="secondary" onClick={onClose}>
        Cancel
      </Button>
      <Button rightIcon={<ArrowRight className="h-4 w-4" />} onClick={() => goToStage("decision")}>
        Continue to the decision
      </Button>
    </>
  ) : (
    <>
      <Button
        variant="secondary"
        leftIcon={<ArrowLeft className="h-4 w-4" />}
        onClick={() => setStage("record")}
      >
        Back to the record
      </Button>
      <Button
        onClick={submit}
        loading={busy}
        disabled={undecided && decision === REVIEW_STATUS.ACCEPTED}
        variant={decision === REVIEW_STATUS.REJECTED ? "danger" : "primary"}
        leftIcon={<DecisionIcon className="h-4 w-4" />}
      >
        {DECISIONS.find((item) => item.value === decision)?.label} step
      </Button>
    </>
  );

  return (
    <>
      <Modal
        open={open && !dossierOpen}
        onClose={onClose}
        title="Review details"
        description={`${review.procedureType} · ${review.studentName}`}
        size="xl"
        footer={footer}
      >
        <div className="flex flex-col gap-5">
          {/* ------------------------------------------------- quick glance */}
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            <QuickCard
              icon={UserRound}
              label="Patient"
              value={review.patientName}
              tone="border-brand-200 bg-brand-50/60 text-brand-800"
            />
            <QuickCard
              icon={GraduationCap}
              label="Student"
              value={review.studentName}
              tone="border-success/25 bg-success-soft/60 text-success-strong"
            />
            <QuickCard
              icon={Stethoscope}
              label="Procedure"
              value={`${review.procedureType} · tooth ${review.tooth ?? "—"}`}
              tone="border-slate-200 bg-slate-50 text-ink"
            />
            <QuickCard
              icon={CalendarDays}
              label="Submitted"
              value={formatDate(review.submittedAt, "d MMM yyyy")}
              tone="border-warning/25 bg-warning-soft/60 text-warning-ink"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <ReviewStatusBadge status={review.status} />
            <DepartmentChip department={review.department} />
          </div>

          {/* -------------------------------------------------- the order */}
          <StageRail
            stage={stage}
            onStage={goToStage}
            decisionLabel={decisionLabel}
            recordRead={recordRead}
          />

          {/* ---------------------------------------------------- the record */}
          {stage === "record" ? (
            <div className="flex flex-col gap-5">
              {/* The dossier is the whole point of this stage — a submission
                  is judged against the patient, not on its own. */}
              <button
                type="button"
                onClick={() => setDossierOpen(true)}
                className="od-focus flex w-full items-center gap-3.5 rounded-2xl border border-brand-200 bg-brand-50/60 px-4 py-3.5 text-left transition hover:border-brand-400 hover:bg-brand-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-50 disabled:opacity-70"
                disabled={!review.nationalId}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white">
                  <FolderOpen className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13.5px] font-extrabold text-brand-800">
                    Open the full patient dossier
                  </span>
                  <span className="block text-[12px] text-brand-700/80">
                    {review.nationalId
                      ? "Chart, sheets, imaging, every past submission — opens over this dialog, so nothing you have ticked is lost."
                      : "This submission has no national ID on it, so the dossier cannot be opened."}
                  </span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-brand-700" />
              </button>

              <DetailGrid
                columns={2}
                items={[
                  { label: "Case", value: review.caseId },
                  { label: "National ID", value: review.nationalId },
                  { label: "Student", value: review.studentName },
                  { label: "Staff member", value: review.supervisorName },
                  {
                    label: "Submitted",
                    value: `${formatDate(review.submittedAt, "d MMM yyyy, HH:mm")} · ${fromNow(review.submittedAt)}`,
                  },
                  {
                    label: "Step",
                    value: `${review.stepIndex} of ${review.stepTotal}`,
                  },
                ]}
              />

              <div>
                <span className="od-label">Student's note</span>
                <p className="mt-2 rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-[13.5px] leading-relaxed text-ink">
                  {review.studentComment ?? review.comment ?? "No note provided."}
                </p>
              </div>

              {/* What the student ticked, read-only here: the verdict belongs
                  to stage two, but the reader needs to see the claim now. */}
              <div>
                <span className="od-label">What the student says they did</span>
                <ReviewStepsPanel className="mt-2" steps={steps} statuses={stepStatuses} />
              </div>
            </div>
          ) : (
            /* -------------------------------------------------- the verdict */
            <div className="flex flex-col gap-5">
              <div>
                <span className="od-label">Procedure steps</span>
                <ReviewStepsPanel
                  className="mt-2"
                  steps={steps}
                  statuses={stepStatuses}
                  decidable={pending}
                  onStepStatusChange={setStep}
                />
              </div>

              {pending ? (
                <div className="flex flex-col gap-4 border-t border-slate-100 pt-5">
                  <div>
                    <span className="od-label">Decision</span>
                    <SegmentedControl
                      className="mt-2"
                      options={DECISIONS}
                      value={decision}
                      onChange={setDecision}
                    />
                  </div>

                  {undecided && decision === REVIEW_STATUS.ACCEPTED ? (
                    <InfoBanner tone="warning">
                      {totals.pending} documented step
                      {totals.pending === 1 ? " has" : "s have"} no verdict yet. Rule on each one
                      before accepting — the student reads the checklist, not the headline.
                    </InfoBanner>
                  ) : null}

                  {decision === REVIEW_STATUS.ACCEPTED ? (
                    <Field label="Score" hint="Out of 100. The grade band is derived from it.">
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={score}
                        placeholder="e.g. 82"
                        onChange={(event) => setScore(event.target.value)}
                      />
                      {score !== "" ? (
                        <p className="mt-2 text-[12px] font-bold text-ink-muted">
                          {gradeFor(Number(score)).label}
                        </p>
                      ) : null}
                    </Field>
                  ) : null}

                  <Field
                    label={
                      decision === REVIEW_STATUS.ACCEPTED ? "Feedback (optional)" : "What must be corrected"
                    }
                    required={decision !== REVIEW_STATUS.ACCEPTED}
                    hint={
                      decision === REVIEW_STATUS.RETURNED
                        ? "The step stays open and keeps its original submission date."
                        : undefined
                    }
                  >
                    <Textarea
                      rows={4}
                      value={comment}
                      onChange={(event) => setComment(event.target.value)}
                      placeholder={
                        decision === REVIEW_STATUS.ACCEPTED
                          ? "Good isolation, clean margins…"
                          : "Retake the post-operative radiograph — the apical third is cut off."
                      }
                    />
                  </Field>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
                    <span className="od-label">Signing as</span>
                    <div className="mt-2 flex h-[56px] items-center">
                      <SignatureMark value={signature} className="text-[20px]" />
                    </div>
                    <p className="mt-1 text-[11.5px] text-ink-faint">
                      Applied by the server when a step is accepted. Manage it from{" "}
                      <button
                        type="button"
                        onClick={() => {
                          onClose?.();
                          navigate(uni.signature);
                        }}
                        className="od-focus rounded font-bold text-brand-700 hover:underline"
                      >
                        My signature
                      </button>
                      .
                    </p>
                  </div>

                  {error ? <InfoBanner tone="warning">{error}</InfoBanner> : null}
                </div>
              ) : (
                <div className="flex flex-col gap-4 border-t border-slate-100 pt-5">
                  <DetailGrid
                    columns={2}
                    items={[
                      { label: "Decided by", value: review.supervisorName },
                      {
                        label: "Decided",
                        value: review.decidedAt
                          ? formatDate(review.decidedAt, "d MMM yyyy, HH:mm")
                          : "—",
                      },
                      { label: "Outcome", value: <ReviewStatusBadge status={review.status} /> },
                      {
                        label: "Signature",
                        value: review.signatureRef ? "Recorded" : "Not recorded",
                      },
                    ]}
                  />
                  {review.score != null ? (
                    <div className="flex items-center gap-4 rounded-2xl border border-success/25 bg-success-soft px-4 py-3.5">
                      <span className="text-[26px] font-extrabold leading-none text-success-strong">
                        {review.score}
                      </span>
                      <div>
                        <span className="od-label">Grade</span>
                        <p className="text-[13px] font-bold text-success-strong">
                          {gradeFor(review.score).label}
                        </p>
                      </div>
                    </div>
                  ) : null}
                  <div>
                    <span className="od-label">Faculty comment</span>
                    <p className="mt-2 rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-[13.5px] leading-relaxed text-ink">
                      {review.comment ?? "No comment recorded."}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>

      {/* The record, over the decision. Closing it puts the reader back exactly
          where they were; "continue" walks them into the verdict. */}
      <PatientDossierModal
        open={open && dossierOpen}
        nationalId={review.nationalId}
        onClose={() => setDossierOpen(false)}
        backLabel="Back to the submission"
        continueLabel={pending ? "Continue to the decision" : "See the outcome"}
        onContinue={() => {
          setDossierOpen(false);
          goToStage("decision");
        }}
      />
    </>
  );
}
