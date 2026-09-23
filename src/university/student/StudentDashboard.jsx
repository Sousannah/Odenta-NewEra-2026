import { useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import {
  CalendarDays,
  ClipboardCheck,
  Megaphone,
  Plus,
  Target,
  UserPlus,
  UserSquare2,
} from "lucide-react";
import { useAsync } from "@/hooks";
import { universityService } from "@/services";
import { formatDate, formatNumber, fromNow } from "@/lib/format";
import { toDateKey, dateKeyOffset } from "@/lib/time";
import { ROLES } from "@/auth/roles";
import { CLINIC_SESSIONS, DEPARTMENTS } from "@/config/academic";
import { uni } from "@/config/paths";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { OdentaLoaderPanel } from "@/components/ui/OdentaLoader";
import { EmptyState } from "@/components/ui/EmptyState";
import { InfoBanner } from "@/components/ui/Misc";
import { Modal } from "@/components/ui/Modal";
import { Field, Input, Radio, Select } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { DashboardShell } from "@/components/shared";
import {
  CaseAlerts,
  CaseStatusBadge,
  DepartmentChip,
  DetailGrid,
  ProgressRing,
  RequirementBar,
} from "@/university/components";
import { RaiseProcedureRequestModal } from "@/university/features/requests/RaiseProcedureRequestModal";
import { AppointmentsWidget } from "./AppointmentsWidget";
import { ProcedureRequestsWidget } from "./ProcedureRequestsWidget";

/**
 * Student.
 *
 * A student's day is governed by two numbers: how much of the rotation quota
 * is left, and what a supervisor is still waiting to sign. Everything above
 * the fold answers one of those two; the two dialogs below are the only things
 * a student starts from here rather than from inside a patient record.
 */

const LEVELS = ["4", "5"];

const emptyIntake = {
  level: "4",
  clinicNumber: "",
  unitNumber: "",
  date: "",
  session: CLINIC_SESSIONS[0].value,
  department: DEPARTMENTS[0].key,
  patientName: "",
  isFamilyMember: "No",
};

/* -------------------------------------------------------------- filtering */

/** The dashboard's day filter, as a predicate over `YYYY-MM-DD` keys. */
const withinDayFilter = (dateKey, filter) => {
  if (filter === "all") return true;
  const today = toDateKey();
  if (filter === "today") return dateKey === today;
  if (filter === "tomorrow") return dateKey === dateKeyOffset(1);
  if (filter === "week") return dateKey >= today && dateKey < dateKeyOffset(7);
  return true;
};

export default function StudentDashboard() {
  const { user, campus } = useOutletContext() ?? {};
  const navigate = useNavigate();
  const toast = useToast();
  const studentId = user?.staffId;

  const [dayFilter, setDayFilter] = useState("today");
  const [hourFilter, setHourFilter] = useState("");
  const [procedureOpen, setProcedureOpen] = useState(false);
  const [intakeOpen, setIntakeOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [intakeForm, setIntakeForm] = useState(emptyIntake);
  const [formError, setFormError] = useState("");

  /**
   * One call, not six.
   *
   * This screen used to fetch the profile, the reviews, the desk requests, the
   * announcements and the caseload separately — five round trips before it
   * could paint, on the screen every student in the cohort opens within the
   * same ten minutes on a Sunday morning. The server folds them now, from the
   * student's own rows, and returns the counters already computed so the tiles
   * cannot disagree with the lists under them.
   *
   * Appointments stay a separate call on purpose: the widget below offers an
   * "all appointments" filter, and the board only carries the coming week.
   */
  const {
    data: board,
    loading,
    refetch: refetchBoard,
  } = useAsync(() => universityService.getDashboard(ROLES.UNI_STUDENT), [studentId]);

  const { data: appointments = [] } = useAsync(
    () => universityService.getAppointments({ studentId: studentId ?? "all" }),
    [studentId],
    []
  );

  const student = board?.student ?? null;
  const counters = board?.counters ?? {};
  const announcements = board?.announcements ?? [];
  const procedureRequests = board?.procedureRequests ?? [];
  const pending = board?.pendingReviews ?? [];
  const returned = board?.returnedReviews ?? [];
  const activeCases = board?.cases ?? [];
  const consentMissing = board?.consentMissingCases ?? [];

  /* Re-reading the board is what refreshes the request list after one is
     raised — the two numbers move together, so they are fetched together. */
  const refetchRequests = refetchBoard;

  /* Counts come from the server, lists are trimmed for the widgets — so a
     student with nine returned steps sees "9", not the eight shown below. */
  const consentMissingCount = counters.consentMissing ?? consentMissing.length;
  const returnedCount = counters.needsCorrection ?? returned.length;

  const filteredAppointments = useMemo(
    () =>
      appointments.filter(
        (item) =>
          withinDayFilter(item.date, dayFilter) && (!hourFilter || item.time?.startsWith(hourFilter))
      ),
    [appointments, dayFilter, hourFilter]
  );

  const todayCount = appointments.filter((item) => item.date === toDateKey()).length;

  /* ------------------------------------------------------------- actions */

  const submitIntake = async (event) => {
    event.preventDefault();
    if (!intakeForm.clinicNumber || !intakeForm.unitNumber || !intakeForm.date) {
      setFormError("Clinic number, unit number and date are all required.");
      return;
    }
    setSubmitting(true);
    setFormError("");
    try {
      const session = CLINIC_SESSIONS.find((item) => item.value === intakeForm.session);
      await universityService.createAppointment({
        patientName: intakeForm.patientName || "Walk-in patient",
        date: intakeForm.date,
        time: session?.start ?? "09:00",
        session: intakeForm.session,
        department: intakeForm.department,
        chair: `${intakeForm.clinicNumber}-${intakeForm.unitNumber}`,
        studentId,
        studentName: user?.name,
        status: "registered",
        channel: "student_request",
        note: `Level ${intakeForm.level} · clinic ${intakeForm.clinicNumber} · unit ${intakeForm.unitNumber}${
          intakeForm.isFamilyMember === "Yes" ? " · family member" : ""
        }`,
      });
      setIntakeOpen(false);
      setIntakeForm(emptyIntake);
      toast.success(
        "Patient request submitted",
        "It stays pending until the clinic desk screens and allocates it."
      );
    } catch (error) {
      setFormError(error?.message ?? "Could not submit the patient request.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !student) {
    return <OdentaLoaderPanel />;
  }

  return (
    <DashboardShell
      user={user}
      role={ROLES.UNI_STUDENT}
      subtitle={`${student.group} · ${campus?.term ?? "Term"}`}
      actions={
        <>
          <Button
            variant="secondary"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => {
              setFormError("");
              setProcedureOpen(true);
            }}
          >
            Request procedure
          </Button>
          <Button
            variant="secondary"
            leftIcon={<UserPlus className="h-4 w-4" />}
            onClick={() => {
              setFormError("");
              setIntakeOpen(true);
            }}
          >
            Add patient
          </Button>
          <Button leftIcon={<UserSquare2 className="h-4 w-4" />} onClick={() => navigate(uni.myPatients)}>
            My patients
          </Button>
        </>
      }
      kpis={[
        {
          label: "My patients",
          value: formatNumber(activeCases.length),
          icon: <UserSquare2 className="h-5 w-5" />,
        },
        {
          label: "Today's appointments",
          value: formatNumber(todayCount),
          tone: "brand",
          icon: <CalendarDays className="h-5 w-5" />,
        },
        {
          label: "Awaiting sign-off",
          value: formatNumber(counters.awaitingSignOff ?? pending.length),
          tone: "warning",
          icon: <ClipboardCheck className="h-5 w-5" />,
        },
        {
          label: "Requirement progress",
          value: `${student.progress}%`,
          tone: "success",
          icon: <Target className="h-5 w-5" />,
        },
      ]}
    >
      {consentMissingCount ? (
        <InfoBanner
          tone="warning"
          action={
            <Button size="xs" variant="secondary" onClick={() => navigate(uni.myPatients)}>
              Review patients
            </Button>
          }
        >
          {consentMissingCount} of your active case{consentMissingCount === 1 ? " has" : "s have"} no
          signed consent. No step on those cases can be submitted for review until consent is captured.
        </InfoBanner>
      ) : null}

      {returnedCount ? (
        <Card className="flex-row flex-wrap items-center justify-between gap-4 border-warning/30 bg-warning-soft/60 px-6 py-5">
          <div className="min-w-0">
            <span className="od-label">Needs your attention</span>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <span className="text-[20px] font-extrabold text-ink">{returned[0].procedureType}</span>
              <DepartmentChip department={returned[0].department} short />
            </div>
            <p className="mt-1 text-[13px] text-ink-muted">
              {returned[0].patientName} · returned {fromNow(returned[0].decidedAt)} — {returned[0].comment}
            </p>
          </div>
          <Button size="lg" onClick={() => navigate(uni.reviews)}>
            Open correction
          </Button>
        </Card>
      ) : null}

      <div className="grid grid-cols-12 gap-5">
        {/* ---------------------------------------------------- the two widgets */}
        <AppointmentsWidget
          className="col-span-12 xl:col-span-7"
          appointments={filteredAppointments}
          dayFilter={dayFilter}
          onDayFilterChange={setDayFilter}
          hourFilter={hourFilter}
          onHourFilterChange={setHourFilter}
          onOpenPatient={(row) => {
            const match = activeCases.find((item) => item.id === row.caseId);
            if (match) setSelectedCase(match);
            else if (row.nationalId) navigate(uni.patientTab(row.nationalId, "medical"));
          }}
        />

        <ProcedureRequestsWidget
          className="col-span-12 xl:col-span-5"
          requests={procedureRequests}
          onRaise={() => {
            setFormError("");
            setProcedureOpen(true);
          }}
        />

        {/* ----------------------------------------------- requirement quota */}
        <Card className="col-span-12 xl:col-span-5">
          <CardHeader
            title="Rotation requirements"
            subtitle={`${student.acceptedSteps} accepted steps this term`}
            action={
              <Button variant="link" size="sm" onClick={() => navigate(uni.requirements)}>
                Full breakdown
              </Button>
            }
          />
          <CardBody className="pt-2">
            <div className="flex items-center gap-6">
              <ProgressRing
                value={student.progress}
                sublabel="overall"
                tone={student.progress >= 70 ? "success" : student.progress >= 40 ? "brand" : "warning"}
              />
              <div className="min-w-0 flex-1 space-y-4">
                {student.requirements.slice(0, 3).map((entry) => (
                  <RequirementBar key={entry.department} {...entry} />
                ))}
              </div>
            </div>

            {student.requirements.length > 3 ? (
              <div className="mt-5 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2">
                {student.requirements.slice(3).map((entry) => (
                  <RequirementBar key={entry.department} {...entry} />
                ))}
              </div>
            ) : null}
          </CardBody>
        </Card>

        {/* --------------------------------------------------- my caseload */}
        <Card className="col-span-12 xl:col-span-7">
          <CardHeader
            title="My caseload"
            subtitle={`${activeCases.length} active case(s)`}
            action={
              <Button variant="link" size="sm" onClick={() => navigate(uni.myPatients)}>
                All patients
              </Button>
            }
          />
          <CardBody className="pt-2">
            {activeCases.length === 0 ? (
              <EmptyState title="No active cases" description="Nothing is allocated to you." className="py-10" />
            ) : (
              <ul className="flex flex-col gap-2.5">
                {activeCases.slice(0, 5).map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 px-3.5 py-3 transition hover:border-brand-300 hover:bg-brand-50/40"
                  >
                    <span className="min-w-0">
                      <button
                        type="button"
                        onClick={() => setSelectedCase(item)}
                        className="od-focus block truncate rounded text-[13px] font-bold text-ink hover:text-brand-700"
                      >
                        {item.patientName}
                      </button>
                      <span className="mt-0.5 block truncate text-[12px] text-ink-soft">
                        {item.chiefComplaint}
                      </span>
                      <CaseAlerts item={item} compact className="mt-1.5" />
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <DepartmentChip department={item.department} short />
                      <CaseStatusBadge status={item.status} />
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card className="col-span-12">
          <CardHeader title="Announcements" subtitle="From the faculty" />
          <CardBody className="pt-2">
            {announcements.length === 0 ? (
              <EmptyState icon={<Megaphone className="h-6 w-6" />} title="Nothing posted" className="py-8" />
            ) : (
              <ul className="grid gap-3 md:grid-cols-2">
                {announcements.slice(0, 4).map((item) => (
                  <li key={item.id} className="rounded-xl border border-slate-200 px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-[13.5px] font-bold text-ink">{item.title}</span>
                      {item.pinned ? (
                        <span className="shrink-0 rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-brand-700">
                          Pinned
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-muted">{item.body}</p>
                    <p className="mt-2 text-[11px] font-semibold text-ink-faint">
                      {item.author} · {formatDate(item.publishedAt, "d MMM yyyy")}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      {/* ------------------------------------------------- request procedure */}
      {/* The same dialog the Procedure Requests screen opens. A desk request
          raised from the dashboard and one raised from the list have to reach
          the desk as the same thing — including its urgency, which the
          dashboard's own copy of this form used to leave off entirely. */}
      <RaiseProcedureRequestModal
        open={procedureOpen}
        onClose={() => setProcedureOpen(false)}
        onCreated={refetchRequests}
        studentId={studentId}
      />

      {/* ----------------------------------------------------- add a patient */}
      <Modal
        open={intakeOpen}
        onClose={() => setIntakeOpen(false)}
        title="Add a patient appointment"
        description="Books a chair and asks the desk to screen and allocate the patient."
        size="lg"
      >
        <form onSubmit={submitIntake} className="flex flex-col gap-4">
          {formError ? <InfoBanner tone="warning">{formError}</InfoBanner> : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Student ID">
              <Input value={student.id} readOnly disabled />
            </Field>
            <Field label="Student name">
              <Input value={user?.name ?? ""} readOnly disabled />
            </Field>
          </div>

          <Field label="Level" required>
            <Select
              value={intakeForm.level}
              onChange={(event) => setIntakeForm((prev) => ({ ...prev, level: event.target.value }))}
            >
              {LEVELS.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </Select>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Clinic number" required>
              <Input
                type="number"
                placeholder="Enter clinic number"
                value={intakeForm.clinicNumber}
                onChange={(event) =>
                  setIntakeForm((prev) => ({ ...prev, clinicNumber: event.target.value }))
                }
              />
            </Field>
            <Field label="Unit number" required>
              <Input
                type="number"
                placeholder="Enter unit number"
                value={intakeForm.unitNumber}
                onChange={(event) =>
                  setIntakeForm((prev) => ({ ...prev, unitNumber: event.target.value }))
                }
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Date" required>
              <Input
                type="date"
                value={intakeForm.date}
                onChange={(event) => setIntakeForm((prev) => ({ ...prev, date: event.target.value }))}
              />
            </Field>
            <Field label="Session" required>
              <Select
                value={intakeForm.session}
                onChange={(event) => setIntakeForm((prev) => ({ ...prev, session: event.target.value }))}
              >
                {CLINIC_SESSIONS.map((session) => (
                  <option key={session.value} value={session.value}>
                    {session.label} ({session.start}–{session.end})
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Field label="Procedure" required>
            <Select
              value={intakeForm.department}
              onChange={(event) =>
                setIntakeForm((prev) => ({ ...prev, department: event.target.value }))
              }
            >
              {DEPARTMENTS.map((department) => (
                <option key={department.key} value={department.key}>
                  {department.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Patient's name" hint="if you already have one">
            <Input
              placeholder="Enter patient name (optional)"
              value={intakeForm.patientName}
              onChange={(event) =>
                setIntakeForm((prev) => ({ ...prev, patientName: event.target.value }))
              }
            />
          </Field>

          <Field label="Is the patient one of your family members?">
            <div className="grid gap-2 sm:grid-cols-2">
              {["Yes", "No"].map((option) => (
                <Radio
                  key={option}
                  label={option}
                  name="isFamilyMember"
                  value={option}
                  checked={intakeForm.isFamilyMember === option}
                  onChange={() => setIntakeForm((prev) => ({ ...prev, isFamilyMember: option }))}
                />
              ))}
            </div>
          </Field>

          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="secondary" onClick={() => setIntakeOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="success" loading={submitting}>
              Submit request
            </Button>
          </div>
        </form>
      </Modal>

      {/* -------------------------------------------------- patient snapshot */}
      <Modal
        open={Boolean(selectedCase)}
        onClose={() => setSelectedCase(null)}
        title={selectedCase?.patientName}
        description={selectedCase?.chiefComplaint}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setSelectedCase(null)}>
              Close
            </Button>
            <Button
              onClick={() => {
                const target = selectedCase;
                setSelectedCase(null);
                if (target) navigate(uni.patientTab(target.nationalId, "medical"));
              }}
            >
              Open full record
            </Button>
          </>
        }
      >
        {selectedCase ? (
          <div className="flex flex-col gap-5">
            <CaseAlerts item={selectedCase} />

            <section>
              <h4 className="mb-3 text-[13px] font-bold text-ink">Personal information</h4>
              <DetailGrid
                columns={2}
                items={[
                  { label: "National ID", value: selectedCase.nationalId },
                  { label: "Phone", value: selectedCase.phone },
                  { label: "Gender", value: selectedCase.gender },
                  { label: "Age", value: selectedCase.age },
                  { label: "Address", value: selectedCase.address },
                  { label: "Occupation", value: selectedCase.occupation },
                ]}
              />
            </section>

            <section>
              <h4 className="mb-3 text-[13px] font-bold text-ink">Medical history</h4>
              <DetailGrid
                columns={2}
                items={[
                  {
                    label: "Chronic diseases",
                    value: selectedCase.medicalInfo?.chronicDiseases?.join(", ") || "None",
                  },
                  {
                    label: "Recent surgical procedures",
                    value: selectedCase.medicalInfo?.recentSurgicalProcedures || "None",
                  },
                  {
                    label: "Current medications",
                    value: selectedCase.medicalInfo?.currentMedications || "None",
                  },
                  { label: "Allergies", value: selectedCase.allergies?.join(", ") || "None" },
                ]}
              />
            </section>

            <section>
              <h4 className="mb-2 text-[13px] font-bold text-ink">Chief complaint</h4>
              <p className="rounded-xl bg-slate-50 px-4 py-3 text-[13px] text-ink-muted">
                {selectedCase.chiefComplaint || "None recorded"}
              </p>
            </section>
          </div>
        ) : null}
      </Modal>
    </DashboardShell>
  );
}
