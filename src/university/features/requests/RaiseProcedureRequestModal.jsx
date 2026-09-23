import { useEffect, useState } from "react";
import { Send } from "lucide-react";
import { useAsync } from "@/hooks";
import { universityService } from "@/services";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, Select, Textarea } from "@/components/ui/Field";
import { InfoBanner } from "@/components/ui/Misc";
import { SegmentedControl } from "@/components/ui/Tabs";
import { useToast } from "@/components/ui/Toast";

const KINDS = [
  "Radiograph — periapical",
  "Radiograph — panoramic",
  "Local anaesthesia top-up",
  "Extra chair time (30 min)",
  "Scaling assistance",
  "Impression material",
  "Emergency staff call",
];

const URGENCY = [
  { value: "routine", label: "Routine" },
  { value: "urgent", label: "Urgent" },
];

/** Ask the clinic desk for something mid-session. */
export function RaiseProcedureRequestModal({ open, onClose, onCreated, studentId }) {
  const toast = useToast();
  const [caseId, setCaseId] = useState("");
  const [kind, setKind] = useState(KINDS[0]);
  const [urgency, setUrgency] = useState("routine");
  const [note, setNote] = useState("");
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
    const parent = cases.find((item) => item.id === caseId);
    if (!parent) {
      setError("Pick the case this request belongs to.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await universityService.raiseProcedureRequest({
        caseId: parent.id,
        patientName: parent.patientName,
        studentId: parent.studentId,
        studentName: parent.studentName,
        department: parent.department,
        kind,
        urgency,
        note: note.trim() || null,
      });
      toast.success("Request sent to the desk", kind);
      onCreated?.();
      onClose?.();
      setNote("");
      setUrgency("routine");
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
      title="Raise a procedure request"
      description="The clinic desk sees this immediately and approves or declines it."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} loading={busy} leftIcon={<Send className="h-4 w-4" />}>
            Send request
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="Case" required>
          <Select value={caseId} onChange={(event) => setCaseId(event.target.value)}>
            {cases.length === 0 ? <option value="">No cases allocated</option> : null}
            {cases.map((item) => (
              <option key={item.id} value={item.id}>
                {item.patientName} · {item.id}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="What do you need" required>
          <Select value={kind} onChange={(event) => setKind(event.target.value)}>
            {KINDS.map((entry) => (
              <option key={entry} value={entry}>
                {entry}
              </option>
            ))}
          </Select>
        </Field>

        <div>
          <span className="text-[13px] font-semibold text-ink">Urgency</span>
          <SegmentedControl
            className="mt-2"
            options={URGENCY}
            value={urgency}
            onChange={setUrgency}
          />
          {urgency === "urgent" ? (
            <p className="mt-2 text-[12px] text-ink-muted">
              Urgent requests jump the desk queue. Use it when the patient is in the chair and the
              session cannot continue.
            </p>
          ) : null}
        </div>

        <Field label="Note">
          <Textarea
            rows={3}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Anything the desk needs to know…"
          />
        </Field>

        {error ? <InfoBanner tone="warning">{error}</InfoBanner> : null}
      </div>
    </Modal>
  );
}
