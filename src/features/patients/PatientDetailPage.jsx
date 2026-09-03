import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  CalendarPlus,
  ChevronRight,
  FileText,
  Image as ImageIcon,
  MoreVertical,
  NotebookPen,
  Pill,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useAsync, useDisclosure } from "@/hooks";
import { useToast } from "@/components/ui/Toast";
import { clinicalService, patientService } from "@/services";
import { formatDate, formatMoney } from "@/lib/format";
import { toClockLabel } from "@/lib/time";
import { APPOINTMENT_STATUS, ORAL_HYGIENE_QUESTIONS } from "@/config/domain";
import {
  CARIES_RISK,
  PERIO_GRADES,
  PERIO_STAGES,
  RECALL_INTERVALS,
  conditionByValue,
} from "@/config/dentalStandards";
import { P } from "@/auth/permissions";
import { useAuth } from "@/auth/AuthContext";
import { Card, CardBody, CardHeader, Caption } from "@/components/ui/Card";
import { Tabs, TabsContent, TabsList, TabsTrigger, SegmentedControl } from "@/components/ui/Tabs";
import { Button, IconButton } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Dropdown } from "@/components/ui/Dropdown";
import { KeyValue } from "@/components/ui/Misc";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { MiniSelect } from "@/components/ui/Field";
import { PatientAlerts, toneFor } from "@/components/shared";
import {
  DEFAULT_LEGEND,
  NOTATION_OPTIONS,
  Odontogram,
  OdontogramLegend,
  PerioChart,
  formatSurfaces,
  formatTooth,
  perioSummary,
  toothFullName,
} from "@/components/dental";
import { chartToFindings } from "@/features/schedule/DetailPanels";
import { PatientFormModal } from "./PatientFormModal";
import { PrescriptionModal } from "./PrescriptionModal";

/* ------------------------------------------------- patient information */

