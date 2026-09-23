import { useMemo } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Award, GraduationCap, MessageSquareQuote, RotateCcw, TrendingUp } from "lucide-react";
import { cn } from "@/lib/cn";
import { useAsync } from "@/hooks";
import { universityService } from "@/services";
import { formatDate, formatNumber, fromNow } from "@/lib/format";
import { uni } from "@/config/paths";
import { GRADES, REVIEW_STATUS, departmentMeta, gradeFor } from "@/config/academic";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { OdentaLoaderPanel } from "@/components/ui/OdentaLoader";
import { ProgressBar } from "@/components/ui/Stepper";
import { PageHeader, StatCard, StatGrid } from "@/components/shared";
import { LineAreaChart, HorizontalBars } from "@/components/charts";
import { DepartmentChip, ReviewStatusBadge } from "@/university/components";

/**
 * My performance.
 *
 * Analytics answers "how much"; this answers "how well, and what do I do about
 * it". The two things a student can actually act on are the score trend and
 * the supervisors' own words, so both are here in full rather than reduced to
 * a number — a comment saying "contact point open, redo the matrix" is worth
 * more than any average.
 */

const TONE_FOR_GRADE = {
  A: "success",
  B: "brand",
  C: "info",
  D: "warning",
  F: "danger",
};

