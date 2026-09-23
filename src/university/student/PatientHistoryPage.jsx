import { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { ArrowDownWideNarrow, ArrowUpWideNarrow, FileText } from "lucide-react";
import { cn } from "@/lib/cn";
import { useAsync } from "@/hooks";
import { universityService } from "@/services";
import { formatDate, formatTime } from "@/lib/format";
import { DEPARTMENTS } from "@/config/academic";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { MiniSelect } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchInput } from "@/components/ui/Misc";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { PageHeader, Toolbar } from "@/components/shared";
import { DepartmentChip } from "@/university/components";

/**
 * Every sheet ever saved for this patient.
 *
 * Sheets are append-only: a new one is written each visit rather than the last
 * being edited, so the history is the treatment narrative. Opening one renders
 * whatever the sheet stored, however deeply nested — a generic renderer,
 * because the section shape varies per rotation and will keep varying.
 */


const humanise = (key) =>
  key.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase()).trim();

const isEmpty = (value) =>
  value == null ||
  value === "" ||
  (Array.isArray(value) && value.length === 0) ||
  (typeof value === "object" && !Array.isArray(value) && Object.keys(value).length === 0);

/** Renders a saved sheet's `sections` object, at whatever depth it nests. */
function SectionTree({ value, depth = 0 }) {
  if (value == null) return null;

  if (Array.isArray(value)) {
    const filled = value.filter((entry) => !isEmpty(entry));
    if (!filled.length) return <span className="text-[13px] text-ink-faint">No items</span>;
    return (
      <div className="flex flex-col gap-2">
        {filled.map((entry, index) => (
          <div key={index} className="rounded-xl bg-slate-50 px-3.5 py-2.5">
            <span className="od-label">Item {index + 1}</span>
            <div className="mt-1.5">
              {typeof entry === "object" ? (
                <SectionTree value={entry} depth={depth + 1} />
              ) : (
                <span className="text-[13px] text-ink">{String(entry)}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (typeof value === "object") {
    const entries = Object.entries(value).filter(([, entry]) => !isEmpty(entry));
    if (!entries.length) return <span className="text-[13px] text-ink-faint">Nothing recorded</span>;

    return (
      <div className={cn("flex flex-col", depth === 0 ? "gap-5" : "gap-2")}>
        {entries.map(([key, entry]) => {
          const nested = typeof entry === "object";
          return (
            <div key={key} className={cn(nested && depth > 0 && "border-l-2 border-slate-100 pl-3")}>
              {nested ? (
                <>
                  <h4
                    className={cn(
                      "mb-2 font-bold text-ink",
                      depth === 0 ? "text-[14px]" : "text-[13px] text-ink-muted"
                    )}
                  >
                    {humanise(key)}
                  </h4>
                  <SectionTree value={entry} depth={depth + 1} />
                </>
              ) : (
                <div className="flex items-start gap-3 rounded-lg px-2 py-1 transition hover:bg-brand-50/50">
                  <span className="w-1/3 shrink-0 text-[12.5px] font-semibold text-ink-muted">
                    {humanise(key)}
                  </span>
                  <span className="min-w-0 flex-1 break-words text-[13px] text-ink">
                    {typeof entry === "boolean" ? (entry ? "Yes" : "No") : String(entry)}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return <span className="text-[13px] text-ink">{String(value)}</span>;
}

export default function PatientHistoryPage() {
  const { record } = useOutletContext();

  const { data: sheets = [], loading } = useAsync(
    () => universityService.getCaseSheets(record.id),
    [record.id],
    []
  );

  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [order, setOrder] = useState("newest");
  const [opened, setOpened] = useState(null);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return [...sheets]
      .filter((sheet) => {
        /* Filter on the rotation, not the sheet's label: the label is what the
           student picked and varies, the department is what it belongs to. */
        if (type !== "all" && sheet.department !== type) return false;
        if (!needle) return true;
        return [sheet.type, sheet.diagnosis, sheet.treatmentPlan, sheet.notes]
          .filter(Boolean)
          .some((field) => String(field).toLowerCase().includes(needle));
      })
      .sort((a, b) => {
        const left = String(a.updatedAt ?? a.createdAt ?? "");
        const right = String(b.updatedAt ?? b.createdAt ?? "");
        return order === "newest" ? right.localeCompare(left) : left.localeCompare(right);
      });
  }, [sheets, query, type, order]);

  return (
    <div className="flex flex-col gap-4 p-4 sm:gap-5 sm:p-6">
      <PageHeader
        title="Sheet history"
        description={`Every examination sheet saved for ${record.patientName}.`}
        actions={
          sheets.length ? (
            <Badge tone="neutral">
              {visible.length} of {sheets.length} sheets
            </Badge>
          ) : null
        }
      />

      <Toolbar
        left={
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search by type, diagnosis or treatment plan…"
            className="w-full sm:w-[360px]"
          />
        }
        right={
          <>
            <MiniSelect value={type} onChange={(event) => setType(event.target.value)}>
              <option value="all">All rotations</option>
              {DEPARTMENTS.map((entry) => (
                <option key={entry.key} value={entry.key}>
                  {entry.label}
                </option>
              ))}
            </MiniSelect>
            <div className="inline-flex overflow-hidden rounded-xl border border-slate-200">
              {[
                { value: "newest", label: "Newest", icon: ArrowDownWideNarrow },
                { value: "oldest", label: "Oldest", icon: ArrowUpWideNarrow },
              ].map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setOrder(option.value)}
                    className={cn(
                      "od-focus inline-flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold transition",
                      order === option.value
                        ? "bg-brand-600 text-white"
                        : "bg-white text-ink-muted hover:bg-slate-50"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {option.label}
                  </button>
                );
              })}
            </div>
          </>
        }
      />

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-40 w-full" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-6 w-6" />}
          title={sheets.length ? "No sheets match your filters" : "No sheets saved yet"}
          description={
            sheets.length
              ? "Try clearing the search or widening the type filter."
              : "Fill an examination sheet from the Examination Sheet tab and it will appear here."
          }
          className="od-card py-16"
          action={
            sheets.length ? (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setQuery("");
                  setType("all");
                }}
              >
                Clear filters
              </Button>
            ) : null
          }
        />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((sheet) => (
            <Card
              as="li"
              key={sheet.id}
              className="cursor-pointer overflow-hidden transition hover:-translate-y-0.5 hover:shadow-pop"
              onClick={() => setOpened(sheet)}
            >
              <span className="od-gradient block h-1.5 w-full" />
              <CardBody className="flex flex-col gap-2.5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <span className="text-[15px] font-bold text-ink">{sheet.type}</span>
                  <Badge tone="brand">
                    {formatDate(sheet.updatedAt ?? sheet.createdAt, "d MMM yyyy")}
                  </Badge>
                </div>
                <p className="line-clamp-2 text-[13px] text-ink-muted">
                  {sheet.diagnosis || "No diagnosis recorded"}
                </p>
                <div className="mt-auto flex items-center justify-between pt-1">
                  <DepartmentChip department={sheet.department ?? record.department} short />
                  <span className="text-[12px] font-semibold text-brand-600">View details</span>
                </div>
              </CardBody>
            </Card>
          ))}
        </ul>
      )}

      {/* ------------------------------------------------------ one sheet */}
      <Modal
        open={Boolean(opened)}
        onClose={() => setOpened(null)}
        title={opened ? `${opened.type} sheet` : ""}
        description={
          opened
            ? `Created ${formatDate(opened.createdAt ?? opened.updatedAt, "d MMM yyyy")}${
                opened.createdAt ? ` at ${formatTime(opened.createdAt)}` : ""
              }`
            : undefined
        }
        size="xl"
        bodyClassName="max-h-[74vh] overflow-y-auto px-6 py-5"
        footer={
          <Button variant="secondary" onClick={() => setOpened(null)}>
            Close
          </Button>
        }
      >
        {opened ? (
          <div className="flex flex-col gap-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-brand-50/70 p-4">
                <span className="od-label">Diagnosis</span>
                <p className="mt-1.5 whitespace-pre-wrap text-[13px] text-ink">
                  {opened.diagnosis || "No diagnosis provided"}
                </p>
              </div>
              <div className="rounded-2xl bg-accent-50/70 p-4">
                <span className="od-label">Treatment plan</span>
                <p className="mt-1.5 whitespace-pre-wrap text-[13px] text-ink">
                  {opened.treatmentPlan || "No treatment plan provided"}
                </p>
              </div>
            </div>

            {opened.notes ? (
              <div className="rounded-2xl bg-slate-50 p-4">
                <span className="od-label">Notes</span>
                <p className="mt-1.5 whitespace-pre-wrap text-[13px] text-ink">{opened.notes}</p>
              </div>
            ) : null}

            <div className="border-t border-slate-100 pt-5">
              <SectionTree value={opened.sections ?? {}} />
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
