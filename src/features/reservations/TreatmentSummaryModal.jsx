import { useState } from "react";
import { ChevronUp, Pill, Plus, Trash2, Wrench } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/format";
import { useToast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Checkbox, Select } from "@/components/ui/Field";
import { Counter, InfoBanner } from "@/components/ui/Misc";

const DEFAULT_SUMMARY = [
  {
    id: "sum-1",
    treatment: "Tooth Filling",
    price: 220,
    teeth: [
      { id: 18, label: "2nd Molars (18)" },
      { id: 19, label: "3rd Molars (19)" },
    ],
    components: [
      { id: "c1", name: "Anesthetic", note: "Include in service", qty: 1, left: 200, free: 0 },
      {
        id: "c2",
        name: "Composite Porseline",
        note: "Free component item: 3, Additional component item: 2",
        qty: 5,
        left: 3123,
        free: 3,
      },
    ],
    medicine: [{ id: "m1", name: "Asam Menefamat", qty: 1, left: 214, paid: true }],
  },
];

const MEDICINE_OPTIONS = ["Asam Menefamat", "Amoxicillin", "Paracetamol", "Chlorhexidine rinse"];

function Section({ icon, title, subtitle, children, action }) {
  return (
    <div className="mt-4">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-ink-muted">
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[14px] font-bold text-ink">{title}</div>
          <div className="text-[12px] text-ink-soft">{subtitle}</div>
        </div>
        {action}
      </div>
      <div className="mt-3 flex flex-col gap-3">{children}</div>
    </div>
  );
}

