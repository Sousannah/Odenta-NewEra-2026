import { useState } from "react";
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
import { ToothChart, ToothLegend } from "@/components/dental";
import { EmptyState } from "@/components/ui/EmptyState";

/* -------------------------------------------------------------- shell */

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

/* ----------------------------------------------------- medical record ---- */

export function MedicalRecordPanel({ record, onClose }) {
  const [arch, setArch] = useState("medical");
  const entries = record?.[arch] ?? [];

  const marks = entries.reduce((acc, entry) => {
    acc[entry.tooth] = entry.state === "treated" ? "treated" : "pending";
    return acc;
  }, {});

  return (
    <SidePanel title="Medical Record" onClose={onClose}>
      <div className="flex justify-center">
        <SegmentedControl
          value={arch}
          onChange={setArch}
          options={[
            { value: "medical", label: "Medical" },
            { value: "cosmetic", label: "Cosmetic" },
          ]}
        />
      </div>

      <div className="mx-auto mt-4 max-w-[420px]">
        <ToothChart
          marks={marks}
          readOnly
          legend={
            <ToothLegend
              items={[
                { label: "Has treatment before", color: "#A5B8F7" },
                { label: "Pending Treatment", color: "#FDE3A7" },
              ]}
            />
          }
        />
      </div>

      {entries.length ? (
        <ul className="mt-5 flex flex-col gap-2">
          {entries.map((entry) => (
            <li
              key={entry.tooth}
              className="flex items-start gap-3 rounded-xl border border-slate-200 px-3.5 py-3"
            >
              <span className="flex h-7 min-w-[34px] items-center justify-center rounded-lg bg-slate-100 text-[12px] font-bold text-ink">
                {entry.tooth}
              </span>
              <span className="min-w-0">
                <span className="block text-[13px] font-bold capitalize text-ink">
                  {entry.condition} · {String(entry.action).replace("-", " ")}
                </span>
                {entry.note ? (
                  <span className="block text-[12px] text-ink-muted">{entry.note}</span>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
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
          description="Photos, X-rays and documents added to this visit will appear here."
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
                  <button
                    type="button"
                    className="flex items-center gap-1 text-[12px] font-semibold text-brand-600 hover:text-brand-800"
                  >
                    <Plus className="h-3 w-3" /> Add notes
                  </button>
                </span>
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
                ID reservation: #{visit.reservationId}
              </div>
            </div>
            <span
              className={cn(
                "flex shrink-0 items-center gap-1.5 text-[12px] font-bold",
                done ? "text-success-strong" : "text-brand-600"
              )}
            >
              {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Hourglass className="h-3.5 w-3.5" />}
              {done ? "Done" : "Upcoming"}
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
              <div className="flex items-center gap-2">
                <h4 className="text-[15px] font-bold text-ink">{plan.treatment}</h4>
                <span className="rounded-md bg-slate-200 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-ink-muted">
                  {plan.type}
                </span>
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
