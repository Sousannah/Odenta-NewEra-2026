import { useNavigate } from "react-router-dom";
import { ExternalLink, Info } from "lucide-react";
import { cn } from "@/lib/cn";
import { useAsync } from "@/hooks";
import { universityService } from "@/services";
import { formatDate } from "@/lib/format";
import { uni } from "@/config/paths";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { InfoBanner } from "@/components/ui/Misc";
import { GroupedBarChart } from "@/components/charts";
import { ReviewStatusBadge } from "@/university/components";
import { GradeBadge, ScoreBar, SummaryTile, fmtNum, fmtPct, fmtScore, toneOf } from "./scoreParts";

/**
 * One student's score, with the workings shown.
 *
 * The number on the scoreboard is an assessment decision, so this panel exists
 * to make it arguable: every component, its weight, the rate behind it, and
 * the submissions the whole thing is built from. A score a supervisor cannot
 * explain to the student it belongs to is not usable.
 */
export function StudentScorecardModal({ studentId, range, target, open, onClose, onOpenProfile }) {
  const navigate = useNavigate();

  const { data, loading, error } = useAsync(
    () =>
      studentId
        ? universityService.getStudentScorecard(studentId, { range, target })
        : Promise.resolve(null),
    [studentId, range, target]
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={data?.student?.name ?? "Student scorecard"}
      description={
        data?.student
          ? `${data.student.studentNumber} · ${data.student.group} · ${data.student.email}`
          : undefined
      }
      size="xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          {studentId ? (
            <Button
              leftIcon={<ExternalLink className="h-4 w-4" />}
              onClick={() => (onOpenProfile ? onOpenProfile(studentId) : navigate(uni.student(studentId)))}
            >
              Open student record
            </Button>
          ) : null}
        </>
      }
    >
      {loading ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-52 w-full" />
        </div>
      ) : error || !data ? (
        <EmptyState
          title="Scorecard unavailable"
          description={error?.message ?? "This student has no scorecard for the selected period."}
          className="py-12"
        />
      ) : (
        <div className="flex flex-col gap-6">
          {/* ------------------------------------------------ headline score */}
          <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 px-4 py-4 sm:flex-row sm:items-center">
            <span className="flex items-baseline gap-2">
              <span className={cn("text-[40px] font-extrabold leading-none", toneOf(data).text)}>
                {fmtScore(data.score)}
              </span>
              <span className="text-[13px] text-ink-faint">/ 100</span>
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-2">
              <ScoreBar score={data.score} tone={data.tone} />
              <span className="flex flex-wrap items-center gap-2">
                <GradeBadge student={data} size="lg" />
                {data.provisional ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-info-soft px-2 py-0.5 text-[11px] font-bold uppercase text-info-ink">
                    <Info className="h-3 w-3" /> Provisional
                  </span>
                ) : null}
              </span>
            </span>
          </div>

          {data.provisional ? (
            <InfoBanner tone="neutral">
              This score rests on {data.metrics.submitted} submission
              {data.metrics.submitted === 1 ? "" : "s"} and {data.measuredWeight} of 100 weight
              points of measurable evidence. It will firm up as more work is reviewed.
            </InfoBanner>
          ) : null}

          {/* -------------------------------------------- how it was built */}
          <section>
            <h3 className="text-[13px] font-extrabold text-ink">How this score was built</h3>
            <ul className="mt-3 flex flex-col gap-3">
              {data.components.map((component) => (
                <li key={component.key}>
                  <div className="flex flex-wrap items-baseline justify-between gap-3 text-[13px]">
                    <span className="text-ink-muted">
                      {component.label}
                      <span className="ml-1.5 text-[11.5px] text-ink-faint">
                        weight {component.weight}
                      </span>
                    </span>
                    <span className="text-ink-muted">
                      {component.measured ? (
                        <>
                          <strong className="text-ink">{component.points}</strong> /{" "}
                          {component.maxPoints} pts · {fmtPct(component.ratePct)}
                        </>
                      ) : (
                        <span className="text-ink-faint">not measured yet</span>
                      )}
                    </span>
                  </div>
                  <span className="mt-1 block h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                    <span
                      className={cn(
                        "block h-full rounded-full",
                        component.measured ? "bg-brand-500" : "bg-slate-300"
                      )}
                      style={{ width: `${component.measured ? component.ratePct : 0}%` }}
                    />
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* ----------------------------------------------- review counts */}
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SummaryTile label="Submitted" value={fmtNum(data.metrics.submitted)} />
            <SummaryTile
              label="Accepted"
              value={fmtNum(data.metrics.accepted)}
              tone={data.metrics.accepted ? "success" : undefined}
            />
            <SummaryTile
              label="Declined"
              value={fmtNum(data.metrics.declined)}
              tone={data.metrics.declined ? "danger" : undefined}
            />
            <SummaryTile
              label="Pending"
              value={fmtNum(data.metrics.pending)}
              tone={data.metrics.pending ? "warning" : undefined}
            />
          </section>

          <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SummaryTile
              label="Steps approved"
              value={fmtPct(data.metrics.stepApprovalRatePct)}
              hint={`${data.metrics.acceptedSteps} of ${data.metrics.gradedSteps} graded steps`}
            />
            <SummaryTile
              label="Documentation"
              value={fmtPct(data.metrics.documentationRatePct)}
              hint={`${data.metrics.stepsTicked} of ${data.metrics.stepsTotal} steps ticked`}
            />
            <SummaryTile
              label="Resubmitted cases"
              value={fmtPct(data.metrics.resubmissionRatePct)}
              hint={`${data.metrics.resubmittedCases} of ${data.metrics.cases} cases`}
            />
            <SummaryTile
              label="Days to decision"
              value={data.metrics.avgDaysToDecision ?? "—"}
              hint="average, submission to decision"
            />
          </section>

          {/* -------------------------------------------- monthly outcomes */}
          <section>
            <h3 className="mb-3 text-[13px] font-extrabold text-ink">
              Submissions and outcomes by month
            </h3>
            {data.monthly.some((entry) => entry.submitted > 0) ? (
              <GroupedBarChart
                data={data.monthly}
                xKey="label"
                height={220}
                series={[
                  { key: "accepted", label: "Accepted", color: "#20B2AA" },
                  { key: "declined", label: "Declined", color: "#E5484D" },
                  { key: "pending", label: "Pending", color: "#94A3B8" },
                ]}
              />
            ) : (
              <p className="text-[13px] text-ink-soft">No submissions in this period.</p>
            )}
          </section>

          {/* ------------------------------------------------ per discipline */}
          {data.byProcedure.length ? (
            <section>
              <h3 className="mb-3 text-[13px] font-extrabold text-ink">By discipline</h3>
              <div className="od-scroll-x overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-[13px]">
                  <thead className="bg-slate-50/80">
                    <tr>
                      {["Discipline", "Submitted", "Accepted", "Declined", "Pending", "Acceptance"].map(
                        (heading, index) => (
                          <th
                            key={heading}
                            className={cn(
                              "whitespace-nowrap border-b border-slate-200 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.06em] text-ink-soft",
                              index > 0 && "text-right"
                            )}
                          >
                            {heading}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {data.byProcedure.map((row) => (
                      <tr key={row.procedureType} className="border-t border-slate-100">
                        <td className="px-3 py-2 font-semibold text-ink">{row.procedureType}</td>
                        <td className="px-3 py-2 text-right text-ink-muted">{row.submitted}</td>
                        <td
                          className={cn(
                            "px-3 py-2 text-right",
                            row.accepted ? "text-success-strong" : "text-ink-faint"
                          )}
                        >
                          {row.accepted}
                        </td>
                        <td
                          className={cn(
                            "px-3 py-2 text-right",
                            row.declined ? "text-danger" : "text-ink-faint"
                          )}
                        >
                          {row.declined}
                        </td>
                        <td
                          className={cn(
                            "px-3 py-2 text-right",
                            row.pending ? "text-warning-ink" : "text-ink-faint"
                          )}
                        >
                          {row.pending}
                        </td>
                        <td className="px-3 py-2 text-right text-ink-muted">
                          {fmtPct(row.acceptanceRatePct)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          {/* ---------------------------------------------- recent submissions */}
          {data.recentReviews.length ? (
            <section>
              <h3 className="mb-3 text-[13px] font-extrabold text-ink">
                Recent submissions{" "}
                <span className="font-semibold text-ink-faint">
                  (most recent {data.recentReviews.length})
                </span>
              </h3>
              <ul className="flex max-h-72 flex-col gap-2 overflow-y-auto pr-1">
                {data.recentReviews.map((review) => (
                  <li
                    key={review.id}
                    className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 px-3.5 py-2.5"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-bold text-ink">
                        {review.procedureType}
                      </span>
                      <span className="block truncate text-[11.5px] text-ink-soft">
                        {review.patientName} · submitted{" "}
                        {formatDate(review.submittedDate, "d MMM yyyy")}
                        {review.reviewedDate
                          ? ` · decided ${formatDate(review.reviewedDate, "d MMM yyyy")}`
                          : ""}
                      </span>
                      {review.comment ? (
                        <span className="mt-1 block truncate text-[11.5px] text-ink-muted">
                          “{review.comment}”
                        </span>
                      ) : null}
                    </span>
                    <ReviewStatusBadge status={review.status} />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      )}
    </Modal>
  );
}
