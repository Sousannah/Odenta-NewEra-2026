import { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  AlarmClock,
  BadgeCheck,
  ClipboardCheck,
  Clock3,
  FolderOpen,
  RotateCcw,
  Star,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useAsync } from "@/hooks";
import { universityService } from "@/services";
import { formatDate, fromNow } from "@/lib/format";
import { ROLES } from "@/auth/roles";
import { DEPARTMENTS, REVIEW_STATUS } from "@/config/academic";
import { Button } from "@/components/ui/Button";
import { MiniSelect } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { ProgressBar } from "@/components/ui/Stepper";
import { SearchInput } from "@/components/ui/Misc";
import { useToast } from "@/components/ui/Toast";
import { PageHeader, StatCard, StatGrid, Toolbar } from "@/components/shared";
import { DepartmentChip, ReviewStatusBadge } from "@/university/components";
import { ReviewDecisionModal } from "@/university/supervisor/ReviewDecisionModal";
import { PatientDossierModal } from "@/university/supervisor/PatientDossierModal";
import { stepTotals } from "@/university/supervisor/ReviewStepsPanel";

/**
 * The staff member's queue, as a list.
 *
 * It was a card grid, which is the wrong shape for this screen: a queue is
 * worked top to bottom and cards make that order something you have to
 * reconstruct by reading. One row per submission puts the four things a
 * verdict turns on — how long it has waited, whose it is, how much of the
 * checklist was ticked, what it scored — under the same four headings on
 * every line, so the whole queue is comparable in one downward scan. Oldest
 * first, always: a step that has waited three days is a student who could not
 * move a case for three days.
 */

const FILTERS = [
  { key: "all", label: "All" },
  { key: REVIEW_STATUS.PENDING, label: "Pending" },
  { key: REVIEW_STATUS.ACCEPTED, label: "Accepted" },
  { key: REVIEW_STATUS.RETURNED, label: "Returned" },
  { key: REVIEW_STATUS.REJECTED, label: "Rejected" },
];

const HOUR = 3600000;

/**
 * How recently a step was submitted.
 *
 * Hours rather than days at the short end, because a teaching session is three
 * hours long: "what came in this session" is the question a staff member asks
 * between chairs, and a "today" filter cannot answer it.
 */
const WINDOWS = [
  { value: "all", label: "Any time", hours: null },
  { value: "1h", label: "Last hour", hours: 1 },
  { value: "6h", label: "Last 6 hours", hours: 6 },
  { value: "24h", label: "Last 24 hours", hours: 24 },
  { value: "3d", label: "Last 3 days", hours: 72 },
  { value: "7d", label: "Last 7 days", hours: 24 * 7 },
];

/** How long a step has been sitting, coloured by how bad that is. */
function WaitingFor({ since }) {
  const hours = (Date.now() - new Date(since).getTime()) / HOUR;
  const tone = hours > 72 ? "text-danger" : hours > 24 ? "text-warning-ink" : "text-ink-muted";
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 text-[12px] font-bold", tone)}
      title={formatDate(since, "d MMM yyyy, HH:mm")}
    >
      <Clock3 className="h-3.5 w-3.5" />
      {fromNow(since)}
    </span>
  );
}

