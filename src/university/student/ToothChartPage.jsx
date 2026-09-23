import { useEffect, useMemo, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Maximize2, Minimize2, Printer, Save } from "lucide-react";
import { cn } from "@/lib/cn";
import { useAsync } from "@/hooks";
import { universityService } from "@/services";
import { formatDate } from "@/lib/format";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { InfoBanner } from "@/components/ui/Misc";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { PageHeader } from "@/components/shared";
import { ALL_CONDITIONS, ALL_PROCEDURES, Swatch } from "@/university/components/toothArch";
import {
  ToothChart,
  buildChartDocument,
  readChartEntries,
  readChartPayload,
  toUniversityEntries,
} from "@/odontogram";

/**
 * The tooth chart.
 *
 * The chart itself is the shared odontogram (`src/odontogram`) — the same
 * surface the dentist, the supervisor and the chairside checkup use, so a
 * student learns one chart and reads it everywhere. What is specific to a
 * teaching clinic sits around it: nothing reaches the case record until the
 * student saves, and what was saved is listed underneath as the charted record
 * a supervisor will read back.
 *
 * The chart's own payload is what gets stored. The condition/procedure rows in
 * the table below are derived from it on save (`toUniversityEntries`), which is
 * what keeps the supervisor's dossier and the case tallies working off a chart
 * they never open.
 */

