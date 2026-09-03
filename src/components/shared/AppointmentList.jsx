import { Clock } from "lucide-react";
import { cn } from "@/lib/cn";
import { toClockLabel } from "@/lib/time";
import { APPOINTMENT_STATUS } from "@/config/domain";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { PatientAlerts } from "./PatientAlerts";

/**
 * Compact "today" list shared by the dentist, assistant and front-desk
 * dashboards. Each role passes its own action renderer.
 */
export function AppointmentList({
  appointments = [],
  onSelect,
  renderAction,
  showDentist = false,
  emptyTitle = "Nothing booked",
  emptyDescription = "Appointments will appear here as they are booked.",
  className,
}) {
  if (!appointments.length) {
    return <EmptyState title={emptyTitle} description={emptyDescription} className="py-12" />;
  }

  return (
    <ul className={cn("flex flex-col", className)}>
      {appointments.map((item) => {
        const status = APPOINTMENT_STATUS[item.status] ?? APPOINTMENT_STATUS.registered;
        return (
          <li
            key={item.id}
            className="flex flex-wrap items-center gap-3 border-b border-slate-100 py-3 last:border-b-0"
          >
            <span className="flex w-[104px] shrink-0 items-center gap-1.5 text-[12px] font-bold text-ink-muted">
              <Clock className="h-3.5 w-3.5 text-ink-faint" />
              {toClockLabel(item.start)}
            </span>

            <button
              type="button"
              onClick={onSelect ? () => onSelect(item) : undefined}
              className={cn(
                "flex min-w-0 flex-1 items-center gap-3 text-left",
                onSelect && "cursor-pointer"
              )}
            >
              <Avatar name={item.patientName} size="sm" />
              <span className="min-w-0">
                <span className="flex items-center gap-2">
                  <span className="truncate text-[13.5px] font-bold text-ink">
                    {item.patientName}
                  </span>
                  <PatientAlerts patient={{ alerts: item.patientAlerts }} compact />
                </span>
                <span className="block truncate text-[12px] text-ink-soft">
                  {item.treatment}
                  {showDentist && item.dentistName ? ` · ${item.dentistName}` : ""}
                  {item.room ? ` · ${item.room}` : ""}
                </span>
              </span>
            </button>

            <Badge tone={status.tone}>{status.label}</Badge>

            {renderAction ? <span className="shrink-0">{renderAction(item)}</span> : null}
          </li>
        );
      })}
    </ul>
  );
}
