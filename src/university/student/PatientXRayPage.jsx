import { useOutletContext } from "react-router-dom";
import { MediaLibrary } from "./MediaLibrary";

/** Radiographs for one patient. */
export default function PatientXRayPage() {
  const { record } = useOutletContext();
  return <MediaLibrary record={record} kind="xray" />;
}
