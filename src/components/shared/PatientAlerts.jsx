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

  /**
   * "Not checked" is not "nothing to report".
   *
   * `alerts: []` means the record was read and is clear. `alerts: null` means
   * it was not read — a medical document that would not open, or a record the
   * caller was not able to fetch. Coalescing the second into the first made
   * this component render the green *"No medical alerts recorded — ASA I, no
   * known allergies"* banner for a patient nobody had checked, and return
   * nothing at all in `compact` mode.
   *
   * That is the one failure a medical alert strip cannot have: it is read
   * immediately before somebody picks up a handpiece, and silence has to mean
   * silence rather than ignorance. So an entirely absent history is called out
   * instead of reassured about.
   *
   * All three fields must be absent to count as unchecked — a real record with
   * no alerts still carries `[]` and an ASA class, and treating that as unknown
   * would cry wolf on every healthy patient.
   */
  /**
   * An explicit answer beats inferring one, where the caller has it.
   *
   * `GET /patients/:id/record` knows whether a medical history document exists
   * and says so in `medicalReviewed`, so that flag decides. Everywhere else —
   * a patient list row, an appointment card — there is no flag, and the
   * all-three-null heuristic below is the only signal available.
   *
   * Preferring the flag is not belt and braces; it removes a second source of
   * truth. The heuristic and the flag can disagree: a history somebody opened,
   * reviewed and saved with nothing in it *could* in principle come back with
   * three nulls and be reported as unchecked. Today the server's merge always
   * writes empty arrays so they happen to agree, but "they agree because of how
   * a default is written three layers away" is exactly the kind of coincidence
   * that stops being true without anybody noticing.
   */
  const unchecked =
    patient?.medicalReviewed === undefined
      ? patient?.alerts == null && patient?.allergies == null && patient?.asa == null
      : patient.medicalReviewed === false;

  if (compact) {
    if (unchecked) {
      return (
        <span className={cn("inline-flex items-center gap-1.5", className)}>
          <AlertTriangle className="h-3.5 w-3.5 text-warning" />
          <span className="text-[11px] font-bold text-warning">history not checked</span>
        </span>
      );
    }
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

  /* Checked before `nothing`, because an unchecked record satisfies both and
     the reassuring answer must never win. */
  if (unchecked) {
    return (
      <div className={cn("rounded-2xl border border-warning/30 bg-warning-soft px-4 py-3", className)}>
        <p className="flex items-center gap-2 text-[13px] font-semibold text-warning-ink">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Medical history not checked — confirm allergies and premedication before treating.
        </p>
      </div>
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
        <p className="mt-2.5 text-[12.5px] font-medium text-danger-ink">{patient.note}</p>
      ) : null}

      {patient?.medications?.length ? (
        <p className="mt-1.5 text-[12px] text-danger-ink/80">
          Medications: {patient.medications.join(" · ")}
        </p>
      ) : null}
    </div>
  );
}
