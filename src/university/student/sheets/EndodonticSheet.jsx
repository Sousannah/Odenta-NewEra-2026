import { useState } from "react";
import { MedicalPanel } from "../MedicalPanel";
import {
  GridTable,
  OptionRow,
  SheetActions,
  SheetSection,
  SheetTabs,
  TextRow,
  YesNoRow,
} from "./SheetControls";

/**
 * Endodontics.
 *
 * Laid out as SOAP — subjective, objective, radiographic, assessment, plan —
 * because that is the order the diagnosis is actually reached in: what the
 * patient reports, what the tests show, what the film shows, and only then a
 * pulpal and periapical diagnosis.
 */

const emptyPerioRow = () => ({
  toothNumber: "",
  cold: "",
  heat: "",
  percussion: "",
  palpation: "",
  mobility: "",
  biteStick: "",
  mb: "",
  b: "",
  db: "",
  dl: "",
  l: "",
  ml: "",
  bleed: "",
  recession: "",
  furcation: "",
});

const DEFAULTS = {
  subjective: {
    historyOfPresentIllness: {
      natureOfPain: "",
      onset: "",
      location: "",
      duration: "",
      initiatedBy: "",
      relievedBy: "",
    },
  },
  objective: {
    extraoral: { facial: "", swelling: "", lymphNodesSwollen: "" },
    intraoral: {
      swelling: "",
      sinusTract: "",
      clinicalCrown: {
        restoration: "",
        caries: "",
        fracture: "",
        exposure: "",
        discoloration: "",
      },
    },
    periodontalExamination: [emptyPerioRow()],
  },
  radiographicExamination: {
    crown: "",
    pulpChamber: "",
    roots: "",
    rootCanal: "",
    laminaDura: "",
    alveolarBone: "",
    sinusTracts: "",
  },
  assessment: { pulpal: "", periapical: "", etiology: "", prognosis: "" },
  treatmentPlan: { endodontic: "", periodontal: "", restorative: "" },
};

const TABS = [
  { id: "medical", label: "Medical" },
  { id: "subjective", label: "Subjective" },
  { id: "objective", label: "Objective" },
  { id: "radiographic", label: "Radiographic" },
  { id: "assessment", label: "Assessment" },
  { id: "plan", label: "Treatment Plan" },
];

const PERIO_COLUMNS = [
  { key: "toothNumber", header: "Tooth #", width: 88 },
  { key: "cold", header: "Cold" },
  { key: "heat", header: "Heat" },
  { key: "percussion", header: "Perc." },
  { key: "palpation", header: "Palp." },
  { key: "mobility", header: "Mob." },
  { key: "biteStick", header: "Bite" },
  { key: "mb", header: "MB" },
  { key: "b", header: "B" },
  { key: "db", header: "DB" },
  { key: "dl", header: "DL" },
  { key: "l", header: "L" },
  { key: "ml", header: "ML" },
  { key: "bleed", header: "Bleed" },
  { key: "recession", header: "Rec." },
  { key: "furcation", header: "Furc." },
];

const CLINICAL_CROWN = [
  { key: "restoration", label: "Clinical crown — restoration" },
  { key: "caries", label: "Clinical crown — caries" },
  { key: "fracture", label: "Clinical crown — fracture" },
  { key: "exposure", label: "Clinical crown — exposure" },
  { key: "discoloration", label: "Clinical crown — discoloration" },
];

const ABBREVIATIONS =
  "Normal: N · No response: 0 · Mild: + · Moderate: ++ · Severe: +++ · Lingered: L · Delayed: D";
const RADIOGRAPHIC_KEY = "WNL: within normal limits · RCT: root canal treatment · IAC: inferior alveolar canal";