export default function ToothChartPage() {
  const { record } = useOutletContext();
  const toast = useToast();
  const caseId = record.id;

  const {
    data: stored,
    loading,
    setData,
  } = useAsync(() => universityService.getCaseChart(caseId), [caseId], null);

  const savedPayload = useMemo(() => readChartPayload(stored), [stored]);
  const savedEntries = useMemo(() => readChartEntries(stored), [stored]);

  /* The chart as it stands on screen. Held here rather than read out of the
     chart on save so the Save button can tell whether anything changed. */
  const [draft, setDraft] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const chartRef = useRef(null);

  /* A fresh load replaces whatever was on screen — switching cases must not
     carry the previous patient's chart across. */
  useEffect(() => {
    setDraft(null);
    setDirty(false);
  }, [caseId]);

  useEffect(() => {
    if (!expanded) return undefined;
    const onKey = (event) => event.key === "Escape" && setExpanded(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [expanded]);

  const commit = async () => {
    /* Flush anything still inside the change debounce so a quick edit-then-save
       cannot write a stale payload. */
    const payload = chartRef.current?.commit() ?? draft ?? savedPayload;
    if (!payload) return;

    setSaving(true);
    try {
      const entries = toUniversityEntries(payload, {
        by: record.studentName ?? "You",
      });
      const document = await universityService.saveCaseChart(
        caseId,
        buildChartDocument(payload, entries)
      );
      setData(document);
      setDraft(null);
      setDirty(false);
      toast.success("Chart saved", `${entries.length} charted tooth/teeth`);
    } catch (error) {
      toast.error("Could not save the chart", error?.message);
    } finally {
      setSaving(false);
    }
  };

  /* What the student has charted but not yet saved, in the same vocabulary the
     saved table below uses — so the two read as one list in two states. */
  const pendingEntries = useMemo(
    () => (dirty && draft ? toUniversityEntries(draft, { by: record.studentName ?? "You" }) : []),
    [dirty, draft, record.studentName]
  );

  const columns = (withProvenance) =>
    [
      { key: "tooth", header: "Tooth", sortable: true, width: 90 },
      {
        key: "condition",
        header: "Condition",
        render: (row) =>
          row.condition && row.condition !== "N/A" ? (
            <Swatch name={row.condition} list={ALL_CONDITIONS} />
          ) : (
            <span className="text-ink-faint">—</span>
          ),
      },
      {
        key: "procedure",
        header: "Procedure",
        render: (row) =>
          row.procedure && row.procedure !== "N/A" ? (
            <Swatch name={row.procedure} list={ALL_PROCEDURES} />
          ) : (
            <span className="text-ink-faint">—</span>
          ),
      },
      {
        key: "surfaces",
        header: "Surfaces",
        render: (row) =>
          row.surfaces?.length ? (
            <span className="flex flex-wrap gap-1">
              {row.surfaces.map((surface) => (
                <span
                  key={surface}
                  className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-ink-muted"
                >
                  {surface}
                </span>
              ))}
            </span>
          ) : (
            <span className="text-ink-faint">—</span>
          ),
      },
      {
        key: "note",
        header: "Notes",
        render: (row) =>
          row.note ? (
            <span className="block max-w-[220px] truncate text-[13px] text-ink-muted">
              {row.note}
            </span>
          ) : (
            <span className="text-ink-faint">—</span>
          ),
      },
      ...(withProvenance
        ? [
            { key: "by", header: "Charted by" },
            {
              key: "date",
              header: "Date",
              sortable: true,
              render: (row) => formatDate(row.date, "d MMM yyyy"),
            },
          ]
        : []),
    ];

  return (
    <div className="flex flex-col gap-4 p-4 sm:gap-5 sm:p-6">
      <PageHeader
        title="Tooth chart"
        description="Chart the mouth as you find it — per tooth, per surface, per root."
        className="od-print-hide"
        actions={
          <>
            <Button
              variant="secondary"
              leftIcon={
                expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />
              }
              onClick={() => setExpanded((value) => !value)}
            >
              {expanded ? "Exit full view" : "Full view"}
            </Button>
            {/* The browser's print dialog also saves a PDF, and prints the
                chart as drawn rather than a second rendering of it. */}
            <Button
              variant="secondary"
              leftIcon={<Printer className="h-4 w-4" />}
              onClick={() => window.print()}
            >
              Print / save as PDF
            </Button>
            <Button
              leftIcon={<Save className="h-4 w-4" />}
              loading={saving}
              disabled={!dirty}
              onClick={commit}
            >
              Save chart
            </Button>
          </>
        }
      />

      {dirty ? (
        <InfoBanner tone="warning">
          The chart has unsaved changes. Nothing reaches the case record until you save it.
        </InfoBanner>
      ) : null}

      {/* Full view is a class on the container rather than a second chart: the
          odontogram engine is a singleton, so remounting it into an overlay
          would tear down the live chart and lose the unsaved edits. */}
      <div
        className={cn(
          expanded &&
            "fixed inset-0 z-50 overflow-auto bg-canvas p-5 od-print-hide"
        )}
      >
        {loading ? (
          <Skeleton className="h-[520px] w-full rounded-2xl" />
        ) : (
          <ToothChart
            key={caseId}
            ref={chartRef}
            value={savedPayload}
            onChange={(payload) => {
              setDraft(payload);
              setDirty(true);
            }}
            enableNotes
            enableIcdas
            panelMaxHeight={expanded ? "calc(100vh - 140px)" : undefined}
          />
        )}
      </div>

      {pendingEntries.length ? (
        <Card>
          <CardHeader
            title="Unsaved changes"
            subtitle={`${pendingEntries.length} tooth/teeth charted in this session`}
          />
          <CardBody className="pt-2">
            <DataTable
              columns={columns(false)}
              rows={pendingEntries}
              rowKey={(row) => row.tooth}
              dense
              className="border-0 shadow-none"
            />
          </CardBody>
        </Card>
      ) : null}

      <Card>
        <CardHeader title="Charted record" subtitle={`${savedEntries.length} entries on file`} />
        <CardBody className="pt-2">
          <DataTable
            columns={columns(true)}
            rows={savedEntries}
            rowKey={(row) => `${row.tooth}-${row.date}`}
            dense
            loading={loading}
            className="border-0 shadow-none"
            emptyTitle="No charted history"
            emptyDescription="Saved chart entries appear here."
          />
        </CardBody>
      </Card>
    </div>
  );
}
