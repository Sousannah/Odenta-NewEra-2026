import { useMemo, useState } from "react";
import {
  BarChart3,
  ClipboardCheck,
  Download,
  FileText,
  GraduationCap,
  Printer,
  Trash2,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useLocalStorage } from "@/hooks";
import { universityService } from "@/services";
import { formatDate } from "@/lib/format";
import { toDateKey } from "@/lib/time";
import { REVIEW_STATUS, departmentMeta } from "@/config/academic";
import { Badge } from "@/components/ui/Badge";
import { Button, IconButton } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { InfoBanner } from "@/components/ui/Misc";
import { useToast } from "@/components/ui/Toast";
import { DetailGrid } from "@/university/components";

/**
 * The report builder.
 *
 * A report is a *snapshot with a date on it*, not a live view: the point of
 * taking one is that a progress board six weeks later can see the numbers as
 * they stood, even though the underlying rows have moved. So generating one
 * freezes the figures and keeps them; the live read is the screen below.
 *
 * Snapshots live in this browser's storage. That is deliberate for now and
 * called out in the banner — a report anyone else has to see is one the server
 * should be issuing, and this is what that endpoint has to replace.
 */

const TYPES = [
  {
    id: "review-summary",
    name: "Review summary",
    description: "Every submission in the period, and what happened to it.",
    icon: ClipboardCheck,
    tone: "bg-brand-100 text-brand-700",
  },
  {
    id: "student-performance",
    name: "Student performance",
    description: "Scores and grade bands across the cohort in scope.",
    icon: GraduationCap,
    tone: "bg-success-soft text-success-strong",
  },
  {
    id: "clinic-activity",
    name: "Clinic activity",
    description: "Caseload, rotations and consent across the teaching clinic.",
    icon: BarChart3,
    tone: "bg-info-soft text-info-ink",
  },
  {
    id: "personal-performance",
    name: "My own throughput",
    description: "What I decided in the period and how long students waited.",
    icon: UserRound,
    tone: "bg-warning-soft text-warning-ink",
  },
];

const typeOf = (id) => TYPES.find((entry) => entry.id === id);

const inRange = (isoValue, from, to) => {
  if (!isoValue) return false;
  const key = toDateKey(isoValue);
  return key >= from && key <= to;
};

const pct = (part, whole) => (whole ? Math.round((part / whole) * 100) : 0);

