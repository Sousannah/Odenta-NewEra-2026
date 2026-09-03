import { useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  Info,
  Layers,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useToast } from "@/components/ui/Toast";
import { formatMoney } from "@/lib/format";
import { PROCEDURE_CATEGORIES, PROCEDURE_CODES } from "@/config/dentalStandards";
import { Modal } from "@/components/ui/Modal";
import { Button, IconButton } from "@/components/ui/Button";
import { Field, Input, Radio, Select, Textarea } from "@/components/ui/Field";
import { Counter } from "@/components/ui/Misc";

/**
 * Treatment editor.
 *
 * Three stacked dialogs, matching the reference flow:
 *   Add Treatment  →  Set Multiple Visits  →  Setup Component
 * Each layer offsets slightly so the parent stays visible behind it, which is
 * what makes the nesting legible rather than disorienting.
 */

const blankVisit = (index) => ({
  key: Math.random().toString(36).slice(2),
  name: index === 0 ? "" : "",
  duration: 1,
  gapDays: index === 0 ? 0 : 7,
  description: "",
  components: [],
});

const blankComponent = () => ({
  key: Math.random().toString(36).slice(2),
  name: "",
  price: 0,
  quantity: 1,
  freeMode: "none",
  freeUpTo: 1,
});

/* ------------------------------------------------- setup component modal */

