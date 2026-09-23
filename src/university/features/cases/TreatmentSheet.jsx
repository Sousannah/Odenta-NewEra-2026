import { useEffect, useMemo, useState } from "react";
import { NotebookPen, Save } from "lucide-react";
import { universityService } from "@/services";
import { formatDate } from "@/lib/format";
import { SHEET_TYPES, departmentMeta, sheetMeta } from "@/config/academic";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";

const SHEET_STATUS_TONE = { draft: "neutral", submitted: "warning", signed: "success" };

/**
 * The chairside treatment sheet.
 *
 * Each rotation has its own fixed set of sections; the sheet is the record a
 * supervisor reads before signing a step, so the section order here matches
 * the order the procedure is actually carried out in.
 *
 * Edits are held in component state and posted on save — there is no
 * optimistic-update or conflict layer yet, which matters the day two people
 * open the same sheet.
 */
export function TreatmentSheet({ caseId, sheets = [], department, readOnly = false, onSaved }) {
  const toast = useToast();
  const existing = sheets[0] ?? null;

  const defaultType = useMemo(
    () => existing?.type ?? departmentMeta(department).sheet ?? SHEET_TYPES[0].value,
    [existing?.type, department]
  );

  const [type, setType] = useState(defaultType);
  const [values, setValues] = useState(existing?.sections ?? {});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setType(defaultType);
    setValues(existing?.sections ?? {});
  }, [defaultType, existing?.id, existing?.sections]);

  const meta = sheetMeta(type);

  const setField = (sectionKey, field, value) =>
    setValues((prev) => ({
      ...prev,
      [sectionKey]: { ...(prev[sectionKey] ?? {}), [field]: value },
    }));

  const save = async (status) => {
    setBusy(true);
    try {
      if (existing) {
        await universityService.saveCaseSheet(caseId, existing.id, {
          type,
          sections: values,
          status,
        });
      } else {
        await universityService.createCaseSheet(caseId, { type, sections: values, status });
      }
      toast.success(status === "submitted" ? "Sheet submitted" : "Sheet saved", meta?.label);
      onSaved?.();
    } catch (cause) {
      toast.error("Could not save the sheet", cause?.message);
    } finally {
      setBusy(false);
    }
  };

  if (!meta) {
    return (
      <Card>
        <CardBody>
          <EmptyState
            icon={<NotebookPen className="h-6 w-6" />}
            title="No sheet for this rotation"
            description="Pick a procedure type to start a treatment sheet."
            className="py-12"
          />
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title={`${meta.label} sheet`}
        subtitle={
          existing
            ? `Last saved ${formatDate(existing.updatedAt, "d MMM yyyy")}`
            : "Not started — nothing has been saved for this case yet"
        }
        action={
          <div className="flex flex-wrap items-center gap-2">
            {existing ? (
              <Badge tone={SHEET_STATUS_TONE[existing.status] ?? "neutral"}>{existing.status}</Badge>
            ) : null}
            {!readOnly ? (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  loading={busy}
                  leftIcon={<Save className="h-3.5 w-3.5" />}
                  onClick={() => save("draft")}
                >
                  Save draft
                </Button>
                <Button size="sm" loading={busy} onClick={() => save("submitted")}>
                  Submit sheet
                </Button>
              </>
            ) : null}
          </div>
        }
      />

      <CardBody className="pt-2">
        {!readOnly ? (
          <div className="mb-6 max-w-sm">
            <Field label="Procedure type" hint="changes which sections are shown">
              <Select value={type} onChange={(event) => setType(event.target.value)}>
                {SHEET_TYPES.map((entry) => (
                  <option key={entry.value} value={entry.value}>
                    {entry.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        ) : null}

        <div className="flex flex-col gap-6">
          {meta.sections.map((section, index) => (
            <section key={section.key} className="rounded-2xl border border-slate-200 p-5">
              <header className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-100 text-[12px] font-extrabold text-brand-700">
                  {index + 1}
                </span>
                <h4 className="text-[14.5px] font-bold text-ink">{section.label}</h4>
              </header>

              <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {section.fields.map((field) => (
                  <Field key={field} label={field}>
                    <Input
                      value={values[section.key]?.[field] ?? ""}
                      disabled={readOnly}
                      onChange={(event) => setField(section.key, field, event.target.value)}
                      placeholder="—"
                    />
                  </Field>
                ))}
              </div>

              <div className="mt-4">
                <Field label="Notes">
                  <Textarea
                    rows={2}
                    disabled={readOnly}
                    value={values[section.key]?.__note ?? ""}
                    onChange={(event) => setField(section.key, "__note", event.target.value)}
                    placeholder="Anything the staff member should read for this stage…"
                  />
                </Field>
              </div>
            </section>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
