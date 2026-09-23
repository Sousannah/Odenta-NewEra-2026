import { useOutletContext } from "react-router-dom";
import { PageHeader } from "@/components/shared";
import { MedicalPanel } from "./MedicalPanel";

/** The medical tab of a patient record. */
export default function PatientMedicalPage() {
  const { record, setRecord } = useOutletContext();

  return (
    <div className="flex flex-col gap-4 p-4 sm:gap-5 sm:p-6">
      <PageHeader
        title="Medical information"
        description="View patient information and manage medical history."
      />
      <MedicalPanel record={record} onSaved={setRecord} />
    </div>
  );
}
