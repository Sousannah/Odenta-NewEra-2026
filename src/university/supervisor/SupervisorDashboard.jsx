import { useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import {
  BadgeCheck,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FolderOpen,
  FlaskConical,
  GraduationCap,
  Signature,
  Timer,
  TrendingDown,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useAsync, useDebounced } from "@/hooks";
import { universityService } from "@/services";
import { formatDate, formatNumber, fromNow } from "@/lib/format";
import { ROLES } from "@/auth/roles";
import { DEPARTMENTS, REVIEW_STATUS } from "@/config/academic";
import { uni } from "@/config/paths";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import { MiniSelect } from "@/components/ui/Field";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { OdentaLoaderPanel } from "@/components/ui/OdentaLoader";
import { EmptyState } from "@/components/ui/EmptyState";
import { InfoBanner, SearchInput } from "@/components/ui/Misc";
import { SegmentedControl } from "@/components/ui/Tabs";
import { useToast } from "@/components/ui/Toast";
import { DashboardShell } from "@/components/shared";
import { GroupedBarChart, HorizontalBars } from "@/components/charts";
import {
  DepartmentChip,
  LabStatusBadge,
  ProgressRing,
  ReviewStatusBadge,
} from "@/university/components";
import { SignatureManager } from "./SignatureManager";
import { ReviewDecisionModal } from "./ReviewDecisionModal";
import { PatientDossierModal } from "./PatientDossierModal";

/**
 * Clinical supervisor.
 *
 * The queue is the job, and this screen is built around it: everything above
 * the fold answers "what is blocked on me", everything below answers "which of
 * my students is falling behind". The review table carries the faculty's own
 * filters — student, discipline, outcome, period — because a supervisor
 * covering two rotations is looking for one of them at a time.
 */

const DATE_FILTERS = [
  { key: "all", label: "All time" },
  { key: "today", label: "Today" },
  { key: "week", label: "This week" },
  { key: "month", label: "This month" },
];

const DAY = 86400000;

/**
 * The period filter, as a boundary the server can index on.
 *
 * Computed here rather than sent as a keyword because "today" starts at the
 * supervisor's midnight, not Greenwich's — a demonstrator in Alamein deciding a
 * step at 01:00 local has decided it *today*, and a server-side `UTC date ==`
 * would put it yesterday. Sending the instant keeps the timezone where the
 * person is and still lets the query use the index.
 */
function periodStart(period) {
  if (period === "all") return undefined;
  if (period === "today") {
    const midnight = new Date();
    midnight.setHours(0, 0, 0, 0);
    return midnight.toISOString();
  }
  return new Date(Date.now() - (period === "week" ? 7 : 31) * DAY).toISOString();
}

export default function SupervisorDashboard() {
  const { user } = useOutletContext() ?? {};
  const navigate = useNavigate();
  const toast = useToast();
  const supervisorId = user?.staffId;

  const [tab, setTab] = useState("pending");
  const [selected, setSelected] = useState(null);
  const [dossierId, setDossierId] = useState(null);
  const [signatureOpen, setSignatureOpen] = useState(false);

  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("all");
  const [status, setStatus] = useState("all");
  const [period, setPeriod] = useState("all");

  /**
   * The table's rows, fetched with the filters already applied.
   *
   * This screen used to pull every step ever submitted to this supervisor and
   * filter the array in the browser — which meant the cost of opening the
   * dashboard grew with the supervisor's career, and every keystroke in the
   * search box re-filtered thousands of rows. The filters now travel to the
   * server, which answers them from an index, and the search term is debounced
   * so typing costs one request rather than one per character.
   */
  const debouncedQuery = useDebounced(query, 300);

  const { data: rows = [], loading, refetch } = useAsync(
    () =>
      universityService.getReviews({
        supervisorId: supervisorId ?? "all",
        /* "decided" is the server's word for "not pending" — the Completed tab
           must not fall back to no filter at all, or it shows the queue too. */
        status: tab === "pending" ? REVIEW_STATUS.PENDING : status === "all" ? "decided" : status,
        department,
        q: debouncedQuery || undefined,
        from: periodStart(period),
        limit: 100,
      }),
    [supervisorId, tab, status, department, debouncedQuery, period],
    []
  );

  const { data: students = [] } = useAsync(
    () => universityService.getStudents({ supervisorId: supervisorId ?? "all" }),
    [supervisorId],
    []
  );
  const { data: labRequests = [] } = useAsync(
    () =>
      universityService.getLabRequests({
        supervisorId: supervisorId ?? "all",
        status: "pending",
      }),
    [supervisorId],
    []
  );
  const { data: dashboard, refetch: refetchDashboard } = useAsync(
    () => universityService.getDashboard(ROLES.UNI_SUPERVISOR),
    []
  );
  const { data: signature, refetch: refetchSignature } = useAsync(
    () => universityService.getSignature(),
    []
  );

  /**
   * The KPI strip reads counters the server computed, not `rows.length`.
   *
   * The rows in hand are one filtered page, so counting them would make the
   * tiles agree with the table and disagree with reality — "3 awaiting sign-off"
   * because the department filter is set. The dashboard payload carries the
   * true totals, folded from the same lane read that drew the charts, and costs
   * nothing extra.
   */
  const counts = dashboard?.counts ?? {};

  const atRisk = useMemo(
    () =>
      [...students]
        .filter((item) => item.progress < 45 || item.status === "probation")
        .sort((a, b) => a.progress - b.progress),
    [students]
  );

  /* The header reads the same numbers the bars do — a total per series for
     the week, so the card answers "how many" without hovering a bar. */
  const weekTotals = useMemo(() => {
    const series = dashboard?.submissionSeries;
    if (!series?.length) return null;
    return series.reduce(
      (acc, day) => ({
        submitted: acc.submitted + (day.submitted ?? 0),
        accepted: acc.accepted + (day.accepted ?? 0),
        returned: acc.returned + (day.returned ?? 0),
      }),
      { submitted: 0, accepted: 0, returned: 0 }
    );
  }, [dashboard]);

  const cohortProgress = students.length
    ? Math.round(students.reduce((sum, item) => sum + item.progress, 0) / students.length)
    : 0;

  const decide = async (payload) => {
    await universityService.decideReview(selected.id, payload);
    toast.success(
      payload.status === REVIEW_STATUS.ACCEPTED ? "Step signed off" : "Sent back to the student",
      `${selected.studentName} · ${selected.procedureType}`
    );
    /* Both, because a decision moves a row off the queue *and* moves every
       counter and series the cards above it are drawn from. */
    refetch();
    refetchDashboard();
  };

  const columns = [
    {
      key: "date",
      header: tab === "pending" ? "Submitted" : "Decided",
      sortable: true,
      sortValue: (row) => (tab === "pending" ? row.submittedAt : row.decidedAt ?? row.submittedAt),
      render: (row) => (
        <span className="whitespace-nowrap text-[13px] font-semibold text-ink">
          {formatDate(tab === "pending" ? row.submittedAt : row.decidedAt ?? row.submittedAt, "d MMM yyyy")}
        </span>
      ),
    },
    {
      key: "patientName",
      header: "Patient",
      sortable: true,
      render: (row) => (
        <span className="min-w-0">
          <span className="block truncate text-[13px] text-ink">{row.patientName}</span>
          {row.nationalId ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setDossierId(row.nationalId);
              }}
              className="od-focus mt-0.5 inline-flex items-center gap-1 rounded text-[11.5px] font-bold text-brand-700 hover:underline"
            >
              <FolderOpen className="h-3 w-3" />
              Open dossier
            </button>
          ) : null}
        </span>
      ),
    },
    { key: "studentName", header: "Student", sortable: true },
    {
      key: "procedureType",
      header: "Procedure",
      sortable: true,
      render: (row) => (
        <span className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="truncate text-[13px] text-ink">{row.procedureType}</span>
          <DepartmentChip department={row.department} short />
        </span>
      ),
    },
    {
      key: "status",
      header: tab === "pending" ? "" : "Outcome",
      align: "right",
      render: (row) =>
        tab === "pending" ? (
          <Button variant="secondary" size="xs" onClick={() => setSelected(row)}>
            Review
          </Button>
        ) : (
          <span className="flex items-center justify-end gap-2">
            {row.score != null ? (
              <span className="text-[13px] font-extrabold text-ink">{row.score}</span>
            ) : null}
            <ReviewStatusBadge status={row.status} />
          </span>
        ),
    },
  ];

  if (loading) {
    return <OdentaLoaderPanel />;
  }

  /* The table is already ordered oldest-waiting-first by the server, so the
     longest-waiting step is simply the first row of the pending tab. */
  const oldest = tab === "pending" ? rows[0] : null;

  /* The banner answers "is anything blocked on me", which is a fact about the
     whole queue — not about whichever page and filter happen to be showing. */
  const queueIsClear = (counts.pending ?? 0) === 0;

  return (
    <DashboardShell
      user={user}
      role={ROLES.UNI_SUPERVISOR}
      subtitle={user?.title}
      actions={
        <>
          <Button
            variant="secondary"
            leftIcon={<Signature className="h-4 w-4" />}
            onClick={() => setSignatureOpen(true)}
          >
            Manage signature
          </Button>
          <Button leftIcon={<GraduationCap className="h-4 w-4" />} onClick={() => navigate(uni.students)}>
            My students
          </Button>
        </>
      }
      kpis={[
        {
          label: "Total submissions",
          value: formatNumber(counts.submitted ?? 0),
          icon: <ClipboardCheck className="h-5 w-5" />,
        },
        {
          label: "Awaiting my sign-off",
          value: formatNumber(counts.pending ?? 0),
          tone: "warning",
          icon: <Clock3 className="h-5 w-5" />,
        },
        {
          label: "Decided",
          value: formatNumber(counts.decided ?? 0),
          tone: "success",
          icon: <CheckCircle2 className="h-5 w-5" />,
        },
        {
          label: "Accepted",
          value: formatNumber(counts.accepted ?? 0),
          icon: <BadgeCheck className="h-5 w-5" />,
        },
      ]}
    >
      {oldest && !queueIsClear ? (
        <Card className="flex-row flex-wrap items-center justify-between gap-4 border-brand-200 bg-brand-50/50 px-6 py-5">
          <div className="min-w-0">
            <span className="od-label">Longest waiting</span>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <span className="text-[20px] font-extrabold text-ink">{oldest.procedureType}</span>
              <DepartmentChip department={oldest.department} short />
            </div>
            <p className="mt-1 text-[13px] text-ink-muted">
              {oldest.studentName} · {oldest.patientName} · submitted {fromNow(oldest.submittedAt)}
            </p>
          </div>
          <Button size="lg" leftIcon={<Timer className="h-4 w-4" />} onClick={() => setSelected(oldest)}>
            Review now
          </Button>
        </Card>
      ) : queueIsClear ? (
        <InfoBanner tone="success">
          Your queue is clear — every step submitted to you has been decided.
          {counts.decidedToday ? ` ${counts.decidedToday} decided today.` : ""}
        </InfoBanner>
      ) : null}

      {/* ------------------------------------------------------- the reviews */}
      <Card>
        <CardHeader
          title="Reviews"
          subtitle="Everything submitted to you, pending first"
          action={
            <SegmentedControl
              value={tab}
              onChange={setTab}
              options={[
                { value: "pending", label: `Pending (${counts.pending ?? 0})` },
                { value: "done", label: `Completed (${counts.decided ?? 0})` },
              ]}
            />
          }
        />
        <CardBody className="flex flex-col gap-4 pt-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Search student, patient or procedure…"
              className="w-full sm:w-[300px]"
            />
            <MiniSelect value={department} onChange={(event) => setDepartment(event.target.value)}>
              <option value="all">All disciplines</option>
              {DEPARTMENTS.map((item) => (
                <option key={item.key} value={item.key}>
                  {item.label}
                </option>
              ))}
            </MiniSelect>
            {tab === "done" ? (
              <MiniSelect value={status} onChange={(event) => setStatus(event.target.value)}>
                <option value="all">Any outcome</option>
                <option value={REVIEW_STATUS.ACCEPTED}>Accepted</option>
                <option value={REVIEW_STATUS.RETURNED}>Returned</option>
                <option value={REVIEW_STATUS.REJECTED}>Rejected</option>
              </MiniSelect>
            ) : null}
            <MiniSelect value={period} onChange={(event) => setPeriod(event.target.value)}>
              {DATE_FILTERS.map((item) => (
                <option key={item.key} value={item.key}>
                  {item.label}
                </option>
              ))}
            </MiniSelect>
          </div>

          <DataTable
            columns={columns}
            rows={rows}
            onRowClick={(row) => setSelected(row)}
            emptyTitle={tab === "pending" ? "Nothing waiting on you" : "No decisions in this window"}
            emptyDescription={
              query || department !== "all" || period !== "all"
                ? "Try widening the filters."
                : "Submitted steps land here the moment a student sends them."
            }
          />
        </CardBody>
      </Card>

      <div className="grid grid-cols-12 gap-5">
        {/* -------------------------------------------------- cohort health */}
        <Card className="col-span-12 xl:col-span-5">
          <CardHeader title="Cohort progress" subtitle="Requirement completion across my students" />
          <CardBody className="flex items-center gap-6 pt-2">
            <ProgressRing
              value={cohortProgress}
              size={110}
              sublabel="cohort"
              tone={cohortProgress >= 60 ? "success" : cohortProgress >= 35 ? "brand" : "warning"}
            />
            <div className="min-w-0 flex-1">
              <HorizontalBars
                data={[...students]
                  .sort((a, b) => b.progress - a.progress)
                  .slice(0, 5)
                  .map((item) => ({ name: item.name.split(" ")[0], value: item.progress }))}
                valueFormatter={(value) => `${value}%`}
              />
            </div>
          </CardBody>
        </Card>

        {/* ------------------------------------------------------ throughput */}
        <Card className="col-span-12 xl:col-span-7">
          <CardHeader
            title="Submissions this week"
            subtitle="Number of steps submitted, accepted and returned per day"
            action={
              weekTotals ? (
                <span className="flex flex-wrap items-center gap-1.5">
                  <Badge tone="brand">{formatNumber(weekTotals.submitted)} submitted</Badge>
                  <Badge tone="success">{formatNumber(weekTotals.accepted)} accepted</Badge>
                  <Badge tone="warning">{formatNumber(weekTotals.returned)} returned</Badge>
                </span>
              ) : null
            }
          />
          <CardBody className="pt-3">
            {dashboard?.submissionSeries ? (
              <GroupedBarChart
                data={dashboard.submissionSeries}
                xKey="day"
                height={240}
                /* Counts, not currency — `format` says so rather than
                   leaning on a default that once meant money. */
                series={[
                  { key: "submitted", label: "Submitted", color: "#0077B6", format: "number" },
                  { key: "accepted", label: "Accepted", color: "#20B2AA", format: "number" },
                  { key: "returned", label: "Returned", color: "#F5A623", format: "number" },
                ]}
              />
            ) : (
              <CardSkeleton />
            )}
          </CardBody>
        </Card>

        {/* ---------------------------------------------------------- at risk */}
        <Card className="col-span-12 xl:col-span-5">
          <CardHeader
            title="Students falling behind"
            subtitle="Below 45% of quota, or on probation"
            action={
              <Button variant="link" size="sm" onClick={() => navigate(uni.students)}>
                All students
              </Button>
            }
          />
          <CardBody className="pt-2">
            {atRisk.length === 0 ? (
              <EmptyState
                icon={<TrendingDown className="h-6 w-6" />}
                title="Nobody is behind"
                description="Every student is on track for this rotation."
                className="py-8"
              />
            ) : (
              <ul className="flex flex-col gap-2.5">
                {atRisk.slice(0, 5).map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3.5 py-2.5"
                  >
                    <span className="min-w-0">
                      <span className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => navigate(uni.student(item.id))}
                          className="od-focus truncate rounded text-[13px] font-bold text-ink hover:text-brand-700"
                        >
                          {item.name}
                        </button>
                        {/* a student lands here for either reason — name which */}
                        {item.status === "probation" ? <Badge tone="danger">Probation</Badge> : null}
                      </span>
                      <span className="mt-0.5 block truncate text-[12px] text-ink-soft">
                        {item.group} · {item.acceptedSteps} accepted · {item.returnedSteps} returned
                      </span>
                    </span>
                    <span
                      className={cn(
                        "shrink-0 text-[15px] font-extrabold",
                        item.progress < 45 ? "text-danger" : "text-ink-muted"
                      )}
                    >
                      {item.progress}%
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        {/* --------------------------------------------------- lab approvals */}
        <Card className="col-span-12 xl:col-span-7">
          <CardHeader
            title="Lab requests awaiting approval"
            subtitle={`${labRequests.length} request(s) blocked on you`}
            action={
              <Button variant="link" size="sm" onClick={() => navigate(uni.labRequests)}>
                All lab requests
              </Button>
            }
          />
          <CardBody className="pt-2">
            {labRequests.length === 0 ? (
              <EmptyState
                icon={<FlaskConical className="h-6 w-6" />}
                title="No lab approvals pending"
                className="py-8"
              />
            ) : (
              <ul className="grid gap-2.5 md:grid-cols-2">
                {labRequests.slice(0, 6).map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3.5 py-2.5"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-bold text-ink">{item.item}</span>
                      <span className="block truncate text-[12px] text-ink-soft">
                        {item.studentName} · {item.patientName} · {item.labName}
                      </span>
                    </span>
                    <LabStatusBadge status={item.status} />
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      <ReviewDecisionModal
        review={selected}
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        onDecide={decide}
        signature={signature?.signature}
      />

      <PatientDossierModal
        open={Boolean(dossierId)}
        nationalId={dossierId}
        onClose={() => setDossierId(null)}
        backLabel="Back to the dashboard"
      />

      <Modal
        open={signatureOpen}
        onClose={() => setSignatureOpen(false)}
        title="Manage signature"
        description="The mark attached to every step you accept."
        size="md"
      >
        <SignatureManager
          onSaved={() => {
            toast.success("Signature saved");
            refetchSignature();
          }}
        />
      </Modal>
    </DashboardShell>
  );
}
