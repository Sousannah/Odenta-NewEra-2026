import { useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import {
  ArrowDown,
  ArrowUp,
  Download,
  GraduationCap,
  Info,
  Minus,
  RefreshCw,
  TriangleAlert,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useAsync } from "@/hooks";
import { universityService } from "@/services";
import { ROLES } from "@/auth/roles";
import { uni } from "@/config/paths";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { MiniSelect } from "@/components/ui/Field";
import { SearchInput } from "@/components/ui/Misc";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { PageHeader, Toolbar } from "@/components/shared";
import { StudentScorecardModal } from "./StudentScorecardModal";
import { GradeBadge, ScoreBar, SummaryTile, fmtNum, fmtPct, fmtScore } from "./scoreParts";

/**
 * The cohort scoreboard.
 *
 * A supervisor's real question is not "how many reviews did this student
 * submit" but "who is going to fail this rotation, and why" — so the table is
 * ordered by a score rather than by name, and every number that feeds it is on
 * the row beside it. The score itself is computed server-side and never here:
 * two screens must not be able to disagree about who is failing.
 *
 * The scoring window and the volume target are controls rather than constants
 * because they are faculty policy, and policy differs by year and by campus.
 */

const RANGES = [
  { value: "all", label: "All time" },
  { value: "365d", label: "Last 12 months" },
  { value: "180d", label: "Last 6 months" },
  { value: "90d", label: "Last 90 days" },
  { value: "30d", label: "Last 30 days" },
];

const SORTS = [
  { value: "rank", label: "Score" },
  { value: "name", label: "Name" },
  { value: "submitted", label: "Submissions" },
  { value: "accepted", label: "Accepted" },
  { value: "declined", label: "Declined" },
  { value: "pending", label: "Pending" },
  { value: "acceptance", label: "Acceptance rate" },
];

const GRADES = ["A", "B", "C", "D", "F"];

/** Acceptance against the previous 60 days. `unknown` draws nothing rather than
    an arrow inferred from one review. */
function TrendChip({ trend }) {
  const direction = trend?.direction ?? "unknown";
  const delta = trend?.deltaPct;
  const title =
    direction === "unknown"
      ? "Not enough decided reviews in both windows to compare"
      : direction === "stable"
        ? "Acceptance steady against the previous 60 days"
        : `Acceptance ${direction === "up" ? "up" : "down"} ${Math.abs(delta)} points against the previous 60 days`;

  const Icon = direction === "up" ? ArrowUp : direction === "down" ? ArrowDown : Minus;
  const tone =
    direction === "up" ? "text-success" : direction === "down" ? "text-danger" : "text-ink-faint";

  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap" title={title}>
      <Icon className={cn("h-3.5 w-3.5", tone)} />
      <span className="text-[12px] text-ink-soft">
        {direction === "unknown" || delta == null ? "—" : `${delta > 0 ? "+" : ""}${delta}`}
      </span>
    </span>
  );
}

