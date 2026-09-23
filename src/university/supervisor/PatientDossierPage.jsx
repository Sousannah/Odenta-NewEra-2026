import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PatientDossierView } from "./PatientDossierView";

/**
 * The dossier on its own route.
 *
 * The body lives in `PatientDossierView` because the same record is read far
 * more often from a dialog stacked over the submission being judged
 * (`PatientDossierModal`) than from here — a full-page navigation in the
 * middle of a decision loses the decision. This route survives for a deep
 * link, a bookmark and a printout.
 */
export default function PatientDossierPage() {
  const { nationalId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6">
      <Button
        variant="ghost"
        className="self-start"
        leftIcon={<ArrowLeft className="h-4 w-4" />}
        onClick={() => navigate(-1)}
      >
        Back
      </Button>
      <PatientDossierView nationalId={nationalId} />
    </div>
  );
}
