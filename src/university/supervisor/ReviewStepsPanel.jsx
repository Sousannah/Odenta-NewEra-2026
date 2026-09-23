import { Check, ListChecks, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/Stepper";
import { EmptyState } from "@/components/ui/EmptyState";

/**
 * The step checklist, read from the faculty side.
 *
 * A submission is not one verdict but a list of them: the student ticks the
 * steps they completed, and the supervisor rules on each tick. That is the
 * difference between "returned" and something a student can act on — the
 * declined line names the step.
 *
 * `decidable` splits the two uses. A pending submission gets Accept/Decline
 * buttons on every ticked step; a decided one is the same list, frozen, which
 * is exactly what the student sees on their side.
 */

const VERDICTS = {
  accepted: { tone: "success", label: "Accepted", row: "border-success/30 bg-success-soft/50" },
  declined: { tone: "danger", label: "Declined", row: "border-danger/30 bg-danger-soft/50" },
  rejected: { tone: "danger", label: "Declined", row: "border-danger/30 bg-danger-soft/50" },
};

/** Steps arrive as an array from the fixture and as a keyed object from a form. */
const statusAt = (statuses, index) => statuses?.[index] ?? null;

export function stepTotals(steps = [], statuses) {
  const completed = steps.filter((step) => step.completed).length;
  const decided = steps.reduce(
    (acc, step, index) => {
      if (!step.completed) return acc;
      const verdict = statusAt(statuses, index);
      if (verdict === "accepted") acc.accepted += 1;
      else if (verdict === "declined" || verdict === "rejected") acc.declined += 1;
      else acc.pending += 1;
      return acc;
    },
    { accepted: 0, declined: 0, pending: 0 }
  );
  return { total: steps.length, completed, ...decided };
}

export function ReviewStepsPanel({
  steps = [],
  statuses,
  onStepStatusChange,
  decidable = false,
  className,
}) {
  if (!steps.length) {
    return (
      <EmptyState
        icon={<ListChecks className="h-6 w-6" />}
        title="No step checklist recorded"
        description="This submission was made before the procedure had a published checklist."
        className={cn("py-8", className)}
      />
    );
  }

  const totals = stepTotals(steps, statuses);

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* ------------------------------------------------------- the tally */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-[13px] font-bold text-ink">
            {totals.completed} of {totals.total} steps documented
          </span>
          <span className="flex flex-wrap items-center gap-1.5">
            <Badge tone="success">{totals.accepted} accepted</Badge>
            <Badge tone="danger">{totals.declined} declined</Badge>
            <Badge tone="warning">{totals.pending} undecided</Badge>
          </span>
        </div>
        <ProgressBar
          className="mt-3"
          value={totals.total ? Math.round((totals.completed / totals.total) * 100) : 0}
        />
      </div>

      {/* -------------------------------------------------------- the list */}
      <ul className="flex flex-col gap-2">
        {steps.map((step, index) => {
          const verdict = step.completed ? statusAt(statuses, index) : null;
          const meta = VERDICTS[verdict];
          const label = step.description ?? step.label ?? `Step ${index + 1}`;

          return (
            <li
              key={`${label}-${index}`}
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
                <span className="min-w-0">
                  <span
                    className={cn(
                      "block text-[13px]",
                      step.completed ? "font-semibold text-ink" : "text-ink-soft"
                    )}
                  >
                    {label}
                  </span>
                  {step.note ? (
                    <span className="block text-[11.5px] text-ink-faint">{step.note}</span>
                  ) : null}
                </span>
              </span>

              {!step.completed ? (
                <Badge tone="neutral">Not documented</Badge>
              ) : decidable && !meta ? (
                /* Only a ticked step can be ruled on — there is nothing to
                   accept about work the student never claimed to have done. */
                <span className="flex shrink-0 items-center gap-1.5">
                  <Button
                    variant="secondary"
                    size="xs"
                    leftIcon={<X className="h-3.5 w-3.5" />}
                    onClick={() => onStepStatusChange?.(index, "declined")}
                  >
                    Decline
                  </Button>
                  <Button
                    size="xs"
                    leftIcon={<Check className="h-3.5 w-3.5" />}
                    onClick={() => onStepStatusChange?.(index, "accepted")}
                  >
                    Accept
                  </Button>
                </span>
              ) : meta ? (
                <span className="flex shrink-0 items-center gap-2">
                  <Badge tone={meta.tone}>{meta.label}</Badge>
                  {decidable ? (
                    <Button variant="ghost" size="xs" onClick={() => onStepStatusChange?.(index, null)}>
                      Undo
                    </Button>
                  ) : null}
                </span>
              ) : (
                <Badge tone="warning">Awaiting decision</Badge>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
