import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Check,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  Clock3,
  FileSignature,
  FlaskConical,
  GraduationCap,
  History,
  Images,
  Info,
  Lock,
  LockOpen,
  Printer,
  RefreshCw,
  Stethoscope,
  TriangleAlert,
  UserRound,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useAsync } from "@/hooks";
import { universityService } from "@/services";
import { formatDate } from "@/lib/format";
import { uni } from "@/config/paths";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { InfoBanner, KeyValue, SearchInput } from "@/components/ui/Misc";
import { ToothChart } from "@/odontogram";
import {
  ALL_CONDITIONS,
  ALL_PROCEDURES,
  ChartLegend,
  LOWER_TEETH,
  Swatch,
  Tooth,
  UPPER_TEETH,
} from "@/university/components/toothArch";
import {
  CaseStatusBadge,
  DepartmentChip,
  DetailGrid,
  LabStatusBadge,
  RequestStatusBadge,
  ReviewStatusBadge,
} from "@/university/components";

/**
 * The patient dossier — the faculty's read of a record they did not write.
 *
 * A student works one tab of a patient at a time because they are mid-
 * procedure. A staff member is doing the opposite: reconstructing what
 * happened to this person, usually because a submission looks wrong. So it is
 * assembled in one call, is strictly read-only, and leads with the summary —
 * the question is "what happened here", not "what shall I do next".
 *
 * Every edit still lives on the student's side. Nothing here writes.
 *
 * This is the body only, with no page chrome, because it is read from two
 * places: its own route, and — far more often — a dialog stacked on top of the
 * submission being judged, so the record and the verdict never get separated
 * by a navigation. `embedded` is the difference between the two.
 */

const TABS = [
  { key: "overview", label: "Overview", icon: UserRound },
  { key: "chart", label: "Tooth chart", icon: Stethoscope, count: (d) => d.counts.charts },
  { key: "sheets", label: "Sheets", icon: ClipboardList, count: (d) => d.counts.sheets },
  { key: "reviews", label: "Reviews", icon: ClipboardCheck, count: (d) => d.counts.reviews },
  { key: "imaging", label: "Imaging", icon: Images, count: (d) => d.counts.xrays + d.counts.gallery },
  {
    key: "schedule",
    label: "Schedule",
    icon: CalendarDays,
    count: (d) => d.counts.appointments + d.counts.procedureRequests,
  },
  { key: "lab", label: "Lab", icon: FlaskConical, count: (d) => d.counts.labRequests },
  { key: "consent", label: "Consent", icon: FileSignature },
];

const TIMELINE_TONES = {
  registration: "bg-slate-100 text-ink-muted",
  procedureRequest: "bg-accent-50 text-accent-700",
  appointment: "bg-info-soft text-info-ink",
  chart: "bg-brand-100 text-brand-700",
  sheet: "bg-brand-50 text-brand-700",
  labRequest: "bg-accent-50 text-accent-700",
  reviewSubmitted: "bg-warning-soft text-warning-ink",
  reviewDecided: "bg-success-soft text-success-strong",
};

const TIMELINE_ICONS = {
  registration: UserRound,
  procedureRequest: ClipboardList,
  appointment: CalendarDays,
  chart: Stethoscope,
  sheet: ClipboardList,
  labRequest: FlaskConical,
  reviewSubmitted: ClipboardCheck,
  reviewDecided: ClipboardCheck,
};

