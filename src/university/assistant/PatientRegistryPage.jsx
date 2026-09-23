import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarCheck,
  CalendarPlus,
  Pencil,
  Trash2,
  UserPlus,
  UserRoundPlus,
  UsersRound,
} from "lucide-react";
import { useAsync, useDebounced } from "@/hooks";
import { universityService } from "@/services";
import { formatDate } from "@/lib/format";
import { toDateKey } from "@/lib/time";
import { uni } from "@/config/paths";
import { CLINIC_SESSIONS, DEPARTMENTS } from "@/config/academic";
import { Avatar, AvatarCard } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button, IconButton } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { Checkbox, Field, Input, MiniSelect, Select, Textarea } from "@/components/ui/Field";
import { ConfirmDialog, Modal } from "@/components/ui/Modal";
import { InfoBanner, KeyValue, Pagination, SearchInput } from "@/components/ui/Misc";
import { useToast } from "@/components/ui/Toast";
import { PageHeader, Toolbar, StatCard, StatGrid } from "@/components/shared";
import { CaseAlerts, CaseStatusBadge, DepartmentChip, DetailGrid } from "@/university/components";
import { AllocateCaseModal } from "@/university/features/cases/AllocateCaseModal";
import { BookVisitModal } from "./BookVisitModal";
import { StudentPickerModal } from "./StudentPickerModal";

/**
 * The clinic's patient registry.
 *
 * Not a caseload — the desk holds *everyone* who has ever been registered,
 * including the people nobody is treating yet. That is the difference between
 * this screen and a student's own caseload: a student asks "what am I working on", the desk
 * asks "is this person already on file", which is why search is the first
 * thing on the page and covers every number a patient might read out.
 *
 * Registration is the one place identity fields can be typed. Everywhere else
 * in the portal they are read-only, because a national ID edited after a chart
 * exists is a chart on the wrong person.
 */

/**
 * The same list the clinic desk's "Add patient" form offers, in the same
 * order. Two intake screens that disagree about the wording of a condition
 * produce two records that cannot be compared later.
 */
const CHRONIC_DISEASES = [
  "Diabetes",
  "Hypertension",
  "Heart Disease",
  "Asthma",
  "Arthritis",
  "Cancer",
  "Kidney Disease",
  "Liver Disease",
  "Thyroid Disease",
  "Depression",
  "Anxiety",
  "Other",
];

const PER_PAGE = 15;

/**
 * A walk-in who has not brought their card still needs an address the rest of
 * the portal can use, so a blank national ID becomes a TEMP- number rather
 * than a rejected form.
 */
const generateTempNationalId = () => `TEMP-${Math.floor(10_000_000 + Math.random() * 90_000_000)}`;

const SERIAL_PREFIX = "SN";
const generateSerialNumber = () => `${SERIAL_PREFIX}-${Math.floor(100_000 + Math.random() * 900_000)}`;

const emptyForm = () => ({
  patientName: "",
  nationalId: "",
  serialNumber: "",
  registrationDate: toDateKey(),
  phone: "",
  gender: "",
  age: "",
  address: "",
  occupation: "",
  notes: "",
  studentId: "",
  /* Carried alongside the id so the picker button can name who was chosen
     without the form holding a copy of the cohort to look them up in. */
  studentName: "",
  /**
   * Not on the form — the desk types identity and history, and the rotation is
   * settled when a student is allocated. It is carried in state so an edit
   * cannot silently reset a case that has already been screened somewhere.
   */
  department: DEPARTMENTS[0]?.key ?? "",
  chiefComplaint: "",
  currentMedications: "",
  recentSurgicalProcedures: "",
  chronicDiseases: [],
  otherChronicDisease: "",
});

