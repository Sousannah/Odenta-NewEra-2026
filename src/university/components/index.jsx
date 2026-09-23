import { Fragment } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  CircleSlash,
  Clock3,
  FileSignature,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/Stepper";
import { Caption } from "@/components/ui/Card";
import { QrCode } from "@/components/ui/QrCode";
import {
  LAB_REQUEST_STATUSES,
  PROCEDURE_REQUEST_STATUSES,
  REVIEW_STATUS,
  academicYearLabel,
  caseStatusMeta,
  departmentMeta,
  reviewStatusMeta,
} from "@/config/academic";

/* ---------------------------------------------------------------- badges */

/** One place that renders a review status, so the queue and the case agree. */
export function ReviewStatusBadge({ status, className }) {
  const meta = reviewStatusMeta(status);
  const ICONS = {
    [REVIEW_STATUS.PENDING]: <Clock3 className="h-3 w-3" />,
    [REVIEW_STATUS.ACCEPTED]: <BadgeCheck className="h-3 w-3" />,
    [REVIEW_STATUS.RETURNED]: <RotateCcw className="h-3 w-3" />,
    [REVIEW_STATUS.REJECTED]: <CircleSlash className="h-3 w-3" />,
    [REVIEW_STATUS.DRAFT]: <FileSignature className="h-3 w-3" />,
  };
  return (
    <Badge tone={meta.tone} className={className}>
      {ICONS[status] ?? null}
      {meta.label}
    </Badge>
  );
}

export function CaseStatusBadge({ status, className }) {
  const meta = caseStatusMeta(status);
  return (
    <Badge tone={meta.tone} className={className}>
      {meta.label}
    </Badge>
  );
}

export function LabStatusBadge({ status, className }) {
  const meta = LAB_REQUEST_STATUSES.find((item) => item.value === status) ?? {
    label: status,
    tone: "neutral",
  };
  return (
    <Badge tone={meta.tone} className={className}>
      {meta.label}
    </Badge>
  );
}

export function RequestStatusBadge({ status, className }) {
  const meta = PROCEDURE_REQUEST_STATUSES.find((item) => item.value === status) ?? {
    label: status,
    tone: "neutral",
  };
  return (
    <Badge tone={meta.tone} className={className}>
      {meta.label}
    </Badge>
  );
}

/** Department chip — the same colour wherever a rotation is named. */
export function DepartmentChip({ department, className, short = false }) {
  const meta = departmentMeta(department);
  return (
    <Badge tone={meta.tone} className={className}>
      {short ? meta.short : meta.label}
    </Badge>
  );
}

export function AcademicYearChip({ year, className }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-bold text-ink-muted",
        className
      )}
    >
      {academicYearLabel(year)}
    </span>
  );
}

/* --------------------------------------------------------------- progress */

/**
 * Requirement progress as a ring.
 *
 * A rotation is passed on a quota, so "17 of 24" is the number a student and
 * their supervisor both look for first — the ring is there to make the gap
 * visible at a glance, not to be decorative.
 */
export function ProgressRing({ value = 0, size = 92, stroke = 9, label, sublabel, tone = "brand" }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, Number(value) || 0));
  const dash = (clamped / 100) * circumference;

  const COLOURS = {
    brand: "#0077B6",
    accent: "#20B2AA",
    success: "#2BB673",
    warning: "#F5A623",
    danger: "#E4576B",
  };

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#E2ECF2"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={COLOURS[tone] ?? COLOURS.brand}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference - dash}`}
            className="transition-[stroke-dasharray] duration-700 ease-out"
          />
        </svg>
        <span className="absolute inset-0 flex flex-col items-center justify-center">
          {/* the ring is used from 46px (a list row) to 128px (a KPI card) */}
          <span
            className="font-extrabold leading-none text-ink"
            style={{ fontSize: Math.max(10, Math.round(size * 0.2)) }}
          >
            {clamped}%
          </span>
          {sublabel && size >= 80 ? (
            <span className="mt-0.5 text-[10px] font-bold text-ink-soft">{sublabel}</span>
          ) : null}
        </span>
      </div>
      {label ? (
        <span className="text-center text-[11.5px] font-bold text-ink-muted">{label}</span>
      ) : null}
    </div>
  );
}