export function TreatmentSummaryModal({ open, onClose, summary = DEFAULT_SUMMARY, onSaved }) {
  const [items, setItems] = useState(summary);
  const [collapsed, setCollapsed] = useState({});
  const toast = useToast();

  const patch = (itemId, updater) =>
    setItems((prev) => prev.map((item) => (item.id === itemId ? updater(item) : item)));

  const total = items.reduce((sum, item) => sum + Number(item.price || 0), 0);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Treatment Summary"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} className="min-w-[100px]">
            Cancel
          </Button>
          <Button
            className="min-w-[160px]"
            onClick={() => {
              onSaved?.(items);
              toast.success("Treatment summary saved", `Total ${formatMoney(total)}`);
              onClose();
            }}
          >
            Save
          </Button>
        </>
      }
    >
      <InfoBanner tone="info">
        Please enter the nominal price according to the treatment price listed.
      </InfoBanner>

      {items.map((item) => {
        const expanded = !collapsed[item.id];
        return (
          <div key={item.id} className="od-card mt-4 px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setCollapsed((prev) => ({ ...prev, [item.id]: expanded }))}
                className="flex items-center gap-2 text-[15px] font-bold text-ink"
              >
                <ChevronUp className={cn("h-4 w-4 transition-transform", !expanded && "rotate-180")} />
                {item.treatment}
              </button>
              <span className="flex items-center gap-1 text-[15px] font-extrabold text-ink">
                $
                <input
                  type="number"
                  value={item.price}
                  onChange={(event) =>
                    patch(item.id, (current) => ({ ...current, price: event.target.value }))
                  }
                  className="w-24 rounded-lg border border-transparent px-1 py-0.5 text-right font-extrabold hover:border-slate-200 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-600/10"
                />
              </span>
            </div>

            {expanded ? (
              <>
                <div className="mt-4">
                  <span className="od-label">Treated teeth</span>
                  <ul className="mt-2 flex flex-col gap-1.5">
                    {item.teeth.map((tooth) => (
                      <li
                        key={tooth.id}
                        className="flex items-center gap-2 text-[13px] font-semibold text-ink"
                      >
                        <span className="h-2 w-2 rounded-full bg-success" />
                        {tooth.label}
                      </li>
                    ))}
                  </ul>
                </div>

                <hr className="mt-4 border-slate-100" />

                <Section
                  icon={<Wrench className="h-4 w-4" />}
                  title="Component used"
                  subtitle="Every part component used for patient for treatment"
                >
                  {item.components.map((component) => (
                    <div
                      key={component.id}
                      className="flex flex-wrap items-center justify-between gap-3"
                    >
                      <span className="min-w-0">
                        <span className="block text-[13.5px] font-semibold text-ink">
                          {component.name}
                        </span>
                        <span
                          className={cn(
                            "block text-[11.5px]",
                            component.free ? "text-danger" : "text-ink-soft"
                          )}
                        >
                          {component.note}
                        </span>
                      </span>
                      <span className="flex items-center gap-3">
                        <Counter
                          value={component.qty}
                          min={0}
                          onChange={(qty) =>
                            patch(item.id, (current) => ({
                              ...current,
                              components: current.components.map((entry) =>
                                entry.id === component.id ? { ...entry, qty } : entry
                              ),
                            }))
                          }
                        />
                        <span className="text-[12px] text-ink-soft">{component.left} left</span>
                      </span>
                    </div>
                  ))}

                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<Plus className="h-3.5 w-3.5" />}
                    className="w-fit text-brand-600"
                    onClick={() =>
                      patch(item.id, (current) => ({
                        ...current,
                        components: [
                          ...current.components,
                          {
                            id: `c${Date.now()}`,
                            name: "New component",
                            note: "",
                            qty: 1,
                            left: 0,
                            free: 0,
                          },
                        ],
                      }))
                    }
                  >
                    Add component
                  </Button>
                </Section>

                <hr className="mt-4 border-slate-100" />

                <Section
                  icon={<Pill className="h-4 w-4" />}
                  title="Medicine"
                  subtitle="You can add some medicine for your patient"
                >
                  {item.medicine.map((medicine) => (
                    <div key={medicine.id} className="flex flex-col gap-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <Select
                          className="h-10 max-w-[240px] flex-1 text-[13px]"
                          value={medicine.name}
                          onChange={(event) =>
                            patch(item.id, (current) => ({
                              ...current,
                              medicine: current.medicine.map((entry) =>
                                entry.id === medicine.id
                                  ? { ...entry, name: event.target.value }
                                  : entry
                              ),
                            }))
                          }
                        >
                          {MEDICINE_OPTIONS.map((option) => (
                            <option key={option}>{option}</option>
                          ))}
                        </Select>
                        <Counter
                          value={medicine.qty}
                          min={0}
                          onChange={(qty) =>
                            patch(item.id, (current) => ({
                              ...current,
                              medicine: current.medicine.map((entry) =>
                                entry.id === medicine.id ? { ...entry, qty } : entry
                              ),
                            }))
                          }
                        />
                        <span className="text-[12px] text-ink-soft">{medicine.left} left</span>
                        <button
                          type="button"
                          aria-label="Remove medicine"
                          onClick={() =>
                            patch(item.id, (current) => ({
                              ...current,
                              medicine: current.medicine.filter((entry) => entry.id !== medicine.id),
                            }))
                          }
                          className="rounded-lg p-1.5 text-ink-faint transition hover:bg-danger-soft hover:text-danger"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <Checkbox
                        label="Paid medicine"
                        checked={medicine.paid}
                        onChange={() =>
                          patch(item.id, (current) => ({
                            ...current,
                            medicine: current.medicine.map((entry) =>
                              entry.id === medicine.id ? { ...entry, paid: !entry.paid } : entry
                            ),
                          }))
                        }
                      />
                    </div>
                  ))}

                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<Plus className="h-3.5 w-3.5" />}
                    className="w-fit text-brand-600"
                    onClick={() =>
                      patch(item.id, (current) => ({
                        ...current,
                        medicine: [
                          ...current.medicine,
                          {
                            id: `m${Date.now()}`,
                            name: MEDICINE_OPTIONS[0],
                            qty: 1,
                            left: 0,
                            paid: false,
                          },
                        ],
                      }))
                    }
                  >
                    Add medicine
                  </Button>
                </Section>
              </>
            ) : null}
          </div>
        );
      })}

      <div className="mt-4 flex items-center justify-between rounded-2xl bg-slate-50 px-5 py-4">
        <span className="text-[14px] font-bold text-ink">Total</span>
        <span className="text-[18px] font-extrabold text-ink">{formatMoney(total)}</span>
      </div>
    </Modal>
  );
}
