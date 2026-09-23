import { useMemo, useState } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  FileSignature,
  FlaskConical,
  Images,
  NotebookPen,
  Send,
  ShieldOff,
  Stethoscope,
  UserPlus,
} from "lucide-react";
import { useAsync } from "@/hooks";
import { universityService } from "@/services";
import { formatDate, fromNow } from "@/lib/format";
import { UP } from "@/auth/permissions";
import { useAuth } from "@/auth/AuthContext";
import { uni } from "@/config/paths";
import { departmentMeta, sheetMeta } from "@/config/academic";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { OdentaLoaderPanel } from "@/components/ui/OdentaLoader";
import { EmptyState } from "@/components/ui/EmptyState";
import { InfoBanner } from "@/components/ui/Misc";
import { useToast } from "@/components/ui/Toast";
import { ToothChart, readChartEntries, readChartPayload } from "@/odontogram";
import {
  CaseAlerts,
  CaseStatusBadge,
  DepartmentChip,
  DetailGrid,
  ReviewStatusBadge,
} from "@/university/components";
import { ReviewDrawer } from "@/university/components/ReviewDrawer";
import { AllocateCaseModal } from "./AllocateCaseModal";
import { SubmitStepModal } from "./SubmitStepModal";
import { TreatmentSheet } from "./TreatmentSheet";

/**
 * One case, end to end.
 *
 * The tabs follow the order a student actually works in: read the record,
 * chart what they find, fill the sheet, submit the step, then look at what
 * came back.
 */