export function ReportBuilder({ scope = {} }) {
  const toast = useToast();

  const [range, setRange] = useState(() => {
    const end = new Date();
    const start = new Date(Date.now() - 30 * 86400000);
    return { from: toDateKey(start), to: toDateKey(end) };
  });
  const [saved, setSaved] = useLocalStorage("odenta.uni.reports", []);
  const [busy, setBusy] = useState(null);
  const [opened, setOpened] = useState(null);

  const generate = async (type) => {
    setBusy(type.id);
    try {
      const data = await build(type.id, range, scope);
      const snapshot = {
        id: `RPT-${Date.now()}`,
        type: type.id,
        name: type.name,
        from: range.from,
        to: range.to,
        createdAt: new Date().toISOString(),
        data,
      };
      setSaved((prev) => [snapshot, ...prev].slice(0, 20));
      toast.success(`${type.name} generated`, `${range.from} → ${range.to}`);
    } catch (cause) {
      toast.error("Could not generate that report", cause?.message);
    } finally {
      setBusy(null);
    }
  };

  const remove = (id) => setSaved((prev) => prev.filter((entry) => entry.id !== id));

  const exportCsv = (snapshot) => {
    const rows = snapshot.data.rows ?? [];
    if (!rows.length) {
      toast.info("Nothing to export", "This report has no tabular rows.");
      return;
    }
    const header = Object.keys(rows[0]);
    const csv = [header, ...rows.map((row) => header.map((key) => row[key]))]
      .map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${snapshot.type}-${snapshot.from}-to-${snapshot.to}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <CardHeader
          title="Generate a report"
          subtitle="Freezes the numbers as they stand, so they can be quoted later"
        />
        <CardBody className="flex flex-col gap-4 pt-2">
          <div className="grid gap-4 sm:grid-cols-2 lg:max-w-md">
            <Field label="From">
              <Input
                type="date"
                value={range.from}
                onChange={(event) => setRange((prev) => ({ ...prev, from: event.target.value }))}
              />
            </Field>
            <Field label="To">
              <Input
                type="date"
                value={range.to}
                onChange={(event) => setRange((prev) => ({ ...prev, to: event.target.value }))}
              />
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {TYPES.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.id}
                  type="button"
                  disabled={busy != null}
                  onClick={() => generate(type)}
                  className="od-focus flex items-start gap-3 rounded-2xl border border-slate-200 px-4 py-3.5 text-left transition hover:border-brand-300 hover:bg-brand-50/40 disabled:opacity-60"
                >
                  <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl", type.tone)}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13.5px] font-bold text-ink">
                      {type.name}
                      {busy === type.id ? (
                        <span className="ml-2 text-[11.5px] font-semibold text-ink-soft">
                          generating…
                        </span>
                      ) : null}
                    </span>
                    <span className="block text-[12px] text-ink-soft">{type.description}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Generated reports"
          subtitle={`${saved.length} snapshot${saved.length === 1 ? "" : "s"} kept`}
          action={
            saved.length ? (
              <Button variant="link" size="sm" onClick={() => setSaved([])}>
                Clear all
              </Button>
            ) : null
          }
        />
        <CardBody className="flex flex-col gap-3 pt-2">
          <InfoBanner tone="neutral">
            Snapshots are kept in this browser only. Clearing site data removes them, and a
            colleague on another machine will not see them.
          </InfoBanner>

          {saved.length === 0 ? (
            <EmptyState
              icon={<FileText className="h-6 w-6" />}
              title="No reports generated yet"
              description="Pick a period and a type above to take the first snapshot."
              className="py-10"
            />
          ) : (
            <ul className="flex flex-col gap-2.5">
              {saved.map((snapshot) => {
                const meta = typeOf(snapshot.type);
                const Icon = meta?.icon ?? FileText;
                return (
                  <li
                    key={snapshot.id}
                    className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 px-3.5 py-3"
                  >
                    <span
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                        meta?.tone ?? "bg-slate-100 text-ink-muted"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-bold text-ink">
                        {snapshot.name}
                      </span>
                      <span className="block truncate text-[11.5px] text-ink-soft">
                        {formatDate(snapshot.from, "d MMM yyyy")} →{" "}
                        {formatDate(snapshot.to, "d MMM yyyy")} · taken{" "}
                        {formatDate(snapshot.createdAt, "d MMM yyyy, HH:mm")}
                      </span>
                    </span>
                    <Button variant="secondary" size="xs" onClick={() => setOpened(snapshot)}>
                      Open
                    </Button>
                    <IconButton size="sm" label="Export CSV" onClick={() => exportCsv(snapshot)}>
                      <Download className="h-4 w-4" />
                    </IconButton>
                    <IconButton size="sm" label="Delete report" onClick={() => remove(snapshot.id)}>
                      <Trash2 className="h-4 w-4" />
                    </IconButton>
                  </li>
                );
              })}
            </ul>
          )}
        </CardBody>
      </Card>

      <ReportPreview snapshot={opened} onClose={() => setOpened(null)} />
    </div>
  );
}

/* ------------------------------------------------------------ generation */

/**
 * Report bodies.
 *
 * Every one resolves to `{ summary: [{label, value}], rows: [...] }` so the
 * preview and the CSV export never have to know which type they are looking
 * at. `rows` is what gets exported; `summary` is what gets read.
 */
