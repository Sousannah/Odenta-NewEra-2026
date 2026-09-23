import { useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import {
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Layers,
  RotateCcw,
  Target,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useAsync } from "@/hooks";
import { universityService } from "@/services";
import { formatDate, fromNow } from "@/lib/format";
import { toDateKey } from "@/lib/time";
import { uni } from "@/config/paths";
import { DEPARTMENTS, REVIEW_STATUS, departmentMeta, gradeFor } from "@/config/academic";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { MiniSelect } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/EmptyState";
import { OdentaLoaderPanel } from "@/components/ui/OdentaLoader";
import { InfoBanner } from "@/components/ui/Misc";
import { ProgressBar } from "@/components/ui/Stepper";
import { PageHeader, StatCard } from "@/components/shared";
import {
  AcademicYearChip,
  DepartmentChip,
  ProgressRing,
  ReviewStatusBadge,
} from "@/university/components";

/**
 * The student's requirement sheet.
 *
 * The faculty view is a cohort grid — "which department is the whole group
 * short in". A student needs the opposite: everything about their own quota in
 * one place, because the question they are actually asking is "what do I still
 * have to do, in which rotation, and how long have I got". So each rotation
 * expands into the steps that were accepted against it, what remains, and the
 * pace needed to clear it before the term ends.
 */

const DAY_MS = 86_400_000;

/** Where a rotation stands, as the student would describe it. */
const standingFor = (percent) => {
  if (percent >= 100) return { label: "Cleared", tone: "success" };
  if (percent >= 70) return { label: "On track", tone: "brand" };
  if (percent >= 40) return { label: "Behind", tone: "warning" };
  return { label: "At risk", tone: "danger" };
};

const ringTone = (percent) =>
  percent >= 100 ? "success" : percent >= 70 ? "brand" : percent >= 40 ? "warning" : "danger";

/* --------------------------------------------------------- a rotation card */

function RotationCard({ entry, steps, weeksLeft, expanded, onToggle }) {
  const meta = departmentMeta(entry.department);
  const percent = entry.required ? Math.round((entry.completed / entry.required) * 100) : 0;
  const remaining = Math.max(entry.required - entry.completed, 0);
  const standing = standingFor(percent);

  const accepted = steps.filter((item) => item.status === REVIEW_STATUS.ACCEPTED);
  const pending = steps.filter((item) => item.status === REVIEW_STATUS.PENDING);
  const returned = steps.filter((item) => item.status === REVIEW_STATUS.RETURNED);
  const scored = accepted.filter((item) => item.score != null);
  const averageScore = scored.length
    ? Math.round(scored.reduce((sum, item) => sum + item.score, 0) / scored.length)
    : null;

  const lastAccepted = accepted
    .slice()
    .sort((a, b) => String(b.decidedAt).localeCompare(String(a.decidedAt)))[0];

  /* how many cases a week clears the gap before the term ends */
  const pace = remaining && weeksLeft > 0 ? (remaining / weeksLeft).toFixed(1) : null;

  return (
    <Card className={cn(percent >= 100 && "border-success/30")}>
      <CardHeader
        title={meta.label}
        subtitle={`${entry.completed} of ${entry.required} case(s) accepted`}
        action={<Badge tone={standing.tone}>{standing.label}</Badge>}
      />
      <CardBody className="flex flex-col gap-4 pt-2">
        <div className="flex items-center gap-5">
          <ProgressRing value={percent} size={86} sublabel="of quota" tone={ringTone(percent)} />
          <div className="min-w-0 flex-1">
            <ProgressBar value={Math.min(percent, 100)} tone={ringTone(percent)} />
            <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-slate-50 px-2 py-2">
                <dt className="od-label">Done</dt>
                <dd className="mt-0.5 text-[15px] font-extrabold text-ink">{entry.completed}</dd>
              </div>
              <div className="rounded-xl bg-slate-50 px-2 py-2">
                <dt className="od-label">Left</dt>
                <dd
                  className={cn(
                    "mt-0.5 text-[15px] font-extrabold",
                    remaining ? "text-warning-ink" : "text-success-strong"
                  )}
                >
                  {remaining}
                </dd>
              </div>
              <div className="rounded-xl bg-slate-50 px-2 py-2">
                <dt className="od-label">Avg score</dt>
                <dd className="mt-0.5 text-[15px] font-extrabold text-ink">
                  {averageScore ?? "—"}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* The quota above counts cases; these count the individual steps
            submitted inside them, so both numbers are spelled out. */}
        <div className="flex flex-wrap items-center gap-2">
          {steps.length === 0 ? (
            <span className="text-[12.5px] text-ink-soft">
              No steps submitted in this rotation yet.
            </span>
          ) : (
            <>
              <Badge tone="success">
                <CheckCircle2 className="h-3 w-3" />
                {accepted.length} step(s) accepted
              </Badge>
              <Badge tone="warning">
                <ClipboardCheck className="h-3 w-3" />
                {pending.length} awaiting sign-off
              </Badge>
              {returned.length ? (
                <Badge tone="info">
                  <RotateCcw className="h-3 w-3" />
                  {returned.length} to correct
                </Badge>
              ) : null}
              {averageScore != null ? (
                <Badge tone={gradeFor(averageScore).tone}>
                  Grade {gradeFor(averageScore).value}
                </Badge>
              ) : null}
            </>
          )}
        </div>

        <div className="grid gap-2 text-[12.5px] text-ink-muted sm:grid-cols-2">
          <span>
            <span className="font-bold text-ink">Last accepted:</span>{" "}
            {lastAccepted ? `${lastAccepted.procedureType} · ${fromNow(lastAccepted.decidedAt)}` : "—"}
          </span>
          <span>
            <span className="font-bold text-ink">Pace to clear:</span>{" "}
            {remaining === 0
              ? "Quota cleared"
              : pace
                ? `${pace} case(s) per week`
                : "Term has ended"}
          </span>
        </div>

        {steps.length ? (
          <div className="border-t border-slate-100 pt-3">
            <Button variant="link" size="sm" onClick={() => onToggle(entry.department)}>
              {expanded ? "Hide" : "Show"} the {steps.length} step(s) submitted in this rotation
            </Button>

            {expanded ? (
              <ul className="mt-3 flex flex-col gap-2">
                {steps
                  .slice()
                  .sort((a, b) =>
                    String(b.submittedAt).localeCompare(String(a.submittedAt))
                  )
                  .map((item) => (
                    <li
                      key={item.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2.5"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-[12.5px] font-bold text-ink">
                          {item.procedureType}
                          <span className="ml-1.5 font-semibold text-ink-faint">
                            step {item.stepIndex}/{item.stepTotal}
                          </span>
                        </span>
                        <span className="block truncate text-[11.5px] text-ink-soft">
                          {item.patientName} · tooth {item.tooth} ·{" "}
                          {item.decidedAt
                            ? `decided ${fromNow(item.decidedAt)}`
                            : `submitted ${fromNow(item.submittedAt)}`}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-2">
                        {item.score != null ? (
                          <span className="rounded-lg bg-slate-100 px-2 py-1 text-[11.5px] font-extrabold text-ink-muted">
                            {item.score}
                          </span>
                        ) : null}
                        <ReviewStatusBadge status={item.status} />
                      </span>
                    </li>
                  ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </CardBody>
    </Card>
  );
}

/* ---------------------------------------------------------------- the page */

export default function StudentRequirements() {
  const { user, campus } = useOutletContext() ?? {};
  const navigate = useNavigate();
  const studentId = user?.staffId;

  const [department, setDepartment] = useState("all");
  const [expanded, setExpanded] = useState(null);

  const { data: rows = [], loading } = useAsync(
    () => universityService.getRequirements({ studentId: studentId ?? "all" }),
    [studentId],
    []
  );
  const { data: reviews = [] } = useAsync(
    () => universityService.getReviews({ studentId: studentId ?? "all" }),
    [studentId],
    []
  );

  const sheet = rows[0] ?? null;
  const requirements = useMemo(() => sheet?.requirements ?? [], [sheet]);

  /** Steps bucketed by rotation, so a card is one lookup rather than a scan. */
  const stepsByDepartment = useMemo(() => {
    const map = new Map();
    reviews.forEach((item) => {
      const list = map.get(item.department) ?? [];
      list.push(item);
      map.set(item.department, list);
    });
    return map;
  }, [reviews]);

  const totals = useMemo(
    () =>
      requirements.reduce(
        (acc, entry) => ({
          required: acc.required + entry.required,
          completed: acc.completed + entry.completed,
        }),
        { required: 0, completed: 0 }
      ),
    [requirements]
  );

  const remaining = Math.max(totals.required - totals.completed, 0);
  const percent = totals.required ? Math.round((totals.completed / totals.required) * 100) : 0;
  const cleared = requirements.filter((entry) => entry.completed >= entry.required).length;
  const atRisk = requirements.filter(
    (entry) => entry.required && entry.completed / entry.required < 0.4
  ).length;

  /* whole weeks left in the term — the denominator behind every "pace" figure */
  const weeksLeft = useMemo(() => {
    if (!campus?.termEnd) return 0;
    const days = Math.ceil((new Date(`${campus.termEnd}T00:00:00`) - new Date()) / DAY_MS);
    return Math.max(Math.ceil(days / 7), 0);
  }, [campus?.termEnd]);

  const daysLeft = useMemo(() => {
    if (!campus?.termEnd) return null;
    return Math.max(
      Math.ceil((new Date(`${campus.termEnd}T00:00:00`) - new Date()) / DAY_MS),
      0
    );
  }, [campus?.termEnd]);

  const pending = reviews.filter((item) => item.status === REVIEW_STATUS.PENDING);
  const returned = reviews.filter((item) => item.status === REVIEW_STATUS.RETURNED);
  const rejected = reviews.filter((item) => item.status === REVIEW_STATUS.REJECTED);

  const visible = useMemo(
    () =>
      requirements.filter((entry) => department === "all" || entry.department === department),
    [requirements, department]
  );

  if (loading) {
    return <OdentaLoaderPanel />;
  }

  if (!sheet) {
    return (
      <div className="flex flex-col gap-4 p-4 sm:gap-5 sm:p-6">
        <PageHeader title="Requirements" description="Your rotation quota." />
        <EmptyState
          title="No requirement sheet"
          description="Nothing has been published against your enrolment yet."
          className="od-card py-16"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 sm:gap-5 sm:p-6">
      <PageHeader
        title="Requirements"
        description="Every rotation quota you have to clear before the end of the term, and where you stand in each."
        actions={
          <div className="flex items-center gap-2">
            <MiniSelect
              className="h-9"
              value={department}
              onChange={(event) => setDepartment(event.target.value)}
            >
              <option value="all">All rotations</option>
              {DEPARTMENTS.filter((item) =>
                requirements.some((entry) => entry.department === item.key)
              ).map((item) => (
                <option key={item.key} value={item.key}>
                  {item.label}
                </option>
              ))}
            </MiniSelect>
            <Button variant="secondary" onClick={() => navigate(uni.performance)}>
              My performance
            </Button>
          </div>
        }
      />

      {atRisk ? (
        <InfoBanner tone="warning">
          {atRisk} rotation{atRisk === 1 ? " is" : "s are"} below 40% of quota with{" "}
          {daysLeft ?? "—"} day(s) left in the term. Book the cases you still need before the
          rotation closes.
        </InfoBanner>
      ) : null}

      {/* ------------------------------------------------------ the headline */}
      <div className="grid grid-cols-12 gap-5">
        <Card className="col-span-12 xl:col-span-5">
          <CardHeader
            title={sheet.studentName}
            subtitle={`${sheet.group} · ${campus?.term ?? "Term"} ${campus?.academicYear ?? ""}`.trimEnd()}
            action={<AcademicYearChip year={sheet.academicYear} />}
          />
          <CardBody className="flex items-center gap-6 pt-2">
            <ProgressRing value={percent} size={116} sublabel="of quota" tone={ringTone(percent)} />
            <dl className="min-w-0 flex-1 space-y-2.5">
              {[
                { label: "Cases required", value: totals.required },
                { label: "Cases accepted", value: totals.completed },
                { label: "Still to clear", value: remaining },
                { label: "Average score", value: sheet.averageScore ?? "—" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-baseline justify-between gap-3 border-b border-slate-100 pb-2 last:border-0 last:pb-0"
                >
                  <dt className="text-[12.5px] font-semibold text-ink-muted">{item.label}</dt>
                  <dd className="text-[15px] font-extrabold text-ink">{item.value}</dd>
                </div>
              ))}
            </dl>
          </CardBody>
        </Card>

        <div className="col-span-12 grid grid-cols-2 gap-3 sm:gap-4 xl:col-span-7 xl:content-start">
          <StatCard
            label="Rotations cleared"
            value={`${cleared} / ${requirements.length}`}
            tone="success"
            icon={<Target className="h-5 w-5" />}
          />
          <StatCard
            label="Cases still to clear"
            value={remaining}
            tone={remaining ? "warning" : "success"}
            icon={<Layers className="h-5 w-5" />}
          />
          <StatCard
            label="Awaiting sign-off"
            value={pending.length}
            tone="brand"
            icon={<ClipboardCheck className="h-5 w-5" />}
          />
          <StatCard
            label="Days left in term"
            value={daysLeft ?? "—"}
            tone={daysLeft != null && daysLeft < 21 ? "danger" : "brand"}
            icon={<CalendarClock className="h-5 w-5" />}
          />
          <StatCard
            label="To correct and resubmit"
            value={returned.length}
            tone="warning"
            icon={<RotateCcw className="h-5 w-5" />}
          />
          <StatCard
            label="Rejected steps"
            value={rejected.length}
            tone={rejected.length ? "danger" : "success"}
            icon={<XCircle className="h-5 w-5" />}
          />
        </div>
      </div>

      {/* -------------------------------------------------- the quota summary */}
      <Card>
        <CardHeader
          title="Quota at a glance"
          subtitle={`${requirements.length} rotation(s) · ${campus?.termEnd ? `term ends ${formatDate(campus.termEnd, "d MMM yyyy")}` : "term dates unpublished"}`}
        />
        <CardBody className="pt-2">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200">
                  {["Rotation", "Required", "Accepted", "Remaining", "Progress", "Standing"].map(
                    (header) => (
                      <th key={header} className="od-label px-3 py-2.5">
                        {header}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {visible.map((entry) => {
                  const entryPercent = entry.required
                    ? Math.round((entry.completed / entry.required) * 100)
                    : 0;
                  const standing = standingFor(entryPercent);
                  return (
                    <tr
                      key={entry.department}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60"
                    >
                      <td className="px-3 py-3">
                        <DepartmentChip department={entry.department} />
                      </td>
                      <td className="px-3 py-3 text-[13px] font-semibold text-ink-muted">
                        {entry.required}
                      </td>
                      <td className="px-3 py-3 text-[13px] font-bold text-ink">{entry.completed}</td>
                      <td className="px-3 py-3 text-[13px] font-bold text-warning-ink">
                        {Math.max(entry.required - entry.completed, 0)}
                      </td>
                      <td className="w-[220px] px-3 py-3">
                        <div className="flex items-center gap-2.5">
                          <ProgressBar
                            value={Math.min(entryPercent, 100)}
                            tone={ringTone(entryPercent)}
                            className="flex-1"
                          />
                          <span className="shrink-0 text-[12px] font-extrabold text-ink-muted">
                            {entryPercent}%
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <Badge tone={standing.tone}>{standing.label}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {/* ------------------------------------------------- rotation by rotation */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-ink-soft" />
          <h3 className="text-[15px] font-extrabold text-ink">Rotation by rotation</h3>
        </div>

        {visible.length === 0 ? (
          <EmptyState
            title="No rotations match that filter"
            description="Clear the rotation filter to see the whole sheet."
            className="od-card py-14"
          />
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {visible.map((entry) => (
              <RotationCard
                key={entry.department}
                entry={entry}
                steps={stepsByDepartment.get(entry.department) ?? []}
                weeksLeft={weeksLeft}
                expanded={expanded === entry.department}
                onToggle={(key) => setExpanded((current) => (current === key ? null : key))}
              />
            ))}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------ recent credit */}
      <Card>
        <CardHeader
          title="Recently credited steps"
          subtitle="The accepted steps that moved these numbers"
          action={
            <Button variant="link" size="sm" onClick={() => navigate(uni.reviews)}>
              All reviews
            </Button>
          }
        />
        <CardBody className="pt-2">
          {(() => {
            const credited = reviews
              .filter((item) => item.status === REVIEW_STATUS.ACCEPTED && item.decidedAt)
              .sort((a, b) => String(b.decidedAt).localeCompare(String(a.decidedAt)))
              .slice(0, 8);

            if (credited.length === 0) {
              return (
                <EmptyState
                  icon={<CheckCircle2 className="h-6 w-6" />}
                  title="Nothing credited yet"
                  description="Accepted steps count toward your quota and appear here."
                  className="py-10"
                />
              );
            }

            return (
              <ul className="grid gap-2.5 md:grid-cols-2">
                {credited.map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 px-3.5 py-3"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-bold text-ink">
                        {item.procedureType}
                      </span>
                      <span className="block truncate text-[12px] text-ink-soft">
                        {item.patientName} ·{" "}
                        {item.decidedAt === toDateKey()
                          ? "today"
                          : formatDate(item.decidedAt, "d MMM yyyy")}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <DepartmentChip department={item.department} short />
                      {item.score != null ? (
                        <Badge tone={gradeFor(item.score).tone}>{item.score}</Badge>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ul>
            );
          })()}
        </CardBody>
      </Card>
    </div>
  );
}