const fromCase = (item) => ({
  patientName: item.patientName ?? "",
  nationalId: item.nationalId ?? "",
  serialNumber: item.serialNumber ?? "",
  registrationDate: item.openedAt ? toDateKey(item.openedAt) : toDateKey(),
  phone: item.phone ?? "",
  gender: item.gender ?? "",
  age: item.age ?? "",
  address: item.address ?? "",
  occupation: item.occupation ?? "",
  notes: item.notes ?? "",
  studentId: item.studentId ?? "",
  studentName: item.studentName ?? "",
  department: item.department ?? DEPARTMENTS[0]?.key,
  chiefComplaint: item.chiefComplaint ?? "",
  currentMedications: item.medicalInfo?.currentMedications ?? "",
  recentSurgicalProcedures: item.medicalInfo?.recentSurgicalProcedures ?? "",
  chronicDiseases: item.medicalInfo?.chronicDiseases ?? [],
  otherChronicDisease: item.medicalInfo?.otherChronicDisease ?? "",
});

/* ------------------------------------------------------------- the form */

/**
 * Intake, field for field as the clinic desk's "Add patient" form: identity
 * first, then history. A patient registered here and one registered in the
 * clinic app must produce the same record, so the two forms ask the same
 * questions in the same order rather than each asking whatever its own screen
 * happens to display.
 */
