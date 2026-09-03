import { useState } from "react";
import { CheckCircle2, CircleSlash } from "lucide-react";
import { cn } from "@/lib/cn";
import { useToast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, Textarea } from "@/components/ui/Field";
import { Caption } from "@/components/ui/Card";
import { toothName } from "@/components/dental";

function DoneToggle({ value, onChange }) {
  return (
    <div className="flex shrink-0 gap-2">
      <button
        type="button"
        onClick={() => onChange(true)}
        className={cn(
          "flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-[13px] font-semibold transition",
          value === true
            ? "border-brand-600 bg-brand-50 text-brand-700"
            : "border-slate-200 bg-white text-ink-muted hover:border-slate-300"
        )}
      >
        <CheckCircle2 className="h-3.5 w-3.5" /> Done
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={cn(
          "flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-[13px] font-semibold transition",
          value === false
            ? "border-danger bg-danger-soft text-danger"
            : "border-slate-200 bg-white text-ink-muted hover:border-slate-300"
        )}
      >
        <CircleSlash className="h-3.5 w-3.5" /> Not Done
      </button>
    </div>
  );
}

function ServiceRow({ badge, label, value, onChange, reason, onReasonChange }) {
  return (
    <div className="border-t border-slate-100 first:border-t-0">
      <div className="flex flex-wrap items-center justify-between gap-3 py-3">
        <span className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-6 items-center gap-1 rounded-md bg-slate-100 px-2 text-[11px] font-bold text-ink">
            {badge}
          </span>
          <span className="truncate text-[14px] font-semibold text-ink">{label}</span>
        </span>
        <DoneToggle value={value} onChange={onChange} />
      </div>

      {value === false ? (
        <Field label="Reason" className="pb-3" counter={`${(reason ?? "").length} / 200`}>
          <Textarea
            rows={2}
            maxLength={200}
            placeholder="Type a reason ..."
            value={reason ?? ""}
            onChange={(event) => onReasonChange(event.target.value)}
          />
        </Field>
      ) : null}
    </div>
  );
}

/**
 * Records what was actually performed during the visit, per tooth / per arch.
 * `services` is [{ id, name, kind: "treatment" | "cosmetic", targets: [{ id, badge, label }] }]
 */
export function MedicalRecordModal({ open, onClose, services = [], onSaved }) {
  const [state, setState] = useState({});
  const toast = useToast();

  const setTarget = (key, patch) =>
    setState((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));

  const treatments = services.filter((service) => service.kind !== "cosmetic");
  const cosmetics = services.filter((service) => service.kind === "cosmetic");

  const renderGroup = (group) =>
    group.map((service) => (
      <div key={service.id} className="od-card mt-2 px-4 py-1">
        <h4 className="border-b border-slate-100 py-3 text-[15px] font-bold text-ink">
          {service.name}
        </h4>
        {service.targets.map((target) => {
          const key = `${service.id}:${target.id}`;
          return (
            <ServiceRow
              key={key}
              badge={target.badge}
              label={target.label}
              value={state[key]?.done}
              onChange={(done) => setTarget(key, { done })}
              reason={state[key]?.reason}
              onReasonChange={(reason) => setTarget(key, { reason })}
            />
          );
        })}
      </div>
    ));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Medical Record"
      size="lg"
      closeIcon="chevron"
      bodyClassName="bg-slate-50/60 px-6 py-5"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} className="min-w-[120px]">
            Cancel
          </Button>
          <Button
            className="min-w-[160px]"
            onClick={() => {
              onSaved?.(state);
              toast.success("Medical record saved successfully", "You can also edit medical records");
              onClose();
            }}
          >
            Save Record
          </Button>
        </>
      }
    >
      {treatments.length ? (
        <>
          <Caption>Treatment service</Caption>
          {renderGroup(treatments)}
        </>
      ) : null}

      {cosmetics.length ? (
        <>
          <Caption className="mt-6 block">Cosmetic service</Caption>
          {renderGroup(cosmetics)}
        </>
      ) : null}
    </Modal>
  );
}

/** Builds the default service list for a visit from the patient's planned chart entries. */
export function buildServices(appointment, chart = []) {
  const planned = chart.filter((entry) => entry.status === "planned");

  const services = [
    {
      id: "svc-treatment",
      name: appointment?.treatment ?? "Treatment",
      kind: "treatment",
      targets: planned.length
        ? planned.map((entry) => ({
            id: entry.tooth,
            badge: entry.tooth,
            label: toothName(entry.tooth),
          }))
        : [{ id: "arch", badge: "Q1 Q2", label: "Maxilla" }],
    },
  ];

  const cosmetic = chart.filter((entry) =>
    ["restoration", "crown", "implant"].includes(entry.condition)
  );

  if (cosmetic.length) {
    services.push({
      id: "svc-cosmetic",
      name: "Tooth Scaling",
      kind: "cosmetic",
      targets: [
        { id: "maxilla", badge: "Q1 Q2", label: "Maxilla" },
        { id: "mandible", badge: "Q3 Q4", label: "Mandible" },
      ],
    });
  }

  return services;
}
