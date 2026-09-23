import { useState } from "react";
import { MedicalPanel } from "../MedicalPanel";
import { OptionRow, SheetActions, SheetSection, SheetTabs, TextRow, YesNoRow } from "./SheetControls";

/**
 * Fixed prosthodontics.
 *
 * Two sheets in one, because a crown and a bridge are assessed differently: a
 * crown is one abutment, a bridge is two abutments plus the span between them.
 * Only the active tab's data is saved — a case is one or the other, never both.
 */

const emptyClinical = () => ({
  periodontalPockets: "",
  mobility: "",
  gingivalRecession: "",
  caries: "",
  restorations: "",
  restorationType: "",
  dentinPulpComplex: "",
});

const emptyRadiographic = () => ({
  periapicalLesions: "",
  rctQuality: "",
  alveolarBoneLoss: "",
  crownRootRatio: "",
});

const emptyPrep = () => ({
  restoration: "",
  rootCanalTreatment: "",
  periodontalTherapy: "",
  crownLengthening: "",
  orthoTreatment: "",
});

const DEFAULTS = {
  crown: {
    abutmentTooth: "",
    periodontalExamination: { oralHygieneCondition: "", gingivitis: "", periodontitis: "" },
    occlusion: { angleClassification: "", workingSideContactsRight: "", workingSideContactsLeft: "" },
    clinicalExamination: emptyClinical(),
    radiographicExamination: emptyRadiographic(),
    mountedDiagnosticCasts: {
      lengthOfTooth: "",
      positionOfTooth: "",
      rotationOfTooth: "",
      mdTilting: "",
      supraEruptionOfOpposing: "",
    },
    treatmentPlan: {
      preProstheticPreparation: emptyPrep(),
      restorationDesign: { material: "", restoration: "", occlusalContact: "", ceramicShade: "" },
    },
  },
  fixedDentalProsthesis: {
    periodontalExamination: { oralHygieneCondition: "", gingivitis: "", periodontitis: "" },
    occlusion: { angleClassification: "", workingSideContactsRight: "", workingSideContactsLeft: "" },
    abutmentA: { toothNumber: "", clinicalExamination: emptyClinical(), radiographicExamination: emptyRadiographic() },
    abutmentB: { toothNumber: "", clinicalExamination: emptyClinical(), radiographicExamination: emptyRadiographic() },
    mountedDiagnosticCasts: {
      lengthOfAbutment: "",
      positionOfAbutment: "",
      rotationOfAbutment: "",
      abutmentMdTilting: "",
      supraEruptionOfOpposing: "",
      spanLength: "",
      edentulousRidge: "",
    },
    treatmentPlan: {
      preProstheticPreparationAbutmentA: emptyPrep(),
      preProstheticPreparationAbutmentB: emptyPrep(),
      restorationDesign: {
        material: "",
        retainer: "",
        ponticDesign: "",
        ponticTissueContact: "",
        occlusalContact: "",
        connector: "",
        ceramicShadeAbutmentA: "",
        ceramicShadeAbutmentB: "",
      },
    },
  },
};

const TABS = [
  { id: "medical", label: "Medical" },
  { id: "crown", label: "Crown" },
  { id: "fdp", label: "Fixed Dental Prosthesis" },
];

const HYGIENE = ["Good", "Fair", "Poor"];
const EXTENT = ["None", "Localized", "Generalized"];
const ANGLE = ["Class I", "Class II", "Class III"];
const GUIDANCE = ["Canine Guidance", "Group Function"];
const POCKETS = ["None", "1-2 mm", "3-4 mm", ">4 mm"];
const MOBILITY = ["Grade 0", "Grade 1", "Grade 2", "Grade 3"];
const RECESSION = ["None", "1-2 mm", ">2 mm"];
const CARIES = ["No caries", "Simple", "Extensive"];
const RESTORATIONS = ["No restoration", "Simple", "Extensive"];
const RESTORATION_TYPE = ["Amalgam", "Composite", "Custom Post and core", "Prefabricated post and core"];
const PULP = ["Normal - Vital", "Pulpitis", "Non Vital", "RCT"];
const RCT_QUALITY = ["Good", "Fair", "Poor"];
const BONE_LOSS = ["None", "1-2 mm", "2-4 mm", ">4 mm"];
const CROWN_ROOT = ["2:3", "1:2", "1:1", ">1:1"];
const ACCEPTABILITY = ["Acceptable", "Not Acceptable"];
const TILTING = ["No Tilting", "Slightly Tilted", "Over Tilted"];
const SUPRA_ERUPTION = ["None", "Mild (need Enameloplasty)", "Needs Occlusal restoration"];
const NEEDED = ["Not Needed", "Needed"];
const RCT_PLAN = ["Not Needed", "RCT Needed", "Treated", "Treated - need retreatment"];
const MATERIALS = ["Full Metal", "PFM", "Zirconia", "All Ceramic"];
const OCCLUSAL_CONTACT = ["Metal", "Ceramic", "Combination"];

