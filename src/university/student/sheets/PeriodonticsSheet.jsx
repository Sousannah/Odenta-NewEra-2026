import { useState } from "react";
import { cn } from "@/lib/cn";
import { Checkbox, Input } from "@/components/ui/Field";
import { MedicalPanel } from "../MedicalPanel";
import { GridTable, NoteRow, SheetActions, SheetSection, SheetTabs, TextRow } from "./SheetControls";

/**
 * Periodontics.
 *
 * The longest sheet, because periodontal diagnosis is a survey rather than a
 * finding: 32 teeth × 6 sites of pocket depth and attachment level, a bleeding
 * index over the same sites, then staging and grading on top. The bleeding
 * index is drawn rather than typed — clicking quadrants of a tooth is far
 * faster than tabbing through 128 inputs, and it is how the paper chart works.
 */

const FDI = [
  "18", "17", "16", "15", "14", "13", "12", "11",
  "21", "22", "23", "24", "25", "26", "27", "28",
  "38", "37", "36", "35", "34", "33", "32", "31",
  "41", "42", "43", "44", "45", "46", "47", "48",
];

const UPPER = FDI.slice(0, 16);
const LOWER = FDI.slice(16);

const SITES = ["topLeft", "topRight", "bottomLeft", "bottomRight"];
const BLEEDING_CYCLE = { none: "pink", pink: "red", red: "none" };
const BLEEDING_FILL = { pink: "#FFC0CB", red: "#E4576B", none: "#FFFFFF" };

const GINGIVAL_CRITERIA = [
  "colour",
  "shapeContour",
  "texture",
  "size",
  "consistency",
  "exudates",
  "furcations",
  "teeth",
  "functionalRelations",
  "percussion",
];

const MUCOGINGIVAL_FIELDS = [
  "periodontalBiotype",
  "keratinizedGingiva",
  "vestibularDepth",
  "frenumAttachment",
  "gingivalExcess",
  "abnormalColor",
];

const RADIOGRAPHIC_FIELDS = [
  "bonyLossHorizontal",
  "bonyLossVertical",
  "furcationInvolvement",
  "laminaDuraCrestal",
  "laminaDuraOverall",
  "pdlSpace",
  "boneLossPercentage",
  "others",
];

const ETIOTROPIC_STEPS = [
  "limitedPlaqueControl",
  "supragingivalScaling",
  "correctionDefectiveRestorations",
  "obturationCaries",
  "subgingivalScaling",
  "comprehensivePlaqueControl",
  "coronoplasty",
  "minorOrthodontic",
  "tissueReevaluation",
];

const PHASES = ["surgicalPhase", "restorativePhase", "maintenancePhase", "consultation", "recallMaintenance"];

const RECESSION_COLUMNS = [
  { key: "affectedToothNumber", header: "Tooth", width: 88 },
  { key: "gingivalSite", header: "Gingival site" },
  { key: "toothSite", header: "Tooth site" },
  { key: "rt", header: "RT" },
  { key: "cairoEtal", header: "Cairo et al" },
  { key: "rec", header: "REC" },
  { key: "depth", header: "Depth" },
  { key: "gt", header: "GT" },
  { key: "ktw", header: "KTW" },
  { key: "cej", header: "CEJ" },
  { key: "step", header: "Step" },
];

const DISEASE_COLUMNS = [
  { key: "stage", header: "Stage" },
  { key: "grade", header: "Grade" },
  { key: "gradeModifiers", header: "Grade modifiers" },
  { key: "distribution", header: "Distribution" },
];

/** `Array(16).fill([])` shares one array; charting needs 16 distinct rows. */
const sixSiteRows = () => Array.from({ length: 16 }, () => ["", "", "", "", "", ""]);
const singleRows = () => Array.from({ length: 16 }, () => "");

const emptyView = () => ({
  M: singleRows(),
  F: singleRows(),
  CAL: sixSiteRows(),
  PD: sixSiteRows(),
});

const emptyRecession = () => ({
  affectedToothNumber: "",
  gingivalSite: "",
  toothSite: "",
  rt: "",
  cairoEtal: "",
  rec: "",
  depth: "",
  gt: "",
  ktw: "",
  cej: "",
  step: "",
});

