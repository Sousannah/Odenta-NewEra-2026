import { useOutletContext } from "react-router-dom";
import { MediaLibrary } from "./MediaLibrary";

/** Clinical photographs for one patient. */
export default function PatientGalleryPage() {
  const { record } = useOutletContext();
  return <MediaLibrary record={record} kind="gallery" />;
}
