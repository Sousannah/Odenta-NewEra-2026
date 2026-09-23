import { useState } from "react";
import { MedicalPanel } from "../MedicalPanel";
import {
  OptionRow,
  SheetActions,
  SheetSection,
  SheetTabs,
  TextRow,
  YesNoRow,
} from "./SheetControls";

/**
 * Removable prosthodontics.
 *
 * The assessment that decides whether a denture will be retained: ridge form,
 * inter-arch space, mucosa, tongue and saliva. Almost nothing here is
 * measurable, which is why every answer is a fixed option set — the point of
 * the sheet is that two students grade the same mouth the same way.
 */

const DEFAULTS = {
  dentalHistory: {
    historyOfDentalExtraction: { pulpal: "", perio: "", trauma: "", congenital: "" },
    durationOfEdentulism: { maxilla: "", mandible: "" },
    previousDenture: { maxillary: "", mandibular: "" },
    experienceOfPreviousDenture: "",
  },
  extraOralExamination: { facialForm: "", muscleTone: "", lips: "", tmj: "" },
  intraOralExamination: {
    archForm: { maxillary: "", mandibular: "" },
    interArchSpace: "",
    ridgeParallelism: "",
    softPalate: "",
    mucosa: { health: "" },
    tongueSize: "",
    tonguePosition: "",
    muscularAttachment: "",
    saliva: { quantity: "", quality: "" },
  },
};

const TABS = [
  { id: "medical", label: "Medical" },
  { id: "dentalHistory", label: "Dental History" },
  { id: "extraOral", label: "Extra-Oral Examination" },
  { id: "intraOral", label: "Intra-Oral Examination" },
];

const ARCH_FORMS = ["Square", "Tapering", "Ovoid"];