function InformationTab({ patient, hygiene, attachments }) {
  const risk = CARIES_RISK.find((item) => item.value === patient.cariesRisk);

  return (
    <div className="flex flex-col gap-5">
      <PatientAlerts patient={patient} />

      <Card>
        <CardHeader title="General information" />
        <CardBody className="grid gap-5 pt-3 sm:grid-cols-2 xl:grid-cols-3">
          <KeyValue label="Full name" value={patient.fullName} />
          <KeyValue label="Medical record no." value={patient.mrn} />
          <KeyValue label="Date of birth" value={formatDate(patient.dob, "d MMMM yyyy")} />
          <KeyValue label="Place of birth" value={patient.birthPlace} />
          <KeyValue label="Gender" value={patient.gender} />
          <KeyValue label="Phone" value={patient.phone} />
          <KeyValue label="Email" value={patient.email} />
          <KeyValue label="Address" value={patient.address} />
          <KeyValue label="Registered" value={formatDate(patient.registered, "d MMM yyyy")} />
          <KeyValue label="Insurer" value={patient.insurer} />
          <KeyValue label="Policy number" value={patient.policyNo ?? "—"} />
          <KeyValue label="Primary dentist" value={patient.primaryDentist} />
        </CardBody>
      </Card>

      <div className="grid gap-5 xl:grid-cols-3">
        <Card>
          <CardHeader title="Risk & recall" />
          <CardBody className="flex flex-col gap-4 pt-3">
            <div>
              <Caption>Caries risk</Caption>
              <div className="mt-1.5 flex items-center gap-2">
                <Badge tone={risk?.tone ?? "neutral"}>{risk?.label ?? "Not assessed"}</Badge>
                <span className="text-[12px] text-ink-soft">
                  suggests a {risk?.recall ?? 6} month recall
                </span>
              </div>
            </div>
            <KeyValue
              label="Recall interval"
              value={
                RECALL_INTERVALS.find((item) => item.value === patient.recallMonths)?.label ??
                `${patient.recallMonths} months`
              }
            />
            <KeyValue label="Next recall due" value={formatDate(patient.nextRecall, "d MMM yyyy")} />
            <KeyValue label="Open balance" value={formatMoney(patient.balance)} />
          </CardBody>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader
            title="Oral hygiene habits"
            subtitle={hygiene ? `Last update ${formatDate(hygiene.updatedAt, "d MMMM yyyy")}` : "Not completed"}
          />
          <CardBody className="pt-3">
            {hygiene ? (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {ORAL_HYGIENE_QUESTIONS.map((question) => (
                  <div key={question.id}>
                    <div className="text-[12px] text-ink-soft">{question.question}</div>
                    <div className="mt-1 text-[13.5px] font-bold text-ink">
                      {hygiene.answers[question.id] ?? "—"}
                    </div>
                  </div>
                ))}
                <div>
                  <div className="text-[12px] text-ink-soft">
                    How often do you change your toothbrush?
                  </div>
                  <div className="mt-1 text-[13.5px] font-bold text-ink">
                    {hygiene.answers.toothbrush ?? "—"}
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState
                title="Questionnaire not completed"
                description="Capture it during the next medical checkup."
                className="py-10"
              />
            )}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Attachment" subtitle={`${attachments.length} file(s)`} />
        <CardBody className="pt-3">
          {attachments.length === 0 ? (
            <EmptyState title="No attachments" className="py-10" />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {attachments.map((file) => (
                <figure key={file.id} className="overflow-hidden rounded-2xl border border-slate-200">
                  <div className="flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-ink-soft">
                    {file.type === "image" ? (
                      <ImageIcon className="h-8 w-8" />
                    ) : (
                      <FileText className="h-8 w-8" />
                    )}
                  </div>
                  <figcaption className="px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-[12.5px] font-semibold text-ink">
                        {file.name}
                      </span>
                      {file.kind ? <Badge tone="outline">{file.kind}</Badge> : null}
                    </div>
                    {file.note ? (
                      <p className="mt-1 truncate text-[11.5px] text-ink-soft">{file.note}</p>
                    ) : (
                      <button
                        type="button"
                        className="mt-1 flex items-center gap-1 text-[12px] font-semibold text-brand-600 hover:text-brand-800"
                      >
                        <Plus className="h-3 w-3" /> Add notes
                      </button>
                    )}
                  </figcaption>
                </figure>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

/* ------------------------------------------------- appointment history */

function HistoryTab({ appointments, onOpen }) {
  if (!appointments.length) {
    return <EmptyState title="No appointment history" description="This patient has not been seen yet." />;
  }

  return (
    <Card>
      <CardHeader title="Appointment history" subtitle={`${appointments.length} visit(s)`} />
      <CardBody className="pt-2">
        <ol className="border-l-2 border-slate-100 pl-6">
          {appointments.map((item) => {
            const status = APPOINTMENT_STATUS[item.status] ?? APPOINTMENT_STATUS.registered;
            return (
              <li key={item.id} className="relative pb-5">
                <span
                  className={cn(
                    "absolute -left-[31px] top-2 h-2.5 w-2.5 rounded-full ring-4 ring-white",
                    item.status === "finished" ? "bg-success" : "bg-slate-300"
                  )}
                />
                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[14px] font-bold text-ink">{item.treatment}</span>
                        <Badge tone={status.tone}>{status.label}</Badge>
                      </div>
                      <p className="mt-1 text-[12px] text-ink-soft">
                        #{item.id} · {formatDate(item.date, "EEE, d MMM yyyy")} ·{" "}
                        {toClockLabel(item.start)}–{toClockLabel(item.end)}
                      </p>
                      <p className="mt-0.5 text-[12px] text-ink-soft">
                        {item.dentist ?? item.dentistName} · {item.room ?? "—"}
                      </p>
                      {item.note ? (
                        <p className="mt-2 rounded-xl bg-slate-50 px-3 py-2 text-[12.5px] text-ink-muted">
                          {item.note}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2">
                      {item.billId ? (
                        <Badge tone={toneFor(item.paymentStatus)}>{item.paymentStatus}</Badge>
                      ) : null}
                      <IconButton label="Open appointment" size="sm" onClick={() => onOpen?.(item)}>
                        <ChevronRight className="h-4 w-4 text-ink-soft" />
                      </IconButton>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </CardBody>
    </Card>
  );
}

/* ------------------------------------------------------- next treatment */

function PlansTab({ plans, canApprove, onApprove }) {
  if (!plans.length) {
    return <EmptyState title="No treatment plan" description="Create one from the medical checkup." />;
  }

  return (
    <div className="flex flex-col gap-5">
      {plans.map((plan) => (
        <Card key={plan.id}>
          <CardHeader
            title={plan.treatment}
            subtitle={`${plan.completedVisits}/${plan.totalVisits} visits · ${formatMoney(plan.estimatedCost)} estimated`}
            action={
              <span className="flex items-center gap-2">
                <Badge tone={toneFor(plan.status)}>{plan.status.replace("_", " ")}</Badge>
                {!plan.consentSigned && canApprove ? (
                  <Button size="sm" onClick={() => onApprove(plan)}>
                    Record consent
                  </Button>
                ) : null}
                {plan.consentSigned ? <Badge tone="success">Consent signed</Badge> : null}
              </span>
            }
          />
          <CardBody className="pt-3">
            <ol className="border-l-2 border-slate-100 pl-6">
              {plan.visits.map((visit) => (
                <li key={`${plan.id}-${visit.visit}`} className="relative pb-4">
                  <span
                    className={cn(
                      "absolute -left-[31px] top-2 h-2.5 w-2.5 rounded-full ring-4 ring-white",
                      visit.state === "done" ? "bg-success" : "bg-slate-300"
                    )}
                  />
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3">
                    <div className="min-w-0">
                      <span className="block truncate text-[13.5px] font-bold text-ink">
                        Visit #{visit.visit} · {visit.title}
                      </span>
                      <span className="block truncate text-[12px] text-ink-soft">
                        {formatDate(visit.date, "d MMM yyyy")} · {visit.time} · {visit.dentist}
                      </span>
                    </div>
                    <Badge tone={visit.state === "done" ? "success" : visit.state === "upcoming" ? "brand" : "neutral"}>
                      {visit.state}
                    </Badge>
                  </div>
                </li>
              ))}
            </ol>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}

/* -------------------------------------------------------- medical record */

function MedicalRecordTab({ chart, notation }) {
  const [service, setService] = useState("medical");
  const [selectedTooth, setSelectedTooth] = useState(null);

  const filtered = useMemo(
    () =>
      chart.filter((entry) =>
        service === "cosmetic"
          ? ["restoration", "crown", "implant"].includes(entry.condition)
          : true
      ),
    [chart, service]
  );

  const findings = useMemo(() => chartToFindings(filtered), [filtered]);
  const teeth = useMemo(() => [...new Set(filtered.map((entry) => entry.tooth))], [filtered]);
  const activeTooth = selectedTooth ?? teeth[0] ?? null;
  const history = filtered
    .filter((entry) => entry.tooth === activeTooth)
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <Card>
      <CardHeader
        title="Service"
        action={
          <SegmentedControl
            value={service}
            onChange={setService}
            options={[
              { value: "medical", label: "Medical" },
              { value: "cosmetic", label: "Cosmetic" },
            ]}
          />
        }
      />
      <CardBody className="pt-3">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,440px)_1fr]">
          <div className="rounded-2xl border border-slate-200 p-4">
            <h4 className="text-center text-[15px] font-bold text-ink">Odontogram</h4>
            <Odontogram
              className="mt-2"
              findings={findings}
              notation={notation}
              surfaceMode
              selected={activeTooth}
              onSelectTooth={setSelectedTooth}
              legend={<OdontogramLegend items={DEFAULT_LEGEND} />}
            />
          </div>

          <div className="min-w-0">
            {activeTooth ? (
              <>
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 items-center gap-1.5 rounded-md bg-brand-50 px-2 text-[11px] font-bold text-brand-700">
                    {formatTooth(activeTooth, notation)}
                  </span>
                  <h3 className="text-[17px] font-extrabold text-ink">
                    {toothFullName(activeTooth)}
                  </h3>
                </div>

                <ol className="mt-4 border-l-2 border-slate-100 pl-6">
                  {history.map((entry) => {
                    const condition = conditionByValue(entry.condition);
                    const done = entry.status === "completed";
                    return (
                      <li key={entry.id} className="relative pb-5">
                        <span
                          className={cn(
                            "absolute -left-[31px] top-3 h-2.5 w-2.5 rounded-full ring-4 ring-white",
                            done ? "bg-success" : "bg-slate-300"
                          )}
                        />
                        <div className="rounded-2xl border border-slate-200 p-4">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="flex shrink-0 flex-col items-center">
                              <span className="text-[10.5px] font-bold uppercase text-ink-soft">
                                {formatDate(entry.date, "MMM")}
                              </span>
                              <span className="text-[17px] font-extrabold text-ink">
                                {formatDate(entry.date, "dd")}
                              </span>
                            </div>

                            <dl className="grid min-w-0 flex-1 grid-cols-2 gap-4 sm:grid-cols-3">
                              <div>
                                <dt className="od-label">Condition</dt>
                                <dd className="mt-0.5 text-[13px] font-bold text-ink">
                                  {condition?.label ?? entry.condition}
                                </dd>
                              </div>
                              <div>
                                <dt className="od-label">Treatment</dt>
                                <dd className="mt-0.5 text-[13px] font-bold text-ink">
                                  {entry.code ?? "—"}
                                  {entry.surfaces?.length ? ` · ${formatSurfaces(entry.surfaces)}` : ""}
                                </dd>
                              </div>
                              <div>
                                <dt className="od-label">Dentist</dt>
                                <dd className="mt-0.5 truncate text-[13px] font-bold text-ink">
                                  {entry.dentistId ?? "—"}
                                </dd>
                              </div>
                            </dl>

                            <Badge tone={done ? "success" : "warning"}>
                              {done ? "Done" : "Pending"}
                            </Badge>
                          </div>

                          {entry.note ? (
                            <p className="mt-3 flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-[12.5px] text-ink-muted">
                              <NotebookPen className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-faint" />
                              {entry.note}
                            </p>
                          ) : null}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </>
            ) : (
              <EmptyState
                title="Nothing charted yet"
                description="Select a tooth on the odontogram to see its history."
              />
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

/* ----------------------------------------------------------- perio tab */

function PerioTab({ perio, notation, canEdit }) {
  const [data, setData] = useState(perio?.data ?? {});
  const summary = useMemo(() => perioSummary(data), [data]);
  const toast = useToast();

  const change = (tooth, field, site, value) =>
    setData((prev) => {
      const current = prev[tooth] ?? { pd: {}, rec: {} };
      if (field === "bleeding" || field === "mobility") {
        return { ...prev, [tooth]: { ...current, [field]: value } };
      }
      return {
        ...prev,
        [tooth]: { ...current, [field]: { ...current[field], [site]: value } },
      };
    });

  const stage = PERIO_STAGES.find((item) => item.value === perio?.stage);
  const grade = PERIO_GRADES.find((item) => item.value === perio?.grade);

  return (
    <Card>
      <CardHeader
        title="Periodontal chart"
        subtitle={
          perio
            ? `Recorded ${formatDate(perio.recordedAt, "d MMM yyyy")} · six sites per tooth`
            : "Not yet charted"
        }
        action={
          <span className="flex items-center gap-2">
            {stage ? <Badge tone={stage.tone}>{stage.label}</Badge> : null}
            {grade ? <Badge tone="neutral">{grade.label}</Badge> : null}
            {canEdit ? (
              <Button
                size="sm"
                onClick={() => toast.success("Periodontal chart saved", `Max CAL ${summary.maxCal} mm`)}
              >
                Save chart
              </Button>
            ) : null}
          </span>
        }
      />
      <CardBody className="pt-3">
        {Object.keys(data).length === 0 ? (
          <EmptyState
            title="No periodontal chart"
            description="A six-point chart is recorded at the first perio assessment."
          />
        ) : (
          <PerioChart data={data} onChange={change} readOnly={!canEdit} notation={notation} />
        )}
      </CardBody>
    </Card>
  );
}

/* --------------------------------------------------- prescriptions tab */

function PrescriptionsTab({ prescriptions, canWrite, onNew }) {
  return (
    <Card>
      <CardHeader
        title="Prescriptions"
        subtitle={`${prescriptions.length} issued`}
        action={
          canWrite ? (
            <Button size="sm" leftIcon={<Pill className="h-3.5 w-3.5" />} onClick={onNew}>
              New prescription
            </Button>
          ) : null
        }
      />
      <CardBody className="pt-3">
        {prescriptions.length === 0 ? (
          <EmptyState title="No prescriptions" description="Nothing has been prescribed yet." className="py-10" />
        ) : (
          <div className="flex flex-col gap-4">
            {prescriptions.map((rx) => (
              <div key={rx.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-[13.5px] font-bold text-ink">#{rx.id}</span>
                    <span className="ml-2 text-[12px] text-ink-soft">
                      {formatDate(rx.issuedAt, "d MMM yyyy")} · {rx.dentist}
                    </span>
                  </div>
                  <Badge tone={rx.status === "active" ? "success" : "neutral"}>{rx.status}</Badge>
                </div>

                <ul className="mt-3 flex flex-col gap-2">
                  {rx.items.map((item) => (
                    <li
                      key={`${rx.id}-${item.drug}`}
                      className="flex flex-wrap items-baseline justify-between gap-2 rounded-xl bg-slate-50 px-3.5 py-2.5"
                    >
                      <span className="text-[13px] font-bold text-ink">
                        {item.drug} {item.strength}
                      </span>
                      <span className="text-[12.5px] text-ink-muted">
                        {item.sig} · {item.quantity} units · {item.days} day(s)
                      </span>
                    </li>
                  ))}
                </ul>

                {rx.notes ? (
                  <p className="mt-2.5 text-[12.5px] italic text-ink-muted">{rx.notes}</p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}

/* ------------------------------------------------------------------ page */

export default function PatientDetailPage() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const { can } = useAuth();
  const toast = useToast();
  const [notation, setNotation] = useState("fdi");

  const edit = useDisclosure();
  const rx = useDisclosure();

  const { data: patient, loading, refetch } = useAsync(
    () => patientService.getPatient(patientId),
    [patientId]
  );
  const { data: clinical } = useAsync(
    () => (can(P.PATIENT_CLINICAL_VIEW) ? clinicalService.getClinicalRecord(patientId) : null),
    [patientId]
  );
  const { data: appointments = [] } = useAsync(
    () => patientService.getPatientAppointments(patientId),
    [patientId],
    []
  );
  const { data: plans = [] } = useAsync(
    () => patientService.getPatientPlans(patientId),
    [patientId],
    []
  );
  const { data: attachments = [] } = useAsync(
    () => patientService.getPatientAttachments(patientId),
    [patientId],
    []
  );
  const { data: prescriptions = [], refetch: refetchRx } = useAsync(
    () => (can(P.PRESCRIPTION_VIEW) ? patientService.getPatientPrescriptions(patientId) : []),
    [patientId],
    []
  );

  if (loading || !patient) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-[420px] w-full" />
      </div>
    );
  }

  const showClinical = can(P.PATIENT_CLINICAL_VIEW);

  return (
    <div className="flex flex-col gap-5 px-6 pb-6 pt-5">
      <nav className="flex items-center gap-2 text-[13px]">
        <Link to="/patients" className="font-semibold text-ink-muted hover:text-brand-600">
          Patient list
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-ink-faint" />
        <span className="font-bold text-brand-600">Patient detail</span>
      </nav>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar name={patient.name} size="xl" />
          <div className="min-w-0">
            <h2 className="truncate text-[22px] font-extrabold text-ink">{patient.name}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-[12.5px] text-ink-soft">
              <span>{patient.mrn}</span>
              <span>·</span>
              <span>{patient.gender}</span>
              <span>·</span>
              <span>{formatDate(patient.dob, "d MMM yyyy")}</span>
              <Badge tone={patient.status === "active" ? "success" : "neutral"}>
                {patient.status}
              </Badge>
            </div>
            {patient.note ? (
              <div className="mt-2 flex max-w-[520px] items-center gap-2 rounded-xl border border-slate-200 px-3 py-2">
                <NotebookPen className="h-3.5 w-3.5 shrink-0 text-ink-soft" />
                <span className="min-w-0 flex-1 truncate text-[12.5px] text-ink-muted">
                  {patient.note}
                </span>
                {can(P.PATIENT_EDIT) ? (
                  <button
                    type="button"
                    onClick={edit.open}
                    className="shrink-0 text-[12px] font-bold text-brand-600 hover:text-brand-800"
                  >
                    Edit
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <MiniSelect
            className="h-10"
            value={notation}
            onChange={(event) => setNotation(event.target.value)}
          >
            {NOTATION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </MiniSelect>

          {can(P.APPOINTMENT_CREATE) ? (
            <Button leftIcon={<CalendarPlus className="h-4 w-4" />} onClick={() => navigate("/schedule?new=1")}>
              Create Appointment
            </Button>
          ) : null}

          <Dropdown
            items={[
              ...(can(P.PATIENT_EDIT) ? [{ value: "edit", label: "Edit patient" }] : []),
              ...(can(P.PRESCRIPTION_WRITE) ? [{ value: "rx", label: "New prescription" }] : []),
              { value: "print", label: "Print record" },
            ]}
            onSelect={(value) => {
              if (value === "edit") edit.open();
              else if (value === "rx") rx.open();
              else toast.info("Print queued");
            }}
            trigger={
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-ink-muted transition hover:border-slate-300">
                <MoreVertical className="h-4 w-4" />
              </span>
            }
          />
        </div>
      </header>

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">Patient Information</TabsTrigger>
          <TabsTrigger value="history" badge={appointments.length}>
            Appointment History
          </TabsTrigger>
          <TabsTrigger value="plans" badge={plans.length}>
            Next Treatment
          </TabsTrigger>
          {showClinical ? <TabsTrigger value="record">Medical Record</TabsTrigger> : null}
          {showClinical ? <TabsTrigger value="perio">Periodontal</TabsTrigger> : null}
          {can(P.PRESCRIPTION_VIEW) ? (
            <TabsTrigger value="rx" badge={prescriptions.length}>
              Prescriptions
            </TabsTrigger>
          ) : null}
        </TabsList>

        <TabsContent value="info" className="pt-5">
          <InformationTab patient={patient} hygiene={clinical?.hygiene} attachments={attachments} />
        </TabsContent>

        <TabsContent value="history" className="pt-5">
          <HistoryTab appointments={appointments} onOpen={() => navigate("/schedule")} />
        </TabsContent>

        <TabsContent value="plans" className="pt-5">
          <PlansTab
            plans={plans}
            canApprove={can(P.TREATMENT_PLAN_APPROVE)}
            onApprove={(plan) => toast.success("Consent recorded", plan.treatment)}
          />
        </TabsContent>

        {showClinical ? (
          <TabsContent value="record" className="pt-5">
            <MedicalRecordTab chart={clinical?.chart ?? []} notation={notation} />
          </TabsContent>
        ) : null}

        {showClinical ? (
          <TabsContent value="perio" className="pt-5">
            <PerioTab perio={clinical?.perio} notation={notation} canEdit={can(P.PERIO_EDIT)} />
          </TabsContent>
        ) : null}

        {can(P.PRESCRIPTION_VIEW) ? (
          <TabsContent value="rx" className="pt-5">
            <PrescriptionsTab
              prescriptions={prescriptions}
              canWrite={can(P.PRESCRIPTION_WRITE)}
              onNew={rx.open}
            />
          </TabsContent>
        ) : null}
      </Tabs>

      <PatientFormModal
        open={edit.isOpen}
        onClose={edit.close}
        patient={patient}
        onSaved={refetch}
      />

      <PrescriptionModal
        open={rx.isOpen}
        onClose={rx.close}
        patient={patient}
        onSaved={refetchRx}
      />
    </div>
  );
}
