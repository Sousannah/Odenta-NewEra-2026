import { AlertTriangle, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/cn";
import { ASA_CLASSES, alertMeta } from "@/config/dentalStandards";
import { Badge } from "@/components/ui/Badge";

/**
 * Medical alert strip.
 *
 * Anything that changes how a clinician treats today — anticoagulants,
 * prophylaxis, allergies, ASA class — belongs above the fold, not three
 * clicks into a record.
 */
export function PatientAlerts({ patient, className, compact = false }) {
  const alerts = patient?.alerts ?? [];
  const allergies = patient?.allergies ?? [];
  const asa = ASA_CLASSES.find((item) => item.value === patient?.asa);
  const nothing = !alerts.length && !allergies.length && (!asa || asa.value === "I");

  if (compact) {
    if (!alerts.length && !allergies.length) return null;
    return (
      <span className={cn("inline-flex items-center gap-1.5", className)}>
        <AlertTriangle className="h-3.5 w-3.5 text-danger" />
        <span className="text-[11px] font-bold text-danger">
          {alerts.length + allergies.length} alert{alerts.length + allergies.length === 1 ? "" : "s"}
        </span>
      </span>
    );
  }

  if (nothing) {
    return (
      <div className={cn("rounded-2xl bg-success-soft px-4 py-3", className)}>
        <p className="text-[13px] font-semibold text-success-strong">
          No medical alerts recorded — ASA I, no known allergies.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("rounded-2xl border border-danger/25 bg-danger-soft px-4 py-3.5", className)}>
      <div className="flex items-center gap-2">
        <ShieldAlert className="h-4 w-4 text-danger" />
        <span className="text-[13px] font-extrabold uppercase tracking-wide text-danger">
          Medical alerts
        </span>
        {asa ? <Badge tone={asa.tone}>{asa.label}</Badge> : null}
      </div>

      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {allergies.map((allergy) => (
          <Badge key={allergy} tone="danger">
            Allergy · {allergy}
          </Badge>
        ))}
        {alerts.map((value) => {
          const meta = alertMeta(value);
          return (
            <Badge key={value} tone={meta.tone}>
              {meta.label}
            </Badge>
          );
        })}
      </div>

      {patient?.note ? (
        <p className="mt-2.5 text-[12.5px] font-medium text-[#8C1D3F]">{patient.note}</p>
      ) : null}

      {patient?.medications?.length ? (
        <p className="mt-1.5 text-[12px] text-[#8C1D3F]/80">
          Medications: {patient.medications.join(" · ")}
        </p>
      ) : null}
    </div>
  );
}