export default function PerformancePage() {
  const { user } = useOutletContext() ?? {};
  const navigate = useNavigate();
  const studentId = user?.staffId;

  const { data: student, loading } = useAsync(
    () => (studentId ? universityService.getStudent(studentId) : null),
    [studentId]
  );
  const { data: reviews = [] } = useAsync(
    () => universityService.getReviews({ studentId: studentId ?? "all" }),
    [studentId],
    []
  );

  const decided = useMemo(
    () =>
      reviews
        .filter((item) => item.decidedAt)
        .sort((a, b) => String(a.decidedAt).localeCompare(String(b.decidedAt))),
    [reviews]
  );

  const scored = decided.filter((item) => item.score != null);

  const average = scored.length
    ? Math.round(scored.reduce((sum, item) => sum + item.score, 0) / scored.length)
    : null;

  /**
   * The trend, not the average.
   *
   * A student who opened the term at 58 and is now at 84 is doing well; the
   * mean hides that entirely, so the last ten scored steps are plotted in the
   * order they were decided.
   */
  const trend = useMemo(
    () =>
      scored.slice(-10).map((item, index) => ({
        label: `#${index + 1}`,
        score: item.score,
      })),
    [scored]
  );

  /** How the last five compare with the five before them. */
  const momentum = useMemo(() => {
    if (scored.length < 4) return null;
    const half = Math.min(5, Math.floor(scored.length / 2));
    const recent = scored.slice(-half);
    const previous = scored.slice(-half * 2, -half);
    const mean = (list) => list.reduce((sum, item) => sum + item.score, 0) / list.length;
    return Math.round(mean(recent) - mean(previous));
  }, [scored]);

  const gradeMix = useMemo(() => {
    const counts = scored.reduce((acc, item) => {
      const band = gradeFor(item.score).value;
      acc[band] = (acc[band] ?? 0) + 1;
      return acc;
    }, {});
    return GRADES.map((band) => ({ ...band, count: counts[band.value] ?? 0 })).filter(
      (band) => band.count > 0
    );
  }, [scored]);

  /** Average score per rotation — where the marks actually come from. */
  const byDepartment = useMemo(() => {
    const totals = new Map();
    scored.forEach((item) => {
      const current = totals.get(item.department) ?? { sum: 0, count: 0 };
      totals.set(item.department, { sum: current.sum + item.score, count: current.count + 1 });
    });
    return [...totals.entries()]
      .map(([department, value]) => ({
        name: departmentMeta(department).short,
        value: Math.round(value.sum / value.count),
      }))
      .sort((a, b) => b.value - a.value);
  }, [scored]);

  /** Every supervisor comment that came with a non-acceptance. */
  const feedback = useMemo(
    () =>
      decided
        .filter((item) => item.comment && item.status !== REVIEW_STATUS.ACCEPTED)
        .sort((a, b) => String(b.decidedAt).localeCompare(String(a.decidedAt))),
    [decided]
  );

  const praise = useMemo(
    () =>
      decided
        .filter((item) => item.comment && item.status === REVIEW_STATUS.ACCEPTED)
        .sort((a, b) => String(b.decidedAt).localeCompare(String(a.decidedAt)))
        .slice(0, 4),
    [decided]
  );

  if (loading || !student) {
    return <OdentaLoaderPanel />;
  }

  return (
    <div className="flex flex-col gap-4 p-4 sm:gap-5 sm:p-6">
      <PageHeader
        title="My performance"
        description="How your work is being graded, and exactly what the staff asked you to change."
        actions={
          <Button variant="secondary" onClick={() => navigate(uni.reviews)}>
            My reviews
          </Button>
        }
      />

      <StatGrid cols={4}>
        <StatCard
          label="Average score"
          value={average == null ? "—" : `${average}/100`}
          icon={<Award className="h-5 w-5" />}
        />
        <StatCard
          label="Current grade band" value={average == null ? "—" : gradeFor(average).value} tone={average == null ? "brand" : TONE_FOR_GRADE[gradeFor(average).value]}
          icon={<GraduationCap className="h-5 w-5" />}
        />
        <StatCard
          label="Recent momentum"
          value={momentum == null ? "—" : `${momentum > 0 ? "+" : ""}${momentum}`}
          tone={momentum == null ? "brand" : momentum >= 0 ? "success" : "danger"}
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <StatCard
          label="Steps returned"
          value={formatNumber(student.returnedSteps)}
          tone="warning"
          icon={<RotateCcw className="h-5 w-5" />}
        />
      </StatGrid>

      <div className="grid grid-cols-12 gap-5">
        {/* ---------------------------------------------------- score trend */}
        <Card className="col-span-12 xl:col-span-7">
          <CardHeader
            title="Score trend"
            subtitle={
              scored.length
                ? `Your last ${trend.length} scored step(s), oldest first`
                : "No scored steps yet"
            }
          />
          <CardBody className="pt-3">
            {trend.length >= 2 ? (
              <LineAreaChart data={trend} xKey="label" yKey="score" height={240} />
            ) : (
              <EmptyState
                icon={<TrendingUp className="h-6 w-6" />}
                title="Not enough scored steps"
                description="Two or more graded submissions are needed before a trend means anything."
                className="py-10"
              />
            )}
          </CardBody>
        </Card>

        {/* ---------------------------------------------------- grade bands */}
        <Card className="col-span-12 xl:col-span-5">
          <CardHeader title="Grade distribution" subtitle={`${scored.length} graded step(s)`} />
          <CardBody className="pt-3">
            {gradeMix.length ? (
              <ul className="flex flex-col gap-4">
                {gradeMix.map((band) => (
                  <li key={band.value}>
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-[13px] font-bold text-ink">{band.label}</span>
                      <span className="text-[12px] font-bold text-ink-muted">{band.count}</span>
                    </div>
                    <ProgressBar
                      className="mt-2"
                      value={(band.count / scored.length) * 100}
                      tone={band.value === "F" || band.value === "D" ? "warning" : "success"}
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-10 text-center text-[13px] text-ink-soft">Nothing graded yet.</p>
            )}
          </CardBody>
        </Card>

        {/* ------------------------------------------------- by rotation */}
        <Card className="col-span-12 xl:col-span-5">
          <CardHeader
            title="Average score by rotation"
            subtitle="Where you are strongest, and where you are not"
          />
          <CardBody className="pt-4">
            {byDepartment.length ? (
              <HorizontalBars data={byDepartment} valueFormatter={(value) => `${value}`} />
            ) : (
              <p className="py-10 text-center text-[13px] text-ink-soft">
                No scored steps to compare yet.
              </p>
            )}
          </CardBody>
        </Card>

        {/* -------------------------------------------------- what to fix */}
        <Card className="col-span-12 xl:col-span-7">
          <CardHeader
            title="What the staff asked you to change"
            subtitle={`${feedback.length} correction note(s), newest first`}
            action={
              <Badge tone="warning">
                <MessageSquareQuote className="h-3 w-3" />
                Act on these first
              </Badge>
            }
          />
          <CardBody className="pt-2">
            {feedback.length === 0 ? (
              <EmptyState
                icon={<MessageSquareQuote className="h-6 w-6" />}
                title="No corrections outstanding"
                description="Nothing has been returned or rejected with a note."
                className="py-10"
              />
            ) : (
              <ul className="flex flex-col gap-3">
                {feedback.slice(0, 8).map((item) => (
                  <li
                    key={item.id}
                    className={cn(
                      "rounded-2xl border px-4 py-3.5",
                      item.status === REVIEW_STATUS.REJECTED
                        ? "border-danger/30 bg-danger-soft/40"
                        : "border-warning/30 bg-warning-soft/40"
                    )}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="min-w-0">
                        <span className="block truncate text-[13.5px] font-bold text-ink">
                          {item.procedureType}
                        </span>
                        <span className="block truncate text-[12px] text-ink-soft">
                          {item.patientName} · {item.supervisorName} · {fromNow(item.decidedAt)}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-2">
                        <DepartmentChip department={item.department} short />
                        <ReviewStatusBadge status={item.status} />
                      </span>
                    </div>
                    <p className="mt-2.5 rounded-xl bg-white/70 px-3.5 py-2.5 text-[13px] leading-relaxed text-ink">
                      “{item.comment}”
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        {/* ---------------------------------------------------- what worked */}
        {praise.length ? (
          <Card className="col-span-12">
            <CardHeader
              title="What went well"
              subtitle="Notes attached to accepted steps — worth repeating"
            />
            <CardBody className="pt-2">
              <ul className="grid gap-3 md:grid-cols-2">
                {praise.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-2xl border border-success/25 bg-success-soft/40 px-4 py-3.5"
                  >
                    <p className="text-[13px] leading-relaxed text-ink">“{item.comment}”</p>
                    <p className="mt-2 text-[11.5px] font-semibold text-ink-soft">
                      {item.procedureType} · {item.supervisorName} ·{" "}
                      {formatDate(item.decidedAt, "d MMM yyyy")}
                      {item.score != null ? ` · scored ${item.score}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