export default function CaseDetailPage() {
  const { caseId } = useParams();
  const { campus, user } = useOutletContext() ?? {};
  const { can } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [allocating, setAllocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [openReview, setOpenReview] = useState(null);

  const { data: item, loading, error, refetch } = useAsync(
    () => universityService.getCase(caseId),
    [caseId]
  );
  const { data: storedChart } = useAsync(
    () => universityService.getCaseChart(caseId),
    [caseId],
    null
  );
  const { data: sheets = [], refetch: refetchSheets } = useAsync(
    () => universityService.getCaseSheets(caseId),
    [caseId],
    []
  );
  const { data: timeline = [], refetch: refetchTimeline } = useAsync(
    () => universityService.getCaseTimeline(caseId),
    [caseId],
    []
  );
  const { data: gallery = [] } = useAsync(
    () => universityService.getCaseGallery(caseId),
    [caseId],
    []
  );

  /* The chart's own payload is what the odontogram renders; the flat entries
     derived from it on save are what the findings list reads. */
  const chartPayload = useMemo(() => readChartPayload(storedChart), [storedChart]);
  const chart = useMemo(() => readChartEntries(storedChart), [storedChart]);

  const signConsent = async () => {
    await universityService.signConsent(caseId, { signedBy: user?.name ?? null });
    toast.success("Consent recorded", item.patientName);
    refetch();
  };

  if (loading) {
    return <OdentaLoaderPanel />;
  }

  /**
   * A student who types another student's case id gets a 403 from the API, not
   * a record. Saying so plainly is better than an endless skeleton — and better
   * than a generic crash screen, which would leave them wondering whether the
   * case exists at all.
   */
  if (error || !item) {
    const outOfScope = error?.status === 403;
    return (
      <div className="flex h-full items-center justify-center p-6">
        <EmptyState
          icon={<ShieldOff className="h-6 w-6" />}
          title={outOfScope ? "This case is not yours" : "That case could not be opened"}
          description={
            outOfScope
              ? "You can only open patients allocated to you. Ask the clinic desk if this one should be."
              : (error?.message ?? "The case may have been discharged or removed.")
          }
          action={<Button onClick={() => navigate(uni.cases)}>Back to my cases</Button>}
        />
      </div>
    );
  }

  const canSubmit = can(UP.REVIEW_SUBMIT) && item.studentId;
  const canAllocate = can(UP.CASE_ASSIGN);
  const department = departmentMeta(item.department);

  return (
    <div className="flex flex-col gap-4 p-4 sm:gap-5 sm:p-6">
      {/* ------------------------------------------------------------ header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <button
            type="button"
            onClick={() => navigate(uni.cases)}
            className="od-focus inline-flex items-center gap-1.5 rounded text-[12.5px] font-bold text-ink-muted transition hover:text-brand-600"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to cases
          </button>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-extrabold text-ink">{item.patientName}</h2>
            <CaseStatusBadge status={item.status} />
            <DepartmentChip department={item.department} />
            {item.cardNumber ? <Badge tone="outline">{item.cardNumber}</Badge> : null}
          </div>
          <p className="mt-1 text-sm text-ink-muted">
            {item.age} yrs · {item.gender} · {item.nationalId} · {item.phone}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canAllocate && !item.studentId ? (
            <Button
              variant="secondary"
              leftIcon={<UserPlus className="h-4 w-4" />}
              onClick={() => setAllocating(true)}
            >
              Allocate to a student
            </Button>
          ) : null}
          {!item.consentSigned && can(UP.CONSENT_MANAGE) ? (
            <Button
              variant="secondary"
              leftIcon={<FileSignature className="h-4 w-4" />}
              onClick={signConsent}
            >
              Record consent
            </Button>
          ) : null}
          {canSubmit ? (
            <Button
              leftIcon={<Send className="h-4 w-4" />}
              disabled={!item.consentSigned}
              title={item.consentSigned ? undefined : "Consent must be signed first"}
              onClick={() => setSubmitting(true)}
            >
              Submit a step
            </Button>
          ) : null}
        </div>
      </div>

      {!item.consentSigned ? (
        <InfoBanner
          tone="warning"
          action={
            can(UP.CONSENT_MANAGE) ? (
              <Button size="xs" variant="secondary" onClick={signConsent}>
                Record now
              </Button>
            ) : null
          }
        >
          Consent has not been signed for this patient. No step can be submitted for review until it is.
        </InfoBanner>
      ) : null}

      <CaseAlerts item={{ ...item, consentSigned: true }} />

      {/* -------------------------------------------------------------- tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="gap-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="chart">Odontogram</TabsTrigger>
          <TabsTrigger value="sheets" badge={sheets.length || undefined}>
            Treatment sheet
          </TabsTrigger>
          <TabsTrigger value="timeline" badge={timeline.length || undefined}>
            Review history
          </TabsTrigger>
          <TabsTrigger value="gallery" badge={gallery.length || undefined}>
            Imaging
          </TabsTrigger>
        </TabsList>

        {/* ------------------------------------------------------- overview */}
        <TabsContent value="overview" className="pt-5">
          <div className="grid grid-cols-12 gap-5">
            <Card className="col-span-12 xl:col-span-7">
              <CardHeader title="Case record" subtitle={`Opened ${formatDate(item.openedAt, "d MMM yyyy")}`} />
              <CardBody className="pt-2">
                <DetailGrid
                  columns={3}
                  items={[
                    { label: "Chief complaint", value: item.chiefComplaint },
                    { label: "Occupation", value: item.occupation },
                    { label: "Address", value: item.address },
                    { label: "Rotation", value: department.label },
                    { label: "Student", value: item.studentName ?? "Unallocated" },
                    { label: "Supervisor", value: item.supervisorName },
                    { label: "Chair", value: item.chair },
                    { label: "Visits", value: item.visits },
                    {
                      label: "Last visit",
                      value: item.lastVisitAt ? formatDate(item.lastVisitAt, "d MMM yyyy") : "—",
                    },
                    {
                      label: "Next visit",
                      value: item.nextVisitAt ? formatDate(item.nextVisitAt, "d MMM yyyy") : "Not booked",
                    },
                    { label: "Card", value: item.cardNumber ?? "Not issued" },
                    {
                      label: "Clinic fee",
                      value: item.fee ? `${item.fee} EGP · ${item.feePaid ? "paid" : "unpaid"}` : "Waived",
                    },
                  ]}
                />
              </CardBody>
            </Card>

            <Card className="col-span-12 xl:col-span-5">
              <CardHeader title="Progress" subtitle="Steps signed off on this case" />
              <CardBody className="flex flex-col gap-4 pt-2">
                <div className="grid grid-cols-3 gap-3 text-center">
                  {[
                    { label: "Accepted", value: item.stepsAccepted, tone: "text-success-strong" },
                    { label: "Awaiting", value: item.openSteps ?? 0, tone: "text-warning-ink" },
                    { label: "Corrections", value: item.correctionSteps ?? 0, tone: "text-danger" },
                  ].map((entry) => (
                    <div key={entry.label} className="rounded-xl border border-slate-200 py-3">
                      <div className={`text-[22px] font-extrabold ${entry.tone}`}>{entry.value}</div>
                      <div className="od-label mt-0.5">{entry.label}</div>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl border border-slate-200 p-4">
                  <span className="od-label">Consent</span>
                  <p className="mt-1.5 text-[13px] font-semibold text-ink">
                    {item.consentSigned ? (
                      <span className="text-success-strong">
                        Signed
                        {item.consentSignedAt
                          ? ` · ${formatDate(item.consentSignedAt, "d MMM yyyy")}`
                          : ""}
                      </span>
                    ) : (
                      <span className="text-danger">Not signed</span>
                    )}
                  </p>
                  <p className="mt-2 text-[12px] leading-relaxed text-ink-muted">
                    Treatment in the teaching clinic is carried out by a student under supervision.
                    The patient must be told that before any step begins.
                  </p>
                </div>
              </CardBody>
            </Card>
          </div>
        </TabsContent>

        {/* ---------------------------------------------------------- chart */}
        <TabsContent value="chart" className="pt-5">
          <Card>
            <CardHeader
              title="Odontogram"
              subtitle="The chart as the student left it — read-only here; charting happens on the case's own tooth chart"
            />
            <CardBody className="pt-3">
              <div className="flex flex-col gap-6">
                {chartPayload ? (
                  <ToothChart variant="compact" readOnly value={chartPayload} />
                ) : null}

                <div className="min-w-0">
                  <h4 className="text-[15px] font-bold text-ink">Charted findings</h4>
                  {chart.length === 0 ? (
                    <EmptyState
                      icon={<Stethoscope className="h-6 w-6" />}
                      title="Nothing charted yet"
                      description="Findings recorded during screening and treatment appear here."
                      className="py-10"
                    />
                  ) : (
                    <ul className="mt-3 flex flex-col gap-2">
                      {chart.map((entry, index) => (
                        <li
                          key={`${entry.tooth}-${index}`}
                          className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3.5 py-2.5"
                        >
                          <span className="min-w-0">
                            <span className="block text-[13px] font-bold text-ink">
                              Tooth {entry.tooth}
                              {entry.surfaces?.length ? ` · ${entry.surfaces.join("")}` : ""}
                            </span>
                            <span className="block truncate text-[12px] text-ink-soft">
                              {entry.condition.replace(/_/g, " ")} · recorded by {entry.by}
                            </span>
                          </span>
                          <span className="flex shrink-0 items-center gap-2">
                            <Badge
                              tone={
                                entry.status === "completed"
                                  ? "success"
                                  : entry.status === "planned"
                                    ? "warning"
                                    : "neutral"
                              }
                            >
                              {entry.status}
                            </Badge>
                            <span className="text-[11.5px] text-ink-faint">
                              {formatDate(entry.date, "d MMM")}
                            </span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </CardBody>
          </Card>
        </TabsContent>

        {/* --------------------------------------------------------- sheets */}
        <TabsContent value="sheets" className="pt-5">
          <TreatmentSheet
            caseId={caseId}
            sheets={sheets}
            department={item.department}
            readOnly={!can(UP.SHEET_EDIT)}
            onSaved={refetchSheets}
          />
        </TabsContent>

        {/* ------------------------------------------------------- timeline */}
        <TabsContent value="timeline" className="pt-5">
          <Card>
            <CardHeader
              title="Review history"
              subtitle={`${timeline.length} step(s) submitted on this case`}
            />
            <CardBody className="pt-2">
              {timeline.length === 0 ? (
                <EmptyState
                  icon={<NotebookPen className="h-6 w-6" />}
                  title="No steps submitted"
                  description="Steps appear here as soon as they are sent to a staff member."
                  className="py-12"
                />
              ) : (
                <ol className="relative flex flex-col gap-4 border-l border-slate-200 pl-6">
                  {timeline.map((entry) => (
                    <li key={entry.id} className="relative">
                      <span className="absolute -left-[27px] top-2 h-2.5 w-2.5 rounded-full border-2 border-white bg-brand-500" />
                      <button
                        type="button"
                        onClick={() => setOpenReview(entry)}
                        className="od-focus w-full rounded-xl border border-slate-200 px-4 py-3 text-left transition hover:border-brand-300 hover:bg-brand-50/40"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <span className="min-w-0">
                            <span className="block truncate text-[13.5px] font-bold text-ink">
                              {entry.procedureType}
                              <span className="ml-2 text-[11px] font-semibold text-ink-faint">
                                step {entry.stepIndex}/{entry.stepTotal}
                              </span>
                            </span>
                            <span className="mt-0.5 block truncate text-[12px] text-ink-soft">
                              Tooth {entry.tooth} · {entry.studentName} · submitted{" "}
                              {fromNow(entry.submittedAt)}
                            </span>
                          </span>
                          <span className="flex shrink-0 items-center gap-2">
                            {entry.score != null ? (
                              <span className="text-[14px] font-extrabold text-success-strong">
                                {entry.score}
                              </span>
                            ) : null}
                            <ReviewStatusBadge status={entry.status} />
                          </span>
                        </div>
                        {entry.comment ? (
                          <p className="mt-2 text-[12.5px] leading-relaxed text-ink-muted">
                            “{entry.comment}”
                          </p>
                        ) : null}
                      </button>
                    </li>
                  ))}
                </ol>
              )}
            </CardBody>
          </Card>
        </TabsContent>

        {/* -------------------------------------------------------- gallery */}
        <TabsContent value="gallery" className="pt-5">
          <Card>
            <CardHeader
              title="Imaging"
              subtitle={`${gallery.length} image(s) · radiographs and clinical photography`}
            />
            <CardBody className="pt-3">
              {gallery.length === 0 ? (
                <EmptyState
                  icon={<Images className="h-6 w-6" />}
                  title="No imaging on file"
                  description="Radiographs taken in clinic are attached to the case automatically."
                  className="py-12"
                />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {gallery.map((image) => (
                    <figure
                      key={image.id}
                      className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
                    >
                      <div className="flex h-36 items-center justify-center bg-od-gradient-soft text-brand-300">
                        <Images className="h-8 w-8" />
                      </div>
                      <figcaption className="px-3.5 py-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-[13px] font-bold text-ink">
                            {image.label}
                          </span>
                          {image.aiReviewed ? <Badge tone="brand">AI</Badge> : null}
                        </div>
                        <p className="mt-0.5 truncate text-[11.5px] text-ink-soft">
                          {image.kind} · {formatDate(image.capturedAt, "d MMM yyyy")}
                        </p>
                      </figcaption>
                    </figure>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </TabsContent>
      </Tabs>

      {/* -------------------------------------------------------- side rail */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="px-5 py-4">
          <span className="od-label flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" /> Next visit
          </span>
          <p className="mt-1.5 text-[15px] font-extrabold text-ink">
            {item.nextVisitAt ? formatDate(item.nextVisitAt, "EEEE, d MMM") : "Not booked"}
          </p>
        </Card>
        <Card className="px-5 py-4">
          <span className="od-label flex items-center gap-1.5">
            <FlaskConical className="h-3.5 w-3.5" /> Sheet in use
          </span>
          <p className="mt-1.5 text-[15px] font-extrabold text-ink">
            {sheetMeta(sheets[0]?.type)?.label ?? department.label}
          </p>
        </Card>
        <Card className="px-5 py-4">
          <span className="od-label flex items-center gap-1.5">
            <Stethoscope className="h-3.5 w-3.5" /> Campus
          </span>
          <p className="mt-1.5 text-[15px] font-extrabold text-ink">
            {campus?.shortName ?? "—"} · {item.chair}
          </p>
        </Card>
      </div>

      <AllocateCaseModal
        item={allocating ? item : null}
        open={allocating}
        onClose={() => setAllocating(false)}
        onAllocated={refetch}
      />

      <SubmitStepModal
        item={item}
        open={submitting}
        onClose={() => setSubmitting(false)}
        onSubmitted={() => {
          refetch();
          refetchTimeline();
        }}
      />

      <ReviewDrawer
        review={openReview}
        open={Boolean(openReview)}
        onClose={() => setOpenReview(null)}
      />
    </div>
  );
}
