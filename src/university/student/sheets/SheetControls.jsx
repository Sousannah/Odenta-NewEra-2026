import { cn } from "@/lib/cn";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { Printer, Save } from "lucide-react";

/**
 * The controls every treatment sheet is built from.
 *
 * A sheet is a paper form a faculty has used for decades: a long run of
 * single-choice questions with fixed option sets. Rendering that as a native
 * `<select>` per row loses the thing that makes it usable chairside — being
 * able to see every option at once and hit one with a gloved finger — so the
 * options stay laid out, and these helpers keep all five sheets identical.
 */

/* ------------------------------------------------------------ option rows */

export function OptionRow({ label, value, onChange, options, error, required = false, columns }) {
  const cols =
    columns ??
    (options.some((option) => String(option).length > 22)
      ? "sm:grid-cols-2"
      : "sm:grid-cols-3 lg:grid-cols-4");

  return (
    <fieldset className="mb-5 min-w-0">
      <legend className="mb-2 text-[13px] font-semibold text-ink">
        {label}
        {required ? <span className="text-danger"> *</span> : null}
      </legend>
      <div className={cn("grid grid-cols-1 gap-2", cols)}>
        {options.map((option) => {
          const selected = value === option;
          return (
            <button
              key={option}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(option)}
              className={cn(
                "od-focus flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-[13px] transition",
                selected
                  ? "border-brand-600 bg-brand-50/70 font-semibold text-brand-800"
                  : "border-slate-200 bg-white text-ink-muted hover:border-slate-300 hover:bg-slate-50"
              )}
            >
              <span
                className={cn(
                  "flex h-[16px] w-[16px] shrink-0 items-center justify-center rounded-full border-2 transition",
                  selected ? "border-brand-600" : "border-slate-300"
                )}
              >
                {selected ? <span className="h-1.5 w-1.5 rounded-full bg-brand-600" /> : null}
              </span>
              <span className="min-w-0 break-words">{option}</span>
            </button>
          );
        })}
      </div>
      {error ? <p className="mt-1 text-[12px] font-medium text-danger">{error}</p> : null}
    </fieldset>
  );
}

/** Yes / No is common enough to be worth its own call. */
export function YesNoRow(props) {
  return <OptionRow {...props} options={props.options ?? ["Yes", "No"]} columns="sm:grid-cols-2" />;
}

/* ---------------------------------------------------------------- fields */

export function TextRow({ label, value, onChange, error, type = "text", placeholder, required }) {
  return (
    <Field label={label} error={error} required={required} className="mb-4">
      <Input
        type={type}
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </Field>
  );
}

export function NoteRow({ label, value, onChange, error, rows = 4, placeholder, required }) {
  return (
    <Field label={label} error={error} required={required} className="mb-4">
      <Textarea
        rows={rows}
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </Field>
  );
}

/* --------------------------------------------------------------- chrome */

/** One numbered block of a sheet. */
export function SheetSection({ title, subtitle, hint, children, className }) {
  return (
    <Card className={cn("mb-5", className)}>
      <CardHeader title={title} subtitle={subtitle} />
      <CardBody className="pt-2">
        {hint ? (
          <p className="mb-4 rounded-xl bg-slate-50 px-3.5 py-2.5 text-[12px] font-medium text-ink-muted">
            {hint}
          </p>
        ) : null}
        {children}
      </CardBody>
    </Card>
  );
}

/** The tab strip along the top of a sheet. */
export function SheetTabs({ tabs, active, onChange }) {
  return (
    <div className="od-scroll-x od-print-hide -mx-1 mb-5 flex items-center gap-1 overflow-x-auto border-b border-slate-200 px-1">
      {tabs.map((tab) => {
        const selected = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.id)}
            className={cn(
              "od-focus -mb-px shrink-0 whitespace-nowrap border-b-2 px-3.5 pb-3 pt-2 text-[13px] font-semibold transition-colors",
              selected
                ? "border-brand-600 text-brand-700"
                : "border-transparent text-ink-muted hover:text-ink"
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Save / print footer, identical on all five sheets.
 *
 * Print rather than a PDF library: the browser's dialog saves a PDF too, and
 * printing what is on screen means the paper copy can never disagree with the
 * record. The footer itself is hidden on paper.
 */
export function SheetActions({ onSave, saving = false, saveLabel = "Save sheet" }) {
  return (
    <div className="od-print-hide flex flex-wrap items-center justify-end gap-3 pb-2 pt-1">
      <Button
        variant="secondary"
        leftIcon={<Printer className="h-4 w-4" />}
        onClick={() => window.print()}
      >
        Print / save as PDF
      </Button>
      <Button leftIcon={<Save className="h-4 w-4" />} loading={saving} onClick={onSave}>
        {saveLabel}
      </Button>
    </div>
  );
}

/* ------------------------------------------------------------ grid table */

/**
 * The repeating-row tables inside the endodontic and periodontal sheets.
 * `columns` is `[{ key, header, width? }]`; rows are plain objects.
 */
export function GridTable({ columns, rows, onChange, onAddRow, onRemoveRow, addLabel = "Add row" }) {
  return (
    <div className="min-w-0">
      <div className="od-scroll-x overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="bg-slate-50/80">
              {columns.map((column) => (
                <th
                  key={column.key}
                  style={column.width ? { width: column.width } : undefined}
                  className="whitespace-nowrap border-b border-slate-200 px-2.5 py-2 text-[11px] font-bold uppercase tracking-[0.06em] text-ink-soft"
                >
                  {column.header}
                </th>
              ))}
              {onRemoveRow ? <th className="w-16 border-b border-slate-200" /> : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-t border-slate-100">
                {columns.map((column) => (
                  <td key={column.key} className="px-1.5 py-1.5">
                    <input
                      value={row[column.key] ?? ""}
                      onChange={(event) => onChange(rowIndex, column.key, event.target.value)}
                      className="h-9 w-full min-w-[64px] rounded-lg border border-slate-200 bg-white px-2 text-center text-[13px] text-ink transition focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-600/10"
                    />
                  </td>
                ))}
                {onRemoveRow ? (
                  <td className="px-2 py-1.5 text-center">
                    <button
                      type="button"
                      onClick={() => onRemoveRow(rowIndex)}
                      className="rounded-lg px-2 py-1 text-[12px] font-semibold text-danger transition hover:bg-danger-soft"
                    >
                      Remove
                    </button>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {onAddRow ? (
        <Button variant="secondary" size="sm" className="mt-3" onClick={onAddRow}>
          {addLabel}
        </Button>
      ) : null}
    </div>
  );
}
