import { useEffect, useState } from "react";
import { BadgeCheck, CircleSlash, Paperclip, RotateCcw } from "lucide-react";
import { DrawerShell } from "./DrawerShell";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field, Textarea, Input } from "@/components/ui/Field";
import { SegmentedControl } from "@/components/ui/Tabs";
import { InfoBanner } from "@/components/ui/Misc";
import { formatDate, fromNow } from "@/lib/format";
import { REVIEW_STATUS, gradeFor } from "@/config/academic";
import { DepartmentChip, DetailGrid, ReviewStatusBadge } from "./index";

const DECISIONS = [
  { value: REVIEW_STATUS.ACCEPTED, label: "Accept" },
  { value: REVIEW_STATUS.RETURNED, label: "Return" },
  { value: REVIEW_STATUS.REJECTED, label: "Reject" },
];

/**
 * The checklist behind the verdict.
 *
 * "Returned" on its own tells a student nothing actionable; the step that was
 * declined does. Both sides read the same list, which is the point — a
 * supervisor's "redo the matrix" lands next to the step it refers to.
 */
function StepChecklist({ review }) {
  const statusAt = (index) =>
    review.stepStatuses?.[index] ?? review.reviewSteps[index]?.supervisorStatus ?? null;

  const TONES = {
    accepted: { row: "border-success/30 bg-success-soft/50", tone: "success", label: "Accepted" },
    declined: { row: "border-danger/30 bg-danger-soft/50", tone: "danger", label: "Declined" },
    rejected: { row: "border-danger/30 bg-danger-soft/50", tone: "danger", label: "Declined" },
  };

  return (
    <section className="min-w-0">
      <span className="od-label">Review steps</span>
      <ul className="mt-2 flex flex-col gap-2">
        {review.reviewSteps.map((step, index) => {
          const status = step.completed ? statusAt(index) : null;
          const meta = TONES[status];
          return (
            <li
              key={`${step.description}-${index}`}
              className={cn(
                "flex flex-wrap items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5",
                meta?.row ??
                  (step.completed ? "border-warning/30 bg-warning-soft/40" : "border-slate-200")
              )}
            >
              <span className="flex min-w-0 items-center gap-2.5">
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
                    "min-w-0 text-[13px]",
                    step.completed ? "font-semibold text-ink" : "text-ink-soft"
                  )}
                >
                  {step.description}
                </span>
              </span>
              {step.completed ? (
                <Badge tone={meta?.tone ?? "warning"}>{meta?.label ?? "Pending"}</Badge>
              ) : (
                <Badge tone="neutral">Not done</Badge>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/**
 * One submitted step, opened from either side of the review loop.
 *
 * `decidable` is what separates the two uses: a student reads the supervisor's
 * verdict, a supervisor records one. Keeping both in one panel means the
 * student sees exactly the record their supervisor was looking at.
 */
export function ReviewDrawer({ review, open, onClose, decidable = false, onDecide }) {
  const [decision, setDecision] = useState(REVIEW_STATUS.ACCEPTED);
  const [comment, setComment] = useState("");
  const [score, setScore] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setDecision(REVIEW_STATUS.ACCEPTED);
    setComment("");
    setScore("");
    setError(null);
  }, [open, review?.id]);

  if (!review) return null;

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const numeric = score === "" ? null : Number(score);
      await onDecide?.({
        status: decision,
        comment: comment.trim() || null,
        score: decision === REVIEW_STATUS.ACCEPTED ? numeric : null,
        grade: decision === REVIEW_STATUS.ACCEPTED && numeric != null ? gradeFor(numeric).value : null,
      });
      onClose?.();
    } catch (cause) {
      setError(cause?.message ?? "Could not record the decision");
    } finally {
      setBusy(false);
    }
  };

  const pending = review.status === REVIEW_STATUS.PENDING;

  return (
    <DrawerShell
      open={open}
      onClose={onClose}
      title={review.procedureType}
      description={`${review.patientName} · step ${review.stepIndex} of ${review.stepTotal}`}
      badges={
        <>
          <ReviewStatusBadge status={review.status} />
          <DepartmentChip department={review.department} />
          {review.attachments ? (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2 py-1 text-[11.5px] font-bold text-ink-muted">
              <Paperclip className="h-3 w-3" />
              {review.attachments} attachment{review.attachments === 1 ? "" : "s"}
            </span>
          ) : null}
        </>
      }
      footer={
        decidable && pending ? (
          <div className="flex items-center justify-end gap-2">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={submit}
              loading={busy}
              variant={decision === REVIEW_STATUS.REJECTED ? "danger" : "primary"}
              leftIcon={
                decision === REVIEW_STATUS.ACCEPTED ? (
                  <BadgeCheck className="h-4 w-4" />
                ) : decision === REVIEW_STATUS.RETURNED ? (
                  <RotateCcw className="h-4 w-4" />
                ) : (
                  <CircleSlash className="h-4 w-4" />
                )
              }
            >
              {DECISIONS.find((item) => item.value === decision)?.label} step
            </Button>
          </div>
        ) : null
      }
    >
      <div className="flex flex-col gap-6">
        <DetailGrid
          columns={2}
          items={[
            { label: "Case", value: review.caseId },
            { label: "Tooth", value: review.tooth },
            { label: "Student", value: review.studentName },
            { label: "Supervisor", value: review.supervisorName },
            { label: "Submitted", value: `${formatDate(review.submittedAt, "d MMM yyyy")} · ${fromNow(review.submittedAt)}` },
            {
              label: "Decided",
              value: review.decidedAt ? formatDate(review.decidedAt, "d MMM yyyy, HH:mm") : "—",
            },
          ]}
        />

        {review.reviewSteps?.length ? <StepChecklist review={review} /> : null}

        {review.comment ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <span className="od-label">Staff member's note</span>
            <p className="mt-2 text-[13.5px] leading-relaxed text-ink">{review.comment}</p>
          </div>
        ) : null}

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

        {decidable && pending ? (
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
              label={decision === REVIEW_STATUS.ACCEPTED ? "Note (optional)" : "What must be corrected"}
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

            {error ? (
              <InfoBanner tone="warning">{error}</InfoBanner>
            ) : null}
          </div>
        ) : null}

        {!decidable && review.status === REVIEW_STATUS.RETURNED ? (
          <InfoBanner tone="warning">
            Correct the work, then resubmit this step. It keeps its original submission date.
          </InfoBanner>
        ) : null}
      </div>
    </DrawerShell>
  );
}
