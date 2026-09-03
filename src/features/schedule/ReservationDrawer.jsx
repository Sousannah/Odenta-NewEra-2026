import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BellRing,
  CalendarClock,
  CalendarDays,
  ClipboardPlus,
  ExternalLink,
  FileImage,
  Landmark,
  LogIn,
  Monitor,
  NotebookPen,
  Pencil,
  ReceiptText,
  Stethoscope,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";
import { toClockLabel } from "@/lib/time";
import { useAsync, useDisclosure } from "@/hooks";
import { useToast } from "@/components/ui/Toast";
import { clinicalService, patientService, scheduleService } from "@/services";
import { P } from "@/auth/permissions";
import { useAuth } from "@/auth/AuthContext";
import { APPOINTMENT_STATUS } from "@/config/domain";
import { Drawer } from "@/components/ui/Modal";
import { Button, IconButton } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { StatusSelect } from "@/components/ui/Dropdown";
import { InfoBanner, KeyValue } from "@/components/ui/Misc";
import { ProgressBar } from "@/components/ui/Stepper";
import { PatientAlerts, toneFor } from "@/components/shared";
import { STATUS_OPTIONS, flowProgress } from "./appointmentStyles";
import { AttachmentPanel, MedicalRecordPanel, NextTreatmentsPanel } from "./DetailPanels";
import { MedicalCheckupModal } from "./MedicalCheckupModal";
import { MedicalRecordModal, buildServices } from "./MedicalRecordModal";
import { TreatmentSummaryModal } from "./TreatmentSummaryModal";

const RAIL = [
  { id: "checkup", label: "Medical Checkup", icon: Landmark, permission: P.CHART_EDIT },
  { id: "record", label: "Medical Record", icon: NotebookPen, permission: P.PATIENT_CLINICAL_VIEW },
  { id: "attachment", label: "Attachment", icon: FileImage, permission: P.PATIENT_VIEW },
  { id: "plans", label: "Next Treatments", icon: CalendarDays, permission: P.PATIENT_VIEW },
];

function MetaItem({ icon, label, children }) {
  return (
    <div className="flex min-w-0 flex-1 items-start gap-2.5">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-ink-muted">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="od-label block">{label}</span>
        <span className="mt-0.5 block text-[13px] font-bold leading-snug text-ink">{children}</span>
      </span>
    </div>
  );
}

