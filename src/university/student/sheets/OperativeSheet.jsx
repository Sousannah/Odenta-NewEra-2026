import { useState } from "react";
import { MedicalPanel } from "../MedicalPanel";
import { NoteRow, SheetActions, SheetSection, SheetTabs, YesNoRow } from "./SheetControls";

/**
 * Operative.
 *
 * The shortest of the five sheets: a dental history and the six pain questions
 * that separate reversible pulpitis from everything worse. The answers drive
 * the diagnosis line the sheet writes on save.
 */

const DEFAULTS = {
  dentalHistory: "",
  dentalExamination: {
    feelingPain: "",
    localized: "",
    spontaneous: "",
    durationAfterStimulus: "",
    awakenAtNight: "",
    severePain: "",
  },
};

const TABS = [
  { id: "medical", label: "Medical" },
  { id: "dental", label: "Dental" },
];

const EXAM_QUESTIONS = [
  { key: "feelingPain", label: "Feeling pain" },
  { key: "localized", label: "Localized" },
  { key: "spontaneous", label: "Spontaneous" },
  { key: "durationAfterStimulus", label: "Duration after stimulus" },
  { key: "awakenAtNight", label: "Awakens at night" },
  { key: "severePain", label: "Severe pain" },
];

export default function OperativeSheet({ initialData, onSave, record, saving }) {
  const [form, setForm] = useState(() =>
    initialData && Object.keys(initialData).length ? { ...DEFAULTS, ...initialData } : DEFAULTS
  );
  const [tab, setTab] = useState("medical");

  const setExam = (key, value) =>
    setForm((prev) => ({ ...prev, dentalExamination: { ...prev.dentalExamination, [key]: value } }));

  const submit = () => {
    const diagnosis = `Operative treatment needed based on dental examination: ${
      form.dentalExamination.feelingPain === "Yes" ? "Patient reports pain" : "No pain reported"
    }`;
    onSave?.(form, diagnosis, "Operative treatment plan based on dental history and examination", "");
  };

  return (
    <div className="flex flex-col">
      <SheetTabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === "medical" ? <MedicalPanel record={record} compact /> : null}

      {tab === "dental" ? (
        <>
          <SheetSection title="Dental history">
            <NoteRow
              label="Dental history"
              value={form.dentalHistory}
              onChange={(value) => setForm((prev) => ({ ...prev, dentalHistory: value }))}
              placeholder="Previous restorations, extractions, trauma, orthodontics…"
            />
          </SheetSection>

          <SheetSection
            title="Dental examination"
            hint="The six questions that separate reversible from irreversible pulpitis."
          >
            {EXAM_QUESTIONS.map((question) => (
              <YesNoRow
                key={question.key}
                label={question.label}
                value={form.dentalExamination[question.key]}
                onChange={(value) => setExam(question.key, value)}
              />
            ))}
          </SheetSection>
        </>
      ) : null}

      <SheetActions onSave={submit} saving={saving} />
    </div>
  );
}
