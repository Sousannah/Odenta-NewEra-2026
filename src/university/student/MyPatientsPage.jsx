import { useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Images, Pencil, Scan, UsersRound } from "lucide-react";
import { useAsync } from "@/hooks";
import { universityService } from "@/services";
import { uni } from "@/config/paths";
import { formatDate } from "@/lib/format";
import { DEPARTMENTS } from "@/config/academic";
import { AvatarCard } from "@/components/ui/Avatar";
import { Button, IconButton } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import { Field, Input, MiniSelect, Textarea } from "@/components/ui/Field";
import { InfoBanner, SearchInput } from "@/components/ui/Misc";
import { useToast } from "@/components/ui/Toast";
import { PageHeader, Toolbar } from "@/components/shared";
import { CaseAlerts, CaseStatusBadge, DepartmentChip } from "@/university/components";
import { MediaUploadModal } from "./MediaUploadModal";

/**
 * The student's caseload as a patient list.
 *
 * `cases` and `patients` are the same rows read two ways: the case list is
 * about teaching state, this one is about people. A student looking for
 * "Mr Barakat" wants the second, so search covers name, national id and phone
 * — everything they might have to hand.
 */

const CHRONIC_DISEASES = [
  "Diabetes Mellitus",
  "Hypertension",
  "Cardiovascular Disease",
  "Coagulopathy / Bleeding Disorders",
  "Thyroid Disorders",
  "Pregnancy",
  "Lactation",
  "Hepatic Diseases",
  "Renal Diseases",
];