function DetailBody({
  appointment,
  patient,
  dentist,
  status,
  onStatusChange,
  onOpenCheckup,
  onOpenRecord,
  onOpenSummary,
  hasCheckup,
  hasRecord,
  onClose,
}) {
  const toast = useToast();
  const navigate = useNavigate();
  const { can } = useAuth();
  const meta = APPOINTMENT_STATUS[status] ?? APPOINTMENT_STATUS.registered;
  const isActive = status === "encounter";
  const canFinish = hasCheckup && hasRecord;

  return (
    <div className="flex h-full w-[560px] shrink-0 flex-col bg-white">
      <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-6 py-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="text-[13px] font-semibold text-ink-muted">Reservation ID</span>
          <span className="text-[15px] font-extrabold text-ink">#{appointment.id}</span>
          <span className="text-ink-faint">·</span>
          <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-ink-soft">
            <Monitor className="h-3.5 w-3.5" />
            {appointment.source}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {can(P.APPOINTMENT_EDIT) ? (
            <IconButton label="Edit reservation" size="sm" className="border border-slate-200">
              <Pencil className="h-4 w-4 text-ink-muted" />
            </IconButton>
          ) : null}
          <IconButton label="Close" size="sm" onClick={onClose}>
            <X className="h-4 w-4 text-ink-muted" />
          </IconButton>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 px-4 py-3.5">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar name={appointment.patientName} size="lg" />
            <div className="min-w-0">
              <div className="od-label">Patient name</div>
              <button
                type="button"
                onClick={() => navigate(`/patients/${appointment.patientId}`)}
                className="flex items-center gap-1.5 truncate text-[17px] font-extrabold text-ink hover:text-brand-600"
              >
                {appointment.patientName}
                <ExternalLink className="h-3.5 w-3.5 shrink-0 text-ink-soft" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-semibold text-ink-muted">Change Status</span>
            {can(P.APPOINTMENT_EDIT) || can(P.APPOINTMENT_CHECKIN) ? (
              <StatusSelect value={status} options={STATUS_OPTIONS} onChange={onStatusChange} />
            ) : (
              <Badge tone={meta.tone}>{meta.label}</Badge>
            )}
          </div>
        </div>

        <div className="mt-3">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wide text-ink-soft">
            <span>Visit progress</span>
            <span>{meta.label}</span>
          </div>
          <ProgressBar
            value={flowProgress(status)}
            className="mt-2"
            tone={status === "finished" ? "success" : "brand"}
          />
        </div>

        {patient ? <PatientAlerts patient={patient} className="mt-4" /> : null}

        {appointment.note ? (
          <div className="mt-3 flex items-start gap-2.5 rounded-2xl border border-slate-200 px-4 py-3">
            <NotebookPen className="mt-0.5 h-4 w-4 shrink-0 text-ink-soft" />
            <p className="min-w-0 flex-1 text-[13px] italic text-ink-muted">
              &ldquo;{appointment.note}&rdquo;
            </p>
          </div>
        ) : null}

        {isActive ? (
          <InfoBanner
            tone="info"
            className="mt-3"
            icon={<CalendarClock className="h-4 w-4" />}
            action={
              <button
                type="button"
                onClick={() => toast.info("Reservation extended by 30 minutes")}
                className="shrink-0 text-[13px] font-bold text-brand-600 hover:text-brand-800"
              >
                Extend time
              </button>
            }
          >
            Time slot available in the future, you can extend the reservation time
          </InfoBanner>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-5 border-b border-slate-100 pb-5">
          <MetaItem icon={<Stethoscope className="h-4 w-4" />} label="Treatment">
            {appointment.treatment}
          </MetaItem>
          <MetaItem icon={<CalendarClock className="h-4 w-4" />} label="Date and time">
            {formatDate(appointment.date, "EEE, d MMM")}
            <br />
            {toClockLabel(appointment.start)}-{toClockLabel(appointment.end)}
          </MetaItem>
          <MetaItem icon={<Landmark className="h-4 w-4" />} label="Dentist">
            {dentist?.name ?? appointment.dentistName ?? "Unassigned"}
          </MetaItem>
        </div>

        {appointment.billId ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 py-4">
            <span className="flex items-center gap-2.5">
              <span className="text-[13px] font-semibold text-ink-muted">Payment</span>
              <span className="text-[14px] font-bold text-ink">Bill #{appointment.billId}</span>
              <Badge tone={toneFor(appointment.paymentStatus)}>{appointment.paymentStatus}</Badge>
            </span>
            {appointment.paymentStatus !== "PAID" ? (
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<BellRing className="h-3.5 w-3.5 text-warning" />}
                onClick={() => toast.success("Payment reminder sent", appointment.patientName)}
              >
                Send Reminder
              </Button>
            ) : null}
          </div>
        ) : null}

        <div className="py-5">
          <h4 className="text-[15px] font-bold text-ink">General info</h4>
          <div className="mt-4 grid grid-cols-2 gap-5">
            <KeyValue label="Full name" value={patient?.fullName ?? appointment.patientName} />
            <KeyValue label="Phone number" value={patient?.phone} />
            <KeyValue label="MRN" value={patient?.mrn} />
            <KeyValue label="Email" value={patient?.email} />
            <KeyValue label="Gender" value={patient?.gender} />
            <KeyValue label="Address" value={patient?.address} />
          </div>
        </div>
      </div>

      <footer className="border-t border-slate-100 px-6 py-4">
        {status === "registered" && can(P.APPOINTMENT_CHECKIN) ? (
          <Button
            block
            leftIcon={<LogIn className="h-4 w-4" />}
            onClick={() => onStatusChange("arrived")}
          >
            Check in patient
          </Button>
        ) : null}

        {["arrived", "encounter"].includes(status) && can(P.CHART_EDIT) ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant={hasCheckup ? "success" : "secondary"}
                onClick={onOpenCheckup}
                leftIcon={<ClipboardPlus className="h-4 w-4" />}
              >
                {hasCheckup ? "Edit Medical Checkup" : "Add Medical Checkup"}
              </Button>
              <Button
                variant={hasRecord ? "success" : "secondary"}
                onClick={onOpenRecord}
                leftIcon={<NotebookPen className="h-4 w-4" />}
                className={cn(!hasRecord && "border-dashed border-brand-300 text-brand-600")}
              >
                {hasRecord ? "Edit Medical Record" : "Add Medical Record"}
              </Button>
            </div>
            <Button
              block
              className="mt-3"
              disabled={!canFinish}
              onClick={onOpenSummary}
              leftIcon={<ReceiptText className="h-4 w-4" />}
            >
              Finish
            </Button>
            {!canFinish ? (
              <p className="mt-2.5 text-center text-[12px] text-ink-soft">
                Please add Medical checkup &amp; Medical record to finish treatment
              </p>
            ) : null}
          </>
        ) : null}

        {["waiting", "finished"].includes(status) ? (
          <div className="grid grid-cols-2 gap-3">
            <Button variant="secondary" onClick={() => navigate("/sales")}>
              Open bill
            </Button>
            <Button variant="secondary" onClick={() => navigate(`/patients/${appointment.patientId}`)}>
              Patient record
            </Button>
          </div>
        ) : null}

        {["cancelled", "no_show"].includes(status) && can(P.APPOINTMENT_EDIT) ? (
          <Button block variant="secondary" className="text-brand-600" onClick={() => onStatusChange("registered")}>
            Reinstate booking
          </Button>
        ) : null}
      </footer>
    </div>
  );
}