export default function EndodonticSheet({ initialData, onSave, record, saving }) {
  const [form, setForm] = useState(() =>
    initialData && Object.keys(initialData).length ? { ...DEFAULTS, ...initialData } : DEFAULTS
  );
  const [tab, setTab] = useState("medical");

  const setDirect = (section, field, value) =>
    setForm((prev) => ({ ...prev, [section]: { ...prev[section], [field]: value } }));

  const setNested = (section, group, field, value) =>
    setForm((prev) => ({
      ...prev,
      [section]: { ...prev[section], [group]: { ...prev[section][group], [field]: value } },
    }));

  const setDeep = (section, group, subgroup, field, value) =>
    setForm((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [group]: {
          ...prev[section][group],
          [subgroup]: { ...prev[section][group][subgroup], [field]: value },
        },
      },
    }));

  const setPerioCell = (rowIndex, field, value) =>
    setForm((prev) => {
      const rows = [...prev.objective.periodontalExamination];
      rows[rowIndex] = { ...rows[rowIndex], [field]: value };
      return { ...prev, objective: { ...prev.objective, periodontalExamination: rows } };
    });

  const addPerioRow = () =>
    setForm((prev) => ({
      ...prev,
      objective: {
        ...prev.objective,
        periodontalExamination: [...prev.objective.periodontalExamination, emptyPerioRow()],
      },
    }));

  const removePerioRow = (rowIndex) =>
    setForm((prev) => ({
      ...prev,
      objective: {
        ...prev.objective,
        periodontalExamination: prev.objective.periodontalExamination.filter(
          (_, index) => index !== rowIndex
        ),
      },
    }));

  const submit = () => {
    const diagnosis = `Endodontic diagnosis: ${form.assessment.pulpal || "Not specified"} / ${
      form.assessment.periapical || "Not specified"
    }`;
    const treatmentPlan = `Endodontic treatment plan: ${form.treatmentPlan.endodontic || "Not specified"}`;
    onSave?.(form, diagnosis, treatmentPlan, "");
  };

  return (
    <div className="flex flex-col">
      <SheetTabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === "medical" ? <MedicalPanel record={record} compact /> : null}

      {tab === "subjective" ? (
        <SheetSection
          title="History of present illness"
          subtitle="What the patient reports, in their own terms"
        >
          <OptionRow
            label="Nature of pain"
            options={["None", "Mild", "Moderate", "Severe"]}
            value={form.subjective.historyOfPresentIllness.natureOfPain}
            onChange={(value) =>
              setNested("subjective", "historyOfPresentIllness", "natureOfPain", value)
            }
          />
          <OptionRow
            label="Onset"
            options={["Dull", "Sharp", "Throbbing", "Constant"]}
            value={form.subjective.historyOfPresentIllness.onset}
            onChange={(value) => setNested("subjective", "historyOfPresentIllness", "onset", value)}
          />
          <OptionRow
            label="Location"
            options={["Localized", "Diffuse", "Referred", "Radiating to:"]}
            value={form.subjective.historyOfPresentIllness.location}
            onChange={(value) => setNested("subjective", "historyOfPresentIllness", "location", value)}
          />
          <OptionRow
            label="Duration"
            options={["Seconds", "Minutes", "Hours", "Constant"]}
            value={form.subjective.historyOfPresentIllness.duration}
            onChange={(value) => setNested("subjective", "historyOfPresentIllness", "duration", value)}
          />
          <OptionRow
            label="Initiated by"
            options={["Cold", "Heat", "Sweets", "Spontaneous", "Palpation", "Mastication", "Supination"]}
            value={form.subjective.historyOfPresentIllness.initiatedBy}
            onChange={(value) =>
              setNested("subjective", "historyOfPresentIllness", "initiatedBy", value)
            }
          />
          <OptionRow
            label="Relieved by"
            options={["Cold", "Heat", "OTC-Meds", "Narc-Meds"]}
            value={form.subjective.historyOfPresentIllness.relievedBy}
            onChange={(value) =>
              setNested("subjective", "historyOfPresentIllness", "relievedBy", value)
            }
          />
        </SheetSection>
      ) : null}

      {tab === "objective" ? (
        <>
          <SheetSection title="Extraoral">
            <YesNoRow
              label="Facial"
              value={form.objective.extraoral.facial}
              onChange={(value) => setNested("objective", "extraoral", "facial", value)}
            />
            <YesNoRow
              label="Swelling"
              value={form.objective.extraoral.swelling}
              onChange={(value) => setNested("objective", "extraoral", "swelling", value)}
            />
            <YesNoRow
              label="Lymph nodes swollen"
              value={form.objective.extraoral.lymphNodesSwollen}
              onChange={(value) => setNested("objective", "extraoral", "lymphNodesSwollen", value)}
            />
          </SheetSection>

          <SheetSection title="Intraoral">
            <OptionRow
              label="Swelling"
              options={["Yes", "No", "Mild", "Moderate", "Severe", "Location:"]}
              value={form.objective.intraoral.swelling}
              onChange={(value) => setNested("objective", "intraoral", "swelling", value)}
            />
            <OptionRow
              label="Sinus tract"
              options={["Yes", "No", "Closed"]}
              value={form.objective.intraoral.sinusTract}
              onChange={(value) => setNested("objective", "intraoral", "sinusTract", value)}
            />
            {CLINICAL_CROWN.map((entry) => (
              <YesNoRow
                key={entry.key}
                label={entry.label}
                value={form.objective.intraoral.clinicalCrown[entry.key]}
                onChange={(value) =>
                  setDeep("objective", "intraoral", "clinicalCrown", entry.key, value)
                }
              />
            ))}
          </SheetSection>

          <SheetSection title="Periodontal examination" hint={ABBREVIATIONS}>
            <GridTable
              columns={PERIO_COLUMNS}
              rows={form.objective.periodontalExamination}
              onChange={setPerioCell}
              onAddRow={addPerioRow}
              onRemoveRow={
                form.objective.periodontalExamination.length > 1 ? removePerioRow : undefined
              }
              addLabel="Add another tooth"
            />
          </SheetSection>
        </>
      ) : null}

      {tab === "radiographic" ? (
        <SheetSection title="Radiographic examination" hint={RADIOGRAPHIC_KEY}>
          <OptionRow
            label="Crown"
            options={["WNL", "Caries", "Restoration", "Crown", "Dens in dente"]}
            value={form.radiographicExamination.crown}
            onChange={(value) => setDirect("radiographicExamination", "crown", value)}
          />
          <OptionRow
            label="Pulp chamber"
            options={["WNL", "Pulp stone", "Exposure", "Resorption", "Perforation"]}
            value={form.radiographicExamination.pulpChamber}
            onChange={(value) => setDirect("radiographicExamination", "pulpChamber", value)}
          />
          <OptionRow
            label="Roots"
            options={[
              "WNL",
              "Curvature",
              "Dilaceration",
              "Resorption",
              "Perforation",
              "Fracture",
              "Open apex",
              "Sinus / IAC",
            ]}
            value={form.radiographicExamination.roots}
            onChange={(value) => setDirect("radiographicExamination", "roots", value)}
          />
          <OptionRow
            label="Root canal"
            options={[
              "WNL",
              "Calcification",
              "Bifurcated",
              "Resorption",
              "Prior RCT",
              "Perforation",
              "Furcation",
            ]}
            value={form.radiographicExamination.rootCanal}
            onChange={(value) => setDirect("radiographicExamination", "rootCanal", value)}
          />
          <OptionRow
            label="Lamina dura"
            options={["WNL", "Obscure", "Broken", "Widened"]}
            value={form.radiographicExamination.laminaDura}
            onChange={(value) => setDirect("radiographicExamination", "laminaDura", value)}
          />
          <OptionRow
            label="Alveolar bone"
            options={[
              "WNL",
              "Apical radiolucency",
              "Lateral radiolucency",
              "Ap/Lat opacity",
              "Crestal bone loss",
            ]}
            value={form.radiographicExamination.alveolarBone}
            onChange={(value) => setDirect("radiographicExamination", "alveolarBone", value)}
          />
          <TextRow
            label="Sinus tracts"
            value={form.radiographicExamination.sinusTracts}
            onChange={(value) => setDirect("radiographicExamination", "sinusTracts", value)}
          />
        </SheetSection>
      ) : null}

      {tab === "assessment" ? (
        <SheetSection title="Assessment" hint={RADIOGRAPHIC_KEY}>
          <OptionRow
            label="Pulpal"
            columns="sm:grid-cols-2"
            options={[
              "WNL",
              "Reversible Pulpitis",
              "Symptomatic Irrev pulpitis",
              "Asymptomatic Irrev pulpitis",
              "Necrosis",
              "Prior RCT / Non healing",
              "Previous initiated",
            ]}
            value={form.assessment.pulpal}
            onChange={(value) => setDirect("assessment", "pulpal", value)}
          />
          <OptionRow
            label="Periapical"
            options={["WNL", "APP", "CPP", "APA", "CPA", "Cond Osteitis"]}
            value={form.assessment.periapical}
            onChange={(value) => setDirect("assessment", "periapical", value)}
          />
          <OptionRow
            label="Etiology"
            options={[
              "Caries",
              "Restoration",
              "Prior RCT",
              "Iatrogenic",
              "Coronal leakage",
              "Trauma",
              "Perio",
              "Others",
            ]}
            value={form.assessment.etiology}
            onChange={(value) => setDirect("assessment", "etiology", value)}
          />
          <OptionRow
            label="Prognosis"
            options={["Good", "Fair", "Poor"]}
            value={form.assessment.prognosis}
            onChange={(value) => setDirect("assessment", "prognosis", value)}
          />
        </SheetSection>
      ) : null}

      {tab === "plan" ? (
        <SheetSection title="Treatment plan" hint={RADIOGRAPHIC_KEY}>
          <OptionRow
            label="Endodontic"
            columns="sm:grid-cols-2"
            options={[
              "RCT",
              "Retreatment",
              "Incision / Drainage",
              "Apexification / VPT",
              "Apicectomy",
              "Perforation / Resorption repair",
            ]}
            value={form.treatmentPlan.endodontic}
            onChange={(value) => setDirect("treatmentPlan", "endodontic", value)}
          />
          <OptionRow
            label="Periodontal"
            options={[
              "Scaling",
              "Curettage",
              "Crown lengthening",
              "Root amputation",
              "Hemisection",
              "Extraction",
            ]}
            value={form.treatmentPlan.periodontal}
            onChange={(value) => setDirect("treatmentPlan", "periodontal", value)}
          />
          <OptionRow
            label="Restorative"
            options={["Temporary", "Post / core", "Composite", "Onlay / Crown", "Bleaching"]}
            value={form.treatmentPlan.restorative}
            onChange={(value) => setDirect("treatmentPlan", "restorative", value)}
          />
        </SheetSection>
      ) : null}

      <SheetActions onSave={submit} saving={saving} />
    </div>
  );
}