/** A department's quota as a labelled bar — the requirements screen's row. */
export function RequirementBar({ department, required, completed, className }) {
  const meta = departmentMeta(department);
  const percent = required ? Math.round((completed / required) * 100) : 0;
  const tone = percent >= 100 ? "success" : percent >= 50 ? "brand" : "warning";

  return (
    <div className={cn("min-w-0", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="truncate text-[13px] font-bold text-ink">{meta.label}</span>
        <span className="shrink-0 text-[12px] font-bold text-ink-muted">
          {completed}
          <span className="text-ink-faint"> / {required}</span>
        </span>
      </div>
      <ProgressBar value={percent} tone={tone} className="mt-2" />
    </div>
  );
}

/* ------------------------------------------------------------- case chrome */

/**
 * The medical flags that must be read before a student touches the patient.
 * Rendered wherever a case is opened — a warning nobody sees is not a warning.
 */
export function CaseAlerts({ item, className, compact = false }) {
  const flags = [
    ...(item?.medicalFlags ?? []),
    ...(item?.allergies ?? []).map((allergy) => ({ key: `allergy-${allergy}`, label: `${allergy} allergy`, tone: "danger" })),
  ];
  if (!item?.consentSigned) {
    flags.unshift({ key: "consent", label: "Consent not signed", tone: "warning" });
  }
  if (!flags.length) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {!compact ? (
        <AlertTriangle className="h-4 w-4 shrink-0 text-warning" />
      ) : null}
      {flags.map((flag) => (
        <Badge key={flag.key ?? flag.label} tone={flag.tone ?? "warning"}>
          {flag.label}
        </Badge>
      ))}
    </div>
  );
}

/** Label / value pairs laid out in a responsive grid. */
export function DetailGrid({ items = [], columns = 3, className }) {
  const cols = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-3", 4: "sm:grid-cols-2 lg:grid-cols-4" };
  return (
    <dl className={cn("grid grid-cols-1 gap-x-6 gap-y-4", cols[columns] ?? cols[3], className)}>
      {items.map((item) => (
        <Fragment key={item.label}>
          <div className="min-w-0">
            <Caption>{item.label}</Caption>
            <dd className="mt-1 break-words text-[13.5px] font-semibold text-ink">
              {item.value ?? "—"}
            </dd>
          </div>
        </Fragment>
      ))}
    </dl>
  );
}

/**
 * The teaching clinic's patient card — the physical card a patient carries
 * between visits, rendered so it can be printed straight from the browser.
 *
 * Every card is the same height, and that is a requirement rather than
 * styling: these are laid out in a grid and printed a page at a time, and a
 * grid of cards that each size to their own content reads as a mess and cuts
 * unpredictably across an A4 page. The four detail slots are fixed, the name
 * is clamped to two lines, and nothing else is allowed to grow — which is
 * also why the medical flags are gone. They were the one variable-height
 * thing on the card, they were printed on something a patient carries in a
 * wallet, and the people who act on them read them at the chair.
 *
 * The QR is the card's own share link. A patient who has the card can always
 * reopen it, and a dentist they are referred to can read who is treating
 * them without an account.
 */
export function PatientCard({ item, campus, shareUrl, className }) {
  return (
    <article
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card",
        className
      )}
    >
      <header className="flex items-center justify-between gap-3 bg-od-gradient px-4 py-3.5 text-white sm:px-5">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-extrabold">{campus?.shortName ?? "AIU"} Dental Clinic</p>
          <p className="truncate text-[10.5px] font-semibold uppercase tracking-[0.12em] text-white/80">
            Patient card
          </p>
        </div>
        <span className="shrink-0 rounded-lg bg-white/15 px-2.5 py-1 text-[11px] font-extrabold">
          {item.cardNumber ?? "NOT ISSUED"}
        </span>
      </header>

      <div className="flex flex-1 flex-col gap-3 px-4 py-4 sm:px-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {/* Two lines, then an ellipsis — a long name must not be what
                decides how tall this card is. */}
            <span className="line-clamp-2 text-[16px] font-extrabold leading-tight text-ink sm:text-[17px]">
              {item.patientName}
            </span>
            <p className="mt-1 truncate text-[12px] text-ink-soft">
              {item.age} yrs · {item.gender} · {item.nationalId}
            </p>
          </div>
          {shareUrl ? (
            <QrCode
              value={shareUrl}
              size={56}
              title={`Card for ${item.patientName}`}
              className="shrink-0 border border-slate-200"
            />
          ) : null}
        </div>

        <dl className="mt-auto grid grid-cols-2 gap-x-4 gap-y-3">
          {[
            { label: "Department", value: departmentMeta(item.department).label },
            { label: "Clinic", value: item.chair ?? "—" },
            { label: "Student", value: item.studentName ?? "Unallocated" },
            { label: "Student ID", value: item.studentNumber ?? "—" },
          ].map((entry) => (
            <div key={entry.label} className="min-w-0">
              <Caption>{entry.label}</Caption>
              <dd className="mt-1 truncate text-[13px] font-semibold text-ink">{entry.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <footer className="flex items-center justify-between border-t border-slate-100 px-4 py-2.5 text-[11px] font-semibold text-ink-soft sm:px-5">
        <span>Visits: {item.visits}</span>
        <span>Opened {item.openedAt}</span>
      </footer>
    </article>
  );
}