export default function StudentsPage() {
  const { user, role } = useOutletContext() ?? {};
  const navigate = useNavigate();

  /* A supervisor sees their own students; anybody else with STUDENT_VIEW sees
     the cohort. The server re-derives this — the parameter is a convenience. */
  const supervisorId = role === ROLES.UNI_SUPERVISOR ? user?.staffId ?? "all" : "all";

  const [range, setRange] = useState("all");
  const [target, setTarget] = useState(10);
  const [query, setQuery] = useState("");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("rank");
  const [sortDesc, setSortDesc] = useState(true);
  const [openId, setOpenId] = useState(null);

  const { data: payload, loading, error, refetch } = useAsync(
    () => universityService.getStudentScores({ range, target, supervisorId }),
    [range, target, supervisorId]
  );

  const students = payload?.students ?? [];
  const summary = payload?.summary;
  const weights = payload?.scoring?.weights;

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = students.filter((student) => {
      if (gradeFilter === "unscored" && student.score !== null) return false;
      if (gradeFilter === "atRisk" && !["D", "F"].includes(student.grade)) return false;
      if (!["all", "unscored", "atRisk"].includes(gradeFilter) && student.grade !== gradeFilter) {
        return false;
      }
      if (!needle) return true;
      return [student.name, student.studentNumber, student.email, student.id]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(needle));
    });

    const valueOf = (student) => {
      switch (sortBy) {
        case "name":
          return student.name ?? "";
        case "submitted":
          return student.metrics.submitted;
        case "accepted":
          return student.metrics.accepted;
        case "declined":
          return student.metrics.declined;
        case "pending":
          return student.metrics.pending;
        case "acceptance":
          return student.metrics.acceptanceRatePct;
        default:
          return student.score;
      }
    };

    return [...filtered].sort((a, b) => {
      const av = valueOf(a);
      const bv = valueOf(b);
      /* A student with no value for the chosen measure sinks to the bottom
         whichever way the sort points — they are not the best or the worst. */
      if (av == null && bv == null) return (a.name ?? "").localeCompare(b.name ?? "");
      if (av == null) return 1;
      if (bv == null) return -1;
      const result = typeof av === "string" ? av.localeCompare(bv) : av - bv;
      return sortDesc ? -result : result;
    });
  }, [students, query, gradeFilter, sortBy, sortDesc]);

  const exportCsv = () => {
    const header = [
      "Rank", "Name", "Student number", "Email", "Submitted", "Accepted", "Declined", "Pending",
      "Acceptance %", "Step approval %", "Documentation %", "Volume %", "Resubmitted cases",
      "Avg days to decision", "Score", "Grade", "Provisional",
    ];
    const body = visible.map((student) => [
      student.rank ?? "", student.name, student.studentNumber, student.email,
      student.metrics.submitted, student.metrics.accepted, student.metrics.declined,
      student.metrics.pending, student.metrics.acceptanceRatePct ?? "",
      student.metrics.stepApprovalRatePct ?? "", student.metrics.documentationRatePct ?? "",
      student.metrics.volumeRatePct ?? "", student.metrics.resubmittedCases,
      student.metrics.avgDaysToDecision ?? "", student.score ?? "", student.grade ?? "",
      student.provisional ? "yes" : "no",
    ]);

    const csv = [header, ...body]
      .map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\r\n");

    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `student-scores-${range}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const columns = [
    {
      key: "rank",
      header: "#",
      width: "56px",
      render: (row) => (
        <span className="text-[13px] font-bold text-ink-faint">{row.rank ?? "—"}</span>
      ),
    },
    {
      key: "name",
      header: "Student",
      sortable: true,
      render: (row) => (
        <span className="flex min-w-0 items-center gap-3">
          <Avatar name={row.name} size="sm" />
          <span className="min-w-0">
            <span className="block truncate text-[13.5px] font-bold text-ink">{row.name}</span>
            <span className="block truncate text-[11.5px] text-ink-soft">
              {row.studentNumber} · {row.group}
            </span>
          </span>
        </span>
      ),
    },
    {
      key: "submitted",
      header: "Submitted",
      align: "right",
      sortable: true,
      sortValue: (row) => row.metrics.submitted,
      render: (row) => (
        <span className="text-[13px] font-bold text-ink">{row.metrics.submitted}</span>
      ),
    },
    {
      key: "accepted",
      header: "Accepted",
      align: "right",
      sortValue: (row) => row.metrics.accepted,
      /* A zero carries no signal, so it is not tinted. */
      render: (row) => (
        <span className={cn("text-[13px]", row.metrics.accepted ? "text-success-strong" : "text-ink-faint")}>
          {row.metrics.accepted}
        </span>
      ),
    },
    {
      key: "declined",
      header: "Declined",
      align: "right",
      sortValue: (row) => row.metrics.declined,
      render: (row) => (
        <span className={cn("text-[13px]", row.metrics.declined ? "text-danger" : "text-ink-faint")}>
          {row.metrics.declined}
        </span>
      ),
    },
    {
      key: "pending",
      header: "Pending",
      align: "right",
      sortValue: (row) => row.metrics.pending,
      render: (row) => (
        <span className={cn("text-[13px]", row.metrics.pending ? "text-warning-ink" : "text-ink-faint")}>
          {row.metrics.pending}
        </span>
      ),
    },
    {
      key: "acceptance",
      header: "Acceptance",
      align: "right",
      sortValue: (row) => row.metrics.acceptanceRatePct ?? -1,
      render: (row) => (
        <span className="text-[13px] text-ink-muted">{fmtPct(row.metrics.acceptanceRatePct)}</span>
      ),
    },
    {
      key: "steps",
      header: "Steps",
      align: "right",
      sortValue: (row) => row.metrics.stepApprovalRatePct ?? -1,
      render: (row) => (
        <span className="text-[13px] text-ink-muted">{fmtPct(row.metrics.stepApprovalRatePct)}</span>
      ),
    },
    {
      key: "score",
      header: "Score",
      width: "200px",
      sortValue: (row) => row.score ?? -1,
      render: (row) => (
        <span className="block min-w-0">
          <span className="flex items-center gap-2">
            <span className="w-10 shrink-0 text-right text-[13px] font-extrabold text-ink">
              {fmtScore(row.score)}
            </span>
            <ScoreBar score={row.score} tone={row.tone} />
          </span>
          <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <GradeBadge student={row} />
            {row.provisional ? (
              <span
                className="rounded-full bg-info-soft px-1.5 py-0.5 text-[10px] font-bold uppercase text-info-ink"
                title={`Based on ${row.metrics.submitted} submission(s) and ${row.measuredWeight}/100 weight points of evidence`}
              >
                provisional
              </span>
            ) : null}
          </span>
        </span>
      ),
    },
    {
      key: "trend",
      header: "Trend",
      render: (row) => <TrendChip trend={row.trend} />,
    },
  ];

  return (
    <div className="flex flex-col gap-4 p-4 sm:gap-5 sm:p-6">
      <PageHeader
        title="Students"
        description="Performance scores built from submitted work and faculty decisions."
        actions={
          <>
            <Button
              variant="secondary"
              leftIcon={<RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />}
              onClick={refetch}
            >
              Refresh
            </Button>
            <Button
              leftIcon={<Download className="h-4 w-4" />}
              disabled={!visible.length}
              onClick={exportCsv}
            >
              Export CSV
            </Button>
          </>
        }
      />

      <Toolbar
        left={
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Name, student number or email…"
            className="w-full sm:w-[320px]"
          />
        }
        right={
          <>
            <label className="flex items-center gap-2 text-[12px] font-semibold text-ink-muted">
              Period
              <MiniSelect value={range} onChange={(event) => setRange(event.target.value)}>
                {RANGES.map((entry) => (
                  <option key={entry.value} value={entry.value}>
                    {entry.label}
                  </option>
                ))}
              </MiniSelect>
            </label>
            <label
              className="flex items-center gap-2 text-[12px] font-semibold text-ink-muted"
              title="Submissions that count as a full clinical load"
            >
              Volume target
              <input
                type="number"
                min={1}
                max={200}
                value={target}
                onChange={(event) => setTarget(Math.max(1, Number(event.target.value) || 1))}
                className="h-9 w-20 rounded-xl border border-slate-200 bg-white px-2.5 text-[13px] font-semibold text-ink transition focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-600/10"
              />
            </label>
            <label className="flex items-center gap-2 text-[12px] font-semibold text-ink-muted">
              Sort
              <MiniSelect value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                {SORTS.map((entry) => (
                  <option key={entry.value} value={entry.value}>
                    {entry.label}
                  </option>
                ))}
              </MiniSelect>
            </label>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setSortDesc((value) => !value)}
              leftIcon={sortDesc ? <ArrowDown className="h-4 w-4" /> : <ArrowUp className="h-4 w-4" />}
            >
              {sortDesc ? "Highest first" : "Lowest first"}
            </Button>
          </>
        }
      />

      {error ? (
        <Card>
          <CardBody className="flex items-center gap-3">
            <TriangleAlert className="h-5 w-5 shrink-0 text-danger" />
            <span className="min-w-0 flex-1 text-[13px] text-ink">
              {error.message ?? "Could not load student scores."}
            </span>
            <Button variant="secondary" size="sm" onClick={refetch}>
              Retry
            </Button>
          </CardBody>
        </Card>
      ) : null}

      {summary ? (
        <>
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
            <SummaryTile
              label="Students"
              value={fmtNum(summary.students)}
              hint={
                summary.studentsWithoutSubmissions
                  ? `${summary.studentsWithoutSubmissions} with no submissions`
                  : "all have submitted"
              }
            />
            <SummaryTile
              label="Submissions"
              value={fmtNum(summary.submitted)}
              hint={`${summary.pending} still pending`}
              tone="brand"
            />
            <SummaryTile
              label="Acceptance rate"
              value={fmtPct(summary.acceptanceRatePct)}
              hint={`${summary.accepted} accepted of ${summary.decided} decided`}
              tone="success"
            />
            <SummaryTile
              label="Average score"
              value={fmtScore(summary.averageScore)}
              hint={`median ${fmtScore(summary.medianScore)}`}
              tone="brand"
            />
            <SummaryTile
              label="Needing support"
              value={fmtNum(summary.atRisk)}
              hint="graded D or F"
              tone={summary.atRisk > 0 ? "danger" : undefined}
            />
          </div>

          <Card>
            <CardHeader
              title="Grade distribution"
              subtitle={
                weights
                  ? `Score = acceptance ${weights.acceptance} · steps ${weights.stepApproval} · documentation ${weights.documentation} · volume ${weights.volume}`
                  : undefined
              }
            />
            <CardBody className="flex flex-wrap gap-2 pt-2">
              {GRADES.map((grade) => {
                const active = gradeFilter === grade;
                return (
                  <button
                    key={grade}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setGradeFilter(active ? "all" : grade)}
                    className={cn(
                      "od-focus inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-[13px] transition",
                      active
                        ? "border-brand-600 bg-brand-50/70"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    )}
                  >
                    <span className="font-extrabold text-ink">{grade}</span>
                    <span className="text-ink-muted">{summary.gradeDistribution?.[grade] ?? 0}</span>
                  </button>
                );
              })}
              {summary.studentsWithoutSubmissions > 0 ? (
                <button
                  type="button"
                  aria-pressed={gradeFilter === "unscored"}
                  onClick={() => setGradeFilter(gradeFilter === "unscored" ? "all" : "unscored")}
                  className={cn(
                    "od-focus inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-[13px] transition",
                    gradeFilter === "unscored"
                      ? "border-brand-600 bg-brand-50/70"
                      : "border-slate-200 hover:bg-slate-50"
                  )}
                >
                  <span className="font-semibold text-ink-muted">No submissions</span>
                  <span className="text-ink-muted">{summary.studentsWithoutSubmissions}</span>
                </button>
              ) : null}
              {summary.atRisk > 0 ? (
                <button
                  type="button"
                  aria-pressed={gradeFilter === "atRisk"}
                  onClick={() => setGradeFilter(gradeFilter === "atRisk" ? "all" : "atRisk")}
                  className={cn(
                    "od-focus inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-[13px] transition",
                    gradeFilter === "atRisk"
                      ? "border-danger/40 bg-danger-soft"
                      : "border-slate-200 hover:bg-slate-50"
                  )}
                >
                  <TriangleAlert className="h-3.5 w-3.5 text-danger" />
                  <span className="font-bold text-danger">Needs support</span>
                  <span className="text-ink-muted">{summary.atRisk}</span>
                </button>
              ) : null}
            </CardBody>
          </Card>
        </>
      ) : null}

      <DataTable
        columns={columns}
        rows={visible}
        loading={loading}
        onRowClick={(row) => setOpenId(row.id)}
        emptyTitle="No students match these filters"
        emptyDescription={
          students.length === 0
            ? "No students are registered for this campus yet."
            : "Try clearing the search or the grade filter, or widening the period."
        }
        emptyAction={
          <Button
            variant="secondary"
            leftIcon={<GraduationCap className="h-4 w-4" />}
            onClick={() => {
              setGradeFilter("all");
              setQuery("");
            }}
          >
            Clear filters
          </Button>
        }
      />

      <p className="flex items-center gap-1.5 px-1 text-[12px] text-ink-soft">
        <Info className="h-3.5 w-3.5" />
        Showing {visible.length} of {students.length} students. Components with no data yet are
        excluded and the remaining weights rescaled to 100, so a score always reflects what has
        actually been reviewed.
      </p>

      <StudentScorecardModal
        studentId={openId}
        range={range}
        target={target}
        open={Boolean(openId)}
        onClose={() => setOpenId(null)}
        onOpenProfile={(id) => {
          setOpenId(null);
          navigate(uni.student(id));
        }}
      />
    </div>
  );
}