const emptyDisease = () => ({ stage: "", grade: "", gradeModifiers: "", distribution: "" });

const DEFAULTS = {
  generalInformation: {
    pastDentalHistory: { history: "", numberOfExtractedTeeth: "" },
    familyHistory: "",
    habits: { smoking: "", toothBrushing: "", parafunctional: "" },
    extraOralExamination: "",
  },
  intraOralExamination: {
    periodontalFindings: {
      gingivalCriteria: Object.fromEntries(GINGIVAL_CRITERIA.map((key) => [key, ""])),
      gingivalBleedingIndex: {
        bleedingSites: Array.from({ length: 32 }, () => ({
          topLeft: "none",
          topRight: "none",
          bottomLeft: "none",
          bottomRight: "none",
        })),
        totalScore: 0,
      },
    },
  },
  mucogingivalDeformities: {
    ...Object.fromEntries(MUCOGINGIVAL_FIELDS.map((key) => [key, ""])),
    recession: [emptyRecession()],
  },
  radiographicExamination: Object.fromEntries(RADIOGRAPHIC_FIELDS.map((key) => [key, ""])),
  diagnosisAndTreatment: {
    gingivalDiseases: "",
    periodontalDiseases: [emptyDisease()],
    finalDiagnosis: "",
    otherDiagnosis: "",
    factors: { local: "", functional: "", systemic: "", environmental: "" },
    treatmentPlan: {
      emergencyPhase: "",
      etiotropicPhase: Object.fromEntries(
        ETIOTROPIC_STEPS.flatMap((key) => [
          [key, false],
          [`${key}Site`, ""],
        ])
      ),
      surgicalPhase: "",
      restorativePhase: "",
      maintenancePhase: "",
      consultation: "",
      recallMaintenance: "",
    },
  },
  charting: {
    upper: { labial: emptyView(), palatal: emptyView() },
    lower: { buccal: emptyView(), lingual: emptyView() },
  },
};

const TABS = [
  { id: "medical", label: "Medical" },
  { id: "general", label: "General Information" },
  { id: "intraOral", label: "Intra-Oral Examination" },
  { id: "mucogingival", label: "Mucogingival Deformities" },
  { id: "radiographic", label: "Radiographic Examination" },
  { id: "diagnosis", label: "Diagnosis & Treatment" },
  { id: "charting", label: "Charting" },
];

const humanise = (key) =>
  key.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase()).trim();

/* -------------------------------------------------------- bleeding index */

