import { useEffect, useState } from "react";
import { dateKeyOffset } from "@/lib/time";
import { Send } from "lucide-react";
import { useAsync } from "@/hooks";
import { universityService } from "@/services";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { InfoBanner } from "@/components/ui/Misc";
import { useToast } from "@/components/ui/Toast";
import { LAB_KINDS } from "@/config/academic";
import { SHADE_GUIDE } from "@/config/dentalStandards";

const LAB_ITEMS = [
  "Study models",
  "Full metal crown",
  "PFM bridge — 3 unit",
  "Zirconia crown",
  "Post & core",
  "Complete upper denture",
  "Complete lower denture",
  "Partial denture — cobalt chrome",
  "Partial denture — acrylic",
  "Night guard",
];



/** Send a case to the university lab or an external one. */
export function RaiseLabRequestModal({ open, onClose, onCreated, studentId }) {
  const toast = useToast();
  const [caseId, setCaseId] = useState("");
  const [item, setItem] = useState(LAB_ITEMS[0]);
  const [teeth, setTeeth] = useState("");
  const [shade, setShade] = useState("A2");
  const [labKind, setLabKind] = useState("university");
  const [dueAt, setDueAt] = useState(() => dateKeyOffset(14));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const { data: cases = [] } = useAsync(
    () => (open ? universityService.getCases({ studentId: studentId ?? "all" }) : []),
    [open, studentId],
    []
  );

  useEffect(() => {
    if (open && cases.length && !caseId) setCaseId(cases[0].id);
  }, [open, cases, caseId]);

  const submit = async () => {
    const parent = cases.find((entry) => entry.id === caseId);
    if (!parent) {
      setError("Pick the case this work belongs to.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await universityService.raiseLabRequest({
        caseId: parent.id,
        patientName: parent.patientName,
        studentId: parent.studentId,
        studentName: parent.studentName,
        supervisorId: parent.supervisorId,
        supervisorName: parent.supervisorName,
        department: parent.department,
        item,
        teeth: teeth
          .split(/[,\s]+/)
          .map((value) => value.trim())
          .filter(Boolean),
        shade,
        labKind,
        labName: labKind === "external" ? "Delta Dental Lab" : "AIU Prosthetics Lab",
        dueAt,
        cost: 0,
      });
      toast.success("Lab request raised", `${item} · awaiting staff approval`);
      onCreated?.();
      onClose?.();
      setTeeth("");
    } catch (cause) {
      setError(cause?.message ?? "Could not raise this request");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Raise a lab request"
      description="A staff member approves the request before it reaches the lab bench."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} loading={busy} leftIcon={<Send className="h-4 w-4" />}>
            Send to staff member
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Case" required className="sm:col-span-2">
          <Select value={caseId} onChange={(event) => setCaseId(event.target.value)}>
            {cases.length === 0 ? <option value="">No cases allocated</option> : null}
            {cases.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.patientName} · {entry.id}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Work required" required className="sm:col-span-2">
          <Select value={item} onChange={(event) => setItem(event.target.value)}>
            {LAB_ITEMS.map((entry) => (
              <option key={entry} value={entry}>
                {entry}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Teeth" hint="FDI, comma separated">
          <Input value={teeth} onChange={(event) => setTeeth(event.target.value)} placeholder="16, 17" />
        </Field>

        <Field label="Shade">
          <Select value={shade} onChange={(event) => setShade(event.target.value)}>
            {SHADE_GUIDE.map((entry) => (
              <option key={entry} value={entry}>
                {entry}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Lab">
          <Select value={labKind} onChange={(event) => setLabKind(event.target.value)}>
            {LAB_KINDS.map((entry) => (
              <option key={entry.value} value={entry.value}>
                {entry.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Needed by">
          <Input type="date" value={dueAt} onChange={(event) => setDueAt(event.target.value)} />
        </Field>

        {error ? (
          <div className="sm:col-span-2">
            <InfoBanner tone="warning">{error}</InfoBanner>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
