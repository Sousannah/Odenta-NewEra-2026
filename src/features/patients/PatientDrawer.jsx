import { CalendarDays, Mail, MapPin, Phone, X } from "lucide-react";
import { useAsync } from "@/hooks";
import { clinicService } from "@/services";
import { formatDate } from "@/lib/format";
import { Drawer } from "@/components/ui/Modal";
import { Button, IconButton } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { KeyValue } from "@/components/ui/Misc";
import { ToothChart, ToothLegend } from "@/components/dental";

function ContactRow({ icon, children }) {
  return (
    <div className="flex items-center gap-2.5 text-[13px] text-ink-muted">
      <span className="text-ink-soft">{icon}</span>
      <span className="min-w-0 truncate">{children}</span>
    </div>
  );
}

export function PatientDrawer({ open, onClose, patient, onEdit }) {
  const { data: record } = useAsync(
    () => (patient ? clinicService.getDentalRecord(patient.id) : null),
    [patient?.id]
  );
  const { data: plans = [] } = useAsync(
    () => (patient ? clinicService.getTreatmentPlans(patient.id) : []),
    [patient?.id],
    []
  );

  if (!patient) return null;

  const marks = (record?.medical ?? []).reduce((acc, entry) => {
    acc[entry.tooth] = entry.state === "treated" ? "treated" : "pending";
    return acc;
  }, {});

  return (
    <Drawer open={open} onClose={onClose} width="max-w-[520px]">
      <header className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-5">
        <div className="flex min-w-0 items-center gap-3.5">
          <Avatar name={patient.name} size="xl" />
          <div className="min-w-0">
            <h2 className="truncate text-[18px] font-extrabold text-ink">{patient.fullName}</h2>
            <p className="text-[12px] text-ink-soft">
              {patient.id} · {patient.gender} · {patient.age} yrs
            </p>
          </div>
        </div>
        <IconButton label="Close" size="sm" onClick={onClose}>
          <X className="h-4 w-4 text-ink-muted" />
        </IconButton>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        <div className="flex flex-col gap-2.5">
          <ContactRow icon={<Mail className="h-4 w-4" />}>{patient.email}</ContactRow>
          <ContactRow icon={<Phone className="h-4 w-4" />}>{patient.phone}</ContactRow>
          <ContactRow icon={<MapPin className="h-4 w-4" />}>{patient.address}</ContactRow>
          <ContactRow icon={<CalendarDays className="h-4 w-4" />}>
            Registered {formatDate(patient.registered, "d MMM yyyy")} · last visit{" "}
            {formatDate(patient.lastVisited, "d MMM yyyy")}
          </ContactRow>
        </div>

        {patient.note || patient.allergies?.length ? (
          <div className="mt-5 rounded-2xl bg-warning-soft px-4 py-3">
            {patient.note ? (
              <p className="text-[13px] font-semibold text-[#8C6103]">{patient.note}</p>
            ) : null}
            {patient.allergies?.length ? (
              <p className="mt-1 text-[12px] text-[#8C6103]">
                Allergies: {patient.allergies.join(", ")}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="mt-6 grid grid-cols-2 gap-5">
          <KeyValue label="Place & date of birth" value={patient.birthPlace} />
          <KeyValue label="Status" value={<Badge tone={patient.status === "active" ? "success" : "neutral"}>{patient.status}</Badge>} />
        </div>

        <h3 className="mt-7 text-[15px] font-bold text-ink">Dental record</h3>
        <div className="mt-2">
          <ToothChart
            marks={marks}
            readOnly
            legend={
              <ToothLegend
                items={[
                  { label: "Has treatment before", color: "#A5B8F7" },
                  { label: "Pending treatment", color: "#FDE3A7" },
                ]}
              />
            }
          />
        </div>

        <h3 className="mt-7 text-[15px] font-bold text-ink">Treatment plans</h3>
        {plans.length === 0 ? (
          <p className="mt-2 text-[13px] text-ink-soft">No active plan.</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-2">
            {plans.map((plan) => (
              <li
                key={plan.id}
                className="flex items-center justify-between rounded-xl border border-slate-200 px-3.5 py-3"
              >
                <span className="min-w-0">
                  <span className="block truncate text-[13.5px] font-bold text-ink">
                    {plan.treatment}
                  </span>
                  <span className="text-[12px] text-ink-soft">
                    {plan.completedVisits}/{plan.totalVisits} visits
                  </span>
                </span>
                <Badge tone={plan.type === "MULTIPLE" ? "brand" : "neutral"}>{plan.type}</Badge>
              </li>
            ))}
          </ul>
        )}
      </div>

      <footer className="grid grid-cols-2 gap-3 border-t border-slate-100 px-6 py-4">
        <Button variant="secondary" onClick={() => onEdit?.(patient)}>
          Edit patient
        </Button>
        <Button>Book appointment</Button>
      </footer>
    </Drawer>
  );
}