async function build(typeId, range, scope) {
  if (typeId === "review-summary" || typeId === "personal-performance") {
    /* Scoped the same way the screen the reader came from is: a supervisor
       reporting on the whole faculty's throughput is not a report they can
       be asked about. */
    const reviews = await universityService.getReviews(scope);
    const scoped = reviews.filter((item) =>
      typeId === "personal-performance"
        ? inRange(item.decidedAt, range.from, range.to)
        : inRange(item.submittedAt, range.from, range.to)
    );

    const accepted = scoped.filter((item) => item.status === REVIEW_STATUS.ACCEPTED);
    const returned = scoped.filter((item) => item.status === REVIEW_STATUS.RETURNED);
    const rejected = scoped.filter((item) => item.status === REVIEW_STATUS.REJECTED);
    const pending = scoped.filter((item) => item.status === REVIEW_STATUS.PENDING);

    const turnarounds = scoped
      .filter((item) => item.decidedAt && item.submittedAt)
      .map((item) => (new Date(item.decidedAt) - new Date(item.submittedAt)) / 3600000)
      .filter((hours) => hours >= 0);

    return {
      summary: [
        { label: typeId === "personal-performance" ? "Decisions made" : "Submissions", value: scoped.length },
        { label: "Accepted", value: `${accepted.length} (${pct(accepted.length, scoped.length)}%)` },
        { label: "Returned", value: returned.length },
        { label: "Rejected", value: rejected.length },
        { label: "Still pending", value: pending.length },
        {
          label: "Average turnaround",
          value: turnarounds.length
            ? `${Math.round(turnarounds.reduce((sum, value) => sum + value, 0) / turnarounds.length)} hours`
            : "—",
        },
      ],
      rows: scoped.map((item) => ({
        Submitted: toDateKey(item.submittedAt),
        Decided: item.decidedAt ? toDateKey(item.decidedAt) : "",
        Student: item.studentName,
        Patient: item.patientName,
        Procedure: item.procedureType,
        Rotation: departmentMeta(item.department).short,
        Outcome: item.status,
        Score: item.score ?? "",
        Comment: item.comment ?? "",
      })),
    };
  }

  if (typeId === "student-performance") {
    const payload = await universityService.getStudentScores({ range: "all", target: 10, ...scope });
    return {
      summary: [
        { label: "Students", value: payload.summary.students },
        { label: "Submissions", value: payload.summary.submitted },
        { label: "Acceptance rate", value: `${payload.summary.acceptanceRatePct ?? 0}%` },
        { label: "Average score", value: payload.summary.averageScore ?? "—" },
        { label: "Median score", value: payload.summary.medianScore ?? "—" },
        { label: "Needing support", value: payload.summary.atRisk },
      ],
      rows: payload.students.map((student) => ({
        Rank: student.rank ?? "",
        Name: student.name,
        Number: student.studentNumber,
        Group: student.group,
        Submitted: student.metrics.submitted,
        Accepted: student.metrics.accepted,
        Declined: student.metrics.declined,
        Pending: student.metrics.pending,
        Score: student.score ?? "",
        Grade: student.grade ?? "",
        Provisional: student.provisional ? "yes" : "no",
      })),
    };
  }

  /* clinic-activity */
  const cases = await universityService.getCases({});
  const opened = cases.filter((item) => inRange(item.openedAt, range.from, range.to));
  const allocated = cases.filter((item) => item.studentId);

  return {
    summary: [
      { label: "Registered in period", value: opened.length },
      { label: "Patients on file", value: cases.length },
      { label: "Allocated to a student", value: `${allocated.length} (${pct(allocated.length, cases.length)}%)` },
      {
        label: "Consent signed",
        value: `${cases.filter((item) => item.consentSigned).length} (${pct(
          cases.filter((item) => item.consentSigned).length,
          cases.length
        )}%)`,
      },
      {
        label: "In treatment",
        value: cases.filter((item) => item.status === "in_treatment").length,
      },
      { label: "Completed", value: cases.filter((item) => item.status === "completed").length },
    ],
    rows: opened.map((item) => ({
      Registered: item.openedAt,
      Patient: item.patientName,
      "National ID": item.nationalId,
      Rotation: departmentMeta(item.department).short,
      Student: item.studentName ?? "",
      Status: item.status,
      Consent: item.consentSigned ? "signed" : "outstanding",
    })),
  };
}

/* --------------------------------------------------------------- preview */

function ReportPreview({ snapshot, onClose }) {
  const columns = useMemo(
    () => (snapshot?.data?.rows?.length ? Object.keys(snapshot.data.rows[0]) : []),
    [snapshot]
  );

  if (!snapshot) return null;

  return (
    <Modal
      open={Boolean(snapshot)}
      onClose={onClose}
      title={snapshot.name}
      description={`${formatDate(snapshot.from, "d MMM yyyy")} → ${formatDate(snapshot.to, "d MMM yyyy")}`}
      size="xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button leftIcon={<Printer className="h-4 w-4" />} onClick={() => window.print()}>
            Print / save as PDF
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <Badge tone="neutral">
          Snapshot taken {formatDate(snapshot.createdAt, "d MMM yyyy, HH:mm")}
        </Badge>

        <DetailGrid columns={3} items={snapshot.data.summary} />

        {snapshot.data.rows.length === 0 ? (
          <EmptyState title="No rows in this period" className="py-10" />
        ) : (
          <div className="od-scroll-x max-h-[46vh] overflow-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-[12.5px]">
              <thead className="sticky top-0 bg-slate-50">
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column}
                      className="whitespace-nowrap border-b border-slate-200 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.06em] text-ink-soft"
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {snapshot.data.rows.map((row, index) => (
                  <tr key={index} className="border-t border-slate-100">
                    {columns.map((column) => (
                      <td key={column} className="whitespace-nowrap px-3 py-2 text-ink-muted">
                        {String(row[column] ?? "—")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Modal>
  );
}