function SetupComponentModal({ open, onClose, visit, onSave }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!open) return;
    setItems(visit?.components?.length ? visit.components : [blankComponent()]);
  }, [open, visit]);

  const patch = (key, updates) =>
    setItems((prev) => prev.map((item) => (item.key === key ? { ...item, ...updates } : item)));

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      className="ml-0 sm:-ml-24"
      bodyClassName="px-6 py-5"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="min-w-[120px]"
            onClick={() => {
              onSave(items.filter((item) => item.name.trim()));
              onClose();
            }}
          >
            Save
          </Button>
        </>
      }
    >
      <div className="-mt-1 mb-4 flex items-center justify-between gap-3">
        <IconButton label="Back" size="sm" onClick={onClose} className="border border-slate-200">
          <ChevronLeft className="h-4 w-4 text-ink-muted" />
        </IconButton>
        <h2 className="text-lg font-bold text-ink">Setup Component</h2>
        <IconButton label="Close" size="sm" onClick={onClose}>
          <X className="h-4 w-4 text-ink-muted" />
        </IconButton>
      </div>

      <div className="flex flex-col divide-y divide-dashed divide-slate-200">
        {items.map((item) => (
          <div key={item.key} className="flex flex-col gap-2.5 py-3.5 first:pt-0">
            <div className="flex flex-wrap items-center gap-3">
              <Input
                className="h-10 min-w-[180px] flex-1 text-[13px]"
                placeholder="Component name"
                value={item.name}
                onChange={(event) => patch(item.key, { name: event.target.value })}
              />
              <span className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[12px] font-bold text-ink-soft">
                  $
                </span>
                <input
                  type="number"
                  min="0"
                  value={item.price}
                  onChange={(event) => patch(item.key, { price: Number(event.target.value) })}
                  className="h-10 w-[104px] rounded-xl border border-slate-200 pl-7 pr-2 text-[13px] font-semibold text-ink focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-600/10"
                />
              </span>
              <Counter
                value={item.quantity}
                min={1}
                onChange={(quantity) => patch(item.key, { quantity })}
              />
              <button
                type="button"
                aria-label="Remove component"
                onClick={() => setItems((prev) => prev.filter((entry) => entry.key !== item.key))}
                className="rounded-lg p-1.5 text-ink-faint transition hover:bg-danger-soft hover:text-danger"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <Radio
                name={`free-${item.key}`}
                label="Totally Free"
                className="border-0 px-0 py-0"
                checked={item.freeMode === "all"}
                onChange={() => patch(item.key, { freeMode: "all" })}
              />
              <Radio
                name={`free-${item.key}`}
                label="Free up to"
                className="border-0 px-0 py-0"
                checked={item.freeMode === "upto"}
                onChange={() => patch(item.key, { freeMode: "upto" })}
              />
              {item.freeMode === "upto" ? (
                <span className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    value={item.freeUpTo}
                    onChange={(event) => patch(item.key, { freeUpTo: Number(event.target.value) })}
                    className="h-9 w-16 rounded-xl border border-slate-200 px-2 text-center text-[13px] font-semibold text-ink focus:border-brand-500 focus:outline-none"
                  />
                  <span className="text-[12px] text-ink-soft">pcs</span>
                </span>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      <Button
        variant="secondary"
        size="sm"
        className="mt-4 w-fit text-brand-600"
        leftIcon={<Plus className="h-3.5 w-3.5" />}
        onClick={() => setItems((prev) => [...prev, blankComponent()])}
      >
        Add component
      </Button>
    </Modal>
  );
}

/* --------------------------------------------------- multiple visits modal */

function MultipleVisitsModal({ open, onClose, visits, onSave }) {
  const [rows, setRows] = useState([]);
  const [componentVisit, setComponentVisit] = useState(null);

  useEffect(() => {
    if (!open) return;
    setRows(visits?.length ? visits.map((visit) => ({ ...blankVisit(0), ...visit })) : [blankVisit(0), blankVisit(1)]);
  }, [open, visits]);

  const patch = (key, updates) =>
    setRows((prev) => prev.map((row) => (row.key === key ? { ...row, ...updates } : row)));

  const move = (index, direction) =>
    setRows((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        size="md"
        className="ml-0 sm:-ml-32"
        bodyClassName="px-6 py-5"
        footer={
          <>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              className="min-w-[120px]"
              onClick={() => {
                onSave(rows.filter((row) => row.name.trim()));
                onClose();
              }}
            >
              Save
            </Button>
          </>
        }
      >
        <div className="-mt-1 mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-ink">Set Multiple Visits</h2>
          <IconButton label="Close" size="sm" onClick={onClose}>
            <X className="h-4 w-4 text-ink-muted" />
          </IconButton>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="text-[14px] font-bold text-ink">Visitation Settings</span>
          <Button
            variant="secondary"
            size="sm"
            className="text-brand-600"
            leftIcon={<Plus className="h-3.5 w-3.5" />}
            onClick={() => setRows((prev) => [...prev, blankVisit(prev.length)])}
          >
            Add New Visit
          </Button>
        </div>

        <div className="mt-4 flex flex-col gap-3">
          {rows.map((row, index) => (
            <div key={row.key}>
              <div className="flex gap-3">
                <div className="flex shrink-0 flex-col gap-2 pt-4">
                  <IconButton
                    label="Move up"
                    size="xs"
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                    className={cn(
                      "border",
                      index === 0
                        ? "border-slate-100 text-ink-faint"
                        : "border-brand-200 text-brand-600"
                    )}
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </IconButton>
                  <IconButton
                    label="Move down"
                    size="xs"
                    disabled={index === rows.length - 1}
                    onClick={() => move(index, 1)}
                    className={cn(
                      "border",
                      index === rows.length - 1
                        ? "border-slate-100 text-ink-faint"
                        : "border-brand-200 text-brand-600"
                    )}
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </IconButton>
                </div>

                <div className="min-w-0 flex-1 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
                    <span className="text-[14px] font-bold text-ink">Visit #{index + 1}</span>
                    {rows.length > 1 ? (
                      <button
                        type="button"
                        aria-label="Remove visit"
                        onClick={() => setRows((prev) => prev.filter((entry) => entry.key !== row.key))}
                        className="rounded-lg p-1 text-ink-faint transition hover:bg-slate-100 hover:text-danger"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>

                  <div className="flex flex-col gap-4 px-4 py-4">
                    <Field label="Treatment Name">
                      <Input
                        placeholder="Enter treatment name"
                        value={row.name}
                        onChange={(event) => patch(row.key, { name: event.target.value })}
                      />
                    </Field>

                    <Field label="Estimate Duration Treatment">
                      <Select
                        value={row.duration}
                        onChange={(event) => patch(row.key, { duration: Number(event.target.value) })}
                      >
                        {[0.5, 1, 1.5, 2, 2.5, 3].map((value) => (
                          <option key={value} value={value}>
                            {value} hour(s)
                          </option>
                        ))}
                      </Select>
                    </Field>

                    <Field
                      label="Treatment Description"
                      counter={`${(row.description ?? "").length} / 200`}
                    >
                      <Textarea
                        rows={3}
                        maxLength={200}
                        value={row.description}
                        onChange={(event) => patch(row.key, { description: event.target.value })}
                      />
                    </Field>

                    <button
                      type="button"
                      onClick={() => setComponentVisit(row)}
                      className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3.5 py-3 text-left transition hover:bg-slate-100"
                    >
                      <span className="flex min-w-0 items-center gap-2.5">
                        <Layers className="h-4 w-4 shrink-0 text-ink-soft" />
                        <span className="min-w-0">
                          <span className="block text-[13px] font-bold text-ink">
                            {row.components?.length ?? 0} components
                          </span>
                          <span className="block truncate text-[11.5px] text-ink-soft">
                            {row.components?.length
                              ? row.components.map((item) => item.name).join(", ")
                              : "No components configured"}
                          </span>
                        </span>
                      </span>
                      <span className="shrink-0 text-[12px] font-bold text-brand-600">
                        See details
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {index < rows.length - 1 ? (
                <div className="my-2 flex items-center justify-center gap-2">
                  <input
                    type="number"
                    min="0"
                    value={rows[index + 1].gapDays}
                    onChange={(event) =>
                      patch(rows[index + 1].key, { gapDays: Number(event.target.value) })
                    }
                    className="h-9 w-14 rounded-l-xl border border-slate-200 px-2 text-center text-[13px] font-semibold text-ink focus:border-brand-500 focus:outline-none"
                  />
                  <span className="-ml-2 flex h-9 items-center rounded-r-xl border border-l-0 border-slate-200 px-3 text-[12px] font-semibold text-ink-muted">
                    Day(s)
                  </span>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </Modal>

      <SetupComponentModal
        open={Boolean(componentVisit)}
        onClose={() => setComponentVisit(null)}
        visit={componentVisit}
        onSave={(components) => {
          if (componentVisit) patch(componentVisit.key, { components });
        }}
      />
    </>
  );
}

/* ------------------------------------------------------- add treatment */

export function TreatmentFormModal({ open, onClose, treatment, onSaved }) {
  const toast = useToast();
  const editing = Boolean(treatment);
  const [form, setForm] = useState(null);
  const [visitsOpen, setVisitsOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm({
      name: treatment?.name ?? "",
      code: treatment?.code ?? PROCEDURE_CODES[0].code,
      category: treatment?.category ?? PROCEDURE_CATEGORIES[0],
      service: treatment?.service ?? "medical",
      description: treatment?.description ?? "",
      price: treatment?.price ?? 0,
      duration: treatment?.duration ?? 1,
      visits: (treatment?.visits ?? []).map((visit) => ({ ...blankVisit(0), ...visit })),
    });
  }, [open, treatment]);

  if (!form) return null;

  const update = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={editing ? "Edit Treatment" : "Add Treatment"}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              className="min-w-[120px]"
              disabled={!form.name}
              onClick={() => {
                toast.success(editing ? "Treatment updated" : "Treatment created", form.name);
                onSaved?.();
                onClose();
              }}
            >
              Save
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-5">
          <div>
            <h3 className="text-[15px] font-bold text-ink">Basic Info</h3>

            <Field label="Treatment Name" className="mt-3" required>
              <Input value={form.name} onChange={(event) => update({ name: event.target.value })} />
            </Field>

            <Field label="Treatment Category" className="mt-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: "medical", label: "Medical Service" },
                  { value: "cosmetic", label: "Cosmetic Service" },
                ].map((option) => (
                  <Radio
                    key={option.value}
                    name="service"
                    label={option.label}
                    checked={form.service === option.value}
                    onChange={() => update({ service: option.value })}
                  />
                ))}
              </div>
            </Field>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Billing code" hint="CDT">
                <Select value={form.code} onChange={(event) => update({ code: event.target.value })}>
                  {PROCEDURE_CODES.map((item) => (
                    <option key={item.code} value={item.code}>
                      {item.code} · {item.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Category of service">
                <Select
                  value={form.category}
                  onChange={(event) => update({ category: event.target.value })}
                >
                  {PROCEDURE_CATEGORIES.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </Select>
              </Field>
            </div>

            <Field
              label="Treatment Description"
              className="mt-4"
              counter={`${form.description.length} / 200`}
            >
              <Textarea
                rows={3}
                maxLength={200}
                placeholder="Description"
                value={form.description}
                onChange={(event) => update({ description: event.target.value })}
              />
            </Field>

            <button
              type="button"
              onClick={() => setVisitsOpen(true)}
              className="mt-4 flex w-full items-center justify-between gap-3 rounded-xl border-l-[3px] border-brand-600 bg-slate-50 px-4 py-3 text-left transition hover:bg-slate-100"
            >
              <span className="min-w-0">
                <span className="block text-[13.5px] font-bold text-ink">
                  {form.visits.length ? `${form.visits.length} visits` : "Set Multiple Visits"}
                </span>
                <span className="block truncate text-[11.5px] text-ink-soft">
                  {form.visits.length
                    ? form.visits.map((visit) => visit.name).filter(Boolean).join(" → ")
                    : "Set multiple visits for this treatment"}
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-3 text-[12px] font-bold">
                <span className="text-brand-600">Edit</span>
                {form.visits.length ? (
                  <span
                    className="text-danger"
                    onClick={(event) => {
                      event.stopPropagation();
                      update({ visits: [] });
                    }}
                  >
                    Remove
                  </span>
                ) : null}
              </span>
            </button>
          </div>

          <div className="border-t border-slate-100 pt-5">
            <h3 className="text-[15px] font-bold text-ink">Price &amp; Duration</h3>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <div>
                <Field label="Price Treatment">
                  <span className="relative block">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-ink-soft">
                      $
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={form.price}
                      onChange={(event) => update({ price: Number(event.target.value) })}
                      className="h-11 w-full rounded-xl border border-slate-200 pl-8 pr-3.5 text-sm font-semibold text-ink focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-600/10"
                    />
                  </span>
                </Field>
                <p className="mt-1.5 flex items-center gap-1.5 text-[11.5px] text-ink-soft">
                  <Info className="h-3 w-3" /> Price for all treatment visits
                </p>
              </div>

              <div>
                <Field label="Estimate Duration Treatment">
                  <Select
                    value={form.duration}
                    onChange={(event) => update({ duration: Number(event.target.value) })}
                  >
                    {[0.5, 1, 1.5, 2, 2.5, 3].map((value) => (
                      <option key={value} value={value}>
                        {value} hours
                      </option>
                    ))}
                  </Select>
                </Field>
                <p className="mt-1.5 flex items-center gap-1.5 text-[11.5px] text-ink-soft">
                  <Info className="h-3 w-3" /> Duration for 1 treatment
                </p>
              </div>
            </div>

            {form.visits.length ? (
              <p className="mt-4 rounded-xl bg-brand-50 px-3.5 py-2.5 text-[12.5px] text-brand-800">
                {form.visits.length} visits · {formatMoney(form.price)} total ·{" "}
                {form.visits.reduce((sum, visit) => sum + Number(visit.duration || 0), 0)} hours of
                chair time
              </p>
            ) : null}
          </div>
        </div>
      </Modal>

      <MultipleVisitsModal
        open={visitsOpen}
        onClose={() => setVisitsOpen(false)}
        visits={form.visits}
        onSave={(visits) => update({ visits })}
      />
    </>
  );
}
