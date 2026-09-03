import { useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronRight,
  FileText,
  Hourglass,
  Image as ImageIcon,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";
import { SegmentedControl } from "@/components/ui/Tabs";
import { IconButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  DEFAULT_LEGEND,
  Odontogram,
  OdontogramLegend,
  formatSurfaces,
  toothFullName,
} from "@/components/dental";
import { conditionByValue } from "@/config/dentalStandards";

/* --------------------------------------------------------------- shell */

export function SidePanel({ title, onClose, children, className }) {
  return (
    <section
      className={cn(
        "flex h-full min-w-0 flex-1 animate-fade-in flex-col border-r border-slate-200 bg-white",
        className
      )}
    >
      <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-6 py-4">
        <h3 className="text-lg font-bold text-ink">{title}</h3>
        <IconButton
          label="Close panel"
          size="sm"
          onClick={onClose}
          className="bg-slate-100 text-ink-muted hover:bg-slate-200"
        >
          <ChevronRight className="h-4 w-4" />
        </IconButton>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>
    </section>
  );
}

/* ----------------------------------------------------- chart → findings */

/**
 * Collapses a list of chart entries into the `findings` map the odontogram
 * wants. Completed work reads blue, planned work amber, live findings pink.
 */
export function chartToFindings(chart = []) {
  const findings = {};
  chart.forEach((entry) => {
    const tone =
      entry.condition === "missing"
        ? "missing"
        : entry.status === "completed"
          ? "treated"
          : entry.status === "planned"
            ? "planned"
            : "danger";

    const current = findings[entry.tooth] ?? { surfaces: {} };
    const surfaces = { ...current.surfaces };
    (entry.surfaces ?? []).forEach((surface) => {
      surfaces[surface] = tone;
    });

    findings[entry.tooth] = {
      tone: current.tone === "danger" ? "danger" : tone,
      surfaces,
    };
  });
  return findings;
}

/* ----------------------------------------------------- medical record ---- */

export function MedicalRecordPanel({ chart = [], onClose }) {
  const [service, setService] = useState("medical");

  const filtered = useMemo(
    () =>
      chart.filter((entry) =>
        service === "cosmetic"
          ? ["restoration", "crown", "implant"].includes(entry.condition)
          : true
      ),
    [chart, service]
  );

  const findings = useMemo(() => chartToFindings(filtered), [filtered]);

  return (
    <SidePanel title="Medical Record" onClose={onClose}>
      <div className="flex justify-center">
        <SegmentedControl
          value={service}
          onChange={setService}
          options={[
            { value: "medical", label: "Medical" },
            { value: "cosmetic", label: "Cosmetic" },
          ]}
        />
      </div>

      <div className="mx-auto mt-4 max-w-[420px]">
        <Odontogram
          findings={findings}
          readOnly
          surfaceMode
          legend={<OdontogramLegend items={DEFAULT_LEGEND} />}
        />
      </div>

      {filtered.length ? (
        <ul className="mt-5 flex flex-col gap-2">
          {filtered.map((entry) => {
            const condition = conditionByValue(entry.condition);
            return (
              <li
                key={entry.id}
                className="flex items-start gap-3 rounded-xl border border-slate-200 px-3.5 py-3"
              >
                <span className="flex h-7 min-w-[34px] items-center justify-center rounded-lg bg-slate-100 text-[12px] font-bold text-ink">
                  {entry.tooth}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-bold text-ink">
                    {condition?.label ?? entry.condition}
                    {entry.surfaces?.length ? ` · ${formatSurfaces(entry.surfaces)}` : ""}
                  </span>
                  <span className="block text-[11.5px] text-ink-soft">
                    {toothFullName(entry.tooth)}
                    {entry.code ? ` · ${entry.code}` : ""} · {formatDate(entry.date, "d MMM yyyy")}
                  </span>
                  {entry.note ? (
                    <span className="mt-1 block text-[12px] text-ink-muted">{entry.note}</span>
                  ) : null}
                </span>
                <Badge tone={entry.status === "completed" ? "success" : entry.status === "planned" ? "warning" : "neutral"}>
                  {entry.status}
                </Badge>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState title="No chart entries" description="Nothing recorded for this service yet." />
      )}
    </SidePanel>
  );
}

/* -------------------------------------------------------- attachments ---- */

const THUMB_TONE = {
  image: "bg-[#D9F7F1] text-[#0E9F8A]",
  pdf: "bg-[#FDE2E4] text-[#D5364C]",
};

export function AttachmentPanel({ attachments = [], onClose }) {
  return (
    <SidePanel title="Attachment" onClose={onClose}>
      {attachments.length === 0 ? (
        <EmptyState
          title="No attachments yet"
          description="Photos, radiographs and consent forms added to this patient appear here."
        />
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {attachments.map((file) => (
            <figure key={file.id} className="overflow-hidden rounded-2xl border border-slate-200">
              <div className="flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-ink-soft">
                {file.type === "image" ? (
                  <ImageIcon className="h-8 w-8" />
                ) : (
                  <FileText className="h-8 w-8" />
                )}
              </div>
              <figcaption className="flex items-center gap-2.5 px-3 py-2.5">
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                    THUMB_TONE[file.type] ?? THUMB_TONE.pdf
                  )}
                >
                  {file.type === "image" ? (
                    <ImageIcon className="h-4 w-4" />
                  ) : (
                    <FileText className="h-4 w-4" />
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[12.5px] font-semibold text-ink">
                    {file.name}
                  </span>
                  {file.note ? (
                    <span className="block truncate text-[11px] text-ink-soft">{file.note}</span>
                  ) : (
                    <button
                      type="button"
                      className="flex items-center gap-1 text-[12px] font-semibold text-brand-600 hover:text-brand-800"
                    >
                      <Plus className="h-3 w-3" /> Add notes
                    </button>
                  )}
                </span>
                {file.kind ? <Badge tone="outline">{file.kind}</Badge> : null}
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </SidePanel>
  );
}

/* ---------------------------------------------------- next treatments ---- */

function VisitCard({ visit }) {
  const done = visit.state === "done";
  return (
    <div className="flex gap-4">
      <div className="flex w-12 shrink-0 flex-col items-center">
        <span className="text-[11px] font-bold uppercase text-ink-soft">
          {formatDate(visit.date, "MMM")}
        </span>
        <span className="text-[18px] font-extrabold text-ink">{formatDate(visit.date, "dd")}</span>
      </div>

      <div className="relative flex-1 pb-5">
        <span
          className={cn(
            "absolute -left-[26px] top-2 h-2.5 w-2.5 rounded-full ring-4 ring-white",
            done ? "bg-success" : "bg-slate-300"
          )}
        />
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-[14px] font-bold text-ink">
                {visit.visit ? `Visit #${visit.visit} - ` : ""}
                {visit.title}
              </div>
              <div className="mt-0.5 text-[12px] text-ink-soft">
                {visit.appointmentId ? `ID reservation: #${visit.appointmentId}` : "Not booked yet"}
              </div>
            </div>
            <span
              className={cn(
                "flex shrink-0 items-center gap-1.5 text-[12px] font-bold",
                done ? "text-success-strong" : "text-brand-600"
              )}
            >
              {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Hourglass className="h-3.5 w-3.5" />}
              {done ? "Done" : visit.state === "planned" ? "Planned" : "Upcoming"}
            </span>
          </div>

          <hr className="my-3 border-slate-100" />

          <dl className="flex flex-col gap-1.5 text-[12px]">
            <div className="flex gap-3">
              <dt className="w-16 shrink-0 font-bold uppercase tracking-wide text-ink-soft">Time</dt>
              <dd className="font-semibold text-ink">{visit.time}</dd>
            </div>
            <div className="flex gap-3">
              <dt className="w-16 shrink-0 font-bold uppercase tracking-wide text-ink-soft">
                Dentist
              </dt>
              <dd className="truncate font-semibold text-ink">{visit.dentist}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}

export function NextTreatmentsPanel({ plans = [], onClose }) {
  return (
    <SidePanel title="Next Treatments" onClose={onClose}>
      {plans.length === 0 ? (
        <EmptyState
          title="No treatment plan"
          description="Multi-visit plans created for this patient will be listed here."
        />
      ) : (
        <div className="flex flex-col gap-6">
          {plans.map((plan) => (
            <div key={plan.id} className="rounded-2xl bg-slate-50/80 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-[15px] font-bold text-ink">{plan.treatment}</h4>
                <span className="rounded-md bg-slate-200 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-ink-muted">
                  {plan.type}
                </span>
                {!plan.consentSigned ? <Badge tone="warning">Consent pending</Badge> : null}
              </div>
              <p className="mt-0.5 text-[12px] text-ink-soft">
                Total treatment: {plan.completedVisits}/{plan.totalVisits} visit
              </p>

              <div className="mt-4 border-l-2 border-slate-200 pl-6">
                {plan.visits.map((visit) => (
                  <VisitCard key={`${plan.id}-${visit.visit}-${visit.date}`} visit={visit} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </SidePanel>
  );
}