export function ReservationDrawer({ open, onClose, appointment, dentists = [] }) {
  const [panel, setPanel] = useState(null);
  const [status, setStatus] = useState(appointment?.status ?? "registered");
  const [hasCheckup, setHasCheckup] = useState(false);
  const [hasRecord, setHasRecord] = useState(false);

  const checkup = useDisclosure();
  const record = useDisclosure();
  const summary = useDisclosure();
  const toast = useToast();
  const { can } = useAuth();

  useEffect(() => {
    setStatus(appointment?.status ?? "registered");
    setHasCheckup(false);
    setHasRecord(false);
    setPanel(null);
  }, [appointment?.id, appointment?.status]);

  const patientId = appointment?.patientId;

  const { data: patient } = useAsync(
    () => (patientId ? patientService.getPatient(patientId) : null),
    [patientId]
  );
  const { data: clinical } = useAsync(
    () => (patientId ? clinicalService.getClinicalRecord(patientId) : null),
    [patientId]
  );
  const { data: attachments = [] } = useAsync(
    () => (patientId ? patientService.getPatientAttachments(patientId) : []),
    [patientId],
    []
  );
  const { data: plans = [] } = useAsync(
    () => (patientId ? patientService.getPatientPlans(patientId) : []),
    [patientId],
    []
  );

  if (!appointment) return null;

  const dentist = dentists.find((item) => item.id === appointment.dentistId);
  const rail = RAIL.filter((item) => can(item.permission));

  const changeStatus = async (next) => {
    setStatus(next);
    await scheduleService.setAppointmentStatus(appointment.id, next);
    toast.info("Status updated", `${appointment.id} → ${APPOINTMENT_STATUS[next]?.label ?? next}`);
  };

  const renderPanel = () => {
    switch (panel) {
      case "record":
        return <MedicalRecordPanel chart={clinical?.chart ?? []} onClose={() => setPanel(null)} />;
      case "attachment":
        return <AttachmentPanel attachments={attachments} onClose={() => setPanel(null)} />;
      case "plans":
        return <NextTreatmentsPanel plans={plans} onClose={() => setPanel(null)} />;
      default:
        return null;
    }
  };

  return (
    <>
      <Drawer
        open={open}
        onClose={onClose}
        width={panel ? "max-w-[1120px]" : "max-w-[620px]"}
        className="flex-row bg-transparent"
      >
        {renderPanel()}

        <nav className="flex h-full w-[60px] shrink-0 flex-col items-center gap-2 border-r border-slate-200 bg-white py-4">
          {rail.map((item) => {
            const Icon = item.icon;
            const isActive = panel === item.id;
            const isCheckup = item.id === "checkup";
            return (
              <button
                key={item.id}
                type="button"
                title={item.label}
                aria-label={item.label}
                onClick={() => (isCheckup ? checkup.open() : setPanel(isActive ? null : item.id))}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl border transition",
                  isActive
                    ? "border-brand-500 bg-brand-50 text-brand-600"
                    : "border-slate-200 bg-white text-ink-soft hover:border-slate-300 hover:text-ink"
                )}
              >
                <Icon className="h-[18px] w-[18px]" />
              </button>
            );
          })}
        </nav>

        <DetailBody
          appointment={appointment}
          patient={patient}
          dentist={dentist}
          status={status}
          onStatusChange={changeStatus}
          hasCheckup={hasCheckup}
          hasRecord={hasRecord}
          onOpenCheckup={checkup.open}
          onOpenRecord={record.open}
          onOpenSummary={summary.open}
          onClose={onClose}
        />
      </Drawer>

      <MedicalCheckupModal
        open={checkup.isOpen}
        onClose={checkup.close}
        appointment={appointment}
        patient={patient}
        chart={clinical?.chart ?? []}
        onSaved={() => setHasCheckup(true)}
      />

      <MedicalRecordModal
        open={record.isOpen}
        onClose={record.close}
        services={buildServices(appointment, clinical?.chart ?? [])}
        onSaved={() => setHasRecord(true)}
      />

      <TreatmentSummaryModal
        open={summary.isOpen}
        onClose={summary.close}
        appointment={appointment}
        onSaved={() => {
          changeStatus("waiting");
          toast.success("Treatment finished", "Bill is ready for payment");
        }}
      />
    </>
  );
}