function PatientForm({ form, setForm, error, identityLocked = false, exceptCaseId }) {
  const [serialNote, setSerialNote] = useState(null);
  const [pickingStudent, setPickingStudent] = useState(false);
  const set = (field) => (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));

  /**
   * Both identity checks are one key read on the server rather than a search
   * through a copy of the registry the page used to have to download first.
   * A failed check is treated as "free": the server rejects a genuine
   * collision at registration with a 409, so a network blip must not stop the
   * desk registering the patient standing in front of them.
   */
  const isTaken = async (field, value) => {
    try {
      const result = await universityService.checkRegistryAvailability({
        [field]: value,
        exceptCaseId,
      });
      return Boolean(result?.[field]?.taken);
    } catch {
      return false;
    }
  };

  /* A blank national ID becomes a TEMP- number on blur, the way the desk form
     does it — the walk-in without their card is the common case, not the
     exception, and the record still needs an address. */
  const fillNationalId = async () => {
    if (identityLocked || form.nationalId.trim()) return;
    let candidate = generateTempNationalId();
    for (let attempt = 0; attempt < 5 && (await isTaken("nationalId", candidate)); attempt += 1) {
      candidate = generateTempNationalId();
    }
    setForm((prev) => (prev.nationalId.trim() ? prev : { ...prev, nationalId: candidate }));
  };

  const checkSerial = async () => {
    const value = form.serialNumber.trim();
    if (!value) {
      setSerialNote(null);
      return;
    }
    setSerialNote({ conflict: false, message: "Checking…" });
    setSerialNote(
      (await isTaken("serialNumber", value))
        ? { conflict: true, message: "That serial number is already in use." }
        : { conflict: false, message: "Serial number is available." }
    );
  };

  const rollSerial = async () => {
    let candidate = generateSerialNumber();
    for (let attempt = 0; attempt < 5 && (await isTaken("serialNumber", candidate)); attempt += 1) {
      candidate = generateSerialNumber();
    }
    setForm((prev) => ({ ...prev, serialNumber: candidate }));
    setSerialNote({ conflict: false, message: "Random serial number generated." });
  };

  const toggleDisease = (disease) =>
    setForm((prev) => ({
      ...prev,
      chronicDiseases: prev.chronicDiseases.includes(disease)
        ? prev.chronicDiseases.filter((entry) => entry !== disease)
        : [...prev.chronicDiseases, disease],
    }));

  return (
    <div className="flex flex-col gap-5">
      {error ? <InfoBanner tone="warning">{error}</InfoBanner> : null}

      {identityLocked ? (
        <InfoBanner tone="neutral">
          National ID and serial number identify the record everywhere else in the portal, so they
          cannot be changed after registration.
        </InfoBanner>
      ) : null}

      {/* ------------------------------------------------ patient information */}
      <SectionTitle>Patient Information</SectionTitle>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full Name" required>
          <Input value={form.patientName} onChange={set("patientName")} />
        </Field>

        <Field label="National ID">
          <Input
            value={form.nationalId}
            disabled={identityLocked}
            placeholder="Enter National ID (optional)"
            onChange={set("nationalId")}
            onBlur={fillNationalId}
          />
        </Field>

        <Field
          label="Serial Number"
          error={serialNote?.conflict ? serialNote.message : undefined}
          hint={serialNote && !serialNote.conflict ? serialNote.message : undefined}
        >
          <div className="flex gap-2">
            <Input
              className="flex-1"
              value={form.serialNumber}
              disabled={identityLocked}
              placeholder="Enter Serial Number (optional)"
              onChange={set("serialNumber")}
              onBlur={checkSerial}
            />
            <Button type="button" variant="secondary" disabled={identityLocked} onClick={rollSerial}>
              Random
            </Button>
          </div>
        </Field>

        <Field label="Registration Date">
          <Input type="date" value={form.registrationDate} onChange={set("registrationDate")} />
        </Field>

        <Field label="Phone Number">
          <Input
            type="tel"
            value={form.phone}
            placeholder="Enter phone number (optional)"
            onChange={set("phone")}
          />
        </Field>

        <Field label="Gender">
          <Select value={form.gender} onChange={set("gender")}>
            <option value="">Select Gender (optional)</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </Select>
        </Field>

        <Field label="Age">
          <Input
            type="number"
            min={0}
            max={120}
            value={form.age}
            placeholder="Enter age (optional)"
            onChange={set("age")}
          />
        </Field>

        <Field label="Address">
          <Input
            value={form.address}
            placeholder="Enter address (optional)"
            onChange={set("address")}
          />
        </Field>

        <Field label="Occupation">
          <Input
            value={form.occupation}
            placeholder="Enter occupation (optional)"
            onChange={set("occupation")}
          />
        </Field>

        {/* A button rather than a select: see `StudentPickerModal` for why a
            cohort in a dropdown is not something a desk can choose from. */}
        <Field label="Assign to Student" hint="optional">
          <button
            type="button"
            onClick={() => setPickingStudent(true)}
            className="od-focus flex h-11 w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3.5 text-left transition hover:border-brand-300 hover:bg-brand-50/40"
          >
            <span className="min-w-0 truncate text-sm font-semibold text-ink">
              {form.studentName || (
                <span className="font-normal text-ink-faint">Not allocated</span>
              )}
            </span>
            <span className="inline-flex shrink-0 items-center gap-1.5 text-[12px] font-bold text-brand-600">
              <UserPlus className="h-3.5 w-3.5" />
              {form.studentId ? "Change" : "Choose"}
            </span>
          </button>
        </Field>

        <Field label="Notes (Optional)" className="sm:col-span-2">
          <Textarea
            rows={3}
            value={form.notes}
            placeholder="Add any additional notes about the patient"
            onChange={set("notes")}
          />
        </Field>
      </div>

      {/* ------------------------------------------------ medical information */}
      <SectionTitle>Medical Information</SectionTitle>

      <div className="grid gap-4">
        <Field label="Chief Complaint">
          <Textarea
            rows={3}
            value={form.chiefComplaint}
            placeholder="Describe the patient's main complaint or reason for visit"
            onChange={set("chiefComplaint")}
          />
        </Field>

        <Field label="Current Medications">
          <Textarea
            rows={2}
            value={form.currentMedications}
            placeholder="List any current medications the patient is taking"
            onChange={set("currentMedications")}
          />
        </Field>

        <Field label="Recent Surgical Procedures">
          <Textarea
            rows={2}
            value={form.recentSurgicalProcedures}
            placeholder="List any recent surgical procedures"
            onChange={set("recentSurgicalProcedures")}
          />
        </Field>

        {/* Not wrapped in a Field: that renders a <label>, and a label around
            twelve checkboxes forwards every click to the first one. */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold text-ink">Chronic Diseases</span>
          <div className="grid gap-2.5 rounded-xl border border-slate-200 p-3 sm:grid-cols-2 lg:grid-cols-3">
            {CHRONIC_DISEASES.map((disease) => (
              <Checkbox
                key={disease}
                label={disease}
                checked={form.chronicDiseases.includes(disease)}
                onChange={() => toggleDisease(disease)}
              />
            ))}
          </div>
        </div>

        <StudentPickerModal
          open={pickingStudent}
          onClose={() => setPickingStudent(false)}
          department={form.department}
          selectedId={form.studentId}
          onPick={(student) =>
            setForm((prev) => ({
              ...prev,
              studentId: student?.id ?? "",
              studentName: student?.name ?? "",
            }))
          }
        />

        {form.chronicDiseases.includes("Other") ? (
          <Field label="Please specify">
            <Input
              value={form.otherChronicDisease}
              placeholder="Describe other chronic disease"
              onChange={set("otherChronicDisease")}
            />
          </Field>
        ) : null}
      </div>
    </div>
  );
}