/** One tooth as four clickable quadrants: none → pink → red → none. */
function BleedingTooth({ tooth, sites, onToggle }) {
  const fill = (site) => BLEEDING_FILL[sites[site]] ?? "#FFFFFF";
  const points = {
    topLeft: "0,0 60,0 30,30",
    topRight: "60,0 60,60 30,30",
    bottomLeft: "0,60 0,0 30,30",
    bottomRight: "60,60 0,60 30,30",
  };

  return (
    <div className="flex min-w-0 flex-col items-center gap-1.5">
      <img
        src={`/imgs/teeth/${tooth}.png`}
        alt={`Tooth ${tooth}`}
        className="h-9 w-9 object-contain"
      />
      <span className="text-[11px] font-bold text-ink-muted">{tooth}</span>
      <svg viewBox="0 0 60 60" className="h-11 w-11" role="group" aria-label={`Bleeding sites ${tooth}`}>
        {SITES.map((site) => (
          <polygon
            key={site}
            points={points[site]}
            fill={fill(site)}
            stroke="#4A6B7C"
            strokeWidth="1"
            className="cursor-pointer"
            onClick={() => onToggle(site)}
          />
        ))}
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------- charting */

/** One arch view: M/F single values plus CAL/PD across six sites per tooth. */
function ChartingTable({ teeth, view, rows, onChange, fields }) {
  return (
    <div className="od-scroll-x overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="bg-slate-50/80">
            <th className="sticky left-0 z-10 whitespace-nowrap border-b border-slate-200 bg-slate-50 px-2.5 py-2 text-[11px] font-bold uppercase tracking-[0.06em] text-ink-soft">
              {view}
            </th>
            {teeth.map((tooth) => (
              <th
                key={tooth}
                className="border-b border-slate-200 px-1.5 py-2 text-center text-[11px] font-bold text-ink-soft"
              >
                {tooth}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {fields.map((field) => {
            const sixSite = field === "CAL" || field === "PD";
            return (
              <tr key={field} className="border-t border-slate-100">
                <td className="sticky left-0 z-10 whitespace-nowrap bg-white px-2.5 py-1.5 text-[12px] font-bold text-ink">
                  {field}
                </td>
                {rows[field].map((value, index) => (
                  <td key={index} className="px-1 py-1.5">
                    {sixSite ? (
                      <div className="grid grid-cols-3 gap-0.5">
                        {value.map((cell, subIndex) => (
                          <input
                            key={subIndex}
                            value={cell ?? ""}
                            onChange={(event) => onChange(field, index, subIndex, event.target.value)}
                            className="h-6 w-full min-w-[22px] rounded border border-slate-200 text-center text-[11px] text-ink focus:border-brand-500 focus:outline-none"
                          />
                        ))}
                      </div>
                    ) : (
                      <input
                        value={value ?? ""}
                        onChange={(event) => onChange(field, index, 0, event.target.value)}
                        className="h-8 w-full min-w-[42px] rounded-lg border border-slate-200 text-center text-[12px] text-ink focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-600/10"
                      />
                    )}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------------------------------------ the sheet */

export default function PeriodonticsSheet({ initialData, onSave, record, saving }) {
  const [form, setForm] = useState(() =>
    initialData && Object.keys(initialData).length ? { ...DEFAULTS, ...initialData } : DEFAULTS
  );
  const [tab, setTab] = useState("medical");

  const setField = (section, field, value) =>
    setForm((prev) => ({ ...prev, [section]: { ...prev[section], [field]: value } }));

  const setGroup = (section, group, field, value) =>
    setForm((prev) => ({
      ...prev,
      [section]: { ...prev[section], [group]: { ...prev[section][group], [field]: value } },
    }));

  const setPlan = (field, value) =>
    setForm((prev) => ({
      ...prev,
      diagnosisAndTreatment: {
        ...prev.diagnosisAndTreatment,
        treatmentPlan: { ...prev.diagnosisAndTreatment.treatmentPlan, [field]: value },
      },
    }));

  const setEtiotropic = (field, value) =>
    setForm((prev) => ({
      ...prev,
      diagnosisAndTreatment: {
        ...prev.diagnosisAndTreatment,
        treatmentPlan: {
          ...prev.diagnosisAndTreatment.treatmentPlan,
          etiotropicPhase: {
            ...prev.diagnosisAndTreatment.treatmentPlan.etiotropicPhase,
            [field]: value,
          },
        },
      },
    }));

  const setRow = (section, key, rowIndex, field, value) =>
    setForm((prev) => {
      const rows = [...prev[section][key]];
      rows[rowIndex] = { ...rows[rowIndex], [field]: value };
      return { ...prev, [section]: { ...prev[section], [key]: rows } };
    });

  const addRow = (section, key, factory) =>
    setForm((prev) => ({
      ...prev,
      [section]: { ...prev[section], [key]: [...prev[section][key], factory()] },
    }));

  const removeRow = (section, key, rowIndex) =>
    setForm((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: prev[section][key].filter((_, index) => index !== rowIndex),
      },
    }));

  /** The index is a percentage of bleeding sites, recomputed on every toggle. */
  const toggleBleeding = (toothIndex, site) =>
    setForm((prev) => {
      const index = prev.intraOralExamination.periodontalFindings.gingivalBleedingIndex;
      const sites = [...index.bleedingSites];
      const current = sites[toothIndex][site] ?? "none";
      sites[toothIndex] = { ...sites[toothIndex], [site]: BLEEDING_CYCLE[current] };

      const positive = sites.reduce(
        (sum, tooth) => sum + SITES.filter((key) => tooth[key] && tooth[key] !== "none").length,
        0
      );

      return {
        ...prev,
        intraOralExamination: {
          ...prev.intraOralExamination,
          periodontalFindings: {
            ...prev.intraOralExamination.periodontalFindings,
            gingivalBleedingIndex: {
              bleedingSites: sites,
              totalScore: Math.round((positive / (sites.length * 4)) * 1000) / 10,
            },
          },
        },
      };
    });

  const setCharting = (arch, view) => (field, index, subIndex, value) =>
    setForm((prev) => {
      const target = [...prev.charting[arch][view][field]];
      if (Array.isArray(target[index])) {
        const row = [...target[index]];
        row[subIndex] = value;
        target[index] = row;
      } else {
        target[index] = value;
      }
      return {
        ...prev,
        charting: {
          ...prev.charting,
          [arch]: { ...prev.charting[arch], [view]: { ...prev.charting[arch][view], [field]: target } },
        },
      };
    });

  const submit = () => {
    const { diagnosisAndTreatment: dx } = form;
    let diagnosis = dx.finalDiagnosis || "Periodontal examination";
    const first = dx.periodontalDiseases[0];
    if (first && (first.stage || first.grade)) {
      diagnosis += ` — Stage ${first.stage || "N/A"}, Grade ${first.grade || "N/A"}`;
    }

    const planLines = Object.entries(dx.treatmentPlan)
      .filter(([, value]) => typeof value === "string" && value.trim())
      .map(([key, value]) => `${humanise(key)}: ${value}`);

    const etiotropic = ETIOTROPIC_STEPS.filter((key) => dx.treatmentPlan.etiotropicPhase[key]).map(
      (key) => {
        const site = dx.treatmentPlan.etiotropicPhase[`${key}Site`];
        return `- ${humanise(key)}${site ? ` (${site})` : ""}`;
      }
    );
    if (etiotropic.length) planLines.push("Etiotropic phase:", ...etiotropic);

    const notes = `Gingival diseases: ${dx.gingivalDiseases || "None"}\nOther diagnosis: ${
      dx.otherDiagnosis || "None"
    }`;

    onSave?.(
      form,
      diagnosis,
      planLines.length ? planLines.join("\n") : "Periodontal treatment plan",
      notes
    );
  };

  const bleeding = form.intraOralExamination.periodontalFindings.gingivalBleedingIndex;

  return (
    <div className="flex flex-col">
      <SheetTabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === "medical" ? <MedicalPanel record={record} compact /> : null}

      {tab === "general" ? (
        <>
          <SheetSection title="Past dental history">
            <div className="grid gap-x-8 md:grid-cols-2">
              <NoteRow
                label="History"
                rows={3}
                value={form.generalInformation.pastDentalHistory.history}
                onChange={(value) =>
                  setGroup("generalInformation", "pastDentalHistory", "history", value)
                }
              />
              <TextRow
                label="Number of extracted teeth"
                type="number"
                value={form.generalInformation.pastDentalHistory.numberOfExtractedTeeth}
                onChange={(value) =>
                  setGroup("generalInformation", "pastDentalHistory", "numberOfExtractedTeeth", value)
                }
              />
            </div>
          </SheetSection>

          <SheetSection title="Family history">
            <NoteRow
              label="Family history"
              rows={3}
              value={form.generalInformation.familyHistory}
              onChange={(value) => setField("generalInformation", "familyHistory", value)}
            />
          </SheetSection>

          <SheetSection
            title="Habits"
            hint="Smoking is the single strongest modifiable risk factor for periodontitis — record pack-years, not just yes or no."
          >
            <div className="grid gap-x-8 md:grid-cols-3">
              {["smoking", "toothBrushing", "parafunctional"].map((key) => (
                <TextRow
                  key={key}
                  label={humanise(key)}
                  value={form.generalInformation.habits[key]}
                  onChange={(value) => setGroup("generalInformation", "habits", key, value)}
                />
              ))}
            </div>
          </SheetSection>

          <SheetSection title="Extra-oral examination">
            <NoteRow
              label="Findings"
              rows={3}
              value={form.generalInformation.extraOralExamination}
              onChange={(value) => setField("generalInformation", "extraOralExamination", value)}
            />
          </SheetSection>
        </>
      ) : null}

      {tab === "intraOral" ? (
        <>
          <SheetSection title="Gingival criteria">
            <div className="grid gap-x-8 md:grid-cols-2">
              {GINGIVAL_CRITERIA.map((key) => (
                <TextRow
                  key={key}
                  label={humanise(key)}
                  value={form.intraOralExamination.periodontalFindings.gingivalCriteria[key]}
                  onChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      intraOralExamination: {
                        ...prev.intraOralExamination,
                        periodontalFindings: {
                          ...prev.intraOralExamination.periodontalFindings,
                          gingivalCriteria: {
                            ...prev.intraOralExamination.periodontalFindings.gingivalCriteria,
                            [key]: value,
                          },
                        },
                      },
                    }))
                  }
                />
              ))}
            </div>
          </SheetSection>

          <SheetSection
            title="Gingival bleeding index"
            subtitle={`${bleeding.totalScore}% of sites bleeding`}
            hint="Click a quadrant to cycle it: clear → mild (pink) → frank bleeding (red)."
          >
            <div className="flex flex-col gap-6">
              {[
                { label: "Upper teeth", teeth: UPPER, offset: 0 },
                { label: "Lower teeth", teeth: LOWER, offset: 16 },
              ].map((arch) => (
                <div key={arch.label}>
                  <span className="od-label">{arch.label}</span>
                  <div className="od-scroll-x mt-3 overflow-x-auto">
                    <div
                      className="grid min-w-[860px] gap-2"
                      style={{ gridTemplateColumns: "repeat(16, minmax(0, 1fr))" }}
                    >
                      {arch.teeth.map((tooth, index) => (
                        <BleedingTooth
                          key={tooth}
                          tooth={tooth}
                          sites={bleeding.bleedingSites[arch.offset + index]}
                          onToggle={(site) => toggleBleeding(arch.offset + index, site)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SheetSection>
        </>
      ) : null}

      {tab === "mucogingival" ? (
        <>
          <SheetSection title="Mucogingival assessment">
            <div className="grid gap-x-8 md:grid-cols-2">
              {MUCOGINGIVAL_FIELDS.map((key) => (
                <TextRow
                  key={key}
                  label={humanise(key)}
                  value={form.mucogingivalDeformities[key]}
                  onChange={(value) => setField("mucogingivalDeformities", key, value)}
                />
              ))}
            </div>
          </SheetSection>

          <SheetSection title="Recession" subtitle="One row per affected site">
            <GridTable
              columns={RECESSION_COLUMNS}
              rows={form.mucogingivalDeformities.recession}
              onChange={(rowIndex, field, value) =>
                setRow("mucogingivalDeformities", "recession", rowIndex, field, value)
              }
              onAddRow={() => addRow("mucogingivalDeformities", "recession", emptyRecession)}
              onRemoveRow={
                form.mucogingivalDeformities.recession.length > 1
                  ? (rowIndex) => removeRow("mucogingivalDeformities", "recession", rowIndex)
                  : undefined
              }
              addLabel="Add recession row"
            />
          </SheetSection>
        </>
      ) : null}

      {tab === "radiographic" ? (
        <SheetSection title="Radiographic examination">
          <div className="grid gap-x-8 md:grid-cols-2">
            {RADIOGRAPHIC_FIELDS.map((key) => (
              <TextRow
                key={key}
                label={humanise(key)}
                value={form.radiographicExamination[key]}
                onChange={(value) => setField("radiographicExamination", key, value)}
              />
            ))}
          </div>
          <p className="mt-2 rounded-xl bg-brand-50/70 px-4 py-3 text-[12.5px] text-brand-800">
            Radiographs themselves live on the patient's X-rays tab — this section records what you
            read off them.
          </p>
        </SheetSection>
      ) : null}

      {tab === "diagnosis" ? (
        <>
          <SheetSection title="Diagnosis">
            <div className="grid gap-x-8 md:grid-cols-2">
              <TextRow
                label="Gingival diseases"
                value={form.diagnosisAndTreatment.gingivalDiseases}
                onChange={(value) => setField("diagnosisAndTreatment", "gingivalDiseases", value)}
              />
              <TextRow
                label="Final diagnosis"
                value={form.diagnosisAndTreatment.finalDiagnosis}
                onChange={(value) => setField("diagnosisAndTreatment", "finalDiagnosis", value)}
              />
              <TextRow
                label="Other diagnosis"
                value={form.diagnosisAndTreatment.otherDiagnosis}
                onChange={(value) => setField("diagnosisAndTreatment", "otherDiagnosis", value)}
              />
            </div>
          </SheetSection>

          <SheetSection
            title="Periodontal diseases"
            hint="Staged and graded per the 2017 world workshop classification."
          >
            <GridTable
              columns={DISEASE_COLUMNS}
              rows={form.diagnosisAndTreatment.periodontalDiseases}
              onChange={(rowIndex, field, value) =>
                setRow("diagnosisAndTreatment", "periodontalDiseases", rowIndex, field, value)
              }
              onAddRow={() => addRow("diagnosisAndTreatment", "periodontalDiseases", emptyDisease)}
              onRemoveRow={
                form.diagnosisAndTreatment.periodontalDiseases.length > 1
                  ? (rowIndex) => removeRow("diagnosisAndTreatment", "periodontalDiseases", rowIndex)
                  : undefined
              }
              addLabel="Add disease row"
            />
          </SheetSection>

          <SheetSection title="Contributing factors">
            <div className="grid gap-x-8 md:grid-cols-2">
              {["local", "functional", "systemic", "environmental"].map((key) => (
                <TextRow
                  key={key}
                  label={humanise(key)}
                  value={form.diagnosisAndTreatment.factors[key]}
                  onChange={(value) => setGroup("diagnosisAndTreatment", "factors", key, value)}
                />
              ))}
            </div>
          </SheetSection>

          <SheetSection title="Treatment plan">
            <NoteRow
              label="Emergency phase"
              rows={3}
              value={form.diagnosisAndTreatment.treatmentPlan.emergencyPhase}
              onChange={(value) => setPlan("emergencyPhase", value)}
            />

            <div className="mb-5">
              <span className="mb-2 block text-[13px] font-semibold text-ink">Etiotropic phase</span>
              <div className="grid gap-3 md:grid-cols-2">
                {ETIOTROPIC_STEPS.map((key) => {
                  const checked = form.diagnosisAndTreatment.treatmentPlan.etiotropicPhase[key];
                  return (
                    <div
                      key={key}
                      className={cn(
                        "rounded-xl border px-3.5 py-3 transition",
                        checked ? "border-brand-300 bg-brand-50/50" : "border-slate-200"
                      )}
                    >
                      <Checkbox
                        label={humanise(key)}
                        checked={checked}
                        onChange={(event) => setEtiotropic(key, event.target.checked)}
                      />
                      {checked ? (
                        <Input
                          className="mt-2.5 h-9"
                          placeholder="Specify site…"
                          value={
                            form.diagnosisAndTreatment.treatmentPlan.etiotropicPhase[`${key}Site`] ?? ""
                          }
                          onChange={(event) => setEtiotropic(`${key}Site`, event.target.value)}
                        />
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>

            {PHASES.map((key) => (
              <NoteRow
                key={key}
                label={humanise(key)}
                rows={3}
                value={form.diagnosisAndTreatment.treatmentPlan[key]}
                onChange={(value) => setPlan(key, value)}
              />
            ))}
          </SheetSection>
        </>
      ) : null}

      {tab === "charting" ? (
        <>
          <SheetSection
            title="Upper arch"
            hint="M = mobility, F = furcation. CAL and PD carry six sites per tooth: mesio-buccal, buccal, disto-buccal, disto-lingual, lingual, mesio-lingual."
          >
            <div className="flex flex-col gap-5">
              <ChartingTable
                teeth={UPPER}
                view="Labial"
                fields={["M", "F", "CAL", "PD"]}
                rows={form.charting.upper.labial}
                onChange={setCharting("upper", "labial")}
              />
              <ChartingTable
                teeth={UPPER}
                view="Palatal"
                fields={["CAL", "PD"]}
                rows={form.charting.upper.palatal}
                onChange={setCharting("upper", "palatal")}
              />
            </div>
          </SheetSection>

          <SheetSection title="Lower arch">
            <div className="flex flex-col gap-5">
              <ChartingTable
                teeth={LOWER}
                view="Buccal"
                fields={["M", "F", "CAL", "PD"]}
                rows={form.charting.lower.buccal}
                onChange={setCharting("lower", "buccal")}
              />
              <ChartingTable
                teeth={LOWER}
                view="Lingual"
                fields={["CAL", "PD"]}
                rows={form.charting.lower.lingual}
                onChange={setCharting("lower", "lingual")}
              />
            </div>
          </SheetSection>
        </>
      ) : null}

      <SheetActions onSave={submit} saving={saving} />
    </div>
  );
}
