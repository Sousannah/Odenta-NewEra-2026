import {
  CheckCircle2,
  CircleDollarSign,
  CircleSlash,
  Hourglass,
  LogIn,
  UserRound,
  XCircle,
} from "lucide-react";
import { APPOINTMENT_FLOW } from "@/config/domain";

/**
 * Visual language for an appointment block on the calendar.
 * A finished-but-unpaid visit reads differently from a settled one, which is
 * why payment status feeds into the look as well.
 */
export function appointmentAppearance(appointment) {
  const unpaid = appointment.paymentStatus !== "PAID";

  switch (appointment.status) {
    case "finished":
      return unpaid
        ? {
            card: "bg-[#FDECF2] border-l-[3px] border-danger",
            badge: "bg-danger text-white",
            chipTone: "success",
            icon: CircleDollarSign,
            pill: "bg-white border-danger/20",
          }
        : {
            card: "bg-success-soft border-l-[3px] border-success",
            badge: "bg-success text-white",
            chipTone: "success",
            icon: CheckCircle2,
            pill: "bg-white border-success/20",
          };
    case "encounter":
      return {
        card: "bg-[#E4EDFB] border-l-[3px] border-brand-500",
        badge: "bg-brand-600 text-white",
        chipTone: "warning",
        icon: UserRound,
        pill: "bg-white border-brand-200",
      };
    case "arrived":
      return {
        card: "bg-[#EAF1FE] border-l-[3px] border-brand-400",
        badge: "bg-brand-500 text-white",
        chipTone: "brand",
        icon: LogIn,
        pill: "bg-white border-brand-200",
      };
    case "waiting":
      return {
        card: "bg-warning-soft od-hatch border-l-[3px] border-warning",
        badge: "bg-warning text-white",
        chipTone: "warning",
        icon: Hourglass,
        pill: "bg-white border-warning/30",
      };
    case "cancelled":
      return {
        card: "bg-slate-100 od-hatch-slate border-l-[3px] border-slate-300",
        badge: "bg-slate-400 text-white",
        chipTone: "danger",
        icon: XCircle,
        pill: "bg-white border-slate-200",
      };
    case "no_show":
      return {
        card: "bg-slate-50 od-hatch-slate border-l-[3px] border-slate-300",
        badge: "bg-slate-400 text-white",
        chipTone: "neutral",
        icon: CircleSlash,
        pill: "bg-white border-slate-200",
      };
    default:
      return {
        card: "bg-[#EEF2F9] border-l-[3px] border-slate-400",
        badge: "bg-slate-500 text-white",
        chipTone: "info",
        icon: UserRound,
        pill: "bg-white border-slate-200",
      };
  }
}

export const STATUS_OPTIONS = [
  { value: "registered", label: "Registered", dot: "bg-slate-400" },
  { value: "arrived", label: "Arrived", dot: "bg-brand-500" },
  { value: "encounter", label: "Encounter", dot: "bg-warning" },
  { value: "waiting", label: "Waiting Payment", dot: "bg-warning" },
  { value: "finished", label: "Finished", dot: "bg-success" },
  { value: "cancelled", label: "Cancelled", dot: "bg-danger" },
  { value: "no_show", label: "No show", dot: "bg-slate-300" },
];

/** How far through the visit flow a status sits, for the progress strip. */
export const flowProgress = (status) => {
  const index = APPOINTMENT_FLOW.indexOf(status);
  if (index < 0) return 0;
  return ((index + 1) / APPOINTMENT_FLOW.length) * 100;
};
