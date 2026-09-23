import { useMemo, useState } from "react";
import { Send } from "lucide-react";
import { universityService } from "@/services";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { InfoBanner } from "@/components/ui/Misc";
import { useToast } from "@/components/ui/Toast";
import { departmentMeta } from "@/config/academic";

/**
 * The steps a supervisor expects to sign, per rotation.
 *
 * Kept beside the submit form rather than in `config/academic.js` because it
 * is a teaching convention that varies by faculty — the backend should own it
 * eventually, and this is the shape it will return.
 */
const STEP_LIBRARY = {
  operative: [
    "Diagnosis & treatment plan",
    "Cavity preparation",
    "Matrix & isolation",
    "Restoration placement",
    "Finishing & polishing",
  ],
  endodontics: [
    "Diagnosis & access",
    "Working length determination",
    "Canal instrumentation",
    "Master cone fit",
    "Obturation",
  ],
  prosthodontics_fixed: [
    "Case plan & abutment selection",
    "Tooth preparation",
    "Final impression",
    "Provisional restoration",
    "Cementation",
  ],
  prosthodontics_removable: [
    "Primary impression",
    "Secondary impression",
    "Jaw relation record",
    "Try-in",
    "Insertion",
  ],
  periodontics: [
    "Perio charting",
    "Diagnosis & staging",
    "Scaling — upper quadrants",
    "Scaling — lower quadrants",
    "Re-evaluation",
  ],
  oral_surgery: [
    "Assessment & radiograph",
    "Anaesthesia",
    "Extraction / flap",
    "Closure & haemostasis",
    "Post-operative review",
  ],
};

/** Submit one step of one procedure to the supervising clinician. */
export function SubmitStepModal({ item, open, onClose, onSubmitted }) {
  const toast = useToast();
  const steps = useMemo(
    () => STEP_LIBRARY[item?.department] ?? STEP_LIBRARY.operative,
    [item?.department]
  );

  const [procedureType, setProcedureType] = useState(steps[0]);
  const [tooth, setTooth] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  if (!item) return null;

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await universityService.submitStep({
        caseId: item.id,
        procedureType,
        tooth: tooth.trim() || null,
        stepIndex: steps.indexOf(procedureType) + 1,
        stepTotal: steps.length,
        note: note.trim() || null,
      });
      toast.success("Sent for review", `${item.supervisorName} · ${procedureType}`);
      onSubmitted?.();
      onClose?.();
      setTooth("");
      setNote("");
    } catch (cause) {
      setError(cause?.message ?? "Could not submit this step");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Submit a step for review"
      description={`${item.patientName} · ${departmentMeta(item.department).label}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} loading={busy} leftIcon={<Send className="h-4 w-4" />}>
            Send to {item.supervisorName?.split(" ")[1] ?? "supervisor"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {!item.consentSigned ? (
          <InfoBanner tone="warning">
            Consent is not signed for this patient. The submission will be rejected until it is.
          </InfoBanner>
        ) : null}

        <Field label="Which step" required>
          <Select value={procedureType} onChange={(event) => setProcedureType(event.target.value)}>
            {steps.map((step, index) => (
              <option key={step} value={step}>
                {index + 1}. {step}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Tooth" hint="FDI, e.g. 36">
          <Input
            value={tooth}
            onChange={(event) => setTooth(event.target.value)}
            placeholder="36"
            maxLength={2}
          />
        </Field>

        <Field label="Note for your staff member">
          <Textarea
            rows={4}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Anything they should know before opening the record…"
          />
        </Field>

        {error ? <InfoBanner tone="warning">{error}</InfoBanner> : null}
      </div>
    </Modal>
  );
}
