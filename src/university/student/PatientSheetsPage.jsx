import { useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { CheckCircle2, FileText } from "lucide-react";
import { universityService } from "@/services";
import { uni } from "@/config/paths";
import { departmentMeta } from "@/config/academic";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field, Select } from "@/components/ui/Field";
import { InfoBanner } from "@/components/ui/Misc";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/shared";
import { DepartmentChip } from "@/university/components";
import OperativeSheet from "./sheets/OperativeSheet";
import EndodonticSheet from "./sheets/EndodonticSheet";
import FixedProsthodonticsSheet from "./sheets/FixedProsthodonticsSheet";
import RemovableProsthodonticsSheet from "./sheets/RemovableProsthodonticsSheet";
import PeriodonticsSheet from "./sheets/PeriodonticsSheet";

/**
 * The examination sheet.
 *
 * A sheet is per procedure, not per patient: the same person opens an
 * operative sheet today and a perio sheet next month. So the screen starts by
 * asking which one, and each save appends a new sheet to the patient's history
 * rather than overwriting the last.
 */

const SHEETS = [
  { value: "Operative", label: "Operative", department: "operative", Component: OperativeSheet },
  { value: "Endodontics", label: "Endodontics", department: "endodontics", Component: EndodonticSheet },
  {
    value: "Fixed Prosthodontics",
    label: "Fixed Prosthodontics",
    department: "prosthodontics_fixed",
    Component: FixedProsthodonticsSheet,
  },
  {
    value: "Removable Prosthodontics",
    label: "Removable Prosthodontics",
    department: "prosthodontics_removable",
    Component: RemovableProsthodonticsSheet,
  },
  { value: "Periodontics", label: "Periodontics", department: "periodontics", Component: PeriodonticsSheet },
];

/** The sheet the patient's rotation implies, so the common case is one click. */
const suggestedFor = (department) =>
  SHEETS.find((sheet) => sheet.department === department)?.value ?? "";

export default function PatientSheetsPage() {
  const { record } = useOutletContext();
  const navigate = useNavigate();

  const [type, setType] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(null);

  const selected = SHEETS.find((sheet) => sheet.value === type);
  const suggested = suggestedFor(record.department);

  const save = async (sections, diagnosis, treatmentPlan, notes) => {
    setSaving(true);
    setError("");
    try {
      const created = await universityService.createCaseSheet(record.id, {
        type: selected.value,
        department: selected.department,
        status: "submitted",
        studentId: record.studentId,
        supervisorId: record.supervisorId,
        diagnosis,
        treatmentPlan,
        notes,
        sections,
      });
      setSaved(created);
      return true;
    } catch (cause) {
      setError(cause?.message ?? "Could not save the sheet.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const SheetComponent = selected?.Component;

  return (
    <div className="flex flex-col gap-4 p-4 sm:gap-5 sm:p-6">
      <PageHeader
        title="Patient examination sheet"
        description="Fill the sheet for the procedure you are about to carry out."
        actions={<DepartmentChip department={record.department} />}
      />

      {error ? <InfoBanner tone="warning">{error}</InfoBanner> : null}

      <Card>
        <CardHeader
          title={type ? `Current procedure: ${type}` : "Select a procedure type"}
          subtitle={
            type
              ? "Change the procedure type to start a different sheet."
              : `This patient is in ${departmentMeta(record.department).label}.`
          }
          action={
            <Field className="min-w-[240px]">
              <Select value={type} onChange={(event) => setType(event.target.value)}>
                <option value="">Select procedure type</option>
                {SHEETS.map((sheet) => (
                  <option key={sheet.value} value={sheet.value}>
                    {sheet.label}
                    {sheet.value === suggested ? " (this rotation)" : ""}
                  </option>
                ))}
              </Select>
            </Field>
          }
        />
        {!type ? (
          <CardBody className="pt-2">
            <InfoBanner tone="info">
              Pick a procedure type above to open its sheet. The completed sheet is saved to this
              patient's history and is what your staff member reads when signing a step.
            </InfoBanner>
            {suggested ? (
              <Button variant="secondary" size="sm" className="mt-4" onClick={() => setType(suggested)}>
                Open the {suggested} sheet
              </Button>
            ) : null}
          </CardBody>
        ) : null}
      </Card>

      {SheetComponent ? (
        <SheetComponent
          key={type}
          record={record}
          initialData={{}}
          saving={saving}
          onSave={save}
        />
      ) : null}

      <Modal
        open={Boolean(saved)}
        onClose={() => setSaved(null)}
        title="Sheet saved"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setSaved(null)}>
              Stay here
            </Button>
            <Button
              onClick={() => navigate(uni.patientTab(record.nationalId, "history"))}
              leftIcon={<FileText className="h-4 w-4" />}
            >
              Open history
            </Button>
          </>
        }
      >
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-success-soft text-success-strong">
            <CheckCircle2 className="h-5 w-5" />
          </span>
          <p className="text-[13.5px] leading-relaxed text-ink-muted">
            Your {saved?.type} sheet has been saved to {record.patientName}'s history. Submit the
            matching step from the Review Steps tab when you are ready for sign-off.
          </p>
        </div>
      </Modal>
    </div>
  );
}