/** The two headings the desk form splits intake under. */
function SectionTitle({ children }) {
  return (
    <h3 className="border-b border-slate-200 pb-2 text-[15px] font-extrabold text-brand-700">
      {children}
    </h3>
  );
}

/* ------------------------------------------------------------ the screen */

export default function PatientRegistryPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("all");
  const [allocation, setAllocation] = useState("all");
  const [page, setPage] = useState(1);

  const [registering, setRegistering] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [allocating, setAllocating] = useState(null);
  const [booking, setBooking] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);

  /**
   * The search box is wired to the server, so it waits for the desk to stop
   * typing. Without this every keystroke is a query against the registry.
   */
  const search = useDebounced(query);

  /* Any filter change invalidates the page number — page 4 of a two-page list
     is an empty screen that looks like "no patients". Reset before the fetch,
     so the fetch below runs once with the right page rather than twice. */
  useEffect(() => setPage(1), [search, department, allocation]);

  /**
   * One page of the registry, filtered and searched by the server.
   *
   * This screen used to read every patient the campus had ever registered,
   * then filter and page fifteen of them in the browser. The desk opens it
   * many times a day and a teaching hospital's registry does not stop growing,
   * so that read was both the slowest thing on the screen and the single
   * largest recurring cost in the portal.
   */
  const { data: pageData, loading, refetch } = useAsync(
    () =>
      universityService.getCasesPage({
        page,
        pageSize: PER_PAGE,
        q: search || undefined,
        department: department === "all" ? undefined : department,
        allocation: allocation === "all" ? undefined : allocation,
      }),
    [page, search, department, allocation],
    null
  );

  /* The four tiles are campus-wide totals, not counts of what is on screen, so
     they come from the desk's counters and do not move when a filter changes. */
  /* The date is passed rather than left to the server's default: "today" has
     to be the desk's today, and the server's clock is UTC. */
  const { data: summary, refetch: refetchSummary } = useAsync(
    () => universityService.getDeskSummary({ date: toDateKey() }),
    [],
    null
  );

  const paged = pageData?.items ?? [];
  const total = pageData?.total ?? 0;
  const pageCount = pageData?.pageCount ?? 1;
  const safePage = pageData?.page ?? page;

  const reload = () => {
    refetch();
    refetchSummary();
  };

  const openRegister = () => {
    setForm(emptyForm());
    setFormError("");
    setRegistering(true);
  };

  const openEdit = (item) => {
    setForm(fromCase(item));
    setFormError("");
    setEditing(item);
  };

  const payloadFrom = (values) => ({
    nationalId: values.nationalId.trim(),
    patientName: values.patientName.trim(),
    phone: values.phone.trim(),
    gender: values.gender,
    age: Number(values.age) || 0,
    address: values.address.trim(),
    occupation: values.occupation.trim(),
    department: values.department,
    openedAt: values.registrationDate,
    chiefComplaint: values.chiefComplaint.trim(),
    notes: values.notes.trim(),
    medicalFlags: values.chronicDiseases,
    medicalInfo: {
      chronicDiseases: values.chronicDiseases,
      otherChronicDisease: values.otherChronicDisease.trim(),
      currentMedications: values.currentMedications.trim(),
      recentSurgicalProcedures: values.recentSurgicalProcedures.trim(),
      chiefComplaint: values.chiefComplaint.trim(),
    },
  });

  /**
   * The name is the only field the desk cannot register without — everything
   * else is filled in as the patient produces it. The national ID is not on
   * that list because the form allocates a TEMP- number when it is left blank.
   */
  const validate = (values) => {
    if (!values.patientName.trim()) return "A full name is required.";
    return null;
  };

  const register = async (event) => {
    event.preventDefault();
    const problem = validate(form);
    if (problem) {
      setFormError(problem);
      return;
    }
    setBusy(true);
    setFormError("");
    try {
      /* A record with no national ID cannot be addressed by the rest of the
         portal, so one is allocated here rather than refused — the same
         TEMP- number the field itself fills in on blur. */
      const nationalId = form.nationalId.trim() || generateTempNationalId();
      const created = await universityService.createCase({
        ...payloadFrom(form),
        nationalId,
        serialNumber: form.serialNumber.trim() || undefined,
      });
      if (form.studentId) {
        await universityService.assignCase(created.id, {
          studentId: form.studentId,
          department: form.department,
        });
      }

      /**
       * The screening visit, created with the record.
       *
       * Registering somebody *is* a visit — they are standing at the desk —
       * so the appointment list should not need the desk to type the same
       * person into it a second time. A registration dated today or earlier
       * is one that has already happened and opens as finished; a date in the
       * future is somebody booking ahead, so it stays pending.
       */
      await universityService.createAppointment({
        patientName: form.patientName.trim(),
        nationalId,
        phone: form.phone.trim() || null,
        age: Number(form.age) || null,
        caseId: created.id,
        studentId: form.studentId || null,
        studentName: form.studentName || null,
        date: form.registrationDate,
        time: CLINIC_SESSIONS[0].start,
        session: CLINIC_SESSIONS[0].value,
        department: form.department,
        chiefComplaint: form.chiefComplaint.trim() || "Screening",
        chair: null,
        status: form.registrationDate <= toDateKey() ? "finished" : "registered",
      });

      reload();
      setRegistering(false);
      toast.success(
        "Patient registered",
        `${form.patientName} · visit logged for ${formatDate(form.registrationDate, "d MMM yyyy")}`
      );
    } catch (cause) {
      setFormError(cause?.message ?? "Could not register this patient.");
    } finally {
      setBusy(false);
    }
  };

  const saveEdit = async (event) => {
    event.preventDefault();
    const problem = validate(form);
    if (problem) {
      setFormError(problem);
      return;
    }
    setBusy(true);
    setFormError("");
    try {
      /* Identity is deliberately not in the payload — see the form banner. */
      const { nationalId, ...rest } = payloadFrom(form);
      await universityService.updateCase(editing.id, rest);
      /* Allocation is its own endpoint — it grants the student access to the
         record — so a changed student goes through it rather than the patch. */
      if (form.studentId && form.studentId !== editing.studentId) {
        await universityService.assignCase(editing.id, {
          studentId: form.studentId,
          department: form.department,
        });
      }
      reload();
      setEditing(null);
      toast.success("Patient updated", form.patientName);
    } catch (cause) {
      setFormError(cause?.message ?? "Could not save this record.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    try {
      await universityService.deleteCase(deleting.id);
      reload();
      toast.success("Registration withdrawn", deleting.patientName);
    } catch (cause) {
      toast.error("Could not withdraw this registration", cause?.message);
    } finally {
      setDeleting(null);
    }
  };

  const columns = [
    {
      key: "patientName",
      header: "Patient",
      sortable: true,
      /* Identity only. The medical flags used to hang under every name here,
         which made a list of forty patients a wall of red chips nobody read —
         and the desk is not the person who acts on them. They are on the
         record itself, where the chair is. */
      render: (row) => (
        <AvatarCard name={row.patientName} label={`${row.nationalId} · ${row.phone}`} size="sm" />
      ),
    },
    {
      key: "serialNumber",
      header: "Serial",
      sortable: true,
      render: (row) => (
        <span className="font-mono text-[12.5px] text-ink-muted">{row.serialNumber ?? "—"}</span>
      ),
    },
    {
      key: "gender",
      header: "Gender / Age",
      render: (row) => (
        <span className="whitespace-nowrap text-[13px] text-ink-muted">
          {row.gender} · {row.age}
        </span>
      ),
    },
    {
      key: "department",
      header: "Rotation",
      render: (row) => <DepartmentChip department={row.department} short />,
    },
    {
      key: "studentName",
      header: "Student",
      sortable: true,
      render: (row) =>
        row.studentName ? (
          <span className="text-[13px] text-ink">{row.studentName}</span>
        ) : (
          <Badge tone="warning">Needs a student</Badge>
        ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <CaseStatusBadge status={row.status} />,
    },
    {
      key: "openedAt",
      header: "Registered",
      sortable: true,
      render: (row) => (
        <span className="whitespace-nowrap text-[13px] text-ink-muted">
          {formatDate(row.openedAt, "d MMM yyyy")}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (row) => (
        <span
          className="flex items-center justify-end gap-1"
          onClick={(event) => event.stopPropagation()}
        >
          <IconButton size="sm" label="Edit patient" onClick={() => openEdit(row)}>
            <Pencil className="h-4 w-4" />
          </IconButton>
          <IconButton size="sm" label="Assign a student" onClick={() => setAllocating(row)}>
            <UserPlus className="h-4 w-4" />
          </IconButton>
          <IconButton
            size="sm"
            label="Withdraw registration"
            onClick={() => setDeleting(row)}
          >
            <Trash2 className="h-4 w-4" />
          </IconButton>
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4 p-4 sm:gap-5 sm:p-6">
      <PageHeader
        title="Patient registry"
        description="Everyone registered in the teaching clinic, allocated or not."
        actions={
          <Button leftIcon={<UserRoundPlus className="h-4 w-4" />} onClick={openRegister}>
            Register a patient
          </Button>
        }
      />

      {/* Three tiles, not four. "Consent outstanding" was a compliance number
          on an operational screen — it belongs to the case, and the desk
          cannot act on it from a list of names. "In treatment" now counts the
          people actually in the building today, which is the question the
          desk asks this screen all morning. */}
      <StatGrid cols={3}>
        <StatCard
          label="Registered"
          value={summary?.cases.total ?? 0}
          hint="everyone on file"
          icon={<UsersRound />}
        />
        <StatCard
          label="In treatment today"
          value={summary?.visits.total ?? 0}
          tone="success"
          hint={`${summary?.visits.waiting ?? 0} still waiting`}
          icon={<CalendarCheck />}
        />
        <StatCard
          label="Needing a student"
          value={summary?.cases.unassigned ?? 0}
          tone="warning"
          hint="screened, nobody allocated"
          icon={<UserPlus />}
        />
      </StatGrid>

      <Toolbar
        left={
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Name, national ID, serial or phone…"
            className="w-full sm:w-[340px]"
          />
        }
        right={
          <>
            <MiniSelect value={department} onChange={(event) => setDepartment(event.target.value)}>
              <option value="all">All rotations</option>
              {DEPARTMENTS.map((entry) => (
                <option key={entry.key} value={entry.key}>
                  {entry.label}
                </option>
              ))}
            </MiniSelect>
            <MiniSelect value={allocation} onChange={(event) => setAllocation(event.target.value)}>
              <option value="all">Allocated or not</option>
              <option value="unassigned">Needs a student</option>
              <option value="assigned">Has a student</option>
            </MiniSelect>
            <Button variant="secondary" onClick={() => navigate(uni.patientCards)}>
              Patient cards
            </Button>
          </>
        }
      />

      <DataTable
        columns={columns}
        rows={paged}
        loading={loading}
        onRowClick={(row) => setViewing(row)}
        emptyTitle="No patients found"
        emptyDescription={
          query ? "Try a different search term." : "Register the first patient to get started."
        }
        emptyAction={
          <Button leftIcon={<UserRoundPlus className="h-4 w-4" />} onClick={openRegister}>
            Register a patient
          </Button>
        }
      />

      {pageCount > 1 ? (
        <Pagination page={safePage} pageCount={pageCount} total={total} onChange={setPage} />
      ) : null}

      {/* ---------------------------------------------------------- register */}
      <Modal
        open={registering}
        onClose={() => setRegistering(false)}
        title="Register a patient"
        description="Screening intake. The record becomes a case the moment a student is allocated."
        size="xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRegistering(false)}>
              Cancel
            </Button>
            <Button loading={busy} onClick={register}>
              Register patient
            </Button>
          </>
        }
      >
        <form onSubmit={register}>
          <PatientForm form={form} setForm={setForm} error={formError} />
        </form>
      </Modal>

      {/* -------------------------------------------------------------- edit */}
      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title="Edit patient"
        description={editing ? `${editing.patientName} · ${editing.nationalId}` : undefined}
        size="xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button loading={busy} onClick={saveEdit}>
              Save changes
            </Button>
          </>
        }
      >
        <form onSubmit={saveEdit}>
          <PatientForm
            form={form}
            setForm={setForm}
            error={formError}
            exceptCaseId={editing?.id}
            identityLocked
          />
        </form>
      </Modal>

      {/* -------------------------------------------------------- the record */}
      <Modal
        open={Boolean(viewing)}
        onClose={() => setViewing(null)}
        title={viewing?.patientName}
        description={viewing ? `${viewing.nationalId} · serial ${viewing.serialNumber ?? "—"}` : undefined}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setViewing(null)}>
              Close
            </Button>
            {/* Books the visit here rather than sending the desk to the
                intake screen to retype a patient this dialog already has. */}
            <Button
              leftIcon={<CalendarPlus className="h-4 w-4" />}
              onClick={() => setBooking(viewing)}
            >
              Book a visit
            </Button>
          </>
        }
      >
        {viewing ? (
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center gap-3">
              <Avatar name={viewing.patientName} size="lg" />
              <span className="flex flex-wrap items-center gap-2">
                <CaseStatusBadge status={viewing.status} />
                <DepartmentChip department={viewing.department} />
              </span>
            </div>

            <CaseAlerts item={viewing} />

            <DetailGrid
              columns={2}
              items={[
                { label: "Phone", value: viewing.phone },
                { label: "Gender / age", value: `${viewing.gender} · ${viewing.age}` },
                { label: "Occupation", value: viewing.occupation },
                { label: "Address", value: viewing.address },
                { label: "Registered", value: formatDate(viewing.openedAt, "d MMM yyyy") },
                { label: "Last visit", value: formatDate(viewing.lastVisitAt, "d MMM yyyy") },
                { label: "Student", value: viewing.studentName ?? "Not allocated" },
                { label: "Supervisor", value: viewing.supervisorName },
              ]}
            />

            <KeyValue label="Chief complaint" value={viewing.chiefComplaint} />

            <div>
              <span className="od-label">Chronic diseases</span>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {viewing.medicalInfo?.chronicDiseases?.length ? (
                  viewing.medicalInfo.chronicDiseases.map((disease) => (
                    <Badge key={disease} tone="danger">
                      {disease}
                    </Badge>
                  ))
                ) : (
                  <span className="text-[13px] text-ink-soft">None recorded</span>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* ------------------------------------------------------ book a visit */}
      <BookVisitModal
        patient={booking}
        open={Boolean(booking)}
        onClose={() => setBooking(null)}
        onBooked={({ date, time, status }) => {
          toast.success(
            status === "finished" ? "Visit recorded" : "Visit booked",
            `${booking?.patientName} · ${formatDate(date, "d MMM")} at ${time}`
          );
          setBooking(null);
          setViewing(null);
          reload();
        }}
      />

      {/* ---------------------------------------------------------- allocate */}
      <AllocateCaseModal
        item={allocating}
        open={Boolean(allocating)}
        onClose={() => setAllocating(null)}
        onAllocated={reload}
      />

      {/* ------------------------------------------------------------ delete */}
      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={remove}
        tone="danger"
        title="Withdraw this registration?"
        description={
          deleting
            ? `${deleting.patientName} (${deleting.nationalId}) will be removed from the registry. This only works while nobody is treating them — a record with clinical work against it is archived, not deleted.`
            : undefined
        }
        confirmLabel="Withdraw registration"
      />
    </div>
  );
}
