import { useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import {
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Hourglass,
  PieChart,
  RotateCcw,
  Stethoscope,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useAsync } from "@/hooks";
import { universityService } from "@/services";
import { formatDate, fromNow } from "@/lib/format";
import { toDateKey, dateKeyOffset } from "@/lib/time";
import { uni } from "@/config/paths";
import { DEPARTMENTS, REVIEW_STATUS } from "@/config/academic";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { MiniSelect } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { ProgressBar } from "@/components/ui/Stepper";
import { SearchInput } from "@/components/ui/Misc";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { PageHeader, Toolbar } from "@/components/shared";
import { DepartmentChip, ProgressRing, ReviewStatusBadge } from "@/university/components";
import { ReviewDrawer } from "@/university/components/ReviewDrawer";

/**
 * A student's own reviews.
 *
 * Split into what is still with a supervisor and what has come back, because
 * those are two different jobs: waiting, and fixing.
 *
 * The screen used to open with seven KPI tiles across two rows — four counts
 * of reviews and three counts of steps — before a student could see a single
 * piece of feedback. Six of them restated the same thing at different
 * granularities, so they are one card now: the step acceptance rate, which is
 * the only number that tracks the term, next to the three counts a student
 * actually acts on. Everything below it is the feedback itself.
 */

const DAY_FILTERS = [
  { value: "all", label: "All dates" },
  { value: "today", label: "Today" },
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
];

/** Accepted / declined / pending across every completed step of a review. */
export const stepTally = (review) => {
  const steps = review.reviewSteps ?? [];
  const completed = steps.filter((step) => step.completed);
  if (!completed.length) return { total: 0, accepted: 0, declined: 0, pending: 0 };

  const statusAt = (index) =>
    review.stepStatuses?.[index] ?? steps[index]?.supervisorStatus ?? null;

  let accepted = 0;
  let declined = 0;
  steps.forEach((step, index) => {
    if (!step.completed) return;
    const status = statusAt(index);
    if (status === "accepted") accepted += 1;
    else if (status === "declined" || status === "rejected") declined += 1;
  });

  return {
    total: completed.length,
    accepted,
    declined,
    pending: completed.length - accepted - declined,
  };
};

/** The one-chip summary a row renders for its step checklist. */
function StepFeedback({ review }) {
  const tally = stepTally(review);
  if (!tally.total) return <span className="text-[12px] text-ink-faint">No steps</span>;

  if (tally.accepted === tally.total) {
    return (
      <Badge tone="success">
        <CheckCircle2 className="h-3 w-3" />
        All {tally.total} accepted
      </Badge>
    );
  }
  if (tally.declined === tally.total) {
    return (
      <Badge tone="danger">
        <XCircle className="h-3 w-3" />
        All declined
      </Badge>
    );
  }
  if (tally.accepted || tally.declined) {
    return (
      <Badge tone="warning">
        <Hourglass className="h-3 w-3" />
        {tally.accepted}/{tally.total} accepted
      </Badge>
    );
  }
  return (
    <Badge tone="neutral">
      <Hourglass className="h-3 w-3" />
      Pending review
    </Badge>
  );
}

const withinDayFilter = (value, filter) => {
  if (filter === "all" || !value) return true;
  const key = String(value).slice(0, 10);
  if (filter === "today") return key === toDateKey();
  if (filter === "week") return key >= dateKeyOffset(-7) && key <= toDateKey();
  if (filter === "month") return key >= dateKeyOffset(-30) && key <= toDateKey();
  return true;
};

/* --------------------------------------------------------- the summary card */

function Figure({ icon: Icon, label, value, tone }) {
  const TONES = {
    warning: "bg-warning-soft text-warning-ink",
    success: "bg-success-soft text-success-strong",
    danger: "bg-danger-soft text-danger",
  };
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl", TONES[tone])}>
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <span className="min-w-0">
        <span className="block text-[22px] font-extrabold leading-none text-ink">{value}</span>
        <span className="mt-1 block truncate text-[12px] font-semibold text-ink-soft">{label}</span>
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------- a row */

function ReviewRow({ review, tab, onOpen }) {
  const stamp = tab === "pending" ? review.submittedAt : review.decidedAt ?? review.submittedAt;
  const tally = stepTally(review);
  const documented = tally.total
    ? Math.round(((tally.accepted + tally.declined) / tally.total) * 100)
    : 0;

  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(review)}
        className="od-focus flex w-full flex-col gap-3 px-4 py-3.5 text-left transition hover:bg-brand-50/40 lg:grid lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1.1fr)_minmax(0,1fr)_auto] lg:items-center lg:gap-4"
      >
        {/* ------------------------------------------------------ procedure */}
        <span className="flex min-w-0 items-start gap-3">
          <span
            className={cn(
              "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
              review.status === REVIEW_STATUS.ACCEPTED
                ? "bg-success-soft text-success-strong"
                : review.status === REVIEW_STATUS.PENDING
                  ? "bg-warning-soft text-warning-ink"
                  : "bg-danger-soft text-danger"
            )}
          >
            <Stethoscope className="h-4 w-4" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[14px] font-extrabold text-ink">
              {review.procedureType}
            </span>
            <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-ink-soft">
              <DepartmentChip department={review.department} short />
              <span className="truncate">{review.patientName}</span>
              <span className="text-ink-faint">·</span>
              <span>tooth {review.tooth ?? "—"}</span>
            </span>
          </span>
        </span>

        {/* ----------------------------------------------------- the verdict */}
        <span className="flex min-w-0 flex-wrap items-center gap-2">
          <ReviewStatusBadge status={review.status} />
          <StepFeedback review={review} />
        </span>

        {/* -------------------------------------------------------- when/who */}
        <span className="min-w-0">
          <span className="block text-[12.5px] font-semibold text-ink">
            {formatDate(stamp, "d MMM yyyy")}
            <span className="ml-1.5 font-medium text-ink-faint">{fromNow(stamp)}</span>
          </span>
          <span className="mt-1 block truncate text-[12px] text-ink-soft">
            {tab === "pending"
              ? `With ${review.supervisorName ?? "a staff member"}`
              : review.score != null
                ? `Scored ${review.score}/100 by ${review.supervisorName ?? "staff"}`
                : (review.supervisorName ?? "—")}
          </span>
          {tally.total ? (
            <ProgressBar
              className="mt-1.5 max-w-[180px]"
              value={documented}
              tone={tally.declined ? "warning" : documented === 100 ? "success" : "brand"}
            />
          ) : null}
        </span>

        <ChevronRight className="hidden h-4 w-4 shrink-0 text-ink-faint lg:block lg:justify-self-end" />
      </button>
    </li>
  );
}