export default function RemovableProsthodonticsSheet({ initialData, onSave, record, saving }) {
  const [form, setForm] = useState(() =>
    initialData && Object.keys(initialData).length ? { ...DEFAULTS, ...initialData } : DEFAULTS
  );
  const [tab, setTab] = useState("medical");

  const setField = (section, field, value) =>
    setForm((prev) => ({ ...prev, [section]: { ...prev[section], [field]: value } }));

  const setNested = (section, group, field, value) =>
    setForm((prev) => ({
      ...prev,
      [section]: { ...prev[section], [group]: { ...prev[section][group], [field]: value } },
    }));

  const submit = () => {
    const { archForm } = form.intraOralExamination;
    const diagnosis = `Removable Prosthodontics: ${archForm.maxillary || "unspecified"} maxillary arch, ${
      archForm.mandibular || "unspecified"
    } mandibular arch`;

    const plannedFor = (value) =>
      value === "CD" ? "Complete Denture" : value === "RPD" ? "Removable Partial Denture" : "Not specified";

    const treatmentPlan = `Removable Prosthodontics treatment plan: ${plannedFor(
      form.dentalHistory.previousDenture.maxillary
    )} for maxilla, ${plannedFor(form.dentalHistory.previousDenture.mandibular)} for mandible`;

    onSave?.(form, diagnosis, treatmentPlan, form.dentalHistory.experienceOfPreviousDenture || "");
  };

  return (
    <div className="flex flex-col">
      <SheetTabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === "medical" ? <MedicalPanel record={record} compact /> : null}

      {tab === "dentalHistory" ? (
        <>
          <SheetSection title="History of dental extraction" subtitle="Why the teeth were lost">
            <div className="grid gap-x-8 md:grid-cols-2">
              {[
                { key: "pulpal", label: "Pulpal" },
                { key: "perio", label: "Perio" },
                { key: "trauma", label: "Trauma" },
                { key: "congenital", label: "Congenital" },
              ].map((entry) => (
                <YesNoRow
                  key={entry.key}
                  label={entry.label}
                  value={form.dentalHistory.historyOfDentalExtraction[entry.key]}
                  onChange={(value) =>
                    setNested("dentalHistory", "historyOfDentalExtraction", entry.key, value)
                  }
                />
              ))}
            </div>
          </SheetSection>

          <SheetSection
            title="Duration of edentulism"
            hint="How long the ridge has been resorbing decides how much support is left."
          >
            <div className="grid gap-x-8 md:grid-cols-2">
              <TextRow
                label="Maxilla"
                value={form.dentalHistory.durationOfEdentulism.maxilla}
                onChange={(value) =>
                  setNested("dentalHistory", "durationOfEdentulism", "maxilla", value)
                }
              />
              <TextRow
                label="Mandible"
                value={form.dentalHistory.durationOfEdentulism.mandible}
                onChange={(value) =>
                  setNested("dentalHistory", "durationOfEdentulism", "mandible", value)
                }
              />
            </div>
          </SheetSection>

          <SheetSection title="Previous denture">
            <OptionRow
              label="Maxillary"
              options={["CD", "RPD"]}
              columns="sm:grid-cols-2"
              value={form.dentalHistory.previousDenture.maxillary}
              onChange={(value) => setNested("dentalHistory", "previousDenture", "maxillary", value)}
            />
            <OptionRow
              label="Mandibular"
              options={["CD", "RPD"]}
              columns="sm:grid-cols-2"
              value={form.dentalHistory.previousDenture.mandibular}
              onChange={(value) => setNested("dentalHistory", "previousDenture", "mandibular", value)}
            />
            <TextRow
              label="Experience of previous denture"
              value={form.dentalHistory.experienceOfPreviousDenture}
              onChange={(value) => setField("dentalHistory", "experienceOfPreviousDenture", value)}
              placeholder="What the patient liked, and what they did not"
            />
          </SheetSection>
        </>
      ) : null}

      {tab === "extraOral" ? (
        <SheetSection title="Extra-oral examination">
          <OptionRow
            label="Facial form"
            options={ARCH_FORMS}
            value={form.extraOralExamination.facialForm}
            onChange={(value) => setField("extraOralExamination", "facialForm", value)}
          />
          <OptionRow
            label="Muscle tone"
            options={["Normal", "Flaccid", "Tense"]}
            value={form.extraOralExamination.muscleTone}
            onChange={(value) => setField("extraOralExamination", "muscleTone", value)}
          />
          <OptionRow
            label="Lips"
            options={["Normal", "Long", "Short"]}
            value={form.extraOralExamination.lips}
            onChange={(value) => setField("extraOralExamination", "lips", value)}
          />
          <OptionRow
            label="Temporomandibular joint"
            options={["Normal", "Clicking", "Tenderness"]}
            value={form.extraOralExamination.tmj}
            onChange={(value) => setField("extraOralExamination", "tmj", value)}
          />
        </SheetSection>
      ) : null}

      {tab === "intraOral" ? (
        <>
          <SheetSection title="Arch form">
            <div className="grid gap-x-8 md:grid-cols-2">
              <OptionRow
                label="Maxillary"
                options={ARCH_FORMS}
                value={form.intraOralExamination.archForm.maxillary}
                onChange={(value) => setNested("intraOralExamination", "archForm", "maxillary", value)}
              />
              <OptionRow
                label="Mandibular"
                options={ARCH_FORMS}
                value={form.intraOralExamination.archForm.mandibular}
                onChange={(value) => setNested("intraOralExamination", "archForm", "mandibular", value)}
              />
            </div>
          </SheetSection>

          <SheetSection title="Ridge and palate">
            <OptionRow
              label="Inter arch space"
              options={["Enough", "Limited"]}
              columns="sm:grid-cols-2"
              value={form.intraOralExamination.interArchSpace}
              onChange={(value) => setField("intraOralExamination", "interArchSpace", value)}
            />
            <OptionRow
              label="Ridge parallelism"
              options={["Parallel", "Irregular"]}
              columns="sm:grid-cols-2"
              value={form.intraOralExamination.ridgeParallelism}
              onChange={(value) => setField("intraOralExamination", "ridgeParallelism", value)}
            />
            <OptionRow
              label="Soft palate"
              options={["Class I", "Class II", "Class III"]}
              value={form.intraOralExamination.softPalate}
              onChange={(value) => setField("intraOralExamination", "softPalate", value)}
            />
          </SheetSection>

          <SheetSection title="Mucosa, tongue and saliva">
            <OptionRow
              label="Mucosal health"
              options={["Healthy", "Inflamed", "Hyperplastic"]}
              value={form.intraOralExamination.mucosa.health}
              onChange={(value) => setNested("intraOralExamination", "mucosa", "health", value)}
            />
            <OptionRow
              label="Tongue size"
              options={["Normal", "Enlarged"]}
              columns="sm:grid-cols-2"
              value={form.intraOralExamination.tongueSize}
              onChange={(value) => setField("intraOralExamination", "tongueSize", value)}
            />
            <OptionRow
              label="Tongue position"
              options={["Normal", "Retruded"]}
              columns="sm:grid-cols-2"
              value={form.intraOralExamination.tonguePosition}
              onChange={(value) => setField("intraOralExamination", "tonguePosition", value)}
            />
            <OptionRow
              label="Muscular attachment"
              columns="sm:grid-cols-2"
              options={[
                "Normal attached mucosa",
                "Loss of anterior attached mucosa",
                "Loss of posterior attached mucosa",
                "Loss of anterior and posterior attached mucosa",
              ]}
              value={form.intraOralExamination.muscularAttachment}
              onChange={(value) => setField("intraOralExamination", "muscularAttachment", value)}
            />
            <div className="grid gap-x-8 md:grid-cols-2">
              <OptionRow
                label="Saliva — quantity"
                options={["Adequate", "Inadequate"]}
                columns="sm:grid-cols-2"
                value={form.intraOralExamination.saliva.quantity}
                onChange={(value) => setNested("intraOralExamination", "saliva", "quantity", value)}
              />
              <OptionRow
                label="Saliva — quality"
                options={["Serous", "Mucous"]}
                columns="sm:grid-cols-2"
                value={form.intraOralExamination.saliva.quality}
                onChange={(value) => setNested("intraOralExamination", "saliva", "quality", value)}
              />
            </div>
          </SheetSection>
        </>
      ) : null}

      <SheetActions onSave={submit} saving={saving} />
    </div>
  );
}
