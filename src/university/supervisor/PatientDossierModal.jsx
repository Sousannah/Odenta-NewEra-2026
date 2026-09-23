import { ArrowLeft, ArrowRight, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { PatientDossierView } from "./PatientDossierView";

/**
 * The dossier, stacked over whatever the reader was doing.
 *
 * It exists because of one bad sequence: a staff member halfway through
 * judging a submission clicks "open the full patient dossier", lands on
 * another screen, and the submission — with the step verdicts they had already
 * ticked — is gone. Opening the record over the decision keeps both alive, and
 * `onContinue` walks them straight into the verdict rather than dropping them
 * back where they started with nothing to do.
 */
export function PatientDossierModal({
  open,
  nationalId,
  onClose,
  onContinue,
  continueLabel = "Continue to the decision",
  backLabel = "Back",
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Full patient dossier"
      description={
        nationalId
          ? `Everything recorded for national ID ${nationalId} — read-only.`
          : "Everything recorded for this patient — read-only."
      }
      size="full"
      bodyClassName="max-h-[calc(100vh-220px)]"
      footer={
        <>
          <Button
            variant="secondary"
            leftIcon={<ArrowLeft className="h-4 w-4" />}
            onClick={onClose}
          >
            {backLabel}
          </Button>
          {onContinue ? (
            <Button rightIcon={<ArrowRight className="h-4 w-4" />} onClick={onContinue}>
              {continueLabel}
            </Button>
          ) : null}
        </>
      }
    >
      {open && nationalId ? (
        <PatientDossierView nationalId={nationalId} embedded onNavigateAway={onClose} />
      ) : null}
    </Modal>
  );
}

/** The link that opens it — same affordance everywhere the dossier is offered. */
export function OpenDossierButton({ onClick, className, size = "sm", variant = "secondary" }) {
  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      leftIcon={<FolderOpen className="h-4 w-4" />}
      onClick={onClick}
    >
      Open the full patient dossier
    </Button>
  );
}