export default function MyPatientsPage() {
  const { user } = useOutletContext() ?? {};
  const navigate = useNavigate();
  const toast = useToast();

  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("all");
  const [editing, setEditing] = useState(null);
  const [uploadFor, setUploadFor] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState(null);

  const { data: patients = [], loading, refetch } = useAsync(
    () => universityService.getCases({ studentId: user?.staffId ?? "all" }),
    [user?.staffId],
    []
  );

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return patients.filter((item) => {
      if (department !== "all" && item.department !== department) return false;
      if (!needle) return true;
      return [item.patientName, item.nationalId, item.phone, item.cardNumber]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(needle));
    });
  }, [patients, query, department]);

  const openEditor = (patient) => {
    setFormError("");
    setForm({
      chiefComplaint: patient.medicalInfo?.chiefComplaint ?? patient.chiefComplaint ?? "",
      chronicDiseases: patient.medicalInfo?.chronicDiseases ?? [],
      recentSurgicalProcedures: patient.medicalInfo?.recentSurgicalProcedures ?? "",
      currentMedications: patient.medicalInfo?.currentMedications ?? "",
      allergies: (patient.allergies ?? []).join(", "),
      phone: patient.phone ?? "",
      address: patient.address ?? "",
      occupation: patient.occupation ?? "",
    });
    setEditing(patient);
  };

  const toggleDisease = (disease) =>
    setForm((prev) => ({
      ...prev,
      chronicDiseases: prev.chronicDiseases.includes(disease)
        ? prev.chronicDiseases.filter((item) => item !== disease)
        : [...prev.chronicDiseases, disease],
    }));

  const save = async (event) => {
    event.preventDefault();
    if (!form.chiefComplaint.trim()) {
      setFormError("A chief complaint is required — it is what the whole record hangs on.");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      await universityService.updatePatientRecord(editing.nationalId, {
        chiefComplaint: form.chiefComplaint,
        phone: form.phone,
        address: form.address,
        occupation: form.occupation,
        allergies: form.allergies
          .split(",")
          .map((entry) => entry.trim())
          .filter(Boolean),
        medicalInfo: {
          chronicDiseases: form.chronicDiseases,
          recentSurgicalProcedures: form.recentSurgicalProcedures,
          currentMedications: form.currentMedications,
          chiefComplaint: form.chiefComplaint,
        },
      });
      refetch();
      setEditing(null);
      toast.success("Patient updated", editing.patientName);
    } catch (error) {
      setFormError(error?.message ?? "Could not save the record.");
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      key: "patientName",
      header: "Patient",
      sortable: true,
      render: (row) => (
        <span className="min-w-0">
          <AvatarCard name={row.patientName} label={row.chiefComplaint} size="sm" />
          <CaseAlerts item={row} compact className="mt-1.5" />
        </span>
      ),
    },
    { key: "nationalId", header: "National ID", sortable: true },
    { key: "phone", header: "Phone" },
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
      key: "status",
      header: "Status",
      render: (row) => <CaseStatusBadge status={row.status} />,
    },
    {
      key: "lastVisitAt",
      header: "Last visit",
      sortable: true,
      render: (row) => (
        <span className="whitespace-nowrap text-[13px] text-ink-muted">
          {formatDate(row.lastVisitAt, "d MMM yyyy")}
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
          <IconButton size="sm" label="Edit patient" onClick={() => openEditor(row)}>
            <Pencil className="h-4 w-4" />
          </IconButton>
          <IconButton
            size="sm"
            label="Add X-rays"
            onClick={() => setUploadFor({ patient: row, kind: "xray" })}
          >
            <Scan className="h-4 w-4" />
          </IconButton>
          <IconButton
            size="sm"
            label="Add gallery images"
            onClick={() => setUploadFor({ patient: row, kind: "gallery" })}
          >
            <Images className="h-4 w-4" />
          </IconButton>
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4 p-4 sm:gap-5 sm:p-6">
      <PageHeader
        title="Patients"
        description="Every patient allocated to you, with the record behind each one a click away."
      />

      <Toolbar
        left={
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search by name, national ID or phone…"
            className="w-full sm:w-[340px]"
          />
        }
        right={
          <>
            <MiniSelect value={department} onChange={(event) => setDepartment(event.target.value)}>
              <option value="all">All rotations</option>
              {DEPARTMENTS.map((item) => (
                <option key={item.key} value={item.key}>
                  {item.label}
                </option>
              ))}
            </MiniSelect>
            <Button variant="secondary" onClick={() => navigate(uni.patientCards)}>
              Patient cards
            </Button>
          </>
        }
      />

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        onRowClick={(row) => navigate(uni.patientTab(row.nationalId, "medical"))}
        emptyTitle="No patients found"
        emptyDescription={
          query
            ? "Try a different search term."
            : "No patients are currently allocated to you. The clinic desk assigns screened cases."
        }
        emptyAction={
          <Button variant="secondary" leftIcon={<UsersRound className="h-4 w-4" />} onClick={() => navigate(uni.root)}>
            Back to dashboard
          </Button>
        }
      />

      {/* ------------------------------------------------------- edit record */}
      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title="Edit patient"
        description={editing ? `${editing.patientName} · ${editing.nationalId}` : undefined}
        size="lg"
      >
        {form ? (
          <form onSubmit={save} className="flex flex-col gap-4">
            {formError ? <InfoBanner tone="warning">{formError}</InfoBanner> : null}

            <InfoBanner tone="neutral">
              Name, national ID, gender and age are set at screening and are read-only for students.
            </InfoBanner>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Phone number">
                <Input
                  value={form.phone}
                  onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                />
              </Field>
              <Field label="Occupation">
                <Input
                  value={form.occupation}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, occupation: event.target.value }))
                  }
                />
              </Field>
            </div>

            <Field label="Address">
              <Input
                value={form.address}
                onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
              />
            </Field>

            <Field label="Chronic diseases">
              <div className="grid gap-2 rounded-xl border border-slate-200 p-3 sm:grid-cols-2 lg:grid-cols-3">
                {CHRONIC_DISEASES.map((disease) => {
                  const checked = form.chronicDiseases.includes(disease);
                  return (
                    <button
                      key={disease}
                      type="button"
                      onClick={() => toggleDisease(disease)}
                      aria-pressed={checked}
                      className={
                        checked
                          ? "od-focus rounded-lg border border-brand-600 bg-brand-50/70 px-3 py-2 text-left text-[12.5px] font-semibold text-brand-800"
                          : "od-focus rounded-lg border border-slate-200 px-3 py-2 text-left text-[12.5px] text-ink-muted hover:border-slate-300 hover:bg-slate-50"
                      }
                    >
                      {disease}
                    </button>
                  );
                })}
              </div>
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Recent surgical procedures" hint="optional">
                <Textarea
                  rows={2}
                  value={form.recentSurgicalProcedures}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, recentSurgicalProcedures: event.target.value }))
                  }
                />
              </Field>
              <Field label="Current medications" hint="optional">
                <Textarea
                  rows={2}
                  value={form.currentMedications}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, currentMedications: event.target.value }))
                  }
                />
              </Field>
            </div>

            <Field label="Allergies" hint="comma separated">
              <Input
                placeholder="Penicillin, latex…"
                value={form.allergies}
                onChange={(event) => setForm((prev) => ({ ...prev, allergies: event.target.value }))}
              />
            </Field>

            <Field label="Chief complaint" required>
              <Textarea
                rows={3}
                placeholder="Describe the patient's main complaint or reason for visit"
                value={form.chiefComplaint}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, chiefComplaint: event.target.value }))
                }
              />
            </Field>

            <div className="flex justify-end gap-3 pt-1">
              <Button type="button" variant="secondary" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button type="submit" loading={saving}>
                Update patient
              </Button>
            </div>
          </form>
        ) : null}
      </Modal>

      {/* ---------------------------------------------------------- uploads */}
      <MediaUploadModal
        open={Boolean(uploadFor)}
        onClose={() => setUploadFor(null)}
        kind={uploadFor?.kind ?? "gallery"}
        caseId={uploadFor?.patient?.id}
        patientName={uploadFor?.patient?.patientName}
        onUploaded={() => {
          toast.success(
            uploadFor?.kind === "xray" ? "X-rays added" : "Gallery images added",
            uploadFor?.patient?.patientName
          );
          setUploadFor(null);
        }}
      />
    </div>
  );
}