/* ------------------------------------------------------------------ screen */

export default function MyReviewsPage() {
  const { user } = useOutletContext() ?? {};
  const navigate = useNavigate();
  const studentId = user?.staffId;

  const [tab, setTab] = useState("pending");
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("all");
  const [dayFilter, setDayFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState(null);

  const { data: rows = [], loading } = useAsync(
    () => universityService.getReviews({ studentId: studentId ?? "all", q: query, department }),
    [studentId, query, department],
    []
  );

  const pending = useMemo(
    () => rows.filter((item) => item.status === REVIEW_STATUS.PENDING),
    [rows]
  );
  const done = useMemo(
    () =>
      rows.filter((item) =>
        [REVIEW_STATUS.ACCEPTED, REVIEW_STATUS.RETURNED, REVIEW_STATUS.REJECTED].includes(item.status)
      ),
    [rows]
  );

  const accepted = done.filter((item) => item.status === REVIEW_STATUS.ACCEPTED).length;
  const needsCorrection = done.length - accepted;

  /* Across every decided review — the number that actually tracks progress.
     A procedure marked "returned" says nothing about *which* part was wrong;
     the accepted/declined split across steps does. */
  const stepStats = useMemo(
    () =>
      done.reduce(
        (totals, review) => {
          const tally = stepTally(review);
          totals.total += tally.total;
          totals.accepted += tally.accepted;
          totals.declined += tally.declined;
          return totals;
        },
        { total: 0, accepted: 0, declined: 0 }
      ),
    [done]
  );

  const stepAcceptanceRate = stepStats.total
    ? Math.round((stepStats.accepted / stepStats.total) * 100)
    : 0;

  const visible = useMemo(() => {
    const source = tab === "pending" ? pending : done;
    return source
      .filter((item) => {
        const stamp = tab === "pending" ? item.submittedAt : item.decidedAt ?? item.submittedAt;
        if (!withinDayFilter(stamp, dayFilter)) return false;
        if (tab === "done" && statusFilter !== "all") {
          if (statusFilter === REVIEW_STATUS.REJECTED) {
            return [REVIEW_STATUS.REJECTED, REVIEW_STATUS.RETURNED].includes(item.status);
          }
          return item.status === statusFilter;
        }
        return true;
      })
      .sort((a, b) =>
        /* Waiting work sorts oldest first — that is the order it will come
           back in. History sorts newest first. */
        tab === "pending"
          ? String(a.submittedAt).localeCompare(String(b.submittedAt))
          : String(b.decidedAt ?? b.submittedAt).localeCompare(String(a.decidedAt ?? a.submittedAt))
      );
  }, [tab, pending, done, dayFilter, statusFilter]);

  const filtersDirty =
    Boolean(query) || department !== "all" || dayFilter !== "all" || statusFilter !== "all";

  const list = (
    <div className="od-card overflow-hidden">
      {loading ? (
        <div className="flex flex-col gap-px">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-[84px] w-full rounded-none" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          icon={<ClipboardCheck className="h-6 w-6" />}
          title={tab === "pending" ? "Nothing waiting on a supervisor" : "No decided reviews"}
          description={
            filtersDirty
              ? "No review matches the filters you have set."
              : tab === "pending"
                ? "Submit a step from a patient's treatment sheet and it will appear here."
                : "Feedback lands here once a staff member has ruled on a step."
          }
          className="py-16"
        />
      ) : (
        <>
          <ul className="divide-y divide-slate-100">
            {visible.map((review) => (
              <ReviewRow key={review.id} review={review} tab={tab} onOpen={setSelected} />
            ))}
          </ul>
          <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-2.5 text-[11.5px] font-semibold text-ink-soft">
            {visible.length} review{visible.length === 1 ? "" : "s"} shown
            {tab === "pending" ? " · longest waiting at the top" : ""}
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-4 p-4 sm:gap-5 sm:p-6">
      <PageHeader
        title="My reviews"
        description="Every step you have sent for sign-off, and what came back."
        actions={
          <Button
            variant="secondary"
            leftIcon={<PieChart className="h-4 w-4" />}
            onClick={() => navigate(uni.analytics)}
          >
            Full analytics
          </Button>
        }
      />

      {/* ------------------------------------------------------ at a glance */}
      <div className="od-card flex flex-col gap-6 px-5 py-5 lg:flex-row lg:items-center lg:gap-8">
        <div className="flex shrink-0 items-center gap-4">
          <ProgressRing
            value={stepAcceptanceRate}
            size={96}
            sublabel="accepted"
            tone={
              stepAcceptanceRate >= 80 ? "success" : stepAcceptanceRate >= 50 ? "brand" : "warning"
            }
          />
          <div className="min-w-0">
            <span className="od-label">Step acceptance</span>
            <p className="mt-1 text-[15px] font-extrabold leading-tight text-ink">
              {stepStats.accepted}
              <span className="text-ink-faint"> of {stepStats.total} steps</span>
            </p>
            <p className="mt-1 text-[12px] text-ink-muted">
              Only accepted steps count towards a rotation quota.
            </p>
          </div>
        </div>

        <div className="grid flex-1 gap-5 border-slate-100 sm:grid-cols-3 lg:border-l lg:pl-8">
          <Figure
            icon={Hourglass}
            tone="warning"
            label="Waiting on a supervisor"
            value={pending.length}
          />
          <Figure icon={CheckCircle2} tone="success" label="Accepted" value={accepted} />
          <Figure
            icon={RotateCcw}
            tone="danger"
            label="Needs correction"
            value={needsCorrection}
          />
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="pending" badge={pending.length}>
            Waiting
          </TabsTrigger>
          <TabsTrigger value="done" badge={done.length}>
            Decided
          </TabsTrigger>
        </TabsList>

        <div className="pt-4">
          <Toolbar
            className="mb-4"
            left={
              <SearchInput
                value={query}
                onChange={setQuery}
                placeholder="Search patients or procedures…"
                className="w-full sm:w-[320px]"
              />
            }
            right={
              <>
                <MiniSelect value={dayFilter} onChange={(event) => setDayFilter(event.target.value)}>
                  {DAY_FILTERS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </MiniSelect>
                <MiniSelect
                  value={department}
                  onChange={(event) => setDepartment(event.target.value)}
                >
                  <option value="all">All rotations</option>
                  {DEPARTMENTS.map((item) => (
                    <option key={item.key} value={item.key}>
                      {item.label}
                    </option>
                  ))}
                </MiniSelect>
                {tab === "done" ? (
                  <MiniSelect
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                  >
                    <option value="all">All outcomes</option>
                    <option value={REVIEW_STATUS.ACCEPTED}>Accepted</option>
                    <option value={REVIEW_STATUS.RETURNED}>Returned</option>
                    <option value={REVIEW_STATUS.REJECTED}>Rejected</option>
                  </MiniSelect>
                ) : null}
                {filtersDirty ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setQuery("");
                      setDepartment("all");
                      setDayFilter("all");
                      setStatusFilter("all");
                    }}
                  >
                    Clear all
                  </Button>
                ) : null}
              </>
            }
          />

          <TabsContent value="pending">{list}</TabsContent>
          <TabsContent value="done">{list}</TabsContent>
        </div>
      </Tabs>

      <ReviewDrawer review={selected} open={Boolean(selected)} onClose={() => setSelected(null)} />
    </div>
  );
}