/** Procedure quality out of five, as the faculty records it. */
function QualityStars({ value }) {
  if (value == null)
    return <span className="shrink-0 whitespace-nowrap text-[12px] text-ink-faint">Not rated</span>;
  return (
    <span className="flex shrink-0 items-center gap-0.5" title={`${value} of 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            "h-3.5 w-3.5",
            star <= value ? "fill-warning text-warning" : "text-slate-300"
          )}
        />
      ))}
    </span>
  );
}

/* The one grid the header row and every row share, so the columns line up. */
const ROW_GRID =
  "lg:grid lg:grid-cols-[minmax(0,1.9fr)_minmax(0,1.1fr)_minmax(0,0.95fr)_minmax(180px,1fr)_auto] lg:items-center lg:gap-4";

function ReviewRow({ item, onOpen, onOpenDossier }) {
  const totals = stepTotals(item.reviewSteps ?? [], item.stepStatuses);
  const documented = totals.total ? Math.round((totals.completed / totals.total) * 100) : 0;
  const isPending = item.status === REVIEW_STATUS.PENDING;

  /**
   * The whole line opens the submission.
   *
   * Only the procedure name and the button on the right used to, which meant
   * a queue of rows that highlight under the cursor mostly did nothing when
   * clicked. The two controls that are *not* "open this review" — the dossier
   * link and the button itself — stop the event rather than being carved out
   * of the hit area.
   */
  return (
    <li
      role="button"
      tabIndex={0}
      onClick={() => onOpen(item)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen(item);
        }
      }}
      className={cn(
        "od-focus flex cursor-pointer flex-col gap-3 px-4 py-3.5 transition hover:bg-brand-50/40 lg:gap-0",
        ROW_GRID
      )}
    >
      {/* ------------------------------------------------------- submission */}
      <div className="flex min-w-0 items-start gap-3">
        <span
          aria-hidden="true"
          className={cn(
            "mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full",
            isPending ? "bg-warning" : "bg-slate-300"
          )}
        />
        <span className="min-w-0">
          <span className="block max-w-full truncate text-[14px] font-extrabold text-ink">
            {item.procedureType}
          </span>
          <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-ink-soft">
            <DepartmentChip department={item.department} short />
            <span className="truncate">{item.studentName}</span>
            <span className="text-ink-faint">·</span>
            <span>
              step {item.stepIndex}/{item.stepTotal}
            </span>
            <span className="text-ink-faint">·</span>
            <span>tooth {item.tooth ?? "—"}</span>
          </span>
        </span>
      </div>

      {/* ---------------------------------------------------------- patient */}
      <div className="min-w-0">
        <span className="lg:hidden od-label">Patient</span>
        <span className="block truncate text-[13px] font-bold text-ink">{item.patientName}</span>
        {item.nationalId ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onOpenDossier(item.nationalId);
            }}
            className="od-focus mt-0.5 inline-flex items-center gap-1 rounded text-[11.5px] font-bold text-brand-700 hover:underline"
          >
            <FolderOpen className="h-3 w-3" />
            Open dossier
          </button>
        ) : (
          <span className="text-[11.5px] text-ink-faint">No national ID</span>
        )}
      </div>

      {/* ---------------------------------------------------------- waiting */}
      <div className="flex flex-wrap items-center gap-2">
        <ReviewStatusBadge status={item.status} />
        <WaitingFor since={item.submittedAt} />
      </div>

      {/* --------------------------------------------------------- progress */}
      <div className="min-w-0">
        <span className="flex items-center justify-between gap-2 text-[11.5px] font-semibold text-ink-muted">
          <span className="whitespace-nowrap">
            {totals.completed}/{totals.total} documented
          </span>
          <QualityStars value={item.procedureQuality} />
        </span>
        <ProgressBar
          className="mt-1.5"
          value={documented}
          tone={documented === 100 ? "success" : "brand"}
        />
      </div>

      {/* ----------------------------------------------------------- action */}
      <div className="lg:justify-self-end">
        <Button
          variant={isPending ? "primary" : "secondary"}
          size="sm"
          className="w-full lg:w-auto"
          leftIcon={<BadgeCheck className="h-4 w-4" />}
          onClick={(event) => {
            event.stopPropagation();
            onOpen(item);
          }}
        >
          {isPending ? "Decide" : "Open"}
        </Button>
      </div>
    </li>
  );
}

export default function ReviewQueuePage() {
  const { user, role } = useOutletContext() ?? {};
  const toast = useToast();

  const isSupervisor = role === ROLES.UNI_SUPERVISOR;
  const supervisorId = isSupervisor ? user?.staffId ?? "all" : "all";

  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("all");
  const [status, setStatus] = useState(REVIEW_STATUS.PENDING);
  const [since, setSince] = useState("all");
  const [selected, setSelected] = useState(null);
  const [dossierId, setDossierId] = useState(null);

  const { data: rows = [], loading, refetch } = useAsync(
    () => universityService.getReviews({ supervisorId, department }),
    [supervisorId, department],
    []
  );
  const { data: signature } = useAsync(
    () => (isSupervisor ? universityService.getSignature() : Promise.resolve(null)),
    [isSupervisor]
  );

  const pending = rows.filter((item) => item.status === REVIEW_STATUS.PENDING);
  const overdue = pending.filter((item) => Date.now() - new Date(item.submittedAt).getTime() > 72 * HOUR);
  /* The queue is served oldest-first, so the head of it is the tile's hint. */
  const oldest = pending.reduce(
    (worst, item) => (!worst || String(item.submittedAt) < String(worst.submittedAt) ? item : worst),
    null
  );

  const counts = useMemo(() => {
    const map = { all: rows.length };
    FILTERS.slice(1).forEach((entry) => {
      map[entry.key] = rows.filter((item) => item.status === entry.key).length;
    });
    return map;
  }, [rows]);

  const windowHours = WINDOWS.find((entry) => entry.value === since)?.hours ?? null;

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const cutoff = windowHours == null ? null : Date.now() - windowHours * HOUR;
    return rows
      .filter((item) => {
        if (status !== "all" && item.status !== status) return false;
        /* Measured from submission, not from the verdict: the window answers
           "what has come in", which stays true of a row once it is decided. */
        if (cutoff != null && new Date(item.submittedAt).getTime() < cutoff) return false;
        if (!needle) return true;
        return [item.studentName, item.patientName, item.procedureType, item.id]
          .filter(Boolean)
          .some((field) => String(field).toLowerCase().includes(needle));
      })
      .sort((a, b) =>
        /* Pending sorts oldest first — that is the working order. Anything
           decided sorts newest first, because it is history. */
        status === REVIEW_STATUS.PENDING
          ? String(a.submittedAt).localeCompare(String(b.submittedAt))
          : String(b.decidedAt ?? b.submittedAt).localeCompare(String(a.decidedAt ?? a.submittedAt))
      );
  }, [rows, query, status, windowHours]);

  const decide = async (payload) => {
    await universityService.decideReview(selected.id, payload);
    toast.success(
      payload.status === REVIEW_STATUS.ACCEPTED ? "Step signed off" : "Sent back to the student",
      `${selected.studentName} · ${selected.procedureType}`
    );
    refetch();
  };

  return (
    <div className="flex flex-col gap-4 p-4 sm:gap-5 sm:p-6">
      <PageHeader
        title="Review queue"
        description="Steps students have submitted for sign-off, oldest first."
      />

      <StatGrid cols={4}>
        <StatCard
          label="Waiting"
          value={pending.length}
          tone="warning"
          hint={oldest ? `oldest submitted ${fromNow(oldest.submittedAt)}` : "the queue is clear"}
          icon={<Clock3 />}
        />
        <StatCard
          label="Over three days"
          value={overdue.length}
          tone="danger"
          hint="a student blocked on a sign-off"
          icon={<AlarmClock />}
        />
        <StatCard
          label="Accepted"
          value={counts[REVIEW_STATUS.ACCEPTED] ?? 0}
          tone="success"
          hint="signed off"
          icon={<BadgeCheck />}
        />
        <StatCard
          label="Returned"
          value={counts[REVIEW_STATUS.RETURNED] ?? 0}
          tone="info"
          hint="sent back for correction"
          icon={<RotateCcw />}
        />
      </StatGrid>

      <Toolbar
        left={
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Student, patient or step…"
            className="w-full sm:w-[320px]"
          />
        }
        right={
          <>
            <MiniSelect value={since} onChange={(event) => setSince(event.target.value)}>
              {WINDOWS.map((entry) => (
                <option key={entry.value} value={entry.value}>
                  {entry.label}
                </option>
              ))}
            </MiniSelect>
            <MiniSelect value={department} onChange={(event) => setDepartment(event.target.value)}>
              <option value="all">All rotations</option>
              {DEPARTMENTS.map((entry) => (
                <option key={entry.key} value={entry.key}>
                  {entry.label}
                </option>
              ))}
            </MiniSelect>
          </>
        }
      />

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((entry) => {
          const selectedFilter = status === entry.key;
          return (
            <button
              key={entry.key}
              type="button"
              aria-pressed={selectedFilter}
              onClick={() => setStatus(entry.key)}
              className={cn(
                "od-focus rounded-xl px-3.5 py-2 text-[13px] font-semibold transition",
                selectedFilter
                  ? "bg-brand-600 text-white shadow-sm"
                  : "bg-slate-100 text-ink-muted hover:bg-brand-100 hover:text-brand-700"
              )}
            >
              {entry.label} ({counts[entry.key] ?? 0})
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="od-card flex flex-col gap-px overflow-hidden">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-[76px] w-full rounded-none" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          icon={<ClipboardCheck className="h-6 w-6" />}
          title={status === REVIEW_STATUS.PENDING ? "The queue is clear" : "Nothing in this state"}
          description={
            query
              ? "Try a different search term."
              : "Every step submitted to you has been decided."
          }
          className="od-card py-16"
        />
      ) : (
        <div className="od-card overflow-hidden">
          {/* One heading row, so a column means the same thing on every line. */}
          <div
            className={cn(
              "hidden border-b border-slate-200 bg-slate-50/80 px-4 py-2.5",
              ROW_GRID,
              "lg:grid"
            )}
          >
            {["Submission", "Patient", "Status & wait", "Checklist", ""].map((heading, index) => (
              <span
                key={heading || index}
                className={cn("od-label", index === 4 && "justify-self-end")}
              >
                {heading}
              </span>
            ))}
          </div>

          <ul className="divide-y divide-slate-100">
            {visible.map((item) => (
              <ReviewRow
                key={item.id}
                item={item}
                onOpen={setSelected}
                onOpenDossier={setDossierId}
              />
            ))}
          </ul>

          <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-2.5 text-[11.5px] font-semibold text-ink-soft">
            {visible.length} submission{visible.length === 1 ? "" : "s"} shown
            {status === REVIEW_STATUS.PENDING ? " · longest waiting at the top" : ""}
          </div>
        </div>
      )}

      <ReviewDecisionModal
        review={selected}
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        onDecide={decide}
        signature={signature?.signature}
      />

      {/* Opened straight from a row, without leaving the queue. */}
      <PatientDossierModal
        open={Boolean(dossierId)}
        nationalId={dossierId}
        onClose={() => setDossierId(null)}
        backLabel="Back to the queue"
      />
    </div>
  );
}