/** Periodontal condition and occlusion are asked identically on both tabs. */
function SharedAssessment({ section, form, onChange }) {
  const perio = form[section].periodontalExamination;
  const occlusion = form[section].occlusion;
  return (
    <>
      <SheetSection title="1) Periodontal examination">
        <OptionRow
          label="Oral hygiene condition"
          options={HYGIENE}
          value={perio.oralHygieneCondition}
          onChange={(value) => onChange(section, "periodontalExamination", "oralHygieneCondition", value)}
        />
        <OptionRow
          label="Gingivitis"
          options={EXTENT}
          value={perio.gingivitis}
          onChange={(value) => onChange(section, "periodontalExamination", "gingivitis", value)}
        />
        <OptionRow
          label="Periodontitis"
          options={EXTENT}
          value={perio.periodontitis}
          onChange={(value) => onChange(section, "periodontalExamination", "periodontitis", value)}
        />
      </SheetSection>

      <SheetSection title="2) Occlusion">
        <OptionRow
          label="Angle classification of maximum intercuspation"
          options={ANGLE}
          value={occlusion.angleClassification}
          onChange={(value) => onChange(section, "occlusion", "angleClassification", value)}
        />
        <OptionRow
          label="Working side contacts (right)"
          options={GUIDANCE}
          columns="sm:grid-cols-2"
          value={occlusion.workingSideContactsRight}
          onChange={(value) => onChange(section, "occlusion", "workingSideContactsRight", value)}
        />
        <OptionRow
          label="Working side contacts (left)"
          options={GUIDANCE}
          columns="sm:grid-cols-2"
          value={occlusion.workingSideContactsLeft}
          onChange={(value) => onChange(section, "occlusion", "workingSideContactsLeft", value)}
        />
      </SheetSection>
    </>
  );
}

/** The seven clinical questions asked of every abutment. */
function ClinicalExam({ data, onChange }) {
  return (
    <>
      <OptionRow label="Periodontal pockets" options={POCKETS} value={data.periodontalPockets} onChange={(value) => onChange("periodontalPockets", value)} />
      <OptionRow label="Mobility" options={MOBILITY} value={data.mobility} onChange={(value) => onChange("mobility", value)} />
      <OptionRow label="Gingival recession" options={RECESSION} value={data.gingivalRecession} onChange={(value) => onChange("gingivalRecession", value)} />
      <OptionRow label="Caries" options={CARIES} value={data.caries} onChange={(value) => onChange("caries", value)} />
      <OptionRow label="Restorations" options={RESTORATIONS} value={data.restorations} onChange={(value) => onChange("restorations", value)} />
      <OptionRow label="Restoration type" options={RESTORATION_TYPE} columns="sm:grid-cols-2" value={data.restorationType} onChange={(value) => onChange("restorationType", value)} />
      <OptionRow label="Dentin pulp complex" options={PULP} value={data.dentinPulpComplex} onChange={(value) => onChange("dentinPulpComplex", value)} />
    </>
  );
}

function RadiographicExam({ data, onChange }) {
  return (
    <>
      <YesNoRow label="Periapical lesions" value={data.periapicalLesions} onChange={(value) => onChange("periapicalLesions", value)} />
      <OptionRow label="RCT quality (if present)" options={RCT_QUALITY} value={data.rctQuality} onChange={(value) => onChange("rctQuality", value)} />
      <OptionRow label="Alveolar bone loss" options={BONE_LOSS} value={data.alveolarBoneLoss} onChange={(value) => onChange("alveolarBoneLoss", value)} />
      <OptionRow label="Crown : root ratio" options={CROWN_ROOT} value={data.crownRootRatio} onChange={(value) => onChange("crownRootRatio", value)} />
    </>
  );
}