const titleCase = (value) =>
  String(value ?? "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/^./, (character) => character.toUpperCase())
    .trim();

/* ------------------------------------------------------------- small parts */

function Stat({ label, value, tone }) {
  return (
    <div className="rounded-xl border border-slate-200 px-3 py-2">
      <span className="block text-[11px] font-bold uppercase tracking-wide text-ink-soft">
        {label}
      </span>
      <span className={cn("mt-0.5 block text-[17px] font-extrabold text-ink", tone)}>{value}</span>
    </div>
  );
}

/** A sheet's body varies by discipline, so it is rendered from whatever keys
    it holds rather than a fixed field list that would hide a new one. */
function SheetBody({ sheet }) {
  const entries = Object.entries(sheet.sections ?? {}).filter(
    ([, value]) => value !== null && value !== undefined && value !== ""
  );

  return (
    <div className="flex flex-col gap-3">
      <DetailGrid
        columns={2}
        items={[
          { label: "Diagnosis", value: sheet.diagnosis },
          { label: "Treatment plan", value: sheet.treatmentPlan },
        ]}
      />
      {entries.length ? (
        <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
          {entries.map(([key, value]) => (
            <div key={key} className="min-w-0">
              <span className="od-label">{titleCase(key)}</span>
              <dd className="mt-0.5 break-words text-[13px] text-ink">
                {typeof value === "object" ? JSON.stringify(value) : String(value)}
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="text-[12.5px] text-ink-soft">
          No section answers were recorded on this sheet.
        </p>
      )}
    </div>
  );
}

function ReviewCard({ review }) {
  const summary = review.stepSummary;
  return (
    <Card>
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 bg-slate-50/70 px-4 py-3">
        <ReviewStatusBadge status={review.status} />
        <span className="text-[13.5px] font-bold text-ink">{review.procedureType}</span>
        <span className="text-[11.5px] text-ink-soft">
          submitted {formatDate(review.submittedDate, "d MMM yyyy, HH:mm")}
          {review.reviewedDate
            ? ` · decided ${formatDate(review.reviewedDate, "d MMM yyyy, HH:mm")}`
            : ""}
        </span>
        <span className="ml-auto text-[11.5px] text-ink-soft">
          {review.studentName ?? "Student not recorded"}
        </span>
      </div>

      <CardBody className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat label="Steps" value={summary.total} />
          <Stat label="Ticked by student" value={summary.completedByStudent} tone="text-brand-700" />
          <Stat label="Approved" value={summary.accepted} tone="text-success-strong" />
          <Stat
            label="Declined"
            value={summary.declined}
            tone={summary.declined ? "text-danger" : undefined}
          />
        </div>

        {summary.total > 0 ? (
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <div className="grid grid-cols-[1fr_6.5rem_6.5rem] gap-2 bg-slate-50 px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-ink-soft">
              <span>Review step</span>
              <span className="text-center">Student</span>
              <span className="text-center">Faculty</span>
            </div>
            <ul>
              {review.steps.map((step) => (
                <li
                  key={step.index}
                  className="grid grid-cols-[1fr_6.5rem_6.5rem] items-center gap-2 border-t border-slate-100 px-3 py-2"
                >
                  <span className="min-w-0 text-[13px] text-ink">
                    {step.label}
                    {step.note ? (
                      <span className="block text-[11.5px] text-ink-soft">{step.note}</span>
                    ) : null}
                  </span>
                  <span className="text-center">
                    {step.completedByStudent === true ? (
                      <span className="inline-flex items-center gap-1 text-[12px] font-bold text-success-strong">
                        <Check className="h-3 w-3" /> Done
                      </span>
                    ) : step.completedByStudent === false ? (
                      <span className="text-[12px] text-ink-faint">Not ticked</span>
                    ) : (
                      <span
                        className="text-[12px] text-ink-faint"
                        title="This submission stored steps without tick information"
                      >
                        —
                      </span>
                    )}
                  </span>
                  <span className="text-center">
                    {step.supervisorDecision === "accepted" ? (
                      <span className="inline-flex items-center gap-1 text-[12px] font-bold text-success-strong">
                        <Check className="h-3 w-3" /> Approved
                      </span>
                    ) : step.supervisorDecision === "declined" ? (
                      <span className="inline-flex items-center gap-1 text-[12px] font-bold text-danger">
                        <X className="h-3 w-3" /> Declined
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[12px] text-warning-ink">
                        <Clock3 className="h-3 w-3" /> Pending
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-[13px] text-ink-soft">This submission recorded no review steps.</p>
        )}

        <DetailGrid
          columns={2}
          items={[
            { label: "Student's note", value: review.studentNote ?? review.studentComment },
            { label: "Reviewed by", value: review.supervisorName },
            { label: "Score", value: review.score != null ? `${review.score}/100` : null },
            {
              label: "Signature",
              value: review.hasSupervisorSignature ? (
                <span className="inline-flex items-center gap-1 text-success-strong">
                  <Check className="h-3.5 w-3.5" /> Recorded
                </span>
              ) : null,
            },
          ]}
        />
      </CardBody>
    </Card>
  );
}

/* ---------------------------------------------------------- the chart tab */

function ToothChartPanel({ chart }) {
  const [selected, setSelected] = useState(null);
  const [onlyRecorded, setOnlyRecorded] = useState(true);

  const byNumber = useMemo(
    () => Object.fromEntries((chart.teeth ?? []).map((tooth) => [tooth.number, tooth])),
    [chart]
  );

  const rows = (chart.teeth ?? []).filter((tooth) => !onlyRecorded || tooth.hasData);
  const detail = selected ? byNumber[selected] : null;

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader
          title={chart.title}
          subtitle={`Recorded by ${chart.studentName ?? "an unknown student"} · updated ${formatDate(
            chart.updatedAt,
            "d MMM yyyy"
          )}`}
          action={
            <span className="flex items-center gap-2">
              <Badge tone={chart.isLocked ? "neutral" : "success"}>
                {chart.isLocked ? <Lock className="h-3 w-3" /> : <LockOpen className="h-3 w-3" />}
                {chart.isLocked ? "Locked" : "Open"}
              </Badge>
              <Button
                variant="secondary"
                size="xs"
                leftIcon={<Printer className="h-3.5 w-3.5" />}
                onClick={() => window.print()}
              >
                Print
              </Button>
            </span>
          }
        />
        <CardBody className="flex flex-col gap-4 pt-2">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label="Teeth recorded" value={chart.summary.recorded} />
            <Stat label="Upper" value={chart.summary.upper} />
            <Stat label="Lower" value={chart.summary.lower} />
            <Stat label="Surfaces marked" value={chart.summary.surfacesMarked} />
          </div>

          {/* The chart the student actually drew on, read-only. Falls back to
              the arch built from the derived entries for a record charted
              before the shared tooth chart landed. */}
          {chart.odontogram ? (
            <ToothChart variant="compact" readOnly value={chart.odontogram} />
          ) : (
            <div className="od-scroll-x overflow-x-auto">
              <div className="od-teeth-chart">
                <div className="od-arch">
                  {UPPER_TEETH.map((number) => (
                    <Tooth
                      key={number}
                      number={number}
                      upper
                      entry={byNumber[number]?.hasData ? byNumber[number] : null}
                      selected={selected === number}
                      onSelect={setSelected}
                    />
                  ))}
                </div>
                <div className="od-arch">
                  {LOWER_TEETH.map((number) => (
                    <Tooth
                      key={number}
                      number={number}
                      upper={false}
                      entry={byNumber[number]?.hasData ? byNumber[number] : null}
                      selected={selected === number}
                      onSelect={setSelected}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            {[
              { heading: "Procedures", tallies: chart.summary.procedures, list: ALL_PROCEDURES },
              { heading: "Conditions", tallies: chart.summary.conditions, list: ALL_CONDITIONS },
            ].map((column) => (
              <div key={column.heading}>
                <span className="od-label">{column.heading}</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {column.tallies.length ? (
                    column.tallies.map((entry) => (
                      <span key={entry.name} className="flex items-center gap-1.5">
                        <Swatch name={entry.name} list={column.list} />
                        <span className="text-[12px] font-bold text-ink-soft">×{entry.count}</span>
                      </span>
                    ))
                  ) : (
                    <span className="text-[12.5px] text-ink-soft">None recorded</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      <ChartLegend />

      <Card>
        <CardHeader
          title="Charted teeth"
          subtitle={`${rows.length} tooth${rows.length === 1 ? "" : "s"} listed`}
          action={
            <Button variant="secondary" size="xs" onClick={() => setOnlyRecorded((value) => !value)}>
              {onlyRecorded ? "Show all 32" : "Only recorded"}
            </Button>
          }
        />
        <CardBody className="pt-2">
          {rows.length === 0 ? (
            <EmptyState title="Nothing charted on this record" className="py-8" />
          ) : (
            <ul className="flex flex-col gap-2">
              {rows.map((tooth) => (
                <li
                  key={tooth.number}
                  className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 px-3.5 py-2.5"
                >
                  <span className="w-10 shrink-0 text-[13px] font-extrabold text-ink">
                    {tooth.number}
                  </span>
                  {tooth.hasData ? (
                    <>
                      {tooth.condition ? (
                        <Swatch name={tooth.condition} list={ALL_CONDITIONS} />
                      ) : null}
                      {tooth.procedure ? (
                        <Swatch name={tooth.procedure} list={ALL_PROCEDURES} />
                      ) : null}
                      <span className="text-[12px] text-ink-soft">
                        {tooth.surfaces.length ? tooth.surfaces.join(", ") : "no surfaces marked"}
                      </span>
                      <span className="ml-auto text-[11.5px] text-ink-faint">
                        {formatDate(tooth.date, "d MMM yyyy")}
                      </span>
                    </>
                  ) : (
                    <span className="text-[12.5px] text-ink-faint">Not recorded</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      <Modal
        open={Boolean(detail?.hasData)}
        onClose={() => setSelected(null)}
        title={`Tooth ${selected}`}
        size="sm"
      >
        {detail ? (
          <DetailGrid
            columns={2}
            items={[
              { label: "Condition", value: detail.condition },
              { label: "Procedure", value: detail.procedure },
              { label: "Surfaces", value: detail.surfaces.join(", ") || "—" },
              { label: "Recorded", value: formatDate(detail.date, "d MMM yyyy") },
              { label: "Notes", value: detail.notes || "—" },
            ]}
          />
        ) : null}
      </Modal>
    </div>
  );
}

/* ------------------------------------------------------------- the screen */

export function PatientDossierView({ nationalId, embedded = false, onNavigateAway }) {
  const navigate = useNavigate();

  /* Following a link out of a dialog has to close the dialog first, or the
     new screen renders behind a locked overlay. */
  const go = (to) => {
    onNavigateAway?.();
    navigate(to);
  };

  const [tab, setTab] = useState("overview");
  const [reviewFilter, setReviewFilter] = useState("all");
  const [sheetQuery, setSheetQuery] = useState("");
  const [lightbox, setLightbox] = useState(null);

  const { data: dossier, loading, error, refetch } = useAsync(
    () => universityService.getPatientDossier(nationalId),
    [nationalId]
  );

  const visibleReviews = useMemo(() => {
    const list = dossier?.reviews ?? [];
    return reviewFilter === "all" ? list : list.filter((item) => item.status === reviewFilter);
  }, [dossier, reviewFilter]);

  const visibleSheets = useMemo(() => {
    const list = dossier?.sheets ?? [];
    const needle = sheetQuery.trim().toLowerCase();
    if (!needle) return list;
    return list.filter((sheet) => JSON.stringify(sheet).toLowerCase().includes(needle));
  }, [dossier, sheetQuery]);

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  if (error || !dossier) {
    return (
      <EmptyState
        icon={<TriangleAlert className="h-6 w-6" />}
        title="Patient record unavailable"
        description={
          error?.status === 404
            ? `No patient matches ${nationalId}.`
            : error?.message ?? "Could not load this patient. Try again."
        }
        action={
          <span className="flex flex-wrap items-center justify-center gap-2">
            <Button onClick={refetch}>Try again</Button>
            {embedded ? null : (
              <Button variant="secondary" onClick={() => navigate(uni.reviewQueue)}>
                Back to the queue
              </Button>
            )}
          </span>
        }
        className="od-card py-16"
      />
    );
  }

  const { patient, counts, timeline, contributors } = dossier;
  const alerts = [
    ...(patient.medical.chronicDiseases ?? []),
    patient.medical.allergies ? `Allergies: ${patient.medical.allergies}` : null,
  ].filter(Boolean);

  return (
    <div className="flex flex-col gap-5">
      {/* ---------------------------------------------------- who this is */}
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-brand-50/70 via-white to-white px-5 py-4">
        <div className="flex flex-wrap items-start gap-4">
          <Avatar name={patient.fullName} size="lg" />
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-[19px] font-extrabold leading-tight text-ink">
              {patient.fullName}
            </h2>
            <p className="mt-0.5 text-[12.5px] font-semibold text-ink-muted">
              {patient.age} yrs · {patient.gender} · {patient.nationalId}
              {patient.serialNumber ? ` · serial ${patient.serialNumber}` : ""}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <CaseStatusBadge status={patient.status} />
              <DepartmentChip department={patient.department} />
              <Badge tone="neutral">
                Registered {formatDate(patient.registrationDate, "d MMM yyyy")}
              </Badge>
              <Badge tone={patient.consent?.isSigned ? "success" : "warning"}>
                {patient.consent?.isSigned ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <Clock3 className="h-3 w-3" />
                )}
                {patient.consent?.isSigned ? "Consent signed" : "Consent missing"}
              </Badge>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<RefreshCw className="h-4 w-4" />}
            onClick={refetch}
          >
            Refresh
          </Button>
        </div>

        {/* the four numbers that answer "what has been done here" */}
        <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-200/80 pt-3.5 sm:grid-cols-5">
          <Stat label="Visits" value={counts.appointments} />
          <Stat label="Sheets filed" value={counts.sheets} />
          <Stat label="Submitted" value={counts.reviews} tone="text-brand-700" />
          <Stat
            label="Accepted"
            value={counts.reviewsAccepted}
            tone={counts.reviewsAccepted ? "text-success-strong" : undefined}
          />
          <Stat
            label="Awaiting a verdict"
            value={counts.reviewsPending}
            tone={counts.reviewsPending ? "text-warning-ink" : undefined}
          />
        </div>
      </div>

      {alerts.length ? (
        <InfoBanner tone="warning" icon={<TriangleAlert className="h-4 w-4" />}>
          <span className="font-bold">Medical alert.</span> {alerts.join(" · ")}
        </InfoBanner>
      ) : null}

      <InfoBanner tone="neutral">
        Read-only. Every entry below belongs to the student who made it — corrections go back
        through them.
      </InfoBanner>

      {/* ------------------------------------------------------------ tabs */}
      <nav
        className={cn(
          "od-scroll-x flex items-stretch gap-1 overflow-x-auto border-b border-slate-200 pb-px",
          /* In a dialog the tab strip has to survive the scroll — the record
             is long and the reader loses their place otherwise. The negative
             offsets bleed it over the dialog body's own padding. */
          embedded && "sticky -top-5 z-20 -mx-6 -mt-1 bg-white px-6 pt-4"
        )}
      >
        {TABS.map((entry) => {
          const Icon = entry.icon;
          const active = tab === entry.key;
          const count = entry.count?.(dossier);
          return (
            <button
              key={entry.key}
              type="button"
              aria-selected={active}
              role="tab"
              onClick={() => setTab(entry.key)}
              className={cn(
                "od-focus -mb-px flex shrink-0 items-center gap-2 border-b-2 px-3.5 pb-3 pt-2 text-[13px] font-semibold transition-colors",
                active
                  ? "border-brand-600 text-brand-700"
                  : "border-transparent text-ink-muted hover:text-ink"
              )}
            >
              <Icon className="h-4 w-4" />
              {entry.label}
              {count != null ? (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[11px] font-bold",
                    active ? "bg-brand-100 text-brand-700" : "bg-slate-100 text-ink-soft"
                  )}
                >
                  {count}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      {/* -------------------------------------------------------- overview */}
      {tab === "overview" ? (
        <div className="grid grid-cols-12 gap-5">
          <div className="col-span-12 flex flex-col gap-5 xl:col-span-4">
            <Card>
              <CardHeader title="Patient record" />
              <CardBody className="pt-2">
                <DetailGrid
                  columns={2}
                  items={[
                    { label: "Full name", value: patient.fullName },
                    { label: "National ID", value: patient.nationalId },
                    { label: "Serial number", value: patient.serialNumber },
                    { label: "Registered", value: formatDate(patient.registrationDate, "d MMM yyyy") },
                    { label: "Age", value: patient.age },
                    { label: "Gender", value: patient.gender },
                    { label: "Phone", value: patient.phoneNumber },
                    { label: "Occupation", value: patient.occupation },
                    { label: "Address", value: patient.address },
                  ]}
                />
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Medical history" />
              <CardBody className="flex flex-col gap-3 pt-2">
                <KeyValue label="Chief complaint" value={patient.medical.chiefComplaint} />
                <div>
                  <span className="od-label">Chronic diseases</span>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {patient.medical.chronicDiseases?.length ? (
                      patient.medical.chronicDiseases.map((disease) => (
                        <Badge key={disease} tone="danger">
                          {disease}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-[13px] text-ink-soft">None recorded</span>
                    )}
                  </div>
                </div>
                <KeyValue label="Current medications" value={patient.medical.currentMedications} />
                <KeyValue
                  label="Recent surgical procedures"
                  value={patient.medical.recentSurgicalProcedures}
                />
                <KeyValue label="Allergies" value={patient.medical.allergies ?? "None recorded"} />
              </CardBody>
            </Card>
          </div>

          <div className="col-span-12 flex flex-col gap-5 xl:col-span-8">
            <Card>
              <CardHeader
                title="What the students did for this patient"
                subtitle="Everyone who touched the record, not only who it is allocated to"
              />
              <CardBody className="pt-2">
                {contributors.length === 0 ? (
                  <EmptyState
                    icon={<GraduationCap className="h-6 w-6" />}
                    title="No student work recorded yet"
                    className="py-8"
                  />
                ) : (
                  <ul className="flex flex-col gap-3">
                    {contributors.map((person) => (
                      <li
                        key={person.studentId ?? person.name}
                        className="rounded-xl border border-slate-200 p-3"
                      >
                        <div className="mb-2.5 flex flex-wrap items-center gap-2">
                          <Avatar name={person.name} size="sm" />
                          <span className="min-w-0">
                            <span className="block truncate text-[13px] font-bold text-ink">
                              {person.name}
                            </span>
                            {person.studentId ? (
                              <span className="block text-[11.5px] text-ink-soft">
                                {person.studentId}
                              </span>
                            ) : null}
                          </span>
                          {person.isAssigned ? <Badge tone="brand">Allocated</Badge> : null}
                          {person.studentId ? (
                            <button
                              type="button"
                              onClick={() => go(uni.student(person.studentId))}
                              className="od-focus ml-auto inline-flex items-center gap-1 rounded text-[12px] font-bold text-brand-700 hover:underline"
                            >
                              Scorecard <ChevronRight className="h-3 w-3" />
                            </button>
                          ) : null}
                        </div>
                        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                          <Stat label="Charts" value={person.charts} />
                          <Stat label="Sheets" value={person.sheets} />
                          <Stat label="Reviews" value={person.reviews} />
                          <Stat label="Visits" value={person.appointments} />
                          <Stat label="Lab" value={person.labRequests} />
                          <Stat label="Requests" value={person.procedureRequests} />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Review outcomes" />
              <CardBody className="flex flex-col gap-4 pt-2">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <Stat label="Submitted" value={counts.reviews} tone="text-brand-700" />
                  <Stat
                    label="Accepted"
                    value={counts.reviewsAccepted}
                    tone={counts.reviewsAccepted ? "text-success-strong" : undefined}
                  />
                  <Stat
                    label="Declined"
                    value={counts.reviewsDeclined}
                    tone={counts.reviewsDeclined ? "text-danger" : undefined}
                  />
                  <Stat
                    label="Pending"
                    value={counts.reviewsPending}
                    tone={counts.reviewsPending ? "text-warning-ink" : undefined}
                  />
                </div>
                {dossier.reviews.length === 0 ? (
                  <EmptyState
                    icon={<ClipboardCheck className="h-6 w-6" />}
                    title="Nothing submitted for review yet"
                    className="py-8"
                  />
                ) : (
                  <>
                    <ul className="flex flex-col gap-2">
                      {dossier.reviews.slice(0, 5).map((review) => (
                        <li
                          key={review.id}
                          className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-2 last:border-0"
                        >
                          <ReviewStatusBadge status={review.status} />
                          <span className="text-[13px] text-ink">{review.procedureType}</span>
                          <span className="text-[11.5px] text-ink-soft">
                            {review.stepSummary.completedByStudent}/{review.stepSummary.total} steps
                          </span>
                          <span className="ml-auto text-[11.5px] text-ink-soft">
                            {formatDate(review.submittedDate, "d MMM yyyy")}
                          </span>
                        </li>
                      ))}
                    </ul>
                    {dossier.reviews.length > 5 ? (
                      <Button variant="link" size="sm" className="self-start" onClick={() => setTab("reviews")}>
                        See all {dossier.reviews.length} submissions
                      </Button>
                    ) : null}
                  </>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Activity timeline" subtitle="Newest first" />
              <CardBody className="pt-2">
                {timeline.length === 0 ? (
                  <EmptyState
                    icon={<History className="h-6 w-6" />}
                    title="No dated activity recorded"
                    className="py-8"
                  />
                ) : (
                  <ol className="flex flex-col gap-3">
                    {timeline.map((event, index) => {
                      const Icon = TIMELINE_ICONS[event.kind] ?? Info;
                      return (
                        <li key={`${event.at}-${index}`} className="flex gap-3">
                          <span
                            className={cn(
                              "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                              TIMELINE_TONES[event.kind] ?? "bg-slate-100 text-ink-muted"
                            )}
                          >
                            <Icon className="h-3.5 w-3.5" />
                          </span>
                          <span className="min-w-0 flex-1 pb-1">
                            <span className="flex flex-wrap items-baseline gap-2">
                              <span className="text-[13px] font-bold text-ink">{event.title}</span>
                              {event.status ? <ReviewStatusBadge status={event.status} /> : null}
                              <span className="ml-auto whitespace-nowrap text-[11.5px] text-ink-soft">
                                {formatDate(event.at, "d MMM yyyy")}
                              </span>
                            </span>
                            {event.detail ? (
                              <span className="block text-[12px] text-ink-muted">{event.detail}</span>
                            ) : null}
                            {event.actor ? (
                              <span className="block text-[11.5px] text-ink-faint">{event.actor}</span>
                            ) : null}
                          </span>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </CardBody>
            </Card>
          </div>
        </div>
      ) : null}

      {/* ----------------------------------------------------------- chart */}
      {tab === "chart" ? (
        dossier.charts.length ? (
          <ToothChartPanel chart={dossier.charts[0]} />
        ) : (
          <EmptyState
            icon={<Stethoscope className="h-6 w-6" />}
            title="No odontogram recorded"
            description="Nothing has been charted on this patient yet."
            className="od-card py-16"
          />
        )
      ) : null}

      {/* ---------------------------------------------------------- sheets */}
      {tab === "sheets" ? (
        <div className="flex flex-col gap-4">
          {dossier.sheets.length > 2 ? (
            <SearchInput
              value={sheetQuery}
              onChange={setSheetQuery}
              placeholder="Search within sheets…"
              className="w-full sm:w-[340px]"
            />
          ) : null}
          {visibleSheets.length === 0 ? (
            <EmptyState
              icon={<ClipboardList className="h-6 w-6" />}
              title={dossier.sheets.length ? "No sheet matches that search" : "No treatment sheet filed"}
              className="od-card py-16"
            />
          ) : (
            visibleSheets.map((sheet) => (
              <Card key={sheet.id}>
                <CardHeader
                  title={sheet.type}
                  subtitle={`Filed ${formatDate(sheet.createdAt, "d MMM yyyy")}`}
                  action={<Badge tone="neutral">{titleCase(sheet.status)}</Badge>}
                />
                <CardBody className="pt-2">
                  <SheetBody sheet={sheet} />
                </CardBody>
              </Card>
            ))
          )}
        </div>
      ) : null}

      {/* --------------------------------------------------------- reviews */}
      {tab === "reviews" ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            {[
              ["all", "All", counts.reviews],
              ["pending", "Pending", counts.reviewsPending],
              ["accepted", "Accepted", counts.reviewsAccepted],
              ["returned", "Returned", null],
              ["rejected", "Rejected", null],
            ].map(([key, label, count]) => {
              const active = reviewFilter === key;
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setReviewFilter(key)}
                  className={cn(
                    "od-focus rounded-xl px-3.5 py-2 text-[13px] font-semibold transition",
                    active
                      ? "bg-brand-600 text-white"
                      : "bg-slate-100 text-ink-muted hover:bg-brand-100 hover:text-brand-700"
                  )}
                >
                  {label}
                  {count != null ? ` (${count})` : ""}
                </button>
              );
            })}
          </div>
          {visibleReviews.length === 0 ? (
            <EmptyState
              icon={<ClipboardCheck className="h-6 w-6" />}
              title={counts.reviews ? "Nothing in this state" : "Nothing submitted for review yet"}
              className="od-card py-16"
            />
          ) : (
            visibleReviews.map((review) => <ReviewCard key={review.id} review={review} />)
          )}
        </div>
      ) : null}

      {/* --------------------------------------------------------- imaging */}
      {tab === "imaging" ? (
        <div className="flex flex-col gap-4">
          {[
            ["X-rays", patient.xrays],
            ["Clinical photos", patient.gallery],
          ].map(([heading, items]) => (
            <Card key={heading}>
              <CardHeader title={`${heading} (${items.length})`} />
              <CardBody className="pt-2">
                {items.length === 0 ? (
                  <EmptyState
                    icon={<Images className="h-6 w-6" />}
                    title={`No ${heading.toLowerCase()} uploaded`}
                    className="py-8"
                  />
                ) : (
                  <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {items.map((item) => (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => setLightbox(item)}
                          className="od-focus group w-full overflow-hidden rounded-xl border border-slate-200 text-left transition hover:border-brand-300"
                        >
                          <img
                            src={item.url}
                            alt={item.note || heading}
                            loading="lazy"
                            className="h-32 w-full bg-slate-100 object-cover transition-transform group-hover:scale-[1.03]"
                          />
                          <span className="block p-2">
                            <span className="block truncate text-[12px] text-ink">
                              {item.note || "No note"}
                            </span>
                            <span className="block text-[11px] text-ink-faint">
                              {formatDate(item.uploadedAt, "d MMM yyyy")}
                            </span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      ) : null}

      {/* -------------------------------------------------------- schedule */}
      {tab === "schedule" ? (
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader title={`Appointments (${dossier.appointments.length})`} />
            <CardBody className="pt-2">
              {dossier.appointments.length === 0 ? (
                <EmptyState
                  icon={<CalendarDays className="h-6 w-6" />}
                  title="No appointment recorded"
                  className="py-8"
                />
              ) : (
                <ul className="flex flex-col gap-2">
                  {dossier.appointments.map((appointment) => (
                    <li
                      key={appointment.id}
                      className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 px-3.5 py-2.5"
                    >
                      <span className="min-w-0">
                        <span className="block text-[13px] font-bold text-ink">
                          {formatDate(appointment.date, "d MMM yyyy")} · {appointment.time}
                        </span>
                        <span className="block truncate text-[11.5px] text-ink-soft">
                          {appointment.studentName ?? "No student"} · chair {appointment.chair ?? "—"}
                        </span>
                      </span>
                      <span className="ml-auto flex shrink-0 items-center gap-2">
                        <DepartmentChip department={appointment.department} short />
                        <Badge tone="neutral">{titleCase(appointment.status)}</Badge>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title={`Procedure requests (${dossier.procedureRequests.length})`} />
            <CardBody className="pt-2">
              {dossier.procedureRequests.length === 0 ? (
                <EmptyState
                  icon={<ClipboardList className="h-6 w-6" />}
                  title="No procedure request for this patient"
                  className="py-8"
                />
              ) : (
                <ul className="flex flex-col gap-2">
                  {dossier.procedureRequests.map((request) => (
                    <li key={request.id} className="rounded-xl border border-slate-200 px-3.5 py-2.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <RequestStatusBadge status={request.status} />
                        <span className="text-[13px] font-bold text-ink">{request.kind}</span>
                        {request.urgency === "urgent" ? <Badge tone="danger">Urgent</Badge> : null}
                        <span className="ml-auto text-[11.5px] text-ink-soft">
                          {formatDate(request.requestedAt, "d MMM yyyy")}
                        </span>
                      </div>
                      <p className="mt-1 text-[12px] text-ink-muted">
                        {request.studentName}
                        {request.note ? ` · ${request.note}` : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>
      ) : null}

      {/* ------------------------------------------------------------- lab */}
      {tab === "lab" ? (
        <Card>
          <CardHeader title={`Lab requests (${dossier.labRequests.length})`} />
          <CardBody className="pt-2">
            {dossier.labRequests.length === 0 ? (
              <EmptyState
                icon={<FlaskConical className="h-6 w-6" />}
                title="No lab request for this patient"
                className="py-8"
              />
            ) : (
              <ul className="flex flex-col gap-2">
                {dossier.labRequests.map((request) => (
                  <li key={request.id} className="rounded-xl border border-slate-200 px-3.5 py-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <LabStatusBadge status={request.status} />
                      <span className="text-[13px] font-bold text-ink">{request.item}</span>
                      <Badge tone="neutral">{titleCase(request.labKind)}</Badge>
                      <span className="ml-auto text-[11.5px] text-ink-soft">
                        requested {formatDate(request.requestedAt, "d MMM yyyy")}
                        {request.dueAt ? ` · due ${formatDate(request.dueAt, "d MMM yyyy")}` : ""}
                      </span>
                    </div>
                    <p className="mt-1 text-[12px] text-ink-muted">
                      {request.studentName ?? "student not recorded"} · {request.labName}
                      {request.note ? ` · ${request.note}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      ) : null}

      {/* --------------------------------------------------------- consent */}
      {tab === "consent" ? (
        <Card>
          <CardHeader title="Consent" />
          <CardBody className="flex flex-col gap-4 pt-2">
            {!patient.consent ? (
              <EmptyState
                icon={<FileSignature className="h-6 w-6" />}
                title="No consent recorded"
                description="Nothing on this case can be submitted for review until consent is captured."
                className="py-10"
              />
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={patient.consent.isSigned ? "success" : "warning"}>
                    {patient.consent.isSigned ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <Clock3 className="h-3 w-3" />
                    )}
                    {patient.consent.isSigned ? "Signed" : "Not signed"}
                  </Badge>
                  {patient.consent.signedAt ? (
                    <span className="text-[13px] text-ink-muted">
                      on {formatDate(patient.consent.signedAt, "d MMM yyyy, HH:mm")}
                    </span>
                  ) : null}
                </div>
                <DetailGrid
                  columns={2}
                  items={[
                    { label: "Typed signature", value: patient.consent.signatureText },
                    {
                      label: "Method",
                      value: patient.consent.method ? titleCase(patient.consent.method) : null,
                    },
                  ]}
                />
                {patient.consent.signatureImage ? (
                  <div>
                    <span className="od-label">Signature</span>
                    <img
                      src={patient.consent.signatureImage}
                      alt="Patient signature"
                      className="mt-2 max-h-32 rounded-xl border border-slate-200 bg-white p-2"
                    />
                  </div>
                ) : null}
              </>
            )}
          </CardBody>
        </Card>
      ) : null}

      <p className="px-1 text-center text-[11.5px] text-ink-faint">
        Read-only view · loaded {formatDate(dossier.generatedAt, "d MMM yyyy, HH:mm")}
      </p>

      <Modal
        open={Boolean(lightbox)}
        onClose={() => setLightbox(null)}
        title={lightbox?.note || "Patient image"}
        description={
          lightbox
            ? `${formatDate(lightbox.uploadedAt, "d MMM yyyy")}${
                lightbox.uploadedBy ? ` · ${lightbox.uploadedBy}` : ""
              }`
            : undefined
        }
        size="xl"
      >
        {lightbox ? (
          <img
            src={lightbox.url}
            alt={lightbox.note || "Patient image"}
            className="mx-auto max-h-[60vh] w-auto rounded-xl"
          />
        ) : null}
      </Modal>
    </div>
  );
}