function PrePrepPlan({ data, onChange }) {
  return (
    <>
      <OptionRow label="Restoration" options={NEEDED} columns="sm:grid-cols-2" value={data.restoration} onChange={(value) => onChange("restoration", value)} />
      <OptionRow label="Root canal treatment" options={RCT_PLAN} columns="sm:grid-cols-2" value={data.rootCanalTreatment} onChange={(value) => onChange("rootCanalTreatment", value)} />
      <OptionRow label="Periodontal therapy" options={NEEDED} columns="sm:grid-cols-2" value={data.periodontalTherapy} onChange={(value) => onChange("periodontalTherapy", value)} />
      <OptionRow label="Crown lengthening" options={NEEDED} columns="sm:grid-cols-2" value={data.crownLengthening} onChange={(value) => onChange("crownLengthening", value)} />
      <OptionRow label="Orthodontic treatment" options={NEEDED} columns="sm:grid-cols-2" value={data.orthoTreatment} onChange={(value) => onChange("orthoTreatment", value)} />
    </>
  );
}

export default function FixedProsthodonticsSheet({ initialData, onSave, record, saving }) {
  const [form, setForm] = useState(() =>
    initialData && Object.keys(initialData).length ? { ...DEFAULTS, ...initialData } : DEFAULTS
  );
  const [tab, setTab] = useState("medical");

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

  const submit = () => {
    const isCrown = tab !== "fdp";
    const data = isCrown ? form.crown : form.fixedDentalProsthesis;

    const diagnosis = isCrown
      ? `Crown for tooth ${form.crown.abutmentTooth || "unspecified"}`
      : `Fixed dental prosthesis for teeth ${
          form.fixedDentalProsthesis.abutmentA.toothNumber || "?"
        } to ${form.fixedDentalProsthesis.abutmentB.toothNumber || "?"}`;

    const design = data.treatmentPlan.restorationDesign;
    const treatmentPlan = isCrown
      ? `${design.material || "Material TBC"} ${design.restoration || "restoration"}`
      : `${design.material || "Material TBC"} bridge with ${
          design.ponticDesign || "unspecified"
        } pontic design`;

    onSave?.(data, diagnosis, treatmentPlan, "");
  };

  return (
    <div className="flex flex-col">
      <SheetTabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === "medical" ? <MedicalPanel record={record} compact /> : null}

      {tab === "crown" ? (
        <>
          <SheetSection title="Abutment tooth">
            <TextRow
              label="Abutment tooth"
              placeholder="FDI number, e.g. 26"
              value={form.crown.abutmentTooth}
              onChange={(value) =>
                setForm((prev) => ({ ...prev, crown: { ...prev.crown, abutmentTooth: value } }))
              }
            />
          </SheetSection>

          <SharedAssessment section="crown" form={form} onChange={setNested} />

          <SheetSection title="3) Clinical examination">
            <ClinicalExam
              data={form.crown.clinicalExamination}
              onChange={(field, value) => setNested("crown", "clinicalExamination", field, value)}
            />
          </SheetSection>

          <SheetSection title="4) Radiographic examination">
            <RadiographicExam
              data={form.crown.radiographicExamination}
              onChange={(field, value) => setNested("crown", "radiographicExamination", field, value)}
            />
          </SheetSection>

          <SheetSection title="5) Mounted diagnostic casts">
            <OptionRow label="Length of tooth" options={["Acceptable", "Short Abutment"]} columns="sm:grid-cols-2" value={form.crown.mountedDiagnosticCasts.lengthOfTooth} onChange={(value) => setNested("crown", "mountedDiagnosticCasts", "lengthOfTooth", value)} />
            <OptionRow label="Position of tooth" options={ACCEPTABILITY} columns="sm:grid-cols-2" value={form.crown.mountedDiagnosticCasts.positionOfTooth} onChange={(value) => setNested("crown", "mountedDiagnosticCasts", "positionOfTooth", value)} />
            <OptionRow label="Rotation of tooth" options={ACCEPTABILITY} columns="sm:grid-cols-2" value={form.crown.mountedDiagnosticCasts.rotationOfTooth} onChange={(value) => setNested("crown", "mountedDiagnosticCasts", "rotationOfTooth", value)} />
            <OptionRow label="MD tilting" options={TILTING} value={form.crown.mountedDiagnosticCasts.mdTilting} onChange={(value) => setNested("crown", "mountedDiagnosticCasts", "mdTilting", value)} />
            <OptionRow label="Supra-eruption of opposing" options={SUPRA_ERUPTION} columns="sm:grid-cols-2" value={form.crown.mountedDiagnosticCasts.supraEruptionOfOpposing} onChange={(value) => setNested("crown", "mountedDiagnosticCasts", "supraEruptionOfOpposing", value)} />
          </SheetSection>

          <SheetSection title="Treatment plan — pre-prosthetic preparation">
            <PrePrepPlan
              data={form.crown.treatmentPlan.preProstheticPreparation}
              onChange={(field, value) =>
                setDeep("crown", "treatmentPlan", "preProstheticPreparation", field, value)
              }
            />
          </SheetSection>

          <SheetSection title="Treatment plan — restoration design">
            <OptionRow label="Material" options={MATERIALS} value={form.crown.treatmentPlan.restorationDesign.material} onChange={(value) => setDeep("crown", "treatmentPlan", "restorationDesign", "material", value)} />
            <OptionRow label="Restoration" options={["Crown", "Onlay", "Inlay"]} value={form.crown.treatmentPlan.restorationDesign.restoration} onChange={(value) => setDeep("crown", "treatmentPlan", "restorationDesign", "restoration", value)} />
            <OptionRow label="Occlusal contact (PFM only)" options={OCCLUSAL_CONTACT} value={form.crown.treatmentPlan.restorationDesign.occlusalContact} onChange={(value) => setDeep("crown", "treatmentPlan", "restorationDesign", "occlusalContact", value)} />
            <TextRow label="Ceramic shade" placeholder="e.g. A2" value={form.crown.treatmentPlan.restorationDesign.ceramicShade} onChange={(value) => setDeep("crown", "treatmentPlan", "restorationDesign", "ceramicShade", value)} />
          </SheetSection>
        </>
      ) : null}

      {tab === "fdp" ? (
        <>
          <SharedAssessment section="fixedDentalProsthesis" form={form} onChange={setNested} />

          {["abutmentA", "abutmentB"].map((abutment, index) => (
            <SheetSection
              key={abutment}
              title={`${index + 3}) Abutment ${abutment.slice(-1)} — clinical examination`}
            >
              <TextRow
                label="Tooth number"
                placeholder="FDI number"
                value={form.fixedDentalProsthesis[abutment].toothNumber}
                onChange={(value) =>
                  setNested("fixedDentalProsthesis", abutment, "toothNumber", value)
                }
              />
              <ClinicalExam
                data={form.fixedDentalProsthesis[abutment].clinicalExamination}
                onChange={(field, value) =>
                  setDeep("fixedDentalProsthesis", abutment, "clinicalExamination", field, value)
                }
              />
              <div className="mt-2 border-t border-slate-100 pt-4">
                <h5 className="mb-3 text-[13px] font-bold text-ink">Radiographic examination</h5>
                <RadiographicExam
                  data={form.fixedDentalProsthesis[abutment].radiographicExamination}
                  onChange={(field, value) =>
                    setDeep("fixedDentalProsthesis", abutment, "radiographicExamination", field, value)
                  }
                />
              </div>
            </SheetSection>
          ))}

          <SheetSection title="5) Mounted diagnostic casts">
            <OptionRow label="Length of abutment" options={["Acceptable", "Short Abutment"]} columns="sm:grid-cols-2" value={form.fixedDentalProsthesis.mountedDiagnosticCasts.lengthOfAbutment} onChange={(value) => setNested("fixedDentalProsthesis", "mountedDiagnosticCasts", "lengthOfAbutment", value)} />
            <OptionRow label="Position of abutment" options={ACCEPTABILITY} columns="sm:grid-cols-2" value={form.fixedDentalProsthesis.mountedDiagnosticCasts.positionOfAbutment} onChange={(value) => setNested("fixedDentalProsthesis", "mountedDiagnosticCasts", "positionOfAbutment", value)} />
            <OptionRow label="Rotation of abutment" options={ACCEPTABILITY} columns="sm:grid-cols-2" value={form.fixedDentalProsthesis.mountedDiagnosticCasts.rotationOfAbutment} onChange={(value) => setNested("fixedDentalProsthesis", "mountedDiagnosticCasts", "rotationOfAbutment", value)} />
            <OptionRow label="Abutment MD tilting" options={TILTING} value={form.fixedDentalProsthesis.mountedDiagnosticCasts.abutmentMdTilting} onChange={(value) => setNested("fixedDentalProsthesis", "mountedDiagnosticCasts", "abutmentMdTilting", value)} />
            <OptionRow label="Supra-eruption of opposing" options={SUPRA_ERUPTION} columns="sm:grid-cols-2" value={form.fixedDentalProsthesis.mountedDiagnosticCasts.supraEruptionOfOpposing} onChange={(value) => setNested("fixedDentalProsthesis", "mountedDiagnosticCasts", "supraEruptionOfOpposing", value)} />
            <OptionRow label="Span length" options={["Sufficient", "Slightly Deficient", "Deficient"]} value={form.fixedDentalProsthesis.mountedDiagnosticCasts.spanLength} onChange={(value) => setNested("fixedDentalProsthesis", "mountedDiagnosticCasts", "spanLength", value)} />
            <OptionRow label="Edentulous ridge" options={["Acceptable", "Needs Corrective Surgery"]} columns="sm:grid-cols-2" value={form.fixedDentalProsthesis.mountedDiagnosticCasts.edentulousRidge} onChange={(value) => setNested("fixedDentalProsthesis", "mountedDiagnosticCasts", "edentulousRidge", value)} />
          </SheetSection>

          {["A", "B"].map((letter) => (
            <SheetSection
              key={letter}
              title={`Treatment plan — pre-prosthetic preparation, abutment ${letter}`}
            >
              <PrePrepPlan
                data={
                  form.fixedDentalProsthesis.treatmentPlan[`preProstheticPreparationAbutment${letter}`]
                }
                onChange={(field, value) =>
                  setDeep(
                    "fixedDentalProsthesis",
                    "treatmentPlan",
                    `preProstheticPreparationAbutment${letter}`,
                    field,
                    value
                  )
                }
              />
            </SheetSection>
          ))}

          <SheetSection title="Treatment plan — restoration design">
            <OptionRow label="Material" options={MATERIALS} value={form.fixedDentalProsthesis.treatmentPlan.restorationDesign.material} onChange={(value) => setDeep("fixedDentalProsthesis", "treatmentPlan", "restorationDesign", "material", value)} />
            <OptionRow label="Retainer" options={["Full Coverage", "Partial Coverage"]} columns="sm:grid-cols-2" value={form.fixedDentalProsthesis.treatmentPlan.restorationDesign.retainer} onChange={(value) => setDeep("fixedDentalProsthesis", "treatmentPlan", "restorationDesign", "retainer", value)} />
            <OptionRow label="Pontic design" options={["Mod. Ridge Lap", "Ovate", "Conical", "Hygienic"]} value={form.fixedDentalProsthesis.treatmentPlan.restorationDesign.ponticDesign} onChange={(value) => setDeep("fixedDentalProsthesis", "treatmentPlan", "restorationDesign", "ponticDesign", value)} />
            <OptionRow label="Pontic tissue contact (PFM only)" options={["Metal", "Ceramic"]} columns="sm:grid-cols-2" value={form.fixedDentalProsthesis.treatmentPlan.restorationDesign.ponticTissueContact} onChange={(value) => setDeep("fixedDentalProsthesis", "treatmentPlan", "restorationDesign", "ponticTissueContact", value)} />
            <OptionRow label="Occlusal contact (PFM only)" options={OCCLUSAL_CONTACT} value={form.fixedDentalProsthesis.treatmentPlan.restorationDesign.occlusalContact} onChange={(value) => setDeep("fixedDentalProsthesis", "treatmentPlan", "restorationDesign", "occlusalContact", value)} />
            <OptionRow label="Connector" options={["Rigid", "Non Rigid"]} columns="sm:grid-cols-2" value={form.fixedDentalProsthesis.treatmentPlan.restorationDesign.connector} onChange={(value) => setDeep("fixedDentalProsthesis", "treatmentPlan", "restorationDesign", "connector", value)} />
            <div className="grid gap-x-8 md:grid-cols-2">
              <TextRow label="Ceramic shade — abutment A" value={form.fixedDentalProsthesis.treatmentPlan.restorationDesign.ceramicShadeAbutmentA} onChange={(value) => setDeep("fixedDentalProsthesis", "treatmentPlan", "restorationDesign", "ceramicShadeAbutmentA", value)} />
              <TextRow label="Ceramic shade — abutment B" value={form.fixedDentalProsthesis.treatmentPlan.restorationDesign.ceramicShadeAbutmentB} onChange={(value) => setDeep("fixedDentalProsthesis", "treatmentPlan", "restorationDesign", "ceramicShadeAbutmentB", value)} />
            </div>
          </SheetSection>
        </>
      ) : null}

      <SheetActions onSave={submit} saving={saving} />
    </div>
  );
}
